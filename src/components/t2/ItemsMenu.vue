<template>
    <div class="items-container">
        <div class="item" :class="index == active_voice ? 'active' : ''" v-for="(item, index) in store.my_items"
            :key="index" v-show="item?.owned_amount > 0">

            <div class="name-icon">
                <img :src="item.img_path">
                <span>
                    {{ item.name }}
                </span>

            </div>
            <span class="level">x{{ item?.owned_amount }}</span>
            <i class="fa-solid fa-chevron-right arrow" v-if="index == active_voice"></i>

        </div>
    </div>
    <div class="target-selection" v-show="selecting_target">
        <div class="bench">
            <div class="pokemon" v-for="(pkmn, index) in targets " :key="index"
                :class="{ 'active_m': index === 0, 'active-target': index === active_target }">

                <img :src="`/pokemons/${pkmn.name.toLowerCase()}.gif`" alt="">
                <div class="type-name">
                    <div>
                        {{ pkmn.name }}
                    </div>

                </div>
                <div class="menu-progress">

                    <progress :value="pkmn?.hp.current" :max="pkmn?.hp.max" :class="hpBarClass(pkmn)" class="menu-bar">
                    </progress>
                    <div class="hp-num">{{ pkmn?.hp.current }}/{{ pkmn?.hp.max }}</div>
                </div>
                <!-- <i class="fa-solid fa-chevron-right arrow" v-if="index == active_voice"></i> -->

            </div>
        </div>

    </div>
</template>

<script setup>
import { store } from '@/store';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Ball, Potion, Antidote } from '../../js/db/items.mjs'
const active_voice = ref(0)
const active_target = ref(0)

const targets = ref([])
let selecting_target = ref(false)

//TODO, ITEM USAGE

onMounted(() => {

    window.addEventListener('keydown', handleMovesInput)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleMovesInput)
})

const useItem = async function (item, target) {

    if (item.owned_amount <= 0) {
        return
    }
    if (!item.can_be_used_in_battle) {

        store.displayInfoText(`${item.name} cannot be used in battle...`)
        return
    }

    store.menu_state = 'text'
    store.battle_events = [];
    const ai_selected_move = store.oppo_pokemon.moves[Math.floor(Math.random() * store.oppo_pokemon.moves.length)]
    let item_has_been_used = false
    const oppo_pokemon_attack = async () => {
        await store.useMove(ai_selected_move, store.oppo_pokemon, store.my_pokemon, false);

    };

    if (item.type == 'ball') {
        store.battle_sequence_playing = true
        if (store.my_bench.length >= 3) {
            store.info_text = `You cannot have more than 5 pokemons in your team at the moment`
            await store.delay(store.info_text.length * store.config.text_speed + 500)
            store.menu_state = 'items'
            return
        }
        if (store.battle_type !== 'wild') {
            store.info_text = `Only wild pokemons can be caught...`
            await store.delay(store.info_text.length * store.config.text_speed + 500)
            store.menu_state = 'items'
            return
        }
        item.owned_amount--
        item_has_been_used = true
        store.info_text = `${store.player_info.name} uses ${item.name}`
        await store.delay(store.info_text.length * store.config.text_speed + 500)
        if (await store.attemptCatch(store.oppo_pokemon, item)) {

            return
        } else {
            store.info_text = `${store.oppo_pokemon.name} won't get caught so easily`
            await store.delay(store.info_text.length * store.config.text_speed + 500)

        }
    } else if (item.type == 'potion') {
        if (target.hp.current == target.hp.max) {
            store.info_text = `${target.name} is already full hp, a potion would be wasted...`
            await store.delay(store.info_text.length * store.config.text_speed + 500)
            store.menu_state = 'items'
            return

        } else {
            store.menu_state = 'items'
            item.owned_amount--
            item_has_been_used = true
            let healing_amount = target.hp.max * item.amount * -1
            await store.applyDamage(target, healing_amount)
            store.menu_state = 'text'
            store.info_text = `${store.player_info.name} used ${item.name} on ${target.name}`
            await store.delay(store.info_text.length * store.config.text_speed + 500)
            selecting_target.value = false


        }
    } else if (item.type == 'antidote') {
        if (target.status !== item.helead_status) {
            store.info_text = `${target.name} is not ${item.helead_status}, ${item.name} would be wasted...`
            await store.delay(store.info_text.length * store.config.text_speed + 500)
            store.menu_state = 'items'
            return

        } else {
            store.menu_state = 'items'
            item.owned_amount--
            item_has_been_used = true
            target.status = null
            store.menu_state = 'text'
            store.info_text = `${store.player_info.name} used ${item.name}. ${target.name} is no longer ${item.helead_status}`
            await store.delay(store.info_text.length * store.config.text_speed + 500)
            selecting_target.value = false
        }
    }
    if (item_has_been_used) {
        store.battle_events.push(oppo_pokemon_attack)
        await store.processEvents();
    }
}

