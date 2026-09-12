/**
 * End-to-end test for POST /api/market against a running dev server.
 *
 * Run with:  npm run smoke:market      (dev server must be up on :3000)
 */

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const checks = [];

function check(name, ok, detail) {
  checks.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}\n      ${detail}\n`);
}

async function post(body) {
  const response = await fetch(`${BASE}/api/market`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, json: await response.json() };
}

async function normalListing() {
  const quantity = 40;
  const { status, json } = await post({
    crop: "Wheat",
    quantity,
    region: "Punjab",
  });

  const price = json.priceGuidance;
  const ok =
    status === 200 &&
    typeof json.listingTitle === "string" &&
    json.listingTitle.length > 0 &&
    typeof json.listingDescription === "string" &&
    json.listingDescription.length > 40 &&
    Array.isArray(json.listingHighlights) &&
    typeof json.reasoning === "string" &&
    Array.isArray(json.matchedBuyers);

  check(
    "Known crop returns a drafted listing",
    ok,
    [
      `HTTP ${status}`,
      `title: ${json.listingTitle}`,
      `description: ${json.listingDescription}`,
      `highlights: ${JSON.stringify(json.listingHighlights)}`,
      `reasoning: ${json.reasoning}`,
      `buyers: ${json.matchedBuyers?.map((b) => b.name).join(", ")}`,
    ].join("\n      "),
  );

  // Pricing must be arithmetic on the dataset, not something the model made up.
  const mathHolds =
    price &&
    price.quantityQuintals === quantity &&
    price.estimatedValue === price.referencePricePerQuintal * quantity &&
    price.suggestedAskMin < price.referencePricePerQuintal &&
    price.suggestedAskMax > price.referencePricePerQuintal;

  check(
    "Price guidance is arithmetic on the mandi rate",
    Boolean(mathHolds),
    price
      ? `${quantity} x Rs ${price.referencePricePerQuintal} = Rs ${price.estimatedValue}; ` +
        `quote Rs ${price.suggestedAskMin}-${price.suggestedAskMax}; trend ${price.trend}`
      : "no priceGuidance returned",
  );

  // The title is a trade listing, not a headline. Long titles get truncated in feeds.
  check(
    "Listing title stays short enough to scan",
    json.listingTitle.length <= 90,
    `${json.listingTitle.length} characters`,
  );

  const buyersOk =
    json.matchedBuyers.length > 0 &&
    json.matchedBuyers.every(
      (b) => b.buysCrops.includes("Wheat") && typeof b.why === "string",
    );
  check(
    "Matched buyers actually buy this crop",
    buyersOk,
    json.matchedBuyers
      .map((b) => `${b.name} (${b.region}, min ${b.minQuantityQuintals}q)`)
      .join("; "),
  );

  // The template fallback satisfies the same contract, so assert it was not used.
  check(
    "Listing came from the model, not the template fallback",
    json.degraded !== true,
    json.degraded
      ? "degraded=true - the model call failed. Check OPENROUTER_API_KEY and the dev server logs."
      : "degraded flag absent, so the model wrote it",
  );
}

async function smallLot() {
  // 5 quintals is below every sugarcane buyer's minimum, so the flag must show.
  const { status, json } = await post({
    crop: "Sugarcane",
    quantity: 5,
    region: "Uttar Pradesh",
  });

  const flagged = json.matchedBuyers?.some((b) => b.meetsMinimum === false);
  check(
    "Lot below a buyer's minimum is flagged, not hidden",
    status === 200 && Boolean(flagged),
    json.matchedBuyers
      ?.map((b) => `${b.name}: meetsMinimum=${b.meetsMinimum}`)
      .join("; ") ?? "no buyers returned",
  );
}

async function unpricedCrop() {
  const { status, json } = await post({
    crop: "Dragon fruit",
    quantity: 12,
    region: "Maharashtra",
  });

  // With no price on record the agent must not invent one.
  const mentionsRupees = /(?:₹|\bRs\.?\s?\d)/.test(
    `${json.listingTitle} ${json.listingDescription}`,
  );
  check(
    "Crop with no price data gets no invented price",
    status === 200 && json.priceGuidance === null && !mentionsRupees,
    `HTTP ${status}, priceGuidance ${JSON.stringify(json.priceGuidance)}\n      ` +
      `description: ${json.listingDescription}`,
  );
}

async function rejections() {
  const noCrop = await post({ quantity: 10, region: "Punjab" });
  check(
    "Missing crop is rejected",
    noCrop.status === 400 && typeof noCrop.json.message === "string",
    `HTTP ${noCrop.status}: ${noCrop.json.message}`,
  );

  const badQuantity = await post({ crop: "Wheat", quantity: -5, region: "Punjab" });
  check(
    "Negative quantity is rejected",
    badQuantity.status === 400,
    `HTTP ${badQuantity.status}: ${badQuantity.json.message}`,
  );
}

async function main() {
  console.log(`Market agent smoke test against ${BASE}\n`);
  await normalListing();
  await smallLot();
  await unpricedCrop();
  await rejections();

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
