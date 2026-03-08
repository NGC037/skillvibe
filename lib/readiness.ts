// lib/readiness.ts

export function calculateTeamReadiness(
  memberCount: number,
  minTeamSize: number
) {
  if (minTeamSize === 0) return 0;

  const percentage = (memberCount / minTeamSize) * 100;

  return Math.round(percentage);
}

export function getTeamStatus(
  memberCount: number,
  minTeamSize: number,
  maxTeamSize: number
) {
  if (memberCount < minTeamSize) return "BELOW_MIN";
  if (memberCount === maxTeamSize) return "FULL";
  return "READY";
}

export function calculateConfirmationRatio(
  confirmedCount: number,
  totalParticipations: number
) {
  if (totalParticipations === 0) return 0;

  const percentage = (confirmedCount / totalParticipations) * 100;

  return Math.round(percentage);
}
export function isTeamLockEligible(
  memberCount: number,
  minTeamSize: number,
  eventConfirmationPercentage: number
) {
  if (memberCount < minTeamSize) return false;
  if (eventConfirmationPercentage < 50) return false;

  return true;
}