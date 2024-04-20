<template>
    <div class="menu-container">
        <div class="bench-container" v-show="store.my_pokemon">
            <div class="bench" :class="{
                'active': index == active_target && selecting_target,
                'lead': index == 0
            }" v-for="(pokemon, index) in party" :key="index">
                <div class="image-item">
                    <img :src="`/pokemons/${pokemon?.name.toLowerCase()}.gif`">
                    <img :src="`${pokemon?.held_item?.img_path}`" v-show="pokemon?.held_item" class="held-item">
                </div>

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
                    <i class="fa-solid fa-chevron-right arrow" v-if="index == active_target && selecting_target"></i>
                    <span class="level">LV.{{ pokemon?.level }}</span>
                </div>



            </div>


        </div>
        <div class="items-container">
            <h2> YOUR ITEMS </h2>
            <div class="item" :class="index == active_voice ? 'active' : ''" v-for="(item, index) in store.my_items"
                :key="index">

                <div class="name-icon">
                    <img :src="item.img_path">
                    <span style="margin-top: 1px;">
                        {{ item.name }}
                    </span>

                </div>
                <span class="level">x{{ item?.owned_amount }}</span>
                <i class="fa-solid fa-chevron-right arrow" v-if="index == active_voice"></i>
                <div class="dialogue-menu" v-show="show_dialogue == index">
                    <div v-for="(sub_voice, index2) in sub_menu_voices" :key="sub_voice.label">
                        <i class="fa-solid fa-chevron-right arrow"
                            :class="index2 == sub_menu_active_voice ? '' : 'hidden'"></i>
                        <span> {{ sub_voice.label }} </span>
                    </div>
                </div>

            </div>
        </div>
        <div class="inventory-text-box">
            {{ menu_info_text }}
        </div>
    </div>
</template>

<script setup>
import { map_store } from "@/mapStore.mjs";
import { store } from "@/store";
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'



const sub_menu_active_voice = ref(0)
const active_voice = ref(0)
const active_target = ref(0)
const show_dialogue = ref(null)
const selecting_target = ref(false)
const targets = ref([])
let menu_info_text = ref('Chose one item to use from your inventory')
const party = computed(() => {
    // Concatenate activePokemon with the rest of the test bench
    return [store.my_pokemon, ...store.my_bench];
});

watch(() => store.info_text, (newVal) => {
    if (newVal) {
        menu_info_text.value = newVal;
    }
});

