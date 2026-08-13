import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.{js,jsx}"],
    setupFiles: ["./tests/setupTests.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: [
        "src/lib/**",
        "src/components/**",
        "api/_mailer.js",
        "api/_validation.js",
        "api/_password.js",
        "api/_attachments.js",
        "api/_rateLimit.js",
        "api/_emailLog.js",
      ],
    },
  },
});
