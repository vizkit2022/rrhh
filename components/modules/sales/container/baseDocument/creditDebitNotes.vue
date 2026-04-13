<script setup>
import configTable from "@/utils/configTables/sale.json";
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import { formatNormalDate, capitalizeFirstLetter } from "@/utils/helpers";
import { useI18n } from "vue-i18n";

// TRANSLATIONS
const { t } = useI18n();
const module = "modules.sales";
const moduleSaleCreditDebitNote = "modules.sales.sale.tabs.tab3";

// STORES
const salesStore = useSalesStore();
const globalStore = useGlobalStore();

// ROUTE PARAMS
const { params } = useRoute();
const idSale = params && params.id ? params.id : null;

// CONSTANTS
const loadingTable = ref(false);
const search = ref("");
const resultsTemporal = ref([]);
// Consts modal create credit/debit note
const lockModal = ref(false);
const paddingModalUpdatedFile = ref("24px 24px");

//  objeto para manejar el estado de cada dropdown
const dropdownStates = ref({});

//buttons modal create credit/debit note
const arrayButtonsCreateCreditDebitNote = [
  {
    text: { es: "Notas de Debito", en: "Debit Notes" },
    icon: "new",
    filterCode: "debit",
  },
  {
    text: { es: "Notas de Credito", en: "Credit Notes" },
    icon: "minus",
    filterCode: "credit",
  },
];

//COMPUTED

const filteredSearch = computed(() => {
  if (search.value.trim() === "") {
    return salesStore?.sale?.notesCreditDebit;
  }
  return resultsTemporal.value;
});

const hasType = computed(() => ({
  credit: salesStore.typesDocuments.some((d) => d.code === "credit"),
  debit: salesStore.typesDocuments.some((d) => d.code === "debit"),
}));

// FUNCTIONS

// Funciones para el dropdown de opciones de crear nota de credito/debito
// recibir el índice
const toggleDropdown = (index) => {
  dropdownStates.value[index] = !dropdownStates.value[index];
};

const getFilteredTypesDocuments = (type) => {
  switch (type) {
    case "credit":
      return salesStore.typesDocuments
        .filter((doc) => doc.code === "credit")
        .map((doc) => {
          return {
            label: {
              es: capitalizeFirstLetter(doc.name),
              en: capitalizeFirstLetter(doc.name),
            },
            icon: "",
            fullData: doc,
          };
        });
    case "debit":
      return salesStore.typesDocuments
        .filter((doc) => doc.code === "debit")
        .map((doc) => {
          return {
            label: {
              es: capitalizeFirstLetter(doc.name),
              en: capitalizeFirstLetter(doc.name),
            },
            icon: "",
            fullData: doc,
          };
        });
    default:
      return [];
  }
};

const openModal = async (type) => {
  dropdownStates.value = {};

  globalStore.loading = true;
  const detail = await salesStore.getDetailSaleDocumentById(idSale, false);
  // Convertimos el objeto en un array
  salesStore.formCreditDebitNote.formRegister.salesDocument = [detail];
  salesStore.formCreditDebitNote.formRegister.salesDocument.forEach((b) => {
    b.selected = true;
    b.amountPaid = {
      value: "$0",
      number: 0,
      tempNumber: 0,
      tempValue: "$0",
    };
    b.shortDescription = "";
    b.longDescription = "";
  });

  globalStore.loading = false;

  switch (type?.code) {
    case "credit":
      salesStore.dialogCreateSales.showCredit = true;
      salesStore.formCreditDebitNote.typeDocument = type;
      break;
    case "debit":
      salesStore.dialogCreateSales.showDebit = true;
      salesStore.formCreditDebitNote.typeDocument = type;
      break;
    default:
      break;
  }
};

const hideModal = () => {
  if (!lockModal.value) {
    // Cerrar dialog detalles documento de venta
    salesStore.dialogSalesDocuments.showDetails = false;
    salesStore.dialogCreateSales.showCredit = false;
    salesStore.dialogCreateSales.showDebit = false;

    // Limpiar formularios de crear documentos de ventas y notas credito/debito
    salesStore.cleanFormDocInvoice();
    salesStore.cleanFormCreditDebitNote();

    // Limpiar detalle documento de venta
    salesStore.cleanDetailSaleDocument();
  }
};

// cambiar padding modal create credit/debit note
const updatePaddingModal = (padding) => {
  paddingModalUpdatedFile.value = padding;
};

