<template>
    <div class="text-panel">
        {{ renderedText }}
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue';
import { store } from '@/store';

const textQueue = computed(() => store.info_text);
const renderedText = ref('');
let intervalId;
let index = 0;
const delay = store.config.text_speed;

watch(() => store.info_text, (newValue, oldValue) => {
    if (newValue !== oldValue) {
        renderTextLetterByLetter(store.info_text)
    }

});

onMounted(() => {
    renderTextLetterByLetter(store.info_text)
    window.addEventListener('keydown', skipToEnd);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', showOptionsMenu)
    window.removeEventListener('keydown', skipToEnd)
})

// function showNextText(e) {
//     if (e.key !== 'Enter') return;
//     window.removeEventListener('keydown', showNextText)
//     textQueue.value.shift();
//     if (textQueue.value.length > 0) {
//         const nextText = textQueue.value[0];
//         renderTextLetterByLetter(nextText);
//         window.addEventListener('keydown', skipToEnd)
//     }
//     else {
//         store.menu_state = 'options'
//     }
// }

function renderTextLetterByLetter(text) {
    clearInterval(intervalId);
    renderedText.value = '';
    index = 0;
    intervalId = setInterval(() => {
        if (index < text.length) {
            renderedText.value += text[index];
            index++;
        } else {
            clearInterval(intervalId);

        }
    }, delay);
}

function skipToEnd(e) {
    if (e.key !== 'Enter' || store.battle_sequence_playing) return;
    clearInterval(intervalId);
    renderedText.value = store.info_text
    window.removeEventListener('keydown', skipToEnd)
    window.addEventListener('keydown', showOptionsMenu)
}

function showOptionsMenu(e) {
    if (e.key !== 'Enter' || store.battle_sequence_playing) return;
    console.log('showing menu')
    store.menu_state = 'options'
}


</script>


<style scoped>
.text-panel {
    width: 100vw;
    position: absolute;
    padding: 50px;
    z-index: 3;
    bottom: 0%;
    background-color: rgba(18, 18, 18, 0.5);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5em;

}
</style>
