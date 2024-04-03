import { computed, reactive } from 'vue'
import { store } from './store';
import gsap from 'gsap'
import Phaser from 'phaser';

export const map_store = reactive({
    walking_speed: 450,
    text_queue: [],
    encounter_frequency: 0.9,
    current_map: 'start',
    world_scene_istance: undefined,
    createSceneTransition: async function (scene) {

        // const skipSceneTransition = options?.skipSceneTransition || false;
        // if (skipSceneTransition) {
        //     if (options?.callback) {
        //         options.callback()
        //     }
        //     return;
        // }
        return new Promise(resolve => {

            const { width, height } = scene.scale

            const rectShape = new Phaser.Geom.Rectangle(0, height / 2, width, 0)

            const g = scene.add.graphics().fillRectShape(rectShape).setDepth(-1)
            const mask = g.createGeometryMask();
            scene.cameras.main.setMask(mask)

            const tween = scene.tweens.add({
                targets: rectShape,
                onUpdate: () => {
                    g.clear().fillRectShape(rectShape)
                },
                delay: 400,
                duration: 800,
                height: {
                    ease: Phaser.Math.Easing.Expo.InOut,
                    from: 0,
                    to: height
                },
                y: {
                    ease: Phaser.Math.Easing.Expo.InOut,
                    from: height / 2,
                    to: 0
                },
                onComplete: () => {
                    mask.destroy()
                    scene.cameras.main.clearMask()
                    resolve()
                }
            })

            tween.play()
        })

    },
    bar_transition(player_bar) {
        let my_bar = document.getElementById('my-bar')
        let enemy_bar = document.getElementById('enemy-bar')
        console.log(my_bar)
        if (player_bar) {
            gsap.set(my_bar, {
                top: '5%',
                left: '-20%'
            })
            gsap.to(my_bar, {
                top: '5%',
                left: '10%',
                duration: 1
            })
        } else {
            gsap.set(enemy_bar, {
                top: '5%',
                right: '-20%'
            })
            gsap.to(enemy_bar, {
                top: '5%',
                right: '10%',
                duration: 1
            })
        }

    },
    add_new_message_to_queue(text) {
        this.text_queue.push(text)
    },
    skip_to_next_message() {
        this.text_queue.shift()
    },
    handleWildEncounter() {
        store.in_battle = true
        console.log(store.in_battle)
        store.battle_type = 'wild'
        store.menu_state = 'text'
        store.oppo_pokemon = store.getRandomEncounter(this.current_map)
        console.log(store.oppo_pokemon)

    }



})