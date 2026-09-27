# Product requirements (PRD)

## Vision

**ProjectQuote AI** helps trades and contractors produce professional proposals and estimates by combining conversational requirements, document intelligence, deterministic pricing/math, and human approval before anything reaches a customer.

## Target users

Engineers, plumbers, electricians, carpenters, furniture makers, interior and civil contractors, technicians, fabricators, and small general contractors.

## Core workflow

1. Describe project (chat) and attach reference files.
2. System extracts and merges requirements; asks for missing critical fields.
3. User confirms scope and pricing sources.
4. Estimation engine computes totals (not the LLM).
5. Proposal narrative generated from validated structured data.
6. User reviews, edits, approves.
7. PDF generated and shared via secure link.

## Product principles

1. **LLM assists; code decides money** — quantities, tax, discounts, and totals are deterministic.
2. **Provenance** — AI-suggested values require confirmation and show source/confidence.
3. **Human-in-the-loop** — no auto-send to customers.
4. **Modular professions** — project types configured via JSON, not hard-coded branches.
5. **Version everything** — estimates, proposals, prompts, and AI runs are auditable.

## Success metrics (MVP)

- Time to first draft proposal &lt; 15 minutes for a standard kitchen/bathroom project.
- &gt; 90% of line-item totals match manual spreadsheet on golden test cases.
- Document extraction usable without retyping for 70%+ of text PDFs in eval set.
- User completes review/approve flow without support.

## Out of scope (MVP)

- Customer e-signature, CRM/accounting integrations, voice, multi-language, diagram dimension extraction.
