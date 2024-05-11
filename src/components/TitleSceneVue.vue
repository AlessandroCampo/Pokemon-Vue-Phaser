<template>
    <div class="title-scene-controller">
        <img src="/icons/logo.png" class="logo">
        <p v-if="!show_start_menu">
            Press <img src="/icons/enter.png"> to start
        </p>
        <div v-else class="menu-container">
            <div class="menu-block" v-for="(voice, index) in menu_voices" :key="index"
                :class="index == active_voice ? 'pulsating' : ''">
                <i class="fa-solid fa-chevron-right" v-if="index == active_voice"></i>
                <span>
                    {{ voice.label }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { SCENE_KEYS } from '@/js/scenes/scene-keys.mjs';
import { map_store } from '@/mapStore.mjs';
import { ref, onMounted, onBeforeUnmount } from 'vue'
let show_start_menu = ref(false)
let active_voice = ref(0)

const menu_voices = [
    {
        label: 'NEW GAME', callback: async () => {

            await map_store.startNewGame()
            map_store.preload_scene_istance.scene.start(SCENE_KEYS.WORLD_SCENE)
            map_store.show_title_scene = false
            map_store.show_start_scene = true
        }
    },
    {
        label: 'LOAD GAME', callback: async () => {
            await map_store.logUser()
            map_store.preload_scene_istance.scene.start(SCENE_KEYS.WORLD_SCENE)
            map_store.show_title_scene = false
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


    if (e.key == 'Enter') {
        if (!show_start_menu.value) {

            show_start_menu.value = true
            return
        } else {
            menu_voices[active_voice.value].callback()
        }
    }

    else if (e.key == 'ArrowUp') {
        active_voice.value--
        if (active_voice.value < 0) {
            active_voice.value = menu_voices.length - 1

        }


    } else if (e.key == 'ArrowDown') {
        active_voice.value++
        if (active_voice.value > menu_voices.length - 1) {
            active_voice.value = 0
        }
    }
    else {
        return
    }
}
</script>

<style scoped>
.title-scene-controller {
    background-image: url('/backgrounds/wallpaper.png');
    position: absolute;
    z-index: 3;
    width: 100vw;
    height: 100vh;
    background-size: cover;
    background-position: top;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: start;
    padding-block: 3em;
}

@keyframes pulsate {
    0% {
        transform: scale(1);
        filter: brightness(100%);
    }

    50% {
        transform: scale(1.2);
        filter: brightness(120%);
    }

    100% {
        transform: scale(1);
        filter: brightness(100%);
    }
}

p {
    font-size: 3em;
    animation: pulsate 2s infinite alternate;
}

.pulsating {
    animation: pulsate 2s infinite alternate;
}


p img {
    height: 1em;
    margin-inline: 15px;
}

.logo {
    height: 600px;
}

.menu-container {
    display: flex;
    flex-direction: column;
    gap: 2em;
}

.menu-block {
    background-color: rgba(255, 255, 255, 0.3);
    font-size: 2.5em;
    height: 80px;
    width: 300px;
    display: flex;
    align-items: center;
    padding-inline: 1em;
    border: 3px solid black;
    text-align: center;
    justify-content: center;
    position: relative;
}

.menu-block i {
    position: absolute;
    left: -20%;
}
</style>