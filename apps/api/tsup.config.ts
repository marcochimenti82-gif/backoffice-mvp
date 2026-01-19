import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"], // ✅ QUI
  format: ["esm"],
  sourcemap: true,
  outDir: "dist",
  dts: true,
  clean: true,
  target: "es2022",
});
