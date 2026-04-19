export type EventTimelineStatus = "ONGOING" | "UPCOMING" | "PAST";

export function getEventTimelineStatus({
  registrationStartDate,
  registrationEndDate,
  now = new Date(),
}: {
  registrationStartDate: Date | null;
  registrationEndDate: Date | null;
  now?: Date;
}): EventTimelineStatus {
  if (registrationStartDate && now < registrationStartDate) {
    return "UPCOMING";
  }

  if (registrationEndDate && now > registrationEndDate) {
    return "PAST";
  }

  return "ONGOING";
}

export function formatDateForInput(date: Date | string | null | undefined) {
  if (!date) return "";

  const normalizedDate = typeof date === "string" ? new Date(date) : date;
  const year = normalizedDate.getFullYear();
  const month = `${normalizedDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${normalizedDate.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
