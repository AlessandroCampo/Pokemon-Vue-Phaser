
import { all_moves } from "./moves.mjs";
import { all_items } from "./items.mjs";

import Phaser from "phaser";
import gsap from 'gsap'
import { store } from "@/store";
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
    constructor({ name, description, height, weight, types, level, moves, learnable_moves, abilities, gender, xp, base_exp, growth_rate, catch_rate, pokemon_number, status, confused, flinched, hp, atk, def, sp_atk, sp_def, speed, accuracy, evasion, evolution, images, sounds, damage, location, fainted, sprite, nature, held_item, levitates, stat_total }) {
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
        this.levitates = levitates || false
        this.guarded = false
        this.stat_total = stat_total || null
        this.crhit_chance = 4.17
        this.sleeping_turns = null


    }
    drawSprite(scene) {

        let position = this.player_controlled ? ally_position : oppo_position;
        let asset_key = this.player_controlled ? this.images.front.key : this.images.back.key;

        // Create and configure sprite
        let starting_offset = this.player_controlled ? -500 : +500;
        this.sprite = scene.add.sprite(position.x + starting_offset, position.y + 10, asset_key);
        this.sprite.setOrigin(0.5, 1); // Set anchor to bottom center
        this.setPropScale()

    }

    setPropScale() {
        //TODO - fix sprite scales
        let player_controlled_multiplier = this.player_controlled ? 0.7
            : 0.4;

        if (this.height > 5) {
            player_controlled_multiplier *= 2
        }
        if (this.name == 'Onix' && this.player_controlled) {
            player_controlled_multiplier = 0.8
        }
        if (this.name == 'Aggron') {
            player_controlled_multiplier *= 1.2
        }
        if (this.name == 'Houndoom') {
            player_controlled_multiplier *= 1.1
        }
        if ((this.name == 'Electrike' || this.name == 'Wingull') && this.player_controlled) {
            player_controlled_multiplier = 0.5
        }
        // if (this.name == 'Tirtouga') {
        //     player_controlled_multiplier = player_controlled_multiplier / 2
        // }
        this.sprite.setScale(player_controlled_multiplier);
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
                x: position.x - 450 * multiplier,
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
        store.calcStats(this)
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
    learnable_moves: [{ at_level: 8, move: { ...all_moves.bite } }, { at_level: 15, move: { ...all_moves.headbutt } }],
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
    learnable_moves: [{ at_level: 8, move: { ...all_moves.protect } }, { at_level: 12, move: { ...all_moves.astonish } }, { at_level: 15, move: { ...all_moves.hex } }, { at_level: 20, move: { ...all_moves.night_shade } }],
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
    learnable_moves: [{ at_level: 8, move: { ...all_moves.rock_trhow } }, { at_level: 12, move: { ...all_moves.focus_energy } }, { at_level: 15, move: { ...all_moves.bulk_up } }, { at_level: 20, move: { ...all_moves.rock_slide } }],
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

let combusken = new Pokemon({
    name: "Combusken",
    description: "A fire burns inside it, so it feels very warm to hug. It launches fireballs of 1,800 degrees Fahrenheit.",
    types: ['fire'],
    moves: [deepClone(all_moves.growl), deepClone(all_moves.scratch), deepClone(all_moves.ember)],
    learnable_moves: [{ at_level: 6, move: { ...all_moves.quick_attack } }, { at_level: 9, move: { ...all_moves.flame_charge } }, { at_level: 12, move: { ...all_moves.detect } }, { at_level: 15, move: { ...all_moves.sand_attack } }, { at_level: 20, move: { ...all_moves.aerial_ace } }, , { at_level: 25, move: { ...all_moves.slash } },],
    abilities: ['Blaze'],
    growth_rate: 'Medium Slow',
    height: 0.9,
    level: 5,
    catch_rate: 45,
    pokemon_number: 256,
    height: 0.9,
    weight: 19.5,
    hp: {
        base: 60,
        max: 60,
        current: 60
    },
    xp: {
        base: 142,
        total: 0
    },
    atk: {
        base: 85,
        current: 85,
        effective: 85,
        stage: 0
    },
    def: {
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    sp_atk: {
        base: 85,
        current: 85,
        effective: 85,
        stage: 0
    },
    sp_def: {
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    speed: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    evolution: null,
    images: {
        front: {
            path: base_path + 'combusken-front.png',
            key: 'combusken-front',
            frameWidth: 245,
            frameHeight: 310,
            frames: 18
        },
        back: {
            path: base_path + 'combusken-back.png',
            key: 'combusken-back',
            frameWidth: 323,
            frameHeight: 410,
            frames: 18
        }
    },
    held_item: null,
    sounds: 'assets/sounds/combusken-cry.ogg',
    stat_total: 405
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
    level: 5,
    catch_rate: 45,
    pokemon_number: 255,
    height: 0.4,
    weight: 2.5,
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
    evolution: { at_level: 16, into: deepClone(combusken) },
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
    held_item: null,
    sounds: 'assets/sounds/torchic-cry.ogg',
    stat_total: 310
});

let grovyle = new Pokemon({
    name: "Grovyle",
    description: "This Pokémon adeptly flies from branch to branch in trees. In a forest, no Pokémon can ever hope to catch a fleeing Grovyle however fast they may be.",
    types: ['grass'],
    moves: [deepClone(all_moves.leer), deepClone(all_moves.pound), deepClone(all_moves.leafage)],
    learnable_moves: [{ at_level: 6, move: { ...all_moves.quick_attack } }, { at_level: 9, move: { ...all_moves.mega_drain } }, { at_level: 12, move: { ...all_moves.detect } }, { at_level: 15, move: { ...all_moves.giga_drain } }, { at_level: 20, move: { ...all_moves.x_scissor } }],
    abilities: ['Overgrow'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 253,
    height: 0.5,
    weight: 5,
    hp: {
        base: 50,
        max: 50,
        current: 50
    },
    xp: {
        base: 142,
        total: 0
    },
    atk: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    def: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    sp_atk: {
        base: 85,
        current: 85,
        effective: 85,
        stage: 0
    },
    sp_def: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    speed: {
        base: 95,
        current: 95,
        effective: 95,
        stage: 0
    },
    evolution: null,
    images: {
        front: {
            path: base_path + 'grovyle-front.png',
            key: 'grovyle-front',
            frameWidth: 323,
            frameHeight: 310,
            frames: 32
        },
        back: {
            path: base_path + 'grovyle-back.png',
            key: 'grovyle-back',
            frameWidth: 428,
            frameHeight: 410,
            frames: 32
        }
    },
    held_item: null,
    sounds: 'assets/sounds/grovyle-cry.ogg',
    stat_total: 405
});

let treecko = new Pokemon({
    name: "Treecko",
    description: "The soles of its feet are covered by countless tiny hooks, enabling it to walk on walls and ceilings.",
    types: ['grass'],
    moves: [deepClone(all_moves.leer), deepClone(all_moves.pound), deepClone(all_moves.leafage)],
    learnable_moves: [{ at_level: 6, move: { ...all_moves.quick_attack } }, { at_level: 9, move: { ...all_moves.mega_drain } }, { at_level: 12, move: { ...all_moves.detect } }, { at_level: 20, move: { ...all_moves.giga_drain } }],
    abilities: ['Overgrow'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 252,
    height: 0.5,
    weight: 5,
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
    evolution: { at_level: 16, into: deepClone(grovyle) },
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
    held_item: null,
    sounds: 'assets/sounds/treeko-cry.ogg',
    stat_total: 310
});

let marshtomp = new Pokemon({
    name: "Marshtomp",
    description: "The surface of Marshtomp’s body is enveloped by a thin, sticky film that enables it to live on land. This Pokémon plays in mud on beaches when the ocean tide is low.",
    types: ['water', 'ground'],
    height: 0.7,
    weight: 28,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.tackle), deepClone(all_moves.water_gun)],
    learnable_moves: [{ at_level: 6, move: { ...all_moves.rock_smash } }, { at_level: 9, move: { ...all_moves.rock_trhow } }, { at_level: 12, move: { ...all_moves.protect } }, { at_level: 15, move: { ...all_moves.supersonic } }, { at_level: 20, move: { ...all_moves.water_pulse } }, { at_level: 25, move: { ...all_moves.rock_slide } }, { at_level: 30, move: { ...all_moves.take_down } }],
    abilities: ['Torrent'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 259,
    hp: {
        base: 70,
        max: 70,
        current: 70
    },
    xp: {
        base: 142,
        total: 0
    },
    atk: {
        base: 85,
        current: 85,
        effective: 85,
        stage: 0
    },
    def: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    sp_atk: {
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    sp_def: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    speed: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    evolution: null,
    images: {
        front: {
            path: base_path + 'marshtomp-front.png',
            key: 'marshtomp-front',
            frameWidth: 245,
            frameHeight: 310,
            frames: 33
        },
        back: {
            path: base_path + 'marshtomp-back.png',
            key: 'marshtomp-back',
            frameWidth: 323,
            frameHeight: 410,
            frames: 33
        }
    },
    sounds: 'assets/sounds/marshtomp-cry.ogg',
    held_item: null,
});

let mudkip = new Pokemon({
    name: "Mudkip",
    description: "Using the fin on its head, Mudkip senses the flow of water to keep track of what’s going on around it. Mudkip has the strength to heft boulders.",
    types: ['water'],
    height: 0.4,
    weight: 7.6,
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
    evolution: { at_level: 16, into: deepClone(marshtomp) },
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
    description: "While seeking iron for food, it digs tunnels by breaking through bedrock with its steel horns.",
    types: ['steel', 'rock'],
    moves: [{ ...all_moves.harden }, { ...all_moves.metal_claw }, { ...all_moves.rock_tomb }, { ...all_moves.tackle }],
    learnable_moves: [{ at_level: 12, move: { ...all_moves.headbutt } }, { at_level: 15, move: { ...all_moves.protect } }, { at_level: 18, move: { ...all_moves.rock_slide } }, { at_level: 20, move: { ...all_moves.iron_head } }],
    abilities: ['Rock Head'],
    growth_rate: 'Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 306,
    height: 2.1,
    weight: 360,
    hp: {
        base: 70,
        max: 70,
        current: 70
    },
    xp: {
        base: 239,
        total: 0
    },
    atk: {
        base: 110,
        current: 110,
        effective: 110,
        stage: 0
    },
    def: {
        base: 180,
        current: 180,
        effective: 180,
        stage: 0
    },
    sp_atk: {
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    sp_def: {
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    speed: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    evolution: null,
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
    sounds: 'assets/sounds/aggron-cry.ogg',
    stat_total: 530
});

let aron = new Pokemon({
    name: "Aron",
    description: "It usually lives deep in mountains. But when it’s hungry, it shows up at the foot of the mountains and eats railroad tracks and cars.",
    types: ['steel'],
    height: 0.4,
    weight: 60,
    moves: [{ ...all_moves.harden }, { ...all_moves.metal_claw }, { ...all_moves.rock_tomb }, { ...all_moves.tackle }],
    learnable_moves: [{ at_level: 12, move: { ...all_moves.headbutt } }, { at_level: 15, move: { ...all_moves.protect } }, { at_level: 18, move: { ...all_moves.rock_slide } }, { at_level: 20, move: { ...all_moves.iron_head } }],
    abilities: ['Rock Head'],
    growth_rate: 'Slow',
    level: 5,
    catch_rate: 180,
    pokemon_number: 304,
    hp: {
        base: 50,
        max: 50,
        current: 50
    },
    xp: {
        base: 66,
        total: 0
    },
    atk: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    def: {
        base: 100,
        current: 100,
        effective: 100,
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
        base: 30,
        current: 30,
        effective: 30,
        stage: 0
    },
    evolution: null,
    images: {
        front: {
            path: base_path + 'aron-front.png',
            key: 'aron-front',
            frameWidth: 276,
            frameHeight: 310,
            frames: 25
        },
        back: {
            path: base_path + 'aron-back.png',
            key: 'aron-back',
            frameWidth: 369,
            frameHeight: 410,
            frames: 25
        }
    },
    sounds: 'assets/sounds/aron-cry.ogg',
    stat_total: 330
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
    levitates: true,
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

let pelipper = new Pokemon({
    name: "Pelipper",
    description: "It protects its young in its beak. It bobs on waves, resting on them on days when the waters are calm.",
    types: ['water', 'flying'],
    height: 1.2,
    weight: 28,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.water_gun)],
    learnable_moves: [{ at_level: 5, move: { ...all_moves.quick_attack } }, { at_level: 10, move: { ...all_moves.supersonic } }, { at_level: 15, move: { ...all_moves.wing_attack } }, { at_level: 18, move: { ...all_moves.water_pulse } }, { at_level: 20, move: { ...all_moves.air_slash } },],
    abilities: ['Keen Eye'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 45,
    pokemon_number: 279,
    hp: {
        base: 60,
        max: 60,
        current: 60
    },
    xp: {
        base: 154,
        total: 0
    },
    atk: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    def: {
        base: 100,
        current: 100,
        effective: 100,
        stage: 0
    },
    sp_atk: {
        base: 95,
        current: 95,
        effective: 95,
        stage: 0
    },
    sp_def: {
        base: 70,
        current: 70,
        effective: 70,
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
            path: base_path + 'pelipper-front.png',
            key: 'pelipper-front',
            frameWidth: 368,
            frameHeight: 310,
            frames: 19
        },
        back: {
            path: base_path + 'pelipper-back.png',
            key: 'pelipper-back',
            frameWidth: 488,
            frameHeight: 410,
            frames: 19
        }
    },
    sounds: 'assets/sounds/pelipper-cry.ogg',
    held_item: null,
    stat_total: 440,

});

let wingull = new Pokemon({
    name: "Wingull",
    description: "It rides upon ocean winds as if it were a glider. In the winter, it hides food around its nest.",
    types: ['water', 'flying'],
    height: 0.6,
    weight: 9.5,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.water_gun)],
    learnable_moves: [{ at_level: 5, move: { ...all_moves.quick_attack } }, { at_level: 10, move: { ...all_moves.supersonic } }, { at_level: 15, move: { ...all_moves.wing_attack } }, { at_level: 15, move: { ...all_moves.water_pulse } }],
    abilities: ['Keen Eye'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 190,
    pokemon_number: 278,
    evolution: { at_level: 20, into: deepClone(pelipper) },
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
    held_item: null,
    stat_total: 270
});

let mightyena = new Pokemon({
    name: "Mightyena",
    description: "It chases down prey in a pack. It will never disobey the commands of a skilled Trainer.",
    types: ['dark'],
    height: 1,
    weight: 37,
    moves: [deepClone(all_moves.tackle), deepClone(all_moves.howl)],
    learnable_moves: [{ at_level: 7, move: { ...all_moves.sand_attack } }, { at_level: 10, move: { ...all_moves.bite } }, { at_level: 13, move: { ...all_moves.leer } }, { at_level: 16, move: { ...all_moves.ice_fang } }, { at_level: 20, move: { ...all_moves.swagger } }],
    abilities: ['Intimidate'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 127,
    pokemon_number: 262,
    hp: {
        base: 70,
        max: 70,
        current: 70
    },
    xp: {
        base: 147,
        total: 0
    },
    atk: {
        base: 90,
        current: 90,
        effective: 90,
        stage: 0
    },
    def: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    sp_atk: {
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    sp_def: {
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    speed: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'mightyena-front.png',
            key: 'mightyena-front',
            frameWidth: 252,
            frameHeight: 310,
            frames: 32
        },
        back: {
            path: base_path + 'mightyena-back.png',
            key: 'mightyena-back',
            frameWidth: 320,
            frameHeight: 410,
            frames: 32
        }
    },
    sounds: 'assets/sounds/mightyena-cry.ogg',
    held_item: null,
    stat_total: 420
});

let poochyena = new Pokemon({
    name: "Poochyena",
    description: "A Pokémon with a persistent nature, it chases its chosen prey until the prey becomes exhausted.",
    types: ['dark'],
    height: 0.5,
    weight: 13.6,
    moves: [deepClone(all_moves.tackle), deepClone(all_moves.howl)],
    learnable_moves: [{ at_level: 7, move: { ...all_moves.sand_attack } }, { at_level: 10, move: { ...all_moves.bite } }, { at_level: 13, move: { ...all_moves.leer } }, { at_level: 19, move: { ...all_moves.swagger } }],
    abilities: ['Run Away'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 255,
    pokemon_number: 261,
    evolution: { at_level: 18, into: deepClone(mightyena) },
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

let linoone = new Pokemon({
    name: "Linoone",
    description: "It charges prey at speeds over 60 mph. However, because it can only run straight, it often fails.",
    types: ['normal'],
    height: 0.5,
    weight: 32.5,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.tackle)],
    learnable_moves: [{ at_level: 3, move: { ...all_moves.sand_attack } }, { at_level: 6, move: { ...all_moves.tail_whip } }, { at_level: 9, move: { ...all_moves.headbutt } }, { at_level: 15, move: { ...all_moves.baby_doll_eyes } }, { at_level: 15, move: { ...all_moves.pin_missle } }],
    abilities: ['Glattony'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 255,
    pokemon_number: 264,
    hp: {
        base: 78,
        max: 78,
        current: 78
    },
    xp: {
        base: 56,
        total: 0
    },
    atk: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    def: {
        base: 61,
        current: 61,
        effective: 61,
        stage: 0
    },
    sp_atk: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    sp_def: {
        base: 61,
        current: 61,
        effective: 61,
        stage: 0
    },
    speed: {
        base: 100,
        current: 100,
        effective: 100,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'linoone-front.png',
            key: 'linoone-front',
            frameWidth: 627,
            frameHeight: 310,
            frames: 32
        },
        back: {
            path: base_path + 'linoone-back.png',
            key: 'linoone-back',
            frameWidth: 800,
            frameHeight: 410,
            frames: 32
        }
    },
    sounds: 'assets/sounds/linoone-cry.ogg',
    held_item: null,
    stat_total: 240
});

let zigzagoon = new Pokemon({
    name: "Zigzagoon",
    description: "It walks in zigzag fashion. It’s good at finding items in the grass and even in the ground.",
    types: ['normal'],
    height: 0.4,
    weight: 17.5,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.tackle)],
    learnable_moves: [{ at_level: 3, move: { ...all_moves.sand_attack } }, { at_level: 6, move: { ...all_moves.tail_whip } }, { at_level: 9, move: { ...all_moves.headbutt } }, { at_level: 15, move: { ...all_moves.baby_doll_eyes } }, { at_level: 15, move: { ...all_moves.pin_missle } }],
    abilities: ['Glattony'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 255,
    pokemon_number: 263,
    evolution: { at_level: 20, into: deepClone(linoone) },
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

let kirlia = new Pokemon({
    name: "Kirlia",
    description: "The cheerful spirit of its Trainer gives it energy for its psychokinetic power. It spins and dances when happy.",
    types: ['psychic', 'fairy'],
    height: 0.4,
    weight: 6.6,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.disarming_voice)],
    learnable_moves: [{ at_level: 6, move: { ...all_moves.confusion } }, { at_level: 9, move: { ...all_moves.hypnosis } }, { at_level: 12, move: { ...all_moves.draining_kiss } }, { at_level: 15, move: { ...all_moves.psybeam } }],
    abilities: ['Synchronize'],
    growth_rate: 'Slow',
    level: 5,
    catch_rate: 120,
    pokemon_number: 281,

    hp: {
        base: 38,
        max: 38,
        current: 38
    },
    xp: {
        base: 97,
        total: 0
    },
    atk: {
        base: 35,
        current: 35,
        effective: 35,
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
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'kirlia-front.png',
            key: 'kirlia-front',
            frameWidth: 205,
            frameHeight: 310,
            frames: 25
        },
        back: {
            path: base_path + 'kirlia-back.png',
            key: 'kirlia-back',
            frameWidth: 271,
            frameHeight: 410,
            frames: 25
        }
    },
    sounds: 'assets/sounds/kirlia-cry.ogg',
    held_item: null,
    stat_total: 278
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
    evolution: { at_level: 20, into: deepClone(kirlia) },
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
    learnable_moves: [{ at_level: 4, move: { ...all_moves.leer } }, { at_level: 8, move: { ...all_moves.howl } }, { at_level: 12, move: { ...all_moves.quick_attack } }, { at_level: 15, move: { ...all_moves.shock_wave } }, , { at_level: 20, move: { ...all_moves.bite } }],
    abilities: ['Static'],
    growth_rate: 'Slow',
    level: 5,
    catch_rate: 255,
    pokemon_number: 309,
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

let staravia = new Pokemon({
    name: "Staravia",
    description: "Recognizing their own weakness, they always live in a group. When alone, a Staravia cries noisily.",
    types: ['flying'],
    height: 0.6,
    weight: 15.5,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.quick_attack), deepClone(all_moves.tackle)],
    learnable_moves: [{ at_level: 9, move: { ...all_moves.wing_attack } }, { at_level: 13, move: { ...all_moves.dobule_team } }],
    abilities: ['Keen Eye'],
    growth_rate: 'Medium Slow',
    level: 14,
    catch_rate: 120,
    pokemon_number: 397,
    hp: {
        base: 55,
        max: 55,
        current: 55
    },
    xp: {
        base: 119,
        total: 0
    },
    atk: {
        base: 75,
        current: 75,
        effective: 75,
        stage: 0
    },
    def: {
        base: 50,
        current: 50,
        effective: 50,
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
        base: 80,
        current: 80,
        effective: 80,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'staravia-front.png',
            key: 'staravia-front',
            frameWidth: 335,
            frameHeight: 310,
            frames: 10
        },
        back: {
            path: base_path + 'staravia-back.png',
            key: 'staravia-back',
            frameWidth: 433,
            frameHeight: 410,
            frames: 10
        }
    },
    sounds: 'assets/sounds/staravia-cry.ogg',
    held_item: null,
    stat_total: 340,
    levitates: true
});

let starly = new Pokemon({
    name: "Starly",
    description: "They flock around mountains and fields, chasing after bug Pokémon. Their singing is noisy and annoying.",
    types: ['flying', 'normal'],
    height: 0.3,
    weight: 2,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.quick_attack), deepClone(all_moves.tackle)],
    learnable_moves: [{ at_level: 9, move: { ...all_moves.wing_attack } }, { at_level: 13, move: { ...all_moves.dobule_team } }],
    abilities: ['Keen Eye'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 255,
    pokemon_number: 396,
    evolution: { at_level: 14, into: deepClone(staravia) },
    hp: {
        base: 40,
        max: 40,
        current: 40
    },
    xp: {
        base: 49,
        total: 0
    },
    atk: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    def: {
        base: 30,
        current: 30,
        effective: 30,
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
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'starly-front.png',
            key: 'starly-front',
            frameWidth: 249,
            frameHeight: 310,
            frames: 15
        },
        back: {
            path: base_path + 'starly-back.png',
            key: 'starly-back',
            frameWidth: 334,
            frameHeight: 410,
            frames: 15
        }
    },
    sounds: 'assets/sounds/starly-cry.ogg',
    held_item: null,
    stat_total: 245,
    levitates: true
});

let kricketune = new Pokemon({
    name: "Kricketune",
    description: "It signals its emotions with its melodies. Scientists are studying these melodic patterns.",
    types: ['bug'],
    height: 1,
    weight: 25.5,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.tackle), deepClone(all_moves.absorb)],
    learnable_moves: [],
    abilities: ['Swarm'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 402,
    evolution: null,
    hp: {
        base: 77,
        max: 77,
        current: 77
    },
    xp: {
        base: 134,
        total: 0
    },
    atk: {
        base: 85,
        current: 85,
        effective: 85,
        stage: 0
    },
    def: {
        base: 51,
        current: 51,
        effective: 51,
        stage: 0
    },
    sp_atk: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    sp_def: {
        base: 51,
        current: 51,
        effective: 51,
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
            path: base_path + 'kricketune-front.png',
            key: 'kricketune-front',
            frameWidth: 283,
            frameHeight: 310,
            frames: 29
        },
        back: {
            path: base_path + 'kricketune-back.png',
            key: 'kricketune-back',
            frameWidth: 376,
            frameHeight: 410,
            frames: 29
        }
    },
    sounds: 'assets/sounds/kricketune-cry.ogg',
    held_item: null,
    stat_total: 384,
    levitates: false
});

//Bandaid for boss pokemons

let erika_kricketune = new Pokemon({
    name: "Kricketune",
    description: "It signals its emotions with its melodies. Scientists are studying these melodic patterns.",
    types: ['bug'],
    height: 1,
    weight: 25.5,
    moves: [deepClone(all_moves.giga_drain), deepClone(all_moves.night_slash), deepClone(all_moves.x_scissor), deepClone(all_moves.slash)],
    learnable_moves: [{ at_level: 20, move: { ...all_moves.x_scissor } }],
    abilities: ['Swarm'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 402,
    evolution: null,
    hp: {
        base: 77,
        max: 77,
        current: 77
    },
    xp: {
        base: 134,
        total: 0
    },
    atk: {
        base: 85,
        current: 85,
        effective: 85,
        stage: 0
    },
    def: {
        base: 51,
        current: 51,
        effective: 51,
        stage: 0
    },
    sp_atk: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    sp_def: {
        base: 51,
        current: 51,
        effective: 51,
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
            path: base_path + 'kricketune-front.png',
            key: 'kricketune-front',
            frameWidth: 283,
            frameHeight: 310,
            frames: 29
        },
        back: {
            path: base_path + 'kricketune-back.png',
            key: 'kricketune-back',
            frameWidth: 376,
            frameHeight: 410,
            frames: 29
        }
    },
    sounds: 'assets/sounds/kricketune-cry.ogg',
    held_item: null,
    stat_total: 384,
    levitates: false
});

let beautifly = new Pokemon({
    name: "Beautifly",
    description: "	When flower fields bloom, it flits around, collecting pollen. Despite its appearance, it is savage.",
    types: ['bug', 'flying'],
    height: 1,
    weight: 28.4,
    moves: [deepClone(all_moves.gust), deepClone(all_moves.bug_bite), deepClone(all_moves.string_shot), deepClone(all_moves.poison_sting)],
    learnable_moves: [{ at_level: 12, move: { ...all_moves.absorb } }, { at_level: 15, move: { ...all_moves.stun_spore } }, { at_level: 19, move: { ...all_moves.air_cutter } }, { at_level: 15, move: { ...all_moves.mega_drain } }],
    abilities: ['Swarm'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 267,
    evolution: null,
    hp: {
        base: 60,
        max: 60,
        current: 60
    },
    xp: {
        base: 178,
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
        base: 100,
        current: 100,
        effective: 100,
        stage: 0
    },
    sp_def: {
        base: 50,
        current: 50,
        effective: 50,
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
            path: base_path + 'beautifly-front.png',
            key: 'beautifly-front',
            frameWidth: 296,
            frameHeight: 310,
            frames: 50
        },
        back: {
            path: base_path + 'beautifly-back.png',
            key: 'beautifly-back',
            frameWidth: 384,
            frameHeight: 410,
            frames: 50
        }
    },
    sounds: 'assets/sounds/beautifly-cry.ogg',
    held_item: null,
    stat_total: 384,
    levitates: false
});
let deerling = new Pokemon({
    name: "Deerling",
    description: "Their coloring changes according to the seasons and can be slightly affected by the temperature and humidity as well.",
    types: ['normal', 'grass'],
    height: 0.6,
    weight: 19.5,
    moves: [deepClone(all_moves.tackle), deepClone(all_moves.growl), deepClone(all_moves.double_kick), deepClone(all_moves.sand_attack)],
    learnable_moves: [{ at_level: 12, move: { ...all_moves.mega_drain } }, { at_level: 15, move: { ...all_moves.bullet_seed } }, { at_level: 18, move: { ...all_moves.take_down } }, { at_level: 20, move: { ...all_moves.zen_headbutt } }],
    abilities: ['Sap Sipper'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 190,
    pokemon_number: 585,
    evolution: null,
    hp: {
        base: 60,
        max: 60,
        current: 60
    },
    xp: {
        base: 67,
        total: 0
    },
    atk: {
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    sp_atk: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    sp_def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    speed: {
        base: 75,
        current: 75,
        effective: 75,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'deerling-front.png',
            key: 'deerling-front',
            frameWidth: 227,
            frameHeight: 310,
            frames: 38
        },
        back: {
            path: base_path + 'deerling-back.png',
            key: 'deerling-back',
            frameWidth: 296,
            frameHeight: 410,
            frames: 38
        }
    },
    sounds: 'assets/sounds/deerling-cry.ogg',
    held_item: null,
    stat_total: 335,
    levitates: false
});
let foongus = new Pokemon({
    name: "Foongus",
    description: "This Pokémon prefers damp places. It spurts out poison spores to repel approaching enemies.",
    types: ['grass', 'poison'],
    height: 0.2,
    weight: 1,
    moves: [deepClone(all_moves.absorb), deepClone(all_moves.astonish), deepClone(all_moves.growth), deepClone(all_moves.stun_spore)],
    learnable_moves: [{ at_level: 12, move: { ...all_moves.mega_drain } }, { at_level: 15, move: { ...all_moves.synthesis } }],
    abilities: ['Effect Spore'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 190,
    pokemon_number: 590,
    evolution: null,
    hp: {
        base: 69,
        max: 69,
        current: 69
    },
    xp: {
        base: 59,
        total: 0
    },
    atk: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    def: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    sp_atk: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    sp_def: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    speed: {
        base: 15,
        current: 15,
        effective: 15,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'foongus-front.png',
            key: 'foongus-front',
            frameWidth: 300,
            frameHeight: 310,
            frames: 25
        },
        back: {
            path: base_path + 'foongus-back.png',
            key: 'foongus-back',
            frameWidth: 396,
            frameHeight: 410,
            frames: 25
        }
    },
    sounds: 'assets/sounds/foongus-cry.ogg',
    held_item: null,
    stat_total: 294,
    levitates: false
});

let tirtouga = new Pokemon({
    name: "Tirtouga",
    description: "Tirtouga is considered to be the ancestor of many turtle Pokémon. It was restored to life from a fossil.",
    types: ['water', 'rock'],
    height: 0.7,
    weight: 16.5,
    moves: [deepClone(all_moves.water_gun), deepClone(all_moves.withdraw), deepClone(all_moves.protect), deepClone(all_moves.aqua_jet)],
    learnable_moves: [{ at_level: 12, move: { ...all_moves.rock_slide } }, { at_level: 15, move: { ...all_moves.bite } }],
    abilities: ['Sturdy'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 45,
    pokemon_number: 564,
    evolution: null,
    hp: {
        base: 54,
        max: 54,
        current: 54
    },
    xp: {
        base: 71,
        total: 0
    },
    atk: {
        base: 78,
        current: 78,
        effective: 78,
        stage: 0
    },
    def: {
        base: 103,
        current: 103,
        effective: 103,
        stage: 0
    },
    sp_atk: {
        base: 53,
        current: 53,
        effective: 53,
        stage: 0
    },
    sp_def: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    speed: {
        base: 22,
        current: 22,
        effective: 22,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'tirtouga-front.png',
            key: 'tirtouga-front',
            frameWidth: 411,
            frameHeight: 148,
            frames: 59
        },
        back: {
            path: base_path + 'tirtouga-back.png',
            key: 'tirtouga-back',
            frameWidth: 1331,
            frameHeight: 410,
            frames: 40
        }
    },
    sounds: 'assets/sounds/tirtouga-cry.ogg',
    held_item: null,
    stat_total: 355,
    levitates: false
});

let omanyte = new Pokemon({
    name: "Omanyte",
    description: "This Pokémon is a member of an ancient, extinct species. Omanyte paddles through water with its 10 tentacles, looking like it’s just drifting along.",
    types: ['water', 'rock'],
    height: 0.4,
    weight: 7.5,
    moves: [deepClone(all_moves.water_gun), deepClone(all_moves.withdraw), deepClone(all_moves.protect), deepClone(all_moves.aqua_jet)],
    learnable_moves: [{ at_level: 12, move: { ...all_moves.rock_slide } }, { at_level: 15, move: { ...all_moves.mud_shot } }],
    abilities: ['Shell Armor'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 45,
    pokemon_number: 138,
    evolution: null,
    hp: {
        base: 35,
        max: 35,
        current: 35
    },
    xp: {
        base: 71,
        total: 0
    },
    atk: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    def: {
        base: 100,
        current: 100,
        effective: 100,
        stage: 0
    },
    sp_atk: {
        base: 90,
        current: 90,
        effective: 90,
        stage: 0
    },
    sp_def: {
        base: 55,
        current: 55,
        effective: 55,
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
            path: base_path + 'omanyte-front.png',
            key: 'omanyte-front',
            frameWidth: 314,
            frameHeight: 310,
            frames: 50
        },
        back: {
            path: base_path + 'omanyte-back.png',
            key: 'omanyte-back',
            frameWidth: 416,
            frameHeight: 410,
            frames: 50
        }
    },
    sounds: 'assets/sounds/omanyte-cry.ogg',
    held_item: null,
    stat_total: 355,
    levitates: false
});

let krabby = new Pokemon({
    name: "Krabby",
    description: "It lives in burrows dug on sandy beaches. Its pincers fully grow back if they are lost in battle.",
    types: ['water'],
    height: 0.4,
    weight: 6.5,
    moves: [deepClone(all_moves.leer), deepClone(all_moves.water_gun), deepClone(all_moves.harden), deepClone(all_moves.metal_claw)],
    learnable_moves: [{ at_level: 12, move: { ...all_moves.mud_shot } }, { at_level: 15, move: { ...all_moves.protect } }, { at_level: 20, move: { ...all_moves.bubble_beam } }],
    abilities: ['Shell Armor'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 225,
    pokemon_number: 564,
    evolution: null,
    hp: {
        base: 30,
        max: 30,
        current: 30
    },
    xp: {
        base: 65,
        total: 0
    },
    atk: {
        base: 105,
        current: 105,
        effective: 105,
        stage: 0
    },
    def: {
        base: 90,
        current: 90,
        effective: 90,
        stage: 0
    },
    sp_atk: {
        base: 25,
        current: 25,
        effective: 25,
        stage: 0
    },
    sp_def: {
        base: 25,
        current: 25,
        effective: 25,
        stage: 0
    },
    speed: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'krabby-front.png',
            key: 'krabby-front',
            frameWidth: 387,
            frameHeight: 310,
            frames: 25
        },
        back: {
            path: base_path + 'krabby-back.png',
            key: 'krabby-back',
            frameWidth: 517,
            frameHeight: 410,
            frames: 25
        }
    },
    sounds: 'assets/sounds/krabby-cry.ogg',
    held_item: null,
    stat_total: 355,
    levitates: false
});

let ducklett = new Pokemon({
    name: "Ducklett",
    description: "They are better at swimming than flying, and they happily eat their favorite food, peat moss, as they dive underwater.",
    types: ['water', 'flying'],
    height: 0.5,
    weight: 5.5,
    moves: [deepClone(all_moves.water_gun)],
    learnable_moves: [{ at_level: 9, move: { ...all_moves.wing_attack } }, { at_level: 13, move: { ...all_moves.water_pulse } }, { at_level: 15, move: { ...all_moves.aerial_ace } }, { at_level: 19, move: { ...all_moves.bubble_beam } }],
    abilities: ['Keen Eye'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 190,
    pokemon_number: 580,
    evolution: null,
    hp: {
        base: 62,
        max: 62,
        current: 62
    },
    xp: {
        base: 61,
        total: 0
    },
    atk: {
        base: 44,
        current: 44,
        effective: 44,
        stage: 0
    },
    def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    sp_atk: {
        base: 44,
        current: 44,
        effective: 44,
        stage: 0
    },
    sp_def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    speed: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'ducklett-front.png',
            key: 'ducklett-front',
            frameWidth: 218,
            frameHeight: 310,
            frames: 30
        },
        back: {
            path: base_path + 'ducklett-back.png',
            key: 'ducklett-back',
            frameWidth: 284,
            frameHeight: 410,
            frames: 30
        }
    },
    sounds: 'assets/sounds/ducklett-cry.ogg',
    held_item: null,
    stat_total: 305,
    levitates: false
});
let cranidos = new Pokemon({
    name: "Cranidos",
    description: "An incredibly rare sight. They duel each other by ramming their heads together, and the resulting sound echoes throughout the area like the pealing of a bell.",
    types: ['rock'],
    height: 0.9,
    weight: 31.5,
    moves: [deepClone(all_moves.headbutt), deepClone(all_moves.leer), deepClone(all_moves.focus_energy), deepClone(all_moves.stomp)],
    learnable_moves: [{ at_level: 10, move: { ...all_moves.rock_smash } }, { at_level: 15, move: { ...all_moves.take_down } }, { at_level: 18, move: { ...all_moves.zen_headbutt } }, , { at_level: 20, move: { ...all_moves.head_smash } }],
    abilities: ['Rock Head'],
    growth_rate: 'Erratic',
    level: 5,
    catch_rate: 45,
    pokemon_number: 408,
    evolution: null,
    hp: {
        base: 67,
        max: 67,
        current: 67
    },
    xp: {
        base: 70,
        total: 0
    },
    atk: {
        base: 125,
        current: 125,
        effective: 125,
        stage: 0
    },
    def: {
        base: 40,
        current: 40,
        effective: 40,
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
        base: 58,
        current: 58,
        effective: 58,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'cranidos-front.png',
            key: 'cranidos-front',
            frameWidth: 200,
            frameHeight: 310,
            frames: 25
        },
        back: {
            path: base_path + 'cranidos-back.png',
            key: 'cranidos-back',
            frameWidth: 270,
            frameHeight: 410,
            frames: 25
        }
    },
    sounds: 'assets/sounds/cranidos-cry.ogg',
    held_item: null,
    stat_total: 350,
    levitates: false
});
let onix = new Pokemon({
    name: "Onix",
    description: "When it travels underground, it causes rumbling and tremors. It can move at 50 mph.",
    types: ['rock', 'ground'],
    height: 8.8,
    weight: 210,
    moves: [deepClone(all_moves.harden), deepClone(all_moves.tackle), deepClone(all_moves.rock_trhow), deepClone(all_moves.rock_polish)],
    learnable_moves: [{ at_level: 12, move: { ...all_moves.dragon_breath } }, { at_level: 15, move: { ...all_moves.rock_slide } }, { at_level: 20, move: { ...all_moves.head_smash } }],
    abilities: ['Rock Head'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 45,
    pokemon_number: 95,
    evolution: null,
    hp: {
        base: 35,
        max: 35,
        current: 35
    },
    xp: {
        base: 77,
        total: 0
    },
    atk: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    def: {
        base: 160,
        current: 160,
        effective: 160,
        stage: 0
    },
    sp_atk: {
        base: 30,
        current: 30,
        effective: 30,
        stage: 0
    },
    sp_def: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    speed: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'onix-front.png',
            key: 'onix-front',
            frameWidth: 248,
            frameHeight: 310,
            frames: 39
        },
        back: {
            path: base_path + 'onix-back.png',
            key: 'onix-back',
            frameWidth: 636,
            frameHeight: 810,
            frames: 39
        }
    },
    sounds: 'assets/sounds/onix-cry.ogg',
    held_item: null,
    stat_total: 385,
    levitates: false
});

