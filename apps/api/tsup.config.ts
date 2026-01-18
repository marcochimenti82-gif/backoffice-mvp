import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  sourcemap: true,
  outDir: "dist",
  dts: false,        // boolean vero/falso, NON "false" stringa in CLI
  clean: true
});
