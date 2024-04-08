
import { all_moves } from "./moves.mjs";
import { all_items } from "./items.mjs";

import Phaser from "phaser";
import gsap from 'gsap'
const base_path = '/pokemons/'



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

let oppo_position = {
    x: 798,
    y: 395
}

let ally_position = {
    x: 256,
    y: 500
}

const pokemon_natures = [
    "Hardy", "Lonely", "Brave", "Adamant", "Naughty",
    "Bold", "Docile", "Relaxed", "Impish", "Lax",
    "Timid", "Hasty", "Serious", "Jolly", "Naive",
    "Modest", "Mild", "Quiet", "Bashful", "Rash",
    "Calm", "Gentle", "Sassy", "Careful", "Quirky"
];


class Pokemon {
    constructor({ name, description, height, weight, types, level, moves, learnable_moves, abilities, gender, xp, base_exp, growth_rate, catch_rate, pokemon_number, status, confused, flinched, hp, atk, def, sp_atk, sp_def, speed, accuracy, evasion, evolution, images, sounds, damage, location, fainted, sprite, nature, held_item, leviates, stat_total }) {
        this.name = name;
        this.description = description || 'no description available';
        this.types = types || [];
        this.height = height || 0.5;
        this.weight = weight || undefined
        this.level = level || 1;
        this.moves = moves || [];
        this.learnable_moves = learnable_moves || [];
        this.abilities = abilities || null;
        this.gender = gender || 'male';
        this.xp = xp || 0;
        this.base_exp = base_exp || 51;
        this.growth_rate = growth_rate || 'Medium Fast';
        this.catch_rate = catch_rate || 255;
        this.pokemon_number = pokemon_number || null;
        this.status = status || null;
        this.confused = null;
        this.flinched = false;
        this.fainted = false
        this.hp = hp || { base: 0, current: 0, effective: 0, stage: 0 };
        this.atk = atk || { base: 0, current: 0, effective: 0, stage: 0 };
        this.def = def || { base: 0, current: 0, effective: 0, stage: 0 };
        this.sp_atk = sp_atk || { base: 0, current: 0, effective: 0, stage: 0 };
        this.sp_def = sp_def || { base: 0, current: 0, effective: 0, stage: 0 };
        this.speed = speed || { base: 0, current: 0, effective: 0, stage: 0 };
        this.accuracy = {
            effective: 1,
            current: 1,
            stage: 0
        };
        this.evasion = {
            effective: 1,
            current: 1,
            stage: 0
        }
        this.evolution = evolution || null;
        this.images = images || null;
        this.sounds = sounds || null;
        this.damage = damage || 0;
        this.location = location || null;
        this.player_controlled = false
        this.sprite = null
        this.nature = nature || pokemon_natures[Math.floor(Math.random() * pokemon_natures.length)]
        this.held_item = held_item || null
        this.levitates = leviates || false
        this.guarded = false
        this.stat_total = stat_total || null
        this.crhit_chance = 4.17


    }
    drawSprite(scene) {
        if (scene.children.exists(this.sprite)) {
            return;
        }
        let position = this.player_controlled ? ally_position : oppo_position;
        let asset_key = this.player_controlled ? this.images.front.key : this.images.back.key;

        // Create and configure sprite
        let starting_offset = this.player_controlled ? -500 : +500;
        this.sprite = scene.add.sprite(position.x + starting_offset, position.y + 10, asset_key);
        this.sprite.setOrigin(0.5, 1); // Set anchor to bottom center
        this.setPropScale()

    }

    setPropScale() {
        // Constants for scaling
        const MIN_SCALE = 0.35;
        const MAX_SCALE = 1.5;

        // Get the height of the Pokémon
        let pokemonHeight = this.height;

        // Apply a larger scale to player-controlled Pokémon
        let player_controlled_multiplier = this.player_controlled ? 1 : 0.7;

        // Normalize the height to a range of 0 to 1, based on a reasonable minimum and maximum height
        let normalizedHeight = (pokemonHeight - 0.4) / (1.6 - 0.4); // Adjust the range according to your actual minimum and maximum heights

        // Scale the normalized height to the desired scale range
        let scale = MIN_SCALE + normalizedHeight * (MAX_SCALE - MIN_SCALE);

        // Apply the player-controlled multiplier
        scale *= player_controlled_multiplier;

        // Ensure scale stays within the specified limits
        scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

        // Set the scale of the sprite
        this.sprite.setScale(scale);
    }







