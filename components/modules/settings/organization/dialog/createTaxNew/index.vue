<script setup>
import useOrganizationStore from "@/stores/organization";
import step1 from "./step1.vue";
import step2 from "./step2.vue";
import step3 from "./step3.vue";
import step4 from "./step4.vue";
import { useI18n } from "vue-i18n";

// TRANSLATED
const { t } = useI18n();
const moduleStep1 = "modules.organizations.settings.taxes.modal.create.step1";
const moduleStep2 = "modules.organizations.settings.taxes.modal.create.step2";

// STORE
const organizationStore = useOrganizationStore();

// PROPS
const props = defineProps({
  tax: {
    type: Object,
    default: () => {},
  },
  edit: {
    type: Boolean,
    default: false,
  },
});

// EMITS
const emit = defineEmits(["updateDimensions", "closeModal"]);

// STEPS
const stepsViews = [step1, step2, step3, step4];

//CONSTANTS
const currentStep = ref(0);
const isDataReady = ref(false); // Variable para controlar cuando los datos están listos

// COMPUTED
const currentComponent = computed(() => stepsViews[currentStep.value]);

// FUNCTIONS

const generalOptions = ref({
  // step 1
  behavior: [
    {
      label: t(`${moduleStep1}.inputs.behavior.options[0].label`),
      text: t(`${moduleStep1}.inputs.behavior.options[0].text`),
      value: true,
    },
    {
      label: t(`${moduleStep1}.inputs.behavior.options[1].label`),
      text: t(`${moduleStep1}.inputs.behavior.options[1].text`),
      value: false,
    },
  ],
  calc: [
    {
      label: t(`${moduleStep1}.inputs.calc.options[0].label`),
      value: "percentageFix",
    },
    {
      label: t(`${moduleStep1}.inputs.calc.options[1].label`),
      value: "editPercentage",
    },
    {
      label: t(`${moduleStep1}.inputs.calc.options[2].label`),
      value: "editValue",
    },
  ],
  applied: [
    {
      label: t(`${moduleStep1}.inputs.additionalText1.options[0].label`),
      value: "toTotals",
    },
    {
      label: t(`${moduleStep1}.inputs.additionalText1.options[1].label`),
      value: "toLines",
    },
    {
      label: t(`${moduleStep1}.inputs.additionalText1.options[3].label`),
      value: "noTotal",
    },
    {
      label: t(`${moduleStep1}.inputs.additionalText1.options[5].label`),
      value: "agencyCommission",
    },
  ],
  costCalc: [
    {
      label: t(`${moduleStep1}.inputs.additionalText2.options[0].label`),
      value: "toTotals",
    },
    {
      label: t(`${moduleStep1}.inputs.additionalText2.options[1].label`),
      value: "equalValue",
    },
    {
      label: t(`${moduleStep1}.inputs.additionalText2.options[3].label`),
      value: "noTotal",
    },
    {
      label: t(`${moduleStep1}.inputs.additionalText2.options[4].label`),
      value: "toLines",
    },
  ],
  //step 2
  saleValue: [
    {
      label: t(`${moduleStep2}.inputs.saleValue.options[0].label`),
      text: t(`${moduleStep2}.inputs.saleValue.options[0].text`),
      value: "toTotals",
    },
    {
      label: t(`${moduleStep2}.inputs.saleValue.options[1].label`),
      text: t(`${moduleStep2}.inputs.saleValue.options[1].text`),
      value: "toLines",
    },
    {
      label: t(`${moduleStep2}.inputs.saleValue.options[2].label`),
      text: t(`${moduleStep2}.inputs.saleValue.options[2].text`),
      value: "agencyCommission",
    },
    {
      label: t(`${moduleStep2}.inputs.saleValue.options[4].label`),
      text: t(`${moduleStep2}.inputs.saleValue.options[4].text`),
      value: "noTotal",
    },
  ],
  budgetedValue: [
    {
      label: t(`${moduleStep2}.inputs.budgetedValue.options[0].label`),
      text: t(`${moduleStep2}.inputs.budgetedValue.options[0].text`),
      value: "equalValue",
    },
    {
      label: t(`${moduleStep2}.inputs.budgetedValue.options[1].label`),
      text: t(`${moduleStep2}.inputs.budgetedValue.options[1].text`),
      value: "toLines",
    },
    {
      label: t(`${moduleStep2}.inputs.budgetedValue.options[2].label`),
      text: t(`${moduleStep2}.inputs.budgetedValue.options[2].text`),
      value: "toTotals",
    },
    {
      label: t(`${moduleStep2}.inputs.budgetedValue.options[4].label`),
      text: t(`${moduleStep2}.inputs.budgetedValue.options[4].text`),
      value: "noTotal",
    },
  ],
  calcPurchase: [
    {
      label: t(`${moduleStep2}.inputs.calcPurchase.options[0].label`),
      text: t(`${moduleStep2}.inputs.calcPurchase.options[0].text`),
      value: "toTotals",
    },
    {
      label: t(`${moduleStep2}.inputs.calcPurchase.options[1].label`),
      text: t(`${moduleStep2}.inputs.calcPurchase.options[1].text`),
      value: "equalValue",
    },
    {
      label: t(`${moduleStep2}.inputs.calcPurchase.options[2].label`),
      text: t(`${moduleStep2}.inputs.calcPurchase.options[2].text`),
      value: "noApply",
    },
  ],
});

