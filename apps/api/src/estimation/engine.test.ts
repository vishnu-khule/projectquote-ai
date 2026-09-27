import { test } from "node:test";
import assert from "node:assert/strict";
import { computeEstimateTotals } from "./engine.js";

test("computeEstimateTotals applies qty, labour, discount, and tax", () => {
  const totals = computeEstimateTotals({
    currency: "INR",
    lineItems: [
      {
        quantity: "2",
        unitPrice: "1000",
        labourHours: "4",
        labourRate: "250",
        discountPercent: "10",
        taxPercent: "18",
      },
    ],
  });

  // material 2000 + labour 1000 = 3000; discount 300 → taxable 2700; tax 486 → grand 3186
  assert.equal(totals.subtotal, "3000.00");
  assert.equal(totals.discountTotal, "300.00");
  assert.equal(totals.taxableAmount, "2700.00");
  assert.equal(totals.taxTotal, "486.00");
  assert.equal(totals.grandTotal, "3186.00");
});
