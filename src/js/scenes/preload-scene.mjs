import Phaser from 'phaser'
import { SCENE_KEYS } from './scene-keys.mjs'
import { AUDIO_ASSETS_KEY, BATTLE_ASSET_KEYS, BATTLE_BACKGROUND_ASSET_KEYS, BUILDING_ASSET_KEYS, CHARACTER_ASSET_KEYS, DATA_ASSET_KEYS, WORLD_ASSETS_KEYS } from './assets-keys.mjs'
import { Pokemons } from '../db/pokemons.mjs'
import { io } from "socket.io-client";
import { store } from '@/store'
import { map_store } from '@/mapStore.mjs';
import { DataUtils } from '../utils/DataUtills.mjs';
import { encounter_map } from '@/mapStore.mjs';
import { all_items_array } from '../db/items.mjs';


// const socket = io("http://localhost:3000");
// socket.connect()

//socket logic
// const socket = io("http://localhost:3000");
// socket.on("connect", () => {
//     console.log(`Connected to server with id: ${socket.id}`);
//     store.my_socket_id = my_pokemon
// });

// socket.on('starting_pokemon', (pokemon) => {
//     console.log('opponent starting pokemon is' + pokemon.name)
//     store.oppo_pokemon = pokemon
//     console.log(store.oppo_pokemon)
// })

const frameInfoMap = {
    'water': { frameWidth: 480, frameHeight: 480, startFrame: 0, endFrame: 24, repeat: 1, frameRate: 30 },
    'fire': { frameWidth: 480, frameHeight: 480, startFrame: 0, endFrame: 5, repeat: 3 },
    'grass': { frameWidth: 480, frameHeight: 421, startFrame: 0, endFrame: 19, repeat: 1 },
    'flying': { frameWidth: 480, frameHeight: 480, startFrame: 0, endFrame: 19, repeat: 1 },
    'poison': { frameWidth: 270, frameHeight: 470, startFrame: 0, endFrame: 19, repeat: 1 },
    'rock': { frameWidth: 375, frameHeight: 375, startFrame: 0, endFrame: 11, repeat: 1 },
    'ghost': { frameWidth: 480, frameHeight: 270, startFrame: 0, endFrame: 15, repeat: 1 },
    'electric': { frameWidth: 480, frameHeight: 480, startFrame: 0, endFrame: 15, repeat: 2 },
    'ice': { frameWidth: 678, frameHeight: 558, startFrame: 0, endFrame: 3, repeat: 4 },
    'dragon': { frameWidth: 480, frameHeight: 471, startFrame: 0, endFrame: 10, repeat: 1 },
    'confused': { frameWidth: 462, frameHeight: 480, startFrame: 0, endFrame: 2, repeat: 4 },
    'paralyzed': { frameWidth: 332, frameHeight: 379, startFrame: 0, endFrame: 24, repeat: 1 },
    'asleep': { frameWidth: 400, frameHeight: 400, startFrame: 0, endFrame: 20, repeat: 1 },
};



