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
    constructor({ name, bench, lead, items, position, scale, squad_level, moveset, boss }) {
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
        this.boss = boss || true
    }
}

// const blue = new Trainer({
//     name: 'Bluse',
//     lead: Pokemons.aggron,
//     bench: [Pokemons.treecko, Pokemons.mudkip]
// })



const erika = new Trainer({
    name: 'erika',
    lead: Pokemons.scolipede,
    bench: [Pokemons.heracross, Pokemons.erika_kricketune],
    position: {
        x: 950,
        y: 320
    },
    scale: 0.3,
    squad_level: 25,
    moveset: []

})


const mudkip_moveset = [{ ...all_moves.mud_shot }, { ...all_moves.ice_beam }, { ...all_moves.tackle }, { ...all_moves.brine }]
const carvahna_moveset = [{ ...all_moves.aqua_jet }, { ...all_moves.poison_fang }, { ...all_moves.ice_fang }, { ...all_moves.bite }]
const tirtogua_moveset = [{ ...all_moves.rock_slide }, { ...all_moves.brine }, { ...all_moves.aqua_jet }, { ...all_moves.mud_shot }]
const archie_krabby_moveset = [{ ...all_moves.metal_claw }, { ...all_moves.mud_shot }, { ...all_moves.aqua_jet }, { ...all_moves.stomp }]
const roxanne_lunatone_moveset = [{ ...all_moves.moonlight }, { ...all_moves.confusion }, { ...all_moves.rock_slide }, { ...all_moves.hypnosis }]
const roxanne_nosepass_moveset = [{ ...all_moves.self_destruct }, { ...all_moves.seismic_toss }, { ...all_moves.thunder_wave }, { ...all_moves.rock_trhow }]
const roxanne_lileep_moveset = [{ ...all_moves.giga_drain }, { ...all_moves.sludge_bomb }, { ...all_moves.recover }, { ...all_moves.rock_tomb }]
const foongus_moveset = [{ ...all_moves.synthesis }, { ...all_moves.mega_drain }, { ...all_moves.toxic }, { ...all_moves.stun_spore }]
const frillish_moveset = [{ ...all_moves.hex }, { ...all_moves.water_pulse }, { ...all_moves.shock_wave }, { ...all_moves.recover }]

const whirlipede_moveset = [{ ...all_moves.poison_tail }, { ...all_moves.venoshock }, { ...all_moves.bug_bite }, { ...all_moves.toxic }]
const roxanne_archen_moveset = [{ ...all_moves.dragon_breath }, { ...all_moves.bulldoze }, { ...all_moves.wing_attack }, { ...all_moves.rock_slide }]

const archie = new Trainer({
    name: 'archie',
    lead: deepClone(Pokemons.tirtouga),
    bench: [deepClone(Pokemons.marshtomp), deepClone(Pokemons.carvanha), deepClone(Pokemons.krabby)],
    position: {
        x: 950,
        y: 310
    },
    scale: 0.15,
    squad_level: 15,
    moveset: [tirtogua_moveset, mudkip_moveset, carvahna_moveset, archie_krabby_moveset],

})

const aqua_grunt = new Trainer({
    name: 'aqua grunt',
    lead: deepClone(Pokemons.foongus),
    bench: [deepClone(Pokemons.carvanha), deepClone(Pokemons.whirlipede), deepClone(Pokemons.frillish)],
    position: {
        x: 950,
        y: 320
    },
    scale: 0.10,
    squad_level: 15,
    moveset: [foongus_moveset, carvahna_moveset, whirlipede_moveset, frillish_moveset],

})


const roxanne = new Trainer({
    name: 'Rayneera',
    lead: deepClone(Pokemons.nosepass),
    bench: [deepClone(Pokemons.lunatone), deepClone(Pokemons.lileep), deepClone(Pokemons.archen)],
    position: {
        x: 950,
        y: 320
    },
    scale: 0.3,
    squad_level: 15,
    moveset: [roxanne_nosepass_moveset, roxanne_lunatone_moveset, roxanne_lileep_moveset, roxanne_archen_moveset],


})




// archie.lead.moves = mudkip_moveset
// archie.bench[0].moves = tirtogua_moveset
// archie.bench[1].moves = squirtle_moveset

export const trainers = {
    roxanne, erika, archie, aqua_grunt
}