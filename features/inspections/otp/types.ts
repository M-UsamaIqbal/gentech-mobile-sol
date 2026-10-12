import type { OtpChannel } from "@/lib/constants";

/** A fully-composed message to deliver. Code generation/expiry is owned by the service. */
export interface OtpSendInput {
  /** Destination number in E.164 (e.g. +923001234567). */
  to: string;
  /** Plaintext code (passed so dev providers can echo it for testing). */
  code: string;
  /** Ready-to-send message body, including the code and branding. */
  body: string;
  channel: OtpChannel;
}

export interface OtpSendResult {
  ok: boolean;
  /** Dev/no-op providers echo the code so the UI/log can surface it while testing. */
  devCode?: string;
  error?: string;
}

/**
 * A one-time-code delivery channel behind a stable interface. Swap the dev
 * provider for Twilio (or any gateway) without touching the service or UI —
 * mirrors the payments provider pattern in `features/inspections/payments`.
 */
export interface OtpProvider {
  readonly id: string;
  /** True when real credentials are present; false → dev/log provider. */
  isConfigured(): boolean;
  send(input: OtpSendInput): Promise<OtpSendResult>;
}
