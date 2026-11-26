const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// fecha corta en ingles, como "15 Nov 2026"
export function formatDate(date: Date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// "a, b and c"
export function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

// une fechas cortas sin repetir el ano cuando todas comparten el mismo: "7 Nov, 6 Nov and 2 Nov 2026"
export function joinDates(dates: string[]) {
  const year = dates[0]?.match(/ \d{4}$/)?.[0];
  if (!year || !dates.every((date) => date.endsWith(year))) return joinList(dates);
  return joinList(
    dates.map((date, index) => (index < dates.length - 1 ? date.slice(0, -year.length) : date)),
  );
}

// entero con coma como separador de miles: 1284 -> "1,284"
export function formatCount(value: number) {
  return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// "1 report" o "3 reports"
export function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
