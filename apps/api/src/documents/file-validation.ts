const MAX_BYTES = 25 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateUpload(file: {
  mimetype: string;
  size: number;
  originalname: string;
}): void {
  if (file.size > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new Error("FILE_TYPE_NOT_ALLOWED");
  }
  if (!file.originalname?.trim()) {
    throw new Error("FILE_NAME_REQUIRED");
  }
}

export { MAX_BYTES as MAX_UPLOAD_BYTES };
