const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-6uQG4KenMc38_u_tCR8_HAEv46Kpx10y6hl1sTjXBTrtgSe49yUjtXrSQcOi7ZiltrbAf2KhjvyY/pub?gid=0&single=true&output=tsv';
const CACHE_KEY = 'sheet_data';
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const CACHE_ENABLED = false; // set to true to re-enable caching

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers for browser access
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const date = url.searchParams.get('date');
    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Missing required param: date (YYYY-MM-DD or "all")' }),
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      const data = await getSheetData(env.CACHE);

      if (date === 'all') {
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      const row = data[date];
      if (!row) {
        return new Response(
          JSON.stringify({ error: `No data found for date: ${date}` }),
          { status: 404, headers: corsHeaders }
        );
      }

      return new Response(JSON.stringify(row), { headers: corsHeaders });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch data', detail: err.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};

async function getSheetData(kv) {
  if (CACHE_ENABLED) {
    const cached = await kv.get(CACHE_KEY, 'json');
    if (cached) return cached;
  }

  // Fetch fresh from Google Sheet
  const response = await fetch(SHEET_CSV_URL);
  if (!response.ok) throw new Error(`Sheet fetch failed: ${response.status}`);

  const tsv = await response.text();
  const data = parseTSV(tsv);

  if (CACHE_ENABLED) {
    await kv.put(CACHE_KEY, JSON.stringify(data), { expirationTtl: CACHE_TTL_SECONDS });
  }

  return data;
}

function parseTSV(tsv) {
  const lines = tsv.replace(/^\uFEFF/, '').trim().split('\n');
  const headers = lines[0].split('\t').map(h => h.trim());
  const result = {};

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() ?? '';
    });

    // Index by date column (expected format: YYYY-MM-DD)
    if (row.date) {
      result[row.date] = row;
    }
  }

  return result;
}
