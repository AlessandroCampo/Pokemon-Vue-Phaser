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
</template>

<script setup>
import { store } from '../../store'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
const active_voice = ref(0)
const my_pokemon = ref(store.my_pokemon)
const oppo_pokemon = ref(store.oppo_pokemon)


onMounted(() => {

    window.addEventListener('keydown', handleMovesInput)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleMovesInput)
})

const handleMovesInput = async function (e) {

    if (store.menu_state !== 'moves') {

        return
    }

    if (e.key == 'Enter') {
        store.battle_events = [];
        let ai_decision
        const ai_decided_swap = store.aiWantsSwap()
        const ai_best_move = store.calcAiBestMove()


        const my_pokemon_attack = async () => {
            await store.useMove(store.my_pokemon.moves[active_voice.value], store.my_pokemon, store.oppo_pokemon, true);
        };

        const oppo_pokemon_attack = async () => {
            let ai_selected_move = store.battle_type == 'trainer' ? ai_best_move : store.oppo_pokemon.moves[Math.floor(Math.random() * store.oppo_pokemon.moves.length)]
            await store.useMove(ai_selected_move, store.oppo_pokemon, store.my_pokemon, false);

        };

        const oppo_pokemon_swap = async () => {
            await store.battle_scene_instance.changeOpponentPokemonSprite(store.aiWantsSwap())
        }
        console.log()

        if (!ai_decided_swap) {
            ai_decision = oppo_pokemon_attack
        } else {

            ai_decision = oppo_pokemon_swap
        }



        // Push the ai decision as an event into battle_events
        store.battle_events.push(ai_decision);


        store.battle_events.push(my_pokemon_attack);





        store.battle_events.sort((a, b) => {
            const speedA = a === my_pokemon_attack ? store.my_pokemon.speed.effective : store.oppo_pokemon.speed.effective;
            const speedB = b === ai_decision && ai_decision === oppo_pokemon_attack ? store.oppo_pokemon.speed.effective : store.my_pokemon.speed.effective;

            // If speeds are equal, add a 50% chance randomizer
            if (speedA === speedB) {
                return Math.random() < 0.5 ? -1 : 1; // 50% chance of returning -1 or 1
            }

            return speedB - speedA;
        });

        await store.processEvents();
    }




    else if (e.key == 'Backspace') {

        backToMenu()
    }
    else if (e.key == 'ArrowUp') {
        active_voice.value--
        if (active_voice.value < 0) active_voice.value = store.my_pokemon.moves.length - 1
    } else if (e.key == 'ArrowDown') {
        active_voice.value++
        if (active_voice.value > store.my_pokemon.moves.length - 1) active_voice.value = 0
    } else {
        return
    }
}


const getMoveBackgroundColor = (type) => {
    const typeColors = {
        'normal': '#9099a1',
        'water': '#4d90d5',
        'fire': '#ff9c54',
        'grass': '#63bb5b'
    };
    return typeColors[type] || '#000000';
};

const backToMenu = function () {
    store.menu_state = 'options'
}
</script>

<style scoped>
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