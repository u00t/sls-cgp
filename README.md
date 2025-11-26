# 🌐 Serverless CRUD on AWS

Serverless CRUD API on AWS (API Gateway + Lambda + DynamoDB) with a React + Vite + Tailwind front-end and GitHub Actions deployments.

## ✨ Overview

- Backend: TypeScript Lambdas packaged by Serverless Framework + esbuild, exposed via HTTP API Gateway, data stored in DynamoDB (on-demand throughput).
- Frontend: Vite + React 19 + Tailwind UI to create, read, update, delete, and filter items against the API.
- CI/CD: GitHub Actions deploys on pushes to `main` (or manual dispatch) using `sls deploy`.
- Environments: Stage is configurable via `--stage` (defaults to `dev`); table name is `${service}-${stage}-items`.

## 🗺️ Project layout

- `backend/serverless.yml` — infrastructure, routes, IAM, DynamoDB table.
- `backend/src/handlers/*.ts` — Lambda handlers for CRUD.
- `backend/src/lib/*` — shared utilities (DynamoDB client, HTTP helpers).
- `frontend/src` — React app, API client (`api.ts`), styles (`App.css`, `index.css`).
- `.github/workflows/deploy.yml` — CI/CD pipeline.
- `docs/` — place screenshots such as `docs/ci-cd-run.png`, `docs/deployed-stack.png`.

## 🛠️ Prerequisites

- Node.js 18+ and npm.
- AWS account with credentials available to the Serverless CLI.
- Serverless Framework CLI (`npm i -g serverless`) and an AWS profile or exported keys.
- For the UI, an API base URL from a deployed stage (set as `VITE_API_BASE`).

## 🚀 Quick start

Backend (deploy a stage):

1. `cd backend`
2. `npm install`
3. `sls deploy --stage dev --region us-east-1`
4. Copy the HTTP API endpoint shown in the deploy output.

Frontend (run locally against your API):

1. `cd frontend`
2. `npm install`
3. Create `.env.development` with `VITE_API_BASE=https://<api-id>.execute-api.<region>.amazonaws.com/dev`
4. `npm run dev` then open the printed URL.

## 🧰 Backend details

- Runtime: `nodejs18.x`; bundling via `serverless-esbuild`.
- HTTP routes: `POST /items`, `GET /items`, `GET /items/{id}`, `PUT /items/{id}`, `DELETE /items/{id}`.
- Permissions: IAM policy scoped to the single DynamoDB table.
- Local checks: `npm test` (runs ESLint). Local function execution: `sls invoke local -f createItem --data '{"name":"Test"}'`.
- Deploy different stages/regions: `sls deploy --stage prod --region eu-west-1`.

## 🎨 Frontend details

- React 19 + Vite 7 with Tailwind 4 styling; stateful dashboard for item CRUD and filtering.
- API base URL is read from `VITE_API_BASE`; omit it to use same-origin (when reverse-proxied).
- Key scripts: `npm run dev` (local), `npm run build`, `npm run preview`, `npm run lint`.
- UI shows connectivity meta, create form, live list with inline edit/delete, and error banners for API failures.

## 🔌 API shape

- `POST /items` → `201` + created item. Body: `{ "name": "string", "description": "string?" }`.
- `GET /items` → `200` + `{ items: [...] }`.
- `GET /items/{id}` → `200` + item or `404`.
- `PUT /items/{id}` → `200` + updated item (fields: `name`, `description`).
- `DELETE /items/{id}` → `204` or `404`.

Example update:

```bash
curl -X PUT "$API/items/ITEM_ID" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated name"}'
```

## 🤖 CI/CD

- Workflow: `.github/workflows/deploy.yml`.
- Trigger: push to `main` or manual `workflow_dispatch`.
- Steps: checkout → Node.js 18 → install Serverless CLI → install deps → assume AWS creds → `sls deploy --stage prod`.
- Secrets required: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. Optional: set `STAGE` env to override the stage name.

## 🧪 Useful commands

- Backend lint/test: `cd backend && npm test`
- Backend deploy: `cd backend && sls deploy --stage <stage> --region <region>`
- Frontend lint/build: `cd frontend && npm run lint && npm run build`
- Frontend serve build: `cd frontend && npm run preview`

## 📸 Docs

- Include CI/CD and AWS console screenshots in `docs/` and link them here:
  - `docs/ci-cd-run.png`
  - `docs/deployed-stack.png`
