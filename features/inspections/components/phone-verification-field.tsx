"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { OTP } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  sendBookingOtpAction,
  verifyBookingOtpAction,
} from "@/features/inspections/actions/otp.actions";

interface Props {
  /** Current phone value (owned by the parent form). */
  phone: string;
  onPhoneChange: (value: string) => void;
  /** Whether the current number is verified (owned by the parent form). */
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  id?: string;
  name?: string;
  label?: string;
}

/**
 * Phone (WhatsApp/SMS) field with an inline OTP step. The buyer sends a code to
 * the number, enters it, and verifies — gating booking on a confirmed number.
 * Phone value + verified flag are owned by the parent so it can gate submit.
 */
export function PhoneVerificationField({
  phone,
  onPhoneChange,
  verified,
  onVerifiedChange,
  id = "contactPhone",
  name = "contactPhone",
  label = "Phone / WhatsApp number",
}: Props) {
  const [otpCode, setOtpCode] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);

  function handlePhoneChange(value: string) {
    onPhoneChange(value);
    // Editing the number invalidates any prior verification / pending code.
    if (verified) onVerifiedChange(false);
    if (otpSent) {
      setOtpSent(false);
      setOtpCode("");
    }
  }

  async function handleSendOtp() {
    if (!phone.trim()) {
      toast.error("Enter your phone number first.");
      return;
    }
    setSending(true);
    try {
      const result = await sendBookingOtpAction({ phone });
      if (result.ok) {
        setOtpSent(true);
        toast.success(
          result.channel === "whatsapp" ? "Code sent on WhatsApp." : "Code sent via SMS.",
        );
        if (result.devCode) {
          toast.message(`Test code: ${result.devCode}`, {
            description: "Twilio isn't configured — showing the code so you can test.",
          });
        }
      } else {
        toast.error(result.error ?? "Could not send the code.");
      }
    } catch (error) {
      console.error("[otp] send request failed:", error);
      toast.error("Could not send the code. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyOtp() {
    setVerifying(true);
    try {
      const result = await verifyBookingOtpAction({ phone, code: otpCode });
      if (result.ok) {
        onVerifiedChange(true);
        toast.success("Phone number verified!");
      } else {
        toast.error(result.error ?? "Verification failed.");
      }
    } catch (error) {
      console.error("[otp] verify request failed:", error);
      toast.error("Could not verify the code. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          name={name}
          required
          inputMode="tel"
          placeholder="03xx-xxxxxxx"
          maxLength={20}
          value={phone}
          onChange={(event) => handlePhoneChange(event.target.value)}
          readOnly={verified}
        />
        {verified ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-4" />
            Verified
          </span>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={handleSendOtp}
            disabled={sending || !phone.trim()}
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : null}
            {otpSent ? "Resend code" : "Send code"}
          </Button>
        )}
      </div>
      {otpSent && !verified ? (
        <div className="flex gap-2 pt-1">
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={`Enter ${OTP.length}-digit code`}
            maxLength={OTP.length}
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))}
          />
          <Button
            type="button"
            className="shrink-0"
            onClick={handleVerifyOtp}
            disabled={verifying || otpCode.length < 4}
          >
            {verifying ? <Loader2 className="size-4 animate-spin" /> : null}
            Verify
          </Button>
        </div>
      ) : null}
      <p className="text-muted-foreground text-xs">
        We&apos;ll send a one-time code to confirm this number before booking.
      </p>
    </div>
  );
}
