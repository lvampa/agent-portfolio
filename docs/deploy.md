# Frontend deploys

The frontend in `portfolio/` is a Next.js static export hosted on Cloudflare Pages.

## How a deploy happens

A push to `main` that touches `portfolio/**`, `deploy-frontend.yml`, or `frontend-checks.yml` runs `.github/workflows/deploy-frontend.yml`.
The `checks` job runs type check, lint, format check, tests, and the production build, then uploads `portfolio/out` as the `site` artifact.
The `deploy` job runs in the `production` environment and uploads that artifact with `wrangler pages deploy`.
It then curls the deployment URL and `SITE_URL` and fails if either does not return an HTML page.
The job summary lists the commit, deployment URL, site URL, and Pages deployment ID.

Deploys queue instead of cancelling each other, so a running deploy always finishes.

## Configuration

Set these under Settings, Secrets and variables, Actions.

| Name | Kind | Scope | Used for |
|------|------|-------|----------|
| `CF_API_TOKEN` | Secret | `production` environment | Cloudflare token scoped to Pages edit |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | Repository | Cloudflare account |
| `CF_PAGES_PROJECT` | Variable | Repository | Pages project name |
| `SITE_URL` | Variable | Repository | Production URL for the smoke check |
| `NEXT_PUBLIC_CHAT_WEBHOOK_URL` | Variable | Repository | Inlined into the build |
| `NEXT_PUBLIC_INFO_URL` | Variable | Repository | Inlined into the build |

The checks job fails early if either `NEXT_PUBLIC_*` variable is empty.
The deploy job fails early if `CLOUDFLARE_ACCOUNT_ID`, `CF_PAGES_PROJECT`, or `SITE_URL` is empty.

## Redeploy

Go to Actions, "Deploy frontend to Cloudflare Pages", "Run workflow", and pick `main`.
This rebuilds and deploys the current head of `main`.

## Roll back

1. In the Cloudflare dashboard, open Workers & Pages, then the Pages project, then Deployments.
2. On the last good production deployment, open the menu and choose "Rollback to this deployment".
3. Revert the bad commit on `main` with a PR.
   Otherwise the next push that touches `portfolio/` deploys it again.

The rollback is instant and does not run a build.
See https://developers.cloudflare.com/pages/configuration/rollbacks/.
