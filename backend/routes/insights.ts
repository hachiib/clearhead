import { Router } from "@oak/oak";
import { authMiddleware } from "../middleware/auth.ts";
import { db } from "../db/client.ts";

export const insightsRouter = new Router();

// GET /api/v1/insights/summary — totals and averages
insightsRouter.get("/api/v1/insights/summary", authMiddleware, (ctx) => {
  const userId = ctx.state.userId;

  const transactions = db
    .prepare("SELECT * FROM transactions WHERE user_id = ?")
    .all(userId) as any[];

  const checkins = db
    .prepare("SELECT * FROM checkins WHERE user_id = ?")
    .all(userId) as any[];

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const avgMood = checkins.length
    ? checkins.reduce((sum, c) => sum + c.mood_score, 0) / checkins.length
    : null;

  const avgStress = checkins.length
    ? checkins.reduce((sum, c) => sum + c.stress_score, 0) / checkins.length
    : null;

  ctx.response.body = {
    summary: {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      avgMood: avgMood ? parseFloat(avgMood.toFixed(2)) : null,
      avgStress: avgStress ? parseFloat(avgStress.toFixed(2)) : null,
      transactionCount: transactions.length,
      checkinCount: checkins.length,
    },
  };
});
