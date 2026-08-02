import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/lib/roles";

export const SESSION_COOKIE = "velvet_session";
const ALG = "HS256";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) throw new Error("[velvet] AUTH_SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  sub: string;
  name?: string;
  email?: string;
  role: UserRole;
}

export async function issueSessionToken(
  user: SessionUser,
  expiresIn = "30d"
): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey());
}

function isUserRole(value: unknown): value is UserRole {
  return value === "user" || value === "editor" || value === "admin";
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionUser | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: [ALG],
    });

    if (!payload.sub) return null;
    // Tokens issued before roles existed (or tampered with) won't carry a
    // valid role claim — treat those as invalid rather than defaulting to
    // something permissive.
    if (!isUserRole(payload.role)) return null;

    return {
      sub: payload.sub,
      name: payload.name as string | undefined,
      email: payload.email as string | undefined,
      role: payload.role,
    };
  } catch {
    return null;
  }
}