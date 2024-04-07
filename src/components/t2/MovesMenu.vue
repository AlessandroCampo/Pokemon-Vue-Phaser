<template>
    <div class="moves-container">
        <div class="move" :class="index == active_voice ? 'active' : ''" v-for="(move, index) in store.my_pokemon.moves"
            :key="move.name" :style="{
                backgroundColor: getMoveBackgroundColor(move.type)

            }" @click="store.useMove(move, store.my_pokemon, store.oppo_pokemon)">
            <div class="type-name">
                <img :src="`/icons/${move.type}.png`" alt="">
                <div>
                    {{ move.name }}
                </div>
            </div>
            <div class="pp">
                {{ move.pp.current + '/' + move.pp.max }}
            </div>
            <i class="fa-solid fa-chevron-right" v-if="index == active_voice"></i>

        </div>
    </div>
    <p class="press_y">
        Press (Y) from move details
    </p>
    <DetailsPanel :prop_move="active_move" :prop_color="current_bg_color" v-show="show_details"></DetailsPanel>

</template>

<script setup>
import { store } from '../../store'
import { ref, computed, onMounted, onBeforeUnmount, reactive } from 'vue'
import DetailsPanel from './DetailsPanel.vue';
let active_voice = ref(0)
let show_details = ref(false)
let active_move = computed(() => store.my_pokemon.moves[active_voice.value]);
let current_bg_color = computed(() => {
    // Assuming getMoveBackgroundColor returns a color string (e.g., hex, rgb, rgba)
    let color = getMoveBackgroundColor(active_move.value.type);
    let opacity = 'B3'; // Adjust opacity as needed, '80' represents 50% opacity in hexadecimal
    return `${color}${opacity}`;
});



onMounted(() => {

    window.addEventListener('keydown', handleMovesInput)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleMovesInput)
})

const handleMovesInput = async function (e) {
    console.log('clicked')

    if (store.menu_state !== 'moves') {

        return
    }

    if (e.key == 'Enter') {
        console.log('enter')
        store.battle_events = [];
        // Determine AI decision and selected moves
        const ai_decided_swap = store.aiWantsSwap();
        const ai_best_move = store.calcAiBestMove();
        const ai_selected_move = store.battle_type == 'trainer' ? ai_best_move : store.oppo_pokemon.moves[Math.floor(Math.random() * store.oppo_pokemon.moves.length)];
        const player_selected_move = active_move.value;

        // Define functions for player and opponent actions
        const my_pokemon_attack = async () => {
            await store.useMove(player_selected_move, store.my_pokemon, store.oppo_pokemon, true);
        };

        const oppo_pokemon_attack = async () => {
            await store.useMove(ai_selected_move, store.oppo_pokemon, store.my_pokemon, false);
        };

        const oppo_pokemon_swap = async () => {
            await store.battle_scene_instance.changeOpponentPokemonSprite(store.aiWantsSwap());
        };

        // Determine AI decision
        let ai_decision;
        if (!ai_decided_swap) {
            ai_decision = oppo_pokemon_attack;
        } else {
            ai_decision = oppo_pokemon_swap;
        }

        if (!ai_decided_swap) {
            // Logic to prioritize events based on move priority
            if (player_selected_move.priority == ai_selected_move.priority) {
                // Prioritize based on Pokémon speed if move priorities are equal
                const speedA = store.my_pokemon.speed.effective;
                const speedB = store.oppo_pokemon.speed.effective;

                if (speedA === speedB) {
                    // Add a 50% chance randomizer if speeds are equal
                    if (Math.random() < 0.5) {
                        store.battle_events.push(my_pokemon_attack);
                        store.battle_events.push(ai_decision);
                    } else {
                        store.battle_events.push(ai_decision);
                        store.battle_events.push(my_pokemon_attack);
                    }
                } else {
                    // Prioritize based on Pokémon speed
                    if (speedA > speedB) {
                        store.battle_events.push(my_pokemon_attack);
                        store.battle_events.push(ai_decision);
                    } else {
                        store.battle_events.push(ai_decision);
                        store.battle_events.push(my_pokemon_attack);
                    }
                }
            } else {
                // Check if player or AI selected a move with higher priority
                if (player_selected_move.priority > ai_selected_move.priority) {
                    store.battle_events.push(my_pokemon_attack); // Put player's move first
                    store.battle_events.push(ai_decision); // Put AI's decision (attack or swap) after player's move
                } else {
                    store.battle_events.push(ai_decision); // Put AI's decision first (attack or swap)
                    store.battle_events.push(my_pokemon_attack); // Put player's move after AI's decision
                }
            }
        } else {
            store.battle_events.push(my_pokemon_attack);
            store.battle_events.unshift(ai_decision);

        }



        // Process events
        await store.processEvents();
    }



    else if (e.key == 'Backspace') {

        backToMenu()
    }
    else if (e.key == 'ArrowUp') {
        active_voice.value--
        if (active_voice.value < 0) active_voice.value = store.my_pokemon.moves.length - 1
        console.log(active_move.value.name)
    } else if (e.key == 'ArrowDown') {
        active_voice.value++
        if (active_voice.value > store.my_pokemon.moves.length - 1) active_voice.value = 0
    } else if (e.key == 'y') {
        console.log(e.key)
        show_details.value = !show_details.value
    }
    else {
        return
    }
}


const getMoveBackgroundColor = (type) => {
    const typeColors = {
        'normal': '#9099a1',
        'water': '#4d90d5',
        'fire': '#ff9c54',
        'grass': '#63bb5b',
        'flying': '#92aade',
        'poison': '#ab6ac8',
        'ground': '#d97746',
        'groundd': '#d97746',
        'rock': '#c7b78b',
        'bug': '#90c12c',
        'ghost': '#5269ac',
        'steel': '#5a8ea1',
        'electric': '#f3d23b',
        'psychic': '#f97176',
        'ice': '#74cec0',
        'dragon': '#096dc4',
        'dark': '#5a5366',
        'fairy': '#ec8fe6',
        'fighting': '#ce4069'
    };
    return typeColors[type] || '#000000';
};

const backToMenu = function () {
    store.menu_state = 'options'
}
</script>

<style scoped>
.press_y {
    position: absolute;
    bottom: 5%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    font-size: 1.4em;
}

.moves-container {
    position: absolute;
    z-index: 3;
    bottom: 5%;
    right: 2%;
    gap: 0.5em;
    display: flex;
    align-items: center;
    flex-direction: column;

}

.back-option {
    background-color: gray;
    color: black;
}

.type-name {
    display: flex;
    align-items: center;
    font-size: 1.5em;

}

i {
    position: absolute;
    top: 50%;
    left: -15%;
    transform: translateY(-50%);
    color: aqua;
    font-size: 3em;
}

.move {
    display: flex;
    align-items: center;
    height: 70px;
    width: 330px;
    padding-left: 5px;
    justify-content: space-between;
    border-radius: 30px;
    position: relative;
    /* border: 5px solid violet; */
}

img {
    border-radius: 50%;
    width: 60px;
}

.pp {
    color: white;
    background-color: black;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 90px;
    padding-block: 7px;
    border-top-right-radius: 30px;
    border-bottom-right-radius: 30px;
    font-size: 1.7em;
}

.move:hover {
    border: 2px solid aqua;
    scale: 1.1;
    cursor: pointer;
}

.move.active {
    border: 2px solid aqua;
}

.back-option {
    padding-left: 15px;
}

.back-option img {
    width: 40px;
}

.back-option .type-name {
    gap: 10px;
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
.move.active {
    animation: pulsate 1.5s infinite;
}
</style>