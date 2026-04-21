import { NextRequest, NextResponse } from "next/server";

import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "supersecretpickmeup";

export function signToken(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
}

// Helper to get authorized user from the cookie
export function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token) as { id: number; username: string; role: string } | null;
}