let scolipede = new Pokemon({
    name: "Scolipede",
    description: "Scolipede engage in fierce territorial battles with Centiskorch. At the end of one of these battles, the victor makes a meal of the loser.",
    types: ['bug', 'poison'],
    height: 2.5,
    weight: 200.5,
    moves: [deepClone(all_moves.toxic), deepClone(all_moves.rock_climb), deepClone(all_moves.mega_horn), deepClone(all_moves.rock_slide)],
    learnable_moves: [],
    abilities: ['Swarm'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 545,
    evolution: null,
    hp: {
        base: 60,
        max: 60,
        current: 60
    },
    xp: {
        base: 218,
        total: 0
    },
    atk: {
        base: 100,
        current: 100,
        effective: 100,
        stage: 0
    },
    def: {
        base: 89,
        current: 89,
        effective: 89,
        stage: 0
    },
    sp_atk: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    sp_def: {
        base: 69,
        current: 69,
        effective: 69,
        stage: 0
    },
    speed: {
        base: 112,
        current: 112,
        effective: 112,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'scolipede-front.png',
            key: 'scolipede-front',
            frameWidth: 213,
            frameHeight: 310,
            frames: 38
        },
        back: {
            path: base_path + 'scolipede-back.png',
            key: 'scolipede-back',
            frameWidth: 289,
            frameHeight: 810,
            frames: 38
        }
    },
    sounds: 'assets/sounds/scolipede-cry.ogg',
    held_item: null,
    stat_total: 485,
    levitates: false
});


