import { DIRECTION } from "../utils/Controls.mjs";
import { tile_size } from "../scenes/world-scene";
import { getTargetPosition } from "../utils/GridUtils.mjs";
import { map_store } from "@/mapStore";


export class Character {
    _scene;
    _phaserGameObject;
    _direction;
    _isMoving;
    _idleFrameConfig;
    _origin;
    _targetPosition;
    _previousTargetPosition;
    _spriteGridMovementFinishedCallback;
    _collisionLayer;
    _collidingCharacters;
    can_move;

    constructor(config) {
        this._scene = config.scene;
        this._direction = config.direction;
        this._isMoving = false;
        this._targetPosition = { ...config.position }
        this._previousTargetPosition = { ...config.position }
        this._idleFrameConfig = config.idleFrameConfig;
        this._origin = config.origin ? { ...config.origin } : { x: 0, y: 0 }
        this._collidingCharacters = config.collidingCharacters || []
        this._phaserGameObject = this._scene.add.sprite(config.position.x, config.position.y, config.assetKey, this.getIdleFrame() || 0).setScale(config.scale || 0.5).setOrigin(this._origin.x, this._origin.y)
        this._spriteGridMovementFinishedCallback = config.spriteGridMovementFinishedCallback
        this._collisionLayer = config.collision_layer;
        this._direction = config.direction
        this.can_move = true

    }

    get isMoving() {
        return this._isMoving
    }


    get direction() {
        return this._direction
    }

    // setDirection(direction) {
    //     if (direction == 'UP') {
    //         direction = DIRECTION.UP
    //     }
    //     console.log(direction)
    //     this._direction = direction
    //     this._phaserGameObject.setFrame(this.getIdleFrame())
    // }

    get sprite() {
        return this._phaserGameObject
    }


    moveCharacter(direction) {
        if (this._isMoving || !this.can_move) {
            return
        }

        this.moveSprite(direction)

    }

    addCharactersToCheckCollisionWith(character) {
        this._collidingCharacters.push(character)
    }

    update(time) {

        if (this._isMoving || !this.can_move) {
            return
        }

        const idleFrame = this._phaserGameObject.anims.currentAnim?.frames[0].frame.name;
        this._phaserGameObject.anims.stop()
        if (idleFrame == 0) {
            this._phaserGameObject.setFrame(this.getIdleFrame()[0])
        }
        if (!idleFrame) {
            return
        }

        switch (this._direction) {
            case DIRECTION.DOWN:
            case DIRECTION.RIGHT:
            case DIRECTION.LEFT:
            case DIRECTION.UP:
                this._phaserGameObject.setFrame(idleFrame)
                break
            case DIRECTION.NONE:

                break;


        }
    }

    getIdleFrame() {

        return this._idleFrameConfig[this._direction]
    }

    _isBlockingTile() {
        if (this._direction === DIRECTION.NONE) {
            return
        }

        const target_position = { ...this._targetPosition }
        const updated_position = getTargetPosition(target_position, this._direction)



        return this.doesPositionCollide(updated_position) || this.doesPositionCollideWithOtherCharacter(updated_position)
    }


    moveSprite(direction) {
        this._direction = direction
        if (this._isBlockingTile()) {
            return
        }

        this._isMoving = true
        this.handleSpriteMovement()
    }



    handleSpriteMovement() {
        if (this._direction === DIRECTION.NONE) {
            return
        }

        const updated_position = getTargetPosition(this._targetPosition, this._direction);
        this._previousTargetPosition = { ...this._targetPosition }
        this._targetPosition.x = updated_position.x
        this._targetPosition.y = updated_position.y

        this._scene.add.tween({
            delay: 0,
            duration: map_store.walking_speed,
            y: {
                from: this._phaserGameObject.y,
                to: this._targetPosition.y
            },
            x: {
                from: this._phaserGameObject.x,
                to: this._targetPosition.x
            },
            targets: this._phaserGameObject,
            onComplete: () => {
                this._isMoving = false;
                this._previousTargetPosition = { ...this._targetPosition }
                if (this._spriteGridMovementFinishedCallback) {
                    this._spriteGridMovementFinishedCallback()
                }
            }

        })


    }

    doesPositionCollide(position) {
        if (!this._collisionLayer) {
            return false
        }

        const { x, y } = position
        const tile = this._collisionLayer.getTileAtWorldXY(x, y, true)
        return tile.index !== -1
    }

    doesPositionCollideWithOtherCharacter(position) {

        const { x, y } = position
        if (this._collidingCharacters.length === 0) {
            return false
        }


        const collides_with_character = this._collidingCharacters.some((character) => {
            // console.log('My position', x, y, 'Character position', character._targetPosition.x, character._targetPosition.y)
            return (character._targetPosition.x == x && character._targetPosition.y == y) || (character._previousTargetPosition.x == x && character._previousTargetPosition.y == y)
        })

        return collides_with_character
    }
}
