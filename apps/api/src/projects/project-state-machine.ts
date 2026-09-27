import { ProjectStatus } from "@prisma/client";

export const PROJECT_STATUS_TRANSITIONS: Record<
  ProjectStatus,
  readonly ProjectStatus[]
> = {
  DRAFT: [
    "DOCUMENT_PROCESSING",
    "ANALYZING",
    "WAITING_FOR_INFORMATION",
    "READY_FOR_ESTIMATION",
  ],
  DOCUMENT_PROCESSING: ["ANALYZING", "DOCUMENT_PROCESSING_FAILED"],
  DOCUMENT_PROCESSING_FAILED: ["DRAFT", "DOCUMENT_PROCESSING"],
  ANALYZING: [
    "WAITING_FOR_INFORMATION",
    "READY_FOR_ESTIMATION",
    "AI_ANALYSIS_FAILED",
  ],
  AI_ANALYSIS_FAILED: ["DRAFT", "ANALYZING"],
  WAITING_FOR_INFORMATION: [
    "READY_FOR_ESTIMATION",
    "ANALYZING",
    "DRAFT",
  ],
  READY_FOR_ESTIMATION: ["ESTIMATION_GENERATED"],
  ESTIMATION_GENERATED: ["VALIDATION", "USER_REVIEW"],
  VALIDATION: ["PROPOSALS_GENERATED", "VALIDATION_FAILED", "USER_REVIEW"],
  VALIDATION_FAILED: [
    "READY_FOR_ESTIMATION",
    "ESTIMATION_GENERATED",
    "USER_REVIEW",
  ],
  PROPOSALS_GENERATED: ["USER_REVIEW"],
  USER_REVIEW: ["APPROVED", "ESTIMATION_GENERATED", "PROPOSALS_GENERATED"],
  APPROVED: ["PDF_GENERATED"],
  PDF_GENERATED: ["SHARED", "USER_REVIEW"],
  PDF_GENERATION_FAILED: ["APPROVED", "USER_REVIEW"],
  SHARED: ["USER_REVIEW"],
};

export function assertProjectStatusTransition(
  from: ProjectStatus,
  to: ProjectStatus,
): void {
  if (from === to) return;
  const allowed = PROJECT_STATUS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    const err = new Error(
      `Invalid status transition from ${from} to ${to}`,
    ) as Error & { code: string };
    err.code = "INVALID_STATUS_TRANSITION";
    throw err;
  }
}