let whirlipede = new Pokemon({
    name: "Whirlipede",
    description: "Whirlipede protects itself with a sturdy shell and poisonous spikes while it stores up the energy it’ll need for evolution.",
    types: ['bug', 'poison'],
    height: 1.2,
    weight: 58.5,
    moves: [deepClone(all_moves.toxic), deepClone(all_moves.rock_climb), deepClone(all_moves.mega_horn), deepClone(all_moves.rock_slide)],
    learnable_moves: [{ at_level: 20, move: { ...all_moves.bug_bite } }, { at_level: 32, move: { ...all_moves.take_down } }],
    abilities: ['Swarm'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 120,
    pokemon_number: 544,
    evolution: null,
    hp: {
        base: 40,
        max: 40,
        current: 40
    },
    xp: {
        base: 218,
        total: 0
    },
    atk: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    def: {
        base: 99,
        current: 99,
        effective: 99,
        stage: 0
    },
    sp_atk: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    sp_def: {
        base: 79,
        current: 79,
        effective: 79,
        stage: 0
    },
    speed: {
        base: 47,
        current: 47,
        effective: 47,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'whirlipede-front.png',
            key: 'whirlipede-front',
            frameWidth: 443,
            frameHeight: 310,
            frames: 50
        },
        back: {
            path: base_path + 'whirlipede-back.png',
            key: 'whirlipede-back',
            frameWidth: 595,
            frameHeight: 410,
            frames: 50
        }
    },
    sounds: 'assets/sounds/whirlipede-cry.ogg',
    held_item: null,
    stat_total: 360,
    levitates: false
});

