const base_path = '/icons/items/'
import gsap from 'gsap'


let oppo_position = {
    x: 798,
    y: 395
}

class Item {
    constructor({ name, price, effect, description, img_path, owned_amount, sprite, asset_key, can_be_used_in_battle }) {
        this.name = name
        this.price = price || 0
        this.effect = effect || null
        this.description = description
        this.img_path = img_path
        this.owned_amount = 1
        this.sprite = null
        this.asset_key = asset_key || null
        this.can_be_used_in_battle = can_be_used_in_battle
    }

    drawSprite(scene) {
        console.log('draw sprite');
        return new Promise((resolve, reject) => {
            // Load the image in the scene
            scene.load.image(this.name, this.img_path);

            // Get the Loader instance
            const loader = scene.load;

            // Attach an event listener for when loading is complete
            loader.once('complete', () => {
                // Create the sprite once loading is complete
                this.sprite = scene.add.image(300, 300, this.name).setScale(0.4);
                console.log('sprite loaded');
                resolve(); // Resolve the Promise
            });

            // Start loading
            loader.start();
        });
    }


}

export class Ball extends Item {
    constructor({ name, price, effect, description, img_path, catch_multiplier, owned_amount, sprite, asset_key, can_be_used_in_battle }) {
        super({ name, price, effect, description, img_path, owned_amount, sprite, asset_key, can_be_used_in_battle });

        this.catch_multiplier = catch_multiplier;
        this.type = 'ball'
    }


    drawSprite(scene) {
        console.log('draw sprite');
        return new Promise((resolve, reject) => {
            // Load the image in the scene
            scene.load.image(this.name, this.img_path);

            // Get the Loader instance
            const loader = scene.load;

            // Attach an event listener for when loading is complete
            loader.once('complete', () => {
                // Create the sprite once loading is complete
                this.sprite = scene.add.image(300, 300, this.name).setScale(0.4);
                console.log('sprite loaded');
                resolve(); // Resolve the Promise
            });

            // Start loading
            loader.start();
        });
    }

    use() {
        console.log(`Throw ${this.name} at a Pokémon to catch it.`);
    }

    async drawAndThrowAnimation(battleScene) {
        await this.drawSprite(battleScene); // Draw the sprite and wait for it to be loaded
        await this.throwAnimation(); // Play throw animation
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
    constructor({ name, price, effect, description, img_path, owned_amount, sprite, asset_key, amount, can_be_used_in_battle }) {
        super({ name, price, effect, description, img_path, owned_amount, sprite, asset_key, amount, can_be_used_in_battle });
        this.amount = amount
        this.can_be_used_in_battle = true
        this.type = 'potion'
    }


}

export class Antidote extends Item {
    constructor({ name, price, effect, description, img_path, owned_amount, sprite, asset_key, helead_status, can_be_used_in_battle }) {
        super({ name, price, effect, description, img_path, owned_amount, sprite, asset_key, can_be_used_in_battle });
        this.helead_status = helead_status
        this.can_be_used_in_battle = true
        this.type = 'antidote'
    }
}

const lum_berry = new Item({
    name: 'Lum Berry',
    description: 'If a Pokémon holds one of these Berries, it will be able to cure itself of any status condition it may have.',
    img_path: base_path + 'lum_berry.png',
    asset_key: 'lum_berry',
    can_be_used_in_battle: true
})

const sitrus_berry = new Potion({
    name: 'Sitrus Berry',
    description: 'If a Pokémon holds one of these Berries, it will be able to restore a small amount of HP to itself.',
    img_path: base_path + 'sitrus_berry.png',
    asset_key: 'sitrus_berry',
    can_be_used_in_battle: true,
    amount: 0.25,
})

const poke_ball = new Ball({
    name: 'Pokè Ball',
    description: 'A device for catching wild Pokémon. It’s thrown like a ball at a Pokémon, comfortably encapsulating its target.',
    img_path: base_path + 'pokeball.png',
    catch_multiplier: 1,
    asset_key: 'pokeball',
    can_be_used_in_battle: true

})

const mega_ball = new Ball({
    name: 'Mega Ball',
    description: 'A good, high-performance Poké Ball that provides a higher success rate for catching Pokémon than a standard Poké Ball.',
    img_path: base_path + 'megaball.png',
    catch_multiplier: 1.5,
    asset_key: 'megaball',
    can_be_used_in_battle: true

})

const potion = new Potion({
    name: 'Potion',
    description: 'A spray-type medicine for treating wounds. It can be used to restore 20% HP to a Pokémon.',
    img_path: base_path + 'potion.png',
    amount: 0.25,
    asset_key: 'potion',
})

const paralyze_heal = new Antidote({
    name: 'Paralyze Heal',
    description: 'A spray-type medicine for treating paralysis. It can be used to free a Pokémon that has been paralyzed.',
    img_path: base_path + 'paralyze_heal.png',
    helead_status: 'paralyzed',
    asset_key: 'paralyze_heal',
})

const awakening = new Antidote({
    name: 'Awakening',
    description: 'A spray-type medicine for treating paralysis. It can be used to free a Pokémon that is asleep.',
    img_path: base_path + 'awakening.png',
    helead_status: 'asleep',
    asset_key: 'awakening',
})

export const all_items = {
    lum_berry,
    sitrus_berry,
    poke_ball,
    potion,
    awakening,
    paralyze_heal
}