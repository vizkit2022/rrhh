<script setup>
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import usePaymentsStore from "@/stores/payments";
import { ref, onMounted, computed, defineEmits } from "vue";
import { capitalizeName } from "@/utils/helpers";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();
const paymentsStore = usePaymentsStore();

// Constants
const color = "--neutral-text-caption";
const colorDelete = "--danger-text-default";
const colorDeleteHover = "--danger-text-darker";
const colorSecond = "--secondary-text-default";
const colorSecondHover = "--secondary-text-darker";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.sections.purchases";
const modalDelete = "modules.outcomes.pages.oc.sections.purchases.modal.delete";
const search = ref("");
const lines = ref([]);
const taxes = ref({});
const availableTaxes = ref([]);
const { params } = useRoute();
const idOC = params && params.id ? params.id : null;
const alertData = ref({
  msg: "",
  translate: module + ".alert",
  buttons: [
    {
      type: "warning",
      text: "",
      icon: "change",
      action: "updated",
      prop: "updated",
    },
  ],
  type: "warning",
  close: true,
  show: false,
});
const config = computed(() => ({
  width: globalStore.sliderExpand
    ? "calc(100vw - 320px)"
    : "calc(100vw - 160px)",
  modal: true,
  maxHeight: "calc(85vh - 364px)",
  columns: {
    checkbox: true,
    code: true,
    name: true,
    origin: true,
    quantity: true,
    days: true,
    ot: true,
    price: true,
    total: true,
    totalAction: true,
    documented: true,
    documentedAction: true,
    toDocument: false,
    toDocumentAction: false,
    delete: false,
  },
}));
const blockAlert = ref(false);
const others = ref(
  JSON.parse(JSON.stringify(outcomesStore.outcome.currency.others)),
);
const loadingERX = ref(false);

// Emits
const emit = defineEmits(["updateMetrics"]);

// Mounted
onMounted(async () => {
  // Calcular la posicion del exchangeRate
  document.addEventListener("click", handleClickOutside);

  globalStore.loading = true;
  await getLinesByOutcomes();
  globalStore.loading = false;
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".exchangeRate");
  const btn = document.querySelector(".buttonOC_step3");
  if (
    dropdown &&
    btn &&
    !dropdown.contains(event.target) &&
    !btn.contains(event.target)
  ) {
    showMenuERX.value = false;
  }
};

// Functions
const filterLines = (event) => {
  const value = event.target.value.toLowerCase().replace(/\s+/g, " ");
  search.value = capitalizeName(value);
  if (value === "")
    lines.value = JSON.parse(JSON.stringify(outcomesStore.lines));
  else
    lines.value = outcomesStore.lines.filter((line) =>
      line.name.trim().toLowerCase().includes(value),
    );
};
const refreshData = () => {
  alertData.value = { ...alertData.value, show: true };
};
const actionAlert = async (action) => {
  if (action === "close") {
    alertData.value = { ...alertData.value, show: false };
  }
  if (action === "updated") {
    try {
      globalStore.loading = true;
      blockAlert.value = true;

      await getLinesByOutcomes();
    } catch (error) {
      console.error(error);
    } finally {
      alertData.value = { ...alertData.value, show: false };

      // Actualizar Compras
      const total = outcomesStore.outcome.numbers.total.value;
      updateMetrics(total, "purchases");

      // Actualizar Documentos
      const total2 = outcomesStore?.outcome?.numbers?.documented?.value ?? "";
      updateMetrics(total2, "documents");

      setTimeout(() => {
        globalStore.loading = false;
        blockAlert.value = false;
      }, 0);
    }
  }
};

const getLinesByOutcomes = async () => {
  await outcomesStore.getLinesOutcome(idOC);
  lines.value = JSON.parse(JSON.stringify(outcomesStore?.lines));
  taxes.value = JSON.parse(
    JSON.stringify(outcomesStore?.outcome?.numbers || {}),
  );
  availableTaxes.value = JSON.parse(
    JSON.stringify(outcomesStore?.outcome?.documentType?.taxes || []),
  );
};

// Computed
const isLinesSelected = computed(() => lines.value.some((line) => line.select));
const noPay = computed(() => {
  return (
    outcomesStore.outcome !== "inProcess" &&
    outcomesStore.outcome.numbers.paid.number ===
      outcomesStore.outcome.numbers.total.number
  );
});