let frillish = new Pokemon({
    name: "Frillish",
    description: "Using the invisible poison spikes on its veillike arms and legs, it paralyzes its enemies and causes them to drown.",
    types: ['water', 'ghost'],
    height: 1.2,
    weight: 33,
    moves: [deepClone(all_moves.absorb), deepClone(all_moves.poison_sting), deepClone(all_moves.water_gun), deepClone(all_moves.night_slash)],
    learnable_moves: [{ at_level: 12, move: { ...all_moves.water_pulse } }, { at_level: 20, move: { ...all_moves.hex } }, { at_level: 24, move: { ...all_moves.brine } }],
    abilities: ['Water Absorb'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 190,
    pokemon_number: 592,
    evolution: null,
    hp: {
        base: 55,
        max: 55,
        current: 55
    },
    xp: {
        base: 67,
        total: 0
    },
    atk: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    sp_atk: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    sp_def: {
        base: 85,
        current: 85,
        effective: 85,
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
            path: base_path + 'frillish-front.png',
            key: 'frillish-front',
            frameWidth: 276,
            frameHeight: 310,
            frames: 38
        },
        back: {
            path: base_path + 'frillish-back.png',
            key: 'frillish-back',
            frameWidth: 365,
            frameHeight: 410,
            frames: 38
        }
    },
    sounds: 'assets/sounds/frillish-cry.ogg',
    held_item: null,
    stat_total: 335,
    levitates: true
});

