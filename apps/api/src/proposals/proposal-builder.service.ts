import { Injectable } from "@nestjs/common";
import type { ProposalSection } from "@projectquote/schemas";

type BuildInput = {
  projectTitle: string;
  projectDescription?: string | null;
  location?: string | null;
  customerName?: string;
  organizationName: string;
  lineItems: {
    name: string;
    category: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    taxPercent: string;
  }[];
  totals: {
    subtotal?: string;
    taxTotal?: string;
    grandTotal?: string;
    currency?: string;
  };
  assumptions: string[];
  exclusions: string[];
};

@Injectable()
export class ProposalBuilderService {
  build(input: BuildInput): { title: string; sections: ProposalSection[] } {
    const costTable = input.lineItems
      .map(
        (item) =>
          `• ${item.name} — ${item.quantity} ${item.unit} @ ${input.totals.currency ?? "INR"} ${item.unitPrice} (+${item.taxPercent}% tax)`,
      )
      .join("\n");

    const sections: ProposalSection[] = [
      {
        id: "cover",
        title: "Cover",
        order: 1,
        content: `${input.organizationName}\n\nProposal for: ${input.projectTitle}\nCustomer: ${input.customerName ?? "—"}\nLocation: ${input.location ?? "—"}`,
      },
      {
        id: "overview",
        title: "Project overview",
        order: 2,
        content:
          input.projectDescription?.trim() ||
          `This proposal covers the scope discussed for ${input.projectTitle}.`,
      },
      {
        id: "scope",
        title: "Scope of work",
        order: 3,
        content:
          input.lineItems.map((i) => `• ${i.name} (${i.category})`).join("\n") ||
          "Scope to be confirmed with the client.",
      },
      {
        id: "cost_breakdown",
        title: "Cost breakdown",
        order: 4,
        content: `${costTable}\n\nSubtotal: ${input.totals.currency ?? "INR"} ${input.totals.subtotal ?? "0.00"}\nTax: ${input.totals.taxTotal ?? "0.00"}\nGrand total: ${input.totals.grandTotal ?? "0.00"}`,
      },
      {
        id: "assumptions",
        title: "Assumptions",
        order: 5,
        content:
          input.assumptions.length > 0
            ? input.assumptions.map((a) => `• ${a}`).join("\n")
            : "• Standard site access and working hours.\n• Client-provided utilities where applicable.",
      },
      {
        id: "exclusions",
        title: "Exclusions",
        order: 6,
        content:
          input.exclusions.length > 0
            ? input.exclusions.map((e) => `• ${e}`).join("\n")
            : "• Items not explicitly listed in scope.\n• Statutory fees unless stated otherwise.",
      },
      {
        id: "payment_terms",
        title: "Payment terms",
        order: 7,
        content:
          "50% advance on acceptance.\n40% on material delivery / milestone completion.\n10% on handover.",
      },
      {
        id: "acceptance",
        title: "Acceptance",
        order: 8,
        content:
          "By signing below, the client accepts this proposal, scope, and pricing.",
      },
    ];

    return {
      title: `Proposal — ${input.projectTitle}`,
      sections,
    };
  }
}
