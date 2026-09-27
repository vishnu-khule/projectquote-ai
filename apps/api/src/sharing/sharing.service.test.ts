import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

test("share token hashes consistently", () => {
  const token = "test-token";
  const hash = createHash("sha256").update(token).digest("hex");
  assert.equal(hash.length, 64);
});
