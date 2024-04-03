import { DIRECTION } from "./Controls.mjs";
import { tile_size } from "../scenes/world-scene";


export function getTargetPosition(current_position, direction) {
    const target_position = { ...current_position }
    switch (direction) {
        case DIRECTION.DOWN:
            target_position.y += tile_size
            break;
        case DIRECTION.UP:
            target_position.y -= tile_size
            break;
        case DIRECTION.LEFT:
            target_position.x -= tile_size
            break;
        case DIRECTION.RIGHT:
            target_position.x += tile_size
            break;
    }

    return target_position
}