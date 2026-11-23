import Phaser from 'phaser';
import {
  BORDER_TILES,
  CAMERA_SPEED,
  COLORS,
  EDGE_SCROLL_MARGIN,
  FIELD,
  TILE_SIZE,
  ZOOM_LEVELS,
} from '../config';
import { TEXTURE_KEYS } from '../assets/placeholders';
import { Grid, type Cell } from '../building/grid';
import { BuildTool } from '../building/buildTool';
import { fenceMask, pathMask } from '../building/autotile';
import { computeZoom } from '../core/zoom';
import type { UIScene } from './UIScene';
import {
  clampCenter,
  edgeScrollDirection,
  isButtonHeld,
  nextZoomLevel,
  worldToCell,
  zoomAroundPoint,
} from '../core/camera';

// Jede Ebene hat ihr eigenes Tileset; getrennte Nummernbereiche verhindern Verwechslungen.
const GROUND_GID = 0; // 0 = Wiese, 1 = Rand
const PATH_GID = 10; // 10 … 25 = Wegstücke
const PREVIEW_GID = 30; // 30 = Bauen, 31 = Abreißen, 32 = nicht erlaubt
const FENCE_GID = 40; // 40 … 55 = Zaunstücke
const GATE_GID = 60; // 60 Schleuse waagrecht, 61 senkrecht, 62 Tor waagrecht, 63 senkrecht

const MAP_WIDTH = FIELD.width + 2 * BORDER_TILES;
const MAP_HEIGHT = FIELD.height + 2 * BORDER_TILES;
const WORLD_WIDTH = MAP_WIDTH * TILE_SIZE;
const WORLD_HEIGHT = MAP_HEIGHT * TILE_SIZE;

