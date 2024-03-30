import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { Pokemons } from '@/js/db/pokemons.mjs'

export const useGeneralStore = defineStore('general', {
  state: () => ({
    my_pokemon: { ...Pokemons[0] },
    oppo_pokemon: { ...Pokemons[1] },
  }),
  getters: {


  },
  actions: {

  },
})