// Eliminar Lineas
const deleteLinesModal = ref(false);
const deleteLines = async () => {
  const itemsToDelete = lines.value
    .filter((item) => item.select)
    .map((item) => ({
      _id: item._id,
      referenceLine: item.referenceLine,
      income: { ...item.income },
    }));

  const body = {
    outcome: { _id: outcomesStore.outcome._id },
    outcomeLines: itemsToDelete,
  };

  try {
    globalStore.loading = true;
    const resp = await outcomesStore.deleteLineOutcomeMany(body);
    if (resp.success) {
      await getLinesByOutcomes();
      const total = outcomesStore.outcome.numbers.total.value;
      updateMetrics(total, "purchases");
      await getLinesByOutcomes();
    }
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
  }
};
const openModalDeleteLines = () => {
  if (isLinesSelected.value) {
    deleteLinesModal.value = true;
  }
};

// Modales
const dimensions = ref({
  width: "auto",
  height: "auto",
});
const lockModal = ref(false);
const hideModal = () => {
  if (!lockModal.value) {
    goToPayModal.value = false;
    documentingModal.value = false;
    addLinesModal.value = false;

    dimensions.value = {
      width: "auto",
      height: "auto",
    };

    lockModal.value = false;
  }
};
const updateDimensions = (newDimensions) => {
  dimensions.value = newDimensions;
};

// A pagar
const goToPayModal = ref(false);
const openPayModal = () => {
  const linesToPay = [outcomesStore.outcome];
  outcomesStore.duePurchases = JSON.parse(JSON.stringify(linesToPay));
  paymentsStore.formGoToPay.lines = JSON.parse(
    JSON.stringify([outcomesStore?.outcome] || []),
  );
  paymentsStore.formGoToPay.currency =
    outcomesStore?.outcome?.currency?.default || {};
  paymentsStore.formGoToPay.lines.forEach((item) => {
    item.numbers.percentage = "0";
    item.numbers.amountPaid = formatData(0, paymentsStore.formGoToPay.currency);
  });
  paymentsStore.formGoToPay.supplier = JSON.parse(
    JSON.stringify(outcomesStore?.outcome?.supplier || {}),
  );
  goToPayModal.value = true;
};
const formatData = (number, currency) => {
  const { precision, typeFormat } = currency;
  const numberAprox = convertToNumber(number, typeFormat, precision);
  return {
    number,
    value: formatCurrency(numberAprox, currency, true),
    numberAprox,
  };
};
const getBankMovementsByOutcomes = async () => {
  await outcomesStore.get_outcomes(idOC);
  const total = outcomesStore?.outcome?.numbers?.paid?.value ?? "";
  updateMetrics(total, "bankMovements");
  globalStore.loading = false;
};
const updateSection = async () => {
  await getBankMovementsByOutcomes();
};

// Documentar
const documentingModal = ref(false);
const documenting = () => {
  dimensions.value = {
    width: "800px",
    height: "auto",
  };
  outcomesStore.formDocumenting.supplier = JSON.parse(
    JSON.stringify(outcomesStore.outcome.supplier),
  );
  outcomesStore.formDocumenting.lines = JSON.parse(
    JSON.stringify(lines.value.filter((line) => line.select)),
  );
  documentingModal.value = true;
};

const updateMetrics = (total, section) => {
  emit("updateMetrics", { total, section });
};

// Agregar Lineas
const addLinesModal = ref(false);
const addLines = () => {
  addLinesModal.value = true;
  dimensions.value = {
    width: "780px",
    height: "auto",
  };
};
const updatedTable = async (updatedPO = false) => {
  globalStore.loading = true;
  await getLinesByOutcomes();
  if (updatedPO) {
    await outcomesStore.get_outcomes(idOC);
  }
  addLinesModal.value = false;
  documentingModal.value = false;
  globalStore.loading = false;
};
const updateMetricsDocs = (obj) => {
  emit("updateMetrics", obj);
};

const showMenuERX = ref(false);

