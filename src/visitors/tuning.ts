/**
 * Alle Stellschrauben der Besucher-Simulation an einer Stelle (Startwerte, werden beim
 * Ausprobieren nachjustiert). Zeiten in Ticks (1 Tick = 2 Spielsekunden), Raten pro Spielstunde.
 */
export const TUNING = {
  /** Felder pro Tick (1,5 Felder je Spielminute) */
  walkPerTick: 0.05,
  carPerTick: 0.15,
  /** Alle 2 Spielminuten kommt ein Auto */
  arrivalEveryTicks: 60,
  /** Wegweiser-Karten jede Spielminute neu (wegen der Schlangen) */
  fieldRefreshTicks: 30,
  /** Ab diesem Wert sucht ein Gast ein Angebot */
  seekAt: 50,
  /** Ab diesem Wert erscheint die Denkblase */
  bubbleAt: 60,
  /** Ab diesem Wert ist ein Bedürfnis dringend (kostet Laune, unterbricht das Zuschauen) */
  urgentAt: 75,
  needPerHour: { thirst: 10, hunger: 7, toilet: 9, music: 15 },
  musicReliefPerHour: 40,
  souvenirWish: 60,
  sameFoodHungerLeft: 30,
  /** Gleiche Essenssorte wie zuletzt zählt wie so viele Felder Umweg */
  varietyPenalty: 15,
  serviceTicks: { stall: 15, toilet: 30 },
  maxQueue: 8,
  /** Jeder Wartende zählt wie so viele Felder Umweg */
  queueCostPerGuest: 3,
  /** Tiefe des Zuschauerbereichs vor der Bühne in Feldern */
  audienceDepth: 6,
  satisfaction: {
    start: 70,
    urgentPerHour: -6,
    queuePerHour: -4,
    musicPerHour: 8,
    stuckPerHour: -10,
    served: 4,
    newFood: 8,
    sameFood: 2,
    souvenir: 6,
  },
  leaveBelow: 25,
  leaveAfterSeconds: 7200,
  retrySeconds: 600,
  wanderRadius: 5,
  wanderWaitTicks: { min: 30, max: 150 },
} as const;
