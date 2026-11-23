import type { Speed } from '../core/clock';
import { dayOf, minuteOfDay } from '../core/clock';
import type { FestivalSummary } from '../visitors/festival';

const pad = (n: number): string => n.toString().padStart(2, '0');

/** Uhr oben links, z. B. „Tag 1 · 10:00 · Tempo 1“ oder „Tag 2 · 07:05 · Pause“. */
export function clockLabel(second: number, speed: Speed, paused: boolean): string {
  const m = minuteOfDay(second);
  return `Tag ${dayOf(second)} · ${pad(Math.floor(m / 60))}:${pad(m % 60)} · ${paused ? 'Pause' : `Tempo ${speed}`}`;
}

/** Gesamtanzeige, z. B. „Gäste: 84 · Zufriedenheit: 72 %“. */
export function statsLabel(guests: number, satisfaction: number): string {
  return `Gäste: ${guests} · Zufriedenheit: ${satisfaction} %`;
}

export const START_LABEL = 'Festival starten';
export const START_MISSING = 'Zeltfläche mit Weg zur Straße fehlt';

/** Zeilen der Zusammenfassung am Ende des Festivals. */
export function summaryLines(s: FestivalSummary): string[] {
  return [
    'Festival vorbei!',
    `Gäste: ${s.guests}`,
    `Zufriedenheit am Ende: ${s.satisfaction} %`,
    `Früher abgereist: ${s.leftEarly}`,
    `Abgeschleppt: ${s.towed} ${s.towed === 1 ? 'Auto' : 'Autos'}`,
  ];
}
