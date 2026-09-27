import { test } from "node:test";
import assert from "node:assert/strict";
import { ProposalBuilderService } from "./proposal-builder.service.js";

test("proposal builder includes cost breakdown from line items", () => {
  const builder = new ProposalBuilderService();
  const { sections } = builder.build({
    projectTitle: "Kitchen",
    organizationName: "Test Co",
    lineItems: [
      {
        name: "Carcass",
        category: "material",
        quantity: "1",
        unit: "set",
        unitPrice: "100000",
        taxPercent: "18",
      },
    ],
    totals: {
      currency: "INR",
      subtotal: "100000.00",
      taxTotal: "18000.00",
      grandTotal: "118000.00",
    },
    assumptions: [],
    exclusions: [],
  });
  const cost = sections.find((s) => s.id === "cost_breakdown");
  assert.ok(cost?.content.includes("118000.00"));
});
