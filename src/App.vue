<template>
  <MyInfoPanel v-if="store.my_pokemon && store.show_hud"></MyInfoPanel>
  <EnemyInfoPanel v-if="store.oppo_pokemon && store.show_hud"></EnemyInfoPanel>
  <OptionsMenu></OptionsMenu>
  <StartingChoice v-if="map_store.choosing_starter && !store.my_pokemon"></StartingChoice>




</template>

<script setup>
import MyInfoPanel from './components/MyInfoPanel.vue'
import EnemyInfoPanel from './components/EnemyInfoPanel.vue'
import OptionsMenu from './components/OptionsMenu.vue'
import { store } from './store';
import { map_store } from './mapStore'
import StartingChoice from './components/t3/StartingChoice.vue';
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase';
import { onMounted } from 'vue'

onMounted(() => {

});


</script>

<style scoped></style>
