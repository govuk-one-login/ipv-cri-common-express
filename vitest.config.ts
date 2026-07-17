import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    include: ["test/**/*.test.js", "**/*.test.js", "**/spec*.js"],
    setupFiles: ["./test/utils/helpers.js", "./test/bootstrap/helper.js"],
    coverage: {
      include: ["src/**/*"],
    },
  },
});
