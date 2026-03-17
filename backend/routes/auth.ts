import { Router } from "@oak/oak";
import { hash, verify } from "jsr:@felix/bcrypt";
import { db } from "../db/client.ts";
import { authMiddleware, createToken } from "../middleware/auth.ts";

export const authRouter = new Router();

authRouter.post("/api/v1/auth/register", async (ctx) => {
  const { email, password, name } = await ctx.request.body.json();

  if (!email || !password) {
    ctx.response.status = 400;
    ctx.response.body = { error: { message: "Email and password required" } };
    return;
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email);
  if (existing) {
    ctx.response.status = 400;
    ctx.response.body = { error: { message: "Email already registered" } };
    return;
  }

  const id = crypto.randomUUID();
  const hashedPassword = await hash(password);
  db.prepare(
    "INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)",
  ).run(id, email, hashedPassword, name ?? null);

  const token = await createToken(id);
  ctx.response.status = 201;
  ctx.response.body = { user: { id, email, name }, token };
});

authRouter.post("/api/v1/auth/login", async (ctx) => {
  const { email, password } = await ctx.request.body.json();

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as any;
  if (!user || !(await verify(password, user.password))) {
    ctx.response.status = 401;
    ctx.response.body = { error: { message: "Invalid credentials" } };
    return;
  }

  const token = await createToken(user.id);
  ctx.response.body = {
    user: { id: user.id, email: user.email, name: user.name },
    token,
  };
});
authRouter.get("/api/v1/users/me", authMiddleware, async (ctx) => {
  const userId = ctx.state.userId;
  const user = db
    .prepare("SELECT id, email, name FROM users WHERE id = ?")
    .get(userId) as any;
  ctx.response.body = { user };
});
