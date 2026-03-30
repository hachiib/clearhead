import { Application, Router } from "@oak/oak";
import { authRouter } from "./routes/auth.ts";
import "./db/client.ts";
import { transactionsRouter } from "./routes/transactions.ts";
import { checkinsRouter } from "./routes/checkins.ts";
import { insightsRouter } from "./routes/insights.ts";

const app = new Application();

// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type",
  );
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }
  await next();
});

// Health check
const router = new Router();
router.get("/api/v1", (ctx) => {
  ctx.response.body = { message: "ClearHead API is running ✅" };
});

app.use(router.routes());
app.use(router.allowedMethods());
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());
app.use(transactionsRouter.routes());
app.use(transactionsRouter.allowedMethods());
app.use(checkinsRouter.routes());
app.use(checkinsRouter.allowedMethods());
app.use(insightsRouter.routes());
app.use(insightsRouter.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
