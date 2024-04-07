import { CHARACTER_ASSET_KEYS } from "../scenes/assets-keys.mjs";
import { tile_size } from "../scenes/world-scene";
import { DIRECTION } from "../utils/Controls.mjs";
import { Character } from "./character";

let lastUpdateTime = 0;
const debounceTime = 200; // Adjust debounce time as needed

export class NPC extends Character {
    _directionQueue = []
    path
    current_path_index
    assetKey
    last_movement_time
    no_delay_movement
    constructor(config) {
        super({
            ...config,
            assetKey: config.assetKey,
            origin: { x: 0, y: 0 },
            idleFrameConfig: {
                DOWN: config.frame,
                UP: 12,
                NONE: config.frame,
                LEFT: 4,
                RIGHT: 8
            },
            name: config.name,
            position: config.position,

            scale: config.scale || 0.4

        });
        this.assetKey = config.assetKey
        this._phaserGameObject.setScale(config.scale
        )
        this.dialogue = config.dialogue || ['Hello']
        this.event = config.event || null
        this.talking = false
        this.path = config.path || null
        this.current_path_index = 0
        this.last_movement_time = Phaser.Math.Between(3500, 5000)
        this.battler = config.battler || false
        this.no_delay_movement = config.no_delay_movement || false
        this.obj_ref = config.obj_ref
    }

    update(time) {

        if (!this.path || this.isMoving || this.talking) {
            return;
        }
        super.update(time);



        if (this.last_movement_time < time) {

            let character_direction = DIRECTION.NONE;
            let next_position = this.path[this.current_path_index + 1];
            let final_position = this.path[this.path.length - 1]
            let starting_position = this.path[0]
            //FIXME - npc movement doenst correctly reach any starting and final

            // Check if the NPC has reached the end of the path
            if (next_position === undefined) {
                const POSITION_THRESHOLD = 30;

                if (
                    (Math.abs(this._phaserGameObject.x - final_position.x) > POSITION_THRESHOLD ||
                        Math.abs(this._phaserGameObject.y - final_position.y) > POSITION_THRESHOLD)
                ) {
                    // NPC is not close enough to the final position, continue moving forward
                    this.current_path_index = this.path.length - 1;
                    next_position = final_position;

                } else {
                    // NPC is close enough to the final position, start walking back
                    this.current_path_index = 0;
                    next_position = starting_position;
                }

            } else {
                this.current_path_index++;
            }

            // Determine the direction based on the next position
            if (next_position.x > this._phaserGameObject.x) {
                character_direction = DIRECTION.RIGHT;
            } else if (next_position.x < this._phaserGameObject.x) {
                character_direction = DIRECTION.LEFT;
            } else if (next_position.y < this._phaserGameObject.y) {
                character_direction = DIRECTION.UP;
            } else if (next_position.y > this._phaserGameObject.y) {
                character_direction = DIRECTION.DOWN;
            }

            // Move the character in the determined direction
            this.moveCharacter(character_direction)
            if (!this.no_delay_movement) {
                this.last_movement_time = time + Phaser.Math.Between(1000, 3000)
            }

        }
    }





    facePlayer(direction) {
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

    getMessages() {
        return [...this.dialogue]
    }

    moveCharacter(direction) {
        // Queue the direction if the character is already moving
        if (this.isMoving) {
            this._directionQueue.push(direction);
        } else {
            // Start moving in the specified direction
            super.moveCharacter(direction);
            this.updateAnimation(direction);
        }
    }

    updateAnimation(direction) {


        // Check if the direction is valid for animation
        if (direction !== DIRECTION.NONE) {

            // Play the animation only if it's not already playing
            const animationKey = `${this.assetKey}_${direction}`;

            if (!this._phaserGameObject.anims.isPlaying || this._phaserGameObject.anims.currentAnim.key !== animationKey) {
                this._phaserGameObject.anims.play(animationKey);
            }
        }
    }

    spottedPlayer(player_position) {
        if (!this.battler) {
            return false;
        }

        let distance_threshold = 5
        const distanceX = Math.abs(player_position.x - this._phaserGameObject.x) / tile_size;
        const distanceY = Math.abs(player_position.y - this._phaserGameObject.y) / tile_size;


        if (
            this.direction == DIRECTION.DOWN &&
            player_position.x == this._phaserGameObject.x &&
            player_position.y > this._phaserGameObject.y &&
            distanceY <= distance_threshold
        ) {
            return true;
        } else if (
            this.direction == DIRECTION.UP &&
            player_position.x == this._phaserGameObject.x &&
            player_position.y < this._phaserGameObject.y &&
            distanceY <= distance_threshold
        ) {
            return true;
        } else if (
            this.direction == DIRECTION.RIGHT &&
            player_position.y == this._phaserGameObject.y &&
            player_position.x > this._phaserGameObject.x &&
            distanceX <= distance_threshold
        ) {
            return true;
        } else if (
            this.direction == DIRECTION.LEFT &&
            player_position.y == this._phaserGameObject.y &&
            player_position.x < this._phaserGameObject.x &&
            distanceX <= distance_threshold
        ) {
            return true;
        } else {
            return false;
        }
    }







}