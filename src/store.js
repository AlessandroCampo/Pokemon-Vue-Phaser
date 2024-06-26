import { reactive, computed } from 'vue';
import { Pokemons } from './js/db/pokemons.mjs';
import { BattleScene } from './js/scenes/battle-scene.mjs';
import { trainers, Trainer } from './js/db/trainers.mjs';
import { all_items } from './js/db/items.mjs';
import { all_moves } from './js/db/moves.mjs';
import { encounter_map } from './mapStore.mjs';
import { map_store } from './mapStore.mjs';
import { SCENE_KEYS } from './js/scenes/scene-keys.mjs';
import gsap from 'gsap';
import { AUDIO_ASSETS_KEY, WORLD_ASSETS_KEYS } from './js/scenes/assets-keys.mjs';
import { all_npcs } from './js/db/npcs.mjs';
import { allAnimations } from './js/db/animations.mjs';

export function deepClone(obj) {
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

function deepMerge(target, source) {
    for (let key in source) {
        if (source[key] instanceof Object) {
            if (Array.isArray(source[key])) {
                target[key] = source[key].map(item => deepClone(item));
            } else {
                target[key] = deepMerge(target[key] || {}, source[key]);
            }
        } else {
            target[key] = source[key];
        }
    }
    return target;
}


export const store = reactive({
    my_pokemon: null,
    oppo_pokemon: undefined,
    my_bench: [],
    my_box: [],
    test_bench: [Pokemons.nosepass, Pokemons.wingull, Pokemons.deino, Pokemons.starly],
    test_items: [all_items.potion, all_items.poke_ball],
    my_items: [],
    player_info: {
        name: 'Aleks'
    },
    oppo_trainer: trainers.roxanne,
    oppo_bench: [],
    defeated_npcs: [],
    caught_mons: [],
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
        text_speed: 25,
        play_move_animation: true,
        rules: {
            items_in_battle_allowed: false,
            pokemon_dead_after_ko: true,
            only_one_pokemon_per_type: true,
        }
    },
    player_last_move: undefined,
    escape_attempts: 0,
    show_hud: false,
    in_battle: false,
    level_cap: 15,
    level_diff: 'HARDCORE',
    forgettign_pokemon: null,
    learnable_move: null,
    my_money: 3000,
    event_on_going: false,

    useMove: async function (move, caster, target, player_attack) {
        this.info_text = ''
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
            await allAnimations.status_animation(caster.player_controlled, 'frozen')
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
        let pp_cost = target.abilities.includes('Pressure') ? 2 : 1
        move.pp.current = move.pp.current - pp_cost

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

        //Sheer Force


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

        if (this.checkDamagePrevent(move, caster, target, false) && move.power) {
            if (target.abilities.includes('Water Absorb')) {
                let healedAmount = Math.ceil(target.hp.max * 0.25) * -1;
                await this.applyDamage(target, healedAmount);
            }
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
            await move.animation(caster.sprite, caster.player_controlled, move.type)
        }
        // if move has sound, play it
        this.battle_scene_instance.sound.play(move.name, {
            volume: 0.2
        })

        //some moves can hit twice
        let crhit = false
        let damage
        if (move.repetitions == 'x') {
            move.repetitions = this.calcBulletSeedHits()
        }
        for (let i = 0;i < move.repetitions;i++) {
            //Account for crhit chance

            let crhit_chance = Math.random() * 100
            // some moves are more likely to crhit
            if (move.crhit_ratio > 1) {
                crhit_chance = crhit_chance / 4
            }
            if (crhit_chance < caster.crhit_chance) {
                crhit = true
            }
            if (target.abilities.includes('Shell Armor')) {
                crhit = false
            }
            damage = this.calcDamage(move, caster, target, crhit, true);


            // Apply damage if its a damaging move
            if (move.power) {
                // check damage prevention effects, if found return early

                if ((target.abilities.includes('Sturdy') || target?.held_item?.name == 'Focus Sash') && target.hp.current == target.hp.max && damage >= target.hp.max) {
                    damage = target.hp.max - 1
                    await this.applyDamage(target, damage);
                    this.info_text = `${target.name}'s ${target.abilities.includes('Sturdy') ? 'Sturdy ability' : 'Focus Sash item'} prevented him from going down in a single hit`
                    if (target.held_item.name == 'Focus Sash') {
                        target.held_item = null
                    }
                    await this.delay(this.info_text.length * this.config.text_speed + 500);

                } else {
                    await this.applyDamage(target, damage);
                    if (this.additional_info_text) {
                        this.info_text = this.additional_info_text
                        await this.delay(this.info_text.length * this.config.text_speed + 500);
                    }
                    this.additional_info_text = null
                }
            }
        }

        if (move.repetitions > 1) {
            this.info_text = `${move.name} has hit ${move.repetitions} times!`
            await this.delay(this.info_text.length * this.config.text_speed + 500);
        }






        if (move.effects) {
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
                        await allAnimations.status_animation(move_target.player_controlled, 'confused')
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

                } else if (effect.type == 'remove_berry') {
                    if (target.held_item && target.held_item.name.includes('Berry')) {
                        this.info_text = `${move.name}'s has destroyed ${target.name}'s ${target.held_item.name}!`
                        await this.delay(this.info_text.length * this.config.text_speed + 500);
                        target.held_item = null


                    }



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
                if (target.abilities.includes('Shell Armor')) {
                    this.info_text = `${target.abilities[0]} prevented the critical hit!`
                } else {
                    this.info_text = `${move.name} has striked a critical hit!`
                }
                await this.delay(this.info_text.length * this.config.text_speed + 500)
            }

            //check boost stat on hit



            // check if any super effective text needs to be displayed

            if (this.checkSuperEffectiveInfo(move, target)) {
                let result = this.checkSuperEffectiveInfo(move, target)
                this.info_text = result.info_text
                await this.delay(result.pause)
            }

            // check contact abilities
            if (move.makes_contact && !caster.status && (target.abilities.includes('Static') || target.abilities.includes('Effect Spore') || target.abilities.includes('Poison Point'))) {
                let apply_eff_chance = Math.random() < 0.3
                if (apply_eff_chance) {
                    if (target.abilities.includes('Static') && !caster.types.includes('electric')) {
                        caster.status = 'paralyzed'
                        caster.speed.effective = caster.speed.current * 0.5
                    } else if (target.abilities.includes('Effect Spore')) {
                        const possible_statuses = ['paralyzed', 'asleep', 'poisoned']
                        const random_index = Math.floor(Math.random() * 3)
                        if (!this.checkStatusEffectPrevent(possible_statuses[random_index], caster)) {
                            caster.status = possible_statuses[random_index]
                            if (caster.status == 'paralyzed') {
                                caster.speed.effective = caster.speed.current * 0.5
                            } else if (caster.status == 'asleep') {
                                let sleeping_turns = Math.floor(Math.random() * 3) + 1
                                caster.sleeping_turns = {
                                    total: sleeping_turns,
                                    passed: 0
                                }
                            }
                        }

                    } else if (target.abilities.includes('Poison Point') && !caster.types.includes('poison') && !caster.types.includes('steel')) {
                        caster.status = 'poisoned'
                    }
                    store.info_text = `${caster.name} has been ${caster.status} cause of ${target.name}'s ${target.abilities[0]}`
                    await this.delay(this.info_text.length * this.config.text_speed + 500);

                    if (caster.held_item && caster.held_item.name == 'Lum Berry') {
                        this.info_text = `${caster.name} is no longer ${caster.status} after consuming his Lum Berry`
                        // if status was paralyzed, restore speed
                        if (caster.status == 'paralyzed') {
                            caster.speed.effective += caster.speed.current * 0.5
                        }
                        caster.held_item = null
                        caster.status = null
                        await this.delay(this.info_text.length * this.config.text_speed + 500);
                    }




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
        if (!move) {
            return 0
        }

        //doubling move.power directly was casuing bugs cause the doubling was  permanent
        let move_effective_power = move.power || 0

        if (move.name == 'Seismic Toss' || move.name == 'Night Shade') {
            return caster.level
        } else if (!move.power) {
            return 0
        }

        if (move.name == 'Low Kick') {
            move_effective_power = this.calcPowerBasedOnTargetWeight(target)
        }

        if (move.name == 'Brine' && target.hp.current < target.hp.max / 2 || move.name == 'Hex' && target.status !== null || move.name == 'Venoshock' && target.status == 'poisoned') {
            move_effective_power *= 2
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
            (((caster.level * 2 / 5) + 2) * move_effective_power * (offensive_stat / defensive_stat) / 50) * pb * effectiveness + 2 * random
        if (crhit) {
            damage_equation *= 1.5
        }
        if (caster.status == 'burned' && move.category == 'physical' && !caster.abilities.includes('Guts')) {
            damage_equation *= 0.5
        }
        if (caster_pinched && ((caster.abilities.includes('Overgrow') && move.type == 'grass') || (caster.abilities.includes('Swarm') && move.type == 'bug') || (caster.abilities.includes('Torrent') && move.type == 'water') || (caster.abilities.includes('Blaze') && move.type == 'fire'))) {

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
                    no_effect: ['']
                },
                poison: {
                    not_effective: ['poison', 'ground', 'rock', 'ghost'],
                    super_effective: ['grass', 'fairy'],
                    no_effect: ['steel']
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
                    not_effective: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
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
                    not_effective: ['electric', 'grass', 'dragon'],
                    super_effective: ['flying', 'water'],
                    no_effect: ['ground']
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
            target.damage += Math.floor(damage)
            if (target.damage > target.hp.max) {
                target.damage = target.hp.max + 1
            } else if (target.damage < 0) {
                target.damage = 0
            }


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

    // SECTION FOR AI DECISION MAKING````○`
    calcAiBestMove() {
        let selected_move = undefined;
        let most_damage_move = this.highestAiDmgMove(this.oppo_pokemon);
        let ai_healign_move = null
        let high_prio_move = null
        let ai_is_slower = this.oppo_pokemon.speed.effective <= this.my_pokemon.speed.effective
        let best_player_move = this.playerHighestDmgMove()
        let player_has_fast_kill = best_player_move.expected_dmg > this.oppo_pokemon.hp.current && ai_is_slower


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

        //if ai is gonna get fast killed he may as well go for the high prio move

        if (player_has_fast_kill && high_prio_move) {
            selected_move = high_prio_move
        }
        //If Ai is slower but has a kill with an higher prio move, always go for it

        else if (ai_is_slower && high_prio_move && this.calcDamage(high_prio_move, this.oppo_pokemon, this.my_pokemon, false, false) >= this.my_pokemon.hp.current) {
            selected_move = high_prio_move
        }
        // Check if highest damage move could kill or deals at least 50% max HP damage
        else if ((most_damage_move.could_kill || most_damage_move.expected_dmg > this.my_pokemon.hp.max * 0.4)) {
            selected_move = most_damage_move.move;
        }

        //AI doenst have an highly damaging move and its below 50% hp, while holding an healing move
        else if (this.oppo_pokemon.hp.current < this.oppo_pokemon.hp.max * 0.5 && ai_healign_move) {

            selected_move = ai_healign_move
        }
        else {
            // Check for status moves if opponent doesn't have a status condition
            if (!this.my_pokemon.status) {
                let bestStatusMove = undefined;
                this.oppo_pokemon.moves.forEach(move => {

                    if (move.effects && typeof move.effects[Symbol.iterator] === 'function') {

                        move.effects.forEach(effect => {
                            if (effect.type === 'apply_status' && effect.target === 'enemy' && move.pp.current > 0 && !this.checkStatusEffectPrevent(effect.applied_status, this.my_pokemon)) {
                                // Select move with higher accuracy
                                if (!bestStatusMove || move.accuracy > bestStatusMove.accuracy) {
                                    bestStatusMove = move;
                                }
                            }
                        });
                    }
                });

                if (bestStatusMove) {
                    selected_move = bestStatusMove;
                }
            }

            // Fallback to highest damage move if no status move is selected
            if (!selected_move) {
                selected_move = most_damage_move.move;
            }
        }

        // if move doenst have more pp, use more dmg move or a random one with pp
        if (selected_move.pp.current <= 0) {
            selected_move = most_damage_move.move;
            if (selected_move.pp.current <= 0) {
                selected_move = this.oppo_pokemon.moves.find((move) => {
                    return move.pp.current > 0
                })
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
            if (this.checkDamagePrevent(move, pkmn, this.my_pokemon, true)) {
                expected_damage = 0
            }


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

        for (const move of shuffled_moves) {
            let expected_damage = this.calcDamage(move, this.my_pokemon, this.oppo_pokemon, false);


            if (this.checkDamagePrevent(move, this.my_pokemon, this.oppo_pokemon, true)) {
                expected_damage = 0;
            }

            if (expected_damage > highest_dmg_move.expected_dmg) {
                highest_dmg_move.move = move;
                highest_dmg_move.expected_dmg = expected_damage;
                highest_dmg_move.can_kill = expected_damage >= this.oppo_pokemon.hp.current;
            }
        }


        return highest_dmg_move;
    },

    playerHighestDmgMoveOnGivenTarget(target) {
        let highest_dmg_move = {
            expected_dmg: 0,
            move: null,
            can_kill: false
        };

        let shuffled_moves = this.shuffleArray(this.my_pokemon.moves.slice());

        for (const move of shuffled_moves) {
            let expected_damage = this.calcDamage(move, this.my_pokemon, target, false);

            if (this.checkDamagePrevent(move, this.my_pokemon, this.oppo_pokemon, true)) {
                expected_damage = 0;
            }

            if (expected_damage > highest_dmg_move.expected_dmg) {
                highest_dmg_move.move = move;
                highest_dmg_move.expected_dmg = expected_damage;
                highest_dmg_move.can_kill = expected_damage >= target.hp.current;
            }
        }

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
            if (this.checkDamagePrevent(player_move.move, this.my_pokemon, ai_pokemon, true)) {

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
        if (this.oppo_bench.length == 0 || this.my_pokemon.status == 'frozen') return false
        let predicted_player_move = this.playerHighestDmgMove()

        let highest_dmg_ai_move = this.highestAiDmgMove(this.oppo_pokemon)
        let threatening_dmg_expected = false
        let ai_has_high_dmg_move = false
        let wants_to_swap = false
        let possible_swap = this.bestAiSwap(predicted_player_move)
        let ai_is_slower = this.oppo_pokemon.speed.effective <= this.my_pokemon.speed.effective
        let possible_swap_is_faster = possible_swap.pokemon.speed.effective > this.my_pokemon.speed.effective

        //the human player is considered to have a threatening damage move if the dmg  output is higher than 50% of the AI pokemon max hp
        if (predicted_player_move.expected_dmg > this.oppo_pokemon.hp.max * 0.5) {

            threatening_dmg_expected = true
        }
        // The ai is considered to have an high dmg output move if that move is gonna deal more than 50% of the max hp of the pokemon
        if (highest_dmg_ai_move.expected_dmg > this.my_pokemon.hp.max * 0.5) {
            ai_has_high_dmg_move = true
        }

        // The ai wants to swap if its expecting an high damage output from the player and has a benched pokemon uneffected from the predicted move
        if (threatening_dmg_expected && possible_swap.predicted_dmg_tanked == 0) {

            wants_to_swap = true
        }

        // THE ai always wants to swap if the human player can kill his pokemon, he is slower and has a pokemon on the bench whose gonna take less than 40% max hp as dmg, and is gonna outspeed the current target

        else if (predicted_player_move.can_kill && ai_is_slower && possible_swap.predicted_dmg_tanked <= possible_swap.pokemon.hp.current * 0.4 && possible_swap_is_faster) {
            wants_to_swap = true
            // console.log('ai wanted to swap cause', predicted_player_move.move.name, 'is about to deal', predicted_player_move.expected_dmg, 'His swap options is', possible_swap.pokemon.name, 'which should take around', possible_swap.predicted_dmg_tanked)
        }


        else if (predicted_player_move.can_kill && ai_is_slower && possible_swap.predicted_dmg_tanked <= possible_swap.pokemon.hp.current * 0.15 && !this.wouldGetFastKilledAfterSwap(possible_swap.pokemon, this.my_pokemon, possible_swap.predicted_dmg_tanked)) {
            wants_to_swap = true
            // console.log('ai wanted to swap cause', predicted_player_move.move.name, 'is about to deal', predicted_player_move.expected_dmg, 'His swap options is', possible_swap.pokemon.name, 'which should take around', possible_swap.predicted_dmg_tanked)
        }


        // The ai never wants to swap if he is faster and has a kill on the opponent pokemon

        if (highest_dmg_ai_move.expected_dmg > this.my_pokemon.hp.current && !ai_is_slower) {
            // console.log('ai doenst want to swap cause he thinsk hes faster and can kill')
            wants_to_swap = false
        }

        if (wants_to_swap && possible_swap.pokemon) {
            // console.log('ai decided to swap')
            return possible_swap.pokemon
        } else {
            // console.log('ai decided to not swap')
            return false
        }
    },
    bestAfterFaint() {
        let new_pkmn;
        let highest_priority = -Infinity; // Initialize priority to lowest possible value
        let highest_dmg_move = {
            move: null,
            expected_dmg: 0
        }

        this.oppo_bench.forEach((pkmn) => {
            let best_move = this.highestAiDmgMove(pkmn);
            let best_player_move = this.playerHighestDmgMoveOnGivenTarget(pkmn);
            let pkmn_is_slower = pkmn.speed.effective < this.my_pokemon.speed.effective;
            let player_has_fast_kill = best_player_move.expected_dmg > pkmn.hp.current && pkmn_is_slower;



            // Calculate priority based on expected damage and likelihood of being fast killed
            let priority = 0; // Initialize priority to 0
            if (!player_has_fast_kill) {
                priority = best_move.expected_dmg;
                if (!pkmn_is_slower) { // Give more priority to faster Pokémon
                    priority += 10; // Increase priority by a certain amount (adjust as needed)
                }
            }

            if (priority > highest_priority) {
                highest_priority = priority;
                highest_dmg_move.move = best_move;
                highest_dmg_move.expected_dmg = best_move.expected_dmg;
                new_pkmn = pkmn;
            }
        });

        if (!new_pkmn) {
            new_pkmn = this.oppo_bench[0];
        }

        return new_pkmn;
    },
    wouldGetFastKilledAfterSwap(target, attacker, expected_damage_on_swap) {

        let best_move_on_target = this.playerHighestDmgMoveOnGivenTarget(target)
        let target_left_hp = target.hp.current - expected_damage_on_swap
        let target_is_slower = target.speed.current < attacker.speed.current
        if (target_is_slower && best_move_on_target.expected_dmg > target_left_hp) {
            return true
        } else {
            return false
        }

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
        let random_chance = Math.floor(Math.random() * 100)
        //return early  with no additional message if stat modifier was conditional to a chance that didnt realize
        if (move_effect.chance && move_effect.chance < random_chance) {
            return ''
        }

        await allAnimations.stat_change(target.sprite, move_effect.stages > 0)
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
    },
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
        //some types cannot be affected by certain status effects
        if (
            (effect.applied_status == 'poisoned' && (target.types.includes('poison') || target.types.includes('steel'))) ||
            (effect.applied_status == 'paralyzed' && target.types.includes('electric')) ||
            (effect.applied_status == 'burned' && target.types.includes('fire'))
        ) {
            store.info_text = `${target.name} cannot be ${effect.applied_status}`
            await this.delay(store.info_text.length * this.config.text_speed + 500)
            return false;
        }

        if (target.status !== null) {
            store.info_text = `${target.name} is already ${target.status} and other status conditions cannot be applied`
            await this.delay(store.info_text.length * this.config.text_speed + 500)
            return false
        }

        let random_chance = Math.floor(Math.random() * 100)
        let status_applied = false
        if (effect.chance >= random_chance) {
            if (1 == 1) {
                if (target.status !== effect.applied_status) {
                    target.status = effect.applied_status
                    status_applied = true
                    await allAnimations.status_animation(target.player_controlled, effect.applied_status)
                    if (effect.applied_status == 'asleep') {
                        let sleeping_turns = Math.floor(Math.random() * 3) + 1
                        target.sleeping_turns = {
                            total: sleeping_turns,
                            passed: 0
                        }
                    } else if (effect.applied_status == 'paralyzed' && !target.types.includes('electric')) {
                        target.speed.effective = target.speed.current * 0.5
                        if (target.ability == 'Synchronize' && !target.status) {
                            caster.status == 'paralyzed'
                        }
                    } else if (effect.applied_status == 'burned' && !target.types.includes('fire')) {
                        if (target.ability == 'Synchronize' && !target.status) {
                            caster.status == 'burned'
                        }
                    } else if (effect.applied_status == 'poisoned' && !target.types.includes('poison') && !caster.types.includes('steel')) {
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
        let random_chance = Math.floor(Math.random() * 100)
        if (effect.chance <= random_chance) {
            return false
        }
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
        if (target.abilities.includes('Inner Focus')) {
            return
        }
        let random_chance = Math.floor(Math.random() * 100)

        if (effect.chance > random_chance) {

            target.flinched = true
        }
    },
    async endTurn() {

        this.my_pokemon.flinched = false
        this.oppo_pokemon.flinched = false



        if (!this.my_pokemon.fainted) {
            if (this.my_pokemon.status == 'poisoned' || this.my_pokemon.status == 'burned') {
                let dot_dmg = this.my_pokemon.hp.max / 8;

                this.info_text = `${this.my_pokemon.name} is ${this.my_pokemon.status} and will lose hp`;
                await this.delay(this.info_text.length * this.config.text_speed + 500);
                await allAnimations.status_animation(true, this.my_pokemon.status)
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
                    await allAnimations.status_animation(true, 'frozen')
                }
            }
            //improve this logic
            if (this.my_pokemon.held_item && !this.my_pokemon.fainted) {
                if (this.my_pokemon.hp.current < this.my_pokemon.hp.max * 0.5 && this.my_pokemon.held_item.name == 'Sitrus Berry') {
                    this.info_text = `${this.my_pokemon.name} will eat his Sitrus Berry and restore some of his hp`;
                    this.my_pokemon.held_item = null
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                    await this.applyDamage(this.my_pokemon, ((this.my_pokemon.hp.max * 0.25) * -1))

                } else if (this.my_pokemon.hp.current < this.my_pokemon.hp.max && this.my_pokemon.held_item.name == 'Leftovers') {
                    this.info_text = `${this.my_pokemon.name} will eat his Leftovers and restore some of his hp`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                    await this.applyDamage(this.my_pokemon, ((this.my_pokemon.hp.max * 0.0625) * -1))
                }
            }


        }
        if (!this.oppo_pokemon.fainted) {
            if (this.oppo_pokemon.status == 'poisoned' || this.oppo_pokemon.status == 'burned') {

                let dot_dmg = this.oppo_pokemon.hp.max / 8;
                this.info_text = `${this.oppo_pokemon.name} is ${this.oppo_pokemon.status} and will lose hp`;
                await this.delay(this.info_text.length * this.config.text_speed + 500);
                await allAnimations.status_animation(false, this.oppo_pokemon.status)
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
                    await allAnimations.status_animation(false, 'frozen')
                }
            }
            if (this.oppo_pokemon.held_item && !this.oppo_pokemon.fainted) {

                if (this.oppo_pokemon.hp.current < this.oppo_pokemon.hp.max * 0.5 && this.oppo_pokemon.held_item.name == 'Sitrus Berry') {
                    this.info_text = `${this.oppo_pokemon.name} will eat his Sitrus Berry and restore some of his hp`;
                    this.oppo_pokemon.held_item = null
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                    await this.applyDamage(this.oppo_pokemon, ((this.oppo_pokemon.hp.max * 0.25) * -1))
                } else if (this.oppo_pokemon.hp.current < this.oppo_pokemon.hp.max && this.oppo_pokemon.held_item.name == 'Leftovers') {
                    this.info_text = `${this.oppo_pokemon.name} will eat his Leftovers and restore some of his hp`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                    await this.applyDamage(this.oppo_pokemon, ((this.oppo_pokemon.hp.max * 0.0625) * -1))
                }
            }
        }

        if (this.my_pokemon.fainted && this.my_bench.length == 0) {

            this.info_text = `All of your pokemons died, you're gonna get killed as well`;
            await this.delay(this.info_text.length * this.config.text_speed + 500);
            window.location.reload()
            return

        } else {

            if (this.oppo_pokemon.fainted) {
                if (this.battle_type == 'trainer' && this.oppo_bench.length > 0) {
                    const next_pokemon = this.bestAfterFaint()
                    this.info_text = `${this.oppo_trainer.name}'s next pokemon will be ${next_pokemon.name}`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                    await this.battle_scene_instance.changeOpponentPokemonSprite(next_pokemon)
                } else {
                    this.info_text = `${this.oppo_pokemon.name} died and you won the battle ${this.battle_type == 'trainer' ? 'against ' + this.oppo_trainer.name + `and you earned  ${this.calcReward(this.oppo_trainer)} $` : ''}`;
                    if (this.battle_type == 'trainer') {
                        this.defeated_npcs.push(this.oppo_trainer.id)
                        this.my_money += this.calcReward(this.oppo_trainer)

                    }

                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                    // window.location.reload()

                    map_store.world_scene_istance.scene.start(SCENE_KEYS.WORLD_SCENE)
                    this.endBattle()
                    return
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
            if (!caster.abilities.includes('Rock Head')) {
                let recoil_dmg = damage * effect.amount
                await this.applyDamage(caster, recoil_dmg)
                this.info_text = `${caster.name}'s took some damage back in recoil`
                await this.delay(this.info_text.length * this.config.text_speed + 500);
                if (caster.hp.current <= 0) {
                    this.faint_logic(caster, target)
                }
                return
            } else {
                this.info_text = `${caster.name}'s Rock Head prevented any recoil damage`
                await this.delay(this.info_text.length * this.config.text_speed + 500);
            }

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
            await allAnimations.status_animation(caster.player_controlled, 'confused')
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
            await allAnimations.status_animation(caster.player_controlled, 'paralyzed')
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

            //lock for level cap
            if (gonna_level_up && gainer.level >= this.level_cap) {
                amount = 0
                gonna_level_up = false
            }

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

            if (await this.add_experience(caster, experience_gain) && caster.level < this.level_cap) {
                this.info_text = `${caster.name} has reached level ${caster.level}`;
                await this.delay(this.info_text.length * this.config.text_speed + 300);
                this.handle_level_up(caster)
            }

        }
    },
    checkDamagePrevent(move, caster, target, simulation) {
        if (!move || !move.power) {
            return false;
        }

        const abilityEffects = {
            'Storm Drain': { type: 'water', stat: 'sp_atk', label: 'special attack' },
            'Sap Sipper': { type: 'grass', stat: 'atk', label: 'attack' },
            'Water Absorb': { type: 'water', heal: true, healFraction: 0.25 }
        };

        const effectiveness = this.checkEffectiveness(move.type, target.types);

        if (effectiveness === 0) {
            if (!simulation) {
                this.additional_info_text = `${target.name}'s is unaffected by ${move.name}`;
            }
            return true;
        }

        for (let ability in abilityEffects) {
            const effect = abilityEffects[ability];

            if (target.abilities.includes(ability) && move.type === effect.type) {
                if (!simulation) {
                    if (ability === 'Water Absorb') {
                        const healedAmount = Math.round(target.hp.max * effect.healFraction);
                        target.hp.current += healedAmount;
                        this.additional_info_text = `${target.name} absorbed the ${move.type}-type attack and healed ${healedAmount} HP with Water Absorb!`;
                    } else if (ability === 'Sap Sipper' || ability === 'Storm Drain') {
                        const fake_effect = {
                            type: 'modify_stat',
                            target_stat: effect.stat,
                            target: 'ally',
                            stages: +1,
                            target_stat_label: effect.label
                        };
                        this.modifyStat(fake_effect, target);
                        this.additional_info_text = `${target.name}'s ${fake_effect.target_stat_label} rose thanks to ${ability}`;
                    }
                }
                return true;
            }
        }

        if (!simulation && this.checkEffectiveness(move.type, target.types) === 0) {
            this.additional_info_text = `${target.name}'s is unaffected by ${move.name}`;
        }

        return false;
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
            //this is done due to bug of caught pokemon not having methods
            let oppo_copy = this.generateSaveCopy(store.oppo_pokemon)
            if (this.my_bench.length < 3) {
                this.my_bench.push(map_store.retrivePokemonData(oppo_copy))
            } else {
                this.my_box.push(map_store.retrivePokemonData(oppo_copy))
            }

            this.caught_mons.push(store.oppo_pokemon.pokemon_number)

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
        let possible_trainer_pokemons = [Pokemons.zigzagoon, Pokemons.ralts, Pokemons.wingull, Pokemons.poochyena, Pokemons.electrike, Pokemons.meowth, Pokemons.starly, Pokemons.nidoran]
        if (this.level_cap > 16) {
            possible_trainer_pokemons = [Pokemons.kirlia, Pokemons.kricketune, Pokemons.beautifly, Pokemons.linoone, Pokemons.staravia, Pokemons.nidorino, Pokemons.mightyena, Pokemons.carvanha]
        }
        //trainers pokemons can hold random items
        const possible_trainer_items = [all_items.lum_berry, all_items.sitrus_berry]
        const my_pokemons = [];
        // trainers pokemons will have an average level which is randomly even to 2 level lower compared to the average
        my_pokemons.push(this.my_pokemon);
        const allPokemons = my_pokemons.concat(this.my_bench);
        const allLevels = allPokemons.map(pokemon => pokemon.level);
        const highestLevel = Math.max(...allLevels);


        let random_trainer_lead
        let random_trainer_bench = []
        let rand_lead = deepClone(possible_trainer_pokemons[Math.floor(Math.random() * possible_trainer_pokemons.length)])
        random_trainer_lead = rand_lead
        random_trainer_lead.level = Math.floor(Math.random() * 3) + highestLevel - 2;
        for (let i = 0;i < store.my_bench.length;i++) {
            let rand_pokemon = deepClone(possible_trainer_pokemons[Math.floor(Math.random() * possible_trainer_pokemons.length)])
            if (!rand_pokemon) {
                rand_pokemon = deepClone(Pokemons.zigzagoon)
            }

            rand_pokemon.level = Math.floor(Math.random() * 3) + highestLevel - 2;
            random_trainer_bench.push(rand_pokemon)
        }



        //enemy mons have random moves
        const moveKeys = Object.keys(all_moves);
        random_trainer_lead.held_item = possible_trainer_items[Math.random() * possible_trainer_items.length]
        random_trainer_lead.learnable_moves.forEach(({ at_level, move }) => {
            if (at_level <= random_trainer_lead.level) {
                // Check if the move is already known
                if (!random_trainer_lead.moves.some(pokemonMove => pokemonMove.name === move.name)) {
                    // If pokemon already has 4 moves, replace the earliest learned move
                    if (random_trainer_lead.moves.length >= 4) {
                        // Find the earliest learned move
                        const earliestMoveIndex = random_trainer_lead.moves.reduce((earliestIndex, move, currentIndex, moves) => {
                            if (moves[earliestIndex].learned_at > move.learned_at) {
                                return currentIndex;
                            }
                            return earliestIndex;
                        }, 0);

                        // Replace the earliest move with the new move
                        random_trainer_lead.moves.splice(earliestMoveIndex, 1, deepClone(move));
                    } else {
                        // If pokemon has less than 4 moves, simply add the move
                        random_trainer_lead.moves.push(deepClone(move));
                    }
                }
            }
        });

        random_trainer_bench.forEach((pokemon) => {
            // Trainers' pokemons can hold random items
            pokemon.held_item = possible_trainer_items[Math.floor(Math.random() * possible_trainer_items.length)];

            // Determine the current level of the pokemon
            const currentLevel = pokemon.level;

            // Iterate over learnable moves and add them if the pokemon's level is appropriate
            pokemon.learnable_moves.forEach(({ at_level, move }) => {
                if (at_level <= currentLevel) {
                    // Check if the move is already known
                    if (!pokemon.moves.some(pokemonMove => pokemonMove.name === move.name)) {
                        // If pokemon already has 4 moves, replace the earliest learned move
                        if (pokemon.moves.length >= 4) {
                            // Find the earliest learned move
                            const earliestMoveIndex = pokemon.moves.reduce((earliestIndex, move, currentIndex, moves) => {
                                if (moves[earliestIndex].learned_at > move.learned_at) {
                                    return currentIndex;
                                }
                                return earliestIndex;
                            }, 0);

                            // Replace the earliest move with the new move
                            pokemon.moves.splice(earliestMoveIndex, 1, deepClone(move));
                        } else {
                            // If pokemon has less than 4 moves, simply add the move
                            pokemon.moves.push(deepClone(move));
                        }
                    }
                }
            });
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
        //bandaid for trainer_scale
        let trainer_scale = 0.12

        switch (chosen_name) {
            case 'bug catcher':
                trainer_scale = 0.3
                break;
            case 'guard':
                trainer_scale = 0.12
                break;
            default:
                trainer_scale = 0.12
        }

        let random_trainer = new Trainer({
            name: rand_trainer_name,
            lead: random_trainer_lead,
            bench: random_trainer_bench,
            position: {
                x: 950,
                y: 320
            },
            scale: trainer_scale,
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
        let possibleEncounters = mapData.possible_encounters;
        // Filter out the Pokémon from possibleEncounters whose numbers are not included in caughtPokemonNumbers

        //NOTE - THIS CAN BE REMOVED TO DECREASE GAME DIFFICULTY
        let caughtPokemonNumbers = this.caught_mons;
        if (this.config.rules.only_one_pokemon_per_type) {
            possibleEncounters = possibleEncounters.filter(pokemon => !caughtPokemonNumbers.includes(pokemon.pokemon_number));
        }



        // Calculate total encounter chance
        // const totalChance = possibleEncounters.reduce((acc, encounter) => acc + encounter.chance, 0);

        // // Generate a random number to select the encounter
        // const randomChance = Math.random() * totalChance;
        // let random_encounter = null; // Initialize with null

        // // Loop through encounters and select one based on chance
        // let accumulatedChance = 0;
        // for (const encounter of possibleEncounters) {
        //     accumulatedChance += encounter.chance;
        //     if (randomChance < accumulatedChance) {
        //         random_encounter = encounter.pokemon;

        //         break; // Break out of the loop once random_encounter is set
        //     }
        // }
        let random_index = Math.floor(Math.random() * possibleEncounters.length)
        let random_encounter = possibleEncounters[random_index]

        // If no encounter is selected, set random_encounter to the last encounter
        if (!random_encounter) {
            random_encounter = Pokemons.zigzagoon
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
        if (!obj) {
            return null
        }
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
            current_xp: obj.xp.total || 0,
            held_item: obj.held_item ? obj.held_item.name : null
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
    async checkLearnableMoves(pkmn) {

        return new Promise(resolve => {
            pkmn.learnable_moves.forEach(async (move, index) => {

                if (move.at_level == pkmn.level && !this.checkIfMoveAlreadyLearned(move.move, pkmn)) {
                    if (pkmn.moves.length < 4) {
                        pkmn.moves.push(move.move)
                        pkmn.learnable_moves.splice(index, 1)

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
    async checkPossibleEvolution(pkmn) {
        if (pkmn.evolution && pkmn.evolution.at_level <= pkmn.level) {
            let old_pokemon = { ...pkmn }
            let new_pkmn = pkmn.evolution.into
            await this.playPokemonEvolutonScene(old_pokemon, new_pkmn)
            return true
        } else {
            return false
        }
    },
    async playPokemonEvolutonScene(old_pokemon, evolved_pokemon) {
        map_store.show_inventory_menu = false
        map_store.show_menu = false
        return new Promise(async resolve => {
            let evolution_scene = document.createElement('div')
            let app = document.getElementById('app')
            let pokemon_img = new Image()
            store.menu_state = 'text'
            store.info_text = `Wait...${old_pokemon.name} is evolving...`

            map_store.world_scene_istance.sound.stopAll();
            map_store.world_scene_istance.sound.play('evolution-sound', {
                loop: false,
                volume: 0.1
            })
            pokemon_img.src = `/pokemons/${old_pokemon.name.toLowerCase()}.gif`
            gsap.set(pokemon_img, { scale: 1.5 })
            evolution_scene.classList.add('evolution-scene')
            app.append(evolution_scene)
            evolution_scene.append(pokemon_img)
            await this.delay(2000)
            gsap.to(pokemon_img, {
                scale: 0.1,
                duration: 0.7,
                repeat: 16,
                filter: 'brightness(5)',
                yoyo: true,
                onComplete: () => {
                    pokemon_img.src = `/pokemons/${evolved_pokemon.name.toLowerCase()}.gif`;
                    gsap.to(pokemon_img, {
                        scale: 1.5,
                        duration: 5,
                        filter: 'brightness(1)',
                        yoyo: true,
                        onComplete: () => {
                            store.info_text = `Congratulaions, your ${old_pokemon.name} evolved into ${evolved_pokemon.name}`
                            setTimeout(() => {
                                map_store.world_scene_istance.sound.stopAll();
                                map_store.world_scene_istance.sound.play(AUDIO_ASSETS_KEY.WORLD, {
                                    loop: false,
                                    volume: 0.1
                                })
                                store.menu_state = 'hidden'
                                store.info_text = ''
                                evolution_scene.remove()
                                resolve()
                            }, 4500)
                        }


                    });
                },

            });
        })
    },
    async displayInfoText(text) {
        this.info_text = text
        await this.delay(this.info_text.length * this.config.text_speed + 500)
        return
    },
    evolvePokemon(pkmn, evolution) {
        let old_pokemon = { ...pkmn }


        pkmn = deepMerge(pkmn, evolution)
        pkmn.level = old_pokemon.level
        pkmn.status = old_pokemon.status
        pkmn.moves = old_pokemon.moves
        pkmn.xp.total = old_pokemon.xp.total
        pkmn.learnable_moves = evolution.learnable_moves
        pkmn.nature = old_pokemon.nature
        pkmn.held_item = old_pokemon.held_item
        pkmn.hp = evolution.hp
        pkmn.atk = evolution.atk
        pkmn.def = evolution.def
        pkmn.sp_atk = evolution.sp_atk
        pkmn.sp_def = evolution.sp_def
        pkmn.damage = old_pokemon.damage
        pkmn.learnable_moves = pkmn.learnable_moves.filter(move => move.at_level >= pkmn.level)
        this.calcStats(pkmn)


    },
    shop_event: async function (listing) {
        map_store.show_shop_menu = true
        map_store.current_shop_listing = listing
        map_store.talking_npc = all_npcs.merchant
    },
    calcReward(trainer) {
        let reward = 0;
        let base_reward = 40;
        let trainer_pokemons = trainer.bench.concat(trainer.lead);


        let totalStatTotal = 0;
        for (let pokemon of trainer_pokemons) {
            totalStatTotal += pokemon.stat_total;
        }
        let averageStatTotal = totalStatTotal / trainer_pokemons.length;

        reward = (averageStatTotal * base_reward) / 30;

        // if (trainer.name == 'archie') {
        //     this.level_cap = 20
        // }
        //Unlock silvarea
        if (trainer.name == 'rayneera') {
            this.defeated_npcs.push(50, 51, 52)
            this.level_cap = 20
        }

        if (trainer.boss) {
            reward *= 2;
        }

        if (trainer.name == 'maxie') {
            setTimeout(() => {
                map_store.show_end_game_screen = true
                map_store.game_won = true
                this.endBattle()
                return
            }, 2000)

        }

        return Math.round(reward);
    },
    checkStatusEffectPrevent(status, target) {
        if (status == 'poisoned' && (target.types.includes('poison') || target.types.includes('steel'))) {
            return true
        } else if (status == 'paralyzed' && target.types.includes('electric')) {
            return true
        } else if (status == 'burned' && target.types.includes('fire')) {
            return true
        } else {
            return false
        }
    },
    checkIfMoveAlreadyLearned(move, pokemon) {

        return pokemon.moves.some(pokemonMove => pokemonMove.name === move.name);
    },
    setLevel: function (level) {
        if (level == 'HARDCORE') {
            if (!this.defeated_npcs.includes(40)) {
                this.level_cap = 15
            } else {
                this.level_cap = 20
            }


            this.config.rules.items_in_battle_allowed = false
            this.config.rules.only_one_pokemon_per_type = true
            this.config.rules.pokemon_dead_after_ko = true
            map_store.starter_choices = [deepClone(Pokemons.drilbur), deepClone(Pokemons.aron), deepClone(Pokemons.cubchoo)]
        } else if (level == 'MEDIUM') {
            if (!this.defeated_npcs.includes(40)) {
                this.level_cap = 15
            } else {
                this.level_cap = 20
            }
            this.config.rules.items_in_battle_allowed = true
            this.config.rules.only_one_pokemon_per_type = true
            this.config.rules.pokemon_dead_after_ko = true
            map_store.starter_choices = [deepClone(Pokemons.torchic), deepClone(Pokemons.treecko), deepClone(Pokemons.mudkip)]
        } else if (level == 'EASY') {
            if (!this.defeated_npcs.includes(40)) {
                this.level_cap = 16
            } else {
                this.level_cap = 20
            }
            this.config.rules.items_in_battle_allowed = true
            this.config.rules.only_one_pokemon_per_type = false
            this.config.rules.pokemon_dead_after_ko = false
            map_store.starter_choices = [deepClone(Pokemons.torchic), deepClone(Pokemons.treecko), deepClone(Pokemons.mudkip)]
        }
    },
    calcBulletSeedHits: function () {
        // Define the probabilities and corresponding number of hits
        const probabilities = [3 / 8, 3 / 8, 1 / 8, 1 / 8];
        const hits = [2, 3, 4, 5];

        // Generate a random number between 0 and 1
        const rand = Math.random();


        // Calculate the cumulative probability
        let cumulativeProbability = 0;
        for (let i = 0;i < probabilities.length;i++) {
            cumulativeProbability += probabilities[i];
            if (rand < cumulativeProbability) {
                return hits[i]; // Return the corresponding number of hits
            }
        }

        // This line should never be reached, but just in case
        return hits[hits.length - 1];
    }









    //TODO - , possible learned moves, possible evolutions



});



