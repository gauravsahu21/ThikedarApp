import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RESEND_SECONDS = 30;

export default function Login() {
  const { requestOtp, verifyOtp, user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("phone"); // 'phone' | 'otp'
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  function startCooldown() {
    setCooldown(RESEND_SECONDS);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp(e) {
    e?.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const data = await requestOtp(phone);
      setStep("otp");
      setDevOtp(data.devOtp ?? null);
      setInfo(data.message);
      startCooldown();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await verifyOtp(phone, otp);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-center">
      <div className="card">
        <h1>ThikedarApp</h1>
        <p className="subtitle">Sign in with your mobile number</p>

        {step === "phone" && (
          <form onSubmit={handleSendOtp}>
            <label htmlFor="phone">Mobile number</label>
            <div className="phone-input">
              <span>+91</span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <p className="info">{info || `OTP sent to +91 ${phone}`}</p>
            {devOtp && (
              <p className="dev-banner">
                DEV MODE — no SMS provider is connected, so here's your OTP: <strong>{devOtp}</strong>
              </p>
            )}
            <label htmlFor="otp">Enter 6-digit OTP</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              autoFocus
              required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={submitting || otp.length !== 6}>
              {submitting ? "Verifying…" : "Verify & Login"}
            </button>
            <div className="row-links">
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
              >
                Change number
              </button>
              <button
                type="button"
                className="link-button"
                disabled={cooldown > 0 || submitting}
                onClick={handleSendOtp}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
