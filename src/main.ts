import Phaser from 'phaser';
import { COLORS } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';

// Einstiegspunkt: erzeugt das Spiel, das immer das ganze Fenster füllt.
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  pixelArt: true,
  backgroundColor: COLORS.grassDark,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [BootScene, TitleScene],
});
