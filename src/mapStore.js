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
    possible_encounters: [
        { pokemon: Pokemons.meowth, chance: 0.1 },
        { pokemon: Pokemons.poochyena, chance: 0.2 },
        { pokemon: Pokemons.ralts, chance: 0.05 },
        { pokemon: Pokemons.wingull, chance: 0.2 },
        { pokemon: Pokemons.zigzagoon, chance: 0.3 },
        { pokemon: Pokemons.electrike, chance: 0.15 }
    ],
    level_average: 3,
    npcs_locations: [
        {
            npc: { ...all_npcs.merchant },
            position: { x: 272, y: 304 - tile_size },
            battler: false,
            already_talked_to: false,
            event: async function () {
                if (store.my_pokemon) {
                    await map_store.healAllPokemons()
                } else {
                    store.menu_state = 'text'
                    store.info_text = 'Oh, you have no Pokemons yet, never mind'
                    await store.delay(store.info_text.length * store.config.text_speed + 500)
                }

            }
        },
        {
            npc: { ...all_npcs.npc_1 },
            position: { x: 368, y: 160 - tile_size },
            path: null,
            battler: false,
            boss: true,
            event: async function () {
                map_store.handleBossBattle(trainers.roxanne)
                map_store.world_scene_istance.startBossBattle()
            },

        },
        {
            npc: { ...all_npcs.npc_2 },
            position: { x: 48, y: 320 - tile_size },
            path: null,
            battler: false,
            already_talked_to: false,
            event: async function () {
                if (!this.already_talked_to) {
                    return new Promise(async resolve => {
                        if (this.already_talked_to || map_store.choosing_starter) return
                        // map_store.add_new_message_to_queue();
                        store.menu_state = 'text'
                        store.info_text = 'Take one of my Pokémon, train him until it\'s strong enough to face her'
                        await store.delay(2000);
                        store.info_text = ''


                        map_store.choosing_starter = true;

                        if (!store.my_items.some(item => item.name === all_items.poke_ball.name)) {
                            const pokeBallInstance = deepClone(all_items.poke_ball);
                            pokeBallInstance.owned_amount = 10;
                            store.my_items.push(pokeBallInstance);
                        } else {
                            const pokeBallIndex = store.my_items.findIndex(item => item.name === all_items.poke_ball.name);
                            store.my_items[pokeBallIndex].owned_amount += 10;
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
                                    console.log('resolved');
                                    unwatch(); // Stop watching after conditions are met
                                    map_store.add_new_message_to_queue(`${store.my_pokemon.name} was a great choice!`);
                                    map_store.add_new_message_to_queue('Take some Poké Balls as well, build an army and free us from that burden!');
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
    indoor: false
},
{
    map_name: 'building-1',
    possible_encounters: [
    ],
    npcs_locations: [
    ],
    indoor: true
}


];

export const map_store = reactive({
    walking_speed: 100,
    text_queue: [],
    all_messages_read: true,
    encounter_frequency: 0.1,
    current_map: encounter_map[0],
    world_scene_istance: undefined,
    choosing_starter: false,
    player_initial_coords: { x: 2 * tile_size, y: 22 * tile_size },
    player_position_info: {
        coords: undefined,
        direction: DIRECTION.DOWN,
        map: undefined
    },
    first_loading: true,
    player_istance: undefined,
    chracacter_istances: {},
    starter_choices: [deepClone(Pokemons.timburr), deepClone(Pokemons.deino), deepClone(Pokemons.gastly)],
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
    handleTrainerBattle() {
        store.in_battle = true
        store.battle_type = 'trainer'
        store.menu_state = 'text'
        store.oppo_trainer = store.generate_random_trainer()
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
        store.my_pokemon.hp.effective = store.my_pokemon.hp.current
        store.my_pokemon.status = null
        store.my_pokemon.damage = 0
        store.my_bench.forEach((mon) => {
            mon.hp.effective = mon.hp.current
            mon.status = null
            mon.damage = 0
        })
        store.menu_state = 'text'
        store.info_text = 'All of your pokemons are back to perfect health'
        await store.delay(store.info_text.length * store.config.text_speed + 500)
    }





})


