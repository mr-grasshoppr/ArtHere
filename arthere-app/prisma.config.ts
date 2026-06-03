import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    // Vercel Postgres uses a pooled URL for app traffic and a direct URL for migrations
    // directUrl: process.env["DATABASE_URL_UNPOOLED"], // add when Prisma supports it
  },
});
