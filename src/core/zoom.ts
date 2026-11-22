import { MAX_ZOOM, MIN_VIEW } from '../config';

/**
 * Berechnet, um welchen ganzzahligen Faktor die Pixel-Grafik vergrößert wird.
 * Ganze Zahlen halten die Pixel scharf. Die kleinere Fensterseite entscheidet,
 * damit immer mindestens MIN_VIEW sichtbar bleibt. Ungültige Größen
 * (z. B. minimiertes Fenster) ergeben 1.
 */
export function computeZoom(viewWidth: number, viewHeight: number): number {
  if (!Number.isFinite(viewWidth) || !Number.isFinite(viewHeight)) return 1;
  if (viewWidth <= 0 || viewHeight <= 0) return 1;
  const fit = Math.floor(Math.min(viewWidth / MIN_VIEW.width, viewHeight / MIN_VIEW.height));
  return Math.min(Math.max(fit, 1), MAX_ZOOM);
}
