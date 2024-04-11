import { computed, reactive, watch } from 'vue'
import { store } from './store';
import gsap from 'gsap'
import Phaser from 'phaser';
import { tile_size } from './js/scenes/world-scene';
import { DIRECTION } from './js/utils/Controls.mjs';
import { Pokemons } from './js/db/pokemons.mjs';
import { all_npcs } from './js/db/npcs.mjs';
import { Ball, all_items } from './js/db/items.mjs';
import { trainers } from './js/db/trainers.mjs';
import { db, auth } from '@/firebase';
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore'
import { all_moves } from './js/db/moves.mjs';

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    let clone = Array.isArray(obj) ? [] : {};

    // Copy own properties
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            clone[key] = deepClone(obj[key]);
        }
    }

    // Copy prototype methods
    let prototype = Object.getPrototypeOf(obj);
    let prototypeMethods = Object.getOwnPropertyNames(prototype)
        .filter(prop => typeof prototype[prop] === 'function');
    prototypeMethods.forEach(method => {
        clone[method] = obj[method].bind(clone);
    });

    return clone;
}

export let encounter_map = [{
    map_name: 'start',
    npcs_locations: [
        {
            npc: { ...all_npcs.merchant },
            position: {
                x: 272, y: 304 - tile_size
            },
            battler: false,
            path: null,
            already_talked_to: false,
            event: async function () {
                if (store.my_pokemon) {
                    await map_store.healAllPokemons()
                } else {
                    store.menu_state = 'text'
                    store.info_text = 'Oh, you have no Pokemons yet, never mind'
                    await store.delay(store.info_text.length * store.config.text_speed + 500)
                }
            },

        },
        {
            npc: { ...all_npcs.npc_1 },
            position: { x: 368, y: 160 - tile_size },
            path: null,
            battler: false,
            boss: true,
            event: async function () {
                if (store.my_pokemon) {
                    map_store.text_queue.push('You dare coming to me with an army of Pokèmons?')
                    map_store.handleBossBattle(trainers.roxanne)
                    map_store.world_scene_istance.startBossBattle()
                } else {
                    map_store.text_queue.push('This is not a place for kids, just go away')
                }

            },

        },
        {
            npc: { ...all_npcs.guard },
            position: { x: 320, y: 240 - tile_size },
            path: null,
            battler: true,
            event: null,
            frame: 8,
            direction: DIRECTION.RIGHT
        },


    ],
    possible_encounters: [],
    indoor: false
},
{
    map_name: 'building-1',
    possible_encounters: [
    ],
    npcs_locations: [
    ],
    indoor: true
},
{
    map_name: 'pokestop',
    possible_encounters: [

    ],
    npcs_locations: [
        {
            npc: { ...all_npcs.nurse },
            position: { x: 128, y: 80 - tile_size },
            path: null,
            battler: false,
            event: async function () {
                if (store.my_pokemon) {
                    await map_store.healAllPokemons()
                } else {
                    store.menu_state = 'text'
                    store.info_text = 'Oh, you have no Pokemons yet, never mind'
                    await store.delay(store.info_text.length * store.config.text_speed + 500)
                }
            },
            frame: 0,
            direction: DIRECTION.DOWN
        }
    ],
    indoor: true
},
{
    map_name: 'city',
    possible_encounters: [
    ],
    npcs_locations: [
    ],
    indoor: false
},
{
    map_name: 'building-2',
    possible_encounters: [
    ],
    npcs_locations: [
        {
            npc: { ...all_npcs.npc_2 },
            position: { x: 144, y: 80 - tile_size },
            path: null,
            battler: false,
            already_talked_to: false,
            event: async function () {
                if (!this.already_talked_to && !store.my_pokemon) {
                    return new Promise(async resolve => {
                        if (this.already_talked_to || map_store.choosing_starter) return
                        // map_store.add_new_message_to_queue();
                        store.menu_state = 'text'
                        store.info_text = 'Take one of my Pokémon, train him until it\'s strong enough to face her'
                        await store.delay(2000);
                        store.info_text = ''


                        map_store.choosing_starter = true;
                        if (!store.my_items.some(item => item.name === all_items.rare_candy.name)) {
                            const rareCandyInstance = deepClone(all_items.rare_candy)
                            rareCandyInstance.owned_amount = 200
                            store.my_items.push(rareCandyInstance);
                        }


                        if (!store.my_items.some(item => item.name === all_items.mega_ball.name)) {
                            const pokeBallInstance = deepClone(all_items.mega_ball);

                            pokeBallInstance.owned_amount = 200;
                            store.my_items.push(pokeBallInstance);
                        } else {
                            //     const pokeBallIndex = store.my_items.findIndex(item => item.name === all_items.poke_ball.name);
                            //     store.my_items[pokeBallIndex].owned_amount += 10;
                        }



                        // Use watch from Vue to watch for changes in map_store.choosing_starter and store.my_pokemon
                        const unwatch = watch(() => ({
                            choosing_starter: map_store.choosing_starter,
                            my_pokemon: store.my_pokemon
                        }), (newValues) => {
                            if (!newValues.choosing_starter) {
                                if (newValues.my_pokemon !== undefined) {
                                    if (this.already_talked_to) {
                                        return
                                    }

                                    unwatch(); // Stop watching after conditions are met
                                    map_store.add_new_message_to_queue(`${store.my_pokemon.name} was a great choice!`);
                                    map_store.add_new_message_to_queue('Take some Poké Balls and Rare Candies as well, use these items build an army and free us from that burden!');
                                    this.already_talked_to = true;
                                    resolve(); // Resolve the promise
                                } else {
                                    // Continue waiting until my_pokemon is defined
                                    return;
                                }
                            }
                        });

                        await store.delay(2000);
                    });
                } else {
                    map_store.add_new_message_to_queue('Be careful, she is pretty strong, make sure your army is well trained before challenging her');
                    await store.delay(2000);
                }
            }

        },
    ],
    indoor: true
},
{
    map_name: 'route-1',
    npcs_locations: [
        {
            npc: { ...all_npcs.guard },
            position: { x: 32, y: 80 - tile_size },
            path: null,
            battler: true,
            event: null,
            frame: 0,
            direction: DIRECTION.DOWN
        },
        {
            npc: { ...all_npcs.guard },
            position: { x: 432, y: 48 - tile_size },
            path: null,
            battler: true,
            event: null,
            frame: 0,
            direction: DIRECTION.DOWN
        }
    ],
    possible_encounters: [
        { pokemon: Pokemons.meowth, chance: 0.1 },

        { pokemon: Pokemons.poochyena, chance: 0.2 },
        { pokemon: Pokemons.ralts, chance: 0.05 },
        { pokemon: Pokemons.wingull, chance: 0.2 },
        { pokemon: Pokemons.zigzagoon, chance: 0.3 },
        { pokemon: Pokemons.electrike, chance: 0.1 },
        { pokemon: Pokemons.starly, chance: 0.05 },
    ],
    level_average: 3,
    indoor: false
},


];

