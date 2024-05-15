import Phaser from "phaser";
import gsap from 'gsap'
import { store } from "@/store";

const oppo_position = Object.freeze({
    x: 798,
    y: 395
})

const ally_position = Object.freeze({
    x: 256,
    y: 500
})

const my_scale = 0.8
const oppo_scale = 0.6

const getMoveBackgroundColor = (type) => {
    const typeColors = {
        'normal': 0x9099a1,
        'water': 0x4d90d5,
        'fire': 0xff9c54,
        'grass': 0x63bb5b,
        'flying': 0x92aade,
        'poison': 0xab6ac8,
        'ground': 0xd97746,
        'groundd': 0xd97746, // Typo fixed
        'rock': 0xc7b78b,
        'bug': 0x90c12c,
        'ghost': 0x5269ac,
        'steel': 0x5a8ea1,
        'electric': 0xf3d23b,
        'psychic': 0xf97176,
        'ice': 0x74cec0,
        'dragon': 0x096dc4,
        'dark': 0x5a5366,
        'fairy': 0xec8fe6,
        'fighting': 0xce4069
    };
    let color = typeColors[type] || 0x000000; // Default to black with full opacity
    return '0x' + color.toString(16)
};



const tackle_animation = async function (sprite, player_controlled, move_type) {
    return new Promise(resolve => {
        let position = player_controlled ? ally_position : oppo_position;
        const tl = gsap.timeline();

        if (player_controlled) {

            tl.to(sprite, {
                duration: 0.3,
                x: position.x - 30,
                y: position.y + 10
            }).to(sprite, {
                duration: 0.3,
                x: position.x + 500,
                y: position.y - 40,
                scale: sprite.scale - 0.2
            }).to(sprite, {
                duration: 0.5,
                x: position.x,
                y: position.y,
                scale: sprite.scale,
                onComplete: () => {
                    resolve();
                }
            });
        } else {

            tl.to(sprite, {
                duration: 0.3,
                x: position.x + 30,
                y: position.y - 10
            }).to(sprite, {
                duration: 0.3,
                x: position.x - 500,
                y: position.y + 40,
                scale: sprite.scale + 0.2
            }).to(sprite, {
                duration: 0.5,
                x: position.x,
                y: position.y,
                scale: sprite.scale,
                onComplete: () => {
                    resolve();
                }
            });
        }
    });
};

const no_contact_animation = async function (sprite, player_controlled, move_type) {
    if (move_type == 'fighting' || move_type == 'ground' || move_type == 'normal' || move_type == 'bug' || move_type == 'steel') {
        move_type = 'rock'
    } else if (move_type == 'psychic' || move_type == 'fairy' || move_type == 'dark') {
        move_type = 'ghost'
    }
    return new Promise(resolve => {
        const oppo_pos = {
            x: 798,
            y: 345
        };

        const ally_pos = {
            x: 276,
            y: 380
        }



        let position = player_controlled ? oppo_pos : ally_pos;
        let scene = store.battle_scene_instance;
        let sprite_key = move_type + '_animation'
        let animation_key = move_type + '_animation'

        let specialEffect = scene.add.sprite(position.x, position.y, sprite_key);
        specialEffect.setScale(0.6);
        specialEffect.setAlpha(0.6)
        specialEffect.anims.play(animation_key);

        // Wait for the duration of the animation to pass
        specialEffect.on('animationcomplete', function () {
            specialEffect.destroy();

            resolve();
        });

        // Check if asset loading is complete

    });
};

const stat_change = async function (sprite, increase_boolean) {
    return new Promise(resolve => {
        // const boostingColor = 0x00FF00; // Green color
        // const nerfColor = 0xFF0000; // Red color
        // const targetColor = increase_boolean ? boostingColor : nerfColor;
        // sprite.setTint(targetColor)
        // setTimeout(() => {
        //     sprite.clearTint()
        //     resolve()
        // }, 1000)

        let origina_scale = sprite.scale
        let scale_change = increase_boolean ? + 0.2 : -0.2

        const tl = gsap.timeline();
        tl.to(sprite, {
            scale: origina_scale + scale_change,
        }).to(sprite, {
            scale: origina_scale,
            onComplete: () => {
                resolve()
            }
        })
    });
}


const status_animation = async function (player_controlled, status) {

    const oppo_pos = {
        x: 798,
        y: 345
    };

    const ally_pos = {
        x: 276,
        y: 380
    };
    let position = player_controlled ? ally_pos : oppo_pos;
    if (status == 'burned') {
        status = 'fire'
    } else if (status == 'frozen') {
        status = 'ice'
    } else if (status == 'poisoned') {

        status = 'poison'
    } else if (status == 'confused' || status == 'asleep') {
        position.y -= 70
    }
    return new Promise(resolve => {


        let scene = store.battle_scene_instance;
        let sprite_key = status + '_animation'
        let animation_key = status + '_animation'

        let specialEffect = scene.add.sprite(position.x, position.y, sprite_key);
        specialEffect.setScale(0.6);
        if (status == 'frozen') {
            specialEffect.setScale(0.3)
        }
        specialEffect.setAlpha(0.6)
        specialEffect.anims.play(animation_key);

        // Wait for the duration of the animation to pass
        specialEffect.on('animationcomplete', function () {
            specialEffect.destroy();

            resolve();
        });

        // Check if asset loading is complete

    });
};







export const allAnimations = {
    tackle_animation,
    no_contact_animation,
    stat_change,
    status_animation
}