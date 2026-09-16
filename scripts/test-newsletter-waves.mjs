/**
 * Dry-run: simulate sending to 5000 recipients in waves of 500.
 * Does not touch SMTP or the database.
 *
 * Usage: node scripts/test-newsletter-waves.mjs
 */

const TOTAL = 5000;
const WAVE = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendFake(email) {
  // Simulate a fast SMTP handoff (~2ms)
  await sleep(2);
  if (!email.includes("@")) return false;
  return true;
}

async function main() {
  const recipients = Array.from(
    { length: TOTAL },
    (_, i) => `subscriber${String(i + 1).padStart(4, "0")}@example.test`
  );

  const totalWaves = Math.ceil(recipients.length / WAVE);
  let delivered = 0;
  let failed = 0;
  const started = Date.now();

  console.log(
    `[test] starting dry-run: ${recipients.length} recipient(s), ${totalWaves} wave(s) of ${WAVE}`
  );

  for (let index = 0; index < recipients.length; index += WAVE) {
    const batch = recipients.slice(index, index + WAVE);
    const waveNumber = Math.floor(index / WAVE) + 1;
    const waveStarted = Date.now();
    console.log(`[test] wave ${waveNumber}/${totalWaves}: sending ${batch.length} email(s)`);

    const results = await Promise.all(batch.map((email) => sendFake(email)));
    let waveDelivered = 0;
    let waveFailed = 0;
    for (const ok of results) {
      if (ok) {
        delivered += 1;
        waveDelivered += 1;
      } else {
        failed += 1;
        waveFailed += 1;
      }
    }

    console.log(
      `[test] wave ${waveNumber}/${totalWaves} done: ${waveDelivered} ok, ${waveFailed} failed in ${Date.now() - waveStarted}ms (total ${delivered}/${recipients.length})`
    );
  }

  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        attempted: recipients.length,
        delivered,
        failed,
        waves: totalWaves,
        waveSize: WAVE,
        elapsedMs: Date.now() - started,
        ok: delivered === TOTAL && failed === 0 && totalWaves === 10,
      },
      null,
      2
    )
  );

  if (delivered !== TOTAL || totalWaves !== 10) {
    process.exit(1);
  }
}

await main();
