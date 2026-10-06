export const REGULATORY_PROFILES = {
  basel_core: { label: "Basel Core", cet1: 4.5, tier1: 6, total: 8, buffer: 10.5 },
  india_rbi: { label: "India – RBI", cet1: 5.5, tier1: 7, total: 9, buffer: 11.5 },
  usa: { label: "USA", cet1: 4.5, tier1: 6, total: 8, buffer: 10.5 },
  european_union: { label: "European Union", cet1: 4.5, tier1: 6, total: 8, buffer: 10.5 },
} as const;

export type RegulatoryProfile = keyof typeof REGULATORY_PROFILES;

export function isRegulatoryProfile(value: string): value is RegulatoryProfile {
  return Object.prototype.hasOwnProperty.call(REGULATORY_PROFILES, value);
}
