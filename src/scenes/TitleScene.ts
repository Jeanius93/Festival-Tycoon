import Phaser from 'phaser';
import { COLORS, GAME_TITLE } from '../config';
import { computeZoom } from '../core/zoom';
import { TEXTURE_KEYS } from '../assets/placeholders';

const toCss = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

/** Titelbildschirm für M0: Wiese, Titel, Untertitel und Versionsnummer. */
export class TitleScene extends Phaser.Scene {
  private grass!: Phaser.GameObjects.TileSprite;
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private version!: Phaser.GameObjects.Text;

  constructor() {
    super('Title');
  }

  create(): void {
    this.grass = this.add.tileSprite(0, 0, 1, 1, TEXTURE_KEYS.grass).setOrigin(0, 0);

    this.title = this.add
      .text(0, 0, GAME_TITLE, { fontFamily: 'monospace', fontStyle: 'bold', color: toCss(COLORS.titleText) })
      .setOrigin(0.5);
    this.subtitle = this.add
      .text(0, 0, 'M0 – Grundgerüst', { fontFamily: 'monospace', color: toCss(COLORS.titleText) })
      .setOrigin(0.5);
    this.version = this.add
      .text(0, 0, `v${__APP_VERSION__}`, { fontFamily: 'monospace', color: toCss(COLORS.titleText) })
      .setOrigin(1, 1);

    this.layout(this.scale.width, this.scale.height);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    });
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    this.layout(gameSize.width, gameSize.height);
  }

  /** Passt Wiese und Texte an die aktuelle Fenstergröße an. */
  private layout(width: number, height: number): void {
    const zoom = computeZoom(width, height);

    this.grass.setSize(width, height);
    this.grass.setTileScale(zoom, zoom);

    this.title.setFontSize(12 * zoom);
    this.title.setShadow(zoom, zoom, toCss(COLORS.titleShadow), 0, false, true);
    this.title.setPosition(Math.round(width / 2), Math.round(height / 2 - 6 * zoom));

    this.subtitle.setFontSize(6 * zoom);
    this.subtitle.setPosition(Math.round(width / 2), Math.round(height / 2 + 8 * zoom));

    this.version.setFontSize(4 * zoom);
    this.version.setPosition(width - 4 * zoom, height - 4 * zoom);
  }
}
