import { Controls } from "../utils/Controls.mjs";
import { Player } from "../world/player";
import { WORLD_ASSETS_KEYS } from "./assets-keys.mjs";
import { SCENE_KEYS } from "./scene-keys.mjs";
import Phaser from "phaser";
import { DIRECTION } from "../utils/Controls.mjs";
import { store } from "@/store";
import { map_store } from "@/mapStore";
import { getTargetPosition } from "../utils/GridUtils.mjs";
import { NPC } from "../world/npc";
import { DataUtils } from "../utils/DataUtills.mjs";

export const tile_size = 16

// const player_position = {
//     x: 6.3 * tile_size,
//     y: 21 * tile_size
// }

let map_scale = 1



export class WorldScene extends Phaser.Scene {
    #player
    #controls
    encounter_layer
    wildMonsterEcountered
    sign_layer
    npcs
    talking_npc
    npc_battle_started
    area
    is_indoor
    constructor() {
        super({
            key: SCENE_KEYS.WORLD_SCENE
        })
    }

    init() {
        this.npcs = []
        this.wildMonsterEcountered = false;
        this.npc_battle_started = false
        map_store.player_position_info.map = map_store.current_map
    }

    preload() {
        map_store.current_map.npcs_locations.forEach((el) => {
            if (!this.textures.exists(el.npc.name)) {
                this.load.spritesheet(el.npc.name, `/characters/${el.npc.name}.png`, {
                    frameWidth: el.npc.frameWidth,
                    frameHeight: el.npc.frameHeight,
                });
            }
        });
    }

    create() {
        if (map_store.first_loading) {
            map_store.add_new_message_to_queue(`Welcome to the game, ${store.player_info.name}!`)
            map_store.add_new_message_to_queue(`In this game , pokemons are way less friendly than what you remember, be careful walking around without a strong team`)
            map_store.first_loading = false
        }

        map_store.world_scene_istance = this
        //dynamically set player position and direction
        let player_position = map_store.player_position_info.coords ? map_store.player_position_info.coords : map_store.player_initial_coords
        let player_direction = map_store.player_position_info.direction


        // this.cameras.main.setBounds(0, 0, 1280, 2176)
        // const x = 24
        // const y = 52
        this.cameras.main.setZoom(2)
        // this.cameras.main.centerOn(x, y)

        const map = this.make.tilemap({ key: `${map_store.current_map.map_name.toUpperCase()}_JSON` })

        const collision_tiles = map.addTilesetImage('collision', WORLD_ASSETS_KEYS.START_COLLISION)
        const collision_layer = map.createLayer('Collision', collision_tiles, 0, 0)

        // create layr for interactive objects, if level has one
        const has_sign_layer = map.getObjectLayer('Sign') !== null;
        if (has_sign_layer) {
            this.sign_layer = map.getObjectLayer('Sign')
        }


        if (!collision_layer) {
            console.log('error: no collisions')
            return
        }
        collision_layer.setAlpha(0.0).setDepth(2)


        const has_encounter_layer = map.getLayer('Encounter') !== null;
        if (has_encounter_layer) {

            const encounter_tile = map.addTilesetImage('encounter', WORLD_ASSETS_KEYS.START_ENCOUNTER_ZONE)
            this.encounter_layer = map.createLayer('Encounter', encounter_tile, 0, 0)
            this.encounter_layer.setAlpha(0.1).setDepth(3)
        }




        this.add.image(0, 0, `${map_store.current_map.map_name.toUpperCase()}_BACKGROUND`, 0).setOrigin(0).setScale(map_scale)

        //creating npcs

        this.createNPCS(map)
        this.npcs.forEach((npc) => {
            this.createNPCAnimation(npc)
        })



        this.#player = new Player(
            {
                scene: this,
                position: player_position,
                direction: map_store.player_position_info.direction,
                collision_layer: collision_layer,
                spriteGridMovementFinishedCallback: () => {
                    this.handlePlayerMovementUpdate()
                },
                collidingCharacters: this.npcs

            }
        )
        if (!map_store.player_istance) {
            map_store.player_istance = this.#player
        }

        this.#player.updateAnimation(map_store.player_position_info.direction)

        this.#controls = new Controls(this)


        this.add.image(0, 0, `${map_store.current_map.map_name.toUpperCase()}_FOREGROUND`, 0).setOrigin(0).setScale(map_scale)


