export function formatSellerRevenue(value) {
  const amount = Number(value) || 0;
  return `${new Intl.NumberFormat('uz-UZ').format(amount)} UZS`;
}
