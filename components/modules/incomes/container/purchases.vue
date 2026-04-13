<script setup>
import { ref } from "vue";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import useOutcomesStore from "@/stores/outcomes";
import usePaymentsStore from "@/stores/payments";
import usePermissionsStore from "@/stores/permissions";
import {
  capitalizeName,
  debounce,
  getNameStatus,
  getColorStatus,
} from "@/utils/helpers";
import configTable from "@/utils/configTables/outcomes.json";

// Stores
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const outcomesStore = useOutcomesStore();
const paymentsStore = usePaymentsStore();
const permissionsStore = usePermissionsStore();

// Metadatos
useHead({
  title: "Purchases",
});
definePageMeta({
  name: "purchase",
  layout: "default",
  middleware: ["auth"],
});

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
const module = "modules.outcomes.pages.outcome";
const buttons = "modules.outcomes.pages.outcome.buttons";
const router = useRouter();

// Variables
const lockModal = ref(false);
const dimensions = ref({
  width: "780px",
  height: "85vh",
});
const modalDelete = ref(false);
const goToPayModal = ref(false);
const { params } = useRoute();
const idIncome = params?.income ?? null;
const colorDanger = "--danger-text-default";
const colorDangerHover = "--danger-text-darker";

const hasSelectedLines = computed(() => {
  // Si el usuario tiene permiso de anular compra
  if (permissionsStore?.myPermissions?.outcomes_voidPurcharse) {
    // Obtenemos los compras seleccionadas
    const selectedOutcomes =
      outcomesStore.outcomes?.filter((outcome) => outcome.selected) || [];

    // Verificamos si no hay compras seleccionadas
    if (selectedOutcomes.length === 0) return false;

    // Verificamos si TODOS los documentos tienen 0 en numbers documented y paid
    const allZero = selectedOutcomes.every(
      (outcome) =>
        outcome.numbers.documented.numberAprox === 0 &&
        outcome.numbers.paid.numberAprox === 0,
    );

    return allZero; // retorna true si TODOS los documentos tienen 0
  } else {
    return false; // No tiene permiso
  }
});
const tileDeleteModal = computed(() => {
  const textLength =
    hasSelectedLines.length === 1 ? ".title_singular" : ".title_plural";
  return t(module + ".tabs.tab1.modals.cancel" + textLength);
});
const descriptionDeleteModal = computed(() => {
  return t(module + ".tabs.tab1.modals.cancel.description");
});
const confirmationDeleteModal = computed(() => {
  return t(module + ".tabs.tab1.modals.cancel.confirmationText");
});
const btnDeleteModal = computed(() => {
  return t(module + ".tabs.tab1.modals.cancel.customTextBtnDelete");
});
const successfulPayment = computed(() => {
  const selectedOC = outcomesStore.outcomes.filter((item) => item.selected);

  if (selectedOC.length === 0) return false;

  const { payBy, supplier } = selectedOC[0];
  const supplierId = supplier?.contact?._id;

  return selectedOC.every(
    (item) =>
      item.payBy === payBy && item.supplier?.contact?._id === supplierId,
  );
});
const errorMsgCancel = computed(() =>
  t("modules.outcomes.pages.outcome.tabs.tab1.modals.cancel.error"),
);

