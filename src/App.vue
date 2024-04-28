<template>
  <MyInfoPanel v-if="store.my_pokemon && store.show_hud"></MyInfoPanel>
  <EnemyInfoPanel v-if="store.oppo_pokemon && store.show_hud"></EnemyInfoPanel>
  <OptionsMenu></OptionsMenu>
  <StartingChoice v-if="map_store.choosing_starter && !store.my_pokemon"></StartingChoice>
  <WorldMenuVue v-if="map_store.show_menu"></WorldMenuVue>
  <PartyMenuVue v-if="map_store.show_party_menu"></PartyMenuVue>
  <InventoryMenu v-if="map_store.show_inventory_menu"></InventoryMenu>
  <MoveForgetVue v-if="store.forgettign_pokemon"></MoveForgetVue>
  <ShopMenuVue v-if="map_store.show_shop_menu"></ShopMenuVue>
  <BoxMenuVue v-if="map_store.show_box_menu"></BoxMenuVue>


  <TitleSceneVue v-if="map_store.show_title_scene"></TitleSceneVue>


</template>

<script setup>
import MyInfoPanel from './components/MyInfoPanel.vue'
import EnemyInfoPanel from './components/EnemyInfoPanel.vue'
import OptionsMenu from './components/OptionsMenu.vue'
import WorldMenuVue from './components/t2/WorldMenuVue.vue';
import { store } from './store';
import { map_store } from './mapStore.mjs'
import StartingChoice from './components/t3/StartingChoice.vue';
import PartyMenuVue from './components/t3/PartyMenuVue.vue';
import InventoryMenu from './components/t3/InventoryMenu.vue';
import MoveForgetVue from './components/t3/MoveForgetVue.vue';
import TitleSceneVue from './components/TitleSceneVue.vue';
import ShopMenuVue from './components/t3/ShopMenuVue.vue';
import BoxMenuVue from './components/t2/BoxMenu.vue';

import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase';
import { onMounted } from 'vue'
import gsap from 'gsap'



onMounted(() => {
  store.menu_state = 'hidden'
});


</script>

<style scoped></style>
