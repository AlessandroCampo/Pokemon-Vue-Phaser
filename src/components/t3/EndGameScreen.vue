<template>
    <div class="end-game-container">
        <p>
            Congratulations, all of the four Lords have been defeated, you completed the game in {{ store.level_diff }}!
        </p>
    </div>
</template>

<script setup>
import { store } from '@/store';
</script>

<style scoped>
.end-game-container {
    display: flex;
    align-items: center;
    justify-content: center;
    background-image: url('/public/backgrounds/end-game-screen.png');
    background-size: cover;
    background-repeat: no-repeat;
    width: 100vw;
    height: 100vh;
    z-index: 10000;
    font-size: 2.2em;
    color: white;
}

p {
    background-color: rgba(40, 30, 40, 0.6);
    padding: 1em;
}
</style>