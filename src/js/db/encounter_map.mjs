import { Pokemons } from "./pokemons.mjs"

export let encounter_map = [{
    map_name: 'start',
    possible_encounters: [
        { pokemon: Pokemons.meowth, chance: 0.1 },
        { pokemon: Pokemons.poochyena, chance: 0.2 },
        { pokemon: Pokemons.ralts, chance: 0.05 },
        { pokemon: Pokemons.wingull, chance: 0.2 },
        { pokemon: Pokemons.zigzagoon, chance: 0.3 },
        { pokemon: Pokemons.electrike, chance: 0.15 }
    ],
    level_average: 3,
}];
