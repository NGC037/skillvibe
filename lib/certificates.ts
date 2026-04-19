export const CERTIFICATE_REWARD_MAP = {
  WON: 50,
  PARTICIPATED: 20,
} as const;

export const CERTIFICATE_MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_CERTIFICATE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
] as const;

export function isAllowedCertificateMimeType(type: string) {
  return ALLOWED_CERTIFICATE_TYPES.includes(
    type as (typeof ALLOWED_CERTIFICATE_TYPES)[number],
  );
}

export function getCertificateReward(type: keyof typeof CERTIFICATE_REWARD_MAP) {
  return CERTIFICATE_REWARD_MAP[type];
}

export function getCertificateCategory(certificate: {
  type: "WON" | "PARTICIPATED";
  isSkillVibeEvent: boolean;
}) {
  if (certificate.isSkillVibeEvent) {
    return "SkillVibe Events";
  }

  return certificate.type === "WON" ? "Won" : "Participated";
}
