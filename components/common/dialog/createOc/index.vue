<script setup>
import {
  ref,
  defineProps,
  onMounted,
  defineEmits,
  computed,
  onUnmounted,
  onBeforeUnmount,
} from "vue";
import useLinesStore from "@/stores/lines";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
// Stores
const linesStore = useLinesStore();
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();
// EventBus
const { $bus } = useNuxtApp();
// Emits
const emit = defineEmits(["updateDimensions"]);
// Props
const props = defineProps({
  page: {
    type: String,
    default: "incomes",
  },
});

// Constants
const step = ref(1);
const hasIncompleteDocumentation  = ref(true);

// Mounted
onMounted(async () => {
  globalStore.loading = true; 
  outcomesStore.taxes = [];

  $bus.$on("reduceDocumented", (lines) => {
    const lineIndexMap = new Map();

    console.log("Lineas que me llegaron",lines);
    // Crear un mapa con los índices para una búsqueda más rápida
    console.log("Lineas a modificar",outcomesStore.outcome.lines);
    outcomesStore.outcome.lines.forEach((line, index) => {
      lineIndexMap.set(line._id, index);
    });

    lines.forEach(line => {
      hasIncompleteDocumentation.value  = false 
      const index = lineIndexMap.get(line._id);   
      if (index !== undefined) {
        outcomesStore.outcome.lines[index].numbers.documented.number += line.numbers.total.number;
      }

      if( outcomesStore.outcome.lines[index].numbers.documented.number < outcomesStore.outcome.lines[index].numbers.total.number){
        console.log("Linea Le falta documentado ")
        console.log("documented ",outcomesStore.outcome.lines[index].numbers.documented.number )
        console.log("total ",outcomesStore.outcome.lines[index].numbers.total.number )
        hasIncompleteDocumentation.value   = true 
      }
    });  
  });

  $bus.$on("updatedStep", (next) => {
    nextStep(next);
  });
  step.value = ["outcomes-1", "incomes"].includes(props.page) ? 1 : 2;

  await outcomesStore.getDocumentTypesByCountry();

  const lines = JSON.parse(
    JSON.stringify(linesStore.lines.filter((l) => l.selected && !l.isParent))
  );
  outcomesStore.linesOcSelected = lines.length
    ? lines
    : outcomesStore.linesOcSelected;
  globalStore.loading = false;
});

onBeforeUnmount(() => {
  outcomesStore.cleanFormOc();
  outcomesStore.linesOcSelected = [];
  $bus.$off("updatedStep");
  $bus.$off("reduceDocumented");
});

// Actions
const nextStep = async (next) => {
  //para poder ir directo a una pantalla en especifico
  if (typeof next === 'number') {
    if(next == 4){
      console.log("Voy a la pantalla 4")
      console.log("Lineas ",outcomesStore.outcome.lines)
      console.log("Lineas typeof ",typeof outcomesStore.outcome.lines)
      const test = await outcomesStore.getLinesOutcome(outcomesStore.outcome.outcome._id);
      delete test.selected;
      const auxtest = JSON.parse(JSON.stringify(test));
      console.log("test ",auxtest)
      console.log("test typeof ",auxtest)

      outcomesStore.outcome.lines = auxtest;
    }
    step.value = next;
  }

  if (next) {
    if (props.page === "outcomes-1") {
      if (step.value === 1) step.value = 2;
      else if (step.value === 2) step.value = 3;
      else if (step.value === 3) {
        step.value = 4;
      }
    }
    if (props.page === "outcomes-2") {
      // Solo es el paso 2
    }
    if (props.page === "incomes") {
      if (step.value === 1) {
        if (thereAreSelectedLines.value) {          
          step.value = 3;
          outcomesStore.linesOcSelected = linesStore.lines
            .filter((l) => l.selected && !l.isParent)
            .map((l) => ({
              ...l,
              taxes: [],
              numbers: {
                ...l.numbers,
                tax: {
                  lastNumber: 0,
                  lastValue: "",
                  number: 0,
                  value: "",
                },
              },
            }));
        } else {
          step.value = 2;
        }
      } else if (step.value === 2) step.value = 3;
      else if (step.value === 3) {
        step.value = 4;
      }
    }
  } else {
    if (props.page === "outcomes-1") {
      if (step.value === 2) step.value = 1;
      else if (step.value === 3) step.value = 2;
      else if (step.value === 4) step.value = 3;
    }
    if (props.page === "outcomes-2") {
      // Solo es el paso 2
    }
    if (props.page === "incomes") {
      if (step.value === 2) step.value = 1;
      else if (step.value === 3)
        step.value = thereAreSelectedLines.value ? 1 : 2;
      else if (step.value === 4) step.value = 3;
    }
  }
};

// Computed
const thereAreSelectedLines = computed(() => {
  return linesStore.lines.filter((l) => l.selected && !l.isParent).length;
});
</script>

<template>
  <DialogCreateOcStep1 v-if="step === 1" />
  <DialogCreateOcStep2 v-if="step === 2" :page="props.page" />
  <DialogCreateOcStep3 v-if="step === 3" :page="props.page" />
  <DialogCreateOcStep4 v-if="step === 4" />


  <DialogToDocument  v-if="step === 4.1"
    :closeDirect="!hasIncompleteDocumentation"
    :lineas="outcomesStore.outcome.lines"
    :outcomes="outcomesStore.outcome.outcome"
    openby="CreateOC"
    :currencyID="outcomesStore.outcome.outcome.currency.default"
    :documentTypeID="outcomesStore.outcome.outcome.documentType"
    :conditionPayment="outcomesStore.outcome.outcome.supplier.payment.condition"
  /> 

</template>

<style scoped></style>
