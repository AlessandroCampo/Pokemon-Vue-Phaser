import Phaser from 'phaser'
import { SCENE_KEYS } from './scene-keys.mjs'
import { BATTLE_ASSET_KEYS, BATTLE_BACKGROUND_ASSET_KEYS } from './assets-keys.mjs'
import { Pokemons } from '../db/pokemons.mjs'
import { io } from "socket.io-client";
import { store } from '@/store'

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
    preload() {
        // store.my_pokemon = store.getObjectClone(Pokemons[0])
        // store.oppo_pokemon = store.getObjectClone(Pokemons[1])
        // socket.connect()
        // socket.emit('join_room', 'test_room')
        // socket.emit('starting_pokemon', my_pokemon)


        this.load.image(BATTLE_BACKGROUND_ASSET_KEYS.FOREST_NIGHT, '/backgrounds/background-1-night.jpg')
        if (store.battle_type == 'trainer') {
            let test_trainer = store.generate_random_trainer()
            store.my_pokemon = test_trainer.lead
            store.my_bench = test_trainer.bench
            store.oppo_trainer = store.generate_random_trainer()
            store.oppo_pokemon = store.oppo_trainer.lead
            store.oppo_bench = store.oppo_trainer.bench
            this.load.image(`trainer_${store.oppo_trainer.name}`, `/trainers/clown.png`)
        }
        store.my_pokemon.player_controlled = true
        store.oppo_pokemon.player_controlled = false


        this.load.spritesheet(store.oppo_pokemon.images.front.key, store.oppo_pokemon.images.front.path, {
            frameWidth: store.oppo_pokemon.images.front.frameWidth,
            frameHeight: store.oppo_pokemon.images.front.frameHeight,
        })
        this.load.spritesheet(store.my_pokemon.images.back.key, store.my_pokemon.images.back.path, {
            frameWidth: store.my_pokemon.images.back.frameWidth,
            frameHeight: store.my_pokemon.images.back.frameHeight,
        })
        // load all from team
        for (let i = 0;i < store.my_bench.length;i++) {
            const pokemon = store.my_bench[i];
            this.load.spritesheet(pokemon.images.back.key, pokemon.images.back.path, {
                frameWidth: pokemon.images.back.frameWidth,
                frameHeight: pokemon.images.back.frameHeight,
            });
        }

        // if trainer battle, load all ssets from opponent

        for (let i = 0;i < store.oppo_bench.length;i++) {
            const pokemon = store.oppo_bench[i];
            this.load.spritesheet(pokemon.images.front.key, pokemon.images.front.path, {
                frameWidth: pokemon.images.front.frameWidth,
                frameHeight: pokemon.images.front.frameHeight,
            });
        }

    }
    create() {
        if (store.battle_type == 'wild') {
            store.info_text = `A wild ${store.oppo_pokemon.name} appears! Get ready to fight for your life!`
        } else if (store.battle_type == 'trainer') {
            store.info_text = `The match against ${store.oppo_trainer.name} is about to start. The first pokèmon is ${store.oppo_pokemon.name}`
        }

        this.scene.start(SCENE_KEYS.BATTLE_SCENE)
    }

}