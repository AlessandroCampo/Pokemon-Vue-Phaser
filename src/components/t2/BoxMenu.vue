<template>
    <div class="box-container">
        <h3 class="info-h3">
            Press Y to {{ selecting_from_box ? 'team' : 'box' }}, press enter to {{ selecting_from_box
                ?
                'withdraw' : 'deposit' }}
        </h3>
        <div class="box" :class="!selecting_from_box ? 'inactive' : 'active'">
            <h2> {{ store.player_info.name.toUpperCase() }}'S BOX </h2>
            <div class="pokemon-container">

                <div class="box-pokemon" v-for="(mon, index) in store.my_box" :key="index">
                    <img src="/icons/arrow_down.png" v-if="index == active_box && selecting_from_box"
                        class="arrow-down">
                    <img :src="`/pokemons/${mon.name.toLowerCase()}.gif`" alt="" class="sprite">
                </div>
            </div>
        </div>
        <div class="bench" :class="selecting_from_box ? 'inactive' : 'active'">
            <h2> TEAM </h2>
            <div class="pokemon-container">

                <div class="bench-pokemon" v-for="(mon, index) in party" :key="index">
                    <img src="/icons/arrow_down.png" v-if="index == active_party && !selecting_from_box"
                        class="arrow-down">
                    <img :src="`/pokemons/${mon.name.toLowerCase()}.gif`" alt="" class="sprite">
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { map_store } from '@/mapStore.mjs'
import { store } from '@/store'
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

let active_box = ref(0)
let active_party = ref(0)
let selecting_from_box = ref(false)
const party = computed(() => {
    // Concatenate activePokemon with the rest of the test bench
    return [store.my_pokemon, ...store.my_bench];
});


onMounted(() => {

    window.addEventListener('keydown', handleMovesInput)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleMovesInput)
})

const handleMovesInput = async function (e) {

    if (!map_store.show_box_menu) {
        return
    }

    if (e.key == 'Enter') {
        if (selecting_from_box.value) {
            if (party.value.length < 4) {
                const withdrawn_pokemon = store.my_box.splice(active_box.value, 1)[0];
                store.my_bench.push(withdrawn_pokemon);
            }
        } else {
            if (party.value.length > 1) {
                let deposited_pokemon;
                if (active_party.value === 0) {
                    // Deposit the active Pokémon and set the new active Pokémon from the bench
                    deposited_pokemon = store.my_pokemon;
                    store.my_pokemon = store.my_bench.splice(0, 1)[0]; // Set new active st
                } else {
                    // Deposit a Pokémon from the bench
                    deposited_pokemon = store.my_bench.splice(active_party.value - 1, 1)[0];
                }
                store.my_box.push(deposited_pokemon);
            } else {
                store.menu_state = 'text';
                store.info_text = 'Always leave at least a Pokémon in your party';
            }


        }
    }


    else if (e.key == 'y') {
        selecting_from_box.value = !selecting_from_box.value

    } else if (e.key == 'ArrowRight') {
        if (selecting_from_box.value) {
            active_box.value++
            if (active_box.value > store.my_box.length - 1) {
                active_box.value = 0
            }
        } else {
            active_party.value++
            if (active_party.value > party.value.length - 1) {
                active_party.value = 0
            }
        }

    } else if (e.key == 'ArrowLeft') {
        if (selecting_from_box.value) {
            active_box.value--
            if (active_box.value < 0) {
                active_box.value = store.my_box.length - 1
            }
        } else {
            active_party.value--
            if (active_party.value < 0) {
                active_party.value = party.value.length - 1
            }
        }

    }

    else if (e.key == 'Backspace') {
        map_store.show_box_menu = false
    }
    else {
        return
    }
}

</script>

<style scoped>
.box-container {
    width: 100vw;
    height: 100vh;
    position: absolute;
    z-index: 3;
    background-color: #121212;
    padding-block: 160px;
    padding-inline: 200px;
    display: flex;
    gap: 50px;
}

.box {
    width: 70%;
    background-image: url('/backgrounds/box_forest.png');
    background-size: cover;
    height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: 15px;
    gap: 30px;
    border-radius: 30px;
}

.bench {
    width: 30%;
    background-color: #3d9de1;
    background-size: cover;
    height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: 15px;
    gap: 30px;
    border-radius: 30px;
}

h2 {
    color: black;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 2.2em;
    border: 2px solid black;
    text-align: center;
    padding-inline: 100px;
    width: fit-content;
    padding-block: 10px;
    border-radius: 30px;

}

.box h2 {
    background-image: url('/backgrounds/box_forest_title.png');
    background-size: cover;
}

.bench h2 {
    background-color: darkblue;
    color: white;
}

.pokemon-container {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    height: 100%;
}

.box-pokemon {
    width: calc(100% / 4);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 30px;
    flex-direction: column;
    position: relative;
    height: 30%;
}

.bench-pokemon {
    width: calc(100% / 2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    position: relative;
}


.box-pokemon img.sprite {
    max-width: 100%;
    height: 175px;
}

.bench-pokemon img.sprite {
    max-width: 90%;
    height: 175px;
}

.arrow-down {
    position: absolute;
    top: -35%;
}

.bench .arrow-down {
    top: -5%;
}

.active {
    scale: 1.05;
}

.inactive {
    opacity: 0.4
}

.info-h3 {
    position: absolute;
    top: 6%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 2em;
    color: white;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
</style>