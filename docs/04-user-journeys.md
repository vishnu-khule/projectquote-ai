# User journeys

## Journey A — New modular kitchen quote

1. Contractor clicks **New Project**, selects **Modular Kitchen**.
2. Describes job in chat: dimensions, finish preference; uploads old PDF quote.
3. System processes PDF, asks for location and hardware tier.
4. Contractor answers; reviews requirement summary.
5. Edits line items from catalog; confirms AI-suggested quantities.
6. Runs validation → PASS.
7. Generates proposal, tweaks payment terms, approves.
8. Downloads PDF and shares link with homeowner.

## Journey B — Missing data blocked

1. User requests estimate with only vague description.
2. System status `WAITING_FOR_INFORMATION` with 3 questions.
3. Estimate button disabled until required fields confirmed.
4. User provides data → `READY_FOR_ESTIMATION`.

## Journey C — Customer view

1. Customer opens `/shared/proposals/:token`.
2. Sees cover, scope, breakdown, total; downloads PDF.
3. No internal AI notes or unconfirmed suggestions exposed.
