import { test } from "node:test";
import assert from "node:assert/strict";
import { TierEngineService } from "./tier-engine.service.js";

test("applyUplift increases price by percent", () => {
  const engine = new TierEngineService();
  assert.equal(engine.applyUplift("1000", "15"), "1150.00");
});
