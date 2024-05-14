<template>
    <div class="title-scene-controller">
        <img src="/icons/logo.png" class="logo">
        <div v-if="!show_start_menu" class="start">
            <p v-if="map_store.loading">
                <img src="/icons/ball.png" class="spinner">
            </p>
            <p v-else>
                Press <img src="/icons/enter.png"> to start
            </p>

        </div>
        <div v-else class="menu-container" v-show="!choosing_name">
            <div class="menu-block" v-for="(voice, index) in menu_voices" :key="index"
                :class="[index === active_voice ? 'pulsating' : '', voice.label]">
                <i class="fa-solid fa-chevron-right" v-if="index == active_voice"></i>
                <span>
                    {{ voice.label }}
                </span>
            </div>

            <div class="menu-block choose-diff" :class="store.level_diff" v-if="active_voice == 0">
                <i class="fa-solid fa-arrow-left"></i>
                <span>
                    {{ store.level_diff }}
                </span>
                <i class="fa-solid fa-arrow-right"></i>
            </div>
        </div>
        <div class="choosing-name" v-show="choosing_name">
            <p>
                What's your name?
            </p>
            <input type="text" id="player_name">
        </div>


    </div>
</template>

<script setup>
import { SCENE_KEYS } from '@/js/scenes/scene-keys.mjs';
import { map_store } from '@/mapStore.mjs';
import { store } from '@/store';
import { ref, onMounted, onBeforeUnmount } from 'vue'
let show_start_menu = ref(false)
let active_voice = ref(0)
let choosing_name = ref(false)




const menu_voices = [
    {
        label: 'NEW GAME', callback: async () => {
            if (!choosing_name.value) {
                choosing_name.value = true
                let name_input = document.getElementById('player_name')
                setTimeout(() => { name_input.focus() }, 100)

                return
            }
            let name_input = document.getElementById('player_name')

            if (name_input.value.length <= 0) {
                return
            } else {
                store.player_info.name = name_input.value
            }

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
            if (map_store.loading) {
                return
            }
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
    } else if (e.key == 'ArrowRight') {
        if (store.level_diff == 'HARDCORE') {
            store.level_diff = 'EASY'
        } else if (store.level_diff == 'EASY') {
            store.level_diff = 'MEDIUM'
        } else if (store.level_diff == 'MEDIUM') {
            store.level_diff = 'HARDCORE'
        }
    } else if (e.key == 'ArrowLeft') {
        if (store.level_diff == 'HARDCORE') {
            store.level_diff = 'MEDIUM'
        } else if (store.level_diff == 'MEDIUM') {
            store.level_diff = 'EASY'
        } else if (store.level_diff == 'EASY') {
            store.level_diff = 'HARDCORE'
        }
    }



    else if (e.key == 'Backspace') {
        if (choosing_name.value) {
            choosing_name.value = false
        }
        if (show_settings.value) {
            show_settings.value = false
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
    /* padding-block: 3em; */
    gap: 12em;
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

div.start {
    font-size: 3em;
    animation: pulsate 2s infinite alternate;
}

.pulsating {
    animation: pulsate 2s infinite alternate;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

div.start img.spinner {
    height: 200px;
    animation: spin 2s infinite;
}


div.start img {
    height: 1em;
    margin-inline: 15px;
}

.logo {
    height: 300px;
    margin-top: 3em;
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

.choosing-name,
.settings {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1em;
    font-size: 4em;
    position: absolute;
    z-index: 15;
    background-color: rgba(40, 40, 40, 0.8);
    height: 100vh;
    width: 100%;
    color: white
}

.choosing-name input {
    background-color: transparent;
    font-size: 0.8em;
    text-align: center;
    color: white;
}

.choose-diff {
    display: flex;
    gap: 0.5em;
    align-items: center;
}

/* Hardcore */
.menu-block.HARDCORE {
    border-color: red;
    background-color: rgba(255, 0, 0, 0.3);
    /* Red background with 30% opacity */
    color: black;
    /* White font color */
}

/* Medium */
.menu-block.MEDIUM {
    border-color: #FFA500;
    /* Orange border color */
    background-color: rgba(255, 165, 0, 0.3);
    /* Orange background with 30% opacity */
    color: black;
    /* Black font color */
}

/* Easy */
.menu-block.EASY {
    border-color: green;
    /* Green border color */
    background-color: rgba(0, 128, 0, 0.3);
    /* Green background with 30% opacity */
    color: black;
    /* Black font color */
}

.choose-diff i {
    display: block;
    position: initial;
}
</style>