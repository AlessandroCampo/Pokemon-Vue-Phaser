<template>
    <div class="bench-container">
        <div class="bench" :class="index == active_voice ? 'active' : ''" v-for="(pokemon, index) in store.my_bench"
            :key="index" @click="switchPokemon(pokemon)">
            <img :src="`/pokemons/${pokemon.name.toLowerCase()}.gif`" alt="">
            <div class="type-name">
                <div>
                    {{ pokemon.name }}
                </div>
                <i class="fa-solid" :class="pokemon?.gender == 'male' ? 'fa-mars' : 'fa-venus'"></i>
            </div>
            <div class="progress">

                <progress :value="pokemon?.hp.current" :max="pokemon?.hp.max"> </progress>
                <div class="hp-num">{{ pokemon?.hp.current }}/{{ pokemon?.hp.max }}</div>
            </div>
            <i class="fa-solid fa-chevron-right arrow" v-if="index == active_voice"></i>
            <span class="level">LV.{{ pokemon?.level }}</span>

        </div>


    </div>
</template>

<script setup>
import { store } from '../../store'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
const active_voice = ref(0)



onMounted(() => {
    console.log('mounted')
    window.addEventListener('keydown', handleMovesInput)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleMovesInput)
})

const handleMovesInput = async function (e) {
    console.log(e.key)
    if (store.menu_state !== 'switch') {
        console.log(store.menu_state)
        return
    }

    if (e.key == 'Enter') {
        store.battle_events = [];
        let active_pokemon_fainted = store.my_pokemon.fainted
        let ai_decision
        const ai_decided_swap = store.aiWantsSwap()
        const ai_best_move = store.calcAiBestMove()

        store.battle_events.push(async () => {
            await store.battle_scene_instance.changeAllyPokemonSprite(store.my_bench[active_voice.value])
        });

        // only queuue an IA attack if ur switching out a non fainted pokemon
        if (!active_pokemon_fainted) {
            store.battle_events.push(async () => {
                let ai_selected_move = store.battle_type == 'trainer' ? ai_best_move : store.oppo_pokemon.moves[Math.floor(Math.random() * store.oppo_pokemon.moves.length)]
                await store.useMove(ai_selected_move, store.oppo_pokemon, store.my_pokemon, false);
            });
        }



        // Push the opponent's move as an event into battle_events


        await store.processEvents();
    }



    else if (e.key == 'Backspace') {
        if (!store.my_pokemon.fainted) {
            backToMenu()
        }

    }
    else if (e.key == 'ArrowUp') {
        active_voice.value--
        if (active_voice.value < 0) active_voice.value = store.my_bench.length - 1
    } else if (e.key == 'ArrowDown') {
        active_voice.value++
        if (active_voice.value > store.my_bench.length - 1) active_voice.value = 0
    } else {
        return
    }
}



const backToMenu = function () {
    store.menu_state = 'options'
}
</script>

<style scoped>
.bench-container {
    position: absolute;
    z-index: 3;
    bottom: 5%;
    right: 2%;
    gap: 0.5em;
    display: flex;
    flex-direction: column;

}

.progress {
    width: 150px;
}

.progress progress {
    width: 100%;
    background-color: magenta !important;
    height: 10px;
    border: 1px solid black;
    margin-block: 3px;
}

.back-option {
    background-color: gray;
    color: black;
}

.type-name {
    display: flex;
    align-items: center;
    font-size: 1.3em;
    justify-content: space-between;
    width: 150px;
}



.fa-mars {
    color: blue;
}

.fa-venus {
    color: crimson;
}

.arrow {
    position: absolute;
    top: 50%;
    left: -15%;
    transform: translateY(-50%);
    color: aqua;
    font-size: 3em;
}

.bench {
    display: flex;
    align-items: center;
    height: 70px;
    width: 330px;
    padding-left: 30px;
    border-radius: 30px;
    position: relative;
    flex-direction: column;
    background-color: rgba(255, 255, 255, 0.7);
    padding-block: 10px;
    /* border: 5px solid violet; */
}

img {
    height: 50px;
    position: absolute;
    top: 50%;
    left: 10%;
    transform: translateY(-50%);
}

.level {
    position: absolute;
    bottom: 8%;
    right: 5%;
    font-size: 1.3em;
}


.bench:hover {
    border: 2px solid aqua;
    scale: 1.1;
    cursor: pointer;
}

.bench.active {
    border: 2px solid aqua;
}

/* .my-hp::-webkit-progress-value {
    background-color: var(--progress-color-my);
} */



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
.bench.active {
    animation: pulsate 1.5s infinite;
}
</style>