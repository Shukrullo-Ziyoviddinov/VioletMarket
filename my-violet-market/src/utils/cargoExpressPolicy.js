/** @see shared/cargo-service-rules — bitta qoida manbasi */
/**
 * Mahsulot cargoExpressPolicy (unrestricted | standard_only) — savat/checkout oldidan.
 * Admin product approval zanjirida; cargoServiceType (Standard/Express tarif split) bilan aralashmasin.
 */
import {
  CARGO_EXPRESS_POLICY,
  CARGO_SERVICE_TYPE,
  normalizeCargoExpressPolicy,
  isStandardOnlyCargoItem,
  isUnrestrictedCargoItem,
  isStandardOnlyCargoPolicy,
  isUnrestrictedCargoPolicy,
  normalizeCargoServiceType,
  resolveStoredCargoServiceType,
  isKnownCargoServiceType,
  formatCargoServiceTypeLabel,
  resolveProductCargoLane,
  resolveTrackingCargoServiceType,
} from '@volet/cargo-service-rules';

export {
  CARGO_EXPRESS_POLICY,
  CARGO_SERVICE_TYPE,
  normalizeCargoExpressPolicy,
  isStandardOnlyCargoItem,
  isUnrestrictedCargoItem,
  isStandardOnlyCargoPolicy,
  isUnrestrictedCargoPolicy,
  normalizeCargoServiceType,
  resolveStoredCargoServiceType,
  isKnownCargoServiceType,
  formatCargoServiceTypeLabel,
  resolveProductCargoLane,
  resolveTrackingCargoServiceType,
};

/** Savat/product payload uchun maydon qiymati. */
export function resolveCargoExpressPolicyForCart(productOrItem) {
  return normalizeCargoExpressPolicy(productOrItem?.cargoExpressPolicy);
}
