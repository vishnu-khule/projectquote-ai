import { test } from "node:test";
import assert from "node:assert/strict";
import { validateUpload } from "./file-validation.js";

test("validateUpload rejects oversized files", () => {
  assert.throws(() =>
    validateUpload({
      mimetype: "application/pdf",
      size: 30 * 1024 * 1024,
      originalname: "big.pdf",
    }),
  );
});

test("validateUpload accepts pdf", () => {
  validateUpload({
    mimetype: "application/pdf",
    size: 1024,
    originalname: "quote.pdf",
  });
});
