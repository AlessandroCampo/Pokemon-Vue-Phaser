<template>
    <div class="move-forget-container">
        <div class="menu-upper">
            <div class="moves-container">
                <div class="move" :class="index == active_voice ? 'active' : ''"
                    v-for="(move, index) in store.forgettign_pokemon.moves" :key="move.name" :style="{
                        backgroundColor: getMoveBackgroundColor(move.type)

                    }">
                    <div class="type-name">
                        <img :src="`/icons/${move.type}.png`" alt="" class="icon">
                        <div>
                            {{ move.name }}
                        </div>
                    </div>
                    <div class="pp">
                        {{ move.pp.current + '/' + move.pp.max }}
                    </div>
                    <i class="fa-solid fa-chevron-right" v-if="index == active_voice"></i>

                </div>
            </div>
            <div class="active-sprite">
                <img :src="`/pokemons/${store.forgettign_pokemon.name.toLowerCase()}.gif`" alt="">
            </div>
        </div>

        <p class="different-font" style="text-align: center;">
            {{ `${store.forgettign_pokemon?.name} is trying to learn ${store.learnable_move?.name}, select the move you
            want to forget, or click backspace to not learn this move` }}
        </p>

        <div class="new-move-card  different-font">
            <div style="display: flex; gap: 15px;">
                <div>
                    <strong>Name:</strong><span>{{ store.learnable_move?.name }}</span>
                </div>
                <div>
                    <strong>Type:</strong> <img :src="`/badges/move-types/${store.learnable_move?.type}.png`"
                        class="move-type">
                </div>
                <div>
                    <strong>Category:</strong><span>{{ store.learnable_move?.category }}</span>
                </div>


            </div>
            <div>
                <strong>Description:</strong><span>{{ store.learnable_move?.description }}</span>
            </div>
            <div style="display: flex; gap: 15px;">
                <div>
                    <strong>Accuracy:</strong><span>{{ store.learnable_move.accuracy ? store.learnable_move.accuracy :
                        '-' }}</span>
                </div>
                <div>
                    <strong>Power:</strong><span>{{ store.learnable_move.power ? store.learnable_move.power :
                        '-' }}</span>
                </div>
                <div>
                    <strong>Max PP:</strong><span>{{ store.learnable_move?.pp?.max }}</span>
                </div>
            </div>

        </div>

        <div class="new-move-card  different-font old-move">
            <div style="display: flex; gap: 15px;">
                <div>
                    <strong>Name:</strong><span>{{ current_selected_move?.name }}</span>
                </div>
                <div>
                    <strong>Type:</strong> <img :src="`/badges/move-types/${current_selected_move?.type}.png`"
                        class="move-type">
                </div>
                <div>
                    <strong>Category:</strong><span>{{ current_selected_move?.category }}</span>
                </div>


            </div>
            <div>
                <strong>Description:</strong><span>{{ current_selected_move?.description }}</span>
            </div>
            <div style="display: flex; gap: 15px;">
                <div>
                    <strong>Accuracy:</strong><span>{{ current_selected_move.accuracy ? current_selected_move.accuracy :
                        '-' }}</span>
                </div>
                <div>
                    <strong>Power:</strong><span>{{ current_selected_move.power ? current_selected_move.power :
                        '-' }}</span>
                </div>
                <div>
                    <strong>Max PP:</strong><span>{{ current_selected_move?.pp?.max }}</span>
                </div>
            </div>

        </div>

    </div>


</template>

<script setup>
import { store } from '@/store';
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
const active_voice = ref(0)
const current_selected_move = computed(() => {
    return store.forgettign_pokemon.moves[active_voice.value]
})

onMounted(() => {

    window.addEventListener('keydown', handleMovesInput)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleMovesInput)
})

const handleMovesInput = async function (e) {
    if (!store.forgettign_pokemon) {
        return;
    }


    if (e.key == 'Enter') {
        store.info_text = `${store.forgettign_pokemon.name} has forgot ${store.forgettign_pokemon.moves[active_voice.value].name} to learn ${store.learnable_move.name}`
        store.forgettign_pokemon.moves.splice(active_voice.value, 1)
        store.forgettign_pokemon.moves.push(store.learnable_move)

        store.forgettign_pokemon = null
        store.learnable_move = null

    } else if (e.key == 'Backspace') {
        store.forgettign_pokemon = null
        store.learnable_move = null

    } else if (e.key == 'ArrowUp') {

        active_voice.value--;
        if (active_voice.value < 0) active_voice.value = store.forgettign_pokemon.moves.length - 1;

    } else if (e.key == 'ArrowDown') {

        active_voice.value++;

        if (active_voice.value > store.forgettign_pokemon.moves.length - 1) active_voice.value = 0;

    } else {
        return;
    }
}

const getMoveBackgroundColor = (type) => {
    const typeColors = {
        'normal': '#9099a1',
        'water': '#4d90d5',
        'fire': '#ff9c54',
        'grass': '#63bb5b',
        'flying': '#92aade',
        'poison': '#ab6ac8',
        'ground': '#d97746',
        'groundd': '#d97746',
        'rock': '#c7b78b',
        'bug': '#90c12c',
        'ghost': '#5269ac',
        'steel': '#5a8ea1',
        'electric': '#f3d23b',
        'psychic': '#f97176',
        'ice': '#74cec0',
        'dragon': '#096dc4',
        'dark': '#5a5366',
        'fairy': '#ec8fe6',
        'fighting': '#ce4069'
    };
    return typeColors[type] || '#000000';
};
</script>

<style scoped>
p {
    color: white;
    font-size: 1.5em;
}

.move-type {
    height: 20px;
    transform: translateY(-10%);
}

.new-move-card {
    display: flex;
    flex-direction: column;
    gap: 0.8em;
    background-color: white;
    padding-block: 20px;
    padding-inline: 40px;
    border-radius: 30px;
    align-items: center;
    justify-content: center;
    font-size: 1.1em;
}

.new-move-card div {
    display: flex;
    gap: 5px;
}

.menu-upper {
    display: flex;
    justify-content: space-between;
    align-items: center;

}

.move-forget-container {
    display: flex;
    align-items: center;
    position: absolute;
    flex-direction: column;
    z-index: 50;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #121212;
    padding: 50px;
    border-radius: 30px;
    gap: 30px;
}

.moves-container {
    gap: 0.5em;
    display: flex;
    align-items: center;
    flex-direction: column;
}



.type-name {
    display: flex;
    align-items: center;
    font-size: 1.5em;

}

i {
    position: absolute;
    top: 50%;
    left: -15%;
    transform: translateY(-50%);
    color: aqua;
    font-size: 3em;
}

.move {
    display: flex;
    align-items: center;
    height: 70px;
    width: 330px;
    padding-left: 5px;
    justify-content: space-between;
    border-radius: 30px;
    position: relative;
    /* border: 5px solid violet; */
}

img.icon {
    border-radius: 50%;
    width: 60px;
}

.pp {
    color: white;
    background-color: black;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 90px;
    padding-block: 7px;
    border-top-right-radius: 30px;
    border-bottom-right-radius: 30px;
    font-size: 1.7em;
}

.move:hover {
    border: 2px solid aqua;
    scale: 1.1;
    cursor: pointer;
}

.move.active {
    border: 2px solid aqua;
}

.active-sprite img {
    width: 250px;
    height: auto;
}

.old-move {
    background-color: lightcoral;
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
.move.active {
    animation: pulsate 1.5s infinite;
}
</style>