let heracross = new Pokemon({
    name: "Heracross",
    description: "When it travels underground, it causes rumbling and tremors. It can move at 50 mph.",
    types: ['bug', 'fighting'],
    height: 1.5,
    weight: 54,
    moves: [deepClone(all_moves.brick_break), deepClone(all_moves.aerial_ace), deepClone(all_moves.bug_bite), deepClone(all_moves.night_slash)],
    learnable_moves: [],
    abilities: ['Guts'],
    growth_rate: 'Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 214,
    evolution: null,
    hp: {
        base: 80,
        max: 80,
        current: 80
    },
    xp: {
        base: 175,
        total: 0
    },
    atk: {
        base: 125,
        current: 125,
        effective: 125,
        stage: 0
    },
    def: {
        base: 75,
        current: 75,
        effective: 75,
        stage: 0
    },
    sp_atk: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    sp_def: {
        base: 95,
        current: 95,
        effective: 95,
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
            path: base_path + 'heracross-front.png',
            key: 'heracross-front',
            frameWidth: 350,
            frameHeight: 310,
            frames: 38
        },
        back: {
            path: base_path + 'heracross-back.png',
            key: 'heracross-back',
            frameWidth: 456,
            frameHeight: 810,
            frames: 38
        }
    },
    sounds: 'assets/sounds/heracross-cry.ogg',
    held_item: null,
    stat_total: 500,
    levitates: false
});


