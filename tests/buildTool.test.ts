import { describe, it, expect, vi } from 'vitest';
import { Grid } from '../src/building/grid';
import { BuildTool } from '../src/building/buildTool';
import { Cash } from '../src/economy/cash';

const setup = () => {
  const grid = new Grid(10, 10);
  return { grid, tool: new BuildTool(grid, new Cash(10000)) };
};

describe('BuildTool', () => {
  it('startet in „Ansehen“ und baut dort nichts', () => {
    const { grid, tool } = setup();
    expect(tool.mode).toBe('view');
    tool.pointerDown({ x: 1, y: 1 });
    expect(tool.pointerUp()).toEqual([]);
    expect(grid.isPath(1, 1)).toBe(false);
    expect(tool.preview).toBeNull();
  });
  it('Ziehen baut L-Weg waagrecht zuerst', () => {
    const { grid, tool } = setup();
    tool.setMode('path');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 2, y: 1 });
    expect(tool.preview).toEqual({ kind: 'build', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }], blocked: [] });
    expect(tool.pointerUp()).toHaveLength(4);
    expect(grid.isPath(2, 0)).toBe(true);
    expect(tool.isDragging).toBe(false);
  });
  it('R dreht die Ecke während des Ziehens', () => {
    const { grid, tool } = setup();
    tool.setMode('path');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 2, y: 1 });
    tool.rotate();
    tool.pointerUp();
    expect(grid.isPath(0, 1)).toBe(true);
    expect(grid.isPath(2, 0)).toBe(false);
  });
  it('Klick ohne Ziehen baut ein Feld', () => {
    const { grid, tool } = setup();
    tool.setMode('path');
    tool.pointerDown({ x: 4, y: 4 });
    expect(tool.pointerUp()).toEqual([{ x: 4, y: 4 }]);
    expect(grid.isPath(4, 4)).toBe(true);
  });
  it('Abbrechen baut nichts', () => {
    const { grid, tool } = setup();
    tool.setMode('path');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 3, y: 0 });
    expect(tool.cancel()).toBe(true);
    expect(tool.pointerUp()).toEqual([]);
    expect(grid.isPath(0, 0)).toBe(false);
    expect(tool.cancel()).toBe(false);
  });
  it('Felder außerhalb werden abgeschnitten', () => {
    const { grid, tool } = setup();
    tool.setMode('path');
    tool.pointerDown({ x: 8, y: 0 });
    tool.pointerMove({ x: 12, y: 0 });
    expect(tool.preview?.cells).toEqual([{ x: 8, y: 0 }, { x: 9, y: 0 }]);
    expect(tool.pointerUp()).toHaveLength(2);
    expect(grid.isPath(9, 0)).toBe(true);
  });
  it('vorhandene Wege werden übersprungen', () => {
    const { grid, tool } = setup();
    grid.applyPath([{ x: 1, y: 0 }], true);
    tool.setMode('path');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 2, y: 0 });
    expect(tool.pointerUp()).toEqual([{ x: 0, y: 0 }, { x: 2, y: 0 }]);
  });
  it('Abreißen entfernt Wege, Vorschau rot', () => {
    const { grid, tool } = setup();
    grid.applyPath([{ x: 0, y: 0 }, { x: 1, y: 0 }], true);
    tool.setMode('demolish');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 3, y: 0 });
    expect(tool.preview?.kind).toBe('demolish');
    expect(tool.pointerUp()).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    expect(grid.isPath(0, 0)).toBe(false);
  });
  it('Entf schaltet Abreißen ein und zurück zum vorherigen Modus', () => {
    const { tool } = setup();
    tool.setMode('path');
    tool.toggleDemolish();
    expect(tool.mode).toBe('demolish');
    tool.toggleDemolish();
    expect(tool.mode).toBe('path');
  });
  it('Moduswechsel bricht Ziehen ab', () => {
    const { grid, tool } = setup();
    tool.setMode('path');
    tool.pointerDown({ x: 0, y: 0 });
    tool.setMode('view');
    expect(tool.pointerUp()).toEqual([]);
    expect(grid.isPath(0, 0)).toBe(false);
  });
  it('Hover-Vorschau ohne Ziehen, außerhalb null', () => {
    const { tool } = setup();
    tool.setMode('path');
    tool.pointerMove({ x: 3, y: 3 });
    expect(tool.preview).toEqual({ kind: 'build', cells: [{ x: 3, y: 3 }], blocked: [] });
    tool.pointerMove({ x: -1, y: 3 });
    expect(tool.preview).toBeNull();
  });
  it('onChange nur bei echter Änderung', () => {
    const { tool } = setup();
    const listener = vi.fn();
    tool.onChange(listener);
    tool.setMode('path');
    tool.pointerMove({ x: 1, y: 1 });
    tool.pointerMove({ x: 1, y: 1 });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('Zaun wird in L-Form gezogen', () => {
    const { grid, tool } = setup();
    tool.setMode('fence');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 2, y: 1 });
    expect(tool.pointerUp()).toHaveLength(4);
    for (const [x, y] of [[0, 0], [1, 0], [2, 0], [2, 1]]) expect(grid.structureAt(x, y)).toBe('fence');
    expect(grid.isPath(0, 0)).toBe(false);
  });
  it('Weg über Zaun: Zaunfeld rot und übersprungen', () => {
    const { grid, tool } = setup();
    grid.apply([{ x: 2, y: 0, structure: 'fence' }]);
    tool.setMode('path');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 4, y: 0 });
    expect(tool.preview).toEqual({
      kind: 'build',
      cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }],
      blocked: [{ x: 2, y: 0 }],
    });
    tool.pointerUp();
    expect(grid.isPath(2, 0)).toBe(false);
    expect(grid.structureAt(2, 0)).toBe('fence');
    expect(grid.isPath(4, 0)).toBe(true);
  });
  it('Schleuse per Klick in geraden Zaun, auch nach Ziehen nur ein Feld', () => {
    const { grid, tool } = setup();
    grid.apply([1, 2, 3, 4, 5].map((x) => ({ x, y: 3, structure: 'fence' as const })));
    tool.setMode('visitorGate');
    tool.pointerDown({ x: 2, y: 3 });
    tool.pointerMove({ x: 4, y: 3 });
    expect(tool.preview).toEqual({ kind: 'build', cells: [{ x: 4, y: 3 }], blocked: [] });
    expect(tool.pointerUp()).toEqual([{ x: 4, y: 3 }]);
    expect(grid.structureAt(4, 3)).toBe('visitorGate');
    expect(grid.gateOrientationAt(4, 3)).toBe('horizontal');
    expect(grid.structureAt(2, 3)).toBe('fence');
  });
  it('Durchgang an Ecke: rot, nichts gebaut', () => {
    const { grid, tool } = setup();
    grid.apply([
      { x: 1, y: 1, structure: 'fence' },
      { x: 2, y: 1, structure: 'fence' },
      { x: 2, y: 2, structure: 'fence' },
    ]);
    tool.setMode('staffGate');
    tool.pointerMove({ x: 2, y: 1 });
    expect(tool.preview).toEqual({ kind: 'build', cells: [], blocked: [{ x: 2, y: 1 }] });
    tool.pointerDown({ x: 2, y: 1 });
    expect(tool.pointerUp()).toEqual([]);
    expect(grid.structureAt(2, 1)).toBe('fence');
  });
  it('Zaun über Durchgang: Durchgang bleibt, nicht rot', () => {
    const { grid, tool } = setup();
    grid.apply([{ x: 1, y: 0, structure: 'staffGate', orientation: 'horizontal', path: true }]);
    tool.setMode('fence');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 2, y: 0 });
    expect(tool.preview?.blocked).toEqual([]);
    tool.pointerUp();
    expect(grid.structureAt(1, 0)).toBe('staffGate');
    expect(grid.isPath(1, 0)).toBe(true);
    expect(grid.structureAt(2, 0)).toBe('fence');
  });
  it('Abreißen entfernt Weg, Zaun und Tor', () => {
    const { grid, tool } = setup();
    grid.apply([
      { x: 0, y: 0, path: true },
      { x: 1, y: 0, structure: 'fence' },
      { x: 2, y: 0, structure: 'fence' },
      { x: 2, y: 1, structure: 'staffGate', orientation: 'vertical', path: true },
      { x: 2, y: 2, structure: 'fence' },
    ]);
    tool.setMode('demolish');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 2, y: 1 });
    expect(tool.preview?.kind).toBe('demolish');
    tool.pointerUp();
    expect(grid.isPath(0, 0)).toBe(false);
    expect(grid.structureAt(1, 0)).toBe('none');
    expect(grid.structureAt(2, 1)).toBe('none');
    expect(grid.isPath(2, 1)).toBe(false);
    expect(grid.structureAt(2, 2)).toBe('fence');
  });
  it('Abriss neben Durchgang lässt ihn stehen', () => {
    const { grid, tool } = setup();
    grid.apply([
      { x: 1, y: 1, structure: 'fence' },
      { x: 2, y: 1, structure: 'visitorGate', orientation: 'horizontal' },
      { x: 3, y: 1, structure: 'fence' },
    ]);
    tool.setMode('demolish');
    tool.pointerDown({ x: 1, y: 1 });
    tool.pointerUp();
    expect(grid.structureAt(1, 1)).toBe('none');
    expect(grid.structureAt(2, 1)).toBe('visitorGate');
    expect(grid.gateOrientationAt(2, 1)).toBe('horizontal');
  });
  it('Entf schaltet aus Zaun ins Abreißen und zurück', () => {
    const { tool } = setup();
    tool.setMode('fence');
    tool.toggleDemolish();
    expect(tool.mode).toBe('demolish');
    tool.toggleDemolish();
    expect(tool.mode).toBe('fence');
  });
});