const saveValueManual = async (e) => {
  const value = e.target.value;
  const body = {
    _id: outcomesStore.outcome._id,
    currency: {
      others: others.value.map((o) => ({
        valueToday: o.valueToday,
        valueManual: value === "" ? 0 : o.valueManual,
        currency: o.currency._id,
      })),
    },
  };
  try {
    loadingERX.value = true;
    const resp = await outcomesStore.updateOutcomeEXR(body);
    if (resp.success) {
      outcomesStore.outcome = resp.data;
      others.value = JSON.parse(
        JSON.stringify(outcomesStore.outcome.currency.others),
      );
    }
  } catch (e) {
    console.error(e);
  } finally {
    loadingERX.value = false;
  }
};

const usedIds = computed(() => {
  const idsTaxes = new Set();
  lines.value.forEach((line) => {
    line.taxes.forEach((tax) => {
      idsTaxes.add(tax);
    });
  });
  return Array.from(idsTaxes);
});

const noActions = computed(
  () => !["closed", "voided"].includes(outcomesStore.outcome.status),
);
</script>

<template>
  <div class="purchases">
    <div class="purchases__filters" id="headerOC_step3">
      <div class="purchases__filter-separator">
        <u-input
          v-model="search"
          size="s"
          icon="search"
          :disabled="false"
          :revers="true"
          class="search"
          :placeholder="t(module + '.inputs.search.placeholder')"
          @input="filterLines($event)"
        />
        <u-button
          :text="
            loadingERX
              ? t('modules.outcomes.pages.oc.header.buttons.exchange.updating')
              : t('modules.outcomes.pages.oc.header.buttons.exchange.label')
          "
          icon="edit"
          type="outlined"
          :color="colorSecond"
          :colorHover="colorSecondHover"
          :colorActive="colorSecondHover"
          class="buttonOC_step3"
          v-if="noActions"
          id="buttonOC_step3"
          @click="showMenuERX = !showMenuERX"
          size="s"
        />
        <div class="exchangeRate">
          <div class="exhangeRate__list">
            <div
              class="exchangeRate__op"
              v-for="currency in others"
              :key="currency._id"
            >
              <div class="tag">
                <span>{{ currency?.currency?.code || "-" }}</span>
              </div>
              <span class="label">{{
                currency?.currency?.name?.[globalStore.lang] || "-"
              }}</span>
              <input
                v-model="currency.valueManual"
                type="number"
                @change="saveValueManual"
                @focus="$event.target.select()"
                :class="{ disabled: loadingERX }"
                :disabled="loadingERX"
              />
            </div>
            <span
              v-if="outcomesStore.outcome.currency.others.length === 0"
              class="noData"
              >sin info</span
            >
          </div>
        </div>
      </div>
      <div class="purchases__filter-separator">
        <u-button-icon
          icon="delete"
          type="outlined"
          size="s"
          :color="colorDelete"
          :colorHover="colorDeleteHover"
          :colorActive="colorDeleteHover"
          v-if="noActions"
          :disabled="
            outcomesStore.outcome.status === 'voided' || !isLinesSelected
          "
          @click="openModalDeleteLines"
        />
        <u-button
          :text="t(module + '.buttons.pay')"
          icon="pay"
          type="outlined"
          size="s"
          v-if="noActions"
          :disabled="noPay"
          @click="openPayModal"
        />
        <u-button
          :text="t(module + '.buttons.newDocument')"
          icon="new"
          type="outlined"
          size="s"
          :color="color"
          v-if="noActions"
          @click="documenting"
          :disabled="
            outcomesStore.outcome.status === 'voided' || !isLinesSelected
          "
        />
        <u-button
          v-if="noActions"
          :text="t(module + '.buttons.newLine')"
          icon="new"
          size="s"
          @click="addLines"
          :disabled="outcomesStore.outcome.status === 'voided'"
        />
      </div>
    </div>
    <u-alert
      v-if="!blockAlert"
      :data="alertData"
      class="alertCustom"
      @actionAlert="actionAlert"
    />
    <OutcomesTablesGrid
      :lines="lines"
      :taxes="taxes"
      :availableTaxes="availableTaxes"
      @refreshData="refreshData"
      :currency="outcomesStore?.outcome?.currency?.default"
      :disabled="!noActions"
      @updateMetrics="(total) => updateMetrics(total, 'purchases')"
      :compare="true"
      :config="config"
      :read-only="outcomesStore.outcome.status === 'voided'"
      :view="'purcharse'"
    />
    <OutcomesTablesTaxes
      :taxes="taxes"
      :usedIds="usedIds"
      @refreshData="actionAlert('updated')"
      :btnMatch="outcomesStore.outcome.type === 'FXR'"
      :match="true"
      :filterTaxes="true"
    />
  </div>
  <!-- Modales -->
  <!-- Eliminar lineas -->
  <dialog-confirm
    width="600px"
    height="auto"
    :title="t(modalDelete + '.title')"
    :description="
      t(modalDelete + '.description', {
        confirmText: t(modalDelete + '.confirmText'),
      })
    "
    :showInput="true"
    :confirmationText="t(modalDelete + '.confirmText')"
    :customTextBtnDelete="t(modalDelete + '.confirmText')"
    :actionModal="deleteLines"
    :showModal="deleteLinesModal"
    @closeModal="deleteLinesModal = false"
  />
  <!-- Agregar lineas -->
  <u-dialog
    :showModal="addLinesModal"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
  >
    <DialogAddLinesPO
      @closeModal="hideModal"
      @updatedTable="updatedTable"
      @updateMetrics="(total) => updateMetrics(total, 'purchases')"
    />
  </u-dialog>
  <!-- Pagar -->
  <u-dialog
    :showModal="goToPayModal"
    :lockModal="lockModal"
    @closeModal="hideModal"
    :width="dimensions.width"
    :height="dimensions.height"
    :persistent="true"
  >
    <DialogGoToPay
      @closeModal="hideModal"
      :init-tab="2"
      page="oc"
      @updateSection="updateSection"
    />
  </u-dialog>
  <!-- Documentar -->
  <u-dialog
    :showModal="documentingModal"
    :lockModal="lockModal"
    @closeModal="hideModal"
    :width="dimensions.width"
    :height="dimensions.height"
    :persistent="true"
  >
    <DialogDocumenting
      :withSelectedLines="true"
      @closeModal="hideModal"
      @updateDimensions="updateDimensions"
      @updatedTable="updatedTable"
      @updateMetrics="updateMetricsDocs"
    />
  </u-dialog>
