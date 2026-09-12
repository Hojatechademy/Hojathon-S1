/**
 * Pre-flight check for the AgriPilot build.
 *
 * Run with:  npm run verify
 * (which is: node --env-file=.env.local scripts/verify-setup.mjs)
 *
 * Confirms, before any agent code is written:
 *   1. Open-Meteo forecast responds for a sample lat/long
 *   2. The configured OpenRouter model slugs actually exist
 *   3. The text model answers a chat completion
 *   4. The vision model accepts an image input
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

const TEXT_MODEL = process.env.OPENROUTER_TEXT_MODEL ?? 'anthropic/claude-sonnet-4.5';
const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL ?? 'google/gemini-2.5-flash';
const API_KEY = process.env.OPENROUTER_API_KEY?.trim();

// Sample coordinates: Ludhiana, Punjab.
const SAMPLE_LAT = 30.901;
const SAMPLE_LON = 75.8573;

// A 16x16 solid leaf-green (rgb 34,177,76) PNG. Small enough to inline, but a real
// colour so the reply actually confirms the model saw the pixels rather than just
// accepting the request.
const TINY_GREEN_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAFklEQVR4nGNQ2uhDEmIY1TCqYfhqAABqyR8Ql1onhQAAAABJRU5ErkJggg==';

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}\n      ${detail}\n`);
}

function orHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'http://localhost:3000',
    'X-Title': process.env.OPENROUTER_SITE_NAME ?? 'AgriPilot',
  };
}

async function checkOpenMeteo() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${SAMPLE_LAT}&longitude=${SAMPLE_LON}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=16&timezone=auto`;
  try {
    const res = await fetch(url);
    if (!res.ok) return record('Open-Meteo forecast', false, `HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();
    const days = data?.daily?.time?.length ?? 0;
    const rain = (data?.daily?.precipitation_sum ?? []).reduce((a, b) => a + (b ?? 0), 0);
    record(
      'Open-Meteo forecast',
      days > 0,
      `${days} days for ${SAMPLE_LAT},${SAMPLE_LON} (${data.timezone}); ` +
        `tomorrow max ${data.daily.temperature_2m_max[1]}C, ${rain.toFixed(1)}mm rain over the window`,
    );
  } catch (err) {
    record('Open-Meteo forecast', false, String(err));
  }
}

async function checkModelSlugs() {
  try {
    const res = await fetch(`${OPENROUTER_BASE}/models`);
    if (!res.ok) return record('Model slugs exist', false, `HTTP ${res.status} ${res.statusText}`);
    const { data } = await res.json();
    const byId = new Map(data.map((m) => [m.id, m]));

    const text = byId.get(TEXT_MODEL);
    record(
      `Text model slug "${TEXT_MODEL}"`,
      Boolean(text),
      text ? `found, accepts: ${text.architecture.input_modalities.join(', ')}` : 'NOT on the model list',
    );

    const vision = byId.get(VISION_MODEL);
    const visionOk = Boolean(vision) && vision.architecture.input_modalities.includes('image');
    record(
      `Vision model slug "${VISION_MODEL}"`,
      visionOk,
      !vision
        ? 'NOT on the model list'
        : visionOk
          ? `found, accepts: ${vision.architecture.input_modalities.join(', ')}`
          : `found but does NOT accept image input (${vision.architecture.input_modalities.join(', ')})`,
    );
  } catch (err) {
    record('Model slugs exist', false, String(err));
  }
}

async function checkTextCall() {
  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: orHeaders(),
      body: JSON.stringify({
        model: TEXT_MODEL,
        max_tokens: 60,
        messages: [
          {
            role: 'system',
            content: 'You are a test harness. Reply only with JSON, no markdown fences.',
          },
          {
            role: 'user',
            content: 'Return {"ok":true,"agent":"advisory"} exactly.',
          },
        ],
      }),
    });
    const body = await res.text();
    if (!res.ok) return record('OpenRouter text call', false, `HTTP ${res.status}: ${body.slice(0, 300)}`);
    const json = JSON.parse(body);
    const reply = json.choices?.[0]?.message?.content?.trim() ?? '';
    record('OpenRouter text call', reply.length > 0, `${json.model} replied: ${reply.slice(0, 160)}`);
  } catch (err) {
    record('OpenRouter text call', false, String(err));
  }
}

async function checkVisionCall() {
  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: orHeaders(),
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 60,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Name the single dominant colour in this image. One word.' },
              { type: 'image_url', image_url: { url: TINY_GREEN_PNG } },
            ],
          },
        ],
      }),
    });
    const body = await res.text();
    if (!res.ok) return record('OpenRouter vision call', false, `HTTP ${res.status}: ${body.slice(0, 300)}`);
    const json = JSON.parse(body);
    const reply = json.choices?.[0]?.message?.content?.trim() ?? '';
    record('OpenRouter vision call', reply.length > 0, `${json.model} saw: ${reply.slice(0, 160)}`);
  } catch (err) {
    record('OpenRouter vision call', false, String(err));
  }
}

async function main() {
  console.log('AgriPilot - setup verification\n');

  await checkOpenMeteo();
  await checkModelSlugs();

  if (!API_KEY) {
    // A shell variable beats --env-file, even when it is empty. That is easy to
    // trip over and looks identical to a missing key, so say so up front.
    record(
      'OPENROUTER_API_KEY present',
      false,
      'Empty or missing. Add it to .env.local (get one at https://openrouter.ai/keys), then re-run `npm run verify`.\n' +
        '      If your key IS in .env.local, check for an empty OPENROUTER_API_KEY in your shell:\n' +
        '      it overrides the file. Clear it with  Remove-Item Env:OPENROUTER_API_KEY',
    );
  } else {
    record('OPENROUTER_API_KEY present', true, `key loaded (${API_KEY.length} chars)`);
    await checkTextCall();
    await checkVisionCall();
  }

  const failed = results.filter((r) => !r.ok);
  console.log('-'.repeat(60));
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) {
    console.log(`Still to fix: ${failed.map((r) => r.name).join(', ')}`);
    process.exit(1);
  }
  console.log('All good - safe to start building the agents.');
}

main();