export const map_store = reactive({
    walking_speed: 200
    ,
    text_queue: [],
    all_messages_read: true,
    encounter_frequency: 0.1,
    current_map: encounter_map[0],
    world_scene_istance: undefined,
    choosing_starter: false,
    player_initial_coords: { x: 2 * tile_size, y: 22 * tile_size },
    player_position_info: {
        coords: { x: 2 * tile_size, y: 22 * tile_size },
        direction: DIRECTION.DOWN,
        map: encounter_map[0]
    },
    player_initial_position: {
        coords: { x: 2 * tile_size, y: 22 * tile_size },
        direction: DIRECTION.DOWN,
        map: encounter_map[0]
    },
    first_loading: true,
    player_istance: undefined,
    chracacter_istances: {},
    starter_choices: [deepClone(Pokemons.timburr), deepClone(Pokemons.deino), deepClone(Pokemons.gastly)],
    fetched_data: {},
    show_menu: false,
    show_party_menu: false,
    show_inventory_menu: false,
    show_title_scene: true,
    preload_scene_istance: undefined,
    createSceneTransition: async function (scene) {

        // const skipSceneTransition = options?.skipSceneTransition || false;
        // if (skipSceneTransition) {
        //     if (options?.callback) {
        //         options.callback()
        //     }
        //     return;
        // }
        return new Promise(resolve => {

            const { width, height } = scene.scale

            const rectShape = new Phaser.Geom.Rectangle(0, height / 2, width, 0)

            const g = scene.add.graphics().fillRectShape(rectShape).setDepth(-1)
            const mask = g.createGeometryMask();
            scene.cameras.main.setMask(mask)

            const tween = scene.tweens.add({
                targets: rectShape,
                onUpdate: () => {
                    g.clear().fillRectShape(rectShape)
                },
                delay: 400,
                duration: 800,
                height: {
                    ease: Phaser.Math.Easing.Expo.InOut,
                    from: 0,
                    to: height
                },
                y: {
                    ease: Phaser.Math.Easing.Expo.InOut,
                    from: height / 2,
                    to: 0
                },
                onComplete: () => {
                    mask.destroy()
                    scene.cameras.main.clearMask()
                    resolve()
                }
            })

            tween.play()
        })

    },
    bar_transition(player_bar) {
        let my_bar = document.getElementById('my-bar')
        let enemy_bar = document.getElementById('enemy-bar')

        if (player_bar) {
            gsap.set(my_bar, {
                top: '5%',
                left: '-20%'
            })
            gsap.to(my_bar, {
                top: '5%',
                left: '10%',
                duration: 1
            })
        } else {
            gsap.set(enemy_bar, {
                top: '5%',
                right: '-20%'
            })
            gsap.to(enemy_bar, {
                top: '5%',
                right: '10%',
                duration: 1
            })
        }

    },
    add_new_message_to_queue(text) {
        this.text_queue.push(text)
    },
    skip_to_next_message() {

        this.text_queue.shift()

    },
    handleWildEncounter() {
        store.in_battle = true
        store.battle_type = 'wild'
        store.menu_state = 'text'
        store.oppo_pokemon = store.getRandomEncounter(this.current_map)
    },
    handleTrainerBattle(trainer_name) {
        store.in_battle = true
        store.battle_type = 'trainer'
        store.menu_state = 'text'
        store.oppo_trainer = store.generate_random_trainer(trainer_name)
        store.oppo_pokemon = store.oppo_trainer.lead
        store.oppo_bench = store.oppo_trainer.bench
    },
    handleBossBattle(trainer) {
        store.in_battle = true
        store.battle_type = 'trainer'
        store.menu_state = 'text'
        store.oppo_trainer = trainer
        store.oppo_pokemon = store.oppo_trainer.lead
        store.oppo_bench = store.oppo_trainer.bench
    },
    async healAllPokemons() {
        store.my_pokemon.hp.current = store.my_pokemon.hp.max
        store.my_pokemon.status = null
        store.my_pokemon.damage = 0
        store.my_bench.forEach((mon) => {
            mon.hp.current = mon.hp.max
            mon.status = null
            mon.damage = 0
        })
        store.menu_state = 'text'
        store.info_text = 'All of your pokemons are back to perfect health'
        await store.delay(store.info_text.length * store.config.text_speed + 500)
    },
    getPositionSaveObj(new_game) {
        let player_x = new_game ? this.player_initial_position.coords.x : this.player_position_info.coords.x
        let player_y = new_game ? this.player_initial_position.coords.y : this.player_position_info.coords.y
        let map_name = new_game ? 'start' : this.player_position_info.map.map_name
        const direction = 'DOWN'
        const player_position_info_copy = {
            coords: { x: player_x, y: player_y },
            map: map_name,
            direction
        }

        return player_position_info_copy
    },
    async updateDB() {
        const playerRef = doc(db, 'Players', this.fetched_data?.uid);
        const my_bench_copy = []
        const my_inventory_copy = []
        store.my_bench.forEach((mon) => {
            my_bench_copy.push(store.generateSaveCopy(mon))
        })
        store.my_items.forEach((item) => {
            my_inventory_copy.push(store.generateItemSaveCopy(item))
        })
        const infosToSave = {
            my_pokemon: store.generateSaveCopy(store.my_pokemon),
            my_bench: my_bench_copy,
            my_items: my_inventory_copy,
            position: this.getPositionSaveObj()
        };
        await updateDoc(playerRef, infosToSave);
    },
    async logUser(new_game) {
        await new Promise((resolve, reject) => {
            signInAnonymously(auth)
                .then(async (result) => {
                    const user = result.user;
                    const docRef = doc(db, 'Players', user.uid);

                    // Check if the document already exists
                    const docSnapshot = await getDoc(docRef);
                    if (!docSnapshot.exists() || new_game) {
                        // Document doesn't exist, proceed with saving initial game data
                        const my_pokemon_copy = store.generateSaveCopy(store.my_pokemon) || null;
                        await setDoc(docRef, {
                            uid: user.uid,
                            my_pokemon: my_pokemon_copy,
                            username: store.player_info.name,
                            position: map_store.getPositionSaveObj(new_game),
                            my_bench: [],
                            my_items: [],

                        });
                    }


                    resolve(user);
                })
                .catch((error) => {
                    window.alert("You don't have any saved data")
                    console.error("Error signing in anonymously:", error);
                    reject(error);
                });
        });


        await new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {

                    const uid = user.uid;
                    const player_unsub = onSnapshot(doc(db, "Players", uid), (doc) => {

                        this.fetched_data = doc.data();
                        let saved_map = encounter_map.find((map) => {
                            return map.map_name == this.fetched_data.position.map
                        })
                        this.player_position_info.coords = this.fetched_data.position.coords;
                        this.player_position_info.map = saved_map
                        this.current_map = saved_map
                        store.my_pokemon = this.retrivePokemonData(this.fetched_data.my_pokemon)
                        resolve()

                        this.fetched_data.my_bench.forEach((mon) => {
                            store.my_bench.push(this.retrivePokemonData(mon))
                        })


                        store.my_items = this.retrieveItemsData(this.fetched_data.my_items)
                    });


                } else {

                    reject(new Error("User is signed out"));
                }
                unsubscribe();
            });
        });
    },
    async startNewGame() {
        store.my_pokemon = null
        store.my_bench = []
        store.my_items = []
        store.level_cap = 15
        store.player_info.name = prompt("Whats  your name")
        this.player_position_info = { ...this.player_initial_position }
        await map_store.logUser(true);

    },
    retrivePokemonData(pkmn) {
        if (!pkmn) return null
        for (const pokemonName in Pokemons) {
            if (Object.hasOwnProperty.call(Pokemons, pokemonName)) {
                const pokemon = Pokemons[pokemonName];
                if (pokemon.name === pkmn.name) {

                    const returned_pokemon = deepClone(pokemon)
                    returned_pokemon.damage = pkmn.damage
                    returned_pokemon.level = pkmn.level
                    returned_pokemon.nature = pkmn.nature
                    returned_pokemon.fainted = pkmn.fainted
                    returned_pokemon.xp.total = pkmn.current_xp
                    returned_pokemon.status = pkmn.status
                    returned_pokemon.moves = this.retrieveMovesData(pkmn.moves)
                    returned_pokemon.hp.current = returned_pokemon.hp.max - pkmn.damage
                    store.calcStats(returned_pokemon)
                    return returned_pokemon;
                }
            }
        }

        return null; // Or handle the case where Pokémon is not found
    },
    retrieveMovesData(moves) {
        const retrievedMoves = [];

        // Loop through each move in the moves array
        moves.forEach(move => {
            // Find the corresponding move data in all_moves object
            const foundMove = Object.values(all_moves).find(moveData => moveData.name === move.name);

            if (foundMove) {
                // If move data is found, add it to the retrievedMoves array
                retrievedMoves.push(foundMove);
                foundMove.pp.current = move.left_pp
            } else {
                // Handle the case where the move data is not found

            }
        });

        return retrievedMoves;
    },
    retrieveItemsData(items) {
        const retrievedItems = [];
        items?.forEach(item => {
            const foundItem = Object.values(all_items).find(itemData => itemData.name === item.name);

            if (foundItem) {

                retrievedItems.push(foundItem);
                foundItem.owned_amount = item.owned_amount
            } else {

            }
        });

        return retrievedItems;
    }








})


