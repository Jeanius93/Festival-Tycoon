import Phaser from 'phaser';
import { COLORS } from '../config';
import { computeZoom } from '../core/zoom';
import type { BuildTool, ToolMode } from '../building/buildTool';
import { TOOL_HINTS, TOOL_LABELS } from '../ui/hints';

const MODES: readonly ToolMode[] = ['view', 'path', 'fence', 'visitorGate', 'staffGate', 'demolish'];
const toCss = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

interface ToolButton {
  mode: ToolMode;
  box: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

/** Bedienoberfläche über der Spielwelt: Werkzeugleiste und Hinweistext (zoomt nicht mit). */
export class UIScene extends Phaser.Scene {
  private tool!: BuildTool;
  private panel!: Phaser.GameObjects.Rectangle;
  private hint!: Phaser.GameObjects.Text;
  private buttons: ToolButton[] = [];

  constructor() {
    super('UI');
  }

  init(data: { tool: BuildTool }): void {
    this.tool = data.tool;
  }

  create(): void {
    // Die Leiste ist selbst anklickbar, damit Klicks zwischen den Schaltflächen nicht in die Welt durchgehen.
    this.panel = this.add.rectangle(0, 0, 1, 1, COLORS.uiPanel, 0.92).setOrigin(0, 0).setInteractive();
    this.buttons = MODES.map((mode) => {
      const box = this.add.rectangle(0, 0, 1, 1, COLORS.uiButton).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      const label = this.add
        .text(0, 0, TOOL_LABELS[mode], { fontFamily: 'monospace', fontStyle: 'bold', color: toCss(COLORS.uiText) })
        .setOrigin(0.5);
      box.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.button === 0) this.tool.setMode(mode);
      });
      return { mode, box, label };
    });
    this.hint = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        color: toCss(COLORS.uiText),
        backgroundColor: toCss(COLORS.uiPanel),
      })
      .setOrigin(0.5, 1);

    this.layout(this.scale.width, this.scale.height);
    this.refresh();

    const offTool = this.tool.onChange(() => this.refresh());
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offTool();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    });
  }

  /** Liegt der Bildschirmpunkt auf der Werkzeugleiste oder dem Hinweistext? */
  containsPoint(x: number, y: number): boolean {
    if (!this.panel) return false;
    return this.panel.getBounds().contains(x, y) || (this.hint.visible && this.hint.getBounds().contains(x, y));
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    this.layout(gameSize.width, gameSize.height);
  }

  /** Ordnet Leiste und Hinweis unten mittig an; Größe wächst mit der Fenstergröße. */
  private layout(width: number, height: number): void {
    const u = computeZoom(width, height);
    const buttonW = 44 * u;
    const buttonH = 14 * u;
    const gap = 3 * u;
    const pad = 3 * u;
    const panelW = MODES.length * buttonW + (MODES.length - 1) * gap + 2 * pad;
    const panelH = buttonH + 2 * pad;
    const panelX = Math.round((width - panelW) / 2);
    const panelY = height - panelH;

    this.panel.setPosition(panelX, panelY).setSize(panelW, panelH);
    this.panel.input?.hitArea.setTo(0, 0, panelW, panelH);
    this.buttons.forEach(({ box, label }, i) => {
      const x = panelX + pad + i * (buttonW + gap);
      const y = panelY + pad;
      box.setPosition(x, y).setSize(buttonW, buttonH);
      box.input?.hitArea.setTo(0, 0, buttonW, buttonH);
      label.setFontSize(6 * u).setPosition(Math.round(x + buttonW / 2), Math.round(y + buttonH / 2));
    });

    this.hint.setFontSize(4 * u).setPadding(2 * u, u, 2 * u, u);
    this.hint.setPosition(Math.round(width / 2), panelY - u);
  }

  /** Hebt das aktive Werkzeug hervor und zeigt den passenden Hinweis. */
  private refresh(): void {
    for (const { mode, box } of this.buttons) {
      box.setFillStyle(mode === this.tool.mode ? COLORS.uiButtonActive : COLORS.uiButton);
    }
    this.hint.setText(TOOL_HINTS[this.tool.mode]);
  }
}
