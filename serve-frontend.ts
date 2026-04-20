import { serveDir } from "jsr:@std/http/file-server";

Deno.serve({ port: 3000 }, (req) => {
  return serveDir(req, { fsRoot: "./Frontend" });
});

console.log("Frontend running on http://localhost:3000");
