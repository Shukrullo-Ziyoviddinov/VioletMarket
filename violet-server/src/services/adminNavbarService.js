const { NavbarSection } = require("../models");
const { HttpError } = require("../utils/httpError");

function toInt(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new HttpError(400, `${label} noto'g'ri`, "VALIDATION_ERROR");
  }
  return Math.floor(n);
}

function normalizeI18nPair(value, label) {
  if (!value || typeof value !== "object") {
    throw new HttpError(400, `${label} to'ldirilishi shart`, "VALIDATION_ERROR");
  }
  const uz = String(value.uz || "").trim();
  const ru = String(value.ru || "").trim();
  if (!uz || !ru) {
    throw new HttpError(400, `${label}.uz va ${label}.ru to'ldirilishi shart`, "VALIDATION_ERROR");
  }
  return { uz, ru };
}

function normalizeNavbarItem(raw, index) {
  const itemLabel = `items[${index}]`;
  if (!raw || typeof raw !== "object") {
    throw new HttpError(400, `${itemLabel} noto'g'ri`, "VALIDATION_ERROR");
  }

  const normalized = {
    name: normalizeI18nPair(raw.name, `${itemLabel}.name`),
    category: String(raw.category || raw.name?.uz || "").trim(),
    image: String(raw.image || "").trim(),
    description: normalizeI18nPair(raw.description, `${itemLabel}.description`),
  };

  if (!normalized.category) {
    throw new HttpError(400, `${itemLabel}.category to'ldirilishi shart`, "VALIDATION_ERROR");
  }

  if (raw.id != null && String(raw.id).trim() !== "") {
    normalized.id = toInt(raw.id, `${itemLabel}.id`);
  }

  return normalized;
}

function mapSection(sectionDoc) {
  if (!sectionDoc) return null;
  const plain = typeof sectionDoc.toObject === "function" ? sectionDoc.toObject() : sectionDoc;
  const { _id, __v, createdAt, updatedAt, ...rest } = plain;
  return rest;
}

async function listSections() {
  const docs = await NavbarSection.find().sort({ id: 1 }).lean();
  return docs.map(mapSection);
}

async function getSectionByIdOrThrow(sectionId) {
  const id = toInt(sectionId, "sectionId");
  const section = await NavbarSection.findOne({ id });
  if (!section) {
    throw new HttpError(404, "Navbar section topilmadi", "NOT_FOUND");
  }
  return section;
}

async function createSection(payload) {
  const title = normalizeI18nPair(payload?.title, "title");
  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  const items = rawItems.map((item, index) => normalizeNavbarItem(item, index));

  const section = new NavbarSection({ title, items });
  await section.save();
  return mapSection(section);
}

async function updateSection(sectionId, payload) {
  const section = await getSectionByIdOrThrow(sectionId);
  if (payload?.title != null) {
    section.title = normalizeI18nPair(payload.title, "title");
  }
  if (Array.isArray(payload?.items)) {
    section.items = payload.items.map((item, index) => normalizeNavbarItem(item, index));
  }
  await section.save();
  return mapSection(section);
}

async function deleteSection(sectionId) {
  const id = toInt(sectionId, "sectionId");
  const result = await NavbarSection.findOneAndDelete({ id });
  if (!result) {
    throw new HttpError(404, "Navbar section topilmadi", "NOT_FOUND");
  }
}

async function createItem(sectionId, payload) {
  const section = await getSectionByIdOrThrow(sectionId);
  const item = normalizeNavbarItem(payload, section.items.length);
  section.items.push(item);
  await section.save();
  return mapSection(section);
}

async function updateItem(sectionId, itemId, payload) {
  const section = await getSectionByIdOrThrow(sectionId);
  const normalizedItemId = toInt(itemId, "itemId");
  const index = section.items.findIndex((item) => Number(item.id) === normalizedItemId);
  if (index === -1) {
    throw new HttpError(404, "Navbar item topilmadi", "NOT_FOUND");
  }
  const existing = section.items[index];
  const merged = {
    id: existing.id,
    name: payload?.name ?? existing.name,
    category: payload?.category ?? existing.category,
    image: payload?.image ?? existing.image,
    description: payload?.description ?? existing.description,
  };
  section.items[index] = normalizeNavbarItem(merged, index);
  await section.save();
  return mapSection(section);
}

async function deleteItem(sectionId, itemId) {
  const section = await getSectionByIdOrThrow(sectionId);
  const normalizedItemId = toInt(itemId, "itemId");
  const before = section.items.length;
  section.items = section.items.filter((item) => Number(item.id) !== normalizedItemId);
  if (section.items.length === before) {
    throw new HttpError(404, "Navbar item topilmadi", "NOT_FOUND");
  }
  await section.save();
  return mapSection(section);
}

module.exports = {
  listSections,
  createSection,
  updateSection,
  deleteSection,
  createItem,
  updateItem,
  deleteItem,
};
