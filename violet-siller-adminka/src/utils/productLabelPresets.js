export const LABEL_OPTION_DEFS = [
  {
    value: 'chegirma',
    title: 'Chegirma',
    hint: 'Faqat foiz qo\'lda yoziladi. Matn va animatsiya avtomatik.',
  },
  {
    value: 'original',
    title: 'Original',
    hint: 'Matn, icon va rang avtomatik beriladi.',
  },
  {
    value: 'superNarx',
    title: 'Super narx',
    hint: 'Matn, icon va rang avtomatik beriladi.',
  },
];

export const SUPER_NARX_ICON = "<i class='bx bxs-hot'></i>";
export const SUPER_NARX_COLOR = '#13BE4C';
export const ORIGINAL_ICON = '&#10004;';
export const ORIGINAL_COLOR = '#f30cfb';
export const CHEGIRMA_ICON = '<span class="animated-hourglass"></span>';
export const CHEGIRMA_COLOR = '#ff3333';

export function buildProductLabelsFromDraft({ labelTypes = [], chegirmaPercent = '' } = {}) {
  const types = Array.isArray(labelTypes) ? labelTypes : [];
  const labels = [];

  if (types.includes('chegirma')) {
    const percent = String(chegirmaPercent ?? '').trim().replace(/%/g, '');
    if (!percent) return labels;

    labels.push({
      text: {
        uz: `Chegirma ${percent}%`,
        ru: `Скидка ${percent}%`,
      },
      icon: CHEGIRMA_ICON,
      color: CHEGIRMA_COLOR,
    });
  }

  if (types.includes('original')) {
    labels.push({
      text: { uz: 'Original', ru: 'Оригинал' },
      icon: ORIGINAL_ICON,
      color: ORIGINAL_COLOR,
    });
  }

  if (types.includes('superNarx')) {
    labels.push({
      text: { uz: 'Super narx', ru: 'Супер цена' },
      icon: SUPER_NARX_ICON,
      color: SUPER_NARX_COLOR,
    });
  }

  return labels;
}

export function toggleLabelType(currentTypes, type) {
  const next = new Set(Array.isArray(currentTypes) ? currentTypes : []);
  if (next.has(type)) next.delete(type);
  else next.add(type);
  return [...next];
}
