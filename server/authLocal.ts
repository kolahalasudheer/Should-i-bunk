import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

const loginAttempts: Record<string, { count: number; lastAttempt: number; lockUntil?: number }> = {};
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Signup
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    // Password strength check
    const strong = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
    if (!strong) {
      return res.status(400).json({ message: "Password must be 8+ chars, include upper, lower, number, special." });
    }
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const id = nanoid(); // Generate a unique user ID
    await db.insert(users).values({ id, email, password_hash });
    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    const key = email.toLowerCase() + "_" + req.ip;
    const now = Date.now();
    if (loginAttempts[key] && loginAttempts[key].lockUntil && now < loginAttempts[key].lockUntil) {
      const mins = Math.ceil((loginAttempts[key].lockUntil - now) / 60000);
      return res.status(429).json({ message: `Account locked due to too many failed attempts. Try again in ${mins} min(s).` });
    }
    // Reset count if window expired
    if (loginAttempts[key] && now - loginAttempts[key].lastAttempt > WINDOW_MS) {
      delete loginAttempts[key];
    }
    const user = (await db.select().from(users).where(eq(users.email, email)))[0];
    if (!user || typeof user.password_hash !== "string") {
      // Count failed attempt
      if (!loginAttempts[key]) loginAttempts[key] = { count: 1, lastAttempt: now };
      else {
        loginAttempts[key].count++;
        loginAttempts[key].lastAttempt = now;
      }
      if (loginAttempts[key].count >= MAX_ATTEMPTS) {
        loginAttempts[key].lockUntil = now + LOCKOUT_MS;
        return res.status(429).json({ message: `Account locked due to too many failed attempts. Try again in 15 min(s).` });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      if (!loginAttempts[key]) loginAttempts[key] = { count: 1, lastAttempt: now };
      else {
        loginAttempts[key].count++;
        loginAttempts[key].lastAttempt = now;
      }
      if (loginAttempts[key].count >= MAX_ATTEMPTS) {
        loginAttempts[key].lockUntil = now + LOCKOUT_MS;
        return res.status(429).json({ message: `Account locked due to too many failed attempts. Try again in 15 min(s).` });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Success: clear attempts
    delete loginAttempts[key];
    // @ts-ignore
    if (typeof user.id === 'string') {
      req.session.userId = user.id;
    } else {
      return res.status(500).json({ message: "User ID is invalid" });
    }
    return res.json({ message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Logout
router.post("/logout", (req: Request, res: Response) => {
  // @ts-ignore
  req.session.destroy(() => res.json({ message: "Logged out" }));
});

// Get current user
router.get("/me", async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.session.userId;
  if (typeof userId !== 'string') return res.status(401).json({ message: "Not logged in" });
  // @ts-ignore
  const user = (await db.select().from(users).where(eq(users.id, userId)))[0];
  if (!user) return res.status(401).json({ message: "User not found" });
  res.json({ id: user.id, email: user.email });
});

// Update profile
router.post("/update-profile", async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.session.userId;
  if (typeof userId !== 'string') return res.status(401).json({ message: "Not logged in" });
  const { firstName, lastName, profileImageUrl } = req.body;
  try {
    await db.update(users)
      .set({ firstName, lastName, profileImageUrl })
      .where(eq(users.id, userId));
    const updatedUser = (await db.select().from(users).where(eq(users.id, userId)))[0];
    res.json({ user: updatedUser });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router; 