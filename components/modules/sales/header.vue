<script setup>
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import useOrganizationsStore from "@/stores/organization";
import usePaymentsStore from "@/stores/payments";
import { capitalizeFirstLetter } from "@/utils/helpers";
import { useI18n } from "vue-i18n";
import { set } from "@vueuse/core";

// Translations I18n
const { t } = useI18n();
const module = "modules.sales";

// Emits
const emit = defineEmits(["reloadSales"]);

// stores
const salesStore = useSalesStore();
const globalStore = useGlobalStore();
const paymentsStore = usePaymentsStore();
const organizationsStore = useOrganizationsStore();

// constants
const dropdownOpen = ref(false);
const search = ref("");
const lockModal = ref(false);
const textBtnMenuSales = {
  text: { es: "Documentar", en: "Document" },
};
const textBtnFlows = {
  text: { es: "Flujos", en: "Flows" },
};

// Shoe options more
const showModalSiiLoginElectronicInvoice = ref(false);

//computed
const isSelectedDocument = computed(() => {
  const selected = salesStore.sales.filter((sale) => sale.selected);
  return (
    selected.length > 0 && selected.every((sale) => sale.status !== "voided")
  );
});

const hasSelectedLines = computed(
  () =>
    salesStore.sales.some((i) => i.selected) &&
    salesStore.sales
      .filter((i) => i.selected)
      .every((i) => i.salesDocumentType.code === "invoice"),
);

const titleOptions = (code) => {
  switch (code) {
    case "invoice":
      return { es: "Cobros", en: "Charges" };
    case "deposit":
      return { es: "Devolución", en: "Refund" };
    default:
      return { es: "Cobros", en: "Charges" };
  }
};

const optionsBtnFlows = computed(() => {
  return [
    {
      label: titleOptions("invoice")[globalStore.lang],
      icon: "pay",
      prop: "charges",
      disabled: !hasSelectedLines.value,
    },
    {
      label: titleOptions("deposit")[globalStore.lang],
      icon: "trend-up",
      prop: "refund",
      disabled: !hasSelectedLines.value,
    },
  ];
});

const optionsSalesDocTypeMenu = computed(() => {
  return salesStore.typesDocuments.map((type) => {
    return {
      label: {
        es: capitalizeFirstLetter(type.name),
        en: capitalizeFirstLetter(type.name),
      },
      icon: "",
      fullData: type,
    };
  });
});

const optionsMore = computed(() => {
  console.log(
    "organizacion",
    organizationsStore.organization.invoicing.enabled,
  );
  return [
    {
      prop: "siiLoginElectronicInvoices",
      label: {
        es: "Conectar SII para B.H.",
        en: "Connect SII for B.H.",
      },
      icon:
        organizationsStore.organization.invoicing.enabled === true
          ? "check"
          : "close",
      disabled: organizationsStore.organization.invoicing.enabled === true,
    },
  ];
});

// functions

const hideModal = () => {
  if (!lockModal.value) {
    salesStore.dialogSalesDocuments.showCharges = false;
    salesStore.dialogSalesDocuments.showRefund = false;
    showModalSiiLoginElectronicInvoice.value = false;
    lockModal.value = false;
  }
};

// searchSalesDocument
const handleSearchSalesDocument = debounce(async () => {
  globalStore.loading = true;
  search.value = search.value.trim();

  await salesStore.getSalesDocuments({ reference: search.value });
  globalStore.loading = false;
}, 600);

// seleccionar flujo de cobros o depositos
const selectedFlow = (op) => {
  const { prop } = op;
  const options = {
    charges: () => openChargesModal(),
    refund: () => openRefundsModal(),
  };
  if (prop && options[prop]) options[prop]();
};

const openChargesModal = async () => {
  const linesDeposits = salesStore?.sales?.filter((item) => item.selected);
  // const ids = linesDeposits.map((item) => item._id);

  try {
    globalStore.loading = true;
    // const resp = await outcomesStore.addLineToPay(ids);
    const resp = JSON.parse(JSON.stringify(toRaw(linesDeposits)));
    if (resp.length) {
      const ids = new Set();

      paymentsStore.formDeposits.lines = resp;

      // Validaciones para los cobros
      paymentsStore.formDeposits.validations = [
        // Unico cliente por documento
        {
          validate: (list) => {
            const clientsIds = new Set();
            const message = t(
              `${module}.modals.charge.step0.alerts.multipleClients`,
            );
            list.forEach((item) => {
              if (item.client && item.client.contact) {
                clientsIds.add(item.client.contact);
              }
            });
            return { isValid: clientsIds.size === 1, message };
          },
        },
        // Unica moneda
        {
          validate: (list) => {
            const currencyIds = new Set();
            const message = t(`${module}.modals.charge.step0.alerts.currency`);
            list.forEach((item) => {
              if (item?.currency?.default) {
                currencyIds.add(item.currency.default);
              }
            });
            return { isValid: currencyIds.size === 1, message };
          },
        },
        // Compras canceladas
        {
          validate: (list) => {
            const message = t(`${module}.modals.charge.step0.alerts.voidded`);
            const hasCanceled = list.some((item) => item?.status === "voided");

            return { isValid: !hasCanceled, message };
          },
        },
        // Monto por cobrar es cero
        {
          validate: (list) => {
            const message = t(`${module}.modals.charge.step0.alerts.amount`);
            const hasNumberUnCharged = list.some(
              (item) => item?.numbers?.unCharged?.number === 0,
            );
            return { isValid: !hasNumberUnCharged, message };
          },
        },
        // Valor negativo en monto por cobrar
        {
          validate: (list) => {
            const message = t(
              `${module}.modals.charge.step0.alerts.amountNegative`,
            );
            const hasNumberUnCharged = list.some(
              (item) => item?.numbers?.unCharged?.number < 0,
            );
            return { isValid: !hasNumberUnCharged, message };
          },
        },
      ];

      // paymentsStore.formDeposits.multiSupplier = ids.size > 1;
    }
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    paymentsStore.formDeposits.type = "sales-documents-charged";
    salesStore.dialogSalesDocuments.showCharges = true; // abrir modal de cobros
  }
};

