import { reactive, computed } from 'vue';
import { Pokemons } from './js/db/pokemons.mjs';
import { BattleScene } from './js/scenes/battle-scene.mjs';
import { trainers, Trainer } from './js/db/trainers.mjs';
import { all_items } from './js/db/items.mjs';
import { all_moves } from './js/db/moves.mjs';
import { encounter_map } from './mapStore.mjs';
import { map_store } from './mapStore.mjs';
import { SCENE_KEYS } from './js/scenes/scene-keys.mjs';
import { WORLD_ASSETS_KEYS } from './js/scenes/assets-keys.mjs';

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

export const store = reactive({
    my_pokemon: null,
    oppo_pokemon: undefined,
    my_bench: [],
    test_bench: [Pokemons.gastly, Pokemons.timburr, Pokemons.ralts, Pokemons.meowth],
    test_items: [all_items.potion, all_items.poke_ball],
    my_items: [],
    player_info: {
        name: 'Aleks'
    },
    oppo_trainer: trainers.roxanne,
    oppo_bench: [],
    menu_state: 'text',
    info_text: ``,
    additional_info_text: null,
    battle_events: [],
    battle_sequence_playing: false,
    battle_scene_instance: undefined,
    multiplayer_battle: false,
    my_socket_id: undefined,
    battle_type: undefined,
    config: {
        text_speed: 20,
        play_move_animation: true,
        rules: {
            items_in_battle_allowed: false
        }
    },
    player_last_move: undefined,
    escape_attempts: 0,
    show_hud: false,
    in_battle: false,
    level_cap: 15,
    forgettign_pokemon: null,
    learnable_move: null,

    useMove: async function (move, caster, target, player_attack) {

        this.menu_state = 'text';
        //return  early if pokemon  is fainted
        if (caster.fainted || target.fainted) return
        // if caster flinched, reset and return early
        if (caster.flinched) {
            caster.flinched = false
            this.info_text = `${caster.name} flinched and won't attack this turn`;
            await this.delay(this.info_text.length * this.config.text_speed + 500);
            return
        }
        //check all the possible caster statuses
        if (caster.status == 'asleep') {
            if (caster.sleeping_turns && caster.sleeping_turns.passed > caster.sleeping_turns.total) {
                this.info_text = `${caster.name} finally woke up!`;
                caster.status = null
                caster.sleeping_turns = null
                await this.delay(this.info_text.length * this.config.text_speed + 500);
            } else {
                this.info_text = `${caster.name} is still asleep...`;
                caster.sleeping_turns.passed++
                await this.delay(this.info_text.length * this.config.text_speed + 500);
                return
            }
        } else if (caster.status == 'paralyzed') {
            if (!await this.attackingWhileParalyzed(caster)) {
                return
            }
        } else if (caster.status == 'frozen') {
            this.info_text = `${caster.name} is frozen solid and can't attack`;
            await this.delay(this.info_text.length * this.config.text_speed + 500);
            return
        }
        // check if the caster is (still) confused
        if (caster.confused) {

            await this.checkConfusionTurns(caster)
        }
        // If caster  is still confused after the check, check if the attack goes trough regardless
        if (caster.confused && ! await this.attackingWhileConfused(caster, target)) {
            return
        }

        // pay pp cost
        move.pp.current = move.pp.current - 1

        let player_last_move_track

        if (player_attack) {
            player_last_move_track = this.player_last_move
            this.player_last_move = move
        }
        //track last move used
        if (player_attack && player_last_move_track && move.effects && player_last_move_track.effects) {
            //if the last ability had a protect effect, its accuracy drops by a third
            let current_move_has_protect = false
            let last_move_had_protect = false
            move.effects.forEach((effect) => {
                if (effect.type == 'protect') {
                    current_move_has_protect = true
                }
            })
            player_last_move_track.effects.forEach((effect) => {
                if (effect.type == 'protect') {

                    last_move_had_protect = true
                }
            })
            if (current_move_has_protect && last_move_had_protect) {

                move.accuracy *= 0.66
            } else {
                move.accuracy = 100
            }
        }
        // Display move text
        let moveText = `${player_attack ? '' : 'Enemy'} ${caster.name} uses ${move.name}`;
        this.menu_state = 'text';
        this.info_text = moveText;
        await this.delay(this.info_text.length * this.config.text_speed + 500);




        //hustle makes the physical moves 20% less likely to hit
        if (move.category == 'physical' && caster.abilities.includes('Hustle')) {
            move.accuracy *= 0.8
        }
        //  check if the ability missed
        if (this.move_missed(move.accuracy, caster.accuracy.effective, target.evasion.effective)) {
            this.info_text = `${move.name} missed!`
            await this.delay(this.info_text.length * this.config.text_speed + 500);
            return
        }

        if (this.checkDamagePrevent(move, caster, target)) {
            if (this.additional_info_text) {
                this.info_text = this.additional_info_text
                await this.delay(this.info_text.length * this.config.text_speed + 500);
            }
            this.additional_info_text = null
            return
        }

        // If the attack would go trough but the target is protected, return early
        if (target.guarded) {
            target.guarded = false
            this.info_text = `${target.name} has protected himself!`
            await this.delay(this.info_text.length * this.config.text_speed + 500);
            return
        }

        // account for animations  I didn't code yet
        if (move.animation && this.config.play_move_animation) {
            await move.animation(caster.sprite, caster.player_controlled)
        }

        //Account for crhit chance
        let crhit = false
        const crhit_chance = Math.random() * 100
        if (crhit_chance < caster.crhit_chance) {
            crhit = true
        }
        let damage = this.calcDamage(move, caster, target, crhit, true);


        // Apply damage if its a damaging move
        if (move.power) {
            // check damage prevention effects, if found return early

            if (target.abilities.includes('Sturdy') && target.hp.current == target.hp.max && damage >= target.hp.max) {
                damage = damage - 1
                await this.applyDamage(target, damage);
                this.info_text = `${target.name}'s Sturdy ability prevented him from going down in a single hit`
                await this.delay(this.info_text.length * this.config.text_speed + 500);

            } else {
                await this.applyDamage(target, damage);
                if (this.additional_info_text) {
                    this.info_text = this.additional_info_text
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                }
                this.additional_info_text = null
            }
        } if (move.effects) {
            for (const effect of move.effects) {
                if (effect.type == 'modify_stat') {
                    let move_target = effect.target == 'enemy' ? target : caster
                    this.info_text = await this.modifyStat(effect, move_target);
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                }
                else if (effect.type == 'apply_status') {
                    let move_target = effect.target == 'enemy' ? target : caster
                    let move_caster = effect.target == 'ally' ? target : caster
                    if (await this.apply_status(effect, move_target, move_caster) && target.hp.current !== 0) {
                        this.info_text = `${move_target.name} has been ${effect.applied_status}`

                        await this.delay(this.info_text.length * this.config.text_speed + 500);
                        if (move_target.abilities.includes('Synchronize')) {
                            if (effect.applied_status == 'paralyzed' || effect.applied_status == 'burned' || effect.applied_status == 'poisoned') {
                                this.info_text = `${move_caster.name} has been ${effect.applied_status} as well thanks to ${move_target.name}'s Synchronize`

                                await this.delay(this.info_text.length * this.config.text_speed + 500);
                            }
                        }

                        // check lum barry
                        //separate logic later on
                        if (move_target.held_item && move_target.held_item.name == 'Lum Berry') {
                            this.info_text = `${move_target.name} is no longer ${effect.applied_status} after consuming his Lum Berry`
                            // if status was paralyzed, restore speed
                            if (move_target.status == 'paralyzed') {
                                move_target.speed.effective += move_target.speed.current * 0.5
                            }
                            move_target.held_item = null
                            move_target.status = null
                            await this.delay(this.info_text.length * this.config.text_speed + 500);
                        }
                    };
                }
                else if (effect.type == 'apply_confusion') {
                    let move_target = effect.target == 'enemy' ? target : caster
                    if (await this.apply_confusion(effect, move_target) && target.hp.current !== 0) {
                        this.info_text = `${move_target.name} has been ${effect.applied_status}`
                        await this.delay(this.info_text.length * this.config.text_speed + 500);
                    };
                } else if (effect.type == 'self_faint') {
                    await this.applyDamage(caster, caster.hp.current + 1)
                    await this.faint_logic(caster, target)
                } else if (effect.type == 'apply_flinch') {
                    let move_target = effect.target == 'enemy' ? target : caster
                    this.applyFlinch(effect, move_target)
                } else if (effect.type == 'heal') {
                    let healing_amount = (caster.hp.max * effect.amount) * -1
                    await this.applyDamage(caster, healing_amount)
                    this.info_text = `${caster.name} has healed himself!`

                    await this.delay(this.info_text.length * this.config.text_speed + 500);

                }

                else {

                    await this.resolve_effect(effect, caster, target, damage, move);

                }

            }
        }


        //only check for chrit and effectiveness  if the move is an offensive one

        if (move.power) {
            // check if text needs to be updated with crhit

            if (crhit) {
                this.info_text = `${move.name} has striked a critical hit!`
                await this.delay(this.info_text.length * this.config.text_speed + 500)
            }

            // check if any super effective text needs to be displayed

            if (this.checkSuperEffectiveInfo(move, target)) {
                let result = this.checkSuperEffectiveInfo(move, target)
                this.info_text = result.info_text
                await this.delay(result.pause)
            }

            // check contact abilities
            if (move.makes_contact && target.ability == 'Static') {
                let apply_eff_chance = Math.random() < 0.3
                if (apply_eff_chance) {
                    caster.status == 'paralyzed'
                }
            }

            // kill logic if the target died after the dmg

            if (target.hp.current === 0 && !target.fainted) {
                await this.faint_logic(target, caster)
            }

        }

    },

    processEvents: async function () {
        this.battle_sequence_playing = true;
        let promiseChain = Promise.resolve();
        for (const event of this.battle_events) {
            promiseChain = promiseChain.then(async () => {
                await event();
            });
        }

        await promiseChain;
        await this.endTurn(); // Wait for all events to finish before ending the turn
    },

    calcStats: function (pokemon) {
        pokemon.def.current = Math.floor(((pokemon.def.base * 2) * pokemon.level) / 100) + 5
        pokemon.atk.current = Math.floor(((pokemon.atk.base * 2) * pokemon.level) / 100) + 5
        pokemon.sp_def.current = Math.floor(((pokemon.sp_def.base * 2) * pokemon.level) / 100) + 5
        pokemon.speed.current = Math.floor(((pokemon.speed.base * 2) * pokemon.level) / 100) + 5
        pokemon.sp_atk.current = Math.floor(((pokemon.sp_atk.base * 2) * pokemon.level) / 100) + 5
        pokemon.hp.max = Math.floor(((pokemon.hp.base * 2) * pokemon.level) / 100) + pokemon.level + 10
        //account for pokemon nature
        switch (pokemon.nature) {
            case "Lonely":
                pokemon.atk.current = Math.floor(pokemon.atk.current * 1.1);
                pokemon.def.current = Math.floor(pokemon.def.current * 0.9);
                break;
            case "Brave":
                pokemon.atk.current = Math.floor(pokemon.atk.current * 1.1);
                pokemon.speed.current = Math.floor(pokemon.speed.current * 0.9);
                break;
            case "Adamant":
                pokemon.atk.current = Math.floor(pokemon.atk.current * 1.1);
                pokemon.sp_atk.current = Math.floor(pokemon.sp_atk.current * 0.9);
                break;
            case "Naughty":
                pokemon.atk.current = Math.floor(pokemon.atk.current * 1.1);
                pokemon.sp_def.current = Math.floor(pokemon.sp_def.current * 0.9);
                break;
            case "Bold":
                pokemon.def.current = Math.floor(pokemon.def.current * 1.1);
                pokemon.atk.current = Math.floor(pokemon.atk.current * 0.9);
                break;
            case "Relaxed":
                pokemon.def.current = Math.floor(pokemon.def.current * 1.1);
                pokemon.speed.current = Math.floor(pokemon.speed.current * 0.9);
                break;
            case "Impish":
                pokemon.def.current = Math.floor(pokemon.def.current * 1.1);
                pokemon.sp_atk.current = Math.floor(pokemon.sp_atk.current * 0.9);
                break;
            case "Lax":
                pokemon.def.current = Math.floor(pokemon.def.current * 1.1);
                pokemon.sp_def.current = Math.floor(pokemon.sp_def.current * 0.9);
                break;
            case "Timid":
                pokemon.speed.current = Math.floor(pokemon.speed.current * 1.1);
                pokemon.atk.current = Math.floor(pokemon.atk.current * 0.9);
                break;
            case "Hasty":
                pokemon.speed.current = Math.floor(pokemon.speed.current * 1.1);
                pokemon.def.current = Math.floor(pokemon.def.current * 0.9);
                break;
            case "Serious":
                // No nature effect
                break;
            case "Jolly":
                pokemon.speed.current = Math.floor(pokemon.speed.current * 1.1);
                pokemon.sp_atk.current = Math.floor(pokemon.sp_atk.current * 0.9);
                break;
            case "Naive":
                pokemon.speed.current = Math.floor(pokemon.speed.current * 1.1);
                pokemon.sp_def.current = Math.floor(pokemon.sp_def.current * 0.9);
                break;
            case "Modest":
                pokemon.sp_atk.current = Math.floor(pokemon.sp_atk.current * 1.1);
                pokemon.atk.current = Math.floor(pokemon.atk.current * 0.9);
                break;
            case "Mild":
                pokemon.sp_atk.current = Math.floor(pokemon.sp_atk.current * 1.1);
                pokemon.def.current = Math.floor(pokemon.def.current * 0.9);
                break;
            case "Quiet":
                pokemon.sp_atk.current = Math.floor(pokemon.sp_atk.current * 1.1);
                pokemon.speed.current = Math.floor(pokemon.speed.current * 0.9);
                break;
            case "Bashful":
                // No nature effect
                break;
            case "Rash":
                pokemon.sp_atk.current = Math.floor(pokemon.sp_atk.current * 1.1);
                pokemon.sp_def.current = Math.floor(pokemon.sp_def.current * 0.9);
                break;
            case "Calm":
                pokemon.sp_def.current = Math.floor(pokemon.sp_def.current * 1.1);
                pokemon.atk.current = Math.floor(pokemon.atk.current * 0.9);
                break;
            case "Gentle":
                pokemon.sp_def.current = Math.floor(pokemon.sp_def.current * 1.1);
                pokemon.def.current = Math.floor(pokemon.def.current * 0.9);
                break;
            case "Sassy":
                pokemon.sp_def.current = Math.floor(pokemon.sp_def.current * 1.1);
                pokemon.speed.current = Math.floor(pokemon.speed.current * 0.9);
                break;
            case "Careful":
                pokemon.sp_def.current = Math.floor(pokemon.sp_def.current * 1.1);
                pokemon.sp_atk.current = Math.floor(pokemon.sp_atk.current * 0.9);
                break;
            case "Quirky":
                // No nature effect
                break;
        }


        //set effective values equal to current values
        pokemon.hp.current = pokemon.hp.max - pokemon.damage
        pokemon.atk.effective = pokemon.atk.current
        pokemon.def.effective = pokemon.def.current
        pokemon.sp_atk.effective = pokemon.sp_atk.current
        pokemon.sp_def.effective = pokemon.sp_def.current
        pokemon.speed.effective = pokemon.speed.current
    },

    calcDamage: function (move, caster, target, crhit, not_simulation) {

        if (move.name == 'Seismic Toss') {
            return caster.level
        } else if (!move.power) {
            return 0
        }

        if (move.name == 'Low Kick') {
            move.power = this.calcPowerBasedOnTargetWeight(target)
        }


        let caster_pinched = caster.hp.current < caster.hp.max * 0.34
        let offensive_stat = move.category == 'physical' ? caster.atk.effective : caster.sp_atk.effective
        let defensive_stat = move.category == 'physical' ? target.def.effective : target.sp_def.effective
        let pb = caster.types.includes(move.type) ? 1.5 : 1
        let effectiveness = this.checkEffectiveness(move.type, target.types)
        //moves can do 85% to 100% of their maximum damage
        let random = 0.85 + Math.random() * 0.15;
        //hustle boosts atk by 50% when using physical moves,and guts  does so if the caster has a major status condition
        if ((caster.abilities.includes('Hustle') || ((caster.abilities.includes('Guts') && caster.status !== null))) && move.category == 'physical') {
            offensive_stat *= 1.5
        }
        let damage_equation =
            (((caster.level * 2 / 5) + 2) * move.power * (offensive_stat / defensive_stat) / 50) * pb * effectiveness + 2 * random
        if (crhit) {
            damage_equation *= 1.5
        }
        if (caster.status == 'burned' && move.category == 'physical' && !caster.abilities.includes('Guts')) {
            damage_equation *= 0.5
        }
        if (caster_pinched && ((caster.abilities.includes('Overgrow') && move.type == 'grass') || (caster.abilities.includes('Torrent') && move.type == 'water') || (caster.abilities.includes('Blaze') && move.type == 'fire'))) {

            damage_equation *= 1.5
            // only display dialogue text if calc damage wants performed for a simulation
            if (not_simulation) {
                this.additional_info_text = `${caster.name}'s ${move.name} dealt more damage thanks to ${caster.abilities[0]}`
            }

        }
        if (Math.round(damage_equation) > target.hp.current) {
            damage_equation = target.hp.current + 1
        }
        return Math.round(damage_equation)
    },
    calcPowerBasedOnTargetWeight(target) {
        if (target.weight < 10) {
            return 20
        } else if (target.weight < 25) {
            return 40
        } else if (target.weight < 50) {
            return 60
        } else if (target.weight < 100) {
            return 80
        } else if (target.weight < 200) {
            return 100
        } else {
            return 120
        }
    },

    checkEffectiveness: function (moveType, targetTypes) {

        // Function to calculate the effectiveness multiplier
        function calculateMultiplier(moveType, targetType) {
            if (!moveType) return 1
            // Define type matchups
            const matchups = {
                normal: {
                    not_effective: ['rock', 'steel'],
                    super_effective: [''],
                    no_effect: ['ghost']
                },
                fighting: {
                    not_effective: ['flying', 'poison', 'bug', 'psychic', 'fairy'],
                    super_effective: ['normal', 'ice', 'rock', 'dark', 'steel'],
                    no_effect: ['ghost']
                },
                flying: {
                    not_effective: ['electric', 'rock', 'steel'],
                    super_effective: ['fighting', 'bug', 'grass'],
                    no_effect: []
                },
                poison: {
                    not_effective: ['poison', 'ground', 'rock', 'ghost'],
                    super_effective: ['grass', 'fairy'],
                    no_effect: []
                },
                ground: {
                    not_effective: ['grass', 'bug'],
                    super_effective: ['poison', 'rock', 'steel', 'fire', 'electric'],
                    no_effect: ['flying']
                },
                rock: {
                    not_effective: ['fighting', 'ground', 'steel'],
                    super_effective: ['flying', 'bug', 'fire', 'ice'],
                    no_effect: []
                },
                bug: {
                    not_effective: ['grass', 'psychic', 'dark'],
                    super_effective: ['psychic', 'dark', 'grass'],
                    no_effect: []
                },
                ghost: {
                    not_effective: ['dark'],
                    super_effective: ['ghost', 'psychic'],
                    no_effect: ['normal']
                },
                steel: {
                    not_effective: ['steel', 'fire', 'water', 'electric'],
                    super_effective: ['rock', 'ice', 'fairy'],
                    no_effect: []
                },
                fire: {
                    not_effective: ['fire', 'water', 'rock', 'dragon'],
                    super_effective: ['bug', 'steel', 'grass', 'ice'],
                    no_effect: []
                },
                water: {
                    not_effective: ['water', 'grass', 'dragon'],
                    super_effective: ['ground', 'rock', 'fire'],
                    no_effect: []
                },
                grass: {
                    not_effective: ['flying', 'poison', 'bug', 'steel', 'fire', 'grass', 'dragon'],
                    super_effective: ['ground', 'rock', 'water'],
                    no_effect: []
                },
                electric: {
                    not_effective: ['ground'],
                    super_effective: ['flying', 'water'],
                    no_effect: []
                },
                psychic: {
                    not_effective: ['psychic', 'steel'],
                    super_effective: ['fighting', 'poison'],
                    no_effect: ['dark']
                },
                ice: {
                    not_effective: ['fire', 'water', 'ice', 'steel'],
                    super_effective: ['flying', 'ground', 'grass', 'dragon'],
                    no_effect: []
                },
                dragon: {
                    not_effective: ['steel'],
                    super_effective: ['dragon'],
                    no_effect: ['fairy']
                },
                dark: {
                    not_effective: ['fighting', 'dark', 'fairy'],
                    super_effective: ['ghost', 'psychic'],
                    no_effect: []
                },
                fairy: {
                    not_effective: ['poison', 'steel', 'fire'],
                    super_effective: ['fighting', 'dragon', 'dark'],
                    no_effect: []
                }
            };

            // Check if the move type is effective against the target type
            if (matchups[moveType].super_effective.includes(targetType)) {
                return 2;
            }
            // Check if the move type is not very effective against the target type
            else if (matchups[moveType].not_effective.includes(targetType)) {
                return 0.5;
            }
            // If the move has no effect on the target type
            else if (matchups[moveType].no_effect.includes(targetType)) {
                return 0;
            }
            // If none of the above, the move type is normally effective against the target type
            else {
                return 1;
            }
        }

        // Initialize multiplier to 1 (normal effectiveness)
        let multiplier = 1;

        // Loop through each target type
        targetTypes.forEach(targetType => {
            // Calculate effectiveness multiplier for each type combination
            const typeMultiplier = calculateMultiplier(moveType, targetType);

            // Update overall multiplier based on the effectiveness of each type combination
            multiplier *= typeMultiplier;
        });

        return multiplier;
    },

    async applyDamage(target, damage) {

        if (damage > 0) {
            const damage_animationPromise = target.playDamageAnim(this.battle_scene_instance);
            await damage_animationPromise;
        } else if (damage < 0) {
            // Play healing animation or different animation for negative damage
            // Code for healing animation or other animations for negative damage
        }


        return new Promise(resolve => {
            const initialHp = target.hp.current;
            const targetHp = initialHp - damage;
            const hpDifference = targetHp - initialHp;
            const animationDuration = 1000;
            const updateInterval = 50;
            const steps = animationDuration / updateInterval;
            const hpChangePerStep = hpDifference / steps;

            let currentHp = initialHp;
            let stepCount = 0;
            target.damage += damage


            const updateUIInterval = setInterval(async () => {
                currentHp += hpChangePerStep;
                let newCurrentHp;
                if (hpChangePerStep > 0) {
                    // If restoring, limit HP to not exceed max HP
                    newCurrentHp = Math.min(target.hp.max, Math.ceil(currentHp));
                } else {
                    // If damaging, limit HP to not go below 0
                    newCurrentHp = Math.max(0, Math.ceil(currentHp));
                }
                target.hp.current = newCurrentHp;


                stepCount++;
                if (stepCount >= steps) {
                    clearInterval(updateUIInterval);
                    resolve(); // Resolve after animation duration
                }
            }, updateInterval);
        });
    },

    // SECTION FOR AI DECISION MAKING````○
    calcAiBestMove() {
        let selected_move = undefined;
        let most_damage_move = this.highestAiDmgMove(this.oppo_pokemon);
        let ai_healign_move = null
        let high_prio_move = null
        let ai_is_slower = this.oppo_pokemon.speed.effective <= this.my_pokemon.speed.effective

        // check if AI holds an healing move or high prio move

        this.oppo_pokemon.moves.forEach((move) => {
            if (move.priority > 1) {

                high_prio_move = move
            }
            if (move.category == 'status') {
                move.effects.forEach((eff) => {
                    if (eff.type == 'heal') {
                        ai_healign_move = move
                    }
                })
            }
        })

        //If Ai is slower but has a kill with an higher prio move, always go for it

        if (ai_is_slower && high_prio_move && this.calcDamage(high_prio_move, this.oppo_pokemon, this.my_pokemon, false, false) >= this.my_pokemon.hp.current) {
            selected_move = high_prio_move

        }
        // Check if highest damage move could kill or deals at least 50% max HP damage
        else if ((most_damage_move.could_kill || most_damage_move.expected_dmg > this.my_pokemon.hp.max / 2)) {
            selected_move = most_damage_move.move;
        }
        //AI doenst have an highly damaging move and its below 50% hp, while holding an healing move
        else if (this.oppo_pokemon.hp.current < this.oppo_pokemon.hp.max * 0.5 && ai_healign_move) {

            selected_move = ai_healign_move
        }
        else {
            // Check for status moves if opponent doesn't have a status condition
            if (!this.my_pokemon.status) {
                let bestStatusMove = null;
                this.oppo_pokemon.moves.forEach(move => {

                    if (move.effects && typeof move.effects[Symbol.iterator] === 'function') {
                        move.effects.forEach(effect => {
                            if (effect.type === 'apply_status' && effect.target === 'enemy' && move.pp.current > 0) {
                                // Select move with higher accuracy
                                if (!bestStatusMove || move.accuracy > bestStatusMove.accuracy) {
                                    bestStatusMove = move;
                                }
                            }
                        });
                    }
                });

                if (bestStatusMove && this.checkEffectiveness(bestStatusMove.type, this.my_pokemon.types) >= 1) {
                    selected_move = bestStatusMove;
                }
            }

            // Fallback to highest damage move if no status move is selected
            if (!selected_move) {
                selected_move = most_damage_move.move;
            }
        }

        return selected_move;
    },
    highestAiDmgMove(pkmn) {
        let best_move = {
            move: undefined,
            expected_dmg: 0,
            could_kill: false
        };

        pkmn.moves.forEach((move) => {
            let self_faint_move = false;
            let move_can_flinch = false
            if (move.effects) {
                // Check if the move has self-fainting effect
                move.effects.forEach((effect) => {
                    if (effect.type == 'self_faint') {
                        self_faint_move = true;
                    } else if (effect.type == 'apply_flinch') {
                        move_can_flinch = true;
                    }
                });
            }


            let expected_damage = this.calcDamage(move, pkmn, this.my_pokemon, false);


            if (
                best_move.move === undefined && !self_faint_move || // If best_move is not defined yet
                (expected_damage > best_move.expected_dmg && !best_move.could_kill && move.pp.current > 0 && !self_faint_move) || // If the move is better than the current best move
                (best_move.could_kill && expected_damage > this.my_pokemon.hp.current && move.accuracy > best_move.move.accuracy && move.pp.current > 0 && !self_faint_move) || // If the move could kill and has higher accuracy
                (!best_move.could_kill && pkmn.speed.current > this.my_pokemon.speed.current && move_can_flinch) ||
                (!best_move.could_kill && pkmn.hp.current < pkmn.hp.max * 0.33 && self_faint_move) // If the opponent's HP is low and the move is self-fainting
            ) {

                best_move.move = move;
                best_move.expected_dmg = expected_damage;
                best_move.could_kill = expected_damage >= this.my_pokemon.hp.current;
            }
        });

        return best_move;
    },
    playerKillingMove() {
        let killing_move;
        let shuffled_moves = this.shuffleArray(this.my_pokemon.moves.slice());

        shuffled_moves.forEach(move => {
            let expected_damage = this.calcDamage(move, this.my_pokemon, this.oppo_pokemon, false);
            if (expected_damage >= this.oppo_pokemon.hp.current) {
                killing_move = move;
            }
        });

        return killing_move;
    },
    playerHighestDmgMove() {
        let highest_dmg_move = {
            expected_dmg: 0,
            move: null,
            can_kill: false
        };

        let shuffled_moves = this.shuffleArray(this.my_pokemon.moves.slice());

        shuffled_moves.forEach(move => {
            let expected_damage = this.calcDamage(move, this.my_pokemon, this.oppo_pokemon, false);


            if (expected_damage > highest_dmg_move.expected_dmg) {
                highest_dmg_move.move = move;
                highest_dmg_move.expected_dmg = expected_damage;
                highest_dmg_move.can_kill = expected_damage >= this.oppo_pokemon.hp.current;
            }
        });


        return highest_dmg_move;
    }
    ,
    bestAiSwap(player_move) {
        let best_swap = {
            pokemon: this.oppo_bench[0],
            predicted_dmg_tanked: this.calcDamage(player_move.move, this.my_pokemon, this.oppo_bench[0])
        };

        this.oppo_bench.forEach((ai_pokemon) => {
            let expected_incoming_damage = this.calcDamage(player_move.move, this.my_pokemon, ai_pokemon);

            //priority in case of damage prevention cause ability
            if (this.checkDamagePrevent(player_move.move, this.my_pokemon, ai_pokemon)) {

                //checkdmgprevent would queue a message
                this.additional_info_text = null
                best_swap.pokemon = ai_pokemon
                best_swap.predicted_dmg_tanked = 0
            }
            else if (expected_incoming_damage < best_swap.predicted_dmg_tanked && expected_incoming_damage < ai_pokemon.hp.current) {

                best_swap.predicted_dmg_tanked = expected_incoming_damage;
                best_swap.pokemon = ai_pokemon;
                best_swap.predicted_dmg_tanked = expected_incoming_damage
            } else if (expected_incoming_damage === best_swap.predicted_dmg_tanked && best_swap.pokemon && ai_pokemon.hp.current > best_swap.pokemon.hp.current) {

                best_swap.pokemon = ai_pokemon;
                best_swap.predicted_dmg_tanked = expected_incoming_damage // If damage is equal, choose the one with higher remaining HP
            }
        });

        return best_swap;
    },
    aiWantsSwap() {
        if (this.oppo_bench.length == 0) return false
        let predicted_player_move = this.playerHighestDmgMove()
        let highest_dmg_ai_move = this.highestAiDmgMove(this.oppo_pokemon)
        let threatening_dmg_expected = false
        let ai_has_high_dmg_move = false
        let wants_to_swap = false
        let possible_swap = this.bestAiSwap(predicted_player_move)
        let ai_is_slower = this.oppo_pokemon.speed.effective <= this.my_pokemon.speed.effective

        //the human player is considered to have a threatening damage move if the dmg  output is higher than 50% of the AI pokemon max hp
        if (predicted_player_move.expected_dmg > this.oppo_pokemon.hp.max * 0.5) {

            threatening_dmg_expected = true
        }
        // The ai is considered to have an high dmg output move if that move is gonna deal more than 50% of the max hp of the pokemon
        if (highest_dmg_ai_move.expected_dmg > this.my_pokemon.hp.max * 0.5) {
            ai_has_high_dmg_move = true
        }

        // THE ai always wants to swap if the human player can kill his pokemon, he is slower and has a pokemon on the bench whose gonna take less than 40% max hp as dmg

        if (predicted_player_move.can_kill && ai_is_slower && possible_swap.predicted_dmg_tanked <= possible_swap.pokemon.hp.current * 0.4) {
            wants_to_swap = true
            console.log('ai wanted to swap cause', predicted_player_move.move.name, 'is about to deal', predicted_player_move.expected_dmg, 'His swap options is', possible_swap.pokemon.name)
        }
        // The ai wants to swap if its expecting an high damage output from the player and has a benched pokemon uneffected from the predicted move
        else if (threatening_dmg_expected && possible_swap.predicted_dmg_tanked == 0) {
            console.log('Ai wants to swap cause its expecting', threatening_dmg_expected, 'and has a 0 dmg benched pokemon')
            wants_to_swap = true
        }

        // The ai never wants to swap if he is faster and has a kill on the opponent pokemon

        if (highest_dmg_ai_move.expected_dmg > this.my_pokemon.hp.current && !ai_is_slower) {
            console.log('ai doenst want to swap cause he thinsk hes faster and can kill')
            wants_to_swap = false
        }

        if (wants_to_swap) {
            console.log('ai decided to swap')
            return possible_swap.pokemon
        } else {
            console.log('ai decided to not swap')
            return false
        }
    },
    bestAfterFaint() {
        let new_pkmn
        let highest_dmg_move = {
            move: null,
            expected_dmg: 0
        }
        this.oppo_bench.forEach((pkmn) => {
            let best_move = this.highestAiDmgMove(pkmn)
            if (best_move.expected_dmg > highest_dmg_move.expected_dmg) {
                highest_dmg_move.move = best_move
                highest_dmg_move.expected_dmg = best_move.expected_dmg
                new_pkmn = pkmn
            }
        })
        if (!new_pkmn) {
            new_pkmn = this.oppo_bench[0]
        }
        return new_pkmn
    },
    delay: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    checkSuperEffectiveInfo(move, target) {
        const effectiveness = this.checkEffectiveness(move.type, target.types);
        let info_text, pause;

        if (effectiveness == 2) {
            info_text = `${move.name} is super effective against ${target.name}`;
        } else if (effectiveness == 0.5) {
            info_text = `${move.name} is not very effective against ${target.name}...`;
        } else if (effectiveness < 0.25) {
            info_text = `${move.name} is terrible against ${target.name}...`;
        } else if (effectiveness == 4) {
            info_text = `${move.name} is great against ${target.name}...`;
        }

        if (info_text) {
            pause = info_text.length * this.config.text_speed + 500;
            return { info_text, pause };
        }

    },
    async modifyStat(move_effect, target) {
        let result_message;
        const stat = move_effect.target_stat;
        const stages = move_effect.stages;
        // stat modifying preventers logic
        if (move_effect.target_stat == 'crhit_chance') {
            target.crhit_chance *= 4
            return `${target.name}'s is way more likely to strike a critical hit now`;
        }
        if (move_effect.target_stat == 'accuracy' && target.abilities.includes('Keen Eye')) {
            return `${target.name}'s ${target.abilities[0]} prevented his ${move_effect.target_stat} from ${stages > 0 ? 'increasing' : 'decreasing'}`;
        }

        if (target[stat]) {
            // Check if the stat is already at maximum or minimum stage
            if ((target[stat].stage === 6 && stages > 0) || (target[stat].stage === -6 && stages < 0)) {
                return `${target.name}'s ${move_effect.target_stat_label} cannot be ${stages > 0 ? 'increased' : 'decreased'} any further`;
            }

            let stageIndex = target[stat].stage + 6; // Adjust stage to fit within array index range [0, 12]

            // Define stage multipliers based on the type of stat
            let stageMultipliers;
            if (stat === 'accuracy' || stat === 'evasion') {
                stageMultipliers = stat === 'accuracy' ? [3 / 9, 3 / 8, 3 / 7, 3 / 6, 3 / 5, 3 / 4, 3 / 3, 4 / 3, 5 / 3, 6 / 3, 7 / 3, 8 / 3, 9 / 3] : [9 / 3, 8 / 3, 7 / 3, 6 / 3, 5 / 3, 4 / 3, 3 / 3, 3 / 4, 3 / 5, 3 / 6, 3 / 7, 3 / 8, 3 / 9];
            } else {
                stageMultipliers = [2 / 8, 2 / 7, 2 / 6, 2 / 5, 2 / 4, 2 / 3, 2 / 2, 3 / 2, 4 / 2, 5 / 2, 6 / 2, 7 / 2, 8 / 2];
            }

            // Ensure the stage stays within the valid range [-6, 6]
            target[stat].stage = Math.min(Math.max(target[stat].stage + stages, -6), 6);
            stageIndex = target[stat].stage + 6; // Update stage index after adjustment

            // Calculate effective stat and generate result message
            target[stat].effective = parseFloat((target[stat].current * stageMultipliers[stageIndex]).toFixed(2));

            result_message = `${target.name}'s ${move_effect.target_stat_label} ${stages == -2 ? 'harshly' : ''}  ${stages > 0 ? 'rose' : 'fell'} ${stages == +2 ? 'drastically' : ''}`;
        }

        return result_message;
    }
    ,
    move_missed: function (move_accuracy, caster_accuracy, target_evasion) {
        const random_chance = Math.floor(Math.random() * 100)
        let chance_of_hit = Math.round(move_accuracy * caster_accuracy * target_evasion)

        if (random_chance <= chance_of_hit) {
            return false
        } else {
            return true
        }
    },
    apply_status: async function (effect, target, caster) {
        let random_chance = Math.floor(Math.random() * 100)
        let status_applied = false
        if (effect.chance >= random_chance) {
            if (1 == 1) {
                if (target.status !== effect.applied_status) {
                    target.status = effect.applied_status
                    status_applied = true
                    if (effect.applied_status == 'asleep') {
                        let sleeping_turns = Math.floor(Math.random() * 3) + 1
                        target.sleeping_turns = {
                            total: sleeping_turns,
                            passed: 0
                        }
                    } else if (effect.applied_status == 'paralyzed') {
                        target.speed.effective = target.speed.current * 0.5
                        if (target.ability == 'Synchronize' && !target.status) {
                            caster.status == 'paralyzed'
                        }
                    } else if (effect.applied_status == 'burned') {
                        if (target.ability == 'Synchronize' && !target.status) {
                            caster.status == 'burned'
                        }
                    } else if (effect.applied_status == 'poisoned') {
                        if (target.ability == 'Synchronize' && !target.status) {
                            caster.status == 'poisoned'
                        }
                    }
                } else {
                    this.info_text = `${target.name} is already ${effect.applied_status}...`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                }

            }
        }
        // if (target.ability == 'Quick Feet' && status_applied) {
        //     target.speed.effective *= 1.5
        //     this.info_text = `${target.name} speed rose thanks to Quick Feet`;
        //     await this.delay(this.info_text.length * this.config.text_speed + 500);
        // }
        return status_applied
    },
    apply_confusion: async function (effect, target) {
        let applied_confusion = false
        if (!target.confused) {
            applied_confusion = true
            target.confused = {
                duration: Math.floor(Math.random() * 4) + 2,
                confused_turns: 0
            }
        } else {
            this.info_text = `${target.name} is already ${effect.applied_status}...`;
            await this.delay(this.info_text.length * this.config.text_speed + 500);
        }
        return applied_confusion
    },
    applyFlinch: function (effect, target) {
        let random_chance = Math.floor(Math.random() * 100)

        if (effect.chance > random_chance) {

            target.flinched = true
        }
    },
    async endTurn() {

        this.my_pokemon.flinched = false
        this.oppo_pokemon.flinched = false

        if (this.my_pokemon.fainted && this.my_bench.length == 0) {

            this.info_text = `All of your pokemons died, you're gonna get killed as well`;
            await this.delay(this.info_text.length * this.config.text_speed + 500);
            window.location.reload()
            return

        } else {

            if (this.oppo_pokemon.fainted) {
                if (this.battle_type == 'trainer' && this.oppo_bench.length > 0) {
                    this.info_text = `${this.oppo_trainer.name}'s next pokemon will be ${this.oppo_bench[0].name}`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                    await this.battle_scene_instance.changeOpponentPokemonSprite(this.bestAfterFaint())
                } else {
                    this.info_text = `${this.oppo_pokemon.name} died and you won the battle ${this.battle_type == 'trainer' ? 'against ' + this.oppo_trainer.name : ''}`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                    // window.location.reload()

                    map_store.world_scene_istance.scene.start(SCENE_KEYS.WORLD_SCENE)
                    this.endBattle()
                    return
                }


            }
        }

        if (!this.my_pokemon.fainted) {
            if (this.my_pokemon.status == 'poisoned' || this.my_pokemon.status == 'burned') {
                let dot_dmg = this.my_pokemon.hp.max / 8;
                this.info_text = `${this.my_pokemon.name} is ${this.my_pokemon.status} and will lose hp`;
                await this.delay(this.info_text.length * this.config.text_speed + 500);
                await this.applyDamage(this.my_pokemon, dot_dmg);
                // trigger faint logic in case of death
                if (this.my_pokemon.hp.current === 0 && !this.my_pokemon.fainted) {
                    await this.faint_logic(this.my_pokemon, this.oppo_pokemon)
                }
            } else if (this.my_pokemon.status == 'frozen') {
                let random_chance = Math.floor(Math.random() * 100)
                if (random_chance <= 20) {
                    this.my_pokemon.status = null
                    this.info_text = `${this.my_pokemon.name} has been thawed out and is now able to attack`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                } else {
                    this.info_text = `${this.my_pokemon.name} is still frozen solid`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                }
            }
            //improve this logic
            if (this.my_pokemon.held_item) {
                if (this.my_pokemon.hp.current < this.my_pokemon.hp.max * 0.5 && this.my_pokemon.held_item.name == 'Sitrus Berry') {
                    this.info_text = `${this.my_pokemon.name} will eat his Sitrus Berry and restore some of his hp`;
                    this.my_pokemon.held_item = null
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                    await this.applyDamage(this.my_pokemon, ((this.my_pokemon.hp.max * 0.25) * -1))

                }
            }


        }
        if (!this.oppo_pokemon.fainted) {
            if (this.oppo_pokemon.status == 'poisoned' || this.oppo_pokemon.status == 'burned') {
                let dot_dmg = this.oppo_pokemon.hp.max / 8;
                this.info_text = `${this.oppo_pokemon.name} is ${this.oppo_pokemon.status} and will lose hp`;
                await this.delay(this.info_text.length * this.config.text_speed + 500);
                await this.applyDamage(this.oppo_pokemon, dot_dmg);
                // trigger faint logic in case of death
                if (this.oppo_pokemon.hp.current === 0 && !this.oppo_pokemon.fainted) {
                    await this.faint_logic(this.oppo_pokemon, this.my_pokemon)
                }
            } else if (this.oppo_pokemon.status == 'frozen') {
                let random_chance = Math.floor(Math.random() * 100)
                if (random_chance <= 20) {
                    this.oppo_pokemon.status = null
                    this.info_text = `${this.oppo_pokemon.name} has been thawed out and is now able to attack`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                } else {
                    this.info_text = `${this.oppo_pokemon.name} is still frozen solid`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                }
            }
            if (this.oppo_pokemon.held_item) {

                if (this.oppo_pokemon.hp.current < this.oppo_pokemon.hp.max * 0.5 && this.oppo_pokemon.held_item.name == 'Sitrus Berry') {
                    this.info_text = `${this.oppo_pokemon.name} will eat his Sitrus Berry and restore some of his hp`;
                    this.oppo_pokemon.held_item = null
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                    await this.applyDamage(this.oppo_pokemon, ((this.oppo_pokemon.hp.max * 0.25) * -1))
                }
            }
        }





        //STUB - handle faint swap scenario
        if (!this.my_pokemon.fainted) {
            this.menu_state = 'options';
        } else if (this.my_pokemon.fainted && this.my_bench.length > 0) {
            this.menu_state = 'switch';
        }

        this.battle_sequence_playing = false;
    },

    resolve_effect: async function (effect, caster, target, damage, move) {
        if (effect.type == 'drain') {
            if (caster.hp.current == caster.hp.max) {
                return
            }
            this.info_text = `${caster.name}'s ${move.name} restored some of his hp`
            let drained_hp = damage / 2
            await this.delay(this.info_text.length * this.config.text_speed + 500);
            //calling apply damage on negative value to heal
            await this.applyDamage(caster, (drained_hp * -1))
            return
        } else if (effect.type == 'protect') {
            caster.guarded = true
            return
        } else if (effect.type == 'recoil') {
            let recoil_dmg = damage * effect.amount
            await this.applyDamage(caster, recoil_dmg)
            this.info_text = `${caster.name}'s took some damage back in recoil`
            await this.delay(this.info_text.length * this.config.text_speed + 500);
            if (caster.hp.current <= 0) {
                this.faint_logic(caster, target)
            }
            return
        }

        else {
            return
        }
    },
    getObjectClone(orig) {
        let clone = Object.assign(Object.create(Object.getPrototypeOf(orig)), orig)
        return clone
    },
    checkConfusionTurns: async function (caster) {

        caster.confused.confused_turns++
        if (caster.confused.confused_turns >= caster.confused.duration) {
            caster.confused = null
            this.info_text = `${caster.name} is no longer  confused`;
            await this.delay(this.info_text.length * this.config.text_speed + 500);
        } else {
            this.info_text = `${caster.name} is still confused`;
            await this.delay(this.info_text.length * this.config.text_speed + 500);
        }
    },
    attackingWhileConfused: async function (caster, target) {
        let random_chance = Math.floor(Math.random() * 100)
        let one_third_chance = random_chance < 33 ? true : false
        let auto_hit_move = {
            category: 'physical',
            type: '',
            power: 40,
            accuracy: 100,
            effects: null
        }
        if (one_third_chance) {
            this.info_text = `${caster.name} is so confused that he hits himself!`;
            await this.delay(this.info_text.length * this.config.text_speed + 500);
            let confusedDamage = this.calcDamage(auto_hit_move, caster, caster, false)
            await this.applyDamage(caster, confusedDamage)
            if (caster.hp.current === 0 && !caster.fainted) {
                await this.faint_logic(caster, target)
            }
            return false
        } else {
            return true
        }
    },
    attackingWhileParalyzed: async function (caster) {
        let random_chance = Math.floor(Math.random() * 100)
        let one_fourth_chance = random_chance < 25 ? true : false


        if (one_fourth_chance) {
            this.info_text = `${caster.name} is paralyzed and won't be able to attack`;
            await this.delay(this.info_text.length * this.config.text_speed + 500);
            return false
        } else {
            return true
        }
    },
    xp_for_next_level: computed(() => {
        const level = store.my_pokemon.level;
        const growth_rate = store.my_pokemon.growth_rate;


        let experienceNeeded = 0;

        switch (growth_rate) {
            case 'Fast':
                experienceNeeded = Math.floor((8 * level / 5) ** 3);
                break;
            case 'Medium Fast':
                experienceNeeded = Math.floor(level ** 3 / 5);
                break;
            case 'Medium Slow':
                experienceNeeded = Math.floor((6 * level ** 3 / 5) - (15 * level ** 2) + (100 * level) - 140);
                break;
            case 'Slow':
                experienceNeeded = Math.floor(5 * level ** 3 / 4);
                break;
            default:
                // Handle invalid growth rate
                break;
        }


        return experienceNeeded;
    }),
    calc_xp_gain: (winner, loser) => {
        const b = loser.xp.base; // Base experience yield of the defeated Pokémon
        const L = loser.level; // Level of the defeated Pokémon
        const Lp = winner.level; // Level of the victorious Pokémon

        // Calculate ΔEXP
        const delta_exp = ((b * L) / 5) * (((2 * L) + 10) / Math.pow((L + Lp + 10), 2.5) + 1);

        return Math.round(delta_exp);
    },
    async add_experience(gainer, amount) {
        return new Promise(resolve => {
            const xpIncrement = 1; // Amount to increment XP by in each step
            const duration = 1000; // Duration of the animation in milliseconds
            const steps = Math.ceil(amount / xpIncrement); // Number of steps needed to reach the target XP
            const xpToAddPerStep = amount / steps; // XP to add in each step
            // precalc if mon gonna level up and return said value
            let gonna_level_up = gainer.xp.total + amount >= this.xp_for_next_level;
            let did_level_up

            // Define a function to increment XP points gradually
            const incrementXP = () => {
                // Check if all XP has been added
                if (amount <= 0) {
                    clearInterval(timer); // Clear the timer
                    resolve(gonna_level_up); // Resolve the promise when XP increment is fully done
                    return
                }

                // Update XP points
                gainer.xp.total += xpToAddPerStep;
                amount -= xpToAddPerStep;

                // Check if the gainer leveled up
                did_level_up = gainer.xp.total >= this.xp_for_next_level;

                if (did_level_up) {
                    gainer.level++;
                    gainer.xp.total = 0;
                    this.calcStats(gainer)
                }

                gainer.xp = { ...gainer.xp };
            };

            // Start the timer
            const timer = setInterval(incrementXP, duration / steps);
        });
    },
    async handle_level_up(leveled_mon) {
        // handle evolution and move learns here
    },
    shuffleArray(array) {
        for (let i = array.length - 1;i > 0;i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },
    async faint_logic(target, caster) {
        target.fainted = true;

        await target.playFaintAnim(this.battle_scene_instance)

        this.info_text = `${target.name} has been killed!`;

        await this.delay(this.info_text.length * this.config.text_speed + 500);
        if (!target.player_controlled) {
            let experience_gain = this.calc_xp_gain(caster, target)
            this.info_text = `${caster.name} has gained ${experience_gain} experience points`;
            await this.delay(this.info_text.length * this.config.text_speed + 500);

            if (await this.add_experience(caster, experience_gain)) {
                this.info_text = `${caster.name} has reached level ${caster.level}`;
                await this.delay(this.info_text.length * this.config.text_speed + 300);
                this.handle_level_up(caster)
            }

        }
    },
    checkDamagePrevent(move, caster, target) {
        if (move.type == 'ground' && target.abilities.includes('Levitate') || move.type == 'water' && target.abilities.includes('Storm Drain') || move.type == 'ground' && target.types.includes('Flying')) {
            this.additional_info_text = `${target.name}'s is uneffected  by ${move.name}`

            if (target.abilities.includes('Storm Drain')) {
                let fake_effect = {
                    type: 'modify_stat', target_stat: 'sp_attack', target: 'ally', stages: +1, target_stat_label: 'special attack'
                }
                this.modifyStat(fake_effect, target)
                this.additional_info_text = `${target.name}'s ${fake_effect.target_stat_label} rose thanks to ${target.abilities[0]}`

            }

            return true
        } else {
            return false
        }
    },
    calcModifiedRate(pkmn, ball) {
        const bonus_status = pkmn.status === 'frozen' || pkmn.status === 'asleep' ? 2 :
            pkmn.status === 'paralyzed' || pkmn.status === 'poisoned' ? 1.5 :
                1;
        const maxHP = pkmn.hp.max || 1; // Prevent division by zero
        const modified_rate = ((3 * maxHP - 2 * pkmn.hp.current) / (3 * maxHP)) * pkmn.catch_rate * ball.catch_multiplier * bonus_status;
        return modified_rate;
    },
    calcShakeProbability(modified_rate) {
        return Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / modified_rate)));
    },
    simulateShakeChecks(shake_probability) {
        const shakeOutcomes = [];
        for (let i = 0;i < 4;i++) {
            // Generate a random number between 0 and 65535
            const randomNumber = Math.floor(Math.random() * 65536);
            // Compare with shake probability (b)
            const shakeSuccess = randomNumber < shake_probability;
            shakeOutcomes.push(shakeSuccess);
        }
        return shakeOutcomes;
    },
    async attemptCatch(pkmn, ball) {

        let modified_catch_rate = this.calcModifiedRate(pkmn, ball);
        let shake_probability = this.calcShakeProbability(modified_catch_rate);
        let shake_outcomes = this.simulateShakeChecks(shake_probability);
        let origina_scale = pkmn.sprite.scale
        await ball.drawAndThrowAnimation(this.battle_scene_instance)
        await pkmn.playCatchAnimation(this.battle_scene_instance)

        for (let i = 0;i < shake_outcomes.length;i++) {
            await ball.animateShake();
        }

        const pokemonCaught = shake_outcomes.every(outcome => outcome === true);
        if (pokemonCaught) {

            this.info_text = `${this.oppo_pokemon.name} has been caught`
            await this.delay(this.info_text.length * this.config.text_speed + 1000)
            let oppo_copy = { ...this.oppo_pokemon }
            this.my_bench.push(oppo_copy)
            this.endBattle()
        } else {
            ball.sprite.destroy()
            await pkmn.playBrakeFreeAnimation(origina_scale)
        }
        return pokemonCaught;
    },
    async attemptEscape(my_pkmn, wild_pkmn) {
        let can_escape;
        let wild_is_slower = wild_pkmn.speed.effective <= my_pkmn.speed.effective;
        this.escape_attempts++;
        store.menu_state = 'text'


        if (wild_is_slower) {
            can_escape = true;
            this.escape_attempts = 0;

        } else {
            let odds_escape = Math.floor((my_pkmn.speed.current * 32 / (wild_pkmn.speed.current / 4)) + 30 * this.escape_attempts) / 256;

            // Check if escape is successful based on the odds
            can_escape = Math.random() < odds_escape;
            if (can_escape) {
                this.escape_attempts = 0;
            }
        }
        if (my_pkmn.abilities.includes('Run Away')) {
            can_escape = true
        }
        if (can_escape) {
            this.battle_sequence_playing = true
            this.info_text = `You succesfully run away from ${this.oppo_pokemon.name}`
            await this.delay(this.info_text.length * this.config.text_speed + 500)
            this.endBattle()
        } else {
            this.battle_sequence_playing = true
            this.info_text = `${this.oppo_pokemon.name} won't let you run away`
            await this.delay(this.info_text.length * this.config.text_speed + 500)
        }
        return can_escape;
    },
    generate_random_trainer(chosen_name) {
        //cancel later

        // trainers can have random pokmeons from a predefined pool
        const possible_trainer_pokemons = [Pokemons.zigzagoon, Pokemons.ralts, Pokemons.wingull, Pokemons.poochyena, Pokemons.electrike, Pokemons.meowth]
        //trainers pokemons can hold random items
        const possible_trainer_items = [all_items.lum_berry, all_items.sitrus_berry]
        const my_pokemons = [];
        //NOTE - REMOVE THIS WHEN DECIDING LOGIC TO GET YOUR POKEMOn
        // this.my_pokemon = deepClone(possible_trainer_pokemons[Math.floor(Math.random() * possible_trainer_pokemons.length)])
        // trainers pokemons will have an average level which is randomly even to 2 level lower compared to the average
        let my_pokemons_avg_level;
        my_pokemons.push(this.my_pokemon);
        const allPokemons = my_pokemons.concat(this.my_bench);
        const totalLevels = allPokemons.reduce((sum, pokemon) => sum + pokemon.level, 0);
        const numPokemons = allPokemons.length;

        // Calculate average level
        my_pokemons_avg_level = Math.floor(totalLevels / numPokemons);
        let random_trainer_lead
        let random_trainer_bench = []
        let rand_lead = deepClone(possible_trainer_pokemons[Math.floor(Math.random() * possible_trainer_pokemons.length)])
        random_trainer_lead = rand_lead
        random_trainer_lead.level = Math.floor(Math.random() * 3) + my_pokemons_avg_level - 2;
        for (let i = 0;i < store.my_bench.length;i++) {
            let rand_pokemon = deepClone(possible_trainer_pokemons[Math.floor(Math.random() * possible_trainer_pokemons.length)])

            rand_pokemon.level = Math.floor(Math.random() * 3) + my_pokemons_avg_level - 2;
            random_trainer_bench.push(rand_pokemon)
        }



        //enemy mons have random moves
        const moveKeys = Object.keys(all_moves);
        random_trainer_lead.moves = []
        random_trainer_lead.held_item = possible_trainer_items[Math.random() * possible_trainer_items.length]
        while (random_trainer_lead.moves.length < 4) {
            const randomMoveKey = moveKeys[Math.floor(Math.random() * moveKeys.length)];
            const randomMove = deepClone(all_moves[randomMoveKey]);

            if (!random_trainer_lead.moves.includes(randomMove)) {
                random_trainer_lead.moves.push(randomMove);
            }
        }

        random_trainer_bench.forEach((pokemon) => {
            pokemon.moves = []
            //trainers pokemons can hold random items
            pokemon.held_item = possible_trainer_items[Math.random() * possible_trainer_items.length]

            while (pokemon.moves.length < 4) {
                const randomMoveKey = moveKeys[Math.floor(Math.random() * moveKeys.length)];
                const randomMove = deepClone(all_moves[randomMoveKey]);


                if (!pokemon.moves.includes(randomMove)) {
                    pokemon.moves.push(randomMove);

                }
            }
        });

        const trainerNames = [
            "Bella",
            "Max",
            "Nora",
            "Jake",
            "Sasha",
            "Liam",
            "Ava",
            "Owen",
            "Zoe",
            "Kai"
        ];

        const rand_trainer_name = chosen_name ? chosen_name : trainerNames[Math.floor(Math.random() * trainerNames.length)]

        let random_trainer = new Trainer({
            name: rand_trainer_name,
            lead: random_trainer_lead,
            bench: random_trainer_bench,
            position: {
                x: 950,
                y: 320
            },
            scale: 0.23,
            squad_level: null,
            moveset: null
        })

        return random_trainer
    },
    getRandomEncounter(map) {
        // Find the encounter map for the given map name
        const mapData = encounter_map.find(entry => entry.map_name === map.map_name);

        // If the map doesn't exist or has no encounters, return null
        if (!mapData || !mapData.possible_encounters || mapData.possible_encounters.length === 0) {
            return deepClone(Pokemons.zigzagoon);
        }

        // Get the possible encounters for the map
        const possibleEncounters = mapData.possible_encounters;

        // Calculate total encounter chance
        const totalChance = possibleEncounters.reduce((acc, encounter) => acc + encounter.chance, 0);

        // Generate a random number to select the encounter
        const randomChance = Math.random() * totalChance;
        let random_encounter = null; // Initialize with null

        // Loop through encounters and select one based on chance
        let accumulatedChance = 0;
        for (const encounter of possibleEncounters) {
            accumulatedChance += encounter.chance;
            if (randomChance < accumulatedChance) {
                random_encounter = encounter.pokemon;

                break; // Break out of the loop once random_encounter is set
            }
        }

        // If no encounter is selected, set random_encounter to the last encounter
        if (!random_encounter) {
            random_encounter = possibleEncounters[possibleEncounters.length - 1].pokemon;

        }

        // Right now, wild pokemons can't hold items
        random_encounter.held_item = null;
        // Right now, random pokemons can have +1/-1 level to the level average of the mapData
        const randomLevel = Math.floor(Math.random() * 3) + (mapData.level_average - 1);
        random_encounter.level = randomLevel;
        return deepClone(random_encounter);
    }

    ,
    deepClone(obj) {
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
    },
    endBattle() {
        this.menu_state = 'hidden'
        this.show_hud = false
        this.info_text = ''
        this.battle_sequence_playing = false;
        this.in_battle = false
        this.battle_scene_instance.cleanupAnimations()
        this.battle_scene_instance.scene.start(SCENE_KEYS.WORLD_SCENE)
    },
    generateSaveCopy(obj) {
        let all_moves = []
        obj.moves.forEach(move => {
            all_moves.push({
                name: move.name,
                left_pp: move.pp.current

            })
        })
        let obj_copy = {
            name: obj.name,
            level: obj.level,
            moves: all_moves || [],
            ability: obj.abilities[0] || null,
            status: obj.status || null,
            fainted: obj.fainted || false,
            nature: obj.nature || 'Timid',
            damage: obj.damage || 0,
            current_xp: obj.xp.total || 0
        }
        return obj_copy
    },
    generateItemSaveCopy(item) {
        let item_copy = {
            name: item.name,
            owned_amount: item.owned_amount
        }
        return item_copy
    },
    async checkLearnableMovesOrEvolutions(pkmn) {
        return new Promise(resolve => {
            pkmn.learnable_moves.forEach(async (move, index) => {
                if (move.at_level <= pkmn.level) {
                    if (pkmn.moves.length < 4) {
                        pkmn.moves.push(move.move)
                        pkmn.learnable_moves.splice(index, 1)
                        console.log(move)
                        this.info_text = `${pkmn.name} has learned ${move.move.name}`
                        resolve(true)
                    } else {
                        pkmn.learnable_moves.splice(index, 1)
                        this.forgettign_pokemon = pkmn
                        this.learnable_move = move.move
                        resolve(true)
                    }
                } else {
                    resolve(false)
                }
            })
        })
    },
    async forgetMove(pkmn, learnable_move) {

    },
    async displayInfoText(text) {
        this.info_text = text
        await this.delay(this.info_text.length * this.config.text_speed + 500)
        return
    }







    //TODO - , possible learned moves, possible evolutions



});



