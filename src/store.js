import { reactive, computed } from 'vue';
import { Pokemons } from './js/db/pokemons.mjs';
import { BattleScene } from './js/scenes/battle-scene.mjs';
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

export const store = reactive({
    my_pokemon: deepClone(Pokemons.treecko),
    oppo_pokemon: deepClone(trainers.roxanne.lead),
    my_bench: [deepClone(Pokemons.mudkip), deepClone(Pokemons.torchic)],
    oppo_trainer: trainers.roxanne,
    oppo_bench: [deepClone(trainers.roxanne.bench[0]), deepClone(trainers.roxanne.bench[1])],
    menu_state: 'text',
    info_text: ``,
    additional_info_text: null,
    battle_events: [],
    battle_sequence_playing: false,
    battle_scene_instance: undefined,
    multiplayer_battle: false,
    my_socket_id: undefined,
    battle_type: 'trainer',
    config: {
        text_speed: 20,
        play_move_animation: true,
    },



    useMove: async function (move, caster, target, player_attack) {

        this.menu_state = 'text';
        //return  early if pokemon  is fainted
        if (caster.fainted) return
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
        if (caster.confused && ! await this.attackingWhileConfused(caster)) {
            return
        }

        // pay pp cost
        move.pp.current = move.pp.current - 1
        // Display move text
        let moveText = `${player_attack ? '' : 'Enemy'} ${caster.name} uses ${move.name}`;
        this.menu_state = 'text';
        this.info_text = moveText;
        await this.delay(this.info_text.length * this.config.text_speed + 500);
        // account for animations  I didn't code yet
        if (move.animation && this.config.play_move_animation) {
            await move.animation(caster.sprite, caster.player_controlled)
        }


        //  check if the ability missed

        if (this.move_missed(move.accuracy, caster.accuracy.effective, target.evasion.effective)) {
            this.info_text = `${move.name} has missed ${target.name}!`
            await this.delay(this.info_text.length * this.config.text_speed + 500);
            return
        }

        //Account for crhit chance
        let crhit = false
        const crhit_chance = Math.random() * 100
        if (crhit_chance < 4.17) {
            crhit = true
        }
        let damage = this.calcDamage(move, caster, target, crhit);


        // Apply damage if its a damaging move
        if (move.power) {
            // check damage prevention effects, if found return early
            if (await this.checkDamagePrevent(move, caster, target)) {
                return
            }
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
                    if (await this.apply_status(effect, move_target) && target.hp.current !== 0) {
                        this.info_text = `${move_target.name} has been ${effect.applied_status}`

                        await this.delay(this.info_text.length * this.config.text_speed + 500);
                    };
                }
                else if (effect.type == 'apply_confusion') {
                    let move_target = effect.target == 'enemy' ? target : caster
                    if (await this.apply_confusion(effect, move_target) && target.hp.current !== 0) {
                        this.info_text = `${move_target.name} has been ${effect.applied_status}`
                        await this.delay(this.info_text.length * this.config.text_speed + 500);
                    };
                } else if (effect.type == 'self_faint') {
                    await this.applyDamage(caster, caster.hp.current)
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

    calcDamage: function (move, caster, target, crhit) {
        if (move.name == 'Seismic Toss') {
            return caster.level
        }
        let caster_pinched = caster.hp.current < caster.hp.max * 0.34
        let offensive_stat = move.category == 'physical' ? caster.atk.effective : caster.sp_atk.effective
        let defensive_stat = move.category == 'physical' ? target.def.effective : target.sp_def.effective
        let pb = caster.types.includes(move.type) ? 1.5 : 1
        let effectiveness = this.checkEffectiveness(move.type, target.types)
        //moves can do 85% to 100% of their maximum damage
        let random = 0.85 + Math.random() * 0.15;
        let damage_equation =
            (((caster.level * 2 / 5) + 2) * move.power * (offensive_stat / defensive_stat) / 50) * pb * effectiveness + 2 * random
        if (crhit) {
            damage_equation *= 1.5
        }
        if (caster.status == 'burned' && move.category == 'physical') {
            damage_equation *= 0.5
        }
        if (caster_pinched && ((caster.abilities.includes('Overgrow') && move.type == 'grass') || (caster.abilities.includes('Torrent') && move.type == 'water') || (caster.abilities.includes('Blaze') && move.type == 'fire'))) {
            this.additional_info_text = `${caster.name}'s ${move.name} dealt more damage thanks to ${caster.abilities[0]}`
            damage_equation *= 1.5
        }
        if (Math.round(damage_equation) > target.hp.current) {
            damage_equation = target.hp.current + 1
        }
        return Math.round(damage_equation)
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

    // SECTION FOR AI DECISION MAKING`
    calcAiBestMove() {
        let selected_move = undefined;
        let most_damage_move = this.highestAiDmgMove();
        let ai_healign_move = null

        // check if AI holds an healing move

        this.oppo_pokemon.moves.forEach((move) => {
            if (move.category == 'status') {
                move.effects.forEach((eff) => {
                    if (eff.type == 'heal') {
                        ai_healign_move = move
                    }
                })
            }
        })

        // Check if highest damage move could kill or deals at least 50% max HP damage
        if ((most_damage_move.could_kill || most_damage_move.expected_damage > this.my_pokemon.hp.max / 2)) {
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
                    console.log(this.oppo_pokemon.moves);
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
    highestAiDmgMove() {
        let best_move = {
            move: undefined,
            expected_dmg: 0,
            could_kill: false
        };

        this.oppo_pokemon.moves.forEach((move) => {
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


            let expected_damage = this.calcDamage(move, this.oppo_pokemon, this.my_pokemon, false);


            if (
                best_move.move === undefined || // If best_move is not defined yet
                (expected_damage > best_move.expected_dmg && !best_move.could_kill && move.pp.current > 0 && !self_faint_move) || // If the move is better than the current best move
                (best_move.could_kill && expected_damage > this.my_pokemon.hp.current && move.accuracy > best_move.move.accuracy && move.pp.current > 0 && !self_faint_move) || // If the move could kill and has higher accuracy
                (!best_move.could_kill && this.oppo_pokemon.speed.current > this.my_pokemon.speed.current && move_can_flinch) ||
                (!best_move.could_kill && this.oppo_pokemon.hp.current < this.oppo_pokemon.hp.max * 0.33 && self_faint_move) // If the opponent's HP is low and the move is self-fainting
            ) {
                console.log(this.oppo_pokemon.hp.current < this.oppo_pokemon.hp.max * 0.33)
                best_move.move = move;
                best_move.expected_dmg = expected_damage;
                best_move.could_kill = expected_damage > this.my_pokemon.hp.current;
            }
        });

        return best_move;
    },
    playerKillingMove() {
        let killing_move;
        let oppo_shuffled_moves = this.shuffleArray(this.my_pokemon.moves.slice());

        oppo_shuffled_moves.forEach(move => {
            let expected_damage = this.calcDamage(move, this.oppo_pokemon, this.my_pokemon, false);
            if (expected_damage >= this.oppo_pokemon.hp.current) {
                killing_move = move;
            }
        });

        return killing_move;
    },
    bestAiSwap(player_move) {
        let best_swap = null;
        let least_damage = this.calcDamage(player_move, this.my_pokemon, this.oppo_bench[0]);

        this.oppo_bench.forEach((ai_pokemon) => {
            let expected_incoming_damage = this.calcDamage(player_move, this.my_pokemon, ai_pokemon);
            if (expected_incoming_damage < least_damage && expected_incoming_damage < ai_pokemon.hp.current) {
                least_damage = expected_incoming_damage;
                best_swap = ai_pokemon;
            } else if (expected_incoming_damage === least_damage && best_swap && ai_pokemon.hp.current > best_swap.hp.current) {
                best_swap = ai_pokemon; // If damage is equal, choose the one with higher remaining HP
            }
        });
        console.log(best_swap)
        return best_swap;
    },
    aiWantsSwap() {
        if (this.oppo_bench.length == 0) return false

        let predicted_player_move = this.playerKillingMove()
        let possible_swap
        if (predicted_player_move) {
            possible_swap = this.bestAiSwap(predicted_player_move)
        }
        console.log(predicted_player_move, possible_swap)

        if (predicted_player_move && this.oppo_pokemon.speed.effective < this.my_pokemon.speed.effective && possible_swap) {
            console.log()
            return possible_swap
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
    apply_status: async function (effect, target) {
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
                    }
                } else {
                    this.info_text = `${target.name} is already ${effect.applied_status}...`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                }

            }
        }
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
        console.log(random_chance, effect.chance)
        if (effect.chance > random_chance) {
            console.log('applied flinch')
            target.flinched = true
        }
    },
    async endTurn() {
        console.log(this.oppo_pokemon.held_item)
        this.my_pokemon.flinched = false
        this.oppo_pokemon.flinched = false

        if (this.my_pokemon.fainted && this.my_bench.length == 0) {

            this.info_text = `All of your pokemons died, you're gonna get killed as well`;
            await this.delay(this.info_text.length * this.config.text_speed + 500);
            // window.location.reload()
            return

        } else {
            if (this.oppo_pokemon.fainted) {
                if (this.battle_type == 'trainer' && this.oppo_bench.length > 0) {
                    this.info_text = `${this.oppo_trainer.name}'s next pokemon will be ${this.oppo_bench[0].name}`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                    await this.battle_scene_instance.changeOpponentPokemonSprite(this.oppo_bench[0])
                } else {
                    this.info_text = `${this.oppo_pokemon.name} died and you won the battle ${this.battle_type == 'trainer' ? 'against ' + this.oppo_trainer.name : ''}`;
                    await this.delay(this.info_text.length * this.config.text_speed + 500);
                    // window.location.reload()
                    return
                }


            }
        }

        if (!this.my_pokemon.fainted) {
            if (this.my_pokemon.status == 'poisoned' || this.my_pokemon.status == 'burned') {
                let dot_dmg = this.my_pokemon.hp.max / 8;
                this.info_text = `${this.my_pokemon.name} is ${this.my_pokemon.status} and will lose hp`;
                await this.delay(this.info_text.length * this.config.text_speed + 500);
                await this.applyDamage(this.oppo_pokemon, dot_dmg);
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
                console.log(this.oppo_pokemon.held_item.name)
                if (this.oppo_pokemon.hp.current < this.oppo_pokemon.hp.max * 0.5 && this.oppo_pokemon.held_item.name == 'Sitrus Berry') {
                    this.info_text = `${this.oppo_pokemon.name} will eat his Sitrus Berry and restore some of his hp`;
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
        } else {
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
    attackingWhileConfused: async function (caster) {
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
            return false
        } else {
            return true
        }
    },
    attackingWhileParalyzed: async function (caster) {
        let random_chance = Math.floor(Math.random() * 100)
        let one_fourth_chance = random_chance < 25 ? true : false
        console.log(one_fourth_chance, random_chance)

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

                // Trigger Vue DOM update
                // This may vary depending on how your Vue component is structured
                // You might need to use $forceUpdate or reactive properties
                // For simplicity, assuming gainer is a reactive object
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
    async checkDamagePrevent(move, caster, target) {
        if (move.type == 'ground' && target.abilities.includes('Levitate') || move.type == 'water' && target.abilities.includes('Storm Drain')) {
            this.info_text = `${target.name}'s is uneffected  by ${move.name} cause of ${target.abilities[0]}`
            await await this.delay(this.info_text.length * this.config.text_speed + 500);
            if (target.abilities.includes('Storm Drain')) {
                let fake_effect = {
                    type: 'modify_stat', target_stat: 'sp_attack', target: 'ally', stages: +1, target_stat_label: 'special attack'
                }
                this.modifyStat(fake_effect, target)
                this.info_text = `${target.name}'s ${fake_effect.target_stat_label} rose thanks to ${target.abilities[0]}`
                await await this.delay(this.info_text.length * this.config.text_speed + 500);
            }
            return true
        } else {
            return false
        }
    }





    //TODO - calc experience gain in battle, possible level ups, possible evolutions



});