        this.cameras.main.startFollow(this.#player.sprite)
        this.cameras.main.fadeIn(1000, 0, 0, 0)

        //update collisions with npcs

        this.npcs.forEach((npc) => {
            npc.addCharactersToCheckCollisionWith(this.#player);
        })

    }

    async update(time) {
        const { x, y } = this.#player.sprite;
        const target_position = getTargetPosition({ x, y }, this.#player.direction);
        if (this.wildMonsterEcountered) {
            this.#player.update(time)
            return
        }
        if (this.npc_battle_started || this.#player.is_talking) {
            this.#player._phaserGameObject.anims.stop()
        }
        const selected_direction = this.#controls.getDirectionKeyPressedDown()
        if (selected_direction !== DIRECTION.NONE) {
            this.#player.moveCharacter(selected_direction)
            if (!this.npc_battle_started && !this.#player.is_talking) {
                store.info_text = ''
                map_store.text_queue = []
                store.menu_state = 'hidden'
            }

        }
        if (this.#controls.wasSpaceKeyPressed() && !this.#player.isMoving) {
            this.handlePlayerInteraction()
        }
        this.#player.update(time)
        this.npcs.forEach((npc) => {
            npc.update(time)
        })

        const npc_wants_battle = this.npcs.find((npc) => {
            //TODO - fix for all the positions, add method
            return npc.spottedPlayer(target_position)

        })
        if (npc_wants_battle) {
            npc_wants_battle.path = [target_position]
            npc_wants_battle.no_delay_movement = true
            npc_wants_battle.battler = false
            npc_wants_battle.obj_ref.battler = false
            this.npc_battle_started = true
            this.#player.can_move = false
            this.#player.faceNpc(npc_wants_battle._direction)
            // npc_wants_battle.facePlayer(this.#player.direction)
            this.#player.in_battle = true

            if (npc_wants_battle.dialogue) {
                map_store.add_new_message_to_queue(npc_wants_battle.dialogue[0])
            }
            this.startTrainerBattle()





        }

    }

    handlePlayerMovementUpdate() {
        //update player position in global store

        map_store.player_position_info.coords = {
            x: this.#player.sprite.x,
            y: this.#player.sprite.y
        }
        map_store.player_position_info.direction = this.#player.direction


        if (!this.encounter_layer) {
            return
        }

        const isInEncounterZone = this.encounter_layer.getTileAtWorldXY(this.#player.sprite.x, this.#player.sprite.y, true).index !== -1
        if (!isInEncounterZone) {
            return
        }

        this.wildMonsterEcountered = Math.random() < map_store.encounter_frequency
        if (this.wildMonsterEcountered && store.my_pokemon) {
            store.info_text = 'Hey, a wild pokemon is attacking'
            this.cameras.main.fadeOut(2000)
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start(SCENE_KEYS.BATTLE_SCENE);
            })
            map_store.handleWildEncounter()
        } else if (this.wildMonsterEcountered && !store.my_pokemon) {
            store.menu_state = 'text'
            store.info_text = 'You got attacked by a wild pokemon while you dont have any pokemons to defend you, youre gonna get brutally kiled'
            this.cameras.main.fadeOut(3000)
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                window.location.reload()
            })
        }


    }

    async handlePlayerInteraction() {
        const { x, y } = this.#player.sprite;
        const target_position = getTargetPosition({ x, y }, this.#player.direction);



        const nearbySign = this.sign_layer?.objects.find((object) => {
            if (!object.x || !object.y) {
                return
            }

            return Math.floor(object.x) === target_position.x && Math.floor(object.y) - tile_size === target_position.y;
        })


        if (nearbySign && this.#player.direction == DIRECTION.UP) {
            const msg = nearbySign.properties.find((prop) => prop.name === 'message')?.value
            store.menu_state = 'text'

            if (!map_store.text_queue.includes(msg)) {
                map_store.add_new_message_to_queue(msg || 'The text is so ruined that is impossible to read')
            }


        }

        const nearbyNPC = this.npcs.find((npc) => {
            return npc.sprite.x === target_position.x && npc.sprite.y === target_position.y
        })
        if (nearbyNPC) {
            //NPC will turn to the player when triggered
            nearbyNPC.facePlayer(this.#player.direction)

            this.talking_npc = nearbyNPC

            //we save npc messages to reset his dialogue after a cooldown
            let npc_saved_msg = []
            let prev_npc_event = nearbyNPC.event
            //If the npc has a dialogue, each of his messages is sent to the text queue and removed  from his dialogue (will be reset after cooldown)
            if (nearbyNPC.dialogue) {
                nearbyNPC.talking = true
                this.#player.is_talking = true
                nearbyNPC.dialogue.forEach((msg) => {
                    store.menu_state = 'text'
                    if (!map_store.text_queue.includes(msg)) {
                        let msg_index = nearbyNPC.dialogue.indexOf(msg)
                        npc_saved_msg.push(msg)
                        nearbyNPC.dialogue.splice(msg_index, 1)
                        map_store.add_new_message_to_queue(msg)
                    }

                })
                //if the menu state is hidden, it means the player has completed the text queue, here we will set the npc talking to false and trigger possible events that follow the dialogue 

                if (store.menu_state == 'hidden') {
                    if (nearbyNPC.event) {
                        this.#player.can_move = false
                        await nearbyNPC.event()
                        nearbyNPC.talking = false

                        this.talking_npc = undefined
                        this.#player.is_talking = false
                        this.#player.can_move = true
                        nearbyNPC.event = null

                    } else {
                        nearbyNPC.talking = false
                        this.#player.can_move = true
                        this.talking_npc = undefined
                        this.#player.is_talking = false
                    }

                }


            }
            setTimeout(() => {
                nearbyNPC.event = prev_npc_event
                npc_saved_msg.forEach((msg) => {
                    nearbyNPC.talking = false
                    nearbyNPC.dialogue.push(msg)
                })
            }, 5000)


        }



    }

    createNPCS(map) {
        // const npcLayers = map.getObjectLayerNames().filter((layer_name) => layer_name.includes('NPC'))
        map_store.current_map.npcs_locations.forEach((el) => {
            const npc_istance = new NPC({
                scene: this,
                position: el.position,
                direction: DIRECTION.DOWN,
                path: el.path || null,
                frame: 0,
                assetKey: el.npc.name,
                dialogue: el.npc.dialouge,
                scale: el.npc.scale,
                event: el.event || null,
                battler: el.battler || null,
                obj_ref: el
            })

            this.npcs.push(npc_istance)

            npc_istance.update()


        })







        // COMMENTED LOGIC TO DO IT WITH TILED LAYER
        // npcLayers.forEach((layer_name) => {
        //     const layer = map.getObjectLayer(layer_name);
        //     console.log(layer.objects)
        //     const npcObject = layer.objects.find((obj) => {
        //         console.log(obj)
        //         return obj.type === 'NPC'
        //     })

        //     const npc_istance = new NPC({
        //         scene: this,
        //         position: { x: npcObject.x, y: npcObject.y - tile_size },
        //         direction: DIRECTION.DOWN,
        //         frame: 0,
        //         assetKey: npcObject.name
        //     })
        //     this.npcs.push(npc_istance)
        // })
    }

    createNPCAnimation(npc) {
        let animations = [

            {
                key: "_LEFT",
                frames: [4, 5, 6, 7],
            },
            {
                key: "_RIGHT",
                frames: [8, 9, 10, 11],
            },
            {
                key: "_UP",
                frames: [12, 13, 14, 15],
            },
            {
                key: "_DOWN",
                frames: [0, 1, 2, 3],
            },


        ]

        animations.forEach((animation) => {
            const animKey = npc.assetKey + animation.key;

            // Check if the animation already exists
            if (!this.anims.exists(animKey)) {
                const frames = animation.frames ? this.anims.generateFrameNumbers(npc.assetKey, { frames: animation.frames }) : this.anims.generateFrameNumbers(npc.assetKey);

                this.anims.create({
                    key: animKey,
                    frames: frames,
                    frameRate: 6,
                    repeat: -1,
                    delay: 0,
                    yoyo: true
                });
            }
        });

    }

    startTrainerBattle() {
        setTimeout(() => {
            this.cameras.main.fadeOut(2000)
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                store.info_text = ''
                map_store.text_queue = []
                map_store.handleTrainerBattle()
                this.scene.start(SCENE_KEYS.BATTLE_SCENE);
            })
        }, 1500)
    }

    startBossBattle() {
        setTimeout(() => {
            this.cameras.main.fadeOut(2000)
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                store.info_text = ''
                map_store.text_queue = []
                this.scene.start(SCENE_KEYS.BATTLE_SCENE);
            })
        }, 1500)
    }
}