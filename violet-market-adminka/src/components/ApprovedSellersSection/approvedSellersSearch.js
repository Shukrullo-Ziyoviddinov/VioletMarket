export function filterApprovedSellersBySearch(sellers, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return Array.isArray(sellers) ? sellers : [];
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return Array.isArray(sellers) ? sellers : [];
  }

  return (Array.isArray(sellers) ? sellers : []).filter((seller) => {
    const fields = [
      seller?.shopDisplayName,
      seller?.firstName,
      seller?.lastName,
    ]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);

    if (!fields.length) return false;

    return tokens.every((token) => fields.some((field) => field.includes(token)));
  });
}
