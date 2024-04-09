<template>
    <div class="text-panel">
        {{ renderedText }}
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue';
import { store } from '@/store';
import { map_store } from '@/mapStore.mjs';

const textQueue = computed(() => store.info_text);
const renderedText = ref('');
let intervalId;
let index = 0;
const delay = store.config.text_speed;



onMounted(() => {
    renderTextLetterByLetter(store.info_text)
    window.addEventListener('keydown', skipToEnd);
    watch(() => store.info_text, (newValue, oldValue) => {
        if (newValue !== oldValue) {

            renderTextLetterByLetter(store.info_text)
        }

    });

    watch(() => map_store.text_queue.length, (newValue, oldValue) => {

        if (newValue !== oldValue) {
            map_store.all_messages_read = false
            renderTextLetterByLetter(map_store.text_queue[0])
            window.addEventListener('keydown', skipToEnd);
        }
    });
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', showOptionsMenu)
    window.removeEventListener('keydown', skipToEnd)
})



function renderTextLetterByLetter(text) {
    if (!text) return
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

    if ((e.key !== 'Enter' && e.code !== 'Space') || store.battle_sequence_playing) return;
    clearInterval(intervalId);
    if (store.info_text !== '') {
        renderedText.value = store.info_text
    } else {
        renderedText.value = map_store.text_queue[0]
    }
    // window.removeEventListener('keydown', skipToEnd)

    if (store.in_battle) {

        window.addEventListener('keydown', showOptionsMenu)

    } else {

        window.addEventListener('keydown', skipToNextMessage)
    }

}

function skipToNextMessage(e) {

    if (e.key !== 'Enter' && e.code !== 'Space') {
        return
    }
    if (store.in_battle) {
        return
    }
    if (!map_store.text_queue[1]) {
        map_store.skip_to_next_message()
        map_store.all_messages_read = true
        store.menu_state = 'hidden'
    } else {
        window.removeEventListener('keydown', skipToNextMessage)
        map_store.skip_to_next_message()
    }

}

function showOptionsMenu(e) {
    if ((e.key !== 'Enter' && e.code !== 'Space') || store.battle_sequence_playing || store.menu_state !== 'text') return;
    console.log('showing options menu')
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
