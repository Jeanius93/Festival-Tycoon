/** Geldbetrag fürs Spiel: Tausender mit Leerzeichen, dann „€“ (z. B. „10 000 €“). */
export function formatMoney(amount: number): string {
  const digits = Math.round(Math.abs(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${amount < 0 ? '-' : ''}${digits} €`;
}