// Functions helpers
const getColorTypeCode = (code) => {
  switch (code) {
    case "invoice":
      return {
        background: "--info-surface-light",
        color: "--info-text-darker",
      };
    case "debit":
      return {
        background: "--secondary-surface-light",
        color: "--secondary-surface-darker",
      };
    case "credit":
      return {
        background: "--warning-surface-light",
        color: "--warning-text-darker",
      };
  }
};

const getTextCode = (code) => {
  switch (code) {
    case "invoice":
      return {
        es: "DB",
        en: "DB",
      };
    case "debit":
      return {
        es: "ND",
        en: "DN",
      };
    case "credit":
      return {
        es: "NC",
        en: "CN",
      };
  }
};

const actionTable = (obj) => {
  const { emit, data, pos, event } = obj;

  const emits = {
    dialogDetailsCreditDebitNote: () => {
      salesStore.dialogSalesDocuments.showDetails = true;
      salesStore.detailsSaleDocument = {
        ...data,
        ...salesStore.detailsSaleDocument,
      };
      console.log(
        "salesStore.detailsSaleDocument creditDebit",
        salesStore.detailsSaleDocument,
      );
    },
  };

  emits[emit]();
};

const buildFiltersParams = () => {
  return {
    parent: search.value,
  };
};

const handleSearch = () => {
  if (search.value.trim() === "") {
    resultsTemporal.value = [];
    return;
  }

  searchLines();
};

const searchLines = () => {
  const text = search.value.trim().toLowerCase();

  resultsTemporal.value = salesStore?.sale?.notesCreditDebit.filter((note) => {
    const desc = note?.lines?.[0]?.description?.toLowerCase() || "";
    return desc.includes(text);
  });

  console.log("resultsTemporal.value", resultsTemporal.value);
};

// const handleSearch = debounce(async (e) => {
//   search.value = e.target.value;
//   await reloadCreditDebitNotes();
// }, 600);

const reloadCreditDebitNotes = async () => {
  loadingTable.value = true;
  const params = buildFiltersParams();
  await salesStore.getNotesCreditDebitBySalesDocumentId(idSale, params);
  loadingTable.value = false;
};

// CYCLE
onMounted(async () => {
  loadingTable.value = true;
  await reloadCreditDebitNotes();
  await salesStore.getTypeDocuments();
});
</script>

