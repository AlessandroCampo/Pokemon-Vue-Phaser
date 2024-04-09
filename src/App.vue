<template>
  <MyInfoPanel v-if="store.my_pokemon && store.show_hud"></MyInfoPanel>
  <EnemyInfoPanel v-if="store.oppo_pokemon && store.show_hud"></EnemyInfoPanel>
  <OptionsMenu></OptionsMenu>
  <StartingChoice v-if="map_store.choosing_starter && !store.my_pokemon"></StartingChoice>
  <WorldMenuVue v-if="map_store.show_menu"></WorldMenuVue>
  <PartyMenuVue v-if="map_store.show_party_menu"></PartyMenuVue>
  <InventoryMenu v-if="map_store.show_inventory_menu"></InventoryMenu>



</template>

<script setup>
import MyInfoPanel from './components/MyInfoPanel.vue'
import EnemyInfoPanel from './components/EnemyInfoPanel.vue'
import OptionsMenu from './components/OptionsMenu.vue'
import WorldMenuVue from './components/t2/WorldMenuVue.vue';
import { store } from './store';
import { map_store } from './mapStore'
import StartingChoice from './components/t3/StartingChoice.vue';
import PartyMenuVue from './components/t3/PartyMenuVue.vue';
import InventoryMenu from './components/t3/InventoryMenu.vue';
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase';
import { onMounted } from 'vue'

onMounted(() => {

});


</script>

<style scoped></style>