const NEIGHBOURS: ReadonlyArray<[number, number]> = [
  [0, 0],
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/** Die Spielwelt: Grundstück mit Raster, Kamera und Wegebau. */
export class WorldScene extends Phaser.Scene {
  private grid!: Grid;
  private tool!: BuildTool;
  private pathLayer!: Phaser.Tilemaps.TilemapLayer;
  private structureLayer!: Phaser.Tilemaps.TilemapLayer;
  private previewLayer!: Phaser.Tilemaps.TilemapLayer;
  private gridOverlay!: Phaser.GameObjects.TileSprite;
  private shownPreview: Cell[] = [];

  private zoom = 1;
  private centerX = WORLD_WIDTH / 2;
  private centerY = WORLD_HEIGHT / 2;
  private pointerInside = false;
  private panButton: number | null = null;
  private panLast = { x: 0, y: 0 };
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Phaser.Input.Keyboard.Key>;

  constructor() {
    super('World');
  }

  create(): void {
    this.grid = new Grid(FIELD.width, FIELD.height);
    this.tool = new BuildTool(this.grid);
    this.shownPreview = [];
    this.panButton = null;
    this.pointerInside = false;

    this.createMap();
    this.setupCamera();
    this.setupInput();
    this.scene.launch('UI', { tool: this.tool });

    const offGrid = this.grid.onChange((changed) => this.redrawCells(changed));
    const offTool = this.tool.onChange(() => this.redrawPreview());
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offGrid();
      offTool();
      this.scale.off(Phaser.Scale.Events.RESIZE, this.applyCamera, this);
      this.scene.stop('UI');
    });
  }

  update(_time: number, delta: number): void {
    const cam = this.cameras.main;
    const pointer = this.input.activePointer;

    // Wird die Maustaste über der Werkzeugleiste losgelassen, kommt das Loslassen hier nicht an.
    // Deshalb mit der Tastenmaske des Browsers abgleichen (gebaut wird bis zum letzten sichtbaren Feld).
    if (this.panButton !== null && !isButtonHeld(pointer.buttons, this.panButton)) this.panButton = null;
    if (this.tool.isDragging && !isButtonHeld(pointer.buttons, 0)) this.tool.pointerUp();

    // Kamera per Tastatur und Bildschirmrand verschieben
    const k = this.keys;
    let dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let dy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (this.panButton === null) {
      const edge = edgeScrollDirection(
        pointer.x,
        pointer.y,
        this.scale.width,
        this.scale.height,
        EDGE_SCROLL_MARGIN,
        this.pointerInside,
      );
      dx += edge.dx;
      dy += edge.dy;
    }
    if (dx !== 0 || dy !== 0) {
      const step = (CAMERA_SPEED * delta) / 1000 / this.zoom;
      this.centerX += Math.sign(dx) * step;
      this.centerY += Math.sign(dy) * step;
      this.applyCamera();
    }

    // Feld unter der Maus an das Werkzeug melden (Vorschau läuft auch beim Scrollen mit).
    // Über der Werkzeugleiste bleibt das zuletzt sichtbare Feld stehen.
    if (!this.isOverUi(pointer.x, pointer.y)) {
      const world = cam.getWorldPoint(pointer.x, pointer.y);
      this.tool.pointerMove(worldToCell(world.x, world.y, TILE_SIZE, BORDER_TILES));
    }
  }

  private createMap(): void {
    const map = this.make.tilemap({
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });
    const groundSet = map.addTilesetImage('ground', TEXTURE_KEYS.groundTiles, TILE_SIZE, TILE_SIZE, 0, 0, GROUND_GID);
    const pathSet = map.addTilesetImage('paths', TEXTURE_KEYS.pathTiles, TILE_SIZE, TILE_SIZE, 0, 0, PATH_GID);
    const previewSet = map.addTilesetImage('preview', TEXTURE_KEYS.previewTiles, TILE_SIZE, TILE_SIZE, 0, 0, PREVIEW_GID);
    const fenceSet = map.addTilesetImage('fences', TEXTURE_KEYS.fenceTiles, TILE_SIZE, TILE_SIZE, 0, 0, FENCE_GID);
    const gateSet = map.addTilesetImage('gates', TEXTURE_KEYS.gateTiles, TILE_SIZE, TILE_SIZE, 0, 0, GATE_GID);
    if (!groundSet || !pathSet || !previewSet || !fenceSet || !gateSet) {
      throw new Error('Tilesets konnten nicht erzeugt werden');
    }

    const ground = map.createBlankLayer('ground', groundSet);
    const paths = map.createBlankLayer('paths', pathSet);
    const structures = map.createBlankLayer('structures', [fenceSet, gateSet]);
    if (!ground || !paths || !structures) throw new Error('Kartenebenen konnten nicht erzeugt werden');
    ground.fill(GROUND_GID + 1, 0, 0, MAP_WIDTH, MAP_HEIGHT);
    ground.fill(GROUND_GID, BORDER_TILES, BORDER_TILES, FIELD.width, FIELD.height);
    this.pathLayer = paths;
    this.structureLayer = structures;

    this.gridOverlay = this.add
      .tileSprite(
        BORDER_TILES * TILE_SIZE,
        BORDER_TILES * TILE_SIZE,
        FIELD.width * TILE_SIZE,
        FIELD.height * TILE_SIZE,
        TEXTURE_KEYS.gridCell,
      )
      .setOrigin(0, 0);

    const preview = map.createBlankLayer('preview', previewSet);
    if (!preview) throw new Error('Vorschau-Ebene konnte nicht erzeugt werden');
    preview.setAlpha(0.6);
    this.previewLayer = preview;
  }

  private setupCamera(): void {
    this.cameras.main.setBackgroundColor(COLORS.borderDark);
    const start = computeZoom(this.scale.width, this.scale.height);
    this.zoom = Math.min(Math.max(start, ZOOM_LEVELS.min), ZOOM_LEVELS.max);
    this.centerX = WORLD_WIDTH / 2;
    this.centerY = WORLD_HEIGHT / 2;
    this.applyCamera();
  }

  /** Begrenzt die Kameramitte und überträgt Zoom und Position auf die Phaser-Kamera. */
  private applyCamera(): void {
    const cam = this.cameras.main;
    this.centerX = clampCenter(this.centerX, this.scale.width, this.zoom, 0, WORLD_WIDTH);
    this.centerY = clampCenter(this.centerY, this.scale.height, this.zoom, 0, WORLD_HEIGHT);
    cam.setZoom(this.zoom);
    cam.centerOn(this.centerX, this.centerY);
  }

  private setupInput(): void {
    const input = this.input;
    const keyboard = input.keyboard;
    if (!keyboard) throw new Error('Keine Tastatur-Eingabe verfügbar');

    this.keys = keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as WorldScene['keys'];
    keyboard.on('keydown-R', () => this.tool.rotate());
    keyboard.on('keydown-DELETE', () => this.tool.toggleDemolish());
    keyboard.on('keydown-ESC', () => this.tool.setMode('view'));
    keyboard.on('keydown-G', () => this.gridOverlay.setVisible(!this.gridOverlay.visible));

    input.on(Phaser.Input.Events.GAME_OUT, () => (this.pointerInside = false));
    input.on(Phaser.Input.Events.GAME_OVER, () => (this.pointerInside = true));
    input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
    input.on(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    this.pointerInside = true;
    if (this.isOverUi(pointer.x, pointer.y)) return;

    if (pointer.button === 2) {
      if (!this.tool.cancel()) this.tool.setMode('view');
      return;
    }
    if (pointer.button === 1 || (pointer.button === 0 && this.tool.mode === 'view')) {
      this.panButton = pointer.button;
      this.panLast = { x: pointer.x, y: pointer.y };
      return;
    }
    if (pointer.button === 0) {
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.tool.pointerDown(worldToCell(world.x, world.y, TILE_SIZE, BORDER_TILES));
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    this.pointerInside = true;
    if (this.panButton === null) return;
    this.centerX -= (pointer.x - this.panLast.x) / this.zoom;
    this.centerY -= (pointer.y - this.panLast.y) / this.zoom;
    this.panLast = { x: pointer.x, y: pointer.y };
    this.applyCamera();
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.panButton !== null && pointer.button === this.panButton) {
      this.panButton = null;
      return;
    }
    if (pointer.button === 0) this.tool.pointerUp();
  }

  private onWheel(pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, deltaY: number): void {
    if (deltaY === 0) return;
    const newZoom = nextZoomLevel(this.zoom, deltaY < 0 ? 1 : -1);
    if (newZoom === this.zoom) return;
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.centerX = zoomAroundPoint(this.centerX, world.x, this.zoom, newZoom);
    this.centerY = zoomAroundPoint(this.centerY, world.y, this.zoom, newZoom);
    this.zoom = newZoom;
    this.applyCamera();
  }

  /** Ist die Maus über der Werkzeugleiste? Dann baut ein Klick nichts. */
  private isOverUi(x: number, y: number): boolean {
    const ui = this.scene.get('UI') as UIScene | null;
    return ui !== null && this.scene.isActive('UI') && ui.containsPoint(x, y);
  }

  /** Zeichnet geänderte Felder und ihre Nachbarn neu (Weg- und Zaunstücke verbinden sich). */
  private redrawCells(changed: Cell[]): void {
    for (const cell of changed) {
      for (const [ox, oy] of NEIGHBOURS) {
        const x = cell.x + ox;
        const y = cell.y + oy;
        if (!this.grid.inBounds(x, y)) continue;
        const tx = x + BORDER_TILES;
        const ty = y + BORDER_TILES;
        if (this.grid.isPath(x, y)) {
          this.pathLayer.putTileAt(PATH_GID + pathMask(this.grid, x, y), tx, ty);
        } else {
          this.pathLayer.removeTileAt(tx, ty);
        }
        const structure = this.grid.structureAt(x, y);
        if (structure === 'fence') {
          this.structureLayer.putTileAt(FENCE_GID + fenceMask(this.grid, x, y), tx, ty);
        } else if (structure === 'none') {
          this.structureLayer.removeTileAt(tx, ty);
        } else {
          const vertical = this.grid.gateOrientationAt(x, y) === 'vertical' ? 1 : 0;
          this.structureLayer.putTileAt(GATE_GID + (structure === 'staffGate' ? 2 : 0) + vertical, tx, ty);
        }
      }
    }
  }

  private redrawPreview(): void {
    for (const { x, y } of this.shownPreview) this.previewLayer.removeTileAt(x + BORDER_TILES, y + BORDER_TILES);
    const preview = this.tool.preview;
    this.shownPreview = preview ? [...preview.cells, ...preview.blocked] : [];
    if (!preview) return;
    const index = PREVIEW_GID + (preview.kind === 'build' ? 0 : 1);
    for (const { x, y } of preview.cells) this.previewLayer.putTileAt(index, x + BORDER_TILES, y + BORDER_TILES);
    for (const { x, y } of preview.blocked) this.previewLayer.putTileAt(PREVIEW_GID + 2, x + BORDER_TILES, y + BORDER_TILES);
  }
}
