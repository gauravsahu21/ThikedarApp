import { Router } from "express";
import jwt from "jsonwebtoken";
import { users, otps, findOrCreateUser } from "../store.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const IS_PROD = process.env.NODE_ENV === "production";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 5;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: IS_PROD,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  const last10 = digits.length > 10 ? digits.slice(-10) : digits;
  if (!/^[6-9]\d{9}$/.test(last10)) return null;
  return last10;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/auth/otp/request { phone }
router.post("/otp/request", (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  if (!phone) {
    return res.status(400).json({ error: "Enter a valid 10-digit mobile number" });
  }

  const existing = otps.get(phone);
  if (existing && Date.now() - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt)) / 1000);
    return res.status(429).json({ error: `Please wait ${waitSeconds}s before requesting another OTP` });
  }

  const code = generateOtp();
  otps.set(phone, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: Date.now(),
  });

  // Mock SMS provider: log to server console instead of sending a real SMS.
  console.log(`[OTP] Sending OTP ${code} to +91-${phone} (expires in 5 min)`);

  const response = {
    success: true,
    message: "OTP sent to your mobile number",
  };

  // Dev convenience only: never expose the OTP in a response in production.
  if (!IS_PROD) {
    response.devOtp = code;
  }

  res.json(response);
});

// POST /api/auth/otp/verify { phone, otp }
router.post("/otp/verify", (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const otp = String(req.body?.otp || "").trim();

  if (!phone) {
    return res.status(400).json({ error: "Enter a valid 10-digit mobile number" });
  }

  const record = otps.get(phone);
  if (!record) {
    return res.status(400).json({ error: "No OTP was requested for this number" });
  }

  if (Date.now() > record.expiresAt) {
    otps.delete(phone);
    return res.status(400).json({ error: "OTP expired, please request a new one" });
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otps.delete(phone);
    return res.status(429).json({ error: "Too many incorrect attempts, please request a new OTP" });
  }

  if (otp !== record.code) {
    record.attempts += 1;
    return res.status(400).json({ error: "Incorrect OTP" });
  }

  otps.delete(phone);
  const user = findOrCreateUser(phone);

  const token = jwt.sign({ sub: user.id, phone: user.phone }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, cookieOptions);
  res.json({ success: true, user: { id: user.id, phone: user.phone, name: user.name } });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ success: true });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const user = [...users.values()].find((u) => u.id === req.auth.sub);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ user: { id: user.id, phone: user.phone, name: user.name } });
});

export default router;
