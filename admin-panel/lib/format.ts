const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// fecha corta en espanol, como "15 nov 2026"
export function formatDate(date: Date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// "a, b y c"
export function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

// une fechas cortas sin repetir el ano cuando todas comparten el mismo: "7 nov, 6 nov y 2 nov 2026"
export function joinDates(dates: string[]) {
  const year = dates[0]?.match(/ \d{4}$/)?.[0];
  if (!year || !dates.every((date) => date.endsWith(year))) return joinList(dates);
  return joinList(dates.map((date, index) => (index < dates.length - 1 ? date.slice(0, -year.length) : date)));
}

// entero con punto como separador de miles: 1284 -> "1.284"
export function formatCount(value: number) {
  return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// "1 reporte" o "3 reportes"
export function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
