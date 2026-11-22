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
    expect(tool.preview).toEqual({ kind: 'build', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }] });
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
    expect(tool.preview).toEqual({ kind: 'build', cells: [{ x: 3, y: 3 }] });
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
});
