import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import type { ProposalSection } from "@projectquote/schemas";

@Injectable()
export class PdfService {
  async renderProposalPdf(input: {
    title: string;
    organizationName: string;
    sections: ProposalSection[];
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk as Buffer));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(20).text(input.title, { align: "center" });
      doc.moveDown();
      doc.fontSize(10).fillColor("#64748b").text(input.organizationName, {
        align: "center",
      });
      doc.fillColor("#000000");
      doc.moveDown(2);

      const ordered = [...input.sections].sort((a, b) => a.order - b.order);
      for (const section of ordered) {
        doc.addPage().fontSize(14).text(section.title, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(section.content, { lineGap: 4 });
      }

      doc.end();
    });
  }
}
