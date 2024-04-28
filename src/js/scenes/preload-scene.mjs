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

        this.load.image(BATTLE_BACKGROUND_ASSET_KEYS.FOREST_NIGHT, '/backgrounds/background-1-night.jpg')
        // if (store.battle_type == 'trainer') {
        //     store.oppo_trainer = store.generate_random_trainer()
        //     store.oppo_pokemon = store.oppo_trainer.lead
        //     store.oppo_bench = store.oppo_trainer.bench

        // }
        // if (store.my_pokemon) {
        //     this.load.spritesheet(store.my_pokemon.images.back.key, store.my_pokemon.images.back.path, {
        //         frameWidth: store.my_pokemon.images.back.frameWidth,
        //         frameHeight: store.my_pokemon.images.back.frameHeight,
        //     })
        // }

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

        this.load.audio(AUDIO_ASSETS_KEY.WORLD, 'sounds/And-the-Journey-Begins.wav');
        this.load.audio(AUDIO_ASSETS_KEY.TITLE, 'sounds/Title-Theme.mp3');
        this.load.audio(AUDIO_ASSETS_KEY.BATTLE, 'sounds/Decisive-Battle.wav');
        this.load.audio(AUDIO_ASSETS_KEY.BOSS_FIGHT, 'sounds/Leau.mp3')
        this.load.audio(AUDIO_ASSETS_KEY.FLEE, 'sounds/flee.wav');
        this.load.audio('evolution-sound', 'sounds/evolution.mp3');





        // LOAD BUILDING ASSETS

        // this.load.image(BUILDING_ASSET_KEYS.BUILDING_1_BACKGROUND, `/maps/building-1.png`)
        // this.load.image(BUILDING_ASSET_KEYS.BUILDING_1_FOREGROUND, `/maps/building-1-foreground.png`)
        // this.load.tilemapTiledJSON(BUILDING_ASSET_KEYS.BUILDING_1_MAIN_LEVEL, `/json/building-1.json`)



        this.load.spritesheet(CHARACTER_ASSET_KEYS.PLAYER, `/characters/player1.png`, {
            // frameWidth: 32,
            // frameHeight: 46,
            frameWidth: 32,
            frameHeight: 48,
        })

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

    }

}