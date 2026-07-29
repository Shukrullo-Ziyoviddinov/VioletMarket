/**
 * Cargo UI/list uchun umumiy ko‘rsatish helper’lari.
 * To‘lov/jarayon qoidalariga tegmaydi — faqat display + lookup.
 */

const mongoose = require("mongoose");
const { SellerAccount } = require("../../models/sellerAccount");
const { LogisticaProfile } = require("../../models/logisticaProfile");

function pickSellerName(account) {
  if (!account?.name) return "";
  if (typeof account.name === "string") return account.name;
  return String(account.name.uz || account.name.ru || "").trim();
}

/** Admin/logistica kartalar uchun bitta matn */
function resolveProductTitle(title) {
  if (title && typeof title === "object") {
    return String(title.uz || title.ru || "").trim() || "Mahsulot";
  }
  return String(title || "").trim() || "Mahsulot";
}

function formatProductCode(productId, empty = "—") {
  const id = Number(productId) || 0;
  return id > 0 ? `#${String(id).padStart(4, "0")}` : empty;
}

async function loadSellerMap(sellerIds = []) {
  const ids = [
    ...new Set(
      sellerIds.map((id) => String(id || "").trim()).filter(Boolean),
    ),
  ];
  if (!ids.length) return new Map();

  const rows = await SellerAccount.find({ id: { $in: ids } })
    .select("id name sellerCountry")
    .lean();

  return new Map(
    rows.map((row) => [
      String(row.id),
      {
        id: String(row.id),
        name: pickSellerName(row) || String(row.id),
        sellerCountry: String(row.sellerCountry || ""),
      },
    ]),
  );
}

async function loadLogisticaMap(logisticaIds = []) {
  const ids = [
    ...new Set(
      logisticaIds
        .map((id) => String(id || "").trim())
        .filter((id) => mongoose.isValidObjectId(id)),
    ),
  ];
  if (!ids.length) return new Map();

  const rows = await LogisticaProfile.find({ _id: { $in: ids } })
    .select({
      companyName: 1,
      logisticaCountry: 1,
      chinaAddress: 1,
      chinaPhone: 1,
      profileDescription: 1,
    })
    .lean();

  return new Map(
    rows.map((row) => [
      String(row._id),
      {
        companyName: String(row.companyName || ""),
        logisticaCountry: String(row.logisticaCountry || ""),
        chinaAddress: String(row.chinaAddress || "").trim(),
        chinaPhone: String(row.chinaPhone || "").trim(),
        profileDescription: String(row.profileDescription || "").trim(),
      },
    ]),
  );
}

/** Siller «cargoga yuborish» modal uchun ochiq aloqa kartasi */
function toSellerLogisticaContactView(row) {
  if (!row) return null;
  return {
    id: String(row._id || row.id || ""),
    companyName: String(row.companyName || "").trim() || "Logistica",
    logisticaCountry: String(row.logisticaCountry || ""),
    chinaAddress: String(row.chinaAddress || "").trim(),
    chinaPhone: String(row.chinaPhone || "").trim(),
    profileDescription: String(row.profileDescription || "").trim(),
  };
}

module.exports = {
  pickSellerName,
  resolveProductTitle,
  formatProductCode,
  loadSellerMap,
  loadLogisticaMap,
  toSellerLogisticaContactView,
};