    async playDamageAnim(scene) {
        return new Promise(resolve => {
            let position = this.player_controlled ? ally_position : oppo_position;

            scene.tweens.add({
                delay: 0,
                duration: 150,
                targets: this.sprite,
                alpha: {
                    from: 1,
                    start: 1,
                    to: 0,
                    repeat: 6
                },
                x: {
                    from: position.x,
                    start: position.x,
                    to: position.x - 5,
                },
                repeat: 6,
                onComplete: () => {
                    this.sprite.setX(position.x);
                    this.sprite.setAlpha(1);
                    resolve(); // Resolve the promise when animation completes
                }
            });
        });
    }

    playRetireAnim(dur) {
        let position = this.player_controlled ? ally_position : oppo_position;
        //reverse animations in case of enemy pokemon

        let multiplier = this.player_controlled ? +1 : -1;
        return new Promise(resolve => {
            gsap.to(this.sprite, {
                // scale: 0,
                duration: dur,
                y: position.y + 30,
                x: position.x - 400 * multiplier,
                onComplete: () => {
                    resolve()
                }
            })
        });
    }
    playSwitchAnim(new_scale_val) {
        // fix for enemy swap
        return new Promise(resolve => {
            let position = this.player_controlled ? ally_position : oppo_position;

            gsap.to(this.sprite, {
                duration: 1,
                y: position.y,
                x: position.x,
                onComplete: () => {
                    resolve()
                }
            })
        });
    }
    playCatchAnimation() {
        return new Promise(resolve => {
            gsap.to(this.sprite, {
                duration: 1,
                scale: 0,
                onComplete: () => {
                    resolve()
                }
            })
        })
    }

    playBrakeFreeAnimation(origina_scale) {
        return new Promise(resolve => {
            gsap.to(this.sprite, {
                duration: 1,
                scale: origina_scale,
                onComplete: () => {
                    resolve()
                }
            })
        })
    }
    async playFaintAnim(scene) {
        return new Promise(resolve => {
            let position = this.player_controlled ? ally_position : oppo_position;
            if (this.levitates) {
                position.y = position.y - 20
            }
            scene.tweens.add({
                delay: 0,
                duration: 1000,
                targets: this.sprite,
                y: {
                    from: position.y,
                    start: position.y,
                    to: position.y + 30
                },
                alpha: {
                    from: 1,
                    start: 1,
                    to: 0
                },
                onComplete: () => {
                    resolve();
                }
            });
        });
    }

    resetStats() {
        this.atk.current = this.atk.base;
        this.def.current = this.def.base;
        this.sp_atk.current = this.sp_atk.base;
        this.sp_def.current = this.sp_def.base;
        this.speed.current = this.speed.base;
        this.accuracy.current = this.accuracy.effective;
        this.evasion.current = this.evasion.effective;
        this.atk.stage = 0
        this.def.stage = 0
        this.sp_atk.stage = 0
        this.sp_def.stage = 0
        this.accuracy.stage = 0
        this.evasion.stage = 0
        this.crhit_chance = 4.17
    }


};





// let squirtle = new Pokemon({
//     name: "Squirtle",
//     description: "It hides in its shell to protect itself, then strikes back with spouts of water at every opportunity.",
//     types: ['water'],

//     moves: [{ ...all_moves.tackle }, { ...all_moves.smoke_screen }, { ...all_moves.dobule_team }, { ...all_moves.withdraw }],
//     abilities: ['Torrent'],
//     growth_rate: 'Medium Slow',
//     level: 5,
//     catch_rate: 45,
//     pokemon_number: 7,
//     hp: {
//         base: 44,
//         max: 44,
//         current: 44
//     },
//     xp: {
//         base: 63,
//         total: 0
//     },
//     atk: {
//         base: 48,
//         current: 48,
//         effective: 48,
//         stage: 0
//     },
//     def: {
//         base: 65,
//         current: 65,
//         effective: 65,
//         stage: 0
//     },
//     sp_atk: {
//         base: 50,
//         current: 50,
//         effective: 50,
//         stage: 0
//     },
//     sp_def: {
//         base: 64,
//         current: 64,
//         effective: 64,
//         stage: 0
//     },
//     speed: {
//         base: 43,
//         current: 43,
//         effective: 43,
//         stage: 0
//     },
//     evolution: {

