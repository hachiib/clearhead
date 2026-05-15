import { Application, Router, send } from "@oak/oak";
import { authRouter } from "./routes/auth.ts";
import "./db/client.ts";
import { transactionsRouter } from "./routes/transactions.ts";
import { checkinsRouter } from "./routes/checkins.ts";
import { insightsRouter } from "./routes/insights.ts";
import { serveDir } from "jsr:@std/http/file-server";

const app = new Application();

const allowedOrigin = Deno.env.get("FRONTEND_URL") ?? "http://localhost:3000";

// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
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
app.use(async (ctx, next) => {
  if (!ctx.request.url.pathname.startsWith("/api")) {
    await send(ctx, ctx.request.url.pathname, {
      root: `${Deno.cwd()}/Frontend`,
      index: "login.html",
    });
  } else {
    await next();
  }
});

const port = parseInt(Deno.env.get("PORT") ?? "8000");
console.log(`Server running on port ${port}`);
await app.listen({ port });
