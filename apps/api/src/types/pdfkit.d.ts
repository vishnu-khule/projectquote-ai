declare module "pdfkit" {
  import type { Readable } from "node:stream";
  class PDFDocument extends Readable {
    constructor(options?: Record<string, unknown>);
    fontSize(size: number): this;
    fillColor(color: string): this;
    text(text: string, x?: number, y?: number, options?: Record<string, unknown>): this;
    moveDown(lines?: number): this;
    addPage(): this;
    end(): void;
  }
  export default PDFDocument;
}
