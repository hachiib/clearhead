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

// GET /api/v1/insights/correlation — Pearson correlation
insightsRouter.get("/api/v1/insights/correlation", authMiddleware, (ctx) => {
  const userId = ctx.state.userId;

  const transactions = db
    .prepare(
      "SELECT date, amount FROM transactions WHERE user_id = ? AND type = 'expense'",
    )
    .all(userId) as any[];

  const checkins = db
    .prepare(
      "SELECT date, mood_score, stress_score FROM checkins WHERE user_id = ?",
    )
    .all(userId) as any[];

  const spendingByDate: Record<string, number> = {};
  for (const t of transactions) {
    spendingByDate[t.date] = (spendingByDate[t.date] || 0) + t.amount;
  }

  const matched = checkins.filter((c) => spendingByDate[c.date] !== undefined);

  if (matched.length < 2) {
    ctx.response.body = {
      correlation: {
        spendingVsMood: null,
        spendingVsStress: null,
        message:
          "Not enough overlapping data yet. Log more transactions and check-ins on the same dates.",
        matchedDays: matched.length,
      },
    };
    return;
  }

  const spending = matched.map((c) => spendingByDate[c.date]);
  const mood = matched.map((c) => c.mood_score);
  const stress = matched.map((c) => c.stress_score);

  function pearson(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    const num = x.reduce(
      (sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY),
      0,
    );
    const denX = Math.sqrt(x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0));
    const denY = Math.sqrt(y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0));
    return denX && denY ? parseFloat((num / (denX * denY)).toFixed(3)) : 0;
  }

  function interpret(r: number, target: string): string {
    if (r > 0.5)
      return `You tend to feel better ${target} on days you spend more.`;
    if (r < -0.5)
      return `You tend to feel worse ${target} on days you spend more.`;
    return `No strong relationship found between spending and ${target}.`;
  }

  const spendingVsMood = pearson(spending, mood);
  const spendingVsStress = pearson(spending, stress);

  ctx.response.body = {
    correlation: {
      spendingVsMood,
      spendingVsStress,
      moodInterpretation: interpret(spendingVsMood, "mood-wise"),
      stressInterpretation: interpret(spendingVsStress, "stress-wise"),
      matchedDays: matched.length,
    },
  };
});
