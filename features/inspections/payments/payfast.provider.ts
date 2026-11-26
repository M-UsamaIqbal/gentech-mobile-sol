import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { z } from "zod";

import { env } from "@/lib/env";
import type {
  CheckoutSession,
  PayFastChallenge,
  PayFastPaymentDetails,
  PaymentProvider,
  PaymentVerificationStatus,
  VerifiedPayment,
} from "@/features/inspections/payments/types";

const CONTINUATION_TTL_MS = 5 * 60 * 1000;
const MAX_RESPONSE_BYTES = 256_000;

const continuationSchema = z.object({
  version: z.literal(1),
  userId: z.string().min(1),
  requestId: z.string().min(1),
  basketId: z.string().min(1),
  transactionId: z.string().min(1),
  instrumentToken: z.string().min(1),
  method: z.enum(["card", "jazzcash", "easypaisa"]),
  amount: z.string().regex(/^\d+\.\d{2}$/),
  currency: z.literal("PKR"),
  mobileNumber: z.string().min(1),
  orderDate: z.string().length(19),
  eci: z.string().optional(),
  secureId: z.string().optional(),
  nonce: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

type PayFastContinuation = z.infer<typeof continuationSchema>;

const apiResponseSchema = z.record(z.string(), z.unknown());

export class PayFastError extends Error {
  constructor(
    readonly code:
      | "NOT_CONFIGURED"
      | "INVALID_CONFIGURATION"
      | "REQUEST_FAILED"
      | "INVALID_RESPONSE"
      | "INVALID_STATE"
      | "REFERENCE_MISMATCH",
  ) {
    super(code);
    this.name = "PayFastError";
  }
}

function isPayFastEnabled(): boolean {
  return Boolean(
    env.PAYFAST_MODE !== "disabled" &&
      env.PAYFAST_MERCHANT_ID &&
      env.PAYFAST_SECURED_KEY &&
      env.PAYFAST_API_BASE &&
      env.PAYFAST_MERCHANT_CATEGORY_CODE &&
      (env.PAYFAST_MODE !== "live" || env.PAYFAST_LIVE_ENABLED === "true"),
  );
}

function getApiBase(): string {
  if (!env.PAYFAST_API_BASE) throw new PayFastError("NOT_CONFIGURED");
  let url: URL;
  try {
    url = new URL(env.PAYFAST_API_BASE);
  } catch {
    throw new PayFastError("INVALID_CONFIGURATION");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new PayFastError("INVALID_CONFIGURATION");
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

function getAccountConfiguration(method: PayFastPaymentDetails["method"]): {
  accountType: string;
  bankCode?: string;
} {
  if (method === "card") {
    if (!env.PAYFAST_CARD_ACCOUNT_TYPE) {
      throw new PayFastError("INVALID_CONFIGURATION");
    }
    return { accountType: env.PAYFAST_CARD_ACCOUNT_TYPE };
  }

  const bankCode =
    method === "jazzcash"
      ? env.PAYFAST_JAZZCASH_BANK_CODE
      : env.PAYFAST_EASYPAISA_BANK_CODE;
  const accountType =
    method === "jazzcash"
      ? env.PAYFAST_JAZZCASH_ACCOUNT_TYPE
      : env.PAYFAST_EASYPAISA_ACCOUNT_TYPE;

  if (!bankCode || !accountType) {
    throw new PayFastError("INVALID_CONFIGURATION");
  }
  return { bankCode, accountType };
}

function providerFields(
  details: PayFastPaymentDetails,
  account: ReturnType<typeof getAccountConfiguration>,
): Record<string, string> {
  const fields: Record<string, string> = {
    account_type: account.accountType,
  };
  if (account.bankCode) fields.bank_code = account.bankCode;

  if (details.method === "card") {
    fields.card_number = details.cardNumber.replace(/\D/g, "");
    fields.expiry_month = details.expiryMonth;
    fields.expiry_year = details.expiryYear;
    fields.cvv = details.cvv;
    fields.data_3ds_pagemode = "SIMPLE";
  } else {
    fields.account_number = details.accountNumber.replace(/\D/g, "");
    fields.cnic_number = details.cnicNumber.replace(/\D/g, "");
    if (details.accountTitle) fields.account_title = details.accountTitle;
  }
  return fields;
}

function decimalAmount(amount: string): string {
  if (!/^\d+\.\d{2}$/.test(amount)) {
    throw new PayFastError("INVALID_CONFIGURATION");
  }
  const [whole, fraction] = amount.split(".");
  if (!whole || !fraction || BigInt(whole) * 100n + BigInt(fraction) <= 0n) {
    throw new PayFastError("INVALID_CONFIGURATION");
  }
  return amount;
}

function normalizeMobileNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (/^03\d{9}$/.test(digits)) return `92-${digits.slice(1)}`;
  if (/^3\d{9}$/.test(digits)) return `92-${digits}`;
  if (/^923\d{9}$/.test(digits)) return `92-${digits.slice(2)}`;
  throw new PayFastError("INVALID_STATE");
}

function orderDate(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

async function requestJson(
  path: string,
  options: {
    method: "GET" | "POST";
    body?: URLSearchParams;
    token?: string;
  },
): Promise<Record<string, unknown>> {
  const base = getApiBase();
  const headers = new Headers({ "content-type": "application/x-www-form-urlencoded" });
  if (options.token) headers.set("authorization", `Bearer ${options.token}`);

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: options.method,
      headers,
      body: options.body,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new PayFastError("REQUEST_FAILED");
  }
  if (!response.ok) throw new PayFastError("REQUEST_FAILED");

  let text: string;
  try {
    text = await response.text();
  } catch {
    throw new PayFastError("INVALID_RESPONSE");
  }
  if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) {
    throw new PayFastError("INVALID_RESPONSE");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new PayFastError("INVALID_RESPONSE");
  }
  const result = apiResponseSchema.safeParse(parsed);
  if (!result.success) throw new PayFastError("INVALID_RESPONSE");
  return result.data;
}

async function getAccessToken(customerIp: string): Promise<string> {
  if (!isPayFastEnabled() || !env.PAYFAST_MERCHANT_ID || !env.PAYFAST_SECURED_KEY) {
    throw new PayFastError("NOT_CONFIGURED");
  }

  const body = new URLSearchParams({
    merchant_id: env.PAYFAST_MERCHANT_ID,
    grant_type: "client_credentials",
    secured_key: env.PAYFAST_SECURED_KEY,
    customer_ip: customerIp,
  });
  const response = await requestJson("/token", { method: "POST", body });
  if (typeof response.token !== "string" || !response.token) {
    throw new PayFastError("INVALID_RESPONSE");
  }
  return response.token;
}

function continuationKey(): Buffer {
  if (!env.BETTER_AUTH_SECRET) throw new PayFastError("INVALID_CONFIGURATION");
  return createHash("sha256").update(env.BETTER_AUTH_SECRET).digest();
}

function sealContinuation(value: PayFastContinuation): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", continuationKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function openContinuation(value: string): PayFastContinuation {
  const [ivValue, tagValue, encryptedValue, ...extra] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue || extra.length > 0) {
    throw new PayFastError("INVALID_STATE");
  }
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      continuationKey(),
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    const parsed: unknown = JSON.parse(plaintext);
    const result = continuationSchema.safeParse(parsed);
    if (!result.success || result.data.expiresAt <= Date.now()) {
      throw new PayFastError("INVALID_STATE");
    }
    return result.data;
  } catch (error) {
    if (error instanceof PayFastError) throw error;
    throw new PayFastError("INVALID_STATE");
  }
}

