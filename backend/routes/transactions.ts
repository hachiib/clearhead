import { Router } from "@oak/oak";
import { authMiddleware } from "../middleware/auth.ts";
import { db } from "../db/client.ts";

export const transactionsRouter = new Router();

transactionsRouter.get("/api/v1/transactions", authMiddleware, async (ctx) => {
  const userId = ctx.state.userId;

  const transactions = db
    .prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC")
    .all(userId);

  ctx.response.body = { transactions };
});

transactionsRouter.post("/api/v1/transactions", authMiddleware, async (ctx) => {
  const userId = ctx.state.userId;
  const { amount, category, description, date, type } =
    await ctx.request.body.json();

  // Validation
  if (!amount || !category || !date || !type) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: { message: "amount, category, date and type are required" },
    };
    return;
  }

  if (type !== "income" && type !== "expense") {
    ctx.response.status = 400;
    ctx.response.body = {
      error: { message: "type must be income or expense" },
    };
    return;
  }

  if (amount <= 0) {
    ctx.response.status = 400;
    ctx.response.body = { error: { message: "amount must be greater than 0" } };
    return;
  }

  const id = crypto.randomUUID();

  db.prepare(
    "INSERT INTO transactions (id, user_id, amount, category, description, date, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, userId, amount, category, description ?? null, date, type);

  ctx.response.status = 201;
  ctx.response.body = {
    transaction: { id, userId, amount, category, description, date, type },
  };
});

transactionsRouter.put(
  "/api/v1/transactions/:id",
  authMiddleware,
  async (ctx) => {
    const userId = ctx.state.userId;
    const transactionId = ctx.params.id;

    // Check transaction exists and belongs to this user
    const existing = db
      .prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?")
      .get(transactionId, userId) as any;

    if (!existing) {
      ctx.response.status = 404;
      ctx.response.body = { error: { message: "Transaction not found" } };
      return;
    }

    const { amount, category, description, date, type } =
      await ctx.request.body.json();

    // Use existing values if not provided
    const updatedAmount = amount ?? existing.amount;
    const updatedCategory = category ?? existing.category;
    const updatedDescription = description ?? existing.description;
    const updatedDate = date ?? existing.date;
    const updatedType = type ?? existing.type;

    if (updatedType !== "income" && updatedType !== "expense") {
      ctx.response.status = 400;
      ctx.response.body = {
        error: { message: "type must be income or expense" },
      };
      return;
    }

    db.prepare(
      "UPDATE transactions SET amount = ?, category = ?, description = ?, date = ?, type = ? WHERE id = ? AND user_id = ?",
    ).run(
      updatedAmount,
      updatedCategory,
      updatedDescription,
      updatedDate,
      updatedType,
      transactionId,
      userId,
    );

    ctx.response.body = {
      transaction: {
        id: transactionId,
        userId,
        amount: updatedAmount,
        category: updatedCategory,
        description: updatedDescription,
        date: updatedDate,
        type: updatedType,
      },
    };
  },
);

transactionsRouter.delete(
  "/api/v1/transactions/:id",
  authMiddleware,
  async (ctx) => {
    const userId = ctx.state.userId;
    const transactionId = ctx.params.id;

    const existing = db
      .prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?")
      .get(transactionId, userId) as any;

    if (!existing) {
      ctx.response.status = 404;
      ctx.response.body = { error: { message: "Transaction not found" } };
      return;
    }

    db.prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?").run(
      transactionId,
      userId,
    );

    ctx.response.status = 204;
  },
);
