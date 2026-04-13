<script setup>

import { 
    DialogUploadDocumentTrayStep1,
    DialogUploadDocumentTrayStep2,
    DialogUploadDocumentTrayStep3
} from '#components'

// PROPS
const props = defineProps({
    initTab : {
        type: Number,
        default: 1
    },
})

// EMITS
const emit = defineEmits([
    'closeModal', 'reloadDocTray'
])


// CONSTANTS
const step = ref(props.initTab);
const prevStep = ref(null);
// View Dialog
const stepsViews = {
    1: DialogUploadDocumentTrayStep1,
    2: DialogUploadDocumentTrayStep2,
    3: DialogUploadDocumentTrayStep3
}
const maxStep = Object.keys(stepsViews).length;

//COMPUTED
const stepView = computed(() => stepsViews[step.value]);

//FUNCTIONS

// cambiar step
const changeStep = (next) => {
    prevStep.value = step.value;
    // Cambio de Step
    if (next && step.value < maxStep) {
        step.value += 1;
    } else if (!next && step.value > 0) {
        step.value -= 1;
    }
};

</script>

<template>
    <component 
        :is="stepView"
        @reloadDocTray="emit('reloadDocTray')"
        @closeModal="emit('closeModal')"
        @changeStep="changeStep"
        :initTab="props.initTab"
        :prevStep="prevStep"
    />
</template>

<style scoped>
</style>