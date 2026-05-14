const dns = require("dns");
const dnsPromises = require("dns").promises;
const mongoose = require("mongoose");

/** Atlasdan nusxalangan to‘g‘ridan-to‘g‘ri mongodb:// qator (SRVsiz) — DNS muammosida ishlatiladi */
function getStandardDatabaseUrl() {
  return (process.env.DATABASE_URL_STANDARD || "").trim();
}

function getSrvDatabaseUrl() {
  return (process.env.DATABASE_URL || "").trim();
}

function getDatabaseUrl() {
  return getStandardDatabaseUrl() || getSrvDatabaseUrl();
}

function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}

function tryPreferPublicDns() {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (_) {
    /* ignore */
  }
}

/**
 * mongodb+srv://user:pass@seedHost/path?query
 * parolda @ bo‘lmasligi kerak (odatda %40)
 */
function parseSrvUri(uri) {
  if (!uri.startsWith("mongodb+srv://")) return null;
  const without = uri.slice("mongodb+srv://".length);
  const lastAt = without.lastIndexOf("@");
  let credPart = "";
  let hostAndPath = without;
  if (lastAt !== -1) {
    credPart = without.slice(0, lastAt);
    hostAndPath = without.slice(lastAt + 1);
  }
  const slash = hostAndPath.indexOf("/");
  let seedHost = hostAndPath;
  let pathAndQuery = "";
  if (slash !== -1) {
    seedHost = hostAndPath.slice(0, slash);
    pathAndQuery = hostAndPath.slice(slash);
  }
  let userInfo = "";
  if (credPart) {
    const colon = credPart.indexOf(":");
    const user = colon === -1 ? credPart : credPart.slice(0, colon);
    const pass = colon === -1 ? "" : credPart.slice(colon + 1);
    userInfo = `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@`;
  }
  return {
    seedHost,
    pathAndQuery: pathAndQuery && pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery || ""}`,
  };
}

async function srvToStandardConnectionString(srvUri) {
  const parsed = parseSrvUri(srvUri);
  if (!parsed) return null;

  tryPreferPublicDns();

  const srvName = `_mongodb._tcp.${parsed.seedHost}`;
  const records = await dnsPromises.resolveSrv(srvName);
  if (!records?.length) return null;

  records.sort((a, b) => a.priority - b.priority || b.weight - a.weight);
  const hosts = records.map((r) => `${r.name}:${r.port}`).join(",");

  let txtOpts = "";
  try {
    const txtArrays = await dnsPromises.resolveTxt(parsed.seedHost);
    txtOpts = txtArrays.flat().join("").trim();
  } catch (_) {
    /* TXT majburiy emas */
  }

  const pq = parsed.pathAndQuery;
  const qMark = pq.indexOf("?");
  const dbPath = qMark === -1 ? pq || "/" : pq.slice(0, qMark);
  const origQuery = qMark === -1 ? "" : pq.slice(qMark + 1);

  const params = new URLSearchParams(origQuery);
  if (txtOpts) {
    for (const pair of txtOpts.split("&")) {
      if (!pair) continue;
      const eq = pair.indexOf("=");
      const k = (eq === -1 ? pair : pair.slice(0, eq)).trim();
      const v = eq === -1 ? "" : pair.slice(eq + 1);
      if (k && !params.has(k)) params.set(k, v);
    }
  }
  if (!params.has("tls") && !params.has("ssl")) {
    params.set("tls", "true");
  }

  const qstr = params.toString();
  return `mongodb://${parsed.userInfo}${hosts}${dbPath}${qstr ? `?${qstr}` : ""}`;
}

async function connectMongoose() {
  const standardEnv = getStandardDatabaseUrl();
  const srvEnv = getSrvDatabaseUrl();
  const primaryUrl = standardEnv || srvEnv;
  if (!primaryUrl) {
    return false;
  }

  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }

  const opts = {
    serverSelectionTimeoutMS: 25_000,
    family: 4,
  };

  tryPreferPublicDns();

  if (primaryUrl.startsWith("mongodb://")) {
    await mongoose.connect(primaryUrl, opts);
    return true;
  }

  try {
    await mongoose.connect(primaryUrl, opts);
    return true;
  } catch (err) {
    const msg = String(err?.message || err);
    if (!msg.includes("querySrv")) {
      throw err;
    }
  }

  if (!srvEnv) {
    throw new Error("querySrv xatosi: DATABASE_URL (mongodb+srv) noto‘g‘ri yoki DNS bloklangan.");
  }

  let expanded;
  try {
    expanded = await srvToStandardConnectionString(srvEnv);
  } catch (e) {
    const wrap = new Error(
      "SRV DNS ishlamayapti va Google DNS orqali yechish ham muvaffaqiyatsiz. " +
        "Iltimos, Atlasdan «Standard connection string» (mongodb://...) oling va .env da DATABASE_URL_STANDARD ga qo‘ying."
    );
    wrap.cause = e;
    throw wrap;
  }

  if (!expanded) {
    throw new Error("SRV yozuvlari bo‘sh — ulanish qatorini tekshiring.");
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(expanded, opts);
  console.warn(
    "[db] mongodb+srv DNS ishlamagan — SRV Google DNS (8.8.8.8) orqali yechildi, standart mongodb:// bilan ulandi."
  );
  return true;
}

module.exports = {
  getDatabaseUrl,
  getStandardDatabaseUrl,
  getSrvDatabaseUrl,
  isDatabaseConfigured,
  connectMongoose,
};
