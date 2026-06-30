import { useEffect, useMemo, useRef, useState } from "react";
import learningHero from "@/assets/learning-hero.svg";
import Hero from "@/assets/login.png";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/config";
import { AppHeader } from "@/components/layout/AppHeader";

type LoginMethod = "phone" | "email";

const EMAIL_REGEX =
  /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)])$/;

const StudentLogin = () => {
  const navigate = useNavigate();

  const [method, setMethod] = useState<LoginMethod>("phone");
  const [identifier, setIdentifier] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [otpToken, setOtpToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [apiError, setApiError] = useState("");

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // Skip OTP when a valid session already exists on this device.
    if (localStorage.getItem("token")) {
      navigate("/chat", { replace: true });
    }
  }, [navigate]);

  const fieldLabel = useMemo(
    () => (method === "email" ? "Email Address" : "Phone Number"),
    [method]
  );

  const fieldType = method === "email" ? "email" : "tel";
  const placeholder =
    method === "email" ? "you@example.com" : "+91 98765 43210";

  const validateIdentifier = (value: string) => {
    const trimmed = value.trim();
    if (method === "phone") {
      if (!/^\d+$/.test(trimmed) || trimmed.length !== 10) {
        return "Please enter a valid 10-digit phone number";
      }
      return "";
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      return "Please enter a valid email address";
    }
    return "";
  };


  //  OTP INPUT HANDLER
  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);
    setOtpError("");
    setApiError("");

    if (value && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  //  BACKSPACE HANDLER
  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key !== "Backspace") return;

    if (otp[index]) {
      const updatedOtp = [...otp];
      updatedOtp[index] = "";
      setOtp(updatedOtp);
      return;
    }
    if (index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  //  SEND OTP
  const handleSendOtp = async () => {
    const errorMessage = validateIdentifier(identifier);
    if (errorMessage) {
      setIdentifierError(errorMessage);
      return;
    }

    setIdentifierError("");
    setApiError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/auth/request-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_or_email: identifier.trim() }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.detail || "Failed to send OTP");
        return;
      }

      setOtpToken(data.otp_token);
      setOtpRequested(true);
      setOtp(Array(6).fill(""));
      setOtpError("");
      setApiError("");

      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setApiError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP
  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setOtpError("Please enter complete OTP");
      return;
    }

    setOtpError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            otp_token: otpToken,
            code: otpValue,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Invalid OTP");
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user_email", identifier.trim());
      // Use a small route map to avoid inline hardcoding in the navigation call.
      const nextRoute = data.is_new_user ? "/onboarding" : "/chat";
      navigate(nextRoute);
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-surface-elevated">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-5 lg:grid-cols-[minmax(320px,420px)_minmax(320px,1fr)]">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {/* TITLE */}
          <div className="space-y-2">
          <div className="text-2xl font-semibold">
            <span className="text-blue-600">Sign</span>{" "}
            <span className="text-indigo-600 ">in with</span>{" "}
            <span className="text-purple-500">OTP</span>
          </div>
            <p className="text-sm text-muted-foreground">
              Use your phone number or email to receive a one-time passcode.
            </p>
          </div>

          {/* METHOD TOGGLE */}
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-secondary p-1">
            {(["phone", "email"] as LoginMethod[]).map((value) => (
              <button
                key={value}
                onClick={() => {
                  setMethod(value);
                  setIdentifier("");
                  setIdentifierError("");
                  setOtpError("");
                  setApiError("");
                  setOtpRequested(false);
                  setOtpToken("");
                  setOtp(Array(6).fill(""));
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                  method === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {value === "phone" ? "Phone" : "Email"}
              </button>
            ))}
          </div>

          {/* INPUT */}
          <div className="mt-5 space-y-4">
            <label className="text-sm font-semibold">
            <div className="text-sm font-semibold bg-gradient-to-bl from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
             {/* Learn with confidence */}
              {fieldLabel}
            </div>
              <input
                type={fieldType}
                placeholder={placeholder}
                value={identifier}
                onChange={(e) => {
                  const nextValue =
                    method === "phone"
                      ? e.target.value.replace(/\D/g, "").slice(0, 10)
                      : e.target.value;
                  setIdentifier(nextValue);
                  if (identifierError) {
                    setIdentifierError(validateIdentifier(nextValue));
                  }
                }}
                className="mt-2 w-full rounded-xl border px-4 py-3"
              />
            </label>
            {identifierError && (
              <div className="text-sm text-red-600" role="alert">
                {identifierError}
              </div>
            )}
            {apiError && !otpRequested && (
              <div className="text-sm text-red-600" role="alert">
                {apiError}
              </div>
            )}

            {!otpRequested && (
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full rounded-xl bg-primary px-4 py-3 text-white"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            )}

            {otpRequested && (
              <>
                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      value={digit}
                      maxLength={1}
                      inputMode="numeric"
                      onChange={(e) =>
                        handleOtpInput(index, e.target.value)
                      }
                      onKeyDown={(e) =>
                        handleOtpKeyDown(index, e)
                      }
                      className="h-12 rounded-lg border text-center font-semibold"
                    />
                  ))}
                </div>
                {otpError && (
                  <div className="text-sm text-red-600" role="alert">
                    {otpError}
                  </div>
                )}
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full rounded-xl bg-primary px-4 py-3 text-white"
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
       <div className="relative overflow-hidden rounded-2xl bg-sidebar p-8 text-sidebar-foreground shadow-lg">
          <div className="relative z-10 space-y-6">
            <div className="text-3xl font-semibold">Learn faster, stay on track</div>
            {/* <p className="text-sm text-sidebar-muted">
              Choose your board and class to unlock subject-specific guidance,
              practice, and a personal AI tutor that adapts to your learning style.
            </p> */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: "12k+", label: "Active Learners" },
                { value: "35", label: "Boards & Streams" },
                { value: "120+", label: "Subjects" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-sidebar-accent p-4 text-sm"
                >
                  <div className="text-lg font-semibold">{stat.value}</div>
                  <div className="text-xs text-sidebar-muted">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-3 shadow-sm">
              <img
                src={Hero}
                alt="Students learning with an AI tutor"
                className="h-48 w-full rounded-xl object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/50 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