//     },
//     images: {
//         front: {
//             path: base_path + 'squirtle-front.png',
//             key: 'squirtle-front',
//             frameWidth: 389,
//             frameHeight: 410,
//             frames: 19
//         },
//         back: {
//             path: base_path + 'squirtle-back.png',
//             key: 'squirtle-back',
//             frameWidth: 389,
//             frameHeight: 410,
//             frames: 19
//         }
//     },
//     sounds: 'assets/sounds/squirtle-cry.ogg'




// });

// let bulbasaur = new Pokemon({
//     name: "Bulbasaur",
//     description: "It hides in its shell to protect itself, then strikes back with spouts of water at every opportunity.",
//     types: ['grass', 'poison'],
//     moves: [all_moves.tackle],
//     abilities: ['Torrent'],
//     growth_rate: 'Medium Slow',
//     catch_rate: 45,
//     pokemon_number: 7,
//     level: 5,
//     hp: {
//         base: 45,
//         max: 45,
//         current: 45
//     },
//     xp: {
//         base: 63,
//         total: 0
//     },
//     atk: {
//         base: 49,
//         current: 49,
//         effective: 49,
//         stage: 0
//     },
//     def: {
//         base: 49,
//         current: 49,
//         effective: 49,
//         stage: 0
//     },
//     sp_atk: {
//         base: 65,
//         current: 65,
//         effective: 65,
//         stage: 0
//     },
//     sp_def: {
//         base: 65,
//         current: 65,
//         effective: 65,
//         stage: 0
//     },
//     speed: {
//         base: 45,
//         current: 45,
//         effective: 45,
//         stage: 0
//     },
//     evolution: {

//     },
//     images: {
//         front: {
//             path: base_path + 'bulbasaur-front.png',
//             key: 'bulbasaur-front',
//             frameWidth: 283,
//             frameHeight: 310,
//             frames: 26
//         },
//         back: {
//             path: base_path + 'bulbasaur-back.png',
//             key: 'bulbasaur-back',
//             frameWidth: 283,
//             frameHeight: 310,
//             frames: 26
//         }
//     },
//     sounds: 'assets/sounds/bulbasaur-cry.ogg'




// });

let deino = new Pokemon({
    name: "Deino",
    description: "It nests deep inside a cave. Food there is scarce, so Deino will sink its teeth into anything that moves and attempt to eat it.",
    types: ['dark', 'dragon'],
    moves: [deepClone(all_moves.focus_energy), deepClone(all_moves.tackle), deepClone(all_moves.dragon_breath)],
    learnable_moves: [{ at_level: 8, move: { ...all_moves.bite } }, { at_level: 12, move: { ...all_moves.roar } }, { at_level: 15, move: { ...all_moves.headbutt } }],
    abilities: ['Hustle'],
    growth_rate: 'Medium Slow',
    height: 0.8,
    weight: 17.3,
    level: 5,
    catch_rate: 45,
    pokemon_number: 633,
    hp: {
        base: 52,
        max: 52,
        current: 52
    },
    xp: {
        base: 60,
        total: 0
    },
    atk: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    sp_atk: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    sp_def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    speed: {
        base: 38,
        current: 38,
        effective: 38,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'deino-front.png',
            key: 'deino-front',
            frameWidth: 165,
            frameHeight: 310,
            frames: 43
        },
        back: {
            path: base_path + 'deino-back.png',
            key: 'deino-back',
            frameWidth: 218,
            frameHeight: 410,
            frames: 43
        }
    },
    held_item: null,
    sounds: 'assets/sounds/deino-cry.ogg',
    stat_total: 300
});

