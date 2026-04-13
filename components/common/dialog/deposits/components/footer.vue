<script setup>
import { computed } from "vue";
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();

// Emits
const emit = defineEmits(["closeModal", "refresh"]);

// Constants
const { t } = useI18n();
// const BASE_KEY = "modules.outcomes.pages.oc.modals.deposits.buttons";
const color = "--neutral-text-caption";

// Computed
const BASE_KEY = computed(() => {
  switch (paymentsStore.formDeposits?.type) {
    case "outcome":
      return "modules.outcomes.pages.oc.modals.deposits.buttons";
    case "sales-documents-charged":
      return "modules.sales.modals.charge.buttons";
    case "sales-documents-refund":
      return "modules.sales.modals.refund.buttons";
    default:
      return "modules.outcomes.pages.oc.modals.deposits.buttons";
  }
});
const step = computed(() => paymentsStore.formDeposits?.step ?? 0);
const isFinalStep = computed(() => [4, 5].includes(step.value));
const btn = {
  back: computed(() => t(`${BASE_KEY.value}.back`)),
  next: computed(() => t(`${BASE_KEY.value}.next`)),
  save: computed(() => t(`${BASE_KEY.value}.save`)),
};
const disabledNext = computed(() => {
  // Paso de verificacion -> step 0
  if (step.value === 0) {
    return !paymentsStore.formDeposits.correctFiltering;
  } else if (step.value === 1) {
    // Paso de monto -> step 1
    return paymentsStore.formDeposits.totalDeposits?.number === 0;
  } else if (step.value === 2) {
    // Paso del formulario -> step 2
    return !paymentsStore.validateFormDepositsStep2().valid;
  } else if (step.value === 3) {
    return paymentsStore.formDeposits.destinationAccount === "";
  } else {
    return false;
  }
});

const disabledCreate = computed(() => {
  if (step.value === 4) {
    return true;
  } else if (step.value === 5) {
    return paymentsStore.formDeposits.originAccount === "";
  } else {
    return false;
  }
});

// Functions
const goNext = () => {
  if (step.value < 5) {
    if (
      step.value === 3 &&
      Object.keys(paymentsStore.formDeposits.supplier).length !== 0
    ) {
      // Si el supplier existe, saltar al paso 5
      paymentsStore.formDeposits.step = 5;
      return;
    }

    paymentsStore.formDeposits.step++;
  }
};
const goBack = () => {
  if (
    step.value === 5 &&
    Object.keys(paymentsStore.formDeposits.supplier).length !== 0
  ) {
    // Si el supplier existe, saltar al paso 3
    paymentsStore.formDeposits.step = 3;
    return;
  }
  paymentsStore.formDeposits.step--;
};
const createDesposit = async () => {
  globalStore.loading = true;
  switch (paymentsStore.formDeposits.type) {
    case "outcome":
      await paymentsStore.createDeposit();
      break;
    case "sales-documents-charged":
      await paymentsStore.createDepositCharge();
      break;
    case "sales-documents-refund":
      await paymentsStore.createDepositRefund();
      break;
  }
  emit("refresh");
  globalStore.loading = false;
  emit("closeModal");
};

const handleEsc = (event) => {
  if (event.key === "Escape") {
    if (paymentsStore.formDeposits.step <= 0) {
      emit("closeModal");
    }
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleEsc);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEsc);
});
</script>

<template>
  <div class="step__footer">
    <div>
      <u-button
        size="s"
        v-if="![0, 1].includes(step)"
        type="outlined"
        :text="btn.back"
        :color="color"
        class="btnWidth"
        @click="goBack"
      />
    </div>

    <u-button
      size="s"
      v-if="!isFinalStep"
      :text="btn.next"
      :disabled="disabledNext"
      class="btnWidth"
      @click="goNext"
    />

    <u-button
      size="s"
      v-if="isFinalStep"
      :disabled="disabledCreate"
      :text="btn.save"
      class="btnWidth"
      @click="createDesposit"
    />
  </div>
</template>

<style scoped>
.step__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.btnWidth {
  min-width: 150px;
}
</style>
