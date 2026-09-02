module.exports = async function keepAlive(request, response) {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY, CRON_SECRET } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !CRON_SECRET) {
    return response.status(500).json({
      ok: false,
      error: 'Server configuration error',
    });
  }

  if (request.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return response.status(401).json({
      ok: false,
      error: 'Unauthorized',
    });
  }

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({
      ok: false,
      error: 'Method not allowed',
    });
  }

  const timestamp = new Date().toISOString();
  const supabaseUrl = SUPABASE_URL.replace(/\/$/, '');

  try {
    const supabaseResponse = await fetch(
      `${supabaseUrl}/rest/v1/keep_alive?id=eq.1&select=id,last_ping`,
      {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ last_ping: timestamp }),
      },
    );

    if (!supabaseResponse.ok) {
      return response.status(500).json({
        ok: false,
        error: 'Keep-alive request failed',
      });
    }

    const updatedRows = await supabaseResponse.json();

    if (!Array.isArray(updatedRows) || updatedRows.length !== 1) {
      return response.status(500).json({
        ok: false,
        error: 'Keep-alive row was not updated',
      });
    }

    return response.status(200).json({
      ok: true,
      timestamp: updatedRows[0].last_ping,
    });
  } catch {
    return response.status(500).json({
      ok: false,
      error: 'Keep-alive request failed',
    });
  }
};
