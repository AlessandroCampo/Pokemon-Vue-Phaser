<template>
    <div class="lateral-menu">
        <div class="menu-voice" v-for="(voice, index) in menu_voices" :key="voice.label">
            <i class="fa-solid fa-caret-right" :class="index !== active_voice ? 'hidden' : ''"></i>
            <span>
                {{ voice.label }}
            </span>

        </div>
    </div>
</template>

<script setup>

import { map_store } from "@/mapStore"
import { store } from "@/store"
import { ref, onMounted, onBeforeUnmount } from 'vue'

let active_voice = ref(0)


const menu_voices = [
    {
        label: 'Pokemons',
        callback: async () => {
            if (!store.my_pokemon) {
                store.menu_state = 'text'
                store.info_text = "You don't have your first pokemon yet, maybe Gwain can help you"
                await store.delay(store.info_text.length * store.config.text_speed + 500)
                return
            }
            map_store.show_party_menu = true
        }
    },
    {
        label: 'Inventory',
        callback: async () => {
            if (store.my_items.length == 0) {
                store.menu_state = 'text'
                store.info_text = "You don't have any item yet"
                await store.delay(store.info_text.length * store.config.text_speed + 500)
                return
            }
            map_store.show_inventory_menu = true
        }
    },
    {
        label: 'Save',
        callback: async () => {
            await map_store.updateDB()
            map_store.show_menu = false
            store.menu_state = 'text'
            store.info_text = 'Your data has been successfully saved'
            await store.delay(store.info_text.length * store.config.text_speed + 500)
            store.menu_state = 'hidden'
        }
    },
    {
        label: 'Exit',
        callback: () => {
            map_store.show_menu = false
        }
    },

]

onMounted(() => {

    window.addEventListener('keydown', handleMovesInput)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleMovesInput)
})

const handleMovesInput = async function (e) {

    if (!map_store.show_menu) {

        return
    }

    if (e.key == 'Enter') {
        if (menu_voices[active_voice.value].callback) {
            menu_voices[active_voice.value].callback()
        }

    }

    else if (e.key == 'Backspace') {
        map_store.show_menu = false
    }
    else if (e.key == 'ArrowUp') {
        active_voice.value--
        if (active_voice.value < 0) active_voice.value = menu_voices.length - 1

    } else if (e.key == 'ArrowDown') {
        active_voice.value++
        if (active_voice.value > menu_voices.length - 1) active_voice.value = 0
    }
    else {
        return
    }
}
</script>

<style scoped>
.lateral-menu {
    display: flex;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    flex-direction: column;
    font-size: 3em;
    gap: 1em;
    align-items: center;
    padding-block: 30px;
    border: 10px solid green;
    color: white;
    background-color: rgb(0, 60, 0, 0.8);
    width: 300px;
}

.menu-voice {
    display: flex;
    align-items: center;
    gap: 0.5em;
    width: 100%;
    justify-content: start;
    padding-inline: 10px;
}

.hidden {
    opacity: 0;
}
</style>