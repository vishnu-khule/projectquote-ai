import { Injectable } from "@nestjs/common";
import { ExtractedProjectDataSchema } from "@projectquote/schemas";
import type { ExtractedProjectData } from "@projectquote/schemas";
import * as XLSX from "xlsx";

@Injectable()
export class DocumentParserService {
  async parse(
    mimeType: string,
    buffer: Buffer,
    fileName: string,
  ): Promise<ExtractedProjectData> {
    const base = this.emptyExtraction();

    if (mimeType === "application/pdf") {
      const text = await this.parsePdf(buffer);
      return this.fromPlainText(text, base, "pdf");
    }

    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel"
    ) {
      return this.parseSpreadsheet(buffer, base);
    }

    if (mimeType === "text/csv" || mimeType === "text/plain") {
      const text = buffer.toString("utf8");
      return this.fromPlainText(text, base, mimeType === "text/csv" ? "csv" : "text");
    }

    if (mimeType.startsWith("image/")) {
      return {
        ...base,
        missingInformation: [
          "Image OCR is not enabled in MVP; describe dimensions and materials in chat.",
        ],
        confidence: 0.1,
        sources: [
          {
            type: "document",
            fieldPath: fileName,
            excerpt: "Image uploaded; text extraction deferred",
            confidence: 0.1,
          },
        ],
      };
    }

    return base;
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    const pdfParse = (await import("pdf-parse")).default as (
      data: Buffer,
    ) => Promise<{ text: string }>;
    const result = await pdfParse(buffer);
    return result.text ?? "";
  }

  private parseSpreadsheet(
    buffer: Buffer,
    base: ExtractedProjectData,
  ): ExtractedProjectData {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const tables: Record<string, unknown>[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });
      tables.push({ sheet: sheetName, rows });
    }
    const preview = JSON.stringify(tables).slice(0, 4000);
    return {
      ...base,
      materials: tables,
      scope: workbook.SheetNames,
      confidence: tables.length > 0 ? 0.75 : 0.3,
      sources: [
        {
          type: "document",
          fieldPath: "spreadsheet",
          excerpt: preview,
          confidence: 0.75,
        },
      ],
      missingInformation: [],
    };
  }

  private fromPlainText(
    text: string,
    base: ExtractedProjectData,
    kind: string,
  ): ExtractedProjectData {
    const trimmed = text.trim();
    const dimensions = this.extractDimensions(trimmed);
    return ExtractedProjectDataSchema.parse({
      ...base,
      ...dimensions,
      scope: trimmed ? [trimmed.slice(0, 500)] : [],
      customerRequirements: trimmed ? [trimmed.slice(0, 2000)] : [],
      confidence: trimmed.length > 50 ? 0.7 : 0.35,
      sources: [
        {
          type: "document",
          fieldPath: kind,
          excerpt: trimmed.slice(0, 1500),
          confidence: trimmed.length > 50 ? 0.7 : 0.35,
        },
      ],
    });
  }

  private extractDimensions(text: string): Partial<ExtractedProjectData> {
    const match = text.match(
      /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(ft|feet|m|meter|meters)?/i,
    );
    if (!match) return {};
    const unitRaw = (match[3] ?? "ft").toLowerCase();
    const unit =
      unitRaw.startsWith("m") ? "m" : unitRaw.startsWith("f") ? "ft" : "ft";
    return {
      dimensions: {
        length: Number(match[1]),
        width: Number(match[2]),
        unit,
      },
    };
  }

  private emptyExtraction(): ExtractedProjectData {
    return ExtractedProjectDataSchema.parse({
      materials: [],
      scope: [],
      labour: [],
      quantities: [],
      pricing: [],
      customerRequirements: [],
      assumptions: [],
      missingInformation: [],
      confidence: 0,
      sources: [],
    });
  }
}
