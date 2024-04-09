<template>


    <div id="my-bar">
        <div class="info-container">
            <div class="name_status">
                <span>{{ store.my_pokemon.name }}</span>
                <img v-if="store.my_pokemon.status" class="status" :src="'/badges/' + store.my_pokemon.status + '.png'">

            </div>
            <div class="level_gender">
                <span><i class="fa-solid"
                        :class="store.my_pokemon.gender == 'male' ? 'fa-mars' : 'fa-venus'"></i></span>
                <span>LV.{{ store.my_pokemon.level }}</span>
            </div>


        </div>

        <div class="progress-bars">
            <div class="progress player-progress">

                <progress id="my-hp" :value="store.my_pokemon.hp.current" :max="store.my_pokemon.hp.max"
                    :class="hpBarClass">
                </progress>
                <div class="hp-num">{{ store.my_pokemon.hp.current }}/{{ store.my_pokemon.hp.max }}</div>
            </div>
            <div>
                <progress class="my-xp" :value="store.my_pokemon.xp.total" :max="store.xp_for_next_level">
                </progress>


            </div>

        </div>

    </div>


</template>

<script setup>
import { store } from '@/store'
import { map_store } from '@/mapStore.mjs';
import { ref, onMounted, computed } from 'vue'
import gsap from 'gsap'

const hpPercentage = computed(() => {
    return (store.my_pokemon.hp.current / store.my_pokemon.hp.max) * 100;
});

// Determine HP bar class based on HP percentage
const hpBarClass = computed(() => {
    if (hpPercentage.value > 50) {
        return 'full-hp';
    } else if (hpPercentage.value >= 20 && hpPercentage.value <= 49) {
        return 'medium-hp';
    } else {
        return 'low-hp';
    }
});

onMounted(() => {
    map_store.bar_transition(true)
})



</script>

<style scoped>
.level_gender {
    display: flex;
    align-items: center;
    gap: 10px;
}

.fa-mars {
    color: blue;
}

.fa-venus {
    color: crimson;
}

#my-bar {
    background-color: rgba(255, 255, 255, 0.3);
    width: 380px;
    height: 115px;
    border: 3px solid black;
    position: absolute;
    border-radius: 10%;
    padding-inline: 1.2em;
    padding-block: 1em;
    text-align: center;
    z-index: 3;
}

.hp-num {
    margin-left: 10px;
    font-size: 1.4em;
}

.status {
    position: absolute;
    top: 12%;
    right: 2%;
    max-width: 80px;
}


#enemy-bar {
    top: 5%;
    right: 10%;
}

/* 
#my-bar {
    top: 5%;
    left: -10%;
} */

.info-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.4em;
    width: 250px;
    padding-inline: 0.2em;
}

.info-container>div {
    display: flex;
    align-items: center;
    gap: 0.5em;
}

#enemy-gender,
#my-gender {
    color: blue;
    font-size: 1.2em;
}


.progress {
    display: flex;
    margin-top: 0.5em;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 20px;
    width: fit-content;
    /* margin-inline: auto; */
}



progress {
    width: 250px;
    border: 3px solid black;
    height: 100%;
}




.progress>span {
    background-color: black;
    border: 3px solid black;
    color: orange;
    padding: 0.2em;
    height: 100%;
    text-align: center;
    display: flex;
    align-items: center;

}

span.status {
    color: white;
    background-color: red;
    border: 0;
    margin-right: 0.5em;
}

.my-xp {
    height: 15px;
    width: 180px;
}

.my-xp::-webkit-progress-bar,
#my-hp::-webkit-progress-bar {
    background-color: lightgray;
}

.my-xp::-webkit-progress-value {
    background-color: aqua;
}

/* diff colors based on computed hp perc */




.progress-bars {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3em;
}

.slide-enter-active,
.slide-leave-active {
    transition: transform 0.5s ease;
}

.slide-enter,
.slide-leave-to {
    transform: translateX(-100%);
}
</style>