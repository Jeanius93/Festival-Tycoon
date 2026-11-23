/** Bewegt `e` höchstens `step` Felder geradlinig auf `target` zu; true bei Ankunft. */
export function moveToward(e: { x: number; y: number }, target: { x: number; y: number }, step: number): boolean {
  const dx = target.x - e.x;
  const dy = target.y - e.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= step) {
    e.x = target.x;
    e.y = target.y;
    return true;
  }
  e.x += (dx / dist) * step;
  e.y += (dy / dist) * step;
  return false;
}
