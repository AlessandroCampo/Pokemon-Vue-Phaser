class Item {
    constructor({ name, price, effect }) {
        this.name = name
        this.price = price || 0
        this.effect = effect || null
    }
}

const lum_berry = new Item({
    name: 'Lum Berry'
})

const sitrus_berry = new Item({
    name: 'Sitrus Berry'
})

export const all_items = {
    lum_berry,
    sitrus_berry
}