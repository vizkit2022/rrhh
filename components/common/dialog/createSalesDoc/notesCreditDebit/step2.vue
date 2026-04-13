<script setup>
import useSalesStore from "@/stores/sales";
import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
import { formatNormalDate } from "@/utils/helpers";
import { debounce } from "@/utils/helpers";
import { useI18n } from "vue-i18n";

// Translations I18n
const { t } = useI18n();
const module = "modules.sales.createCreditDebitNote";

//STORE
const salesStore = useSalesStore();
const incomesStore = useIncomesStore();
const globalStore = useGlobalStore();

// EMITS
const emit = defineEmits(["closeModal", "changeStep"]);

//CONSTANTS
const searchSalesDocuments = ref("");
const loadingSalesDocuments = ref(false);

// COMPUTED
const hasSelected = computed(() =>
  salesStore.formCreditDebitNote.allSalesDocuments.some(
    (card) => card.selected,
  ),
);

const getTextBusiness = (card) => {
  return card?.lines.length > 1
    ? t(`${module}.step2.cardSalesDocument.hasMultipleBusiness`)
    : card?.lines[0]?.referenceIncome?.name;
};

const taxCodeTypeDocument = computed(() => {
  return salesStore?.formCreditDebitNote?.typeDocument?.taxCode ?? 0;
});

//FUNCTIONS

const filterSalesDocuments = debounce(async (e) => {
  loadingSalesDocuments.value = true;
  try {
    const value = e.target.value.trim();
    if (value) {
      salesStore.formCreditDebitNote.allSalesDocuments =
        await salesStore.getSalesDocuments(
          {
            type: "invoice",
            taxCode: taxCodeTypeDocument.value,
            reference: value,
          },
          false,
        );
    } else {
      salesStore.formCreditDebitNote.allSalesDocuments =
        await salesStore.getSalesDocuments(
          { type: "invoice", taxCode: taxCodeTypeDocument.value },
          false,
        );
    }

    const selectedSalesDocument =
      salesStore.formCreditDebitNote.formRegister.salesDocument || [];

    salesStore.formCreditDebitNote.allSalesDocuments.forEach((b) => {
      b.selected = selectedSalesDocument.some((sel) => sel._id === b._id);
      b.amountPaid = { value: "", number: 0, tempValue: null };
    });
  } catch (error) {
    console.error("Error en filterSalesDocuments:", error);
  } finally {
    loadingSalesDocuments.value = false;
  }
}, 600);

// acciones de las cards
const selectCard = () => {
  // filtro todos los que están seleccionados
  salesStore.formCreditDebitNote.formRegister.salesDocument =
    salesStore.formCreditDebitNote.allSalesDocuments.filter(
      (card) => card.selected,
    );

  // inicializo amountPaid
  salesStore.formCreditDebitNote.formRegister.salesDocument.forEach((b) => {
    ((b.amountPaid = {
      value: "$0",
      number: 0,
      tempNumber: 0,
      tempValue: "$0",
    }),
      (b.shortDescription = ""));
    b.longDescription = "";
  });
};

// Acciones para cambiar de step
const nextStep = () => {
  emit("changeStep", true);
};

const backStep = () => {
  emit("changeStep", false);
};

const closeStep = () => {
  salesStore.cleanFormDocInvoice();
  emit("closeModal");
};

const handleEscape = (event) => {
  if (event.key === "Escape") {
    closeStep();
  }
};

onMounted(async () => {
  // window.addEventListener("keydown", handleEscape);

  // obtener negocios con endpoint de buscar negocios por nombre
  try {
    loadingSalesDocuments.value = true;
    const resp = await salesStore.getSalesDocuments(
      { type: "invoice", taxCode: taxCodeTypeDocument.value },
      false,
    );
    salesStore.formCreditDebitNote.allSalesDocuments = resp;
  } catch (error) {
    console.error("Error en getSalesDocuments:", error);
  } finally {
    loadingSalesDocuments.value = false;
  }

  // obtener negocios seleccionados (local)
  const selectedFromStore =
    salesStore.formCreditDebitNote?.formRegister?.salesDocument || [];

  salesStore.formCreditDebitNote.allSalesDocuments.forEach((card) => {
    if (selectedFromStore.some((b) => b.id === card.id)) {
      card.selected = true;
    }
  });

  selectCard();
});

onBeforeUnmount(() => {
  // window.removeEventListener("keydown", handleEscape);
});
</script>

