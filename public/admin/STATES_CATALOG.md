# States catalog (student site and admin)

Everything below is built and shared through `states.js` (+ styles). Backend developers: call `TampNet.fetch(url, options, {retries, timeout})` for every API call. It classifies failures and the screens below appear automatically.

| State | What the user sees | Where | Trigger / how to test |
|---|---|---|---|
| Offline | Red banner "You are offline" + Try again; "Back online" message and auto-reload when it returns | every page | turn off the network; or Settings > Connection test > Offline |
| Slow connection | Yellow dismissible banner | every page | slow 2G or data-saver on the device |
| Loading | Skeleton screens, thin progress bar, button spinners, full-screen "Writing with AI" overlay | dashboard, admin, forms, AI | Connection test > Slow |
| Offline page | `offline.html` served by the service worker for pages never visited | student site | offline + open an unvisited page |
| Timeout (408) | "This is taking too long" + Try again | in-app and `408.html` | Connection test > Timeout |
| Server error (500/502/503) | "We couldn't load this" + Try again + error code | in-app and `error.html` | Connection test > Server error / Unreliable |
| Not found (404) | Friendly page with a way home | public pages, dashboard, admin | open a wrong address or route |
| Forbidden (403) | "You do not have access" | `403.html`, admin role screen | admin role without permission |
| Unauthorized (401) | "Please log in again" -> login | automatic on 401, idle timeout, logout in another tab | wait 45 min idle, or log out in another tab |
| Too many requests (429) | "Please wait N seconds" + retry after Retry-After | in-app and `429.html` | API rate limit |
| Maintenance | Maintenance page for all student pages | `maintenance.html` | Admin > Settings > Maintenance mode = on |
| Unsupported browser | Update-your-browser page | `unsupported-browser.html` | very old browser |
| JavaScript off | Yellow notice | every page | disable JavaScript |
| Storage blocked | Banner explaining private mode | every page | block site data |
| Unexpected error | "Something went wrong" with an error code; error saved to `tamp_errors` | every page | any uncaught script error |
| Payment failed | `payment-failed.html` and an in-app message | enroll box | Enroll > Demo: failed payment |
| Cohort full | `cohort-full.html` with waitlist form | student site | backend marks cohort full |
| Session expired | `session-expired.html` | student site | idle or logout elsewhere |
| Account locked / suspended | Clear messages on login | login | 5 wrong passwords; admin suspends |
| Reset link invalid or expired | Explanation + request new link | reset page | reuse or wait 30 minutes |
| Empty states | Plain explanation + next step | lists everywhere | new account |
| Form states | Inline errors, disabled + spinner on submit, success confirmation | all forms | submit a form |

Demo tools to remove before launch: Settings > Connection test, the `?sim=offline|slow|error|timeout|flaky` address option, and `tamp_sim` in browser storage.
