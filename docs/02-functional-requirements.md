# Functional requirements

## Auth & org

- Register, login, logout, password reset (email)
- User belongs to one or more organizations
- RBAC: owner, admin, member (MVP: owner + member)

## Projects

- Create project with type from config catalog
- Dashboard: list projects with status, customer, last estimate total
- State transitions driven by jobs and user actions

## AI assistant

- Streaming chat per project
- Attach files in chat or documents panel
- Suggested quick replies for common answers
- Display missing-information checklist

## Documents

- Upload with type/size validation
- Processing status and error messages
- View extraction summary with confidence and sources

## Requirements

- Matrix view: confirmed / missing / conflicting
- User can override and confirm fields

## Estimation

- Add/edit line items, units, prices, labour
- Price source badges; confirm AI suggestions
- Engine computes subtotal, discount, tax, grand total

## Proposals

- Generate from template + structured data
- Rich text edit per section
- Version history

## Approval & PDF

- Approve locks version for customer sharing
- Generate branded PDF (logo, terms)

## Sharing

- Create revocable link with optional expiry
- Track viewed / downloaded events

## Admin (Phase 2)

- Catalog, labour rates, tax, templates, project types
