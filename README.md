# Demand Midweek Review (live)

CEO dashboard for weekly fundraising demand. It reads the Supabase table
`demand_weekly_summary` every time it is opened, so it stays current on its own.
No Claude needed to run or update it.

## How it works
- `index.html`: the dashboard. It loads data from `/api/data`.
- `api/data.js`: a Vercel serverless function. It reads
  `demand_weekly_summary` from Supabase with the secret key (kept on the server), and returns the data.
- No login yet: anyone with the link can see the dashboard. Add SSO later (e.g. Vercel Authentication or your own SSO).
- Segment codes in Supabase: `pm` = Personal Medical, `pnm` = Personal Non-Medical,
  `nm` = NGO Medical, `nnm` = NGO Non-Medical.

## Deploy on Vercel (one time, about 10 minutes)
1. Create a new GitHub repository (e.g. `demand-midweek-review`) and upload these files,
   keeping the `api` folder as it is.
2. In Vercel: Add New → Project → import that repository. Framework preset: **Other**. No build command.
3. Before clicking Deploy, add two Environment Variables:
   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | `https://njgctrmitailbvjtyeiz.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → **secret** key (or legacy `service_role`) |
4. Click Deploy and open the URL.

## Keeping it updated
Add each new week to `demand_weekly_summary` (one row per category per week, same columns).
The dashboard picks it up the next time someone opens or refreshes the page. Nothing else to do.

Never put the Supabase secret key in `index.html` or in GitHub. It only goes in Vercel's environment variables.
