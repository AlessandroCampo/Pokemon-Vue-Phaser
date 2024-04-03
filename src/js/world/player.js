import { CHARACTER_ASSET_KEYS } from "../scenes/assets-keys.mjs";
import { Character } from "./character";
import { DIRECTION } from "../utils/Controls.mjs";

export class Player extends Character {
    _directionQueue = []

    constructor(config) {
        super({
            ...config,
            assetKey: CHARACTER_ASSET_KEYS.PLAYER,
            origin: { x: 0, y: 0.2 },
            idleFrameConfig: {
                DOWN: 3,
                UP: 0,
                NONE: 3,
                LEFT: 6,
                RIGHT: 9
            }
        });

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


}
