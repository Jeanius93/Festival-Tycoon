import { describe, it, expect } from 'vitest';
import { MAIN_MENU, MenuState, categoryOf, subMenu } from '../src/ui/menu';

describe('Bau-Menü', () => {
  it('Hauptleiste in fester Reihenfolge', () => {
    expect(MAIN_MENU.map((m) => m.label)).toEqual(['Ansehen', 'Wege & Zäune', 'Bühnen', 'Stände', 'Sanitär', 'Abreißen']);
    expect(MAIN_MENU.map((m) => m.category)).toEqual(['view', 'paths', 'stages', 'stalls', 'sanitary', 'demolish']);
  });
  it('Unterleisten', () => {
    expect(subMenu('view')).toEqual([]);
    expect(subMenu('demolish')).toEqual([]);
    expect(subMenu('paths').map((e) => [e.label, e.price])).toEqual([
      ['Weg', null],
      ['Zaun', null],
      ['Schleuse', null],
      ['Tor', null],
      ['Zeltfläche', null],
    ]);
    expect(subMenu('paths')[2].action).toEqual({ kind: 'mode', mode: 'visitorGate' });
    expect(subMenu('stages').map((e) => [e.label, e.price])).toEqual([['Bühne', 4000]]);
    expect(subMenu('stalls').map((e) => e.label)).toEqual(['Bierstand', 'Pommes', 'Bratwurst', 'Pizza', 'Merch-Stand']);
    expect(subMenu('sanitary')[0]).toEqual({ label: 'Dixi-Klo', price: 150, action: { kind: 'building', type: 'toilet' } });
  });
  it('categoryOf', () => {
    expect(categoryOf('view', null)).toBe('view');
    expect(categoryOf('path', null)).toBe('paths');
    expect(categoryOf('fence', null)).toBe('paths');
    expect(categoryOf('staffGate', 'beer')).toBe('paths');
    expect(categoryOf('camp', null)).toBe('paths');
    expect(categoryOf('building', 'beer')).toBe('stalls');
    expect(categoryOf('building', 'stage')).toBe('stages');
    expect(categoryOf('building', 'toilet')).toBe('sanitary');
    expect(categoryOf('demolish', 'toilet')).toBe('demolish');
  });
});

describe('MenuState (offene Unterleiste)', () => {
  it('Klick auf „Ansehen“ schließt eine von Hand geöffnete Unterleiste, auch wenn schon „Ansehen“ aktiv ist', () => {
    const m = new MenuState();
    m.syncTool('view', null);
    m.clickCategory('stalls');
    expect(m.openCategory).toBe('stalls');
    m.clickCategory('view');
    expect(m.openCategory).toBeNull();
  });
  it('Klick auf „Abreißen“ schließt ebenfalls', () => {
    const m = new MenuState();
    m.clickCategory('paths');
    m.clickCategory('demolish');
    expect(m.openCategory).toBeNull();
  });
  it('Klick auf die offene Kategorie schließt sie, eine andere öffnet sie', () => {
    const m = new MenuState();
    m.clickCategory('stalls');
    m.clickCategory('stalls');
    expect(m.openCategory).toBeNull();
    m.clickCategory('stages');
    expect(m.openCategory).toBe('stages');
  });
  it('Werkzeugwechsel öffnet die Unterleiste seiner Kategorie; gleiche Auswahl lässt die Hand-Auswahl stehen', () => {
    const m = new MenuState();
    m.syncTool('building', 'beer');
    expect(m.openCategory).toBe('stalls');
    m.clickCategory('paths');
    m.syncTool('building', 'beer'); // z. B. Mausbewegung: Auswahl unverändert
    expect(m.openCategory).toBe('paths');
    m.syncTool('view', 'beer'); // Esc
    expect(m.openCategory).toBeNull();
  });
});
