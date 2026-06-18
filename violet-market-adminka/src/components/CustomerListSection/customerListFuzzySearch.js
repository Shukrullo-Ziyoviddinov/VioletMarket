const EMPTY_FIELD_MARK = '—';
const MIN_MATCH_SCORE = 0.58;

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[’'`]/g, '');
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function isEmptyField(value) {
  const text = String(value || '').trim();
  return !text || text === EMPTY_FIELD_MARK;
}

function levenshteinDistance(left, right) {
  const a = String(left || '');
  const b = String(right || '');

  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarityScore(left, right) {
  const a = String(left || '');
  const b = String(right || '');

  if (!a && !b) return 1;
  if (!a || !b) return 0;

  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLength;
}

function minScoreForLength(length) {
  if (length <= 2) return 0.5;
  if (length <= 4) return 0.58;
  return 0.65;
}

function compareField(queryPart, fieldValue, { isPhone = false } = {}) {
  const query = isPhone ? normalizePhone(queryPart) : normalizeText(queryPart);
  const field = isPhone ? normalizePhone(fieldValue) : normalizeText(fieldValue);

  if (!query) return 1;
  if (isEmptyField(fieldValue) || !field) return 0;

  if (field.includes(query) || query.includes(field)) {
    return 1;
  }

  if (field.startsWith(query) || query.startsWith(field)) {
    const base = Math.max(field.length, query.length);
    return Math.max(0.82, query.length / base);
  }

  const score = similarityScore(field, query);
  return score >= minScoreForLength(query.length) ? score : 0;
}

function splitQueryTokens(query) {
  return String(query || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function isPhoneToken(token) {
  const digits = normalizePhone(token);
  return digits.length >= 2;
}

function parseSearchParts(query) {
  const tokens = splitQueryTokens(query);
  if (!tokens.length) {
    return { firstName: '', lastName: '', phone: '', mode: 'empty' };
  }

  const phoneTokens = tokens.filter(isPhoneToken);
  const textTokens = tokens.filter((token) => !isPhoneToken(token));
  const phone = phoneTokens.map(normalizePhone).join('');

  if (!textTokens.length) {
    return { firstName: '', lastName: '', phone, mode: 'phone' };
  }

  if (textTokens.length === 1) {
    return {
      firstName: textTokens[0],
      lastName: '',
      phone,
      mode: phone ? 'name-phone' : 'single',
    };
  }

  return {
    firstName: textTokens.slice(0, -1).join(' '),
    lastName: textTokens[textTokens.length - 1],
    phone,
    mode: phone ? 'full' : 'name',
  };
}

function scoreCustomerMatch(customer, parts) {
  const firstName = customer?.firstName;
  const lastName = customer?.lastName;
  const phone = customer?.phone;

  if (parts.mode === 'empty') return 1;

  if (parts.mode === 'phone') {
    return compareField(parts.phone, phone, { isPhone: true });
  }

  if (parts.mode === 'single') {
    return Math.max(
      compareField(parts.firstName, firstName),
      compareField(parts.firstName, lastName),
      compareField(parts.firstName, phone, { isPhone: true }),
    );
  }

  if (parts.mode === 'name') {
    const directScore = (
      compareField(parts.firstName, firstName) + compareField(parts.lastName, lastName)
    ) / 2;
    const swappedScore = (
      compareField(parts.firstName, lastName) + compareField(parts.lastName, firstName)
    ) / 2;
    return Math.max(directScore, swappedScore);
  }

  if (parts.mode === 'name-phone') {
    const directNameScore = (
      compareField(parts.firstName, firstName) + compareField(parts.lastName, lastName)
    ) / 2;
    const swappedNameScore = (
      compareField(parts.firstName, lastName) + compareField(parts.lastName, firstName)
    ) / 2;
    const nameScore = Math.max(directNameScore, swappedNameScore);
    const phoneScore = compareField(parts.phone, phone, { isPhone: true });
    return (nameScore + phoneScore) / 2;
  }

  const directScore = (
    compareField(parts.firstName, firstName)
    + compareField(parts.lastName, lastName)
    + compareField(parts.phone, phone, { isPhone: true })
  ) / 3;
  const swappedScore = (
    compareField(parts.firstName, lastName)
    + compareField(parts.lastName, firstName)
    + compareField(parts.phone, phone, { isPhone: true })
  ) / 3;

  return Math.max(directScore, swappedScore);
}

export function filterCustomersBySearch(customers, query) {
  const list = Array.isArray(customers) ? customers : [];
  const parts = parseSearchParts(query);

  if (parts.mode === 'empty') {
    return list;
  }

  return list
    .map((customer) => ({
      customer,
      score: scoreCustomerMatch(customer, parts),
    }))
    .filter(({ score }) => score >= MIN_MATCH_SCORE)
    .sort((left, right) => right.score - left.score)
    .map(({ customer }) => customer);
}
