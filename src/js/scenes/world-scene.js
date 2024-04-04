import { Controls } from "../utils/Controls.mjs";
import { Player } from "../world/player";
import { WORLD_ASSETS_KEYS } from "./assets-keys.mjs";
import { SCENE_KEYS } from "./scene-keys.mjs";
import Phaser from "phaser";
import { DIRECTION } from "../utils/Controls.mjs";
import { store } from "@/store";
import { map_store } from "@/mapStore";
import { getTargetPosition } from "../utils/GridUtils.mjs";

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
    constructor() {
        super({
            key: SCENE_KEYS.WORLD_SCENE
        })
    }

    init() {
        this.wildMonsterEcountered = false;
    }

    create() {
        map_store.world_scene_istance = this

        map_store.add_new_message_to_queue(`Welcome to the game, ${store.player_info.name}!`)
        map_store.add_new_message_to_queue(`In this game , pokemons are way less friendly than what you remember, be careful walking around without a strong team`)
        //dynamically set player position and direction
        let player_position = map_store.player_position_info.coords ? map_store.player_position_info.coords : map_store.player_initial_coords
        let player_direction = map_store.player_position_info.direction


        // this.cameras.main.setBounds(0, 0, 1280, 2176)
        const x = 24
        const y = 52
        this.cameras.main.setZoom(2)
        this.cameras.main.centerOn(x, y)

        const map = this.make.tilemap({ key: WORLD_ASSETS_KEYS.WORLD_MAIN_LEVEL })

        const collision_tiles = map.addTilesetImage('collision', WORLD_ASSETS_KEYS.WORLD_COLLISION)
        const collision_layer = map.createLayer('Collision', collision_tiles, 0, 0)

        // create layr for interactive objects
        this.sign_layer = map.getObjectLayer('Sign')
        console.log(this.sign_layer)
        if (!collision_layer) {
            console.log('error: no collisions')
            return
        }
        collision_layer.setAlpha(0.0).setDepth(2)

        const encounter_tile = map.addTilesetImage('encounter', WORLD_ASSETS_KEYS.WORLD_ENCOUNTER_ZONE)
        this.encounter_layer = map.createLayer('Encounter', encounter_tile, 0, 0)
        if (!this.encounter_layer) {
            console.log('error: no encounters')
            return
        }
        this.encounter_layer.setAlpha(0.1).setDepth(3)

        this.add.image(0, 0, WORLD_ASSETS_KEYS.WORLD_BACKGROUND, 0).setOrigin(0).setScale(map_scale)
        this.#player = new Player(
            {
                scene: this,
                position: player_position,
                direction: map_store.player_position_info.direction,
                collision_layer: collision_layer,
                spriteGridMovementFinishedCallback: () => {
                    this.handlePlayerMovementUpdate()
                }

            }
        )
        if (!map_store.player_istance) {
            map_store.player_istance = this.#player
        }

        this.#player.updateAnimation(map_store.player_position_info.direction)

        this.#controls = new Controls(this)


        this.add.image(0, 0, WORLD_ASSETS_KEYS.WORLD_FOREGROUND, 0).setOrigin(0).setScale(map_scale)


        this.cameras.main.startFollow(this.#player.sprite)
        this.cameras.main.fadeIn(1000, 0, 0, 0)

    }

    update(time) {
        if (this.wildMonsterEcountered) {
            this.#player.update(time)
            return
        }
        const selected_direction = this.#controls.getDirectionKeyPressedDown()
        if (selected_direction !== DIRECTION.NONE) {
            this.#player.moveCharacter(selected_direction)
        }
        if (this.#controls.wasSpaceKeyPressed() && !this.#player.isMoving) {
            this.handlePlayerInteraction()
        }
        this.#player.update(time)
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
        if (this.wildMonsterEcountered) {

            this.cameras.main.fadeOut(2000)
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start(SCENE_KEYS.BATTLE_SCENE);
            })
            map_store.handleWildEncounter()
        }
    }

    handlePlayerInteraction() {
        const { x, y } = this.#player.sprite;
        const target_position = getTargetPosition({ x, y }, this.#player.direction);



        const nearbySign = this.sign_layer.objects.find((object) => {
            if (!object.x || !object.y) {
                return
            }
            console.log(Math.floor(object.x), Math.floor(object.y) - tile_size)
            return Math.floor(object.x) === target_position.x && Math.floor(object.y) - tile_size === target_position.y;
        })

        console.log('Player position', target_position.x, target_position.y)
        console.log(nearbySign)
    }


}