let gastly = new Pokemon({
    name: "Gastly",
    description: "Its body is made of gas. Despite lacking substance, it can envelop an opponent of any size and cause suffocation.",
    types: ['ghost', 'poison'],
    moves: [deepClone(all_moves.confuse_ray), deepClone(all_moves.lick), deepClone(all_moves.hypnosis)],
    learnable_moves: [],
    abilities: ['Levitate'],
    growth_rate: 'Medium Slow',
    height: 1.3,
    weight: 0.1,
    level: 5,
    catch_rate: 190,
    pokemon_number: 633,
    hp: {
        base: 30,
        max: 30,
        current: 30
    },
    xp: {
        base: 62,
        total: 0
    },
    atk: {
        base: 35,
        current: 35,
        effective: 35,
        stage: 0
    },
    def: {
        base: 30,
        current: 30,
        effective: 30,
        stage: 0
    },
    sp_atk: {
        base: 100,
        current: 100,
        effective: 100,
        stage: 0
    },
    sp_def: {
        base: 35,
        current: 35,
        effective: 35,
        stage: 0
    },
    speed: {
        base: 80,
        current: 80,
        effective: 80,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'gastly-front.png',
            key: 'gastly-front',
            frameWidth: 286,
            frameHeight: 310,
            frames: 40
        },
        back: {
            path: base_path + 'gastly-back.png',
            key: 'gastly-back',
            frameWidth: 377,
            frameHeight: 410,
            frames: 40
        }
    },
    held_item: null,
    sounds: 'assets/sounds/gastly-cry.ogg',
    stat_total: 310
});


let timburr = new Pokemon({
    name: "Timburr",
    description: "It loves helping out with construction projects. It loves it so much that if rain causes work to halt, it swings its log around and throws a tantrum.",
    types: ['fighting'],
    moves: [deepClone(all_moves.leer), deepClone(all_moves.pound), deepClone(all_moves.low_kick)],
    learnable_moves: [{ at_level: 8, move: { ...all_moves.rock_trhow } }, { at_level: 12, move: { ...all_moves.focus_energy } }, { at_level: 15, move: { ...all_moves.bulk_up } }],
    abilities: ['Guts'],
    growth_rate: 'Medium Slow',
    height: 0.6,
    weight: 12.5,
    level: 5,
    catch_rate: 180,
    pokemon_number: 532,
    hp: {
        base: 75,
        max: 75,
        current: 75
    },
    xp: {
        base: 61,
        total: 0
    },
    atk: {
        base: 80,
        current: 80,
        effective: 80,
        stage: 0
    },
    def: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    sp_atk: {
        base: 25,
        current: 25,
        effective: 25,
        stage: 0
    },
    sp_def: {
        base: 35,
        current: 35,
        effective: 35,
        stage: 0
    },
    speed: {
        base: 35,
        current: 35,
        effective: 35,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'timburr-front.png',
            key: 'timburr-front',
            frameWidth: 335,
            frameHeight: 310,
            frames: 23
        },
        back: {
            path: base_path + 'timburr-back.png',
            key: 'timburr-back',
            frameWidth: 441,
            frameHeight: 410,
            frames: 23
        }
    },
    held_item: null,
    sounds: 'assets/sounds/timburr-cry.ogg',
    stat_total: 305
});


let torchic = new Pokemon({
    name: "Torchic",
    description: "A fire burns inside it, so it feels very warm to hug. It launches fireballs of 1,800 degrees Fahrenheit.",
    types: ['fire'],
    moves: [deepClone(all_moves.growl), deepClone(all_moves.scratch), deepClone(all_moves.ember)],
    learnable_moves: [{ at_level: 6, move: { ...all_moves.quick_attack } }, { at_level: 9, move: { ...all_moves.flame_charge } }, { at_level: 12, move: { ...all_moves.detect } }, { at_level: 15, move: { ...all_moves.sand_attack } }],
    abilities: ['Blaze'],
    growth_rate: 'Medium Slow',
    height: 0.4,
    level: 15,
    catch_rate: 45,
    pokemon_number: 255,
    hp: {
        base: 45,
        max: 45,
        current: 45
    },
    xp: {
        base: 62,
        total: 0
    },
    atk: {
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    def: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    sp_atk: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    sp_def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    speed: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'torchic-front.png',
            key: 'torchic-front',
            frameWidth: 171,
            frameHeight: 310,
            frames: 40
        },
        back: {
            path: base_path + 'torchic-back.png',
            key: 'torchic-back',
            frameWidth: 225,
            frameHeight: 410,
            frames: 40
        }
    },
    held_item: all_items.lum_berry,
    sounds: 'assets/sounds/torchic-cry.ogg'
});

