<template>
    <ActionsMenuVue v-if="store.menu_state == 'options'"></ActionsMenuVue>
    <MovesMenu v-else-if="store.menu_state == 'moves'"></MovesMenu>
    <TextPanel v-else-if="store.menu_state == 'text'"></TextPanel>
    <SwitchMenu v-else-if="store.menu_state == 'switch'"></SwitchMenu>
</template>

<script setup>
import ActionsMenuVue from "./t2/ActionsMenu.vue";
import MovesMenu from "./t2/MovesMenu.vue";
import SwitchMenu from "./t2/SwitchMenu.vue";
import TextPanel from './t2/TextPanel.vue'
import { ref, onMounted, watch } from 'vue'
import { store } from "@/store";



// onMounted(() => {
//     console.log(store.text_queue[0])
//     store.text_queue.shift()

// })

</script>

<style scoped></style>