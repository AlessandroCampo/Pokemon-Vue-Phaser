import { Pokemons } from "./pokemons.mjs";

import { all_moves } from "./moves.mjs";

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    let clone = Array.isArray(obj) ? [] : {};

    // Copy own properties
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            clone[key] = deepClone(obj[key]);
        }
    }

    // Copy prototype methods
    let prototype = Object.getPrototypeOf(obj);
    let prototypeMethods = Object.getOwnPropertyNames(prototype)
        .filter(prop => typeof prototype[prop] === 'function');
    prototypeMethods.forEach(method => {
        clone[method] = obj[method].bind(clone);
    });

    return clone;
}



export class Trainer {
    constructor({ name, bench, lead, items, position, scale, squad_level, moveset }) {
        this.name = name
        this.bench = bench
        this.lead = lead
        this.items = items || null
        this.scale = scale || 0.2
        this.squad_level = squad_level
        this.position = position || {
            x: 930,
            y: 320
        }
        this.moveset = moveset
        this.location = location || null
    }
}

// const blue = new Trainer({
//     name: 'Bluse',
//     lead: Pokemons.aggron,
//     bench: [Pokemons.treecko, Pokemons.mudkip]
// })

const roxanne = new Trainer({
    name: 'Rayneera',
    lead: Pokemons.nosepass,
    bench: [Pokemons.lunatone, Pokemons.lileep, Pokemons.nosepass],
    position: {
        x: 950,
        y: 320
    },
    scale: 0.3,
    squad_level: 15,
    moveset: []

})

export const trainers = {
    roxanne
}