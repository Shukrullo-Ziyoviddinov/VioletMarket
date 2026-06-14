const {
  FooterAboutSection,
  FooterSocialLink,
  FooterAppStore,
  FooterContactLink,
} = require("../models");
const { HttpError } = require("../utils/httpError");

function toInt(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new HttpError(400, `${label} noto'g'ri`, "VALIDATION_ERROR");
  }
  return Math.floor(n);
}

function clean(value) {
  return String(value || "").trim();
}

function normalizeI18nPair(value, label) {
  if (!value || typeof value !== "object") {
    throw new HttpError(400, `${label} to'ldirilishi shart`, "VALIDATION_ERROR");
  }
  const uz = clean(value.uz);
  const ru = clean(value.ru);
  if (!uz || !ru) {
    throw new HttpError(400, `${label}.uz va ${label}.ru to'ldirilishi shart`, "VALIDATION_ERROR");
  }
  return { uz, ru };
}

function normalizeAboutItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, "items bo'sh bo'lmasligi kerak", "VALIDATION_ERROR");
  }
  return items.map((item, idx) => ({
    text: normalizeI18nPair(item?.text, `items[${idx}].text`),
  }));
}

function normalizeAboutPayload(raw) {
  if (!raw || typeof raw !== "object") {
    throw new HttpError(400, "About section payload noto'g'ri", "VALIDATION_ERROR");
  }
  return {
    title: normalizeI18nPair(raw.title, "title"),
    items: normalizeAboutItems(raw.items),
  };
}

function normalizeSocialPayload(raw) {
  if (!raw || typeof raw !== "object") {
    throw new HttpError(400, "Social payload noto'g'ri", "VALIDATION_ERROR");
  }
  const name = clean(raw.name);
  const icon = clean(raw.icon);
  const link = clean(raw.link);
  if (!name || !icon || !link) {
    throw new HttpError(400, "name, icon, link to'ldirilishi shart", "VALIDATION_ERROR");
  }
  return { name, icon, link };
}

function normalizeAppStorePayload(raw) {
  if (!raw || typeof raw !== "object") {
    throw new HttpError(400, "App store payload noto'g'ri", "VALIDATION_ERROR");
  }
  const name = clean(raw.name);
  const image = clean(raw.image);
  const link = clean(raw.link);
  if (!name || !image || !link) {
    throw new HttpError(400, "name, image, link to'ldirilishi shart", "VALIDATION_ERROR");
  }
  return { name, image, link };
}

function stripMongoMeta(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = plain;
  return rest;
}

async function listFooterData() {
  const [aboutSections, socialMedia, appStores, contacts] = await Promise.all([
    FooterAboutSection.find().sort({ id: 1 }).lean(),
    FooterSocialLink.find().sort({ id: 1 }).lean(),
    FooterAppStore.find().sort({ id: 1 }).lean(),
    FooterContactLink.find().sort({ id: 1 }).lean(),
  ]);
  return {
    aboutSections: aboutSections.map(stripMongoMeta),
    socialMedia: socialMedia.map(stripMongoMeta),
    appStores: appStores.map(stripMongoMeta),
    contacts: contacts.map(stripMongoMeta),
  };
}

async function getAboutSectionByIdOrThrow(sectionId) {
  const id = toInt(sectionId, "sectionId");
  const section = await FooterAboutSection.findOne({ id });
  if (!section) {
    throw new HttpError(404, "About section topilmadi", "NOT_FOUND");
  }
  return section;
}

async function createAboutSection(payload) {
  const normalized = normalizeAboutPayload(payload);
  const section = new FooterAboutSection(normalized);
  await section.save();
  return stripMongoMeta(section);
}

async function updateAboutSection(sectionId, payload) {
  const section = await getAboutSectionByIdOrThrow(sectionId);
  const merged = {
    title: payload?.title ?? section.title,
    items: payload?.items ?? section.items,
  };
  const normalized = normalizeAboutPayload(merged);
  section.title = normalized.title;
  section.items = normalized.items;
  await section.save();
  return stripMongoMeta(section);
}

