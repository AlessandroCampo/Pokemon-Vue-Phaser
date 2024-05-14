<template>
    <div class="instruction">
        <span>
            Press Enter to skip to next message
        </span>
        <span>
            Press Backspace to skip and start the game
        </span>
    </div>
    <div class="title-container">
        <!-- <img src="/trainers/rowan.png" class="professor"> -->
    </div>
</template>

<script setup>
import { map_store } from '@/mapStore.mjs'
import { store } from '@/store'
import { onBeforeMount, onBeforeUnmount, onMounted } from 'vue'


onMounted(async () => {

    const start_game_messages_hardcore = [`welcome to the game ${store.player_info.name}`, 'this game is a little different from the pokèmon games you have played so far', 'I always liked pokèmon games, but I always found the levelling process super boring and the overall far too easy', 'therefore, at the start of the game I will gift you a bunch of items, including rare candies and mega balls to make the game faster', "that said, that's the end of the good news...", "During the game, every time a pokèmon will faint it will be considered dead and will be removed from you party. If you lose a battle, you're considered as dead as your pokèmons and the window will refresh", "Why do you think I called the game bloody red??", "Ah I almost forgot, since you're brave enough to choose the Hardcore mode, you can't use any item in a trainer battle", "In this pokèmon world, catching and training pokèmons is considered illegal so every single policeman will try to battle you", "Your goal is to defeat all of the 4 lords on the map but you can't level your pokèmons higher than the average level of the following lord's team", "I never completed the game myself after coding all of it so good luck with that, and forgive me in advance for the milion bugs I still did not fix (Not talking about bug-type pokèmons eheheh)"]
    const start_game_messages_medium = [`welcome to the game ${store.player_info.name}`, 'this game is a little different from the pokèmon games you have played so far', 'I always liked pokèmon games, but I always found the levelling process super boring and the overall far too easy', 'therefore, at the start of the game I will gift you a bunch of items, including rare candies and mega balls to make the game faster', "that said, that's the end of the good news...", "During the game, every time a pokèmon will faint it will be considered dead and will be removed from you party. If you lose a battle, you're considered as dead as your pokèmons and the window will refresh", "Why do you think I called the game bloody red??", "In this pokèmon world, catching and training pokèmons is considered illegal so every single policeman will try to battle you", "Your goal is to defeat all of the 4 lords on the map but you can't level your pokèmons higher than the average level of the following lord's team", "I never completed the game myself after coding all of it so good luck with that, and forgive me in advance for the milion bugs I still did not fix (Not talking about bug-type pokèmons eheheh)"]
    const start_game_messages_easy = [`welcome to the game ${store.player_info.name}`, 'this game is a little different from the pokèmon games you have played so far', 'I always liked pokèmon games, but I always found the levelling process super boring and the overall far too easy', 'therefore, at the start of the game I will gift you a bunch of items, including rare candies and mega balls to make the game faster', "In this pokèmon world, catching and training pokèmons is considered illegal so every single policeman will try to battle you", "Your goal is to defeat all of the 4 lords on the map but you can't level your pokèmons higher than the average level of the last lord's team"]
    let chosen_messages = []
    switch (store.level_diff) {
        case 'HARDCORE':
            chosen_messages = start_game_messages_hardcore
            break;
        case 'MEDIUM':
            chosen_messages = start_game_messages_medium
            break;
        case 'EASY':
            chosen_messages = start_game_messages_easy
            break;
    }
    store.menu_state = 'text'
    chosen_messages.forEach((message) => {
        map_store.add_new_message_to_queue(message)
    })
    window.addEventListener('keydown', (e) => {
        if (e.key == 'Enter' && map_store.text_queue.length <= 0) {
            map_store.show_start_scene = false
        } else if (e.key == "Backspace") {
            map_store.text_queue = []
            map_store.show_menu = false
            store.menu_state = null
            setTimeout(() => { map_store.show_start_scene = false }, 200)


        }
    })
})
</script>

<style scoped>
.title-container {
    position: absolute;
    z-index: 3;
    background-color: #121212;
    background-image: url('/backgrounds/red-sky.jpg');
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

img.professor {
    width: 10%;
    transform: translateY(-20%);
}

.instruction {
    position: absolute;
    top: 5%;
    right: 5%;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    font-size: 1.7em;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: white;
    z-index: 10;
}
</style>