const openRefundsModal = () => {
  const linesDeposits = salesStore?.sales?.filter((item) => item.selected);

  try {
    globalStore.loading = true;

    const resp = JSON.parse(JSON.stringify(toRaw(linesDeposits)));

    if (resp.length) {
      paymentsStore.formDeposits.lines = resp;

      paymentsStore.formDeposits.validations = [
        {
          validate: (list) => {
            const clientsIds = new Set();
            const message = t(
              `${module}.modals.refund.step0.alerts.multipleClients`,
            );
            list.forEach((item) => {
              if (item.client?.contact) {
                clientsIds.add(item.client.contact);
              }
            });
            return { isValid: clientsIds.size === 1, message };
          },
        },
        {
          validate: (list) => {
            const currencyIds = new Set();
            const message = t(`${module}.modals.refund.step0.alerts.currency`);
            list.forEach((item) => {
              if (item?.currency?.default) {
                currencyIds.add(item.currency.default);
              }
            });
            return { isValid: currencyIds.size === 1, message };
          },
        },
        {
          validate: (list) => {
            const message = t(`${module}.modals.refund.step0.alerts.voidded`);
            const hasCanceled = list.some((item) => item?.status === "voided");
            return { isValid: !hasCanceled, message };
          },
        },
        {
          validate: (list) => {
            const message = t(`${module}.modals.refund.step0.alerts.amount`);
            const hasNumberCharged = list.some(
              (item) => item?.numbers?.charged?.number === 0,
            );
            return { isValid: !hasNumberCharged, message };
          },
        },
      ];
    }
  } catch (e) {
    console.error(e);
  } finally {
    globalStore.loading = false;
    paymentsStore.formDeposits.type = "sales-documents-refund";
    salesStore.dialogSalesDocuments.showRefund = true;
  }
};
// Abrir el modal de crear documento por su tipo
const openModal = (type) => {
  dropdownOpen.value = false;

  switch (type?.code) {
    case "invoice":
      salesStore.dialogCreateSales.showInvoice = true;
      salesStore.formDocInvoice.typeDocument = type;
      break;
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

// Seleccionando opciones del more menu
const selectedOptionMore = (op) => {
  const { prop } = op;
  const actions = {
    siiLoginElectronicInvoices: () => {
      showModalSiiLoginElectronicInvoice.value = true;
    },
  };
  if (prop && actions[prop]) actions[prop]();
};

// Abrir dropdown de crear documento
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const handleVoidDocument = async () => {
  const body = {
    salesId: salesStore.sales
      .filter((sale) => sale.selected)
      .map((sale) => sale._id),
  };

  globalStore.loading = true;
  await salesStore.voidSalesDocuments(body);
  emit("reloadSales");
  globalStore.loading = false;
};

const filterDataByDate = async (c_date) => {
  // bankingTransactionsStore.currentDate = c_date;
  globalStore.setFiltersCalendar(c_date, "salesDocs", "sales");
  emit("reloadSales");
};
</script>

<template>
  <div class="header">
    <div>
      <u-input
        v-model="search"
        icon="search"
        :placeholder="t(module + '.inputs.search.placeholder')"
        size="s"
        :revers="true"
        style="width: 320px"
        @input="handleSearchSalesDocument"
      />
      <u-datepicker
        size="s"
        :date="globalStore.filtersCalendar.salesDocs.sales"
        @updated-date="filterDataByDate"
      />
      <u-button
        class="btnDesktop"
        :text="t(module + '.buttons.filter')"
        icon="filter"
        :revers="true"
        type="outlined"
        color="--neutral-surface-default"
        size="s"
        :disabled="true"
      />
      <u-button-icon
        class="btnMobile"
        :title="t(module + '.buttons.filter')"
        type="outlined"
        size="s"
        icon="filter"
        color="--neutral-surface-default"
        :disabled="true"
      />
    </div>
    <div>
      <u-button-icon
        title="Recargar tabla"
        type="outlined"
        size="s"
        icon="change"
        color="--neutral-surface-default"
        :disabled="salesStore.loadings.sales"
        @click="emit('reloadSales')"
      />
      <u-button
        class="btnDesktop"
        :text="t(module + '.buttons.void')"
        icon="close"
        type="outlined"
        color="--neutral-surface-default"
        colorHover="--danger-surface-default"
        colorActive="--danger-surface-darker"
        size="s"
        :disabled="!isSelectedDocument"
        @click="salesStore.dialogSalesDocuments.showVoid = true"
      />
      <u-button-icon
        class="btnMobile"
        title="Anular"
        type="outlined"
        size="s"
        icon="close"
        color="--neutral-surface-default"
        colorHover="--danger-surface-default"
        colorActive="--danger-surface-darker"
        :disabled="!isSelectedDocument"
        @click="salesStore.dialogSalesDocuments.showVoid = true"
      />
      <!-- <u-button text="crearTypeDocument" @click="createTypeDocument" type="outlined"/>
                <u-button text="eliminar" type="outlined" @click="deleteTypeDocument"/> -->
      <!-- <u-button
        class="btnDesktop"
        :text="t(module + '.buttons.charge')"
        icon="pay"
        type="outlined"
        size="s"
        :disabled="true"
      /> -->
      <!-- <u-button-icon
        class="btnMobile"
        :title="t(module + '.buttons.charge')"
        type="outlined"
        size="s"
        icon="pay"
        :disabled="true"
      /> -->
      <u-button-menu
        size="s"
        icon="money-transfer"
        type="outlined"
        :text="textBtnFlows"
        :options="optionsBtnFlows"
        @selectedOption="selectedFlow"
      />

      <u-button-menu
        size="s"
        icon="new"
        :text="textBtnMenuSales"
        :options="optionsSalesDocTypeMenu"
        :disabled="optionsSalesDocTypeMenu.length === 0"
        @selectedOption="(op) => openModal(op.fullData)"
      />
      <u-button-menu
        color="--neutral-text-caption"
        :colors="{ default: '--neutral-text-caption' }"
        :maxVisibleOptions="1"
        :onlyIcon="true"
        type="outlined"
        orientation="right"
        size="s"
        icon="more"
        :disabled="organizationsStore?.organization?.country?.code !== 'CL'"
        :options="optionsMore"
        @selectedOption="selectedOptionMore"
        :showArrow="false"
      />
      <!-- <div class="group">
        <u-button
          class="group__button-primary"
          :text="t(module + '.buttons.create')"
          icon="new"
          @click="toggleDropdown"
        />
        <u-button-icon
          class="group__button-secondary"
          icon="chevron-down"
          @click="toggleDropdown"
        />

        <div class="dropdown-menu" :class="{ open: dropdownOpen }">
          <u-button
            v-for="type in salesStore.typesDocuments"
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

  <dialog-cancel
    width="600px"
    height="auto"
    :title="
      t(
        module +
          '.modals.void.title.' +
          (salesStore.sales.filter((sale) => sale.selected).length == 1
            ? 'single'
            : 'plural'),
      )
    "
    :description="t(module + '.modals.void.description')"
    showInput="true"
    :confirmationText="t(module + '.modals.void.confirmationText')"
    :customTextBtnDelete="t(module + '.modals.void.confirmationText')"
    :actionModal="handleVoidDocument"
    :showModal="salesStore.dialogSalesDocuments.showVoid"
    @closeModal="salesStore.dialogSalesDocuments.showVoid = false"
  />

  <u-dialog
    :show-modal="salesStore.dialogSalesDocuments.showCharges"
    width="auto"
    height="auto"
    @closeModal="hideModal"
    :lock-modal="lockModal"
    :persistent="true"
  >
    <DialogDeposits @closeModal="hideModal" @refresh="emit('reloadSales')" />
  </u-dialog>

  <u-dialog
    :show-modal="salesStore.dialogSalesDocuments.showRefund"
    width="auto"
    height="auto"
    @closeModal="hideModal"
    :lock-modal="lockModal"
    :persistent="true"
  >
    <DialogDeposits @closeModal="hideModal" @refresh="emit('reloadSales')" />
  </u-dialog>

  <u-dialog
    :show-modal="showModalSiiLoginElectronicInvoice"
    width="auto"
    height="auto"
    persistent="false"
    :lock-modal="lockModal"
    @closeModal="hideModal"
  >
    <SalesDialogOptionsMoreSiiLoginElectronicInvoices @closeModal="hideModal" />
  </u-dialog>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  height: 100%;
}

.header > div:first-child {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
}

.header > div:last-child {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
}

/* Dropdown Fake */
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

.btnDesktop {
  display: flex;
}
.btnMobile {
  display: none;
}

@media only screen and (max-width: 1330px) {
  .btnDesktop {
    display: none;
  }
  .btnMobile {
    display: flex;
  }
}
</style>
