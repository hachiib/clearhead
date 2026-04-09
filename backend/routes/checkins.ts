import { Router } from "@oak/oak";
import { authMiddleware } from "../middleware/auth.ts";
import { db } from "../db/client.ts";

export const checkinsRouter = new Router();

// POST /api/v1/checkins — log a new check-in
checkinsRouter.post("/api/v1/checkins", authMiddleware, async (ctx) => {
  const userId = ctx.state.userId;
  const { mood_score, stress_score, note, date } =
    await ctx.request.body.json();

  if (!mood_score || !stress_score || !date) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: { message: "mood_score, stress_score and date are required" },
    };
    return;
  }

  if (
    mood_score < 1 ||
    mood_score > 10 ||
    stress_score < 1 ||
    stress_score > 10
  ) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: {
        message: "mood_score and stress_score must be between 1 and 10",
      },
    };
    return;
  }

  const id = crypto.randomUUID();

  try {
    db.prepare(
      "INSERT INTO checkins (id, user_id, mood_score, stress_score, note, date) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(id, userId, mood_score, stress_score, note ?? null, date);
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: { message: "Failed to save check-in" } };
    return;
  }

  ctx.response.status = 201;
  ctx.response.body = {
    checkin: { id, userId, mood_score, stress_score, note: note ?? null, date },
  };
});

// GET /api/v1/checkins — fetch all check-ins for logged in user
checkinsRouter.get("/api/v1/checkins", authMiddleware, (ctx) => {
  const userId = ctx.state.userId;

  const checkins = db
    .prepare("SELECT * FROM checkins WHERE user_id = ? ORDER BY date DESC")
    .all(userId);

  ctx.response.body = { checkins };
});

// PUT /api/v1/checkins/:id — update a check-in
checkinsRouter.put("/api/v1/checkins/:id", authMiddleware, async (ctx) => {
  const userId = ctx.state.userId;
  const { id } = ctx.params;

  const existing = db
    .prepare("SELECT id FROM checkins WHERE id = ? AND user_id = ?")
    .get(id, userId);
  if (!existing) {
    ctx.response.status = 404;
    ctx.response.body = { error: { message: "Check-in not found" } };
    return;
  }

  const { mood_score, stress_score, note, date } = await ctx.request.body.json();

  if (
    mood_score !== undefined &&
    (mood_score < 1 || mood_score > 10)
  ) {
    ctx.response.status = 400;
    ctx.response.body = { error: { message: "mood_score must be between 1 and 10" } };
    return;
  }
  if (
    stress_score !== undefined &&
    (stress_score < 1 || stress_score > 10)
  ) {
    ctx.response.status = 400;
    ctx.response.body = { error: { message: "stress_score must be between 1 and 10" } };
    return;
  }

  db.prepare(`
    UPDATE checkins
    SET mood_score  = COALESCE(?, mood_score),
        stress_score = COALESCE(?, stress_score),
        note        = COALESCE(?, note),
        date        = COALESCE(?, date)
    WHERE id = ? AND user_id = ?
  `).run(mood_score ?? null, stress_score ?? null, note ?? null, date ?? null, id, userId);

  const updated = db
    .prepare("SELECT * FROM checkins WHERE id = ?")
    .get(id);

  ctx.response.body = { checkin: updated };
});

// DELETE /api/v1/checkins/:id — delete a check-in
checkinsRouter.delete("/api/v1/checkins/:id", authMiddleware, (ctx) => {
  const userId = ctx.state.userId;
  const { id } = ctx.params;

  const existing = db
    .prepare("SELECT id FROM checkins WHERE id = ? AND user_id = ?")
    .get(id, userId);
  if (!existing) {
    ctx.response.status = 404;
    ctx.response.body = { error: { message: "Check-in not found" } };
    return;
  }

  db.prepare("DELETE FROM checkins WHERE id = ? AND user_id = ?").run(id, userId);

  ctx.response.status = 200;
  ctx.response.body = { message: "Check-in deleted" };
});
