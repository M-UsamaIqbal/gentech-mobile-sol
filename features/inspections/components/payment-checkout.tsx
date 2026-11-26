"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Lock, Smartphone } from "lucide-react";
import { toast } from "sonner";

import {
  INSPECTION_PAYMENT_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  ROUTES,
  type InspectionPaymentStatus,
  type PaymentMethod,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  beginPayFastInspectionPaymentAction,
  checkPayFastInspectionPaymentAction,
  completePayFastInspectionPaymentAction,
  confirmInspectionPaymentAction,
} from "@/features/inspections/actions/payment.actions";
import type {
  PayFastChallenge,
  PayFastPaymentDetails,
  PaymentVerificationStatus,
} from "@/features/inspections/payments/types";

const METHODS: Array<{ id: PaymentMethod; icon: typeof Smartphone }> = [
  { id: PAYMENT_METHODS.JAZZCASH, icon: Smartphone },
  { id: PAYMENT_METHODS.EASYPAISA, icon: Smartphone },
  { id: PAYMENT_METHODS.CARD, icon: CreditCard },
];

interface Props {
  requestId: string;
  amount: number;
  currency: string;
  initialMethod?: PaymentMethod;
  paymentMode: "payfast" | "sandbox" | "unavailable";
  initialPaymentStatus: InspectionPaymentStatus;
  configuredMethods: PaymentMethod[];
}

