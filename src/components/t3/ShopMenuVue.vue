<template>
    <div class="lateral-menu">
        <div>
            Your bank account: {{ store.my_money }} $
        </div>
        <div class="menu-voice" v-for="(item, index) in map_store.current_shop_listing" :key="item?.name">
            <i class="fa-solid fa-caret-right" :class="index !== active_voice ? 'hidden' : ''"></i>
            <div class="item">
                <img :src="item?.img_path">
                <span>
                    {{ item?.name }}
                </span>
                <span class="price">
                    {{ item?.price }} $
                </span>

            </div>


        </div>
    </div>
</template>

<script setup>

import { map_store } from "@/mapStore.mjs"
import { store } from "@/store"
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { deepClone } from "@/store";
import { all_npcs } from "@/js/db/npcs.mjs";

let active_voice = ref(0)

let current_shop = computed(() => {
    return map_store.current_shop_listing
})


onMounted(() => {

    window.addEventListener('keydown', handleMovesInput)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleMovesInput)
})

const handleMovesInput = async function (e) {

    if (!map_store.show_shop_menu) {

        return
    }

    if (map_store.show_inventory_menu || map_store.show_party_menu || store.forgettign_pokemon) {
        return
    }

    if (e.key == 'Enter') {


        map_store.talking_npc = all_npcs.merchant
        store.menu_state = 'text'
        const purchased_item = deepClone(current_shop.value[active_voice.value])
        const owned_item = store.my_items.find((item) => {
            return item.name == purchased_item.name
        })
        if (purchased_item.price > store.my_money) {
            store.info_text = `I'm sorry, you don't have enough money to buy ${purchased_item.name}`
            await store.delay(1000)
            return
        }
        if (!owned_item) {
            store.my_items.push(purchased_item)
            purchased_item.owned_amount = 1
        } else {
            owned_item.owned_amount++
        }
        store.my_money -= purchased_item.price
        //resetting  and waiting text to refresh it in case the same item is bought in sequence
        store.info_text = ''
        await store.delay(100)
        store.info_text = `Thanks for buying ${purchased_item.name}, that's ${purchased_item.price}$`
        await store.delay(1000)

    }

    else if (e.key == 'Backspace') {
        map_store.talking_npc = all_npcs.merchant
        store.menu_state = 'text'
        store.info_text = `Goodbye, come back if you need more items`
        await store.delay(1000)
        map_store.talking_npc = undefined
        map_store.show_shop_menu = false
        return
    }
    else if (e.key == 'ArrowUp') {
        active_voice.value--
        if (active_voice.value < 0) active_voice.value = current_shop.value.length - 1

    } else if (e.key == 'ArrowDown') {
        active_voice.value++
        if (active_voice.value > current_shop.value.length - 1) active_voice.value = 0
    }
    else {
        return
    }
}
</script>

<style scoped>
.lateral-menu {
    display: flex;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    flex-direction: column;
    font-size: 1.8em;
    gap: 1em;
    align-items: center;
    padding-block: 30px;
    border: 10px solid cornflowerblue;
    color: white;
    background-color: rgb(0, 0, 60, 0.8);
    width: 380px;
}

.menu-voice {
    display: flex;
    align-items: center;
    gap: 0.5em;
    width: 100%;
    justify-content: start;
    padding-inline: 10px;
}

.hidden {
    opacity: 0;
}

.item {
    display: flex;
    align-items: center;
    gap: 0.6em;
}

.item img {
    height: 60px;
}

.price {
    color: lightgray;
    font-size: 25px;
}
</style>