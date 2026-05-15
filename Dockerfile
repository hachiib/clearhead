FROM denoland/deno:2.2.0

WORKDIR /app

COPY . .

RUN deno cache backend/main.ts
EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "--allow-ffi", "backend/main.ts"]