async function deleteAboutSection(sectionId) {
  const id = toInt(sectionId, "sectionId");
  const result = await FooterAboutSection.findOneAndDelete({ id });
  if (!result) {
    throw new HttpError(404, "About section topilmadi", "NOT_FOUND");
  }
}

async function getSocialByIdOrThrow(socialId) {
  const id = toInt(socialId, "socialId");
  const row = await FooterSocialLink.findOne({ id });
  if (!row) {
    throw new HttpError(404, "Social media topilmadi", "NOT_FOUND");
  }
  return row;
}

async function createSocial(payload) {
  const normalized = normalizeSocialPayload(payload);
  const row = new FooterSocialLink(normalized);
  await row.save();
  return stripMongoMeta(row);
}

async function updateSocial(socialId, payload) {
  const row = await getSocialByIdOrThrow(socialId);
  const merged = {
    name: payload?.name ?? row.name,
    icon: payload?.icon ?? row.icon,
    link: payload?.link ?? row.link,
  };
  const normalized = normalizeSocialPayload(merged);
  row.name = normalized.name;
  row.icon = normalized.icon;
  row.link = normalized.link;
  await row.save();
  return stripMongoMeta(row);
}

async function deleteSocial(socialId) {
  const id = toInt(socialId, "socialId");
  const result = await FooterSocialLink.findOneAndDelete({ id });
  if (!result) {
    throw new HttpError(404, "Social media topilmadi", "NOT_FOUND");
  }
}

async function getAppStoreByIdOrThrow(appStoreId) {
  const id = toInt(appStoreId, "appStoreId");
  const row = await FooterAppStore.findOne({ id });
  if (!row) {
    throw new HttpError(404, "App store topilmadi", "NOT_FOUND");
  }
  return row;
}

async function createAppStore(payload) {
  const normalized = normalizeAppStorePayload(payload);
  const row = new FooterAppStore(normalized);
  await row.save();
  return stripMongoMeta(row);
}

async function updateAppStore(appStoreId, payload) {
  const row = await getAppStoreByIdOrThrow(appStoreId);
  const merged = {
    name: payload?.name ?? row.name,
    image: payload?.image ?? row.image,
    link: payload?.link ?? row.link,
  };
  const normalized = normalizeAppStorePayload(merged);
  row.name = normalized.name;
  row.image = normalized.image;
  row.link = normalized.link;
  await row.save();
  return stripMongoMeta(row);
}

async function deleteAppStore(appStoreId) {
  const id = toInt(appStoreId, "appStoreId");
  const result = await FooterAppStore.findOneAndDelete({ id });
  if (!result) {
    throw new HttpError(404, "App store topilmadi", "NOT_FOUND");
  }
}

async function getContactByIdOrThrow(contactId) {
  const id = toInt(contactId, "contactId");
  const row = await FooterContactLink.findOne({ id });
  if (!row) {
    throw new HttpError(404, "Contact topilmadi", "NOT_FOUND");
  }
  return row;
}

async function createContact(payload) {
  const normalized = normalizeSocialPayload(payload);
  const row = new FooterContactLink(normalized);
  await row.save();
  return stripMongoMeta(row);
}

async function updateContact(contactId, payload) {
  const row = await getContactByIdOrThrow(contactId);
  const merged = {
    name: payload?.name ?? row.name,
    icon: payload?.icon ?? row.icon,
    link: payload?.link ?? row.link,
  };
  const normalized = normalizeSocialPayload(merged);
  row.name = normalized.name;
  row.icon = normalized.icon;
  row.link = normalized.link;
  await row.save();
  return stripMongoMeta(row);
}

async function deleteContact(contactId) {
  const id = toInt(contactId, "contactId");
  const result = await FooterContactLink.findOneAndDelete({ id });
  if (!result) {
    throw new HttpError(404, "Contact topilmadi", "NOT_FOUND");
  }
}

module.exports = {
  listFooterData,
  createAboutSection,
  updateAboutSection,
  deleteAboutSection,
  createSocial,
  updateSocial,
  deleteSocial,
  createAppStore,
  updateAppStore,
  deleteAppStore,
  createContact,
  updateContact,
  deleteContact,
};
