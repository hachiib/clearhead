import { create, verify } from "jsr:@zaubrik/djwt";
import { db } from "../db/client.ts";

const jwtSecret = Deno.env.get("JWT_SECRET");
if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

const SECRET_KEY = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(jwtSecret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);

export async function createToken(userId: string): Promise<string> {
  return await create(
    { alg: "HS256", typ: "JWT" },
    { sub: userId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, // 24h
    SECRET_KEY,
  );
}

export async function authMiddleware(ctx: any, next: any) {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { error: { message: "Missing or invalid token" } };
    return;
  }
  try {
    const token = authHeader.slice(7);
    const payload = await verify(token, SECRET_KEY);
    ctx.state.userId = payload.sub;
    await next();
  } catch {
    ctx.response.status = 401;
    ctx.response.body = { error: { message: "Invalid token" } };
  }
}
