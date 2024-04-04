<template>
    <div class="text-panel">
        {{ renderedText }}
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue';
import { store } from '@/store';
import { map_store } from '@/mapStore';

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

watch(() => map_store.text_queue[0], (newValue, oldValue) => {
    if (newValue !== oldValue) {
        window.addEventListener('keydown', skipToEnd);
        renderTextLetterByLetter(map_store.text_queue[0])
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
    if (store.info_text !== '') {
        renderedText.value = store.info_text
    } else {
        console.log(map_store.text_queue[0])
        renderedText.value = map_store.text_queue[0]
    }
    // window.removeEventListener('keydown', skipToEnd)

    if (store.in_battle) {
        console.log('in battle')
        window.addEventListener('keydown', showOptionsMenu)

    } else {
        console.log('not in battle')
        window.addEventListener('keydown', skipToNextMessage)
    }

}

function skipToNextMessage(e) {

    if (e.key !== 'Enter') {
        return
    }
    if (store.in_battle) {
        return
    }
    if (!map_store.text_queue[1]) {
        store.menu_state = 'hidden'
    } else {
        window.removeEventListener('keydown', skipToNextMessage)
        map_store.skip_to_next_message()
    }

}

function showOptionsMenu(e) {
    if (e.key !== 'Enter' || store.battle_sequence_playing) return;

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
