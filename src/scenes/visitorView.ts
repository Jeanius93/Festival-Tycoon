import Phaser from 'phaser';
import { BORDER_TILES, TILE_SIZE } from '../config';
import {
  TEXTURE_KEYS,
  bubbleTextureKey,
  carTextureKey,
  guestTextureKey,
  tentTextureKey,
} from '../assets/placeholders';
import type { Festival } from '../visitors/festival';
import { bubbleOf } from '../visitors/guest';

/** Zeichenreihenfolge der Festival-Figuren (passt zwischen die Ebenen der WorldScene). */
export const VISITOR_DEPTH = { tents: 2.4, cars: 2.5, guests: 3.5, bubbles: 3.7, stuck: 3.8 } as const;

/** Feldkoordinate → Welt-Pixel (das Grundstück beginnt hinter dem Gebüsch-Rand). */
const px = (field: number): number => Math.round((field + BORDER_TILES) * TILE_SIZE);

/**
 * Zeichnet Zelte, Autos, Gäste, Denkblasen und Warnsymbole und gleicht sie in jedem Bild
 * mit dem Festival ab (neue anlegen, verschwundene entfernen, Positionen setzen).
 */
export class VisitorView {
  private readonly tents = new Map<number, Phaser.GameObjects.Image>();
  private readonly cars = new Map<number, { image: Phaser.GameObjects.Image; x: number; y: number }>();
  private readonly guests = new Map<number, Phaser.GameObjects.Image>();
  private readonly bubbles = new Map<number, Phaser.GameObjects.Image>();
  private readonly stuck = new Map<string, Phaser.GameObjects.Image>();

  constructor(private readonly scene: Phaser.Scene) {}

  sync(f: Festival): void {
    const second = f.clock.second;
    const seenStuck = new Set<string>();

    const tentIds = new Set<number>();
    for (const t of f.tents()) {
      tentIds.add(t.groupId);
      if (this.tents.has(t.groupId)) continue;
      const image = this.scene.add
        .image(px(t.plot.x), px(t.plot.y), tentTextureKey(t.color))
        .setOrigin(0, 0)
        .setDepth(VISITOR_DEPTH.tents);
      this.tents.set(t.groupId, image);
    }
    this.prune(this.tents, tentIds);

    const carIds = new Set<number>();
    for (const c of f.cars()) {
      carIds.add(c.id);
      let entry = this.cars.get(c.id);
      if (!entry) {
        const image = this.scene.add.image(0, 0, carTextureKey(c.color)).setDepth(VISITOR_DEPTH.cars);
        entry = { image, x: c.x, y: c.y };
        this.cars.set(c.id, entry);
      }
      // Fahrtrichtung aus der Bewegung seit dem letzten Bild (Front zeigt im Bild nach oben).
      const dx = c.x - entry.x;
      const dy = c.y - entry.y;
      // Geparkt steht ein Auto immer senkrecht in seiner Spalte des Stellplatzes.
      if (c.state === 'parked') entry.image.setAngle(0);
      else if (Math.abs(dx) + Math.abs(dy) > 0.001) {
        entry.image.setAngle(Math.round((Math.atan2(dx, -dy) * 180) / Math.PI / 90) * 90);
      }
      entry.x = c.x;
      entry.y = c.y;
      // Geparkt mittig im Stellplatz (Parkfeld ist dessen untere Hälfte), sonst auf der Fahrspur.
      entry.image.setPosition(px(c.x), px(c.state === 'parked' ? c.y - 0.5 : c.y));
      if (c.stuck) this.showStuck(`car-${c.id}`, c.x, c.y - 0.9, seenStuck);
    }
    for (const [id, entry] of this.cars) {
      if (carIds.has(id)) continue;
      entry.image.destroy();
      this.cars.delete(id);
    }

    const guestIds = new Set<number>();
    for (const g of f.guests()) {
      const hidden = g.state.kind === 'inTent';
      let image = this.guests.get(g.id);
      if (!image) {
        image = this.scene.add.image(0, 0, guestTextureKey(g.color)).setOrigin(0.5, 1).setDepth(VISITOR_DEPTH.guests);
        this.guests.set(g.id, image);
      }
      guestIds.add(g.id);
      image.setVisible(!hidden).setPosition(px(g.x), px(g.y) + 3);
      const bubble = hidden ? null : bubbleOf(g, second);
      let bubbleImage = this.bubbles.get(g.id);
      if (bubble) {
        if (!bubbleImage) {
          bubbleImage = this.scene.add.image(0, 0, bubbleTextureKey(bubble)).setOrigin(0.5, 1).setDepth(VISITOR_DEPTH.bubbles);
          this.bubbles.set(g.id, bubbleImage);
        }
        bubbleImage.setTexture(bubbleTextureKey(bubble)).setVisible(true).setPosition(px(g.x), px(g.y) - 6);
      } else {
        bubbleImage?.setVisible(false);
      }
    }
    this.prune(this.guests, guestIds);
    this.prune(this.bubbles, guestIds);

    for (const [key, image] of this.stuck) {
      if (seenStuck.has(key)) continue;
      image.destroy();
      this.stuck.delete(key);
    }
  }

  destroy(): void {
    for (const map of [this.tents, this.guests, this.bubbles, this.stuck]) {
      for (const image of map.values()) image.destroy();
      map.clear();
    }
    for (const entry of this.cars.values()) entry.image.destroy();
    this.cars.clear();
  }

  private showStuck(key: string, x: number, y: number, seen: Set<string>): void {
    seen.add(key);
    let image = this.stuck.get(key);
    if (!image) {
      image = this.scene.add.image(0, 0, TEXTURE_KEYS.stuckWarning).setOrigin(0.5, 1).setDepth(VISITOR_DEPTH.stuck);
      this.stuck.set(key, image);
    }
    image.setPosition(px(x), px(y));
  }

  private prune(map: Map<number, Phaser.GameObjects.Image>, keep: Set<number>): void {
    for (const [id, image] of map) {
      if (keep.has(id)) continue;
      image.destroy();
      map.delete(id);
    }
  }
}
