import Phaser from 'phaser';
import { COLORS } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';

// Einstiegspunkt: erzeugt das Spiel, das immer das ganze Fenster füllt.
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  pixelArt: true,
  // Rechtsklick ist im Spiel „Abbrechen“, deshalb kein Browser-Menü.
  disableContextMenu: true,
  backgroundColor: COLORS.grassDark,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [BootScene, TitleScene, WorldScene, UIScene],
});
