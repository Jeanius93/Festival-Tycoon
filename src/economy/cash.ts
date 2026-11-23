/**
 * Die Kasse des Festivals. Sie wird nie negativ: Ausgaben, für die das Geld
 * nicht reicht, werden abgelehnt. Ab M5 kommen Einnahmen und Ausgaben dazu.
 */
export class Cash {
  private amount: number;
  private readonly listeners = new Set<(balance: number) => void>();

  constructor(start: number) {
    this.amount = start;
  }

  get balance(): number {
    return this.amount;
  }

  canAfford(amount: number): boolean {
    return amount <= this.amount;
  }

  /** Bucht ab, wenn genug Geld da ist; sonst bleibt alles, wie es ist (Rückgabe false). */
  spend(amount: number): boolean {
    if (!this.canAfford(amount)) return false;
    this.change(-amount);
    return true;
  }

  /** Zahlt Geld zurück in die Kasse (z. B. beim Abreißen). */
  refund(amount: number): void {
    this.change(amount);
  }

  /** Meldet jede Änderung des Kontostands; die Rückgabe meldet den Listener wieder ab. */
  onChange(listener: (balance: number) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private change(delta: number): void {
    if (delta === 0) return;
    this.amount += delta;
    for (const listener of this.listeners) listener(this.amount);
  }
}
