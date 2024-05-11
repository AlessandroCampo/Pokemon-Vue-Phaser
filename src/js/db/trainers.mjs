import { Pokemons } from "./pokemons.mjs";

import { all_moves } from "./moves.mjs";
import { all_items } from "./items.mjs";


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






const mudkip_moveset = [deepClone(all_moves.mud_shot), deepClone(all_moves.ice_beam), deepClone(all_moves.tackle), deepClone(all_moves.brine)];
const carvahna_moveset = [deepClone(all_moves.aqua_jet), deepClone(all_moves.poison_fang), deepClone(all_moves.ice_fang), deepClone(all_moves.bite)];
const tirtogua_moveset = [deepClone(all_moves.rock_slide), deepClone(all_moves.brine), deepClone(all_moves.aqua_jet), deepClone(all_moves.mud_shot)];
const archie_krabby_moveset = [deepClone(all_moves.metal_claw), deepClone(all_moves.mud_shot), deepClone(all_moves.aqua_jet), deepClone(all_moves.stomp)];
const roxanne_lunatone_moveset = [deepClone(all_moves.moonlight), deepClone(all_moves.confusion), deepClone(all_moves.rock_slide), deepClone(all_moves.hypnosis)];
const roxanne_nosepass_moveset = [deepClone(all_moves.self_destruct), deepClone(all_moves.seismic_toss), deepClone(all_moves.thunder_wave), deepClone(all_moves.rock_trhow)];
const roxanne_lileep_moveset = [deepClone(all_moves.giga_drain), deepClone(all_moves.sludge_bomb), deepClone(all_moves.recover), deepClone(all_moves.rock_tomb)];
const foongus_moveset = [deepClone(all_moves.synthesis), deepClone(all_moves.mega_drain), deepClone(all_moves.toxic), deepClone(all_moves.stun_spore)];
const frillish_moveset = [deepClone(all_moves.hex), deepClone(all_moves.water_pulse), deepClone(all_moves.shock_wave), deepClone(all_moves.recover)];
const whirlipede_moveset = [deepClone(all_moves.poison_tail), deepClone(all_moves.venoshock), deepClone(all_moves.bug_bite), deepClone(all_moves.toxic)];
const roxanne_archen_moveset = [deepClone(all_moves.dragon_breath), deepClone(all_moves.bulldoze), deepClone(all_moves.wing_attack), deepClone(all_moves.rock_slide)];
const heracross_moveset = [deepClone(all_moves.brick_break), deepClone(all_moves.aerial_ace), deepClone(all_moves.bug_bite), deepClone(all_moves.night_slash)];
const scolipede_moveset = [deepClone(all_moves.toxic), deepClone(all_moves.rock_climb), deepClone(all_moves.bug_bite), deepClone(all_moves.rock_slide)];
const beautifly_moveset = [deepClone(all_moves.air_cutter), deepClone(all_moves.giga_drain), deepClone(all_moves.bug_bite), deepClone(all_moves.psychic)];
const kricketune_moveset = [deepClone(all_moves.giga_drain), deepClone(all_moves.night_slash), deepClone(all_moves.x_scissor), deepClone(all_moves.slash)];



const erika = new Trainer({
    name: 'erika',
    lead: deepClone(Pokemons.scolipede),
    bench: [deepClone(Pokemons.heracross), deepClone(Pokemons.kricketune), deepClone(Pokemons.beautifly)],
    position: {
        x: 950,
        y: 320
    },
    scale: 0.3,
    squad_level: 20,
    items: [all_items.focus_sash, all_items.focus_sash, all_items.focus_sash, all_items.focus_sash],
    moveset: [scolipede_moveset, heracross_moveset, kricketune_moveset, beautifly_moveset]

})



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
    items: [all_items.sitrus_berry, all_items.lum_berry, all_items.sitrus_berry, all_items.sitrus_berry]

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
    items: []

})


const roxanne = new Trainer({
    name: 'rayneera',
    lead: deepClone(Pokemons.nosepass),
    bench: [deepClone(Pokemons.lunatone), deepClone(Pokemons.lileep), deepClone(Pokemons.archen)],
    position: {
        x: 950,
        y: 320
    },
    scale: 0.3,
    squad_level: 15,
    moveset: [roxanne_nosepass_moveset, roxanne_lunatone_moveset, roxanne_lileep_moveset, roxanne_archen_moveset],
    items: [all_items.sitrus_berry, all_items.lum_berry, all_items.sitrus_berry, all_items.sitrus_berry]


})




// archie.lead.moves = mudkip_moveset
// archie.bench[0].moves = tirtogua_moveset
// archie.bench[1].moves = squirtle_moveset

export const trainers = {
    roxanne, erika, archie, aqua_grunt
}