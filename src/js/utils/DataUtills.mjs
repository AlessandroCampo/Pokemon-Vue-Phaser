import Phaser from "phaser";
import { DATA_ASSET_KEYS } from "../scenes/assets-keys.mjs";

export class DataUtils {
    static getAnimations(scene) {
        const data = scene.cache.json.get(DATA_ASSET_KEYS.ANIMATIONS)
        return data

    }
}