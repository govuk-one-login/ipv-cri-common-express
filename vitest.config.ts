import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    include: ["test/**/*.test.js", "**/*.test.js", "**/spec*.js"],
    setupFiles: ["./test/utils/helpers.js", "./test/bootstrap/helper.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*"],
      exclude: ["**/*.njk", "**/*.md"],
    },
  },
});
