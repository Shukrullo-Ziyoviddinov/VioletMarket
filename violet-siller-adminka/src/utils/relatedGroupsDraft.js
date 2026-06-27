export const MAX_RELATED_PRODUCTS_PER_GROUP = 3;

function createLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createRelatedGroupDraft() {
  return {
    localId: createLocalId('related-group'),
    titleUz: '',
    titleRu: '',
    productIds: [],
  };
}

export function getInitialRelatedGroupsFormFields() {
  return {
    relatedGroups: [],
  };
}

function normalizeProductIds(productIds) {
  return [...new Set((Array.isArray(productIds) ? productIds : []).map(Number))]
    .filter((id) => Number.isFinite(id))
    .slice(0, MAX_RELATED_PRODUCTS_PER_GROUP);
}

export function buildRelatedGroupsPayload(values) {
  const groups = Array.isArray(values?.relatedGroups) ? values.relatedGroups : [];

  return groups
    .map((group) => {
      const titleUz = String(group?.titleUz || '').trim();
      const titleRu = String(group?.titleRu || '').trim();
      const productIds = normalizeProductIds(group?.productIds);

      if (!titleUz && !titleRu && productIds.length === 0) {
        return null;
      }

      return {
        title: {
          uz: titleUz,
          ru: titleRu,
        },
        productIds,
      };
    })
    .filter(Boolean);
}