let squirtle = new Pokemon({
    name: "Squirtle",
    description: "It hides in its shell to protect itself, then strikes back with spouts of water at every opportunity.",
    types: ['water'],
    height: 0.5,
    weight: 9,
    moves: [],
    learnable_moves: [],
    abilities: ['Torrent'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 7,
    hp: {
        base: 44,
        max: 44,
        current: 44
    },
    xp: {
        base: 63,
        total: 0
    },
    atk: {
        base: 48,
        current: 48,
        effective: 48,
        stage: 0
    },
    def: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    sp_atk: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    sp_def: {
        base: 64,
        current: 64,
        effective: 64,
        stage: 0
    },
    speed: {
        base: 43,
        current: 43,
        effective: 43,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'squirtle-front.png',
            key: 'squirtle-front',
            frameWidth: 293,
            frameHeight: 310,
            frames: 19
        },
        back: {
            path: base_path + 'squirtle-back.png',
            key: 'squirtle-back',
            frameWidth: 389,
            frameHeight: 410,
            frames: 19
        }
    },
    sounds: 'assets/sounds/squirtle-cry.ogg',
    held_item: null,
    stat_total: 314,
    levitates: false




});

let carvanha = new Pokemon({
    name: "Carvanha",
    description: "It won’t attack while it’s alone—not even if it spots prey. Instead, it waits for other Carvanha to join it, and then the Pokémon attack as a group.",
    types: ['water', 'dark'],
    height: 0.8,
    weight: 20.8,
    moves: [deepClone(all_moves.aqua_jet), deepClone(all_moves.leer), deepClone(all_moves.poison_fang)],
    learnable_moves: [{ at_level: 8, move: { ...all_moves.focus_energy } }, { at_level: 16, move: { ...all_moves.bite } }, { at_level: 20, move: { ...all_moves.ice_fang } }],
    abilities: ['Torrent'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 318,
    hp: {
        base: 45,
        max: 45,
        current: 45
    },
    xp: {
        base: 61,
        total: 0
    },
    atk: {
        base: 90,
        current: 90,
        effective: 90,
        stage: 0
    },
    def: {
        base: 20,
        current: 20,
        effective: 20,
        stage: 0
    },
    sp_atk: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    sp_def: {
        base: 20,
        current: 20,
        effective: 20,
        stage: 0
    },
    speed: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'carvanha-front.png',
            key: 'carvanha-front',
            frameWidth: 249,
            frameHeight: 310,
            frames: 50
        },
        back: {
            path: base_path + 'carvanha-back.png',
            key: 'carvanha-back',
            frameWidth: 328,
            frameHeight: 410,
            frames: 50
        }
    },
    sounds: 'assets/sounds/carvanha-cry.ogg',
    held_item: null,
    stat_total: 314,
    levitates: false

});

let silicobra = new Pokemon({
    name: "Silicobra",
    description: "Silicobra’s large nostrils are specialized for spraying sand, so this Pokémon is not very good at telling apart different smells.",
    types: ['ground'],
    height: 2.2,
    weight: 7.6,
    moves: [deepClone(all_moves.sand_attack), deepClone(all_moves.bite), deepClone(all_moves.minimize)],
    learnable_moves: [{ at_level: 10, move: { ...all_moves.brutal_swing } }, { at_level: 15, move: { ...all_moves.bulldoze } }, { at_level: 20, move: { ...all_moves.headbutt } }],
    abilities: ['Shed Skin'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 255,
    pokemon_number: 843,
    hp: {
        base: 52,
        max: 52,
        current: 52
    },
    xp: {
        base: 63,
        total: 0
    },
    atk: {
        base: 57,
        current: 57,
        effective: 57,
        stage: 0
    },
    def: {
        base: 75,
        current: 75,
        effective: 75,
        stage: 0
    },
    sp_atk: {
        base: 35,
        current: 35,
        effective: 35,
        stage: 0
    },
    sp_def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    speed: {
        base: 46,
        current: 46,
        effective: 46,
        stage: 0
    },
    evolution: {

    },
    images: {
        front: {
            path: base_path + 'silicobra-front.png',
            key: 'silicobra-front',
            frameWidth: 294,
            frameHeight: 298,
            frames: 50
        },
        back: {
            path: base_path + 'silicobra-back.png',
            key: 'silicobra-back',
            frameWidth: 331,
            frameHeight: 306,
            frames: 50
        }
    },
    sounds: 'assets/sounds/silicobra-cry.ogg',
    held_item: null,
    stat_total: 315,
    levitates: false

});

let cufant = new Pokemon({
    name: "Cufant",
    description: "Cufant can lift loads weighing five tons. In the mornings, it heads into caves with its herd, in search of the ore on which these Pokémon feed.",
    types: ['steel'],
    height: 1.2,
    weight: 100,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.tackle), deepClone(all_moves.rock_trhow)],
    learnable_moves: [{ at_level: 10, move: { ...all_moves.rock_smash } }, { at_level: 15, move: { ...all_moves.bulldoze } }, { at_level: 20, move: { ...all_moves.stomp } }],
    abilities: ['Sheer Force'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 255,
    pokemon_number: 878,
    hp: {
        base: 72,
        max: 72,
        current: 72
    },
    xp: {
        base: 66,
        total: 0
    },
    atk: {
        base: 80,
        current: 80,
        effective: 80,
        stage: 0
    },
    def: {
        base: 49,
        current: 49,
        effective: 49,
        stage: 0
    },
    sp_atk: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    sp_def: {
        base: 49,
        current: 49,
        effective: 49,
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
            path: base_path + 'cufant-front.png',
            key: 'cufant-front',
            frameWidth: 491,
            frameHeight: 433,
            frames: 60
        },
        back: {
            path: base_path + 'cufant-back.png',
            key: 'cufant-back',
            frameWidth: 430,
            frameHeight: 403,
            frames: 59
        }
    },
    sounds: 'assets/sounds/cufant-cry.ogg',
    held_item: null,
    stat_total: 330,
    levitates: false

});

