/**
 * End-to-end test for POST /api/diagnose against a running dev server.
 *
 * Run with:  npm run smoke:diagnose      (dev server must be up on :3000)
 *
 * Sends every image in ./test-images through the agent and prints the diagnosis.
 * Also checks the two rejection paths that do not need a real photo.
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const IMAGE_DIR = path.join(process.cwd(), "test-images");

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const checks = [];

function check(name, ok, detail) {
  checks.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}\n${detail}\n`);
}

async function post(body) {
  const response = await fetch(`${BASE}/api/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, json: await response.json() };
}

function indent(text) {
  return String(text)
    .split("\n")
    .map((line) => `      ${line}`)
    .join("\n");
}

async function diagnoseImage(file) {
  const ext = path.extname(file).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  const bytes = await readFile(path.join(IMAGE_DIR, file));
  const dataUrl = `data:${mime};base64,${bytes.toString("base64")}`;

  const started = Date.now();
  const { status, json } = await post({ imageBase64: dataUrl });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  const ok =
    status === 200 &&
    typeof json.diagnosis === "string" &&
    ["low", "medium", "high"].includes(json.confidence) &&
    typeof json.reasoning === "string" &&
    json.reasoning.length > 20 &&
    Array.isArray(json.treatment) &&
    // A healthy plant must not come back with treatment steps attached.
    (!json.isHealthy || json.treatment.length === 0);

  check(
    `${file} (${(bytes.length / 1024).toFixed(0)} KB)`,
    ok,
    indent(
      [
        `HTTP ${status} in ${seconds}s`,
        `plant: ${json.isPlant}   healthy: ${json.isHealthy}   confidence: ${json.confidence}`,
        `diagnosis: ${json.diagnosis}`,
        `reasoning: ${json.reasoning}`,
        json.imageQualityNote ? `photo note: ${json.imageQualityNote}` : null,
        json.treatment?.length
          ? `treatment:\n${json.treatment.map((s, i) => `  ${i + 1}. ${s}`).join("\n")}`
          : "treatment: none",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  );
}

async function rejectionPaths() {
  const missing = await post({});
  check(
    "Request with no image is rejected",
    missing.status === 400 && typeof missing.json.message === "string",
    indent(`HTTP ${missing.status}: ${missing.json.message}`),
  );

  // A valid data URL, but a media type the vision model should not be handed.
  const wrongType = await post({
    imageBase64: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAIBAAA=",
  });
  check(
    "Unsupported image type is rejected",
    wrongType.status === 415 && typeof wrongType.json.message === "string",
    indent(`HTTP ${wrongType.status}: ${wrongType.json.message}`),
  );
}

async function main() {
  console.log(`Disease detection smoke test against ${BASE}\n`);

  let files = [];
  try {
    files = (await readdir(IMAGE_DIR)).filter((file) =>
      Object.keys(MIME_BY_EXT).includes(path.extname(file).toLowerCase()),
    );
  } catch {
    console.log("No test-images folder found.\n");
  }

  if (files.length === 0) {
    console.log(
      "No photos in ./test-images yet, so only the rejection paths are being checked.\n" +
        "Drop a few plant photos in there and run this again. See test-images/README.md.\n",
    );
  }

  for (const file of files) {
    await diagnoseImage(file);
  }

  await rejectionPaths();

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