export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({
            key: SCENE_KEYS.PRELOAD_SCENE
        })
    }
    async preload() {
        // socket.connect()
        // socket.emit('join_room', 'test_room')
        // socket.emit('starting_pokemon', my_pokemon)
        map_store.preload_scene_istance = this

        all_items_array.forEach((item) => {
            this.load.image(item.name, item.img_path);
        })

        //animation assets


        this.load.image(BATTLE_BACKGROUND_ASSET_KEYS.FOREST_NIGHT, '/backgrounds/background-1-night.jpg')

        // load all from team
        for (let i = 0;i < store.my_bench.length;i++) {
            const pokemon = store.my_bench[i];
            this.load.spritesheet(pokemon.images.back.key, pokemon.images.back.path, {
                frameWidth: pokemon.images.back.frameWidth,
                frameHeight: pokemon.images.back.frameHeight,
            });
        }

        // if trainer battle, load all ssets from opponent


        this.load.json(DATA_ASSET_KEYS.ANIMATIONS, 'json/animations.json')


        // LOAD MAPS ASSETS

        this.load.image(WORLD_ASSETS_KEYS.START_COLLISION, `/map/collision.png`)
        this.load.image(WORLD_ASSETS_KEYS.START_ENCOUNTER_ZONE, `/map/encounter.png`)
        let all_maps = encounter_map
        all_maps.forEach((map) => {
            this.load.image(`${map.map_name.toUpperCase()}_BACKGROUND`, `/maps/${map.map_name}.png`)
            this.load.image(`${map.map_name.toUpperCase()}_FOREGROUND`, `/maps/${map.map_name}-foreground.png`)
            this.load.tilemapTiledJSON(`${map.map_name.toUpperCase()}_JSON`, `/json/${map.map_name}.json`)

        })

        // LOAD AUDIO ASSETS

        this.load.audio(AUDIO_ASSETS_KEY.WORLD, 'sounds/And-The-Journey-Begins.mp3');
        this.load.audio(AUDIO_ASSETS_KEY.TITLE, 'sounds/Title-Theme.mp3');

        const remainingAudioFiles = [
            { key: AUDIO_ASSETS_KEY.BATTLE, path: 'sounds/Decisive-Battle.mp3' },
            { key: AUDIO_ASSETS_KEY.BOSS_FIGHT, path: 'sounds/Leau.mp3' },
            { key: AUDIO_ASSETS_KEY.FLEE, path: 'sounds/flee.wav' },
            { key: 'evolution-sound', path: 'sounds/evolution.mp3' },
            { key: 'win', path: 'sounds/win.mp3' }
        ];

        // Iterate through the array and load each audio file asynchronously
        remainingAudioFiles.forEach(audio => {
            this.load.audio(audio.key, audio.path);
        });




        // LOAD BUILDING ASSETS

        // this.load.image(BUILDING_ASSET_KEYS.BUILDING_1_BACKGROUND, `/maps/building-1.png`)
        // this.load.image(BUILDING_ASSET_KEYS.BUILDING_1_FOREGROUND, `/maps/building-1-foreground.png`)
        // this.load.tilemapTiledJSON(BUILDING_ASSET_KEYS.BUILDING_1_MAIN_LEVEL, `/json/building-1.json`)



        this.load.spritesheet(CHARACTER_ASSET_KEYS.PLAYER, `/characters/player1.png`, {
            frameWidth: 32,
            frameHeight: 48,
        })

        for (const moveType in frameInfoMap) {
            if (frameInfoMap.hasOwnProperty(moveType)) {
                this.load.spritesheet(moveType + '_animation', `/animations/${moveType}.png`, {
                    frameWidth: frameInfoMap[moveType].frameWidth,
                    frameHeight: frameInfoMap[moveType].frameHeight,
                });
            }
        }

        this.load.on('complete', () => {
            map_store.loading = false;


        });



    }
    create() {
        this.sound.play(AUDIO_ASSETS_KEY.TITLE, {
            loop: true,
            volume: 0.05
        })
        this.createAnimations()

        // this.scene.start(SCENE_KEYS.WORLD_SCENE)
    }

    createAnimations() {
        const animations = DataUtils.getAnimations(this)
        animations.forEach(animation => {

            const frames = animation.frames ? this.anims.generateFrameNumbers(animation.assetKey, { frames: animation.frames }) : this.anims.generateFrameNumbers(animation.assetKey)
            this.anims.create({
                key: animation.key,
                frames: frames,
                frameRate: animation.frameRate,
                repeat: animation.repeat,
                delay: animation.delay,
                yoyo: animation.yoyo
            })
        });
        for (const moveType in frameInfoMap) {
            if (frameInfoMap.hasOwnProperty(moveType)) {
                const frames = this.anims.generateFrameNumbers(moveType + '_animation', {
                    start: frameInfoMap[moveType].startFrame,
                    end: frameInfoMap[moveType].endFrame
                });

                this.anims.create({
                    key: moveType + '_animation',
                    frames: frames,
                    frameRate: frameInfoMap[moveType].frameRate || 20,
                    repeat: frameInfoMap[moveType].repeat
                });
            }
        }




    }

    loadRemainingAudioAsync() {
        // Define an array of objects containing audio asset key and file path



    }

}