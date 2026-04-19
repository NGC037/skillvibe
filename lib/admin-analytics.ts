export type MonthlyEventPoint = {
  month: string;
  count: number;
};

export function aggregateEventsByMonth(
  dates: Array<Date | null | undefined>,
  locale = "en-IN",
): MonthlyEventPoint[] {
  const counts = new Map<string, number>();

  dates.forEach((date) => {
    if (!date) {
      return;
    }

    const bucket = new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "2-digit",
    }).format(date);

    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([month, count]) => ({
    month,
    count,
  }));
}
