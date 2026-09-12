/**
 * End-to-end smoke test for POST /api/advisory against a running dev server.
 *
 * Run with:  npm run smoke:advisory     (dev server must be up on :3000)
 *
 * Covers the three shapes the UI has to handle: a normal recommendation, a crop
 * we hold no reference data for, and a rejected request.
 */

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

async function post(body) {
  const response = await fetch(`${BASE}/api/advisory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, json: await response.json() };
}

const checks = [];

function check(name, ok, detail) {
  checks.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}\n      ${detail}\n`);
}

async function knownCrop() {
  const { status, json } = await post({
    lat: 30.901,
    lon: 75.8573,
    crop: "Wheat",
    locationLabel: "Ludhiana, Punjab",
    region: "Punjab",
  });

  const decisions = ["Plant", "Plant with Caution", "Don't Plant"];
  const ok =
    status === 200 &&
    decisions.includes(json.decision) &&
    typeof json.reasoning === "string" &&
    json.reasoning.length > 40 &&
    typeof json.forecastSummary?.rainfallNext14DaysMm === "number" &&
    json.cropRequirement?.crop === "Wheat";

  check(
    "Known crop returns a structured decision",
    ok,
    `HTTP ${status}, decision "${json.decision}", ${json.riskFactors?.length ?? 0} risks, ` +
      `${json.suggestedInputs?.length ?? 0} suggested inputs, ` +
      `rain ${json.forecastSummary?.rainfallNext14DaysMm}mm vs need ${json.forecastSummary?.expectedRainfallForCropMm}mm`,
  );

  // The whole point of the explainability requirement: the reasoning has to cite
  // a figure the farmer can see on screen, not just describe conditions vaguely.
  const citesANumber = /\d/.test(json.reasoning ?? "");
  check(
    "Reasoning cites at least one figure",
    citesANumber,
    citesANumber ? json.reasoning.slice(0, 140) : "no digits found in reasoning",
  );

  const noInputsWhenRejected =
    json.decision !== "Don't Plant" || json.suggestedInputs.length === 0;
  check(
    "No purchases suggested when advising against planting",
    noInputsWhenRejected,
    `decision "${json.decision}" with ${json.suggestedInputs.length} inputs`,
  );

  // Without this, a broken or missing API key still passes every check above,
  // because the rule-based fallback satisfies the same contract.
  check(
    "Advice came from the model, not the local fallback",
    json.degraded !== true,
    json.degraded
      ? "degraded=true - the model call failed. Check OPENROUTER_API_KEY and the dev server logs."
      : "degraded flag absent, so the model answered",
  );
}

async function unknownCrop() {
  const { status, json } = await post({
    lat: 19.9975,
    lon: 73.7898,
    crop: "Dragon fruit",
    locationLabel: "Nashik, Maharashtra",
    region: "Maharashtra",
  });

  const ok =
    status === 200 && json.cropRequirement === null && Boolean(json.reasoning);
  check(
    "Crop with no reference data still answers honestly",
    ok,
    `HTTP ${status}, cropRequirement ${JSON.stringify(json.cropRequirement)}, ` +
      `decision "${json.decision}"`,
  );
}

async function badRequest() {
  const { status, json } = await post({ lat: 999, crop: "" });
  const ok = status === 400 && typeof json.message === "string" && !json.stack;
  check(
    "Invalid input is rejected with a farmer-facing message",
    ok,
    `HTTP ${status}: ${json.message}`,
  );
}

async function main() {
  console.log(`Advisory agent smoke test against ${BASE}\n`);
  await knownCrop();
  await unknownCrop();
  await badRequest();

  const failed = checks.filter((c) => !c.ok);
  console.log("-".repeat(60));
  console.log(`${checks.length - failed.length}/${checks.length} checks passed`);
  if (failed.length > 0) {
    console.log(`Failed: ${failed.map((c) => c.name).join(", ")}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Smoke test could not run. Is the dev server up?", error);
  process.exit(1);
});
