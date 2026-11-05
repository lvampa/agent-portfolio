# Frontend deploys

The frontend in `portfolio/` is a Next.js static export hosted on Cloudflare Pages.

## How a deploy happens

Merging a PR to `main` that touches `portfolio/**` or `deploy-frontend.yml` runs `.github/workflows/deploy-frontend.yml`.
The PR already passed `ci`, so the deploy does not repeat the checks.
The `build` job builds with the real URLs and uploads `portfolio/out` as the `site` artifact.
It has no secrets, so dependency install scripts never see the Cloudflare token.
The `deploy` job runs in the `production` environment and uploads that artifact with `wrangler pages deploy`.
It then curls the deployment URL and `SITE_URL` and fails if either does not return an HTML page.
It also curls `$SITE_URL/info` and fails unless it returns JSON with a `timestamp`, which catches a lost Worker route.
The job summary lists the commit, deployment URL, site URL, and Pages deployment ID.

Deploys queue instead of cancelling each other, so a running deploy always finishes.

## Configuration

Set these under Settings, Secrets and variables, Actions.

| Name | Kind | Scope | Used for |
|------|------|-------|----------|
| `CF_API_TOKEN` | Secret | `production` environment | Account-owned Cloudflare token with Account > Pages > Edit only, with an expiry |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | Repository | Cloudflare account |
| `CF_PAGES_PROJECT` | Variable | Repository | Pages project name |
| `SITE_URL` | Variable | Repository | Production URL for the smoke check |
| `NEXT_PUBLIC_CHAT_WEBHOOK_URL` | Variable | Repository | Inlined into the build |

The three Cloudflare variables come from tofu outputs, set as in `docs/specs/cloudflare-pages-and-worker.md` migration step 5.
Tofu also sets the Pages project's production branch to `main`, in `infra/modules/site`.
The build fails if `NEXT_PUBLIC_CHAT_WEBHOOK_URL` is missing or not a URL, because `portfolio/lib/env.ts` validates it when `next.config.ts` loads.
Client info needs no variable: the site calls `/info` on its own origin, which the client-info Worker serves.
The deploy job fails early if `CLOUDFLARE_ACCOUNT_ID`, `CF_PAGES_PROJECT`, or `SITE_URL` is empty.

## Security headers

`portfolio/public/_headers` sets the Content-Security-Policy and the other security headers for every page, and Pages serves it as is.
Nothing in it is derived at build time, so two changes need a hand edit there:

- If the origin of `NEXT_PUBLIC_CHAT_WEBHOOK_URL` changes, change `connect-src` to match, or the chat is blocked.
- Cloudflare Web Analytics would need `https://static.cloudflareinsights.com` in `script-src` and `https://cloudflareinsights.com` in `connect-src`.

The same file marks the `*.pages.dev` hostnames `noindex`, so only the apex is indexed.

## Redeploy

Open the latest run of "Deploy frontend to Cloudflare Pages" under Actions and choose "Re-run all jobs".
Only re-run the latest one: re-running an older run deploys that older commit over the current site.
It rebuilds the same commit with the current variables, which is how to pick up a changed `NEXT_PUBLIC_*` value.

## Roll back

1. In the Cloudflare dashboard, open Workers & Pages, then the Pages project, then Deployments.
2. On the last good production deployment, open the menu and choose "Rollback to this deployment".
3. Revert the bad commit on `main` with a PR.
   Otherwise the next push that touches `portfolio/` deploys it again.

The rollback is instant and does not run a build.
It does not roll back the client-info Worker at `/info`, which deploys with `tofu apply` from `infra/`.
See https://developers.cloudflare.com/pages/configuration/rollbacks/.