<template>
  <div class="container">
    <div class="header">
      <!-- <span class="body-l-sb textTitleColor">{{ `Crear ${salesStore?.formDocInvoice?.typeDocument?.code} - Seleccionar Negocios` }}</span> -->
      <span class="body-l-sb textTitleColor">{{
        t(`${module}.step2.titleHeader`, {
          typeDoc: salesStore?.formCreditDebitNote?.typeDocument?.name,
        })
      }}</span>
      <u-button-icon
        @click="closeStep"
        icon="u u-close"
        type="outlined"
        color="--neutral-text-caption"
        style="border-radius: 50%"
      />
    </div>

    <div class="body">
      <div class="container-search">
        <!-- <span class="body-s-sb">{{ t(`${module}.step2.inputs.business.label`) }}</span> -->
        <u-input
          v-model="searchSalesDocuments"
          :placeholder="t(`${module}.step2.inputs.salesDocuments.placeholder`)"
          icon="search"
          :revers="true"
          @input="filterSalesDocuments"
        />
      </div>

      <div class="container-business">
        <div v-if="loadingSalesDocuments" class="loader-container">
          <u-loading size="l" />
        </div>

        <span
          v-else-if="
            salesStore?.formCreditDebitNote?.allSalesDocuments?.length === 0
          "
          class="body-m-r noData"
          >{{ t(`${module}.step2.cardSalesDocument.noData`) }}</span
        >

        <div
          v-else
          v-for="card in salesStore?.formCreditDebitNote?.allSalesDocuments"
          :key="card?.id"
          class="cardClient"
        >
          <div class="cardHeader">
            <span
              :title="`${card.salesDocumentType?.name || 'Documento'} N°${
                card.number
              }`"
              class="body-xs-r"
            >
              {{
                `${card.salesDocumentType?.name || "Documento"} N°${
                  card.number
                }`
              }}
            </span>
          </div>

          <div class="cardBody">
            <u-checkbox
              v-model="card.selected"
              :height="20"
              :disabled="hasSelected && !card.selected"
              @update:modelValue="selectCard"
            />
            <img
              :src="card?.client?.imgUrl"
              :alt="card?.client?.data?.legalName"
              width="48"
              height="48"
            />
            <div class="cardInfo">
              <span class="truncateText body-m-sb" :title="card?.reference">
                {{ card?.reference }}
              </span>
              <span
                class="truncateText body-s-r"
                :title="getTextBusiness(card)"
              >
                {{ getTextBusiness(card) }}
              </span>
            </div>
            <div class="cardTotals">
              <span class="truncateText body-m-sb">
                {{
                  card?.numbers?.totalPostCreditAndDebit?.value ||
                  card?.numbers?.total?.value
                }}
              </span>
              <span class="truncateText body-s-sb">
                {{ formatNormalDate(card?.issueDate) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <u-button
        @click="backStep"
        :text="t(`${module}.buttons.back`)"
        type="outlined"
      />
      <u-button
        :disabled="
          salesStore?.formCreditDebitNote?.formRegister?.salesDocument
            ?.length === 0
        "
        @click="nextStep"
        :text="t(`${module}.buttons.next`)"
      />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 24px;
  height: 80vh;
  width: 80vw;
  max-height: 752px;
  max-width: 719px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.textTitleColor {
  color: var(--neutral-text-body);
}

.body {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 24px;
  min-height: 0;
}

.container-search {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.container-search span {
  color: var(--neutral-text-body);
}

.container-business {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}

.container-business::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.container-business::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-darker);
  border-radius: 5px;
}

.loader-container {
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}

.noData {
  display: flex;
  height: 100%;
  width: 100%;
  margin-top: 30px;
  justify-content: center;
  color: var(--neutral-text-caption);
}

.cardClient {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--neutral-border-light);
  border-radius: 8px;
  padding: 12px 24px;
  gap: 8px;
}

.cardHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--neutral-text-caption);
}

.cardBody {
  display: grid;
  grid-template-columns: 24px 48px 1fr 120px;
  align-items: center;
  gap: 12px;
}

.cardBody img {
  border-radius: 50%;
}

.cardInfo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.cardInfo span:first-child {
  color: var(--primary-text-default);
}

.cardInfo span:last-child {
  color: var(--neutral-text-body);
}

.cardTotals {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.cardTotals span:first-child {
  color: var(--neutral-text-body);
}

.cardTotals span:last-child {
  color: var(--neutral-text-caption);
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
