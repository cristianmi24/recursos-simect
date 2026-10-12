// Fecha y hora siempre en español y en formato de 12 horas (p. ej. «12 oct 2026, 3:45 p. m.»),
// sin depender del idioma configurado en el navegador.
const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', hour12: true });

export function formatDateTime(value?: string | number | Date): string {
  if (value === undefined || value === '') return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : dateTimeFormatter.format(date);
}