</template>

<style scoped>
.purchases {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.purchases__filters {
  width: 100%;
  height: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.purchases__filter-separator {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}
.search {
  width: 320px;
}
.alertCustom {
  position: absolute;
  top: -15px;
  z-index: v-bind("alertData.show ? 2 : -10");
  transform: scale(0.8);
}

/* Exchange Rate */
.exchangeRate {
  width: 320px;
  height: auto;
  position: absolute;
  background-color: var(--neutral-background-default);
  border-radius: 12px;
  box-shadow: var(--elevation-l);
  top: 32px;
  left: 330px;
  padding: 16px;
  transform-origin: top left;
  transform: scale(v-bind("showMenuERX ? 1 : 0"));
  transition: 0.3s;
  z-index: 2;
}
.exhangeRate__list {
  display: grid;
  row-gap: 12px;
  overflow: auto;
  width: 288px;
  max-height: 170px;
  padding-right: 2px;
}
.exhangeRate__list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.exhangeRate__list::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-subtle);
  border-radius: 5px;
}
.exhangeRate__list::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 5px;
}
.exchangeRate__op {
  display: grid;
  grid-template-columns: auto 1fr 100px;
  gap: 12px;
  align-items: center;
}
.exchangeRate__op div.tag {
  height: 24px;
  border: 1px solid var(--secondary-border-subtle);
  border-radius: 8px;
  background-color: var(--secondary-surface-softer);
  display: flex;
  align-items: center;
  padding: 0 4px;
}
.exchangeRate__op div.tag span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--secondary-text-darker);
}
.exchangeRate__op span.label {
  font-weight: 600;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.exchangeRate__op input {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  transition: 0.3s;
  font-weight: 400;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
  text-align: end;
  padding: 0 8px;
}
.exchangeRate__op input.disabled {
  cursor: not-allowed;
  border: 1px solid var(--neutral-border-disabled);
  color: var(--neutral-text-disabled);
  box-shadow: inset transparent 0px 0px 0px 1px;
}
.exchangeRate__op input:hover {
  border: 1px solid var(--primary-border-subtle);
}
.exchangeRate__op input[type="number"]::-webkit-inner-spin-button,
.exchangeRate__op input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.exchangeRate__op input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}
.noData {
  color: var(--neutral-text-caption) !important;
  height: 40px;
  font-size: 14px !important;
  line-height: 14px !important;
  width: 100%;
  text-align: center !important;
  padding-top: 18px;
}
</style>
