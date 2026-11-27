# Logan's Briefs

A home-screen web app that holds the Daily, Gym and Inbox briefs and sends a phone notification when each one lands.

## How it works
- Scheduled tasks write each brief's JSON, encrypt it with `tools/publish.mjs`, and commit `data/<daily|gym|inbox>.json`.
- Briefs are encrypted (AES-256-GCM, key from a passphrase via PBKDF2). The repo is public, so only the push title and body in each file are readable. Keep those free of private details.
- `templates/` holds the branded brief designs. The app decrypts a brief on the phone and renders it into its template.
- `.github/workflows/notify.yml` runs on every brief commit and sends a web push to each saved subscription.

## Repo secrets (Settings → Secrets and variables → Actions)
| Name | Value |
|---|---|
| `VAPID_PUBLIC` | The public key in `index.html` |
| `VAPID_PRIVATE` | The private key (never commit it) |
| `VAPID_SUBJECT` | `mailto:` plus your email |
| `PUSH_SUBSCRIPTIONS` | A JSON array of push codes copied from the app's More screen |

## Install on iPhone
Open the Pages URL in Safari → Share → Add to Home Screen → open it from the icon → enter the passphrase → More → Turn on notifications → copy the push code.
