# ERP PNF

ERP PNF is a Spanish-language ERP for Mexican construction companies.

## Project guidance

- Read [PRODUCT.md](PRODUCT.md) for product rules, roles, and domain vocabulary.
- Read [DESIGN.md](DESIGN.md) before changing visual design or UI patterns.
- Keep business authorization on the server and preserve company-level data isolation.

## Commands

- `npm run dev` — start the app
- `npm run typecheck` — check TypeScript
- `npm test` — run unit and other Vitest suites
- `npm run build` — create a production build

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