let treecko = new Pokemon({
    name: "Treecko",
    description: "The soles of its feet are covered by countless tiny hooks, enabling it to walk on walls and ceilings.",
    types: ['grass'],
    moves: [deepClone(all_moves.leer), deepClone(all_moves.pound), deepClone(all_moves.leafage)],
    learnable_moves: [{ at_level: 6, move: { ...all_moves.quick_attack } }, { at_level: 9, move: { ...all_moves.mega_drain } }, { at_level: 12, move: { ...all_moves.detect } }, { at_level: 15, move: { ...all_moves.giga_drain } }],
    abilities: ['Overgrow'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 252,
    hp: {
        base: 40,
        max: 40,
        current: 40
    },
    xp: {
        base: 62,
        total: 0
    },
    atk: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    def: {
        base: 35,
        current: 35,
        effective: 35,
        stage: 0
    },
    sp_atk: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    sp_def: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    speed: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'treecko-front.png',
            key: 'treecko-front',
            frameWidth: 249,
            frameHeight: 310,
            frames: 25
        },
        back: {
            path: base_path + 'treecko-back.png',
            key: 'treecko-back',
            frameWidth: 328,
            frameHeight: 410,
            frames: 25
        }
    },
    held_item: all_items.lum_berry,
    sounds: 'assets/sounds/treeko-cry.ogg'
});

let mudkip = new Pokemon({
    name: "Mudkip",
    description: "Using the fin on its head, Mudkip senses the flow of water to keep track of what’s going on around it. Mudkip has the strength to heft boulders.",
    types: ['water'],
    height: 0.4,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.tackle), deepClone(all_moves.water_gun)],
    learnable_moves: [{ at_level: 6, move: { ...all_moves.rock_smash } }, { at_level: 9, move: { ...all_moves.rock_trhow } }, { at_level: 12, move: { ...all_moves.protect } }, { at_level: 15, move: { ...all_moves.supersonic } }],
    abilities: ['Torrent'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 258,
    hp: {
        base: 50,
        max: 50,
        current: 50
    },
    xp: {
        base: 62,
        total: 0
    },
    atk: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    sp_atk: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    sp_def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    speed: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'mudkip-front.png',
            key: 'mudkip-front',
            frameWidth: 236,
            frameHeight: 310,
            frames: 32
        },
        back: {
            path: base_path + 'mudkip-back.png',
            key: 'mudkip-back',
            frameWidth: 308,
            frameHeight: 410,
            frames: 32
        }
    },
    sounds: 'assets/sounds/mudkip-cry.ogg',
    held_item: null,
});

let aggron = new Pokemon({
    name: "Aggron",
    description: "Using the fin on its head, Mudkip senses the flow of water to keep track of what’s going on around it. Mudkip has the strength to heft boulders.",
    types: ['steel'],
    height: 2,
    moves: [{ ...all_moves.mega_drain }, { ...all_moves.tackle }, { ...all_moves.water_gun }, { ...all_moves.ember }],
    abilities: ['Torrent'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 258,
    hp: {
        base: 50,
        max: 50,
        current: 50
    },
    xp: {
        base: 62,
        total: 0
    },
    atk: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    sp_atk: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    sp_def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    speed: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'aggron-front.png',
            key: 'aggron-front',
            frameWidth: 392,
            frameHeight: 310,
            frames: 38
        },
        back: {
            path: base_path + 'aggron-back.png',
            key: 'aggron-back',
            frameWidth: 504,
            frameHeight: 410,
            frames: 38
        }
    },
    sounds: 'assets/sounds/aggron-cry.ogg'
});

let nosepass = new Pokemon({
    name: "Nosepass",
    description: "Once the people of Hisui discovered that its red nose always points north, they grew to rely on it greatly when traveling afar. The nose seems to work in a similar way to ancient compasses..",
    types: ['rock'],
    height: 1,
    //self destruct, seismic toss, thunder wave, rock throw
    moves: [{ ...all_moves.self_destruct }, { ...all_moves.seismic_toss }, { ...all_moves.thunder_wave }, { ...all_moves.rock_trhow }],
    abilities: ['Sturdy'],
    growth_rate: 'Medium Fast',
    level: 15,
    catch_rate: 255,
    pokemon_number: 258,
    hp: {
        base: 30,
        max: 30,
        current: 30
    },
    xp: {
        base: 75,
        total: 0
    },
    atk: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    def: {
        base: 135,
        current: 135,
        effective: 135,
        stage: 0
    },
    sp_atk: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    sp_def: {
        base: 90,
        current: 90,
        effective: 90,
        stage: 0
    },
    speed: {
        base: 30,
        current: 30,
        effective: 30,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'nosepass-front.png',
            key: 'nosepass-front',
            frameWidth: 314,
            frameHeight: 310,
            frames: 44
        },
        back: {
            path: base_path + 'nosepass-back.png',
            key: 'nosepass-back',
            frameWidth: 417,
            frameHeight: 410,
            frames: 44
        }
    },
    sounds: 'assets/sounds/nosepass-cry.ogg',
    nature: 'Naughty',
    held_item: all_items.sitrus_berry
});

