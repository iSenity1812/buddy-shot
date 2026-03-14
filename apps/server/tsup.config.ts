import { defineConfig } from "tsup";
import path from "path";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"],
  dts: false,
  clean: true,
  outDir: "dist",
  tsconfig: "./tsconfig.json",
  sourcemap: false,
  shims: true,
  esbuildOptions(options: any) {
    options.alias = {
      "@": path.resolve(__dirname, "./src"),
    };
  },
});
