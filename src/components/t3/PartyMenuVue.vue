<template>
    <div class="menu-container">
        <div class="bench-container">
            <div class="bench" :class="{
                'active': index == active_voice,
                'lead': index == 0
            }" v-for="(pokemon, index) in party" :key="index">

                <img :src="`/pokemons/${pokemon?.name.toLowerCase()}.gif`" alt="">
                <div class="bottom">
                    <div class="type-name">
                        <div>
                            {{ pokemon?.name }}
                            <img v-if="pokemon?.status" class="status" :src="'/badges/' + pokemon?.status + '.png'"
                                style="height: 15px;">
                        </div>

                        <!-- <i class="fa-solid" :class="pokemon?.gender == 'male' ? 'fa-mars' : 'fa-venus'"></i> -->
                    </div>
                    <div class="progress">

                        <progress :value="pokemon?.hp.current" :max="pokemon?.hp.max"> </progress>
                        <div class="hp-num">{{ pokemon?.hp.current }}/{{ pokemon?.hp.max }}</div>
                    </div>
                    <i class="fa-solid fa-chevron-right arrow" v-if="index == active_voice"></i>
                    <span class="level">LV.{{ pokemon?.level }}</span>
                </div>
                <div class="dialogue-menu" v-show="show_dialogue == index">
                    <div v-for="(sub_voice, index2) in sub_menu_voices" :key="sub_voice.label">
                        <i class="fa-solid fa-chevron-right arrow"
                            :class="index2 == sub_menu_active_voice ? '' : 'hidden'"></i>
                        <span> {{ sub_voice.label }} </span>
                    </div>
                </div>


            </div>


        </div>
        <div class="active-sprite">
            <img :src="`/pokemons/${active_pokemon?.name.toLowerCase()}.gif`" alt="">
        </div>
        <div class="active-info different-font">
            <span><strong>Name</strong>: {{ active_pokemon?.name }}</span>
            <p>
                {{ active_pokemon?.description }}
            </p>
            <span><strong>Level</strong>: {{ active_pokemon?.level }}</span>
            <span><strong>Height</strong>: {{ active_pokemon?.height }}m</span>
            <span><strong>Weight</strong>: {{ active_pokemon?.height }}kg</span>
            <span><strong>Nature</strong>: {{ active_pokemon?.nature }}</span>
            <span style="display: flex; align-items: center; margin-right: 10px;">
                <strong>Type</strong>

                <img :src="`/badges/move-types/${type}.png`" alt="" v-for="(type, index) in active_pokemon?.types"
                    :key="index" style="height: 30px; margin-inline: 5px;">
            </span>
            <span>
                <strong>Learned Moves</strong>

                <span class="move-container" style="display: flex; align-items: center; margin-right: 10px;"></span>
                <span v-for="(move, index) in active_pokemon?.moves" :key="index" style="font-size: 0.5em;">
                    {{ move.name + (index !== active_pokemon?.moves.length - 1 ? ', ' : '') }}
                </span>
            </span>
            <span> <strong>Max HP</strong>: {{ active_pokemon?.hp.max }} </span>
            <span> <strong>Attack</strong>: {{ active_pokemon?.atk.current }}</span>
            <span><strong>Special Attack</strong> : {{ active_pokemon?.sp_atk.current }}</span>
            <span><strong>Defense</strong>: {{ active_pokemon?.def.current }}</span>
            <span><strong>Special Defense</strong>S: {{ active_pokemon?.sp_def.current }}</span>
            <span><strong>Speed</strong>: {{ active_pokemon?.speed.current }}</span>
            <span><strong>Stats Total</strong>: {{ active_pokemon?.stat_total }}</span>
            <span><strong>Held item</strong>: {{ active_pokemon?.held_item !== null ? held_item?.name : 'none' }}</span>
        </div>

        <span class="tooltip different-font"> Click backspace to close menu </span>
    </div>
</template>

<script setup>
import { map_store } from "@/mapStore.mjs";
import { store } from "@/store";
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'



const sub_menu_active_voice = ref(0)
const active_voice = ref(0)
const show_dialogue = ref(null)
const party = computed(() => {
    // Concatenate activePokemon with the rest of the test bench
    return [store.my_pokemon, ...store.my_bench];
});
const active_pokemon = computed(() => {
    return party.value[active_voice.value]
})

