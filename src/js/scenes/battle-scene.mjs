import Phaser from 'phaser'
import { SCENE_KEYS } from './scene-keys.mjs'
import { BATTLE_ASSET_KEYS, BATTLE_BACKGROUND_ASSET_KEYS } from './assets-keys.mjs'
import { Pokemons } from '../db/pokemons.mjs'
import { store } from '@/store'
import { map_store } from '@/mapStore'
// import SceneTransition from ''


export class BattleScene extends Phaser.Scene {
    constructor() {
        super({
            key: SCENE_KEYS.BATTLE_SCENE
        })
    }
    preload() {

        store.battle_scene_instance = this
        store.calcStats(store.my_pokemon)
        store.calcStats(store.oppo_pokemon)
        this.load.spritesheet(store.oppo_pokemon.images.front.key, store.oppo_pokemon.images.front.path, {
            frameWidth: store.oppo_pokemon.images.front.frameWidth,
            frameHeight: store.oppo_pokemon.images.front.frameHeight,
        })
        store.my_bench.forEach((member) => {
            store.calcStats(member)
            member.player_controlled = true
        })
        if (store.battle_type == 'trainer') {
            store.oppo_bench.forEach((member) => {
                store.calcStats(member)
                member.player_controlled = false
            })
        }

    }
    async create() {
        if (store.battle_type == 'wild') {
            store.info_text = `A wild ${store.oppo_pokemon.name} appears! Get ready to fight for your life!`
        } else if (store.battle_type == 'trainer') {
            store.info_text = `The match against ${store.oppo_trainer.name} is about to start. The first pokèmon is ${store.oppo_pokemon.name}`
            const trainer_image = this.add.image(store.oppo_trainer.position.x, store.oppo_trainer.position.y, 'trainer_' + store.oppo_trainer.name).setScale(store.oppo_trainer.scale)
        }

        const backgroundTexture = this.textures.get(BATTLE_BACKGROUND_ASSET_KEYS.FOREST_NIGHT);
        const backgroundImage = this.add.image(0, 0, BATTLE_BACKGROUND_ASSET_KEYS.FOREST_NIGHT).setOrigin(0);

        const scaleX = this.sys.canvas.width / backgroundTexture.source[0].width;
        const scaleY = this.sys.canvas.height / backgroundTexture.source[0].height;
        const ally_starter_animation_key = `ally_${store.my_pokemon.name}_anim`
        const enemy_starter_animation_key = `oppo_${store.oppo_pokemon.name}_anim`
        backgroundImage.setScale(scaleX, scaleY);
        store.oppo_pokemon.drawSprite(this, false)
        store.my_pokemon.drawSprite(this, true)
        store.oppo_pokemon.images.front.animation_key = enemy_starter_animation_key
        store.my_pokemon.images.back.animation_key = ally_starter_animation_key
        this.anims.create({
            key: enemy_starter_animation_key,
            frames: this.anims.generateFrameNumbers(store.oppo_pokemon.images.front.key, { start: 0, end: store.oppo_pokemon.images.front.frames - 1 }),
            frameRate: 20,
            repeat: -1,
        });
        this.anims.create({
            key: ally_starter_animation_key,
            frames: this.anims.generateFrameNumbers(store.my_pokemon.images.back.key, { start: 0, end: store.my_pokemon.images.back.frames - 1 }),
            frameRate: 20,
            repeat: -1,
        });
        store.my_bench.forEach((member, index) => {
            member.sprite = store.my_pokemon.sprite
            let new_anim_key = `ally_${member.name}_${index}_anim`
            this.anims.create({
                key: new_anim_key,
                frames: this.anims.generateFrameNumbers(member.images.back.key, { start: 0, end: member.images.back.frames - 1 }),
                frameRate: 20,
                repeat: -1,
            });
            member.images.back.animation_key = new_anim_key
        });
        if (store.battle_type == 'trainer') {
            store.oppo_bench.forEach((member, index) => {
                member.sprite = store.oppo_pokemon.sprite
                let new_anim_key = `oppo_${member.name}_${index}_anim`
                this.anims.create({
                    key: new_anim_key,
                    frames: this.anims.generateFrameNumbers(member.images.front.key, { start: 0, end: member.images.front.frames - 1 }),
                    frameRate: 20,
                    repeat: -1,
                });
                member.images.front.animation_key = new_anim_key
            });
        }
        //only show huds once the battle transition is over
        await map_store.createSceneTransition(this)
        store.show_hud = true




        // Play the animations
        store.oppo_pokemon.sprite.play(enemy_starter_animation_key);
        store.my_pokemon.sprite.play(ally_starter_animation_key);
        store.oppo_pokemon.playSwitchAnim()
        store.my_pokemon.playSwitchAnim()
    }

    async changeAllyPokemonSprite(newPokemon) {
        // when a pokemon is switched out, all his stats are restored, and he heals from confusion if he is
        store.my_pokemon.resetStats()
        store.my_pokemon.confused = false
        const bench_index = store.my_bench.indexOf(newPokemon)
        const retire_animation_speed = store.my_pokemon.fainted ? 0.1 : 0.8
        store.menu_state = 'text';
        store.info_text = `${newPokemon.name} is coming onto the battlefield`
        await store.delay(store.info_text.length * store.config.text_speed);
        const initial_scale_val = store.my_pokemon.sprite.scale
        await store.my_pokemon.playRetireAnim(retire_animation_speed)
        store.my_pokemon.sprite.stop();
        store.my_bench.splice(bench_index, 1)
        // pokemon lost after ko rule
        if (!store.my_pokemon.fainted) {
            store.my_bench.push(store.my_pokemon)
        }
        // heal provisional status effects
        if (store.my_pokemon.confused) {
            store.my_pokemon.confused = false
        }
        store.my_pokemon = newPokemon
        store.my_pokemon.sprite.setTexture(newPokemon.images.back.key);
        store.my_pokemon.sprite.play(newPokemon.images.back.animation_key);
        store.my_pokemon.setPropScale()
        store.my_pokemon.sprite.setAlpha(1)
        await store.my_pokemon.playSwitchAnim(initial_scale_val)
    }

    async changeOpponentPokemonSprite(newPokemon) {
        console.log(newPokemon)
        // when a pokemon is switched out, all his stats are restored, and he heals from confusion if he is
        store.oppo_pokemon.resetStats()
        store.oppo_pokemon.confused = false
        const bench_index = store.oppo_bench.indexOf(newPokemon)
        const retire_animation_speed = store.oppo_pokemon.fainted ? 0.1 : 0.8
        store.menu_state = 'text';
        store.info_text = `${newPokemon.name} is coming onto the battlefield`
        await store.delay(store.info_text.length * store.config.text_speed);
        const initial_scale_val = store.oppo_pokemon.sprite.scale
        await store.oppo_pokemon.playRetireAnim(retire_animation_speed)
        store.oppo_pokemon.sprite.stop();
        store.oppo_bench.splice(bench_index, 1)
        // pokemon lost after ko rule
        if (!store.oppo_pokemon.fainted) {
            store.oppo_bench.push(store.oppo_pokemon)
        }
        // heal provisional status effects

        store.oppo_pokemon = newPokemon
        store.oppo_pokemon.sprite.setTexture(newPokemon.images.front.key);
        store.oppo_pokemon.sprite.play(newPokemon.images.front.animation_key);
        store.oppo_pokemon.setPropScale()
        store.oppo_pokemon.sprite.setAlpha(1)
        await store.oppo_pokemon.playSwitchAnim(initial_scale_val)
    }


}