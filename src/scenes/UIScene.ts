import Phaser from 'phaser';
import { COLORS } from '../config';
import { computeZoom } from '../core/zoom';
import type { BuildTool } from '../building/buildTool';
import type { Cash } from '../economy/cash';
import { buildingHint, TOOL_HINTS } from '../ui/hints';
import { formatMoney } from '../ui/format';
import { MAIN_MENU, MenuState, categoryOf, subMenu, type MenuCategory, type MenuEntry } from '../ui/menu';

const toCss = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

/** Höchstzahl der Einträge in einer Unterleiste. */
const MAX_ENTRIES = Math.max(...MAIN_MENU.map((m) => subMenu(m.category).length));

interface Button {
  box: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

/**
 * Bedienoberfläche über der Spielwelt (zoomt nicht mit): Bau-Menü mit Hauptleiste
 * und Unterleiste, Hinweistext und Kassen-Anzeige.
 */
export class UIScene extends Phaser.Scene {
  private tool!: BuildTool;
  private cash!: Cash;
  private mainPanel!: Phaser.GameObjects.Rectangle;
  private subPanel!: Phaser.GameObjects.Rectangle;
  private mainButtons: Array<Button & { category: MenuCategory }> = [];
  private subButtons: Button[] = [];
  private subEntries: MenuEntry[] = [];
  private hint!: Phaser.GameObjects.Text;
  private cashText!: Phaser.GameObjects.Text;
  private menu = new MenuState();
  /** Fenstergröße und offene Unterleiste beim letzten Anordnen; nur bei Änderung wird neu angeordnet. */
  private layoutKey = '';

  constructor() {
    super('UI');
  }

  init(data: { tool: BuildTool; cash: Cash }): void {
    this.tool = data.tool;
    this.cash = data.cash;
    this.menu = new MenuState();
    this.layoutKey = '';
  }