const handleMovesInput = async function (e) {
    let selected_item = store.my_items[active_voice.value];

    if (store.menu_state !== 'items') {
        return
    }

    if (e.key == 'Enter') {
        if (!selected_item.can_be_used_in_battle) {
            store.menu_state = 'text'
            await store.displayInfoText(`${selected_item.name} cannot be used in battle...`)
            store.menu_state = 'items'
            return

        }
        if (selected_item.type == 'ball') {

            await useItem(selected_item);
        } else {

            let target = await targetSelect()

            if (target) {
                await useItem(selected_item, target);
            }

        }
    }

    else if (e.key == 'ArrowUp') {

        if (selecting_target.value) {
            active_target.value--
            if (active_target.value < 0) active_target.value = targets.value.length - 1
            return
        } else {
            active_voice.value--
            if (active_voice.value < 0) active_voice.value = store.my_items.length - 1

        }

    } else if (e.key == 'ArrowDown') {
        if (selecting_target.value) {
            active_target.value++
            if (active_target.value > targets.value.length - 1) active_target.value = 0
            return
        } else {
            active_voice.value++
            if (active_voice.value > store.my_items.length - 1) active_voice.value = 0
        }

    } else if (e.key == 'Backspace') {
        if (active_voice.value == null) {
            active_voice.value = 0
            selecting_target.value = false

        } else {
            backToMenu()
        }

    }
    else {
        return
    }
}



// Determine HP bar class based on HP percentage
const hpBarClass = ((pkmn) => {
    const hpPercentage = computed(() => {
        return (store.my_pokemon.hp.current / store.my_pokemon.hp.max) * 100;
    });

    if (hpPercentage.value > 50) {
        return 'full-hp';
    } else if (hpPercentage.value >= 20 && hpPercentage.value <= 49) {
        return 'medium-hp';
    } else {
        return 'low-hp';
    }
});




const backToMenu = function () {
    store.menu_state = 'options'
}

const targetSelect = function () {


    targets.value = []
    active_voice.value = null
    store.my_bench.forEach((pkmn) => {
        targets.value.push(pkmn)
    })
    targets.value.unshift(store.my_pokemon)
    window.removeEventListener('keydown', handleMovesInput)
    let selected_target

    return new Promise(resolve => {
        const handleTargetSelectionInput = async function (e) {


            if (e.key == 'Enter') {

                window.removeEventListener('keydown', handleTargetSelectionInput);
                resolve(targets.value[active_target.value]);
            }

            else if (e.key == 'ArrowUp') {

                active_target.value--
                if (active_target.value < 0) active_target.value = targets.value.length - 1
                return


            } else if (e.key == 'ArrowDown') {

                active_target.value++
                if (active_target.value > targets.value.length - 1) active_target.value = 0
                return

            } else if (e.key == 'Backspace') {
                if (active_voice.value == null) {
                    active_voice.value = 0
                    selecting_target.value = false
                    window.addEventListener('keydown', handleMovesInput)
                    resolve(undefined)
                } else {
                    backToMenu()
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
</script>

<style scoped>
.target-selection {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 2em;
    z-index: 5;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 30px;
    display: flex;
    gap: 1em;
    flex-direction: column;
    align-items: center;
    width: 450px;
    justify-content: center;
}

.bench {
    display: flex;
    gap: 1em;
    flex-wrap: wrap;
}

.pokemon {
    display: flex;
    align-items: center;
    flex-direction: column;
    width: 47.5%;
}

.pokemon.active_m {
    width: 100%;
}




.items-container {
    position: absolute;
    z-index: 3;
    bottom: 5%;
    right: 2%;
    gap: 0.5em;
    display: flex;
    flex-direction: column;

}


.back-option {
    background-color: gray;
    color: black;
}

.name-icon {
    display: flex;
    align-items: center;
    font-size: 1.3em;
    justify-content: center;
    gap: 1em;
    width: 150px;
}


.arrow {
    position: absolute;
    top: 50%;
    left: -15%;
    transform: translateY(-50%);
    color: aqua;
    font-size: 3em;
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
    background-color: rgba(255, 255, 255, 0.7);
    padding-block: 10px;
    /* border: 5px solid violet; */
}

img {
    height: 50px;

}

.level {
    position: absolute;
    bottom: 8%;
    right: 5%;
    font-size: 1.3em;
}


.item:hover {
    border: 2px solid aqua;
    scale: 1.1;
    cursor: pointer;
}

.item.active,
.active-target {
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
.item.active,
.active-target {
    animation: pulsate 1.5s infinite;
}

/* Assuming your component has a unique class or ID */
.menu-progress progress.full-hp::-webkit-progress-value {
    color: yellowgreen;
}
</style>