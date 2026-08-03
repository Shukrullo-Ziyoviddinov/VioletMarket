/**
 * Unit-level fix suite — round-1 + round-2 barcha smoke/regressiya.
 * Run: node src/scripts/verifyUnitFixSuite.js
 */
const { spawnSync } = require("child_process");
const path = require("path");

const scripts = [
  // Round 1 — partial unavailable / cargo / courier
  "verifyUnitUnavailableScenarios.js",
  "verifyUnitPipelineSync.js",
  "verifyCancelOpenUnits.js",
  "verifyCourierClosedUnitFilter.js",
  "verifyReturnedToSellerClosedUnits.js",
  "verifyCargoSubmitOpenUnits.js",
  "verifyAggregateClosedMix.js",
  "verifyCargoUnitReturn.js",
  "verifyUnitPartialRegression.js",
  // Round 2 — re_handoff / deliver / partial save / sold sync
  "verifyReHandoffUnitReopen.js",
  "verifyDeliverClosedUnitsSettled.js",
  "verifyMarkReturnedPartialUnitSave.js",
  "verifySoldSyncSkipClosedUnits.js",
  "verifyRound2Regression.js",
];

let failed = 0;
for (const name of scripts) {
  const file = path.join(__dirname, name);
  console.log(`\n======== ${name} ========`);
  const result = spawnSync(process.execPath, [file], {
    cwd: path.join(__dirname, "../.."),
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) {
    failed += 1;
    console.error(`FAILED: ${name} (exit ${result.status})`);
  }
}

console.log("\n======== SUITE SUMMARY ========");
if (failed) {
  console.error(`FAILED ${failed}/${scripts.length} scripts`);
  process.exit(1);
}
console.log(`PASSED ${scripts.length}/${scripts.length} scripts`);
