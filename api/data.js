// Vercel serverless function: reads demand_weekly_summary from Supabase and
// returns it in the shape the dashboard expects. Runs on the server, so the
// Supabase secret key never reaches the browser. No login yet: anyone with the
// link can see the data (SSO to be added later).

// Supabase category code -> dashboard segment id
const CATEGORY = { pm: 'pm', pnm: 'pnm', nm: 'ngm', nnm: 'ngnm' };

// Supabase column -> dashboard field
const FIELDS = {
  campaign_views: 'views', uq_visitors: 'uv', unique_donors: 'donors', total_orders: 'orders',
  total_donation: 'don', tipped_orders: 'tipOrders', tip_amount: 'tip', contri_initiated: 'init',
  cart_created: 'cart', order_created: 'ocreated', order_placed: 'placed', campaigns_live: 'live',
  campaign_days_live: 'liveDays', campaigns_approved: 'approved', campaigns_raised: 'raised',
};

function shape(rows) {
  const weeks = [...new Set(rows.map(r => r.week_start))].sort();
  const pos = Object.fromEntries(weeks.map((w, i) => [w, i]));
  const seg = {};
  for (const id of Object.values(CATEGORY)) {
    seg[id] = Object.fromEntries(Object.values(FIELDS).map(f => [f, weeks.map(() => null)]));
  }
  for (const r of rows) {
    const id = CATEGORY[String(r.category || '').toLowerCase()];
    if (!id) continue;
    const i = pos[r.week_start];
    for (const [col, f] of Object.entries(FIELDS)) {
      const v = r[col];
      seg[id][f][i] = v === null || v === undefined || v === '' ? null : Number(v);
    }
  }
  return { weeks, seg, fetchedAt: new Date().toISOString() };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.statusCode = 500;
    return res.end('Missing environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.');
  }
  try {
    const cols = ['week_start', 'category', ...Object.keys(FIELDS)].join(',');
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/demand_weekly_summary?select=${cols}&order=week_start.asc&limit=10000`;
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    });
    if (!r.ok) {
      res.statusCode = 502;
      return res.end(`Supabase returned ${r.status}: ${(await r.text()).slice(0, 300)}`);
    }
    const rows = await r.json();
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    return res.end(JSON.stringify(shape(rows)));
  } catch (e) {
    res.statusCode = 500;
    return res.end('Could not load data: ' + e.message);
  }
};
module.exports.shape = shape;
