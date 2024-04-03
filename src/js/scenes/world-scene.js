import { Controls } from "../utils/Controls.mjs";
import { Player } from "../world/player";
import { WORLD_ASSETS_KEYS } from "./assets-keys.mjs";
import { SCENE_KEYS } from "./scene-keys.mjs";
import Phaser from "phaser";
import { DIRECTION } from "../utils/Controls.mjs";
import { store } from "@/store";
import { map_store } from "@/mapStore";

export const tile_size = 64

const player_position = {
    x: 6.3 * tile_size,
    y: 21 * tile_size
}

let map_scale = 1



export class WorldScene extends Phaser.Scene {
    #player
    #controls
    encounter_layer
    wildMonsterEcountered
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
        console.log(map_store.world_scene_istance)
        map_store.add_new_message_to_queue(`Welcome to the game, ${store.player_info.name}!`)
        map_store.add_new_message_to_queue(`In this game , pokemons are way less friendly than what you remember, be careful walking around without a strong team`)

        this.cameras.main.setBounds(0, 0, 1280, 2176)
        const x = 24
        const y = 52
        this.cameras.main.setZoom(0.8)
        this.cameras.main.centerOn(x, y)

        const map = this.make.tilemap({ key: WORLD_ASSETS_KEYS.WORLD_MAIN_LEVEL })

        const collision_tiles = map.addTilesetImage('collision', WORLD_ASSETS_KEYS.WORLD_COLLISION)
        const collision_layer = map.createLayer('Collision', collision_tiles, 0, 0)
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
                direction: DIRECTION.DOWN,
                collision_layer: collision_layer,
                spriteGridMovementFinishedCallback: () => {
                    this.handlePlayerMovementUpdate()
                }


            }
        )
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
        this.#player.update(time)
    }

    handlePlayerMovementUpdate() {
        if (!this.encounter_layer) {
            return
        }

        const isInEncounterZone = this.encounter_layer.getTileAtWorldXY(this.#player.sprite.x, this.#player.sprite.y, true).index !== -1
        if (!isInEncounterZone) {
            return
        }
        console.log('on encounter zone')
        this.wildMonsterEcountered = Math.random() < map_store.encounter_frequency
        if (this.wildMonsterEcountered) {
            console.log('found wild mon')
            this.cameras.main.fadeOut(2000)
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start(SCENE_KEYS.BATTLE_SCENE);
            })
            map_store.handleWildEncounter()
        }
    }


}