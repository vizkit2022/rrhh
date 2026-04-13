<script setup>
import { ref, computed, onUnmounted, onMounted, defineProps } from "vue";
import useOutcomesStore from "@/stores/outcomes";

// Components
import { DialogAddLinesPOStep1, DialogAddLinesPOStep2} from "#components";

// Stores
const outcomesStore = useOutcomesStore();

// Steps
const stepsViews = {
  1: DialogAddLinesPOStep1,
  2: DialogAddLinesPOStep2
};

// Props
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  }
});

// Emits
const emit = defineEmits(["closeModal"]);

// Constants
const step = ref(1);

// Computed
const stepsView = computed(() => stepsViews[step.value]);

// Functions
const changeStep = (next = false) => {
  // Avanzar
  if(next) {
    if(step.value === 1) {
        step.value = 2;
    }
  }
  // Retroceder
  else {
    if(step.value === 2) {
      step.value = 1;
    }
  }
};

onMounted(async() => {
  window.addEventListener("keydown", handleEscapeKey);
})

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscapeKey);
  outcomesStore.formAddLines.currencies = [];
  outcomesStore.formAddLines.lines = [];
  outcomesStore.formAddLines.othersCurrency = [];
  outcomesStore.formAddLines.currency = null;
});


const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    emit("closeModal");
  };
};
</script>

<template>
  <component 
    :is="stepsView" 
    @closeModal="emit('closeModal')" 
    @changeStep="changeStep" 
    @updateMetrics="(total) => emit('updateMetrics', total)"
    @updatedTable="emit('updatedTable')"
    :config="props.config" />
</template>

<style scoped>
</style>

