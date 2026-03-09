import { Application, Router } from "@oak/oak";
import "./db/client.ts";
import { authRouter } from "./routes/auth.ts";

const app = new Application();
const router = new Router();

router.get("/", (ctx) => {
  ctx.response.body = { message: "ClearHead API is running" };
});

app.use(router.routes());
app.use(router.allowedMethods());
app.use(authRouter.routes());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
