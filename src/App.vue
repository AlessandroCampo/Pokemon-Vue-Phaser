<template>
  <MyInfoPanel v-if="store.my_pokemon && store.show_hud"></MyInfoPanel>
  <EnemyInfoPanel v-if="store.oppo_pokemon && store.show_hud"></EnemyInfoPanel>
  <OptionsMenu></OptionsMenu>



</template>

<script setup>
import MyInfoPanel from './components/MyInfoPanel.vue'
import EnemyInfoPanel from './components/EnemyInfoPanel.vue'
import OptionsMenu from './components/OptionsMenu.vue'
import { store } from './store';

</script>

<style scoped></style>