let lunatone = new Pokemon({
    name: "Lunatone",
    description: "It was discovered at the site of a meteor strike 40 years ago. Its stare can lull its foes to sleep.",
    types: ['rock', 'psychic'],
    height: 1,
    moves: [{ ...all_moves.moonlight }, { ...all_moves.confusion }, { ...all_moves.rock_slide }, { ...all_moves.hypnosis }],
    abilities: ['Levitate'],
    growth_rate: 'Fast',
    level: 15,
    catch_rate: 45,
    pokemon_number: 337,
    hp: {
        base: 90,
        max: 90,
        current: 90
    },
    xp: {
        base: 161,
        total: 0
    },
    atk: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    def: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    sp_atk: {
        base: 95,
        current: 95,
        effective: 95,
        stage: 0
    },
    sp_def: {
        base: 85,
        current: 85,
        effective: 85,
        stage: 0
    },
    speed: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'lunatone-front.png',
            key: 'lunatone-front',
            frameWidth: 207,
            frameHeight: 310,
            frames: 57
        },
        back: {
            path: base_path + 'lunatone-back.png',
            key: 'lunatone-back',
            frameWidth: 269,
            frameHeight: 410,
            frames: 57
        }
    },
    sounds: 'assets/sounds/lunatone-cry.ogg',
    nature: 'Lonely',
    leviates: true,
    held_item: all_items.sitrus_berry
});

let lileep = new Pokemon({
    name: "Lileep",
    description: "Lileep clings to rocks on the seabed. When prey comes close, this Pokémon entangles it with petallike tentacles.",
    types: ['rock', 'grass'],
    height: 1,
    moves: [{ ...all_moves.giga_drain }, { ...all_moves.sludge_bomb }, { ...all_moves.recover }, { ...all_moves.rock_tomb }],
    abilities: ['Storm Drain'],
    growth_rate: 'Erratic',
    level: 15,
    catch_rate: 45,
    pokemon_number: 345,
    hp: {
        base: 66,
        max: 66,
        current: 66
    },
    xp: {
        base: 71,
        total: 0
    },
    atk: {
        base: 41,
        current: 41,
        effective: 41,
        stage: 0
    },
    def: {
        base: 77,
        current: 77,
        effective: 77,
        stage: 0
    },
    sp_atk: {
        base: 61,
        current: 61,
        effective: 61,
        stage: 0
    },
    sp_def: {
        base: 87,
        current: 87,
        effective: 87,
        stage: 0
    },
    speed: {
        base: 23,
        current: 23,
        effective: 23,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'lileep-front.png',
            key: 'lileep-front',
            frameWidth: 236,
            frameHeight: 310,
            frames: 15
        },
        back: {
            path: base_path + 'lileep-back.png',
            key: 'lileep-back',
            frameWidth: 299,
            frameHeight: 410,
            frames: 15
        }
    },
    sounds: 'assets/sounds/lileep-cry.ogg',
    held_item: all_items.sitrus_berry
});

