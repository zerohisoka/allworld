# AURA — Deployment Guide

Step-by-step instructions to deploy AURA (Automated MIS Intelligence) to production on Vercel with Supabase, Dodo Payments, Resend, and GitHub Actions cron jobs.

---

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier works for development)
- A [Vercel](https://vercel.com) account (Hobby tier works)
- A [Dodo Payments](https://dodopayments.com) account (for billing)
- A [Resend](https://resend.com) account (for transactional email)
- This repo cloned locally

---

## Step 1 — Supabase Project

### 1a. Create the project

1. Go to [supabase.com/dashboard/projects](https://supabase.com/dashboard/projects) and click **New project**
2. Set a name (e.g. `aura-production`)
3. Set a secure database password
4. Choose a region close to your users
5. Wait for the database to provision (~2 minutes)

### 1b. Run the schema migration

1. In the Supabase dashboard, go to **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql` from this repo
3. Paste the entire file into the SQL Editor
4. Click **Run** — this creates all tables, indexes, RLS policies, triggers, and helper functions

### 1c. Enable Auth

1. Go to **Authentication → Settings**
2. Under **Email Auth**, make sure email/password sign-up is enabled
3. Optionally enable **Magic Link** under **Email Auth → Confirm email**
4. Add these Site URLs:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: `http://localhost:3000/**`, `https://<your-app>.vercel.app/**`

> **Note**: The schema includes a trigger `on_auth_user_created` that automatically creates an organization and adds the user as admin when they sign up. No manual org creation needed.

### 1d. Get API keys

In the Supabase dashboard, go to **Project Settings → API** and copy:

- **Project URL** → used as `NEXT_PUBLIC_SUPABASE_URL`
- **Anon public key** → used as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service role key** → used as `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — never expose it client-side)

---

## Step 2 — Environment Variables

### 2a. Create `.env.local` for local development

```bash
cp .env.example .env.local
```

Then fill in the values (see table below).

### 2b. Complete variable reference

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only) | `eyJhbGciOiJIUzI1NiIs...` |
| `DODO_API_KEY` | ✅ | Dodo Payments API key | `sk_live_abc123...` |
| `DODO_WEBHOOK_SECRET` | ✅ | Dodo webhook signing secret | `whsec_abc123...` |
| `RESEND_API_KEY` | ✅ | Resend API key for transactional email | `re_abc123...` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your deployed app URL | `https://auramis.vercel.app` |
| `CRON_SECRET` | ✅ | Secret token for GitHub Actions cron auth | any random string (see Step 4) |
| `DODO_STARTER_PRODUCT_ID` | ✅ | Dodo product ID for Starter (monthly) | `prod_abc123` |
| `DODO_STARTER_ANNUAL_PRODUCT_ID` | ✅ | Dodo product ID for Starter (annual) | `prod_abc124` |
| `DODO_GROWTH_PRODUCT_ID` | ✅ | Dodo product ID for Growth (monthly) | `prod_abc125` |
| `DODO_GROWTH_ANNUAL_PRODUCT_ID` | ✅ | Dodo product ID for Growth (annual) | `prod_abc126` |
| `DODO_ENTERPRISE_PRODUCT_ID` | ✅ | Dodo product ID for Enterprise (monthly) | `prod_abc127` |
| `DODO_ENTERPRISE_ANNUAL_PRODUCT_ID` | ✅ | Dodo product ID for Enterprise (annual) | `prod_abc128` |
| `DODO_PAYMENTS_ENVIRONMENT` | ❌ | Dodo environment | `test_mode` (default) or `live_mode` |
| `RESEND_FROM_EMAIL` | ❌ | Sender email address | `AURA <noreply@auramis.com>` |

---

## Step 3 — Deploy to Vercel

### 3a. Connect the repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository (the one with this AURA code)
3. Vercel will auto-detect Next.js and the `vercel.json` config

### 3b. Add environment variables

In the Vercel project settings, go to **Settings → Environment Variables** and add **every variable** from the table in Step 2b.

Make sure to add them to **Production**, **Preview**, and **Development** environments as needed.

### 3c. Deploy

1. Click **Deploy**
2. Vercel builds and deploys the app
3. Once complete, your app is live at `https://<your-project>.vercel.app`

### 3d. Update Supabase Site URL

After deploying, go back to Supabase **Authentication → Settings** and add your Vercel deployment URL to both **Site URL** (set it to your production URL) and **Redirect URLs**.

---

## Step 4 — GitHub Actions Secrets

The cron workflows need access to environment variables. Add these as **Actions secrets** in your GitHub repo:

1. Go to the repo on GitHub → **Settings → Secrets and variables → Actions**
2. Add these repository secrets:

| Secret | Value |
|---|---|
| `APP_URL` | Your Vercel deployment URL (e.g. `https://auramis.vercel.app`) |
| `CRON_SECRET` | The same value you set for `CRON_SECRET` in Vercel env vars |
| `DEFAULT_ORG_ID` | The UUID of an org to run alert checks for (get this from Supabase `organizations` table after creating an org) |

> **Important**: The `CRON_SECRET` value must be **identical** in both Vercel (`CRON_SECRET` env var) and GitHub (`CRON_SECRET` secret). Generate a strong random string — you can use `openssl rand -hex 32` on the command line.

### Cron workflows

Two cron jobs are configured:

| Workflow | File | Schedule | Purpose |
|---|---|---|---|
| **Check Alerts** | `.github/workflows/cron-alerts.yml` | Hourly (M–F, 6:00–18:00 UTC) | Fires enabled alert rules against unresolved reconciliation flags and sends email notifications |
| **Auto-Import** | `.github/workflows/cron-auto-import.yml` | Daily at 2:00 AM | Placeholder for Enterprise-tier scheduled auto-imports (requires per-data-source integration) |

> **Production note**: The current cron workflows check alerts for only a single org (the one set in `DEFAULT_ORG_ID`). For a multi-tenant deployment with many paying orgs, extend the workflow to:
> 1. Fetch all active orgs from Supabase (e.g., via a lightweight API endpoint that returns org IDs)
> 2. Loop over them, calling `/api/alerts/check-and-fire` once per org
> Alternatively, run the cron at the application level (inside a Next.js Route Handler) so it queries the database directly instead of via HTTP.

To run a workflow manually, go to your GitHub repo → **Actions** → select the workflow → **Run workflow**.

---

## Step 5 — Dodo Payments Setup

### 5a. Create products in Dodo

1. Log into [app.dodopayments.com](https://app.dodopayments.com)
2. Go to **Products → Create Product**
3. Create products for each pricing tier (both monthly and annual):

| Product Name | Pricing | API ID (set yourself) |
|---|---|---|
| AURA Starter (Monthly) | $29.00/month | `aura-starter-monthly` |
| AURA Starter (Annual) | $29.00 × 12 (or your annual discount) | `aura-starter-annual` |
| AURA Growth (Monthly) | $89.00/month | `aura-growth-monthly` |
| AURA Growth (Annual) | $89.00 × 12 (or your annual discount) | `aura-growth-annual` |
| AURA Enterprise (Monthly) | $175.00/month | `aura-enterprise-monthly` |
| AURA Enterprise (Annual) | $175.00 × 12 (or your annual discount) | `aura-enterprise-annual` |

4. After creating each product, copy its **Product ID** (e.g. `prod_abc123`) and set the corresponding `DODO_*_PRODUCT_ID` / `DODO_*_ANNUAL_PRODUCT_ID` environment variables in both Vercel and GitHub.

### 5b. Get API key

1. Go to **Settings → API Keys**
2. Copy the **Secret API Key** → set as `DODO_API_KEY`

### 5c. Set up webhook

1. Go to **Settings → Webhooks**
2. Add a webhook endpoint: `https://<your-app>.vercel.app/api/dodo/webhook`
3. Subscribe to these events:
   - `subscription.active`
   - `subscription.renewed`
   - `subscription.on_hold`
   - `subscription.cancelled`
   - `subscription.expired`
   - `subscription.failed`
4. Copy the **Webhook Signing Secret** → set as `DODO_WEBHOOK_SECRET`

### 5d. Configure return URL

In the Dodo dashboard, set your return/redirect URLs in **Settings → Branding**:
- **Return URL**: `https://<your-app>.vercel.app/dashboard/billing`

> **Note**: The naming convention `stripe_customer_id` column in the `organizations` table is intentionally kept even though Dodo is the payment processor — this keeps naming consistent with the WCAG Scanner project so shared tooling/scripts work across both.

---

## Step 6 — Resend Setup

### 6a. Verify a domain

1. Log into [resend.com](https://resend.com)
2. Go to **Domains → Add Domain**
3. Enter your sending domain (e.g. `auramis.com`)
4. Add the provided DNS records (TXT, MX) to your domain's DNS settings
5. Wait for verification

### 6b. Get API key

1. Go to **API Keys → Create API Key**
2. Copy the key → set as `RESEND_API_KEY`

### 6c. Optional: Custom sender

By default, AURA sends emails as `noreply@auramis.com`. To use a different sender, set the `RESEND_FROM_EMAIL` environment variable (e.g. `"AURA <alerts@yourdomain.com>"`).

---

## Step 7 — Verify the Deployment

After completing all steps above:

### Smoke test checklist

1. **Sign up**: Visit your app URL → click **Get Started** → create an account → verify you land on the dashboard
2. **Auth callback**: Check that email confirmation / magic link redirects back to the app correctly
3. **Create a branch**: Go to **Branches** → add a branch (e.g., "Noida Branch")
4. **Upload attendance data**: Download a sample CSV → upload it to a branch → confirm records are parsed
5. **Upload schedule data**: Upload a shift schedule → confirm reconciliation flags appear on the dashboard
6. **Generate a report**: Go to **Reports** → generate a reconciliation report → download CSV
7. **Create an alert**: Go to **Alerts** → create a rule with threshold → verify it fires
8. **Billing flow**: Go to **Billing** → click **Upgrade** → complete Dodo checkout → confirm the org plan updates
9. **Responsive layout**: Open on a tablet (768–1024px) → confirm the dashboard grid adapts to 2 columns

### Cron job test

1. Go to GitHub → **Actions** → **Cron — Check Alert Rules** → **Run workflow**
2. Confirm the workflow runs successfully (it calls `/api/alerts/check-and-fire`)

### Monitor logs

- **Vercel**: Go to your project dashboard → **Logs** to see API route execution
- **Supabase**: Go to **Database → Logs** to check query performance
- **Dodo**: Go to **Webhooks → Logs** to verify webhook delivery

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Auth signup fails with "User already registered" | User exists in Auth but no org was created | Delete user from Supabase Auth → sign up again |
| Dashboard shows 0/0/0 | No reconciliation data yet | Upload attendance + schedule CSVs for a branch |
| Billing checkout returns 500 | Missing Dodo product ID env var | Check all `DODO_*_PRODUCT_ID` vars are set |
| Webhook returns 401 | Wrong `DODO_WEBHOOK_SECRET` | Copy the exact secret from Dodo dashboard |
| Alert emails not sending | Resend domain not verified | Check domain verification status in Resend |
| Cron job fails with 401 | `CRON_SECRET` mismatch | Ensure GitHub secret matches Vercel env var exactly |
| CSV download has formula injection | Value starts with `=`, `+`, `-`, or `@` | The CSV export handler already escapes these — verify with a test cell starting with `=HYPERLINK` |

---

## Architecture Overview

```
Browser ──→ Vercel (Next.js App Router)
               │
               ├── Supabase (Auth + Postgres + RLS)
               │     ├── organizations, org_members, branches
               │     ├── attendance_records, shift_schedules
               │     ├── reconciliation_flags
               │     ├── reports, alerts, alert_history
               │     └── subscriptions
               │
               ├── Dodo Payments (Billing)
               │     ├── Checkout → webhook → plan_tier update
               │     └── Customer portal for subscription management
               │
               ├── Resend (Transactional Email)
               │     ├── Auth: magic links, password reset
               │     └── Alerts: notification emails
               │
               └── GitHub Actions (Cron Jobs)
                     ├── Alert checking (hourly)
                     └── Auto-import (daily, Enterprise)
```

---

## Appendix: Dodo ↔ WCAG Scanner naming compatibility

| AURA env var | WCAG Scanner equivalent | Notes |
|---|---|---|
| `DODO_API_KEY` | `DODO_PAYMENTS_API_KEY` | AURA uses the shorter name |
| `DODO_WEBHOOK_SECRET` | `DODO_PAYMENTS_WEBHOOK_KEY` | Different name, same purpose |
| `stripe_customer_id` column | `stripe_customer_id` column | **Same column name** in DB — intentional for tooling compatibility |
