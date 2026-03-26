// Cloudflare Pages Function — CORS Proxy
// Datei: /functions/proxy.js im Root deines Repos

export async function onRequest(context) {
    const { request } = context;

    // CORS-Preflight sofort beantworten
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            }
        });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get('url');

    // Nur Open Food Facts erlaubt
    if (!target || !target.startsWith('https://world.openfoodfacts.org/')) {
        return new Response(JSON.stringify({ error: 'Nur Open Food Facts URLs erlaubt.' }), {
            status: 403,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    try {
        const apiRes = await fetch(target, {
            headers: {
                'User-Agent': 'OnePercentFitnessApp/1.0',
                'Accept': 'application/json',
            }
        });

        const data = await apiRes.text();

        return new Response(data, {
            status: apiRes.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300',
            }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
