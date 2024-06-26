import { tile_size } from "../scenes/world-scene"
import { store } from "@/store"
import { map_store } from "@/mapStore.mjs"
import { all_items } from "./items.mjs"


let rayneera = {
    dialouge: ['You dare coming to my house with an army of Pokèmons?'],
    name: 'rayneera',
    frameWidth: 64,
    frameHeight: 64,
    scale: 0.4,


}

let npc_2 = {
    dialouge: [],
    name: 'NPC_2',
    frameWidth: 32,
    frameHeight: 48,
    scale: 0.5,
}

let merchant = {
    dialouge: ['Welcome to my shop, if you need anything feel free to ask'],
    name: 'merchant',
    frameWidth: 32,
    frameHeight: 48,
    scale: 0.5,
}

let guard = {
    dialouge: ["Hey, where do you think you're going?"],
    name: 'guard',
    frameWidth: 32,
    frameHeight: 48,
    scale: 0.5,
}

let aqua_grunt = {
    dialouge: ["You know to much now, I'm sorry but I have to kill you"],
    name: 'aqua grunt',
    frameWidth: 32,
    frameHeight: 48,
    scale: 0.5,
}

let bug_catcher = {
    dialouge: ["Oh look, another insect"],
    name: 'bug catcher',
    frameWidth: 32,
    frameHeight: 48,
    scale: 0.5,
}

let erika = {
    dialouge: ['Oh finally a visitor, I wonder why no one ever comes here...'],
    name: 'erika',
    frameWidth: 32,
    frameHeight: 48,
    scale: 0.5,
}


let mom = {
    dialouge: ['Hey, you look hungry, do you want something to eat?'],
    name: 'mom',
    frameWidth: 32,
    frameHeight: 48,
    scale: 0.5,
}


let archie = {
    dialouge: ["I'll teach you not to stick your nose in other people's business"],
    name: 'archie',
    frameWidth: 32,
    frameHeight: 48,
    scale: 0.5,
}

let maxie = {
    dialouge: ["Can't belive three of my peers got defeated by such a nullity, your journey is gonna end here though"],
    name: 'maxie',
    frameWidth: 32,
    frameHeight: 48,
    scale: 0.5,
}




let nurse = {
    dialouge: ['Hey, I will heal all  of your pokemons, wait a second'],
    name: 'nurse',
    frameWidth: 32,
    frameHeight: 48,
    scale: 0.5,
}

export const all_npcs = { rayneera, npc_2, merchant, guard, nurse, bug_catcher, erika, archie, aqua_grunt, mom, maxie }