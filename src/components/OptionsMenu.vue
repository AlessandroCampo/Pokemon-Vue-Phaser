<template>
    <TextPanel v-show="store.menu_state == 'text' || map_store.text_queue.length > 0"></TextPanel>
    <ActionsMenuVue v-if="store.menu_state == 'options'"></ActionsMenuVue>
    <MovesMenu v-else-if="store.menu_state == 'moves'"></MovesMenu>
    <SwitchMenu v-else-if="store.menu_state == 'switch'"></SwitchMenu>
    <ItemsMenu v-else-if="store.menu_state == 'items'"></ItemsMenu>

</template>

<script setup>
import ActionsMenuVue from "./t2/ActionsMenu.vue";
import MovesMenu from "./t2/MovesMenu.vue";
import SwitchMenu from "./t2/SwitchMenu.vue";
import ItemsMenu from "./t2/ItemsMenu.vue";
import TextPanel from './t2/TextPanel.vue'
import { ref, onMounted, watch } from 'vue'
import { store } from "@/store";
import { map_store } from "@/mapStore";



// onMounted(() => {
//     console.log(store.text_queue[0])
//     store.text_queue.shift()

// })

</script>

<style scoped></style>