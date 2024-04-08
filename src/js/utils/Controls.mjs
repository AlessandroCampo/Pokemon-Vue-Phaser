export const DIRECTION = Object({
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    UP: 'UP',
    DOWN: 'DOWN',
    NONE: 'NONE',
});


export class Controls {
    #cursorKeys;
    #lockPlayerInput;
    constructor(scene) {
        this.scene = scene;
        this.#cursorKeys = this.scene.input.keyboard.createCursorKeys();
        this.backspaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
        this.enterKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.#lockPlayerInput = false
    }

    wasSpaceKeyPressed() {
        if (this.#cursorKeys === undefined) {
            return false
        }
        return Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space)
    }

    wasEnterKeyPressed() {
        if (this.#cursorKeys === undefined) {
            return false
        }
        return Phaser.Input.Keyboard.JustDown(this.enterKey)
    }


    wasShiftKeyPressed() {
        if (this.#cursorKeys === undefined) {
            return false
        }
        return Phaser.Input.Keyboard.JustDown(this.backspaceKey)
    }


    wasBackKeyPressed() {
        if (this.#cursorKeys === undefined) {
            return false
        }
        return Phaser.Input.Keyboard.JustDown(this.#cursorKeys.shift)
    }

    get isInputLocked() {
        return this.#lockPlayerInput
    }

    set lockInput(val) {
        this.#lockPlayerInput = val
    }

    getDirectionKeyPressedDown() {
        if (this.#cursorKeys === undefined) {
            return DIRECTION.NONE
        }

        let selected_direction = DIRECTION.NONE;
        if (this.#cursorKeys.left.isDown) {
            selected_direction = DIRECTION.LEFT
        } else if (this.#cursorKeys.right.isDown) {
            selected_direction = DIRECTION.RIGHT
        } else if (this.#cursorKeys.up.isDown) {
            selected_direction = DIRECTION.UP
        } else if (this.#cursorKeys.down.isDown) {
            selected_direction = DIRECTION.DOWN
        }
        return selected_direction
    }

    getDirectionKeyJustPressed() {
        if (this.#cursorKeys === undefined) {
            return DIRECTION.NONE
        }

        let selected_direction = DIRECTION.NONE;
        if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.left)) {
            selected_direction = DIRECTION.LEFT
        } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.right)) {
            selected_direction = DIRECTION.RIGHT
        } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.up)) {
            selected_direction = DIRECTION.UP
        } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.down)) {
            selected_direction = DIRECTION.DOWN
        }
        return selected_direction
    }
}