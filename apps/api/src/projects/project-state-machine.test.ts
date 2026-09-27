import { test } from "node:test";
import assert from "node:assert/strict";
import { ProjectStatus } from "@prisma/client";
import {
  assertProjectStatusTransition,
  PROJECT_STATUS_TRANSITIONS,
} from "./project-state-machine.js";

test("DRAFT can move to DOCUMENT_PROCESSING", () => {
  assertProjectStatusTransition(
    ProjectStatus.DRAFT,
    ProjectStatus.DOCUMENT_PROCESSING,
  );
});

test("SHARED cannot jump to APPROVED without USER_REVIEW", () => {
  assert.throws(
    () =>
      assertProjectStatusTransition(ProjectStatus.SHARED, ProjectStatus.APPROVED),
    (err: Error & { code?: string }) => err.code === "INVALID_STATUS_TRANSITION",
  );
});

test("every failure state has at least one recovery path", () => {
  const failures: ProjectStatus[] = [
    ProjectStatus.DOCUMENT_PROCESSING_FAILED,
    ProjectStatus.AI_ANALYSIS_FAILED,
    ProjectStatus.VALIDATION_FAILED,
    ProjectStatus.PDF_GENERATION_FAILED,
  ];
  for (const status of failures) {
    assert.ok(
      (PROJECT_STATUS_TRANSITIONS[status]?.length ?? 0) > 0,
      `${status} should allow recovery`,
    );
  }
});
