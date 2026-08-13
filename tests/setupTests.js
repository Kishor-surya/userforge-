import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import "@testing-library/jest-dom/vitest";

// Without `test.globals: true` in vitest.config.js, Testing Library's
// automatic per-test cleanup doesn't have an `afterEach` to hook into, so
// each test's rendered DOM piles up on top of the last one. Explicit here
// instead of flipping on globals, since every test file already imports
// describe/it/expect/vi from "vitest" directly.
afterEach(() => {
  cleanup();
});
