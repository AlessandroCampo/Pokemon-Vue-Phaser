<template>
    <div class="additional-info" :style="{ backgroundColor: prop_color }">
        <h2>{{ prop_move.name }}</h2>
        <p>{{ prop_move.description }}</p>
        <div class="secondary-info">
            <span> Type: {{ prop_move.type }}</span>
            <span> Category: {{ prop_move.category }}</span>
            <span>Accuracy: {{ prop_move.accuracy === null || prop_move.accuracy > 100 ? '-' : prop_move.accuracy
                }}</span>

            <span v-if="prop_move.power"> Power: {{ prop_move.power }}</span>
            <span> Makes contact? {{ prop_move.makes_contact }}</span>
        </div>

    </div>

</template>

<script setup>
import { onMounted, ref, defineProps } from 'vue'
const props = defineProps(['prop_move', 'prop_color'])

</script>

<style scoped>
.additional-info {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2em;
    z-index: 3;
    padding: 50px;
    display: flex;
    flex-direction: column;
    gap: 1em;
}

.secondary-info {
    display: flex;
    flex-direction: column;
    gap: 0.5;
    font-size: 0.8em;
}

h2 {
    text-align: center;
}
</style>