  create(): void {
    // Die Leisten sind selbst anklickbar, damit Klicks zwischen den Schaltflächen nicht in die Welt durchgehen.
    this.mainPanel = this.add.rectangle(0, 0, 1, 1, COLORS.uiPanel, 0.92).setOrigin(0, 0).setInteractive();
    this.subPanel = this.add.rectangle(0, 0, 1, 1, COLORS.uiPanel, 0.92).setOrigin(0, 0).setInteractive();

    this.mainButtons = MAIN_MENU.map(({ category, label }) => {
      const button = this.makeButton(label);
      button.box.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.button === 0) this.onCategory(category);
      });
      return { ...button, category };
    });
    this.subButtons = Array.from({ length: MAX_ENTRIES }, (_, i) => {
      const button = this.makeButton('');
      button.box.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.button === 0) this.onEntry(i);
      });
      return button;
    });

    this.hint = this.add
      .text(0, 0, '', { fontFamily: 'monospace', color: toCss(COLORS.uiText), backgroundColor: toCss(COLORS.uiPanel) })
      .setOrigin(0.5, 1);
    this.cashText = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: toCss(COLORS.uiText),
        backgroundColor: toCss(COLORS.uiPanel),
      })
      .setOrigin(1, 0)
      .setInteractive();

    this.menu.syncTool(this.tool.mode, this.tool.buildingType);
    this.refresh();

    const offTool = this.tool.onChange(() => {
      this.menu.syncTool(this.tool.mode, this.tool.buildingType);
      this.refresh();
    });
    const offCash = this.cash.onChange(() => this.refresh());
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offTool();
      offCash();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    });
  }

  /** Liegt der Bildschirmpunkt auf dem Menü, dem Hinweis oder der Kassen-Anzeige? */
  containsPoint(x: number, y: number): boolean {
    if (!this.mainPanel) return false;
    return [this.mainPanel, this.subPanel, this.hint, this.cashText].some(
      (o) => o.visible && o.getBounds().contains(x, y),
    );
  }

  private makeButton(text: string): Button {
    const box = this.add.rectangle(0, 0, 1, 1, COLORS.uiButton).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    const label = this.add
      .text(0, 0, text, { fontFamily: 'monospace', fontStyle: 'bold', color: toCss(COLORS.uiText), align: 'center' })
      .setOrigin(0.5);
    return { box, label };
  }

  private onCategory(category: MenuCategory): void {
    this.menu.clickCategory(category);
    if (category === 'view' || category === 'demolish') this.tool.setMode(category);
    this.refresh();
  }

  private onEntry(index: number): void {
    const entry = this.subEntries[index];
    if (!entry) return;
    if (entry.action.kind === 'building') this.tool.selectBuilding(entry.action.type);
    else this.tool.setMode(entry.action.mode);
  }

  private onResize(): void {
    this.layoutKey = '';
    this.refresh();
  }

  private isActive(entry: MenuEntry): boolean {
    const { action } = entry;
    if (action.kind === 'building') return this.tool.mode === 'building' && this.tool.buildingType === action.type;
    return this.tool.mode === action.mode;
  }

  /**
   * Aktualisiert Hervorhebung, Hinweis und Kasse. Neu angeordnet wird nur, wenn sich
   * Fenstergröße oder offene Unterleiste geändert haben (das Neuzeichnen von Texten ist teuer,
   * und die Werkzeug-Meldung kommt bei jeder Mausbewegung).
   */
  private refresh(): void {
    const key = `${this.scale.width}x${this.scale.height}|${this.menu.openCategory}`;
    if (key !== this.layoutKey) {
      this.layoutKey = key;
      this.layout();
    }
    const activeCategory = categoryOf(this.tool.mode, this.tool.buildingType);
    for (const button of this.mainButtons) {
      const color =
        button.category === activeCategory
          ? COLORS.uiButtonActive
          : button.category === this.menu.openCategory
            ? COLORS.uiButtonOpen
            : COLORS.uiButton;
      button.box.setFillStyle(color);
    }
    this.subEntries.forEach((entry, i) =>
      this.subButtons[i].box.setFillStyle(this.isActive(entry) ? COLORS.uiButtonActive : COLORS.uiButton),
    );
    const preview = this.tool.preview;
    const hintText =
      this.tool.mode === 'building' && this.tool.buildingType
        ? buildingHint(this.tool.buildingType, preview?.kind === 'building' ? preview.verdict : null, this.cash.balance)
        : TOOL_HINTS[this.tool.mode];
    this.hint.setText(hintText);
    this.cashText.setText(`Kasse: ${formatMoney(this.cash.balance)}`);
  }

  /** Ordnet Leisten, Hinweis und Kasse passend zur Fenstergröße an. */
  private layout(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const u = computeZoom(width, height);
    const gap = 2 * u;
    const pad = 3 * u;
    const buttonW = 48 * u;

    // Hauptleiste unten mittig
    const mainH = 14 * u;
    const mainPanelW = MAIN_MENU.length * buttonW + (MAIN_MENU.length - 1) * gap + 2 * pad;
    const mainPanelH = mainH + 2 * pad;
    const mainX = Math.round((width - mainPanelW) / 2);
    const mainY = height - mainPanelH;
    this.placePanel(this.mainPanel, mainX, mainY, mainPanelW, mainPanelH);
    this.mainButtons.forEach((button, i) => {
      this.placeButton(button, mainX + pad + i * (buttonW + gap), mainY + pad, buttonW, mainH, 6 * u);
    });

    // Unterleiste direkt darüber
    this.subEntries = this.menu.openCategory ? subMenu(this.menu.openCategory) : [];
    const count = this.subEntries.length;
    const hasPrices = this.subEntries.some((e) => e.price !== null);
    const subH = (hasPrices ? 20 : 14) * u;
    const subPanelW = count * buttonW + Math.max(0, count - 1) * gap + 2 * pad;
    const subPanelH = subH + 2 * pad;
    const subX = Math.round((width - subPanelW) / 2);
    const subY = mainY - subPanelH;
    this.subPanel.setVisible(count > 0);
    if (count > 0) this.placePanel(this.subPanel, subX, subY, subPanelW, subPanelH);
    this.subButtons.forEach((button, i) => {
      const entry = this.subEntries[i];
      button.box.setVisible(!!entry);
      button.label.setVisible(!!entry);
      if (!entry) return;
      button.label.setText(entry.price === null ? entry.label : `${entry.label}\n${formatMoney(entry.price)}`);
      this.placeButton(button, subX + pad + i * (buttonW + gap), subY + pad, buttonW, subH, 6 * u);
    });

    // Hinweis über der obersten sichtbaren Leiste
    this.hint.setFontSize(4 * u).setPadding(2 * u, u, 2 * u, u);
    this.hint.setPosition(Math.round(width / 2), (count > 0 ? subY : mainY) - u);

    // Kasse oben rechts
    this.cashText.setFontSize(6 * u).setPadding(3 * u, 2 * u, 3 * u, 2 * u);
    this.cashText.setPosition(width - 2 * u, 2 * u);
  }

  private placePanel(panel: Phaser.GameObjects.Rectangle, x: number, y: number, w: number, h: number): void {
    panel.setPosition(x, y).setSize(w, h);
    panel.input?.hitArea.setTo(0, 0, w, h);
  }

  private placeButton(button: Button, x: number, y: number, w: number, h: number, fontSize: number): void {
    button.box.setPosition(x, y).setSize(w, h);
    button.box.input?.hitArea.setTo(0, 0, w, h);
    button.label.setFontSize(fontSize).setLineSpacing(fontSize / 6);
    button.label.setPosition(Math.round(x + w / 2), Math.round(y + h / 2));
  }
}
