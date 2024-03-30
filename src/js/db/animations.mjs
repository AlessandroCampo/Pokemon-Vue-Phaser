import Phaser from "phaser";
import gsap from 'gsap'

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



const tackle_animation = async function (sprite, player_controlled) {
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







export const allAnimations = {
    tackle_animation
}