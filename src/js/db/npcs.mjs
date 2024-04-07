import { tile_size } from "../scenes/world-scene"
import { store } from "@/store"
import { map_store } from "@/mapStore"
import { all_items } from "./items.mjs"


let npc_1 = {
    dialouge: ['You dare coming to my house with an army of pokemons?'],
    name: 'NPC_1',
    frameWidth: 64,
    frameHeight: 64,
    scale: 0.35,


}

let npc_2 = {
    dialouge: ['This town will have no peace until someone defeats Duke Reyneera...'],
    name: 'NPC_2',
    frameWidth: 32,
    frameHeight: 48,
    scale: 0.5,


}

let merchant = {
    dialouge: ['Hey, do you want a berry? Its free!'],
    name: 'merchant',
    frameWidth: 32,
    frameHeight: 48,
    scale: 0.5,



}

export const all_npcs = { npc_1, npc_2, merchant }