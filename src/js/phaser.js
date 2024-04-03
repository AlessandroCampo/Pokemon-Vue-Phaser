import Phaser from 'phaser'
import { SCENE_KEYS } from './scenes/scene-keys.mjs';
import { PreloadScene } from './scenes/preload-scene.mjs';
import { BattleScene } from './scenes/battle-scene.mjs';
import { Pokemons } from './db/pokemons.mjs';
import { WorldScene } from './scenes/world-scene';



const screen_width = window.screen.width
const screen_height = window.screen.height

const game = new Phaser.Game({
    type: Phaser.CANVAS,
    pixelArt: false,
    scale: {
        parent: 'game-container',
        width: 1024,
        height: 576,
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    backgroundColor: '#121212'
});

game.scene.add(SCENE_KEYS.PRELOAD_SCENE, PreloadScene);
game.scene.add(SCENE_KEYS.BATTLE_SCENE, BattleScene)
game.scene.add(SCENE_KEYS.WORLD_SCENE, WorldScene)
game.scene.start(SCENE_KEYS.PRELOAD_SCENE)