function getStatusCode(response: Record<string, unknown>): string {
  const value =
    typeof response.status_code === "string" && response.status_code
      ? response.status_code
      : response.code;
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function mapStatus(code: string): PaymentVerificationStatus {
  if (code === "00" || code === "79") return "PAID";
  if (!code || code === "001" || code === "002") return "PENDING";
  return "FAILED";
}

async function getStatusResponse(
  transactionId: string,
  customerIp: string,
): Promise<Record<string, unknown>> {
  const token = await getAccessToken(customerIp);
  return requestJson(`/transaction/${encodeURIComponent(transactionId)}`, {
    method: "GET",
    token,
  });
}

export async function beginPayFastPayment(input: {
  userId: string;
  requestId: string;
  basketId: string;
  amount: string;
  currency: string;
  customerIp: string;
  details: PayFastPaymentDetails;
  callbackUrl: string;
}): Promise<PayFastChallenge> {
  if (!isPayFastEnabled()) throw new PayFastError("NOT_CONFIGURED");
  if (input.currency !== "PKR" || !env.PAYFAST_MERCHANT_CATEGORY_CODE) {
    throw new PayFastError("INVALID_CONFIGURATION");
  }
  const amount = decimalAmount(input.amount);

  const token = await getAccessToken(input.customerIp);
  const account = getAccountConfiguration(input.details.method);
  const transactionOrderDate = orderDate();
  const body = new URLSearchParams({
    merchant_user_id: input.userId,
    user_mobile_number: normalizeMobileNumber(input.details.mobileNumber),
    basket_id: input.basketId,
    txnamt: amount,
    order_date: transactionOrderDate,
    customer_ip: input.customerIp,
    merCatCode: env.PAYFAST_MERCHANT_CATEGORY_CODE,
    ...providerFields(input.details, account),
  });
  if (input.details.method === "card") {
    body.set("data_3ds_callback_url", input.callbackUrl);
  }
  const response = await requestJson("/transaction/token", {
    method: "POST",
    body,
    token,
  });

  const transactionId =
    typeof response.transaction_id === "string" ? response.transaction_id : "";
  const instrumentToken =
    typeof response.instrument_token === "string" ? response.instrument_token : "";
  if (!transactionId || !instrumentToken) {
    throw new PayFastError("REQUEST_FAILED");
  }

  const nonce = new URL(input.callbackUrl).searchParams.get("nonce");
  if (!nonce) throw new PayFastError("INVALID_CONFIGURATION");

  if (
    typeof response.data_3ds_html === "string" &&
    response.data_3ds_html.length > 100_000
  ) {
    throw new PayFastError("INVALID_RESPONSE");
  }
  const continuation = continuationSchema.parse({
    version: 1,
    userId: input.userId,
    requestId: input.requestId,
    basketId: input.basketId,
    transactionId,
    instrumentToken,
    method: input.details.method,
    amount,
    currency: input.currency,
    mobileNumber: normalizeMobileNumber(input.details.mobileNumber),
    orderDate: transactionOrderDate,
    ...(typeof response.eci === "string" ||
    typeof response.eci === "number" ||
    typeof response.eci === "boolean"
      ? { eci: String(response.eci) }
      : {}),
    ...(typeof response.data_3ds_secureid === "string"
      ? { secureId: response.data_3ds_secureid }
      : {}),
    nonce,
    expiresAt: Date.now() + CONTINUATION_TTL_MS,
  });

  return {
    continuation: sealContinuation(continuation),
    transactionId,
    otpRequired:
      response.otp_required === true ||
      response.otp_required === 1 ||
      response.otp_required === "true" ||
      response.otp_required === "1",
    ...(typeof response.data_3ds_html === "string"
      ? { threeDsHtml: response.data_3ds_html }
      : {}),
    ...(typeof response.data_3ds_html === "string" ? { threeDsNonce: nonce } : {}),
  };
}

export async function completePayFastPayment(input: {
  continuation: string;
  userId: string;
  requestId: string;
  expectedTransactionId: string;
  expectedAmount: string;
  expectedCurrency: string;
  customerIp: string;
  otp?: string;
  paRes?: string;
}): Promise<{
  transactionId: string;
  basketId: string;
  status: PaymentVerificationStatus;
}> {
  const continuation = openContinuation(input.continuation);
  if (
    continuation.userId !== input.userId ||
    continuation.requestId !== input.requestId ||
    continuation.transactionId !== input.expectedTransactionId ||
    continuation.basketId !== input.requestId ||
    continuation.amount !== decimalAmount(input.expectedAmount) ||
    continuation.currency !== input.expectedCurrency ||
    input.expectedCurrency !== "PKR"
  ) {
    throw new PayFastError("INVALID_STATE");
  }

  const token = await getAccessToken(input.customerIp);
  const body = new URLSearchParams({
    instrument_token: continuation.instrumentToken,
    transaction_id: continuation.transactionId,
    merchant_user_id: continuation.userId,
    user_mobile_number: continuation.mobileNumber,
    basket_id: continuation.basketId,
    order_date: continuation.orderDate,
    txndesc: `Inspection payment ${continuation.requestId}`,
    txnamt: continuation.amount,
    customer_ip: input.customerIp,
    merCatCode: env.PAYFAST_MERCHANT_CATEGORY_CODE ?? "",
    ...(continuation.eci ? { eci: continuation.eci } : {}),
    ...(continuation.secureId ? { data_3ds_secureid: continuation.secureId } : {}),
    ...(input.paRes ? { data_3ds_pares: input.paRes } : {}),
    ...(input.otp ? { otp: input.otp } : {}),
  });
  const transaction = await requestJson("/transaction/tokenized", {
    method: "POST",
    body,
    token,
  });

  if (
    (typeof transaction.basket_id === "string" &&
      transaction.basket_id !== continuation.basketId) ||
    (typeof transaction.transaction_id === "string" &&
      transaction.transaction_id !== continuation.transactionId)
  ) {
    throw new PayFastError("REFERENCE_MISMATCH");
  }

  const status = await getPayFastPaymentStatus({
    transactionId: continuation.transactionId,
    basketId: continuation.basketId,
    customerIp: input.customerIp,
  });
  return status;
}

export function assertPayFastContinuation(input: {
  continuation: string;
  userId: string;
  requestId: string;
  expectedTransactionId: string;
  expectedAmount: string;
  expectedCurrency: string;
}): void {
  const continuation = openContinuation(input.continuation);
  if (
    continuation.userId !== input.userId ||
    continuation.requestId !== input.requestId ||
    continuation.transactionId !== input.expectedTransactionId ||
    continuation.basketId !== input.requestId ||
    continuation.amount !== decimalAmount(input.expectedAmount) ||
    continuation.currency !== input.expectedCurrency ||
    input.expectedCurrency !== "PKR"
  ) {
    throw new PayFastError("INVALID_STATE");
  }
}

export async function getPayFastPaymentStatus(input: {
  transactionId: string;
  basketId: string;
  customerIp: string;
}): Promise<{
  transactionId: string;
  basketId: string;
  status: PaymentVerificationStatus;
}> {
  if (!isPayFastEnabled()) throw new PayFastError("NOT_CONFIGURED");
  const response = await getStatusResponse(input.transactionId, input.customerIp);
  const responseTransactionId =
    typeof response.transaction_id === "string" ? response.transaction_id : "";
  const responseBasketId = typeof response.basket_id === "string" ? response.basket_id : "";
  if (
    responseTransactionId !== input.transactionId ||
    responseBasketId !== input.basketId
  ) {
    throw new PayFastError("REFERENCE_MISMATCH");
  }
  return {
    transactionId: responseTransactionId,
    basketId: responseBasketId,
    status: mapStatus(getStatusCode(response)),
  };
}

export const payfastProvider: PaymentProvider = {
  id: "payfast",

  isConfigured: isPayFastEnabled,

  async createCheckout(): Promise<CheckoutSession> {
    throw new PayFastError("INVALID_CONFIGURATION");
  },

  async verify(): Promise<VerifiedPayment> {
    throw new PayFastError("INVALID_CONFIGURATION");
  },
};

export function getPayFastConfiguredMethod(method: PayFastPaymentDetails["method"]): boolean {
  if (!isPayFastEnabled()) return false;
  try {
    getAccountConfiguration(method);
    return true;
  } catch {
    return false;
  }
}

export function openPayFast3dsCallbackHtml(
  nonce: string,
  paRes: string,
): string {
  const message = JSON.stringify({ type: "payfast-3ds-result", nonce, paRes }).replace(
    /</g,
    "\\u003c",
  );
  return `<!doctype html><meta charset="utf-8"><title>Payment verification</title><script>window.parent.postMessage(${message},"*");</script><p>Payment verification complete. Return to the payment window.</p>`;
}