describe('BuildTool – Gebäude', () => {
  const setupCash = (balance = 10000) => {
    const grid = new Grid(20, 20);
    const cash = new Cash(balance);
    return { grid, cash, tool: new BuildTool(grid, cash) };
  };
  const click = (tool: BuildTool, x: number, y: number) => {
    tool.pointerMove({ x, y });
    tool.pointerDown({ x, y });
    return tool.pointerUp();
  };

  it('Klick stellt den Bierstand hin und bucht ab; Werkzeug bleibt aktiv', () => {
    const { grid, cash, tool } = setupCash();
    tool.selectBuilding('beer');
    expect(click(tool, 5, 5)).toHaveLength(6);
    expect(grid.buildingAt(4, 5)).toMatchObject({ type: 'beer', x: 4, y: 5, width: 3, height: 2, facing: 'N', paidPrice: 600 });
    expect(cash.balance).toBe(9400);
    expect(tool.mode).toBe('building');
    expect(tool.buildingType).toBe('beer');
  });
  it('Vorschau zeigt Grundfläche, Rückseite und Urteil', () => {
    const { tool } = setupCash();
    tool.selectBuilding('beer');
    tool.pointerMove({ x: 5, y: 5 });
    expect(tool.preview).toMatchObject({
      kind: 'building',
      type: 'beer',
      facing: 'N',
      verdict: 'ok',
      blocked: [],
      back: [{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }],
    });
    expect(tool.preview?.cells).toHaveLength(6);
  });
  it('Vorschau mit Maus außerhalb ist null', () => {
    const { tool } = setupCash();
    tool.selectBuilding('beer');
    tool.pointerMove({ x: -1, y: 5 });
    expect(tool.preview).toBeNull();
  });
  it('R im Gebäude-Modus dreht und meldet sofort', () => {
    const { grid, tool } = setupCash();
    const l = vi.fn();
    tool.selectBuilding('beer');
    tool.pointerMove({ x: 5, y: 5 });
    tool.onChange(l);
    tool.rotate();
    expect(l).toHaveBeenCalledTimes(1);
    expect(tool.facing).toBe('E');
    expect(tool.preview).toMatchObject({ rect: { x: 5, y: 4, width: 2, height: 3 } });
    click(tool, 5, 5);
    expect(grid.buildingAt(5, 4)).toMatchObject({ facing: 'E', width: 2, height: 3 });
  });
  it('Klick am Rand baut nichts', () => {
    const { grid, cash, tool } = setupCash();
    tool.selectBuilding('stage');
    expect(click(tool, 0, 0)).toEqual([]);
    expect(grid.buildings()).toEqual([]);
    expect(cash.balance).toBe(10000);
    tool.pointerMove({ x: 0, y: 0 });
    expect(tool.preview).toMatchObject({ verdict: 'blocked', cells: [] });
    expect(tool.preview?.blocked).toHaveLength(12); // nur die Felder innerhalb des Grundstücks
  });
  it('zu teuer: rot, nichts gebaut', () => {
    const { grid, cash, tool } = setupCash(3999);
    tool.selectBuilding('stage');
    tool.pointerMove({ x: 10, y: 10 });
    expect(tool.preview).toMatchObject({ verdict: 'tooExpensive', cells: [] });
    expect(click(tool, 10, 10)).toEqual([]);
    expect(grid.buildings()).toEqual([]);
    expect(cash.balance).toBe(3999);
  });
  it('Abriss erstattet jedes Gebäude genau einmal und entfernt es ganz', () => {
    const { grid, cash, tool } = setupCash();
    tool.selectBuilding('beer');
    click(tool, 5, 5); // belegt x 4..6, y 5..6
    tool.selectBuilding('toilet');
    click(tool, 8, 5);
    grid.applyPath([{ x: 7, y: 5 }], true);
    expect(cash.balance).toBe(10000 - 600 - 150);
    tool.setMode('demolish');
    tool.pointerDown({ x: 5, y: 5 });
    tool.pointerMove({ x: 8, y: 5 });
    expect(tool.preview?.kind).toBe('demolish');
    expect(tool.preview?.cells).toHaveLength(4 + 4); // L-Felder (5..8, 5) plus die vier übrigen Bierstand-Felder
    tool.pointerUp();
    expect(grid.buildings()).toEqual([]);
    expect(grid.isPath(7, 5)).toBe(false);
    expect(cash.balance).toBe(10000);
  });
  it('Entf kehrt zum gewählten Gebäude mit derselben Richtung zurück', () => {
    const { tool } = setupCash();
    tool.selectBuilding('pizza');
    tool.rotate();
    tool.toggleDemolish();
    tool.toggleDemolish();
    expect([tool.mode, tool.buildingType, tool.facing]).toEqual(['building', 'pizza', 'E']);
  });
  it('setMode("building") ohne gewählte Art tut nichts', () => {
    const { tool } = setupCash();
    tool.setMode('building');
    expect(tool.mode).toBe('view');
  });
  it('R im Weg-Modus dreht weiter die Ecke, nicht das Gebäude', () => {
    const { tool } = setupCash();
    tool.setMode('path');
    tool.rotate();
    expect(tool.facing).toBe('N');
  });
  it('Weg wird über ein Gebäude nicht gebaut', () => {
    const { grid, tool } = setupCash();
    tool.selectBuilding('toilet');
    click(tool, 3, 0);
    tool.setMode('path');
    tool.pointerDown({ x: 0, y: 0 });
    tool.pointerMove({ x: 5, y: 0 });
    expect(tool.preview).toMatchObject({ blocked: [{ x: 3, y: 0 }] });
    tool.pointerUp();
    expect(grid.isPath(3, 0)).toBe(false);
    expect(grid.isPath(5, 0)).toBe(true);
  });
});