const sub_menu_voices = [
    {
        label: 'SET ACTIVE', callback: () => {
            console.log('setting active')
            if (show_dialogue.value == null) {
                return;
            }
            if (active_voice.value == 0) {
                show_dialogue.value = null;
                return;
            }

            const newIndex = active_voice.value;
            // Subtract 1 because party has the active pokemon
            const oldPokemon = store.my_bench.splice(newIndex - 1, 1)[0]; // Splice returns an array, so we get the first element

            const activePokemon = store.my_pokemon;

            // Update the store values
            store.my_pokemon = oldPokemon;
            store.my_bench.splice(newIndex - 1, 0, activePokemon); // Insert activePokemon at the newIndex

            active_voice.value = 0;
            show_dialogue.value = null;
        }
    },

    {
        label: 'CLOSE', callback: () => {
            show_dialogue.value = null
        }
    },
]

onMounted(() => {
    console.log('mounted')
    window.addEventListener('keydown', handleMovesInput)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleMovesInput)
})

const handleMovesInput = async function (e) {
    if (!map_store.show_party_menu) {
        return;
    }

    if (e.key == 'Enter') {
        if (show_dialogue.value == null) {
            show_dialogue.value = active_voice.value;
        } else {
            // Trigger sub-menu callback only if sub-menu is active
            if (sub_menu_active_voice.value !== null) {
                sub_menu_voices[sub_menu_active_voice.value].callback();
            }
        }
    } else if (e.key == 'Backspace') {
        if (show_dialogue.value !== null) {
            show_dialogue.value = null;
        } else {
            map_store.show_party_menu = false;
        }
    } else if (e.key == 'ArrowUp') {
        if (show_dialogue.value == null) {
            active_voice.value--;
            if (active_voice.value < 0) active_voice.value = party.value.length - 1;
        } else {
            sub_menu_active_voice.value--;
            if (sub_menu_active_voice.value < 0) sub_menu_active_voice.value = sub_menu_voices.length - 1;
        }
    } else if (e.key == 'ArrowDown') {
        if (show_dialogue.value == null) {
            active_voice.value++;
            if (active_voice.value > party.value.length - 1) active_voice.value = 0;
        } else {
            sub_menu_active_voice.value++;
            if (sub_menu_active_voice.value > sub_menu_voices.length - 1) sub_menu_active_voice.value = 0;
        }
    } else {
        return;
    }
}


const backToMenu = function () {

}
</script>

<style scoped>
.menu-container {
    position: absolute;
    width: 100vw;
    height: 100vh;
    z-index: 11;
    background-color: #121212;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: 150px;


}

.bench-container {
    /* position: absolute; */
    z-index: 3;
    gap: 0.5em;
    display: flex;
    flex-direction: column;
    margin-left: 40px;
    /* transform: translateY(50%); */


}

.active-sprite img {
    scale: 4;
}

.active-info {
    display: flex;
    flex-direction: column;
    gap: 0.3em;
    background-color: white;
    padding: 20px;
    font-size: 2em;
    width: 400px;
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
    /* height: 80px; */


    border-radius: 30px;
    position: relative;
    flex-direction: row;
    justify-content: space-around;
    background-color: white;
    padding-block: 15px;
    padding-inline: 50px;
    border: 2px solid white;
    gap: 30px;
    /* border: 5px solid violet; */
}

.dialogue-menu {
    position: absolute;
    background-color: white;
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    padding-block: 10px;
    padding-inline: 25px;
    bottom: -20%;
    right: -20%;
    font-size: 1.2em;
    border: 2px solid black;
    z-index: 15;
}

.dialogue-menu div {
    display: flex;
    align-items: center;
    gap: 10px;
}

.dialogue-menu i {
    color: black;
    font-size: 0.8em;
    position: initial;
    transform: translateY(3%);
}

img {
    height: 100px;
    /* position: absolute;
    top: 50%;
    left: 10%;
    transform: translateY(-50%); */
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

.bench.lead {
    background-color: aquamarine;
}

@keyframes pulsate {
    0% {
        transform: scale(1);
        filter: brightness(100%);
        z-index: 20;
    }

    50% {
        transform: scale(1.1);
        filter: brightness(120%);
        z-index: 20;
    }

    100% {
        transform: scale(1);
        filter: brightness(100%);
        z-index: 20;
    }
}

.hidden {
    opacity: 0;
}

.tooltip {
    position: absolute;
    bottom: 10%;
    left: 50%;
    transform: translateX(-50%);
    color: gray;
    font-size: 1.5em;
}

/* Apply pulsating effect to child img and i elements when parent button is active */
/* .bench.active {
    animation: pulsate 1.5s infinite;
} */
</style>