let cubchoo = new Pokemon({
    name: "Cubchoo",
    description: "When Cubchoo starts sneezing, watch out! If it spatters you with its frosty snot, you’ll get frostbite.",
    types: ['ice'],
    height: 0.5,
    weight: 8.5,
    moves: [deepClone(all_moves.growl), deepClone(all_moves.powder_snow), deepClone(all_moves.fury_swipes)],
    learnable_moves: [{ at_level: 18, move: { ...all_moves.frost_breath } }, { at_level: 9, move: { ...all_moves.icy_wind } }, { at_level: 15, move: { ...all_moves.brine } }, { at_level: 21, move: { ...all_moves.slash } }],
    abilities: ['Slush Rush'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 120,
    pokemon_number: 613,
    hp: {
        base: 55,
        max: 55,
        current: 55
    },
    xp: {
        base: 61,
        total: 0
    },
    atk: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    def: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    sp_atk: {
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    sp_def: {
        base: 40,
        current: 40,
        effective: 40,
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
            path: base_path + 'cubchoo-front.png',
            key: 'cubchoo-front',
            frameWidth: 275,
            frameHeight: 310,
            frames: 32
        },
        back: {
            path: base_path + 'cubchoo-back.png',
            key: 'cubchoo-back',
            frameWidth: 363,
            frameHeight: 410,
            frames: 32
        }
    },
    sounds: 'assets/sounds/cubchoo-cry.ogg',
    held_item: null,
    stat_total: 305,
    levitates: false

});

let archen = new Pokemon({
    name: "Archen",
    description: "Archen is said to be the ancestor of bird Pokémon. It lived in treetops, eating berries and bug Pokémon.",
    types: ['rock', 'flying'],
    height: 0.5,
    weight: 9.5,
    moves: [deepClone(all_moves.leer), deepClone(all_moves.quick_attack
    ), deepClone(all_moves.rock_trhow), deepClone(all_moves.wing_attack)],
    learnable_moves: [{ at_level: 9, move: { ...all_moves.dragon_breath } }, { at_level: 15, move: { ...all_moves.bulldoze } }],
    abilities: ['Defeatist'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 45,
    pokemon_number: 566,
    hp: {
        base: 55,
        max: 55,
        current: 55
    },
    xp: {
        base: 71,
        total: 0
    },
    atk: {
        base: 112,
        current: 112,
        effective: 112,
        stage: 0
    },
    def: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    sp_atk: {
        base: 74,
        current: 74,
        effective: 74,
        stage: 0
    },
    sp_def: {
        base: 45,
        current: 45,
        effective: 45,
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
            path: base_path + 'archen-front.png',
            key: 'archen-front',
            frameWidth: 649,
            frameHeight: 310,
            frames: 38
        },
        back: {
            path: base_path + 'archen-back.png',
            key: 'archen-back',
            frameWidth: 862,
            frameHeight: 410,
            frames: 38
        }
    },
    sounds: 'assets/sounds/archen-cry.ogg',
    held_item: null,
    stat_total: 401,
    levitates: false

});

let nidorino = new Pokemon({
    name: "Nidorino",
    description: "It has a violent disposition and stabs foes with its horn, which oozes venom upon impact.",
    types: ['poison'],
    height: 0.9,
    weight: 19.5,
    moves: [deepClone(all_moves.leer), deepClone(all_moves.poison_sting
    ), deepClone(all_moves.peck)],
    learnable_moves: [{ at_level: 10, move: { ...all_moves.focus_energy } }, { at_level: 15, move: { ...all_moves.fury_swipes } }],
    abilities: ['Poison Point'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 120,
    pokemon_number: 33,
    hp: {
        base: 61,
        max: 61,
        current: 61
    },
    xp: {
        base: 128,
        total: 0
    },
    atk: {
        base: 72,
        current: 72,
        effective: 72,
        stage: 0
    },
    def: {
        base: 57,
        current: 57,
        effective: 57,
        stage: 0
    },
    sp_atk: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    sp_def: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    speed: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    evolution: null,
    images: {
        front: {
            path: base_path + 'nidorino-front.png',
            key: 'nidorino-front',
            frameWidth: 353,
            frameHeight: 310,
            frames: 32
        },
        back: {
            path: base_path + 'nidorino-back.png',
            key: 'nidorino-back',
            frameWidth: 469,
            frameHeight: 410,
            frames: 32
        }
    },
    sounds: 'assets/sounds/nidorino-cry.ogg',
    held_item: null,
    stat_total: 365,
    levitates: false

});

let nidoran = new Pokemon({
    name: "Nidoran",
    description: "It scans its surroundings by raising its ears out of the grass. Its toxic horn is for protection.",
    types: ['poison'],
    height: 0.5,
    weight: 9,
    moves: [deepClone(all_moves.leer), deepClone(all_moves.poison_sting
    ), deepClone(all_moves.peck)],
    learnable_moves: [{ at_level: 10, move: { ...all_moves.focus_energy } }, { at_level: 15, move: { ...all_moves.fury_swipes } }],
    abilities: ['Poison Point'],
    growth_rate: 'Medium Slow',
    level: 5,
    catch_rate: 235,
    pokemon_number: 32,
    evolution: { at_level: 16, into: deepClone(nidorino) },
    hp: {
        base: 46,
        max: 46,
        current: 46
    },
    xp: {
        base: 55,
        total: 0
    },
    atk: {
        base: 57,
        current: 57,
        effective: 57,
        stage: 0
    },
    def: {
        base: 40,
        current: 40,
        effective: 40,
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
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'nidoran-front.png',
            key: 'nidoran-front',
            frameWidth: 313,
            frameHeight: 310,
            frames: 32
        },
        back: {
            path: base_path + 'nidoran-back.png',
            key: 'nidoran-back',
            frameWidth: 405,
            frameHeight: 410,
            frames: 32
        }
    },
    sounds: 'assets/sounds/nidoran-cry.ogg',
    held_item: null,
    stat_total: 273,
    levitates: false

});


let scyther = new Pokemon({
    name: "Scyther",
    description: "It scans its surroundings by raising its ears out of the grass. Its toxic horn is for protection.",
    types: ['bug', 'flying'],
    height: 1.5,
    weight: 56,
    moves: [deepClone(all_moves.leer), deepClone(all_moves.quick_attack
    ), deepClone(all_moves.fury_swipes)],
    learnable_moves: [{ at_level: 12, move: { ...all_moves.dobule_team } }, { at_level: 12, move: { ...all_moves.wing_attack } }],
    abilities: ['Swarm'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 45,
    pokemon_number: 123,
    evolution: { at_level: 16, into: deepClone(nidorino) },
    hp: {
        base: 70,
        max: 70,
        current: 70
    },
    xp: {
        base: 100,
        total: 0
    },
    atk: {
        base: 110,
        current: 110,
        effective: 110,
        stage: 0
    },
    def: {
        base: 80,
        current: 80,
        effective: 80,
        stage: 0
    },
    sp_atk: {
        base: 55,
        current: 55,
        effective: 55,
        stage: 0
    },
    sp_def: {
        base: 80,
        current: 80,
        effective: 80,
        stage: 0
    },
    speed: {
        base: 105,
        current: 105,
        effective: 105,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'scyther-front.png',
            key: 'scyther-front',
            frameWidth: 357,
            frameHeight: 310,
            frames: 35
        },
        back: {
            path: base_path + 'scyther-back.png',
            key: 'scyther-back',
            frameWidth: 465,
            frameHeight: 410,
            frames: 35
        }
    },
    sounds: 'assets/sounds/scyther-cry.ogg',
    held_item: null,
    stat_total: 500,
    levitates: false

});

let crobat = new Pokemon({
    name: "Crobat",
    description: "Its hind limbs have become another set of wings. Crobat expertly maneuvers its four wings to dart in exquisite fashion through even the most confined caves without losing any speed.",
    types: ['poison', 'flying'],
    height: 1.8,
    weight: 75,
    moves: [deepClone(all_moves.toxic), deepClone(all_moves.astonish
    ), deepClone(all_moves.absorb), deepClone(all_moves.supersonic)],
    learnable_moves: [{ at_level: 15, move: { ...all_moves.poison_fang } }, { at_level: 18, move: { ...all_moves.bite } }, { at_level: 20, move: { ...all_moves.air_cutter } }],
    abilities: ['Inner Focus'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 90,
    pokemon_number: 169,
    evolution: null,
    hp: {
        base: 85,
        max: 85,
        current: 85
    },
    xp: {
        base: 241,
        total: 0
    },
    atk: {
        base: 90,
        current: 90,
        effective: 90,
        stage: 0
    },
    def: {
        base: 80,
        current: 80,
        effective: 80,
        stage: 0
    },
    sp_atk: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    sp_def: {
        base: 80,
        current: 80,
        effective: 80,
        stage: 0
    },
    speed: {
        base: 130,
        current: 130,
        effective: 130,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'crobat-front.png',
            key: 'crobat-front',
            frameWidth: 779,
            frameHeight: 610,
            frames: 18
        },
        back: {
            path: base_path + 'crobat-back.png',
            key: 'crobat-back',
            frameWidth: 1095,
            frameHeight: 810,
            frames: 18
        }
    },
    sounds: 'assets/sounds/crobat-cry.ogg',
    held_item: null,
    stat_total: 535,
    levitates: true

});

let houndoom = new Pokemon({
    name: "Houndoom",
    description: "Upon hearing its eerie howls, other Pokémon get the shivers and head straight back to their nests.",
    types: ['dark', 'fire'],
    height: 1.4,
    weight: 35,
    moves: [deepClone(all_moves.howl), deepClone(all_moves.leer
    ), deepClone(all_moves.ember),],
    learnable_moves: [{ at_level: 15, move: { ...all_moves.bite } }, { at_level: 18, move: { ...all_moves.bite } }, { at_level: 20, move: { ...all_moves.air_cutter } }],
    abilities: ['Intimidate'],
    growth_rate: 'Slow',
    level: 5,
    catch_rate: 45,
    pokemon_number: 229,
    evolution: null,
    hp: {
        base: 75,
        max: 75,
        current: 75
    },
    xp: {
        base: 175,
        total: 0
    },
    atk: {
        base: 90,
        current: 90,
        effective: 90,
        stage: 0
    },
    def: {
        base: 50,
        current: 50,
        effective: 50,
        stage: 0
    },
    sp_atk: {
        base: 110,
        current: 110,
        effective: 110,
        stage: 0
    },
    sp_def: {
        base: 80,
        current: 80,
        effective: 80,
        stage: 0
    },
    speed: {
        base: 95,
        current: 95,
        effective: 95,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'houndoom-front.png',
            key: 'houndoom-front',
            frameWidth: 204,
            frameHeight: 310,
            frames: 27
        },
        back: {
            path: base_path + 'houndoom-back.png',
            key: 'houndoom-back',
            frameWidth: 259,
            frameHeight: 410,
            frames: 27
        }
    },
    sounds: 'assets/sounds/houndoom-cry.ogg',
    held_item: null,
    stat_total: 500,
    levitates: false

});