describe('BuildTool – Zeltfläche', () => {
  it('Zeltfläche als Rechteck aufziehen, Zaunfelder rot und übersprungen', () => {
    const { grid, tool } = setup();
    grid.apply([{ x: 2, y: 2, structure: 'fence' }]);
    tool.setMode('camp');
    tool.pointerDown({ x: 1, y: 1 });
    tool.pointerMove({ x: 3, y: 3 });
    const p = tool.preview!;
    expect(p.kind).toBe('build');
    if (p.kind === 'build') {
      expect(p.cells).toHaveLength(8);
      expect(p.blocked).toEqual([{ x: 2, y: 2 }]);
    }
    tool.pointerUp();
    expect(grid.isCamp(1, 1)).toBe(true);
    expect(grid.isCamp(3, 3)).toBe(true);
    expect(grid.isCamp(2, 2)).toBe(false);
  });
  it('ohne Ziehen nur das Feld unter der Maus', () => {
    const { tool } = setup();
    tool.setMode('camp');
    tool.pointerMove({ x: 4, y: 4 });
    expect(tool.preview).toEqual({ kind: 'build', cells: [{ x: 4, y: 4 }], blocked: [] });
  });
  it('Abreißen entfernt Markierung, belegte Felder bleiben unberührt', () => {
    const { grid, tool } = setup();
    grid.apply([{ x: 1, y: 1, camp: true }, { x: 2, y: 1, camp: true }]);
    grid.setOccupied([{ x: 2, y: 1 }], true);
    tool.setMode('demolish');
    tool.pointerDown({ x: 1, y: 1 });
    tool.pointerMove({ x: 2, y: 1 });
    const p = tool.preview!;
    expect(p.kind).toBe('demolish');
    if (p.kind === 'demolish') {
      expect(p.cells).toEqual([{ x: 1, y: 1 }]);
      expect(p.blocked).toEqual([{ x: 2, y: 1 }]);
    }
    tool.pointerUp();
    expect(grid.isCamp(1, 1)).toBe(false);
    expect(grid.isCamp(2, 1)).toBe(true);
  });
});
