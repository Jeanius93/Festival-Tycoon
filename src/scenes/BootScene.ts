import Phaser from 'phaser';
import { createPlaceholderTextures } from '../assets/placeholders';

/** Erste Szene: bereitet Grafiken vor und startet dann den Titelbildschirm. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    createPlaceholderTextures(this);
    this.scene.start('Title');
  }
}
