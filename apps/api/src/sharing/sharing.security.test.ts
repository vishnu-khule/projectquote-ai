import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";

/** Mirrors sharing token hashing — public tokens must not be reversible to internal IDs. */
function hashShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

test("share token hash is stable and one-way", () => {
  const token = "customer-facing-random-token";
  const a = hashShareToken(token);
  const b = hashShareToken(token);
  assert.equal(a, b);
  assert.notEqual(a, token);
  assert.equal(a.length, 64);
});
