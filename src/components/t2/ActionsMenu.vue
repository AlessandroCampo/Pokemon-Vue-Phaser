<template>
    <div class="options-menu">
        <button v-for="(voice, index) in  menu_voices" :key="index" @click="voice.callback"
            :class="index == active_voice ? 'active' : ''">
            <i class="fa-solid fa-chevron-right" v-if="index == active_voice"></i>
            <img :src="voice.path">
        </button>

    </div>
</template>

<script setup>
import { store } from "@/store";
import Phaser from "phaser";
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { BattleScene } from "@/js/scenes/battle-scene.mjs";
import { Pokemons } from "@/js/db/pokemons.mjs";
let active_voice = ref(0)


onMounted(() => {
    window.addEventListener('keydown', handleAtionsInput)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleAtionsInput)
})


const open_menu_page = async function (page) {
    if (page == 'switch' && store.my_bench.length == 0) {
        store.menu_state = 'text'
        store.info_text = "You have no other pokemons..."
        await store.delay(store.info_text.length * store.config.text_speed + 200)
        store.menu_state = 'options'
        return
    }
    store.menu_state = page
}

const menu_voices = ref([
    {
        path: '/badges/fight.png',
        page: 'moves',
        callback: () => {
            open_menu_page('moves')
        }
    },
    {
        path: '/badges/pokemon.png',
        page: 'pokemons',
        callback: () => {
            open_menu_page('switch')
        }
    },
    {
        path: '/badges/bag.png',
        page: 'items'
    },
    {
        path: '/badges/run.png',
        page: 'moves'
    },
])

const handleAtionsInput = function (e) {
    if (store.menu_state !== 'options') return
    if (e.key == 'Enter') {

        const new_page = menu_voices.value[active_voice.value]
        new_page.callback()
    }
    if (e.key == 'ArrowUp') {
        active_voice.value--
        if (active_voice.value < 0) active_voice.value = 3
    } else if (e.key == 'ArrowDown') {
        active_voice.value++
        if (active_voice.value > 3) active_voice.value = 0
    } else {
        return
    }
}


</script>



<style scoped>
.options-menu {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    align-items: center;
    position: absolute;
    z-index: 3;
    background-color: transparent;
    bottom: 5%;
    right: 2%;
}

button {
    background-color: transparent;
    cursor: pointer;
    border: 0;
    display: flex;
    align-items: center;

    position: relative;
}

button i {
    position: absolute;
    color: aqua;
    top: 25%;
    left: -20%;
    font-size: 3em;
}

img {
    border: 2px solid black;
    padding: 0;
    cursor: pointer;
    width: 235px;
    cursor: pointer;
    height: 78px;
    border-radius: 30px;

}


img:hover {
    scale: 1.1;
    border: 2px solid aqua;
    filter: brightness(120%);
}

img:focus {
    scale: 1.1;
    border: 2px solid aqua;
}

@keyframes pulsate {
    0% {
        transform: scale(1);
        filter: brightness(100%);
    }

    50% {
        transform: scale(1.1);
        filter: brightness(120%);
    }

    100% {
        transform: scale(1);
        filter: brightness(100%);
    }
}

/* Apply pulsating effect to child img and i elements when parent button is active */
button.active img,
button.active i {
    animation: pulsate 1.5s infinite;
}

button.active img {
    border: 2px solid aqua;
}
</style>