let wingull = new Pokemon({
    name: "Wingull",
    description: "It rides upon ocean winds as if it were a glider. In the winter, it hides food around its nest.",
    types: ['water', 'flying'],
    height: 0.6,
    weight: 9.5,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.water_gun)],
    learnable_moves: [{ at_level: 5, move: { ...all_moves.quick_attack } }, { at_level: 10, move: { ...all_moves.supersonic } }, { at_level: 15, move: { ...all_moves.wing_attack } }],
    abilities: ['Keen Eye'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 190,
    pokemon_number: 278,
    hp: {
        base: 40,
        max: 40,
        current: 40
    },
    xp: {
        base: 54,
        total: 0
    },
    atk: {
        base: 30,
        current: 30,
        effective: 30,
        stage: 0
    },
    def: {
        base: 30,
        current: 30,
        effective: 30,
        stage: 0
    },
    sp_atk: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    sp_def: {
        base: 30,
        current: 30,
        effective: 30,
        stage: 0
    },
    speed: {
        base: 85,
        current: 85,
        effective: 85,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'wingull-front.png',
            key: 'wingull-front',
            frameWidth: 348,
            frameHeight: 310,
            frames: 32
        },
        back: {
            path: base_path + 'wingull-back.png',
            key: 'wingull-back',
            frameWidth: 460,
            frameHeight: 410,
            frames: 32
        }
    },
    sounds: 'assets/sounds/wingull-cry.ogg',
    held_item: all_items.sitrus_berry,
    stat_total: 270
});

let poochyena = new Pokemon({
    name: "Poochyena",
    description: "A Pokémon with a persistent nature, it chases its chosen prey until the prey becomes exhausted.",
    types: ['dark'],
    height: 0.5,
    weight: 13.6,
    moves: [deepClone(all_moves.tackle), deepClone(all_moves.howl)],
    learnable_moves: [{ at_level: 7, move: { ...all_moves.sand_attack } }, { at_level: 10, move: { ...all_moves.bite } }, { at_level: 13, move: { ...all_moves.leer } }],
    abilities: ['Run Away'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 255,
    pokemon_number: 261,
    hp: {
        base: 35,
        max: 35,
        current: 35
    },
    xp: {
        base: 56,
        total: 0
    },
    atk: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    def: {
        base: 35,
        current: 35,
        effective: 35,
        stage: 0
    },
    sp_atk: {
        base: 30,
        current: 30,
        effective: 30,
        stage: 0
    },
    sp_def: {
        base: 30,
        current: 30,
        effective: 30,
        stage: 0
    },
    speed: {
        base: 35,
        current: 35,
        effective: 35,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'poochyena-front.png',
            key: 'poochyena-front',
            frameWidth: 248,
            frameHeight: 310,
            frames: 22
        },
        back: {
            path: base_path + 'poochyena-back.png',
            key: 'poochyena-back',
            frameWidth: 317,
            frameHeight: 410,
            frames: 22
        }
    },
    sounds: 'assets/sounds/poochyena-cry.ogg',
    held_item: null,
    stat_total: 220
});

let zigzagoon = new Pokemon({
    name: "Zigzagoon",
    description: "It walks in zigzag fashion. It’s good at finding items in the grass and even in the ground.",
    types: ['normal'],
    height: 0.4,
    weight: 17.5,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.tackle)],
    learnable_moves: [{ at_level: 3, move: { ...all_moves.sand_attack } }, { at_level: 6, move: { ...all_moves.tail_whip } }, { at_level: 9, move: { ...all_moves.headbutt } }, { at_level: 15, move: { ...all_moves.baby_doll_eyes } }],
    abilities: ['Glattony'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 255,
    pokemon_number: 263,
    hp: {
        base: 38,
        max: 38,
        current: 38
    },
    xp: {
        base: 56,
        total: 0
    },
    atk: {
        base: 30,
        current: 30,
        effective: 30,
        stage: 0
    },
    def: {
        base: 41,
        current: 41,
        effective: 41,
        stage: 0
    },
    sp_atk: {
        base: 30,
        current: 30,
        effective: 30,
        stage: 0
    },
    sp_def: {
        base: 41,
        current: 41,
        effective: 41,
        stage: 0
    },
    speed: {
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'zigzagoon-front.png',
            key: 'zigzagoon-front',
            frameWidth: 368,
            frameHeight: 310,
            frames: 30
        },
        back: {
            path: base_path + 'zigzagoon-back.png',
            key: 'zigzagoon-back',
            frameWidth: 504,
            frameHeight: 410,
            frames: 30
        }
    },
    sounds: 'assets/sounds/zigzagoon-cry.ogg',
    held_item: null,
    stat_total: 240
});

