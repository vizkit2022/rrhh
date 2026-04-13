<script setup>
import { ref, computed, onUnmounted, onMounted, defineProps } from "vue";
import { toast } from 'vue3-toastify';
import useOutcomesStore from "@/stores/outcomes"; 
import useOrganizationStore from "@/stores/organization"; 
import useGlobalStore from "@/stores/global"; 
import useIncomeStore from "@/stores/incomes";

// Components
import {
  DialogPOCreatorStep1,
  DialogPOCreatorStep2,
  DialogPOCreatorStep3,
  DialogPOCreatorStep4,

  // Documenting
  DialogDocumentingStep1,
  DialogDocumentingStep2
} from "#components";

// Stores
const outcomesStore = useOutcomesStore();
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();
const incomesStore = useIncomeStore();

// Steps
const stepsViews = {
  1: DialogPOCreatorStep1,
  2: DialogPOCreatorStep2,
  3: DialogPOCreatorStep3,
  4: DialogPOCreatorStep4,
  5: DialogDocumentingStep1,
  6: DialogDocumentingStep2
};

// Props
const props = defineProps({
  typePO: {
    type: Object,
    default: () => ({}),
  },
  config: {
    type: Object,
    default: () => ({}),
  }
});

// Emits
const emit = defineEmits(["closeModal", "updateDimensions", "updateTableGrid", "modalCanceled"]);

// Constants
const step = ref(1);
const { t } = useI18n();
const updatedDocStep1 = ref(true);

// Computed
const stepsView = computed(() => stepsViews[step.value]);

// Functions
const changeStep = (next) => {
  // Avanzar
  if(next) {
    if(step.value === 1) {
      if(props.config.skipStep2) {
        step.value = 3;
      } else {
        step.value = 2;
      }
    }
    else if(step.value === 2) {
      step.value = 3;
    }
    else if(step.value === 3) {
      step.value = 4;
    }
  }
  // Retroceder
  else {
    if(step.value === 2) {
      step.value = 1;
    }
    else if(step.value === 3) {
      if(props.config.skipStep2) step.value = 1;
      else step.value = 2;
    }
    else if(step.value === 4) {
      step.value = 3;
    }
  }
  // Actulizar las Dimensiones
  emit('updateDimensions', {
    width: [3,4].includes( step.value ) ? "85vw" : "auto",
    height: "auto"
  });
};
const documenting = (st) => {
  if(st === 1) {
    step.value = 5;
    emit('updateDimensions', { width: "780px", height: "auto" });
  } else if(st === 2) {
    step.value = 6;
    emit('updateDimensions', { width: "85vw", height: "auto" });
  } else {
    step.value = 4;
    emit('updateDimensions', { width: "85vw", height: "auto" });
    outcomesStore.resetDocumenting();
  }
};
const returnToCreatePO = (st) => {
  step.value = st;
  emit('updateDimensions', { width: st === 4 ? "85vw" : "780px", height: "auto" });
};


onBeforeMount(() => {
  outcomesStore.resetPOCreator();
});

onMounted(async() => {
  window.addEventListener("keydown", handleEscapeKey);
  
  let resp = {};
  // Verifica si la currency se agarra del movimiento o la moneda de la organizacion
  if (Object.keys(incomesStore.income).length > 0) {
    resp = await globalStore.getMyCurrencies(false, incomesStore?.income?.currency?.default?._id);
  } else {
    resp = await globalStore.getMyCurrencies();
  }

  outcomesStore.formPO.currencies = resp.currencies;
  outcomesStore.formPO.currencies.unshift(resp.currency);
  outcomesStore.formPO.currency = resp.currency;
  outcomesStore.formPO.currencyName = resp?.currency?.name?.[globalStore.lang];
  outcomesStore.formPO.type = props?.typePO?.type;
  await outcomesStore.getDocumentTypesByCountry();
  setTimeout(() => {
    outcomesStore.formPO.managementDoc = props?.typePO?._id;
    outcomesStore.formPO.typeName = props?.typePO?.code;
    outcomesStore.formPO.income = props?.config?.income || "";
    if(props?.config?.lines?.length) {
      outcomesStore.formPO.lines = props.config.lines;
    }
  }, 0)
})

onUnmounted(() => {
  outcomesStore.resetPOCreator();
  window.removeEventListener("keydown", handleEscapeKey);
});


const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    if(step.value === 3) {
      if(!outcomesStore.formPO.processing) {
        const msg = t("global.text.noEsc")
        toast.warning(msg, { autoClose: 2000 });
      }
    } else if(!outcomesStore.formPO.processing) {
      emit("closeModal");
    }
  };
};
</script>

<template>
  <component 
    style="min-width: 780px;"
    :is="stepsView" 
    :fromCreatePO="true"
    :updatedDocStep1="updatedDocStep1"
    @changeUpdatedDocStep1="updatedDocStep1 = $event"
    @closeModal="emit('closeModal')" 
    @changeStep="changeStep" 
    @updateTableGrid="emit('updateTableGrid')"
    @modalCanceled="(_id) => emit('modalCanceled', _id)"
    @documenting="documenting"
    @returnToCreatePO="returnToCreatePO"
    :config="props.config" />
</template>

<style scoped>
</style>
