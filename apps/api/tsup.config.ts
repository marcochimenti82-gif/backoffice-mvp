import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  sourcemap: true,
  outDir: "dist",
  clean: true,
  target: "es2022",
  dts: false, // <-- IMPORTANTISSIMO: l'API non deve generare .d.ts
});

