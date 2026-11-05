# Cloudflare Pages and the client-info Worker as code

## Problem

The frontend deploy targets a Cloudflare Pages project that does not exist.
The old AWS hosting is gone, so the site is down, and the apex DNS record made by hand points at nothing.
Nothing in the repo records the apex or `www` records.

The client-info Worker `solitary-breeze-9668` and its route `connorabdelnoor.com/info*` exist only in the Cloudflare account.
Its source is not in the repo.
It reads `request.cf?.org`, which does not exist, so `organization` is always `Unknown`.
It sends a `deviceType` the UI does not use, because the device line comes from ua-parser-js in the browser (`lib/utils/clientInfo.ts`).
The browser calls it cross-origin through `NEXT_PUBLIC_INFO_URL`.

## Goals

- Tofu creates the Pages project with `production_branch = "main"`, its apex custom domain, and the apex and `www` records.
- `www` redirects to the apex with a 301, keeping path and query.
- Tofu owns the Worker and its route, with the source in the repo.
- The frontend calls `/info` on its own origin, and `NEXT_PUBLIC_INFO_URL` goes away.
- The site comes back on Pages. Nothing is live, so the migration needs no downtime planning or rollback path.
- The GitHub variables come from tofu outputs.

## Decision

- The Worker stays its own Worker, imported into tofu as `cloudflare_workers_script` with its source at `infra/workers/info/index.js`.
- Its route `connorabdelnoor.com/info*` is imported as `cloudflare_workers_route`.
- Tofu creates the Pages project as direct upload and protects it with `prevent_destroy`.
- Tofu adds the apex custom domain and points the apex record at the project.
- The frontend calls the relative path `/info` in every environment.
  Plain `npm run dev` has no `/info`, so it runs without client info.
  There is no `dev:full`, no Pages Function, and no wrangler dev dependency.

## Checks

**Provider 5.28.0 forces replacement on these.**
In `internal/services/*/schema.go` at `v5.28.0`, these attributes have `RequiresReplace`:

- `cloudflare_workers_script.script_name`.
  Renaming the Worker deletes it and creates a new one, so the name stays `solitary-breeze-9668`.
- `cloudflare_dns_record.type`.
  Changing an A or AAAA record to a CNAME is a destroy, then a create.
- `cloudflare_pages_project.name` and `cloudflare_pages_domain.name`.

`cloudflare_workers_script.content` is not read back from the API (`json:"-"` in `model.go`).
So after import, the first plan shows an in-place update that uploads the repo source.