<template>
  <div class="container_creditDebitNotes">
    <div class="header_creditDebitNotes">
      <div class="actions_left">
        <u-input
          v-model="search"
          :placeholder="
            t(`${moduleSaleCreditDebitNote}.inputs.search.placeholder`)
          "
          style="width: 400px"
          @input="handleSearch($event)"
        />
        <!-- <u-button
          text="Filtros"
          icon="filter"
          :revers="true"
          type="outlined"
          color="--neutral-surface-default"
        /> -->
      </div>
      <div class="actions_right">
        <!-- CAMBIO: Pasar el index a las funciones -->
        <u-button-menu
          v-for="(button, index) in arrayButtonsCreateCreditDebitNote"
          :key="index"
          :text="button"
          :icon="button.icon"
          :options="getFilteredTypesDocuments(button.filterCode)"
          @selectedOption="(op) => openModal(op.fullData)"
          :disabled="!hasType[button.filterCode]"
        />
        <!-- <div class="group" v-for="(button, index) in arrayButtonsCreateCreditDebitNote" :key="index">
          <u-button
            class="group__button-primary"
            :text="button.text"
            :icon="button.icon"
            @click="toggleDropdown(index)"
          />
          <u-button-icon
            class="group__button-secondary"
            icon="chevron-down"
            @click="toggleDropdown(index)"
          />

          <div class="dropdown-menu" :class="{ open: dropdownStates[index] }">
            <u-button
              v-for="type in getFilteredTypesDocuments(button.filterCode)"
              :key="type._id"
              class="dropdown-menu__item truncateText"
              :text="type.name"
              type="outlined"
              :show-title-text="true"
              :title-text="type.name"
              :truncateText="true"
              :disabled="false"
              @click="openModal(type)"
            />
          </div>
        </div> -->
      </div>
    </div>
    <TableBasic
      @actionTable="actionTable"
      :content="filteredSearch"
      :configTable="configTable.creditDebitNotes"
      :loading="loadingTable"
    >
      <template #date="item">
        <span class="body-m-sb color_span">{{
          formatNormalDate(item?.item?.issueDate)
        }}</span>
      </template>

      <template #type="item">
        <u-tags
          style="margin: 0 auto"
          :text="item?.item?.salesDocumentType?.name || ''"
          size="xs"
          :delete="false"
          color="--neutral-text-caption"
          background="--neutral-surface-light"
        />
      </template>

      <template #documentNumber="item">
        <u-tags
          :title="`${
            item?.item?.salesDocumentType?.tag ||
            getTextCode(item?.item?.salesDocumentType?.code)?.[
              globalStore.lang
            ] ||
            '-'
          } - ${item?.item?.number ?? ''}`"
          :text="`${
            item?.item?.salesDocumentType?.tag ||
            getTextCode(item?.item?.salesDocumentType?.code)?.[
              globalStore.lang
            ] ||
            '-'
          } - ${item?.item?.number ?? ''}`"
          size="xs"
          :alignCenterText="true"
          :background="
            getColorTypeCode(item?.item?.salesDocumentType?.code)?.background
          "
          :color="getColorTypeCode(item?.item?.salesDocumentType?.code)?.color"
          maxWidth="140px"
          :delete="false"
          style="margin: 0 auto"
        />
      </template>

      <template #description="item">
        <span class="body-m-sb color_span">{{
          item?.item?.lines?.[0]?.description || ""
        }}</span>
      </template>

      <template #amount="item">
        <span class="flex__right body-m-sb color_span">{{
          item?.item?.numbers?.total?.value
        }}</span>
      </template>

      <template v-slot:noData>
        <div class="noCreditDebitNotes">
          <div class="msg">
            <img
              src="/img/banking-transactions/lupa.svg"
              alt="empy transactions"
            />
            <p class="body-m-sb">
              {{ t(`${moduleSaleCreditDebitNote}.table.noData`) }}
            </p>
          </div>
        </div>
      </template>
    </TableBasic>
  </div>

  <u-dialog
    :showModal="salesStore.dialogSalesDocuments.showDetails"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="false"
    position="right"
  >
    <SalesDialogDetailsSales @closeModal="hideModal" />
  </u-dialog>

  <u-dialog
    :show-modal="
      salesStore.dialogCreateSales.showCredit ||
      salesStore.dialogCreateSales.showDebit
    "
    width="auto"
    height="auto"
    :padding="paddingModalUpdatedFile"
    @closeModal="hideModal"
    :lock-modal="lockModal"
    :persistent="true"
  >
    <DialogCreateSalesDocNotesCreditDebit
      :skipSteps="[2]"
      @closeModal="hideModal"
      @updatePadding="updatePaddingModal"
      @reloadSales="reloadCreditDebitNotes"
    />
  </u-dialog>
</template>

<style scoped>
.container_creditDebitNotes {
  display: grid;
  grid-template-rows: 36px 1fr;
  gap: 16px;
  width: 100%;
  height: 100%;
}

.header_creditDebitNotes {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.actions_left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.actions_right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.group {
  display: inline-flex;
  position: relative;
  align-items: center;
}

.group__button-primary {
  justify-content: flex-start;
  width: 201px;
  border-radius: 12px 0 0 12px;
  padding-inline: 12px;
  white-space: nowrap;
  left: 1px;
}

.group__button-secondary {
  border-top-left-radius: inherit;
  border-bottom-left-radius: inherit;
}

.dropdown-menu {
  gap: 8px;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  position: absolute;
  background-color: var(--neutral-background-default);
  color: black;
  box-shadow: var(--shadow-3);
  z-index: 2;
  width: 100%;
  left: 0;
  top: 100%;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  transform-origin: top;
  transform: scaleY(0);
  opacity: 0;
  transition:
    transform 0.3s ease-in-out,
    opacity 0.3s ease-in-out;
  pointer-events: none;
}

.dropdown-menu.open {
  transform: scaleY(1);
  opacity: 1;
  pointer-events: auto;
}

.dropdown-menu__item {
  display: flex;
  flex-direction: row;
  justify-content: start;
  width: 100%;
  padding: 8px 16px;
}

/* Table Credit Debit Notes */

.flex__center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex__left {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: flex-start;
}

.flex__right {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: flex-end;
}

.color_span {
  color: var(--neutral-text-body);
}

.noCreditDebitNotes {
  display: flex;
  flex-direction: column;
  gap: 48px;
  align-items: center;
  width: 550px;
  height: auto;
}

.noCreditDebitNotes .msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  width: 550px;
  height: 166px;
}

.noCreditDebitNotes .msg img {
  width: 64px;
  height: 64px;
}

.noCreditDebitNotes .msg p {
  text-align: justify;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

.noCreditDebitNotes .actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
</style>