export function PaymentCheckout({
  requestId,
  amount,
  currency,
  initialMethod,
  paymentMode,
  initialPaymentStatus,
  configuredMethods,
}: Props) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [method, setMethod] = React.useState<PaymentMethod>(
    initialMethod ?? configuredMethods[0] ?? PAYMENT_METHODS.JAZZCASH,
  );
  const [pending, setPending] = React.useState(false);
  const [paymentStatus, setPaymentStatus] =
    React.useState<InspectionPaymentStatus>(initialPaymentStatus);
  const [challenge, setChallenge] = React.useState<PayFastChallenge | null>(null);
  const [otp, setOtp] = React.useState("");

  const showResult = React.useCallback(
    (status: PaymentVerificationStatus) => {
      setPending(false);
      if (status === "PAID") {
        setPaymentStatus(INSPECTION_PAYMENT_STATUSES.PAID);
        setChallenge(null);
        setOtp("");
        toast.success("Payment successful. Your inspection is confirmed.");
        router.push(ROUTES.inspections);
        router.refresh();
      } else if (status === "FAILED") {
        setPaymentStatus(INSPECTION_PAYMENT_STATUSES.FAILED);
        setChallenge(null);
        setOtp("");
        toast.error("Payment was declined. You can try another attempt.");
      } else {
        setPaymentStatus(INSPECTION_PAYMENT_STATUSES.PROCESSING);
        toast.info("Payment is still processing. Check its status before retrying.");
      }
    },
    [router],
  );

  const completeChallenge = React.useCallback(
    async (paRes?: string) => {
      if (!challenge || pending) return;
      setPending(true);
      const result = await completePayFastInspectionPaymentAction({
        requestId,
        continuation: challenge.continuation,
        ...(otp ? { otp } : {}),
        ...(paRes ? { paRes } : {}),
      });
      if (!result.ok) {
        setPending(false);
        toast.error(result.error);
        return;
      }
      showResult(result.status);
    },
    [challenge, otp, pending, requestId, showResult],
  );

  React.useEffect(() => {
    if (!challenge?.threeDsHtml || !challenge.threeDsNonce) return;
    const expectedNonce = challenge.threeDsNonce;

    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data: unknown = event.data;
      if (
        !data ||
        typeof data !== "object" ||
        !("type" in data) ||
        !("nonce" in data) ||
        !("paRes" in data) ||
        data.type !== "payfast-3ds-result" ||
        data.nonce !== expectedNonce ||
        typeof data.paRes !== "string" ||
        data.paRes.length > 12_000
      ) {
        return;
      }
      void completeChallenge(data.paRes);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [challenge, completeChallenge]);

  async function beginPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current || pending) return;
    const formData = new FormData(formRef.current);
    const common = {
      method,
      mobileNumber: String(formData.get("mobileNumber") ?? ""),
    };
    const details: PayFastPaymentDetails =
      method === PAYMENT_METHODS.CARD
        ? {
            ...common,
            method: PAYMENT_METHODS.CARD,
            cardNumber: String(formData.get("cardNumber") ?? ""),
            expiryMonth: String(formData.get("expiryMonth") ?? ""),
            expiryYear: String(formData.get("expiryYear") ?? ""),
            cvv: String(formData.get("cvv") ?? ""),
          }
        : {
            ...common,
            method,
            accountNumber: String(formData.get("accountNumber") ?? ""),
            cnicNumber: String(formData.get("cnicNumber") ?? ""),
            accountTitle: String(formData.get("accountTitle") ?? ""),
          };

    setPending(true);
    const result = await beginPayFastInspectionPaymentAction({ requestId, details });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    formRef.current.reset();
    setPaymentStatus(INSPECTION_PAYMENT_STATUSES.AWAITING_CUSTOMER);
    setChallenge(result.challenge);
    if (!result.challenge.otpRequired && !result.challenge.threeDsHtml) {
      setPending(true);
      const completed = await completePayFastInspectionPaymentAction({
        requestId,
        continuation: result.challenge.continuation,
      });
      if (!completed.ok) {
        setPending(false);
        toast.error(completed.error);
      } else {
        showResult(completed.status);
      }
    }
  }

  async function checkStatus() {
    if (pending) return;
    setPending(true);
    const result = await checkPayFastInspectionPaymentAction({ requestId });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    showResult(result.status);
  }

  async function simulateSandbox(outcome: "PAID" | "FAILED") {
    if (pending) return;
    setPending(true);
    const result = await confirmInspectionPaymentAction({ requestId, method, outcome });
    setPending(false);
    if (result.ok) {
      toast.success("Sandbox payment completed. No charge was made.");
      router.push(ROUTES.inspections);
      router.refresh();
    } else {
      toast.error(result.error ?? "Sandbox payment failed.");
      if (outcome === "FAILED") {
        setPaymentStatus(INSPECTION_PAYMENT_STATUSES.FAILED);
      }
    }
  }

  const availableMethods = METHODS.filter(({ id }) => configuredMethods.includes(id));
  const isWallet = method !== PAYMENT_METHODS.CARD;
  const canRetry =
    paymentStatus === INSPECTION_PAYMENT_STATUSES.UNPAID ||
    paymentStatus === INSPECTION_PAYMENT_STATUSES.FAILED ||
    paymentStatus === INSPECTION_PAYMENT_STATUSES.AWAITING_CUSTOMER;
  const isProcessing =
    paymentStatus === INSPECTION_PAYMENT_STATUSES.PENDING ||
    paymentStatus === INSPECTION_PAYMENT_STATUSES.PROCESSING;

  return (
    <div className="bg-card mx-auto max-w-md rounded-2xl border p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Amount due</span>
        <span className="text-2xl font-bold">{formatPrice(amount, { currency })}</span>
      </div>

      {paymentMode === "unavailable" ? (
        <div className="text-muted-foreground mt-5 rounded-xl border border-dashed p-4 text-sm">
          Online payments are not configured in this environment. No payment has been made.
        </div>
      ) : paymentMode === "sandbox" ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-dashed p-4">
            <p className="text-sm font-medium">Sandbox mode</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Simulations never contact a payment provider or charge a customer.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-colors",
                  method === id
                    ? "border-primary ring-primary/30 ring-2"
                    : "hover:border-primary/40",
                )}
              >
                <Icon className="size-5" />
                {PAYMENT_METHOD_LABELS[id]}
              </button>
            ))}
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={pending}
            onClick={() => void simulateSandbox("PAID")}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
            Simulate successful payment
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={() => void simulateSandbox("FAILED")}
          >
            Simulate failed payment
          </Button>
        </div>
      ) : isProcessing ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border p-4">
            <p className="font-medium">Payment is processing</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Check the provider status. Do not retry while this attempt is unresolved.
            </p>
          </div>
          <Button type="button" className="w-full" disabled={pending} onClick={() => void checkStatus()}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Check payment status
          </Button>
        </div>
      ) : challenge ? (
        <div className="mt-5 space-y-4">
          {challenge.threeDsHtml ? (
            <iframe
              ref={iframeRef}
              title="PayFast card verification"
              srcDoc={challenge.threeDsHtml}
              sandbox="allow-forms allow-scripts"
              referrerPolicy="no-referrer"
              className="h-[28rem] w-full rounded-xl border bg-white"
            />
          ) : null}
          {challenge.otpRequired ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void completeChallenge();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="payfast-otp">One-time password</Label>
                <Input
                  id="payfast-otp"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                Verify payment
              </Button>
            </form>
          ) : null}
        </div>
      ) : (
        <>
          {availableMethods.length === 0 ? (
            <div className="text-muted-foreground mt-5 rounded-xl border border-dashed p-4 text-sm">
              No PayFast payment method is configured. No payment has been made.
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {availableMethods.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMethod(id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-colors",
                      method === id
                        ? "border-primary ring-primary/30 ring-2"
                        : "hover:border-primary/40",
                    )}
                  >
                    <Icon className="size-5" />
                    {PAYMENT_METHOD_LABELS[id]}
                  </button>
                ))}
              </div>
              <form
                ref={formRef}
                autoComplete="off"
                className="mt-5 space-y-4"
                onSubmit={(event) => void beginPayment(event)}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="payfast-mobile">Mobile number</Label>
                  <Input
                    id="payfast-mobile"
                    name="mobileNumber"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder="03xx-xxxxxxx"
                    required
                    maxLength={20}
                  />
                </div>
                {isWallet ? (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="payfast-account">Account number</Label>
                      <Input
                        id="payfast-account"
                        name="accountNumber"
                        inputMode="numeric"
                        autoComplete="off"
                        required
                        maxLength={30}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="payfast-cnic">CNIC number</Label>
                      <Input
                        id="payfast-cnic"
                        name="cnicNumber"
                        inputMode="numeric"
                        autoComplete="off"
                        required
                        maxLength={17}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="payfast-account-title">Account title (optional)</Label>
                      <Input
                        id="payfast-account-title"
                        name="accountTitle"
                        autoComplete="off"
                        maxLength={100}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="payfast-card">Card number</Label>
                      <Input
                        id="payfast-card"
                        name="cardNumber"
                        inputMode="numeric"
                        autoComplete="off"
                        required
                        maxLength={23}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="payfast-expiry-month">Month</Label>
                        <Input
                          id="payfast-expiry-month"
                          name="expiryMonth"
                          inputMode="numeric"
                          placeholder="MM"
                          autoComplete="off"
                          required
                          maxLength={2}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="payfast-expiry-year">Year</Label>
                        <Input
                          id="payfast-expiry-year"
                          name="expiryYear"
                          inputMode="numeric"
                          placeholder="YY"
                          autoComplete="off"
                          required
                          maxLength={4}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="payfast-cvv">CVV</Label>
                        <Input
                          id="payfast-cvv"
                          name="cvv"
                          type="password"
                          inputMode="numeric"
                          autoComplete="off"
                          required
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={pending || !canRetry || !configuredMethods.includes(method)}
                >
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                  {pending ? "Starting secure payment…" : `Pay ${formatPrice(amount, { currency })}`}
                </Button>
              </form>
              <p className="text-muted-foreground mt-4 text-center text-xs">
                Payment details are sent to PayFast over an encrypted connection and are not
                stored by GenTech.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
