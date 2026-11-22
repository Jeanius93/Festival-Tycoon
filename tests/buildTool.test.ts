import { describe, it, expect, vi } from 'vitest';
import { Grid } from '../src/building/grid';
import { BuildTool } from '../src/building/buildTool';

const setup = () => {
  const grid = new Grid(10, 10);
  return { grid, tool: new BuildTool(grid) };
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
