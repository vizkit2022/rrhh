<script setup>

import { 
    DialogCreateSalesDocNotesCreditDebitStep1,
    DialogCreateSalesDocNotesCreditDebitStep2,
    DialogCreateSalesDocNotesCreditDebitStep3,
    DialogCreateSalesDocNotesCreditDebitStep4,
 } from '#components';


// PROPS
const props = defineProps({
    initTab: {
        type: Number,
        default: 1
    },
    skipSteps: {
        type: Array,
        default: () => []
    }
})

// EMITS
const emit = defineEmits(["closeModal", "updatePadding", "reloadSales"]);


// VIEWS DIALOG
const stepsViews = {
    1: DialogCreateSalesDocNotesCreditDebitStep1,
    2: DialogCreateSalesDocNotesCreditDebitStep2,
    3: DialogCreateSalesDocNotesCreditDebitStep3,
    4: DialogCreateSalesDocNotesCreditDebitStep4,
}

// CONSTANTS
const step = ref(props.initTab);
const prevStep = ref(null);

// COMPUTED
const stepsView = computed(() => stepsViews[step.value]);

// FUNCTIONS
const getNextValidStep = (currentStep, direction) => {
    let nextStep = currentStep + (direction ? 1 : -1);
    
    // Buscar el siguiente step válido que no esté en skipSteps
    while (nextStep >= 1 && nextStep <= 4) {
        if (!props.skipSteps.includes(nextStep)) {
            return nextStep;
        }
        nextStep += (direction ? 1 : -1);
    }
    
    return currentStep; // Si no hay step válido, mantener el actual
};

const changeStep = (next) => {
    prevStep.value = step.value;
    const newStep = getNextValidStep(step.value, next);
    
    if (newStep !== step.value) {
        step.value = newStep;
    }
};

// Ir directamente a un step específico (útil para saltos)
const goToStep = (targetStep) => {
    if (targetStep >= 1 && targetStep <= 4 && !props.skipSteps.includes(targetStep)) {
        prevStep.value = step.value;
        step.value = targetStep;
    }
};

</script>

<template>
    <component 
        :is="stepsView"
        @changeStep="changeStep"
        @goToStep="goToStep"
        @updatePadding="emit('updatePadding')"
        @closeModal="emit('closeModal')"
        @reloadSales="emit('reloadSales')"
        :initTab="initTab"
        :prevStep="prevStep" 
    />
</template>