import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "#": resolve(__dirname, "./src"),
    },
    extensions: [".ts", ".js", ".json"],
  },

  test: {
    globals: true,

    environment: "node",

    coverage: {
      provider: "c8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "**/*.d.ts",
        "dist/",
        "coverage/",
      ],
    },

    include: [
      "src/**/__tests__/**/*.{test,spec}.{js,ts}",
      "src/**/*.{test,spec}.{js,ts}",
    ],

    exclude: ["node_modules", "dist", ".git"],
  },
});