const sub_menu_voices = [
    {
        label: 'USE ITEM', callback: async () => {
            if (show_dialogue.value == null || selecting_target.value == true) {
                return;
            }
            let chosen_item = store.my_items[active_voice.value]
            if (!chosen_item.consumable) {
                menu_info_text.value = `${chosen_item.name} can't be used right now`
                menuReset()
                return
            }
            if (chosen_item.type == 'repel') {
                menu_info_text.value = `${chosen_item.name} has been used, and will reduce the chance of encountering wild pokèmons`
                map_store.repel_steps_left += chosen_item.amount
                console.log(chosen_item, map_store.repel_steps_left)
                menuReset()
                return

            }
            let target = await targetSelect()


            if (target) {
                useItem(chosen_item, target)
            }

        }
    },

    {
        label: 'GIVE ITEM', callback: async () => {
            if (show_dialogue.value == null || selecting_target.value == true) {
                return;
            }
            let chosen_item = store.my_items[active_voice.value]
            let target = await targetSelect()



            if (target) {
                giveItem(chosen_item, target)
            }
        }
    },
    {
        label: 'CLOSE', callback: () => {
            show_dialogue.value = null
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

    if (!map_store.show_inventory_menu || store.forgettign_pokemon) {
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
            map_store.show_inventory_menu = false;
        }
    } else if (e.key == 'ArrowUp') {
        if (show_dialogue.value == null) {
            active_voice.value--;
            if (active_voice.value < 0) active_voice.value = store.my_items.length - 1;
        } else {
            sub_menu_active_voice.value--;
            if (sub_menu_active_voice.value < 0) sub_menu_active_voice.value = sub_menu_voices.length - 1;
        }
    } else if (e.key == 'ArrowDown') {
        if (show_dialogue.value == null) {
            active_voice.value++;

            if (active_voice.value > store.my_items.length - 1) active_voice.value = 0;
        } else {
            sub_menu_active_voice.value++;
            if (sub_menu_active_voice.value > sub_menu_voices.length - 1) sub_menu_active_voice.value = 0;
        }
    } else {
        return;
    }
}

const useItem = async function (item, target) {
    selecting_target.value = false
    show_dialogue.value = null
    if (item.owned_amount <= 0) {
        return
    }
    if (!item.consumable) {
        store.info_text = `This item can only be used in battle`
        await store.delay(store.info_text.length * store.config.text_speed + 500)
    }

    store.menu_state = 'text'
    let item_has_been_used = false

    if (item.type == 'potion') {
        if (target.hp.current == target.hp.max) {
            menu_info_text.value = `${target.name} is already full hp, a potion would be wasted...`
            menuReset()
            return

        } else {

            item.owned_amount--
            let healing_amount = Math.floor(target.hp.max * item.amount * -1)
            await store.applyDamage(target, healing_amount)
            store.menu_state = 'text'
            menu_info_text.value = `${target.name} has recovered ${healing_amount * +1} HP`
            menuReset()

        }
    } else if (item.type == 'antidote') {
        if (target.status !== item.helead_status) {
            menu_info_text.value = `${target.name} is not ${item.helead_status}, ${item.name} would be wasted...`
            menuReset()
            return

        } else {
            item.owned_amount--
            target.status = null
            menu_info_text.value = `${store.player_info.name} used ${item.name}. ${target.name} is no longer ${item.helead_status}`
            menuReset()
            return
        }
    } else if (item.type == 'candy') {
        if (target.level >= store.level_cap) {
            menu_info_text.value = `${target.name} cannot reach an higher level than this right now, he will need some more battle experience I guess...`
            menuReset()
            return

        } else {
            target.level++
            item.owned_amount--
            store.calcStats(target)

            menu_info_text.value = `${target.name} has reached level ${target.level}!`
            let evolved = await store.checkPossibleEvolution(target)
            if (evolved) {
                store.evolvePokemon(target, target.evolution.into)
            }

            let learned_move = await store.checkLearnableMoves(target)

            if (learned_move && store.info_text !== '') {
                await store.delay(500)
                menu_info_text.value = store.info_text
            }


            menuReset()
            return
        }
    }

}

const giveItem = function (item, target) {
    const old_held_item = target.held_item
    if (old_held_item) {
        old_held_item.owned_amount++
    }
    item.owned_amount--
    target.held_item = item
    menu_info_text.value = `${item.name} has been assgined to ${target.name}`
    menuReset()
}

const targetSelect = function () {
    // active_voice.value = null

    window.removeEventListener('keydown', handleMovesInput)

    return new Promise(resolve => {
        const handleTargetSelectionInput = async function (e) {


            if (e.key == 'Enter') {

                window.removeEventListener('keydown', handleTargetSelectionInput);
                window.addEventListener('keydown', handleMovesInput)
                resolve(party.value[active_target.value]);
            }

            else if (e.key == 'ArrowUp') {

                active_target.value--
                if (active_target.value < 0) active_target.value = party.value.length - 1
                return


            } else if (e.key == 'ArrowDown') {

                active_target.value++
                if (active_target.value > party.value.length - 1) active_target.value = 0
                return

            } else if (e.key == 'Backspace') {
                if (active_voice.value == null) {
                    active_voice.value = 0
                    selecting_target.value = false
                    window.addEventListener('keydown', handleMovesInput)
                    resolve(undefined)
                } else {

                }

            }
            else {
                return
            }
        }
        window.addEventListener('keydown', handleTargetSelectionInput)

        selecting_target.value = true
    })

}

const menuReset = function () {
    selecting_target.value = false
    show_dialogue.value = null
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
    color: goldenrod;
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
.bench.active {
    animation: pulsate 1.5s infinite;
}


.item {
    display: flex;
    align-items: flex-start;
    height: 70px;
    width: 330px;
    padding-left: 30px;
    border-radius: 30px;
    position: relative;
    flex-direction: column;
    background-color: white;
    padding-block: 10px;
    /* border: 5px solid violet; */
}

.item img {
    width: 50px;
    height: auto;
}

.name-icon {
    display: flex;
    align-items: center;
    font-size: 1.3em;
    justify-content: center;
    gap: 1em;
    width: 150px;
}

.item.active {
    background-color: goldenrod;
}


.items-container {
    position: absolute;
    z-index: 3;
    top: 2%;
    right: 5%;
    gap: 0.5em;
    display: flex;
    flex-direction: column;
    transform: translateY(50%);

}

.items-container h2 {
    color: goldenrod;
    text-align: center;
    margin-bottom: 30px;
    font-size: 2.5em;
}

.inventory-text-box {
    background-color: white;
    padding-block: 1em;
    padding-inline: 2em;
    font-size: 1.5em;
    position: absolute;
    bottom: 5%;
    left: 50%;
    transform: translateX(-50%);
}

.image-item {
    position: relative;
}

.held-item {
    height: auto;
    width: 30px;
    position: absolute;
    bottom: -5%;
    right: -20%;
}
</style>