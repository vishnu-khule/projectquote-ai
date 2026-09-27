import Decimal from "decimal.js";
import type { EstimateLineItem } from "@projectquote/schemas";

export type ComputeTotalsInput = {
  lineItems: Pick<
    EstimateLineItem,
    | "quantity"
    | "unitPrice"
    | "labourHours"
    | "labourRate"
    | "discountPercent"
    | "taxPercent"
  >[];
  currency: string;
};

export function computeEstimateTotals(input: ComputeTotalsInput) {
  let materialSubtotal = new Decimal(0);
  let labourSubtotal = new Decimal(0);
  let discountTotal = new Decimal(0);
  let taxTotal = new Decimal(0);

  for (const item of input.lineItems) {
    const qty = new Decimal(item.quantity);
    const unitPrice = new Decimal(item.unitPrice);
    const material = qty.times(unitPrice);
    materialSubtotal = materialSubtotal.plus(material);

    const labourHours = item.labourHours
      ? new Decimal(item.labourHours)
      : new Decimal(0);
    const labourRate = item.labourRate
      ? new Decimal(item.labourRate)
      : new Decimal(0);
    const labour = labourHours.times(labourRate);
    labourSubtotal = labourSubtotal.plus(labour);

    const lineSubtotal = material.plus(labour);
    const discountPct = new Decimal(item.discountPercent ?? "0");
    const lineDiscount = lineSubtotal.times(discountPct).div(100);
    discountTotal = discountTotal.plus(lineDiscount);

    const taxable = lineSubtotal.minus(lineDiscount);
    const taxPct = new Decimal(item.taxPercent ?? "0");
    const lineTax = taxable.times(taxPct).div(100);
    taxTotal = taxTotal.plus(lineTax);
  }

  const subtotal = materialSubtotal.plus(labourSubtotal);
  const taxableAmount = subtotal.minus(discountTotal);
  const grandTotal = taxableAmount.plus(taxTotal);

  const fmt = (d: Decimal) => d.toFixed(2);

  return {
    materialSubtotal: fmt(materialSubtotal),
    labourSubtotal: fmt(labourSubtotal),
    subtotal: fmt(subtotal),
    discountTotal: fmt(discountTotal),
    taxableAmount: fmt(taxableAmount),
    taxTotal: fmt(taxTotal),
    grandTotal: fmt(grandTotal),
    currency: input.currency,
  };
}