let ralts = new Pokemon({
    name: "Ralts",
    description: "The horns on its head provide a strong power that enables it to sense people’s emotions.",
    types: ['psychic', 'fairy'],
    height: 0.4,
    weight: 6.6,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.disarming_voice)],
    learnable_moves: [{ at_level: 6, move: { ...all_moves.confusion } }, { at_level: 9, move: { ...all_moves.hypnosis } }, { at_level: 12, move: { ...all_moves.draining_kiss } }, { at_level: 15, move: { ...all_moves.psybeam } }],
    abilities: ['Synchronize'],
    growth_rate: 'Slow',
    level: 5,
    catch_rate: 235,
    pokemon_number: 280,
    hp: {
        base: 28,
        max: 28,
        current: 28
    },
    xp: {
        base: 40,
        total: 0
    },
    atk: {
        base: 25,
        current: 25,
        effective: 25,
        stage: 0
    },
    def: {
        base: 25,
        current: 25,
        effective: 25,
        stage: 0
    },
    sp_atk: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    sp_def: {
        base: 35,
        current: 35,
        effective: 35,
        stage: 0
    },
    speed: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'ralts-front.png',
            key: 'ralts-front',
            frameWidth: 196,
            frameHeight: 310,
            frames: 38
        },
        back: {
            path: base_path + 'ralts-back.png',
            key: 'ralts-back',
            frameWidth: 249,
            frameHeight: 410,
            frames: 38
        }
    },
    sounds: 'assets/sounds/ralts-cry.ogg',
    held_item: null,
    stat_total: 198
});

let meowth = new Pokemon({
    name: "Meowth",
    description: "It loves things that sparkle. When it sees a shiny object, the gold coin on its head shines, too.",
    types: ['normal'],
    height: 0.4,
    weight: 4.2,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.scratch)],
    learnable_moves: [{ at_level: 6, move: { ...all_moves.tail_whip } }, { at_level: 9, move: { ...all_moves.bite } }, { at_level: 15, move: { ...all_moves.take_down } }],
    abilities: ['Technician'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 255,
    pokemon_number: 52,
    hp: {
        base: 40,
        max: 40,
        current: 40
    },
    xp: {
        base: 58,
        total: 0
    },
    atk: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    def: {
        base: 35,
        current: 35,
        effective: 35,
        stage: 0
    },
    sp_atk: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    sp_def: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    speed: {
        base: 90,
        current: 90,
        effective: 90,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'meowth-front.png',
            key: 'meowth-front',
            frameWidth: 246,
            frameHeight: 310,
            frames: 27
        },
        back: {
            path: base_path + 'meowth-back.png',
            key: 'meowth-back',
            frameWidth: 341,
            frameHeight: 410,
            frames: 27
        }
    },
    sounds: 'assets/sounds/meowth-cry.ogg',
    held_item: null,
    stat_total: 290,
    location: [{ map_name: 'start', chance: 0.2 }]
});

let electrike = new Pokemon({
    name: "Electrike",
    description: "Using electricity stored in its fur, it stimulates its muscles to heighten its reaction speed.",
    types: ['electric'],
    height: 0.6,
    weight: 15.2,
    moves: [deepClone(all_moves.tackle), deepClone(all_moves.thunder_wave)],
    learnable_moves: [{ at_level: 4, move: { ...all_moves.leer } }, { at_level: 8, move: { ...all_moves.howl } }, { at_level: 12, move: { ...all_moves.quick_attack } }, { at_level: 15, move: { ...all_moves.shock_wave } }],
    abilities: ['Static'],
    growth_rate: 'Slow',
    level: 5,
    catch_rate: 255,
    pokemon_number: 52,
    hp: {
        base: 40,
        max: 40,
        current: 40
    },
    xp: {
        base: 59,
        total: 0
    },
    atk: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    def: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    sp_atk: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    sp_def: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    speed: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'electrike-front.png',
            key: 'electrike-front',
            frameWidth: 335,
            frameHeight: 310,
            frames: 25
        },
        back: {
            path: base_path + 'electrike-back.png',
            key: 'electrike-back',
            frameWidth: 457,
            frameHeight: 410,
            frames: 25
        }
    },
    sounds: 'assets/sounds/electrike-cry.ogg',
    held_item: null,
    stat_total: 290
});

export const Pokemons = {
    treecko, torchic, mudkip, aggron, nosepass, lunatone, lileep, wingull, ralts, zigzagoon, poochyena, electrike, meowth, timburr, gastly, deino
}