**The API does not create the Pages CNAME.**
The `cloudflare_pages_domain` doc says "A DNS record for the domain is not automatically created" ([pages_domain.md](https://github.com/cloudflare/terraform-provider-cloudflare/blob/v5.28.0/docs/resources/pages_domain.md)).
Only the dashboard creates it ([custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)).
A CNAME to `*.pages.dev` without the domain first associated with the project returns 522 (same page).
So the apex record `depends_on` the `cloudflare_pages_domain`.

**A Pages custom domain may refuse a hostname that already has a Worker route.**
Pages known issues: "It is currently not possible to add a custom domain with ... a Worker already routed on that domain" ([known issues](https://developers.cloudflare.com/pages/platform/known-issues/#custom-domains)).
It does not say whether a path route like `/info*` counts.
Migration step 3 deletes the route by hand, and tofu recreates it after the domain, so this cannot block the domain.

**Route precedence over Pages: not confirmed by the docs.**
Workers routes docs say a route takes precedence over a Workers Custom Domain on the same hostname, and that a route's `fetch()` goes to the origin in DNS ([routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)).
No Cloudflare page I found states the same for a Pages custom domain.
Migration step 6 checks it on the live apex.
The route pattern `connorabdelnoor.com/info*` matches `/info`, `/info/x`, `/infoX`, and any query string (same page).
That is harmless: the site has no other path starting with `/info`.
A route only runs on a proxied record (same page), and the apex record is proxied.

**One ruleset per phase per zone.**
"Each phase has at most one entry point ruleset at the account level and at the zone level" ([rulesets](https://developers.cloudflare.com/ruleset-engine/about/rulesets/)).
The rate-limit ruleset in `infra/cloudflare.tf` is phase `http_ratelimit`.
The redirect is phase `http_request_dynamic_redirect` ([single redirects API](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-api/)), so it is a second, separate `cloudflare_ruleset`.
If the zone already has a redirect entry point ruleset from the dashboard, tofu must import it, and its rules get replaced.

**`www` needs a proxied record, and its target never matters.**
The redirect rule answers every `www` request at the edge, so the record is a proxied CNAME to the apex, which reads as what it is.

## Infra design

### Resources and import IDs

Pinned provider: `cloudflare/cloudflare ~> 5.28`, locked at `5.28.0`.

| Resource | Created or imported | Import ID | Docs |
|---|---|---|---|
| `cloudflare_pages_project` | Created | `<account_id>/<project_name>` | [pages_project.md](https://github.com/cloudflare/terraform-provider-cloudflare/blob/v5.28.0/docs/resources/pages_project.md) |
| `cloudflare_pages_domain` | Created | `<account_id>/<project_name>/<domain_name>` | [pages_domain.md](https://github.com/cloudflare/terraform-provider-cloudflare/blob/v5.28.0/docs/resources/pages_domain.md) |
| `cloudflare_dns_record` (apex) | Created, after the old record is deleted | `<zone_id>/<dns_record_id>` | [dns_record.md](https://github.com/cloudflare/terraform-provider-cloudflare/blob/v5.28.0/docs/resources/dns_record.md) |
| `cloudflare_dns_record` (`www`) | Created | `<zone_id>/<dns_record_id>` | same |
| `cloudflare_ruleset` (redirect) | Created | `zones/<zone_id>/<ruleset_id>` | [ruleset.md](https://github.com/cloudflare/terraform-provider-cloudflare/blob/v5.28.0/docs/resources/ruleset.md) |
| `cloudflare_workers_script` | Imported | `<account_id>/<script_name>` | [workers_script.md](https://github.com/cloudflare/terraform-provider-cloudflare/blob/v5.28.0/docs/resources/workers_script.md) |
| `cloudflare_workers_route` | Created, after the old route is deleted | `<zone_id>/<route_id>` | [workers_route.md](https://github.com/cloudflare/terraform-provider-cloudflare/blob/v5.28.0/docs/resources/workers_route.md) |

### Module `infra/modules/site`

A module, so it can be tested like `tests/ec2.tftest.hcl` and `tests/ecs.tftest.hcl`.
Files: `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf` (requires `cloudflare/cloudflare`).

```hcl
resource "cloudflare_pages_project" "site" {
  account_id        = var.account_id
  name              = var.project_name
  production_branch = "main"

  lifecycle {
    # Replacing the project deletes every deployment, and with them Pages rollback.
    prevent_destroy = true
  }
}

resource "cloudflare_pages_domain" "apex" {
  account_id   = var.account_id
  project_name = cloudflare_pages_project.site.name
  name         = var.hostname
}

resource "cloudflare_dns_record" "apex" {
  zone_id = var.zone_id
  name    = var.hostname
  type    = "CNAME"
  # The pages.dev subdomain gets a random suffix when the name is taken, so it is read, not built.
  content = cloudflare_pages_project.site.subdomain
  ttl     = 1
  proxied = true

  # A CNAME to pages.dev before Pages knows the domain returns 522.
  depends_on = [cloudflare_pages_domain.apex]
}

resource "cloudflare_dns_record" "www" {
  zone_id = var.zone_id
  name    = "www.${var.hostname}"
  type    = "CNAME"
  content = var.hostname
  ttl     = 1
  proxied = true
}

# Cloudflare allows one redirect ruleset per zone, so rules added in the dashboard would be overwritten here.
resource "cloudflare_ruleset" "www_redirect" {
  zone_id = var.zone_id
  name    = "Redirect www to apex"
  kind    = "zone"
  phase   = "http_request_dynamic_redirect"

  rules = [{
    description = "Redirect www to apex"
    expression  = "http.host eq \"www.${var.hostname}\""
    action      = "redirect"
    enabled     = true
    action_parameters = {
      from_value = {
        status_code           = 301
        preserve_query_string = true
        target_url = {
          expression = "concat(\"https://${var.hostname}\", http.request.uri.path)"
        }
      }
    }
  }]
}

resource "cloudflare_workers_script" "info" {
  account_id         = var.account_id
  script_name        = var.worker_name
  content            = var.worker_content
  main_module        = "index.js"
  compatibility_date = "2026-11-01"
}

resource "cloudflare_workers_route" "info" {
  zone_id = var.zone_id
  pattern = "${var.hostname}/info*"
  script  = cloudflare_workers_script.info.script_name
}
```

Variables: `account_id`, `zone_id`, `project_name`, `hostname`, `worker_name`, `worker_content`.
Outputs: `project_name`, `site_url` (`"https://${var.hostname}"`).
An apex CNAME works because Cloudflare flattens it.
`worker_content` is a variable so the test can pass a stub instead of reading a file.

### Root changes

- `main.tf`: `module "site"` with `account_id = var.cloudflare_account_id`, `zone_id = var.cloudflare_zone_id`, `project_name = var.pages_project_name`, `hostname = var.site_hostname`, `worker_name = "solitary-breeze-9668"`, and `worker_content = file("${path.module}/workers/info/index.js")`.
- `variables.tf`: `pages_project_name` and `site_hostname`.
- `outputs.tf`: `cloudflare_account_id`, `pages_project_name`, `site_url`, one per GitHub variable.

Setting the GitHub variables through the `integrations/github` provider was rejected.
It adds a provider and a token to manage three strings that rarely change.

### The Worker source

`infra/workers/info/index.js`, ported from the dashboard with these changes:

- `organization` reads `request.cf.asOrganization`, not `request.cf.org`.
- `deviceType` is gone.
- The CORS headers are gone, because the only caller is the same origin.
- The response sends `Cache-Control: no-store`, because it describes one visitor.

```js
export default {
  fetch(request) {
    const cf = request.cf ?? {};
    const header = (name) => request.headers.get(name);

    const info = {
      ip: header('cf-connecting-ip'),
      country: header('cf-ipcountry'),
      city: cf.city ?? 'Unknown',
      latitude: cf.latitude ?? 'Unknown',
      longitude: cf.longitude ?? 'Unknown',
      asn: cf.asn ?? 'Unknown',
      organization: cf.asOrganization ?? 'Unknown',
      timezone: cf.timezone ?? 'Unknown',
      userAgent: header('user-agent'),
      acceptLanguage: header('accept-language'),
      acceptEncoding: header('accept-encoding'),
      referer: header('referer') ?? 'Direct',
      tlsVersion: cf.tlsVersion ?? 'Unknown',
      tlsCipher: cf.tlsCipher ?? 'Unknown',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(info, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  },
};
```

`asn` stays a number when present, which `ClientInfoRequestSchema` accepts.
Keep the current Worker's defaults for `ip` and `country` when porting.
The schema allows null for both.

## Frontend changes

- `lib/api/constants.ts` gets `INFO_PATH = '/info'`.
- `lib/api/index.ts` becomes `export const infoClient = new Client(INFO_PATH);`.
  Axios resolves the relative base URL against the page's origin.
- `lib/hooks/schemas.ts`: drop `deviceType` from `ClientInfoRequestSchema`, and from the fixtures in `lib/hooks/__tests__/schemas.test.ts` and `lib/utils/__tests__/clientInfo.test.ts`.
  Zod strips unknown keys, so the new schema still accepts the old Worker's output.
- `lib/env.ts` validates only `NEXT_PUBLIC_CHAT_WEBHOOK_URL`.

Remove `NEXT_PUBLIC_INFO_URL` from:

- `lib/env.ts` and `lib/__tests__/env.test.ts` (the `INFO_URL` constant and its `beforeEach` line; rename "loads when both URLs are set" to "loads when the URL is set").
- `jest.config.ts` (the `??=` default).
- `.github/workflows/ci.yml` (the placeholder in the frontend job).
- `.github/workflows/deploy-frontend.yml` (the build env).
- `docs/deploy.md` (the variables table and the sentence about both `NEXT_PUBLIC_*` variables).
- The GitHub repository variables (migration step 7).

With `npm run dev`, `/info` is a 404 from `next dev`, so `useClientInfo` leaves `request` null and the startup skips the client info step.

## CI and deploy changes

- `deploy-frontend.yml` smoke check: also fetch `$SITE_URL/info` and require JSON with a `timestamp` (`jq -e '.timestamp'`).
  This catches a lost route.
- Drop `NEXT_PUBLIC_INFO_URL` from both workflows.
- The `ci.yml` infra job already runs `tofu fmt`, `validate`, and `test`, so it picks up the module and test.

## Tokens

**Tofu token (`cloudflare_api_token`)**, final list:

- Account > Cloudflare Tunnel > Edit (existing)
- Account > Access: Apps and Policies > Edit (existing)
- Account > Cloudflare Pages > Edit (new)
- Account > Workers Scripts > Edit (new)
- Zone > DNS > Edit (existing)
- Zone > Zone WAF > Edit (existing, for the rate-limit ruleset)
- Zone > Workers Routes > Edit (new)
- Zone > Single Redirect > Edit (new, for the `http_request_dynamic_redirect` ruleset)

**Deploy token (`CF_API_TOKEN`)**: unchanged, Account > Cloudflare Pages > Edit only.

## Tests

### Infra

`infra/tests/site.tftest.hcl`.
It uses `command = apply`, which runs only against the mock provider, so the computed `subdomain` has a value.

```hcl
mock_provider "cloudflare" {
  mock_resource "cloudflare_pages_project" {
    defaults = {
      subdomain = "portfolio-a1b.pages.dev"
    }
  }
}

variables {
  account_id     = "test-account"
  zone_id        = "test-zone"
  project_name   = "portfolio"
  hostname       = "example.com"
  worker_name    = "info"
  worker_content = "export default {};"
}

run "applies" {
  command = apply

  module {
    source = "./modules/site"
  }

  assert {
    condition     = cloudflare_pages_project.site.production_branch == "main"
    error_message = "The deploy uses --branch=main, so the production branch must be main."
  }

  assert {
    condition     = cloudflare_workers_route.info.pattern == "example.com/info*" && cloudflare_workers_route.info.script == "info"
    error_message = "The info Worker must serve /info on the site's own host."
  }

  assert {
    condition = (
      cloudflare_ruleset.www_redirect.rules[0].expression == "http.host eq \"www.example.com\"" &&
      cloudflare_ruleset.www_redirect.rules[0].action_parameters.from_value.target_url.expression == "concat(\"https://example.com\", http.request.uri.path)" &&
      cloudflare_ruleset.www_redirect.rules[0].action_parameters.from_value.status_code == 301 &&
      cloudflare_ruleset.www_redirect.rules[0].action_parameters.from_value.preserve_query_string
    )
    error_message = "www must 301 to the apex and keep the path and query."
  }

  assert {
    condition     = cloudflare_dns_record.apex.content == "portfolio-a1b.pages.dev" && cloudflare_dns_record.apex.proxied
    error_message = "The apex must be proxied, for the Worker route, and point at the project's real pages.dev subdomain."
  }
}
```

### Frontend

No Worker test.
The only cheap one would import a file outside `portfolio/` into Jest and TypeScript, which needs config changes.
Step 7's checks and the `/info` smoke check cover the contract instead.

## Migration

Connor runs every step.
Nothing is live today, so the steps favor simple over seamless.

1. **Read-only checks.**
   - Find the apex, `www`, and route records, and the zone rulesets:
     ```bash
     for name in "$SITE_HOSTNAME" "www.$SITE_HOSTNAME"; do
       curl -s -H "Authorization: Bearer $TOFU_TOKEN" \
         "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$name" \
         | jq '.result[] | {id, type, name, content, proxied}'
     done
     curl -s -H "Authorization: Bearer $TOFU_TOKEN" "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" | jq '.result'
     curl -s -H "Authorization: Bearer $TOFU_TOKEN" "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" | jq '.result[] | {id, phase, kind, name}'
     ```
   - Note the Worker's compatibility date, flags, bindings, and observability in the dashboard, so the config matches them.
2. **Widen the tofu token** with the four new permissions.
3. **Delete the dead records by hand:** the apex record that pointed at AWS, any `www` record, and the `/info*` route.
   Tofu creates all three fresh, with the route after the Pages domain, so Pages never sees a route on a host it is being added to.
   If a zone ruleset with phase `http_request_dynamic_redirect` exists, delete it too.
4. **Infra PR: the whole `site` module**, with `pages_project_name` and `site_hostname` in `terraform.tfvars`.
   After it merges, from `infra/`, import only the Worker:
   ```bash
   tofu import 'module.site.cloudflare_workers_script.info' "$ACCOUNT_ID/solitary-breeze-9668"
   ```
   `tofu plan` must show creates for the Pages project, Pages domain, apex and `www` records, ruleset, and route, plus an in-place update to the Worker, and no destroys.
   If the Worker shows other diffs, such as observability or bindings, copy them into the config until only the content update remains.
   Apply, then plan again: it must be empty.
5. **Set the GitHub variables from outputs:**
   ```bash
   gh variable set CLOUDFLARE_ACCOUNT_ID --body "$(tofu output -raw cloudflare_account_id)"
   gh variable set CF_PAGES_PROJECT --body "$(tofu output -raw pages_project_name)"
   gh variable set SITE_URL --body "$(tofu output -raw site_url)"
   ```
6. **Frontend PR** (relative `/info`, `deviceType` and env removal, smoke check).
   The deploy runs on merge and lands on the apex.
   Verify:
   - `curl -s https://$SITE_HOSTNAME/` returns the site.
   - `curl -si https://$SITE_HOSTNAME/info` returns JSON with a real `organization`, `cache-control: no-store`, and no `access-control-allow-origin`.
   - `curl -sI "https://www.$SITE_HOSTNAME/a/b?x=1"` returns 301 to `https://$SITE_HOSTNAME/a/b?x=1`.
   - The site shows client info, and chat works.
   If `/info` returns the site's HTML instead of JSON, the route is not taking precedence over the Pages domain; stop and revisit the design.
7. **Clean up:** `gh variable delete NEXT_PUBLIC_INFO_URL`, and optionally turn off the Worker's `workers.dev` URL, since nothing calls it.
   Confirm the old AWS deploy IAM role and the GitHub OIDC provider are gone along with the hosting.

## Docs to update

- `infra/README.md`: Pages and Workers in Technologies, the new variables, the four new token permissions, the new outputs, and a link to this spec for the import.
- `infra/docs/networking.md`: add the visitor-to-site path to the Mermaid diagram: apex to Pages, `/info` to the Worker, `www` redirected to the apex.
- `docs/deploy.md`: drop `NEXT_PUBLIC_INFO_URL`, say the three Cloudflare variables come from tofu outputs and the production branch is set in tofu, and mention the `/info` smoke check.
  Note that a Pages rollback does not roll back the Worker, which deploys with `tofu apply`.
- `portfolio/README.md`: `npm run dev` runs without client info, which only exists on the deployed site.
- `CLAUDE.local.md` Decisions: client info is the tofu-managed Worker at `/info` with no env var, and tofu owns the Pages project, apex domain, `www` redirect, and DNS.

## Open questions

None.
The one unverified behavior, a Workers route winning over the Pages domain on `/info`, is checked in migration step 6.
