<template>
    <div class="choice_container">
        <div class="img-container">
            <div class="choice" v-for="(choice, index) in choices" :key="choice.name"
                :style="{ marginTop: index === 1 ? '-250px' : '' }">
                <i class="fa-solid fa-hand-pointer" :class="index == current_choice ? 'active' : ''"></i>
                <img :src="`/pokemons/${choice.name.toLowerCase()}.gif`" alt=""
                    :class="[index === current_choice ? 'active' : '', choice.name === 'Cufant' ? 'scaled-down' : '']">
                <div class="info">
                    <span> {{ choice.name }} </span>
                    <div class="types">
                        <span v-for="type in choice.types"> {{ type }}</span>
                    </div>

                </div>
            </div>
        </div>

    </div>
    <div class="text-panel">
        Press enter to choose your starting pokemon!
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { map_store } from '@/mapStore.mjs';
import { store } from '@/store';
const choices = map_store.starter_choices
let current_choice = ref(0)

onMounted(() => {
    window.addEventListener('keydown', handleMovesInput)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleMovesInput)
})

const handleMovesInput = async function (e) {


    if (e.key == 'Enter') {
        store.my_pokemon = choices[current_choice.value]
        map_store.choosing_starter = false
    }

    else if (e.key == 'ArrowLeft') {
        current_choice.value--
        if (current_choice.value < 0) current_choice.value = 2
    } else if (e.key == 'ArrowRight') {
        current_choice.value++
        if (current_choice.value > 2) current_choice.value = 0
    }
    else {
        return
    }
}

</script>

<style scoped>
.choice_container {
    position: absolute;
    height: 100vh;
    width: 100vw;
    background-image: url('/public/backgrounds/starting_choice.jpg');
    background-size: cover;
    background-repeat: no-repeat;
    z-index: 5;
}



.img-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 65%;
    margin: 12% auto;
}

.img-container img {
    max-width: 250px;
}

.choice {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 50px;
}

.fa-hand-pointer {
    font-size: 70px;
    transform: rotate(180deg);
    color: white;
}

.info {
    margin-top: -30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    font-size: 2em;
    background-color: rgba($color: #ffffff, $alpha: 0.6);
}

.text-panel {
    position: absolute;
    z-index: 14;
    background-color: white;
    font-size: 40px;
    padding: 30px;
    left: 50%;
    transform: translateX(-50%);
    bottom: 5%;

}

.types {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    font-size: 0.7em;
}

.fa-hand-pointer:not(.active) {
    opacity: 0;
}

@keyframes pulsate {
    0% {
        transform: rotate(180deg) scale(1);
        filter: brightness(100%);
    }

    50% {
        transform: rotate(180deg) scale(1.3);
        filter: brightness(120%);
    }

    100% {
        transform: rotate(180deg) scale(1);
        filter: brightness(100%);
    }
}

@keyframes pulsate_img {
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
.fa-hand-pointer.active {
    animation: pulsate 1.5s infinite;
}

img.active {
    animation: pulsate_img 1.5s infinite;
}
</style>