import { CHARACTER_ASSET_KEYS } from "../scenes/assets-keys.mjs";
import { Character } from "./character";
import { DIRECTION } from "../utils/Controls.mjs";
import { getTargetPosition } from "../utils/GridUtils.mjs";
import { tile_size } from "../scenes/world-scene";
import { map_store } from "@/mapStore.mjs";

export class Player extends Character {
    _directionQueue = []
    in_battle
    is_talking
    transition_layer
    transition_callback

    constructor(config) {
        super({
            ...config,
            assetKey: CHARACTER_ASSET_KEYS.PLAYER,
            origin: { x: 0, y: 0.2 },
            idleFrameConfig: {
                DOWN: 0,
                UP: 12,
                NONE: 0,
                LEFT: 4,
                RIGHT: 8
            }
        });
        this.in_battle = false
        this.is_talking = false
        this.transition_layer = config.transition_layer
        this.transition_callback = config.transition_callback

    }

    moveCharacter(direction) {
        if (this.in_battle || this.is_talking) {
            return
        }


        // Queue the direction if the character is already moving
        if (this.isMoving) {
            this._directionQueue.push(direction);

        } else {
            // Start moving in the specified direction
            super.moveCharacter(direction);
            this.updateAnimation(direction);
            if (map_store.repel_steps_left > 0) {
                map_store.repel_steps_left--
                console.log(map_store.repel_steps_left)

            }

        }

        if (!this.isMoving) {
            const targetPosition = getTargetPosition({ x: this._phaserGameObject.x, y: this._phaserGameObject.y }, this._direction)
            console.log(targetPosition)

            const nearby_transition = this.transition_layer.objects.find((object) => {
                return object.x === targetPosition.x && object.y - tile_size === targetPosition.y
            })

            if (!nearby_transition) {
                return
            }

            const transition_name = nearby_transition.properties.find((property) => property.name === 'connects_to')?.value
            const transition_id = nearby_transition.properties.find((property) => property.name === 'entrance_id')?.value
            let is_building_transition = nearby_transition.properties.find((property) => property.name === 'is_building')?.value
            let is_locked = nearby_transition.properties.find((property) => property.name === 'is_locked')?.value
            if (!is_building_transition) {
                is_building_transition = false
            }
            console.log(is_locked)
            this.transition_callback(transition_name, transition_id, is_building_transition, is_locked)


        }
    }


    handleSpriteMovement() {
        super.handleSpriteMovement(() => {
            // Movement is complete, handle next direction if any in the queue
            if (this._directionQueue.length > 0) {
                const nextDirection = this._directionQueue.shift();
                super.moveCharacter(nextDirection);
                this.updateAnimation(nextDirection);

            }
        });
    }

    updateAnimation(direction) {
        // Check if the direction is valid for animation
        if (direction !== DIRECTION.NONE) {
            // Play the animation only if it's not already playing
            const animationKey = `PLAYER_${direction}`;
            if (!this._phaserGameObject.anims.isPlaying || this._phaserGameObject.anims.currentAnim.key !== animationKey) {
                this._phaserGameObject.anims.play(animationKey);
            }
        }
    }

    faceNpc(direction) {
        this._phaserGameObject.anims.stop()
        switch (direction) {
            case DIRECTION.UP:
                this._phaserGameObject.setFrame(this._idleFrameConfig.DOWN)
                break;
            case DIRECTION.DOWN:
                this._phaserGameObject.setFrame(this._idleFrameConfig.UP)
                break;
            case DIRECTION.LEFT:
                this._phaserGameObject.setFrame(this._idleFrameConfig.RIGHT)
                break;
            case DIRECTION.RIGHT:
                this._phaserGameObject.setFrame(this._idleFrameConfig.LEFT)
                break;

            default:

                break;
        }
    }


}