const getNameOptions = (name, prop) => {
  if (String(name).trim() !== "") {
    const option = generalOptions.value[prop].find((op) => op.value === name);
    return option?.label ?? "";
  }
  return "";
};

const formatData = (dataTax, base) => {
  return {
    step1: {
      ...base.step1,
      _id: dataTax?._id || null,
      type: dataTax?.typeTax || "surcharge",
      name: dataTax?.name || "",
      abbr: dataTax?.code || "",
      retention: dataTax?.retention || false,
      retentionName:
        getNameOptions(dataTax?.retention || false, "behavior") || "",
      calc: dataTax?.surchargeVariables?.field || "",
      calcName:
        getNameOptions(dataTax?.surchargeVariables?.field || "", "calc") || "",
      percentage: dataTax?.value + " %",
      description: dataTax?.description || "",
    },
    step2: {
      ...base.step2,
      saleValue: dataTax?.surchargeVariables?.sumPrice?.state || "",
      saleValueName:
        getNameOptions(
          dataTax?.surchargeVariables?.sumPrice?.state,
          "saleValue",
        ) || "",
      budgetedValue: dataTax?.surchargeVariables?.sumBudget?.state || "",
      budgetedValueName:
        getNameOptions(
          dataTax?.surchargeVariables?.sumBudget?.state,
          "budgetedValue",
        ) || "",
      addToTotal: !dataTax?.addToTotal || false,
    },
    step3: {
      ...base.step3,
      purchaseDocs: dataTax?.associateDocuments.docsOutcomes || [],
      salesDocs: dataTax?.associateDocuments.docsSales || [],
      taxManual: dataTax?.surchargesDocumentType?.field === "editValue",
    },
  };
};

// funciones de navegación
const closeModal = () => {
  organizationStore.cleanFormCreateTax();
  emit("closeModal");
};

const handleNextStep = (numberStep = null) => {
  if (
    numberStep !== null &&
    numberStep >= 1 &&
    numberStep <= stepsViews.length
  ) {
    currentStep.value = numberStep;
  } else if (currentStep.value < stepsViews.length - 1) {
    currentStep.value++;
  }
};

const handlePrevStep = (numberStep = null) => {
  if (
    numberStep !== null &&
    numberStep >= 1 &&
    numberStep <= stepsViews.length
  ) {
    currentStep.value = numberStep;
  } else if (currentStep.value > 0) {
    currentStep.value--;
  }
};

// CYCLES

onBeforeMount(async () => {
  if (props.edit) {
    try {
      // obtención del id de la tax:
      const respTax = await organizationStore.taxById(props.tax._id);
      // aquí se formatear la data del tax
      organizationStore.formCreateTax = formatData(
        respTax,
        organizationStore.formCreateTax,
      );
    } catch (error) {
      console.error("Error loading tax data:", error);
    } finally {
      isDataReady.value = true;
    }
  } else {
    isDataReady.value = true;
  }
});

onUnmounted(() => {
  organizationStore.cleanFormCreateTax();
});
</script>

<template>
  <div v-if="!isDataReady" class="loading-container">
    <u-loading />
  </div>

  <component
    v-else
    :is="currentComponent"
    :tax="props.tax"
    :edit="props.edit"
    @closeModal="closeModal"
    @nextStep="handleNextStep"
    @prevStep="handlePrevStep"
    @updateDimensions="$emit('updateDimensions')"
  />
</template>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 740px;
}
</style>
