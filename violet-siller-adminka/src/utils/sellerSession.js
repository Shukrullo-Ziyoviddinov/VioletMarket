export function isInvalidSellerSessionError(error) {
  if (!error || typeof error !== 'object') return false;

  return (
    error.status === 401 ||
    error.status === 404 ||
    error.code === 'UNAUTHORIZED' ||
    error.code === 'SELLER_NOT_FOUND' ||
    error.code === 'SELLER_ACCOUNT_NOT_FOUND'
  );
}
