const base_path = '/icons/items/'
import gsap from 'gsap'


let oppo_position = {
    x: 798,
    y: 395
}

class Item {
    constructor({ name, price, effect, description, img_path, owned_amount, sprite, asset_key, can_be_used_in_battle, consumable, type, amount }) {
        this.name = name
        this.price = price || 0
        this.effect = effect || null
        this.description = description
        this.img_path = img_path
        this.owned_amount = 1
        this.sprite = null
        this.asset_key = asset_key || null
        this.can_be_used_in_battle = can_be_used_in_battle
        this.consumable = consumable || false
        this.type = type || null
        this.amount = amount
    }

    // drawSprite(scene) {
    //     console.log('draw sprite');
    //     return new Promise((resolve, reject) => {
    //         // Load the image in the scene
    //         scene.load.image(this.name, this.img_path);

    //         // Get the Loader instance
    //         const loader = scene.load;

    //         // Attach an event listener for when loading is complete
    //         loader.once('complete', () => {
    //             // Create the sprite once loading is complete
    //             this.sprite = scene.add.image(300, 300, this.name).setScale(0.4);
    //             console.log('sprite loaded');
    //             resolve(); // Resolve the Promise
    //         });

    //         // Start loading
    //         loader.start();
    //     });
    // }


}

export class Ball extends Item {
    constructor({ name, price, effect, description, img_path, catch_multiplier, owned_amount, sprite, asset_key, can_be_used_in_battle, consumable }) {
        super({ name, price, effect, description, img_path, owned_amount, sprite, asset_key, can_be_used_in_battle, consumable });

        this.catch_multiplier = catch_multiplier;
        this.type = 'ball'
    }


    drawSprite(scene) {
        this.sprite = scene.add.image(300, 300, this.name).setScale(0.4);


    }

    use() {

    }

    async drawAndThrowAnimation(battleScene) {
        this.drawSprite(battleScene);
        await this.throwAnimation();
    }

    async throwAnimation() {
        const tl = gsap.timeline()
        return new Promise(resolve => {
            tl.to(this.sprite, {
                x: oppo_position.x,
                y: oppo_position.y - 200,
            }).to(this.sprite, {
                y: oppo_position.y - 15,
                onComplete() {
                    resolve()
                }
            })
        })

    }

    async animateShake() {
        const tl = gsap.timeline()
        return new Promise(resolve => {
            tl.to(this.sprite, { rotation: -0.5, duration: 0.2 })
                .to(this.sprite, { rotation: 0.5, duration: 0.4 })
                .to(this.sprite, { rotation: 0, duration: 0.2, onComplete: () => { resolve() } })
        })
    }
}

export class Potion extends Item {
    constructor({ name, price, effect, description, img_path, owned_amount, sprite, asset_key, amount, can_be_used_in_battle, consumable }) {
        super({ name, price, effect, description, img_path, owned_amount, sprite, asset_key, amount, consumable });
        this.amount = amount
        this.can_be_used_in_battle = true
        this.type = 'potion'
        this.consumable = true
    }


}

export class Antidote extends Item {
    constructor({ name, price, effect, description, img_path, owned_amount, sprite, asset_key, helead_status, can_be_used_in_battle }) {
        super({ name, price, effect, description, img_path, owned_amount, sprite, asset_key });
        this.helead_status = helead_status
        this.can_be_used_in_battle = true
        this.type = 'antidote'
        this.consumable = true
    }
}

const repel = new Item({
    name: 'Repel',
    description: 'An item that prevents weak wild Pokémon from appearing for 100 steps after its use.',
    img_path: base_path + 'repel.png',
    asset_key: 'repel',
    can_be_used_in_battle: false,
    consumable: true,
    type: 'repel',
    price: 250,
    amount: 200
})


const rare_candy = new Item({

    name: 'Rare Candy',
    description: 'A candy that is packed with energy. If consumed, it raises a Pokémon’s level by one.',
    img_path: base_path + 'rare_candy.png',
    asset_key: 'rare_candy',
    can_be_used_in_battle: false,
    consumable: true,
    type: 'candy'
})

const lum_berry = new Item({
    name: 'Lum Berry',
    description: 'If a Pokémon holds one of these Berries, it will be able to cure itself of any status condition it may have.',
    img_path: base_path + 'lum_berry.png',
    asset_key: 'lum_berry',
    can_be_used_in_battle: false,
    consumable: false,
})

const focus_sash = new Item({
    name: 'Focus Sash',
    description: 'An item to be held by a Pokémon. If the holder has full HP and it is hit with a move that should knock it out, it will endure with 1 HP—but only once.',
    img_path: base_path + 'lum_berry.png',
    asset_key: 'focus_sash',
    can_be_used_in_battle: false,
    consumable: false,
})


const sitrus_berry = new Potion({
    name: 'Sitrus Berry',
    description: 'If a Pokémon holds one of these Berries, it will be able to restore a small amount of HP to itself.',
    img_path: base_path + 'sitrus_berry.png',
    asset_key: 'sitrus_berry',
    can_be_used_in_battle: false,
    amount: 0.25,
    consumable: true,
    type: 'potion'
})

const poke_ball = new Ball({
    name: 'Pokè Ball',
    description: 'A device for catching wild Pokémon. It’s thrown like a ball at a Pokémon, comfortably encapsulating its target.',
    img_path: base_path + 'pokeball.png',
    catch_multiplier: 1,
    asset_key: 'pokeball',
    can_be_used_in_battle: true,
    price: 200,

})

const mega_ball = new Ball({
    name: 'Mega Ball',
    description: 'A good, high-performance Poké Ball that provides a higher success rate for catching Pokémon than a standard Poké Ball.',
    img_path: base_path + 'megaball.png',
    catch_multiplier: 1000.5,
    asset_key: 'megaball',
    can_be_used_in_battle: true,
    price: 600

})

const potion = new Potion({
    name: 'Potion',
    description: 'A spray-type medicine for treating wounds. It can be used to restore 20% HP to a Pokémon.',
    img_path: base_path + 'potion.png',
    amount: 0.25,
    asset_key: 'potion',
    consumable: true,
    price: 300
})

const paralyze_heal = new Antidote({
    name: 'Paralyze Heal',
    description: 'A spray-type medicine for treating paralysis. It can be used to free a Pokémon that has been paralyzed.',
    img_path: base_path + 'paralyze_heal.png',
    helead_status: 'paralyzed',
    asset_key: 'paralyze_heal',
    consumable: true,
    price: 250,
})

const awakening = new Antidote({
    name: 'Awakening',
    description: 'A spray-type medicine for treating paralysis. It can be used to free a Pokémon that is asleep.',
    img_path: base_path + 'awakening.png',
    helead_status: 'asleep',
    asset_key: 'awakening',
    consumable: true,
    price: 250
})

export const all_items = {
    lum_berry,
    sitrus_berry,
    poke_ball,
    potion,
    awakening,
    paralyze_heal,
    rare_candy,
    mega_ball,
    repel,
    focus_sash
}

export const all_items_array = [lum_berry, sitrus_berry, poke_ball, potion, mega_ball, awakening, paralyze_heal, repel, focus_sash]