<script setup>
import { ref, computed } from 'vue';
import step1 from './step1.vue';
import step2 from './step2.vue';
import step3 from './step3.vue';

const props = defineProps({
  edit : {
    type: Boolean,
    default: false
  },
  editItem : {
    type: Object,
    default: null
  },
})

const steps = [step1, step2, step3];
const currentStep = ref(0);
// const montoSeleccionado = ref(null);
// const validatorsMembers = ref([]);

const currentComponent = computed(() => steps[currentStep.value]);

const handleNextStep = () => {
  // if (monto !== null) {
  //   montoSeleccionado.value = monto;
  // }
  // if (validatorsActual.length > 0) {
  //   validatorsMembers.value = [...validatorsActual]; 
  // }
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
  // if (currentStep.value === 0) {
  //   montoSeleccionado.value = null;
  //   validatorsMembers.value = [];
  // }
};
</script>

<template>
  <component 
    :is="currentComponent"  
    :edit="edit"
    :editItem="editItem"
    @closeModal="$emit('closeModal')" 
    @nextStep="handleNextStep" 
    @prevStep="prevStep" 
    @updateDimensions="$emit('updateDimensions')"  
  />
</template>