// Functions
const refresh = async () => {
  globalStore.loading = true; // Iniciar el estado de carga
  loadingTable.value = true;
  try {
    // Ejecutar todas las promesas en paralelo
    await Promise.all(
      [
        outcomesStore.getAllOutcomes({ income: idIncome }),
        outcomesStore.getMetricsOutcomes("projects", idIncome),
        organizationStore.getDocs(),
      ].filter(Boolean),
    ); // Filtra los valores nulos para asegurar que solo se incluyan las promesas válidas
  } catch (error) {
    console.error("Error during data fetching:", error);
  } finally {
    globalStore.loading = false;
    loadingTable.value = false;
  }
};
const goToPage = (item, id = null) => {
  const newPath = `/outcomes/${id || item._id}`;
  router.replace(newPath);
};
const hasMultipleDocumentTypes = (documents) => {
  if (!documents || !documents.length) return false;
  const types = documents.map((doc) => doc.documentType?.name).filter(Boolean);
  const uniqueTypes = [...new Set(types)];
  return uniqueTypes.length > 1;
};
const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0]?.toUpperCase())
    .join("");
};
const actionTable = (obj) => {
  const { emit, data, pos } = obj;
  const emits = {
    delete: () => {
      console.log("Eliminar");
    },
    edit: () => {
      console.log("Editar");
    },
    new: () => {
      console.log("Nuevo");
    },
    show: () => {
      console.log("Mostrar");
    },
    deleteGlobal: () => {
      console.log("Eliminar Global");
    },
    newGlobal: () => {
      console.log("Nuevo Global");
    },
    showModalDocument: () => {
      openModalViewDocument(data._id);
    },
  };
  emits[emit]();
};
const hideModal = () => {
  if (!lockModal.value) {
    goToPayModal.value = false;
    dimensions.value = {
      width: "780px",
      height: "85vh",
    };
    lockModal.value = false;
  }
};
const deleteSelectedItems = async () => {
  try {
    globalStore.loading = true;
    let body = { outcomes: [] };
    const selectedItems = outcomesStore.outcomes.filter(
      (item) => item.selected,
    );
    const selectedIds = selectedItems.map((item) => item._id);
    body.outcomes = selectedIds;

    const { success, data, error } = await outcomesStore.archiveOutcome(body);
    if (success) {
      outcomesStore.outcomes = outcomesStore.outcomes.filter(
        (item) => !item.selected,
      );
      outcomesStore.getMetricsOutcomes("projects", idIncome);
    }
  } catch (error) {
    console.log(error);
    toast.error(errorMsgCancel.value, { autoClose: 3000 });
  } finally {
    globalStore.loading = false;
  }
};
const deletePurchases = () => {
  if (hasSelectedLines.value) {
    modalDelete.value = true;
  }
};
const openPayModal = async () => {
  const linesToPay = outcomesStore?.outcomes?.filter((item) => item.selected);
  outcomesStore.duePurchases = JSON.parse(JSON.stringify(linesToPay));
  paymentsStore.formGoToPay.currency =
    paymentsStore?.formGoToPay?.lines?.[0]?.currency?.default || {};
  const ids = outcomesStore.duePurchases.map((item) => item._id);

  try {
    globalStore.loading = true;
    const resp = await outcomesStore.addLineToPay(ids);
    if (resp.length) {
      const ids = new Set();

      paymentsStore.formGoToPay.lines = resp.map((item) => {
        ids.add(item.supplier?.contact?._id);
        return {
          ...item,
          numbers: {
            ...item.numbers,
            percentage: "0",
            amountPaid: formatData(0, paymentsStore.formGoToPay.currency),
          },
        };
      });

      paymentsStore.formGoToPay.multiSupplier = ids.size > 1;
    }
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    goToPayModal.value = true;
  }
  if (false) {
  }
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
const updateDimensionsNew = (newDimensions) => {
  dimensions.value = newDimensions;
};

// Mounted lifecycle hook
onActivated(async () => {
  await refresh();
});

const getColorTypeCode = (code) => {
  switch (code) {
    case "OC":
      return {
        background: "--info-surface-shadow-12a",
        color: "--info-text-darker",
      };
    case "FXR":
      return {
        background: "--warning-surface-shadow-12a",
        color: "--warning-text-darker",
      };
  }
};


// Buscador
const search = ref("");
const loadingTable = ref(false);
const searchTimeout = ref(null);
const lastSearch = ref("");
const searchPurchases = async (e) => {
  const val = e.target.value.trim();

  // Cancelar timeout anterior
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // Si el valor no cambió, no buscar
  if (val === lastSearch.value) return;

  // Nuevo timeout de espera (ej: 300 ms tras dejar de tipear)
  searchTimeout.value = setTimeout(async () => {
    lastSearch.value = val;

    if (val === "") {
      try {
        loadingTable.value = true;
        outcomesStore.outcomes = [];
        await outcomesStore.getAllOutcomes({ income: idIncome });
      } catch (error) {
        console.error(error);
      } finally {
        loadingTable.value = false;
        return;
      }
    }

    try {
      loadingTable.value = true;
      outcomesStore.outcomes = [];
      await outcomesStore.getAllOutcomes({ income: idIncome, lineName: val });
    } catch (error) {
      console.error(error);
    } finally {
      loadingTable.value = false;
    }
  }, 600);
};

</script>

<template>
  <div class="page">
    <div class="page__filters">
      <u-input
        v-model="search"
        :placeholder="t(module + '.inputs.search.placeholder')"
        icon="search"
        :revers="true"
        @input="searchPurchases($event)"
      />
      <div></div>
      <u-button
        :text="t(buttons + '.canceled')"
        type="outlined"
        size="s"
        icon="close"
        :color="colorDanger"
        :colorHover="colorDangerHover"
        @click="deletePurchases"
        :disabled="!hasSelectedLines"
      />
      <u-button
        :text="t(buttons + '.toPay')"
        type="outlined"
        size="s"
        icon="invoice"
        :color="color"
        @click="openPayModal"
        :disabled="!successfulPayment"
      />
      <u-button-icon size="s" type="outlined" icon="more" :color="color" />
    </div>
    <TableCollapse
      :config="configTable.purchases"
      :content="outcomesStore.outcomes"
      @actionTable="actionTable"
      :loading="loadingTable"
    >
      <template v-slot:type="item">
        <div class="type">
        <u-tags
        :title="`${
          item?.item?.tagManagementDoc ||
          item?.item?.type ||
          '-'
        } - ${item?.item?.idNumber}`"
        :text="`${
          item?.item?.tagManagementDoc ||
          item?.item?.type ||
          '-'
        } -  ${item?.item?.idNumber}`"
        size="xs"
        :alignCenterText="true"
        :background="
          getColorTypeCode(item?.item?.type).background
        "
        :color="getColorTypeCode(item?.item?.type).color"
        maxWidth="80px"
        :delete="false"
        :cursor-pointer="true"
        @click="goToPage(item?.item)"
      />
      </div>
      </template>
      <template v-slot:docs="item">
        <div class="docs">
        <u-tags 
        v-if="item?.item?.documents?.length"
        :title="`${
          hasMultipleDocumentTypes(item.item.documents)
            ? t(module + '.tabs.tab1.docs')
            : getInitials(item.item.documents?.[0]?.documentType?.name) || '-'
        } (${item?.item?.documents?.length})`"
        :text="`${
          hasMultipleDocumentTypes(item.item.documents)
            ? t(module + '.tabs.tab1.docs')
            : getInitials(item.item.documents?.[0]?.documentType?.name) || '-'  
        } (${item?.item?.documents?.length})`"
        size="xs"
        :alignCenterText="true"
        background="--neutral-surface-shadow-12a"
        color="--neutral-text-caption"
        maxWidth="80px"
        :delete="false"
        :cursor-pointer="true"
        @click="goToPage(item?.item)"
      />
      <span v-else class="number">-</span>
      </div>
      </template>
      <template v-slot:origin="item">
        <div class="origin">
          <template v-if="item?.item?.income?.length === 1">
            <a
              :href="`/incomesv2/project/${item.item.income[0]?.project?._id}/income/${item.item.income[0]?._id}`"
              v-if="item.item.income[0]?.name"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span
                class="truncateText"
                v-text="capitalizeName(item.item.income[0]?.name)"
              ></span>
            </a>
            <a
              :href="`/incomes/project/${item?.item?.income[0]?.project?._id}`"
              v-if="item.item.income[0].project?.name"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="u u-open"></span>
              <span
                class="truncateText"
                v-text="capitalizeName(item.item.income[0]?.project?.name)"
              ></span>
            </a>
          </template>
          <span v-else v-text="t(module + '.tabs.tab1.docs')"></span>
        </div>
      </template>
      <template v-slot:status="item">
        <div class="status">
          <u-tags
            :title="
              item?.item?.status
                ? t(module + '.tabs.tab1.status.' + item.item.status)
                : '-'
            "
            :text="
              item?.item?.status
                ? t(module + '.tabs.tab1.status.' + item.item.status)
                : '-'
            "
            size="xs"
            :background="getColorStatus(item?.item?.status).background"
            :color="getColorStatus(item?.item?.status).color"
            :delete="false"
            maxWidth="90px"
            style="margin: 0 auto"
          />
      </div>
      </template>
      <template v-slot:paid="item">
        <div class="paidC">
          <span
            v-text="item?.item?.numbers?.unpaid?.value"
            :class="
              item?.item?.numbers?.unpaid?.numberAprox === 0 ? 'completed' : ''
            "
          ></span>
        </div>
      </template>
    </TableCollapse>
    <u-indicators-lite
      style="margin-top: auto; min-height: 60px"
      :indicators="outcomesStore.metrics"
    />
  </div>

  <!-- Modales -->
  <!-- Anular -->
  <dialog-cancel
    width="600px"
    height="auto"
    :title="tileDeleteModal"
    :description="descriptionDeleteModal"
    :confirmationText="confirmationDeleteModal"
    :customTextBtnDelete="btnDeleteModal"
    :showInput="true"
    :actionModal="deleteSelectedItems"
    :showModal="modalDelete"
    @closeModal="modalDelete = false"
  />

  <!-- Pagar -->
  <u-dialog
    :showModal="goToPayModal"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <DialogGoToPay
      @closeModal="hideModal"
      @updateDimensions="updateDimensionsNew"
      @updateSection="refresh"
    />
  </u-dialog>
</template>

<style scoped>
.page {
  width: 100%;
  height: calc(100vh - 167px);
  border-radius: 24px;
  padding: 24px;
  background-color: var(--neutral-background-default);
  box-shadow: var(--elevation-l);
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 36px 1fr 60px;
  gap: 24px;
}
.page__filters {
  display: grid;
  grid-template-columns: 320px 1fr repeat(4, auto);
  gap: 12px;
  align-items: center;
}
/* --------------- Customs --------------- */
/* Origin */
.origin {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center !important;
}
.origin a {
  width: 100%;
  height: 19px;
  display: grid;
}
.origin a:nth-child(2) {
  grid-template-columns: 20px 1fr;
  width: 100%;
}
.origin span {
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  text-align: start;
  width: 100%;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.origin a:nth-child(1) span {
  color: var(--neutral-text-body);
}
.origin a:nth-child(2) span {
  color: var(--neutral-text-caption);
}
.origin a:hover span {
  color: var(--primary-text-subtle);
}
/* Status */
.status,
.type,
.docs {
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  gap: 5px;
  padding: 0 12px;
}
.status span {
  background-color: var(--neutral-surface-shadow-12a);
  color: var(--neutral-text-body);
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}
.status.inProcess span {
  background-color: var(--success-surface-shadow-12a);
  color: var(--success-text-default);
}
.status.valid span {
  background-color: var(--info-surface-shadow-12a);
  color: var(--info-text-default);
}
.status.paid span {
  background-color: var(--secondary-surface-shadow-12a);
  color: var(--secondary-text-default);
}
/* Type */
.type span {
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
}
.type.OC span {
  background-color: var(--info-surface-shadow-12a);
  color: var(--info-text-default);
}
.type.FXR span {
  background-color: var(--warning-surface-shadow-12a);
  color: var(--warning-text-default);
}
.type strong {
  font-size: 14px;
  line-height: 14px;
  margin-left: 2px;
}
/* Docs */
.docs span.tag {
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 12px;
  background-color: var(--neutral-surface-shadow-12a);
  color: var(--neutral-text-caption);
}
.docs span.number {
  font-size: 12px;
  font-weight: 700;
  border-radius: 12px;
  color: var(--neutral-text-caption);
}

.paidC {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  padding: 0 12px;
}
.paidC span {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
  text-align: right;
}
.paidC span.completed {
  color: var(--neutral-text-disabled) !important;
}
</style>
