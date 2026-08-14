import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function OtpStep({ email, onVerified, onBack }) {
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      await onVerified();
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}
      <p className="text-center text-sm text-muted-foreground mb-6">
        We sent a 6-digit verification code to<br />
        <span className="text-foreground font-medium">{email}</span>
      </p>
      <div className="flex justify-center mb-6">
        <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>
        ) : (
          "Verify & Continue"
        )}
      </Button>
      <div className="flex items-center justify-between mt-4">
        {onBack ? (
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft size={14} /> Back
          </button>
        ) : <span />}
        <button onClick={handleResend} className="text-sm text-primary font-medium hover:underline ml-auto">
          Resend code
        </button>
      </div>
    </div>
  );
}
