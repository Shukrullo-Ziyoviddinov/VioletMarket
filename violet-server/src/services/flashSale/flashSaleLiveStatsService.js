const { getFlashSaleRules } = require("./flashSaleRuleConfigService");

const MODE_NORMAL = "normal";
const MODE_SURGE = "surge";
const MODE_COOLDOWN = "cooldown";
const MODE_SPIKE = "spike";

const modeWeights = [
  { mode: MODE_NORMAL, weight: 54 },
  { mode: MODE_SURGE, weight: 20 },
  { mode: MODE_COOLDOWN, weight: 20 },
  { mode: MODE_SPIKE, weight: 6 },
];

const runtimeState = {
  current: 342,
  mode: MODE_NORMAL,
  modeEndsAtMs: 0,
  lastTickAtMs: 0,
};

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function randomInt(min, max) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function pickNextMode() {
  const total = modeWeights.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of modeWeights) {
    roll -= item.weight;
    if (roll <= 0) return item.mode;
  }
  return MODE_NORMAL;
}

function nextValueByMode(current, rules, mode) {
  if (mode === MODE_SURGE) {
    return current + randomInt(rules.liveSurgeStepMin, rules.liveSurgeStepMax);
  }
  if (mode === MODE_COOLDOWN) {
    return current - randomInt(rules.liveCooldownStepMin, rules.liveCooldownStepMax);
  }
  if (mode === MODE_SPIKE) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    const spikeBase = Math.max(
      rules.liveSurgeStepMax,
      rules.liveCooldownStepMax,
      rules.liveNormalStepMax * 2,
    );
    return current + direction * randomInt(spikeBase, spikeBase + 220);
  }

  // normal mode
  const step = randomInt(rules.liveNormalStepMin, rules.liveNormalStepMax);
  const direction = Math.random() < 0.5 ? -1 : 1;
  return current + direction * step;
}

function tickViewerValue(nowMs, rules) {
  const interval = Math.max(250, Number(rules.liveUpdateEveryMs) || 1000);
  const ticks = Math.max(1, Math.floor((nowMs - runtimeState.lastTickAtMs) / interval));

  for (let i = 0; i < ticks; i += 1) {
    if (nowMs >= runtimeState.modeEndsAtMs) {
      runtimeState.mode = pickNextMode();
      runtimeState.modeEndsAtMs = nowMs + Math.max(1000, Number(rules.liveModeRotateEveryMs) || 7000);
    }

    let next = nextValueByMode(runtimeState.current, rules, runtimeState.mode);

    // Qo'shimcha random spike (har update'da ehtimoliy sakrash).
    const spikeChance = Number(rules.liveSpikeChancePercent) || 0;
    if (Math.random() * 100 < spikeChance) {
      const jump = randomInt(80, 260);
      next += Math.random() < 0.5 ? -jump : jump;
    }

    runtimeState.current = clamp(
      next,
      Number(rules.liveMinViewers) || 50,
      Number(rules.liveMaxViewers) || 1000,
    );
    runtimeState.lastTickAtMs += interval;
  }
}

async function getLiveStats() {
  const rules = await getFlashSaleRules();
  const nowMs = Date.now();

  const minViewers = Number(rules.liveMinViewers) || 50;
  const maxViewers = Number(rules.liveMaxViewers) || 1000;
  runtimeState.current = clamp(runtimeState.current, minViewers, maxViewers);

  if (!runtimeState.lastTickAtMs) {
    runtimeState.lastTickAtMs = nowMs;
    runtimeState.mode = pickNextMode();
    runtimeState.modeEndsAtMs = nowMs + Math.max(1000, Number(rules.liveModeRotateEveryMs) || 7000);
  } else {
    tickViewerValue(nowMs, rules);
  }

  return {
    viewersNow: runtimeState.current,
    updateEveryMs: Math.max(250, Number(rules.liveUpdateEveryMs) || 1000),
  };
}

module.exports = {
  getLiveStats,
};
