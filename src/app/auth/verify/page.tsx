"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/layouts/AuthLayout";
import { WorldMapShowcase } from "@/components/auth/WordMapShowcase";
import OTPInput from "@/components/auth/OTPInput";
import Button from "@/components/Button";
import Alert from "@/components/Alert";
import { HelpModal } from "@/components/auth/HelpModal";
import { useAuthContext } from "@/context/AuthContext";

const RESEND_INTERVAL = 60;
const MAX_RESENDS = 3;

const maskEmail = (email: string) => {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0] ?? ""}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
};

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthContext();

  const userId = searchParams.get("userId") || user?.id || "";
  const email = searchParams.get("email") || user?.email || "";
  const name = searchParams.get("name") || user?.name || undefined;

  const [timeLeft, setTimeLeft] = useState(RESEND_INTERVAL);
  const [isCountingDown, setIsCountingDown] = useState(true);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const missingVerificationContext = !userId || !email;
  const isOtpComplete = /^\d{6}$/.test(otp);
  const canResend =
    !isCountingDown && resendAttempts < MAX_RESENDS && !missingVerificationContext;

  useEffect(() => {
    if (!isCountingDown) return;
    if (timeLeft <= 0) {
      setIsCountingDown(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isCountingDown, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsResending(true);
    setNotification(null);
    setOtpError("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, email, name }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage =
          data?.error || data?.message || "Unable to resend code right now.";
        setOtpError(errorMessage);
        return;
      }

      const nextAttempts =
        data.remainingResends !== undefined
          ? MAX_RESENDS - data.remainingResends
          : resendAttempts + 1;

      setResendAttempts(Math.min(MAX_RESENDS, nextAttempts));
      setNotification({
        type: "success",
        message: data.message || "A new verification code was sent.",
      });
      setTimeLeft(RESEND_INTERVAL);
      setIsCountingDown(true);
    } catch (error) {
      setOtpError("Couldn't resend the code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;

    setNotification(null);
    setOtpError("");

    if (!/^\d{6}$/.test(code)) {
      setOtpError("Enter the 6-digit code to continue.");
      return;
    }

    if (missingVerificationContext) {
      setOtpError(
        "Missing verification details. Please restart the signup or reset flow to request a new code.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, otp: code }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setOtpError(
          data?.error || data?.message || "The OTP you entered is incorrect.",
        );
        return;
      }

      setNotification({
        type: "success",
        message: data.message || "Email verified successfully.",
      });

      setTimeout(() => router.push("/dashboard/sender"), 800);
    } catch (error) {
      setOtpError("We couldn't verify the code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (otpError) setOtpError("");
  };

  const handleOtpComplete = (value: string) => {
    setOtp(value);
    handleVerify(value);
  };

  return (
    <AuthLayout showcaseContent={<WorldMapShowcase />}>
      <div className="w-full flex-1 flex flex-col h-full lg:h-auto">
        <div className="flex-1 lg:flex-none">
          {notification && (
            <div className="mb-6">
              <Alert
                type={notification.type}
                message={notification.message}
                onClose={() => setNotification(null)}
              />
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-[#18181B] mb-3">
            Verify your email address
          </h1>
          <p className="text-[#52525B] text-base md:text-lg mb-8 leading-relaxed">
            Please enter the verification code sent to your email account{" "}
            <span className="font-medium text-[#18181B]">
              {email ? maskEmail(email) : "your email"}
            </span>
            .
          </p>

          <div className="space-y-4 mb-8">
            <OTPInput
              length={6}
              onChange={handleOtpChange}
              onComplete={handleOtpComplete}
              error={!!otpError}
            />
            {otpError && (
              <p className="text-sm text-red-500 text-center md:text-left">
                {otpError}
              </p>
            )}
          </div>

          <div className="w-full flex flex-col items-center gap-2">
            <button
              onClick={handleResend}
              disabled={!canResend || isResending}
              className={`text-base font-semibold transition-colors flex items-center gap-2 ${
                canResend
                  ? "text-[#5E44FF] hover:text-[#4D35FF]"
                  : "text-[#717182] cursor-not-allowed"
              }`}
            >
              Resend Code
              <span
                className={`font-bold ${
                  canResend ? "text-[#5E44FF]" : "text-[#717182]"
                }`}
              >
                {resendAttempts >= MAX_RESENDS
                  ? "(Max limit reached)"
                  : isCountingDown
                    ? `(${formatTime(timeLeft)})`
                    : "(Ready)"}
              </span>
            </button>
            {resendAttempts >= MAX_RESENDS && (
              <p className="text-xs text-[#717182]">
                You have reached the resend limit for now.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 mt-auto lg:mt-12 w-full">
          <Button
            variant="primary"
            className="w-full py-7 text-lg font-bold bg-[#5E44FF] hover:bg-[#4D35FF] shadow-lg shadow-purple-200"
            onClick={() => handleVerify()}
            disabled={!isOtpComplete || isSubmitting || missingVerificationContext}
            isLoading={isSubmitting}
          >
            Verify Email
          </Button>

          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="text-base font-semibold text-[#5E44FF] hover:underline cursor-pointer"
          >
            Didn&apos;t get OTP Code?
          </button>

          {missingVerificationContext && (
            <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              We could not find your verification details. Please return to the
              signup or password reset flow and request a new code.
            </div>
          )}
        </div>
      </div>
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </AuthLayout>
  );
}

