// auth.ts — email + password auth with bcrypt hashes and HS256 JWTs.
// The token is stateless (30-day expiry); the SPA stores it and sends
// Authorization: Bearer <token> on every call.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Context, Next } from "hono";
import { env } from "./env.js";
import { pool } from "./db.js";

const TOKEN_TTL = "30d";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AuthUser {
  id: string;
  email: string;
}

function sign(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: TOKEN_TTL,
  });
}

export function verify(token: string): AuthUser | null {
  try {
    const p = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    if (!p.sub || typeof p.email !== "string") return null;
    return { id: String(p.sub), email: p.email };
  } catch {
    return null;
  }
}

export async function signUp(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const e = email.trim().toLowerCase();
  if (!EMAIL_RE.test(e)) throw new HttpError(400, "Enter a valid email address.");
  if (!password || password.length < 6) throw new HttpError(400, "Password must be at least 6 characters.");
  const hash = bcrypt.hashSync(password, 10);
  try {
    const r = await pool.query(
      "insert into users (email, password_hash) values ($1, $2) returning id, email",
      [e, hash],
    );
    const user = { id: r.rows[0].id as string, email: r.rows[0].email as string };
    return { token: sign(user), user };
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      throw new HttpError(409, "An account with this email already exists.");
    }
    throw err;
  }
}

export async function signIn(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const e = email.trim().toLowerCase();
  const r = await pool.query("select id, email, password_hash from users where lower(email) = $1", [e]);
  const row = r.rows[0];
  // Same error for unknown email and wrong password (no account enumeration).
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    throw new HttpError(401, "Invalid email or password.");
  }
  const user = { id: row.id as string, email: row.email as string };
  return { token: sign(user), user };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Hono middleware: requires a valid bearer token; sets c.var user. */
export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const header = c.req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const user = token ? verify(token) : null;
  if (!user) return c.json({ error: "Not signed in." }, 401);
  c.set("user", user);
  await next();
}
