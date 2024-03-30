<template>
    <div>
        <div id="enemy-bar">
            <div class="info-container">
                <div>
                    <span>{{ store.oppo_pokemon.name }}</span>
                    <img v-if="store.oppo_pokemon.status" class="status"
                        :src="'/badges/' + store.oppo_pokemon.status + '.png'">

                </div>
                <div>
                    <span><i class="fa-solid"
                            :class="store.oppo_pokemon.gender == 'male' ? 'fa-mars' : 'fa-venus'"></i></span>
                    <span id="enemy-level">LV.{{ store.oppo_pokemon.level }}</span>

                </div>


            </div>


            <div class="progress enemy-progress">
                <!-- <span class="status">BRN</span> -->
                <progress id="enemy-hp" :value="store.oppo_pokemon.hp.current" :max="store.oppo_pokemon.hp.max"
                    :class="hpBarClass">
                </progress>
                <div class="hp-num">{{ store.oppo_pokemon.hp.current }}/{{ store.oppo_pokemon.hp.max }}</div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { store } from '@/store'
import { ref, onMounted, computed } from 'vue'
let oppo_pokemon = ref(store.oppo_pokemon)


const hpPercentage = computed(() => {
    return (store.oppo_pokemon.hp.current / store.oppo_pokemon.hp.max) * 100;
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

#enemy-bar {
    background-color: rgba(255, 255, 255, 0.3);
    width: 380px;
    height: 100px;
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


#enemy-bar {
    top: 5%;
    right: 10%;
}

.status {
    position: absolute;
    top: 12%;
    right: 2%;
    max-width: 80px;
}




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
    margin-top: 0.8em;
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
    background-color: magenta !important;
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

#my-xp {
    height: 15px;
    width: 180px;
}

.progress-bars {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3em;
}

/* diff colors based on computed hp perc */
</style>