let dusclops = new Pokemon({
    name: "Dusclops",
    description: "	There are rumors that peeking inside its bandage-wrapped body will cause one to get pulled in through the gaps between the bandages, never to return. I’ve been too scared to verify.",
    types: ['ghost'],
    height: 1.6,
    weight: 30.6,
    moves: [deepClone(all_moves.astonish), deepClone(all_moves.night_shade
    ), deepClone(all_moves.confuse_ray),],
    learnable_moves: [{ at_level: 20, move: { ...all_moves.hex } }],
    abilities: ['Pressure'],
    growth_rate: 'Fast',
    level: 5,
    catch_rate: 90,
    pokemon_number: 356,
    evolution: null,
    hp: {
        base: 40,
        max: 40,
        current: 40
    },
    xp: {
        base: 159,
        total: 0
    },
    atk: {
        base: 70,
        current: 70,
        effective: 70,
        stage: 0
    },
    def: {
        base: 130,
        current: 130,
        effective: 130,
        stage: 0
    },
    sp_atk: {
        base: 60,
        current: 60,
        effective: 60,
        stage: 0
    },
    sp_def: {
        base: 130,
        current: 130,
        effective: 130,
        stage: 0
    },
    speed: {
        base: 25,
        current: 25,
        effective: 25,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'dusclops-front.png',
            key: 'dusclops-front',
            frameWidth: 380,
            frameHeight: 310,
            frames: 38
        },
        back: {
            path: base_path + 'dusclops-back.png',
            key: 'dusclops-back',
            frameWidth: 508,
            frameHeight: 410,
            frames: 38
        }
    },
    sounds: 'assets/sounds/dusclops-cry.ogg',
    held_item: null,
    stat_total: 455,
    levitates: false

});

let quagsire = new Pokemon({
    name: "Quagsire",
    description: "A dim-witted Pokémon. It doesn’t care if it bumps its head into boats or rocks while swimming.",
    types: ['water', 'ground'],
    height: 1.4,
    weight: 75,
    moves: [deepClone(all_moves.tail_whip), deepClone(all_moves.water_gun
    ), deepClone(all_moves.mud_shot),],
    learnable_moves: [{ at_level: 15, move: { ...all_moves.water_pulse } }, { at_level: 20, move: { ...all_moves.aqua_tail } }],
    abilities: ['Water Absorb'],
    growth_rate: 'MediumFast',
    level: 5,
    catch_rate: 90,
    pokemon_number: 195,
    evolution: null,
    hp: {
        base: 95,
        max: 95,
        current: 95
    },
    xp: {
        base: 151,
        total: 0
    },
    atk: {
        base: 85,
        current: 85,
        effective: 85,
        stage: 0
    },
    def: {
        base: 85,
        current: 85,
        effective: 85,
        stage: 0
    },
    sp_atk: {
        base: 65,
        current: 65,
        effective: 65,
        stage: 0
    },
    sp_def: {
        base: 65,
        current: 65,
        effective: 65,
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
            path: base_path + 'quagsire-front.png',
            key: 'quagsire-front',
            frameWidth: 201,
            frameHeight: 310,
            frames: 44
        },
        back: {
            path: base_path + 'quagsire-back.png',
            key: 'quagsire-back',
            frameWidth: 264,
            frameHeight: 410,
            frames: 44
        }
    },
    sounds: 'assets/sounds/quagsire-cry.ogg',
    held_item: null,
    stat_total: 430,
    levitates: false

});

let wooper = new Pokemon({
    name: "Wooper",
    description: "When the temperature cools in the evening, they emerge from water to seek food along the shore..",
    types: ['water', 'ground'],
    height: 0.4,
    weight: 8.5,
    moves: [deepClone(all_moves.tail_whip), deepClone(all_moves.water_gun
    ), deepClone(all_moves.mud_shot),],
    learnable_moves: [{ at_level: 15, move: { ...all_moves.water_pulse } }, { at_level: 20, move: { ...all_moves.aqua_tail } }],
    abilities: ['Water Absorb'],
    growth_rate: 'MediumFast',
    level: 5,
    catch_rate: 255,
    pokemon_number: 194,
    evolution: { at_level: 20, into: deepClone(quagsire) },
    hp: {
        base: 55,
        max: 55,
        current: 55
    },
    xp: {
        base: 42,
        total: 0
    },
    atk: {
        base: 44,
        current: 44,
        effective: 44,
        stage: 0
    },
    def: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    sp_atk: {
        base: 25,
        current: 25,
        effective: 25,
        stage: 0
    },
    sp_def: {
        base: 25,
        current: 25,
        effective: 25,
        stage: 0
    },
    speed: {
        base: 15,
        current: 15,
        effective: 15,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'wooper-front.png',
            key: 'wooper-front',
            frameWidth: 397,
            frameHeight: 310,
            frames: 50
        },
        back: {
            path: base_path + 'wooper-back.png',
            key: 'wooper-back',
            frameWidth: 517,
            frameHeight: 410,
            frames: 50
        }
    },
    sounds: 'assets/sounds/wooper-cry.ogg',
    held_item: null,
    stat_total: 210,
    levitates: false

});

let drilbur = new Pokemon({
    name: "Drilbur",
    description: "It’s a digger, using its claws to burrow through the ground. It causes damage to vegetable crops, so many farmers have little love for it.",
    types: ['ground'],
    height: 0.3,
    weight: 8.5,
    moves: [deepClone(all_moves.mud_slap), deepClone(all_moves.rapid_spin
    ), deepClone(all_moves.scratch),],
    learnable_moves: [{ at_level: 8, move: { ...all_moves.hone_claws } }, { at_level: 12, move: { ...all_moves.fury_swipes } }, { at_level: 16, move: { ...all_moves.metal_claw } }, { at_level: 20, move: { ...all_moves.rock_slide } }],
    abilities: ['Guts'],
    growth_rate: 'Medium Fast',
    level: 5,
    catch_rate: 120,
    pokemon_number: 529,
    evolution: null,
    hp: {
        base: 60,
        max: 60,
        current: 60
    },
    xp: {
        base: 66,
        total: 0
    },
    atk: {
        base: 85,
        current: 85,
        effective: 85,
        stage: 0
    },
    def: {
        base: 40,
        current: 40,
        effective: 40,
        stage: 0
    },
    sp_atk: {
        base: 30,
        current: 30,
        effective: 30,
        stage: 0
    },
    sp_def: {
        base: 45,
        current: 45,
        effective: 45,
        stage: 0
    },
    speed: {
        base: 68,
        current: 68,
        effective: 68,
        stage: 0
    },
    images: {
        front: {
            path: base_path + 'drilbur-front.png',
            key: 'drilbur-front',
            frameWidth: 559,
            frameHeight: 310,
            frames: 30
        },
        back: {
            path: base_path + 'drilbur-back.png',
            key: 'drilbur-back',
            frameWidth: 742,
            frameHeight: 410,
            frames: 30
        }
    },
    sounds: 'assets/sounds/drilbur-cry.ogg',
    held_item: null,
    stat_total: 328,
    levitates: false

});






export const Pokemons = {
    treecko, torchic, mudkip, aggron, nosepass, lunatone, lileep, wingull, ralts, zigzagoon, poochyena, electrike, meowth, timburr, gastly, deino, starly, staravia, deerling, foongus, beautifly, kricketune, krabby, ducklett, cranidos, onix,
    scolipede, heracross, erika_kricketune, squirtle, marshtomp, carvanha, whirlipede, frillish, cubchoo, archen, nidoran, mightyena, kirlia, linoone, nidorino, combusken, grovyle, scyther, dusclops, houndoom, crobat, wooper, quagsire, drilbur, omanyte, aron
}