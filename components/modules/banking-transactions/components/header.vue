<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import useGlobalStore from "@/stores/global";
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import useOrganizationStore from "@/stores/organization";
import { debounce } from "@/utils/helpers";

//store
const globalStore = useGlobalStore();
const bankingTransactionsStore = useBankingTransactionsStore();
const organizationStore = useOrganizationStore();

const emit = defineEmits(["reloadData"]);

//traductor
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.sections.banks";

//const
const modalVoidPayment = ref(false);
// const search = ref("");
const loading = ref(false);
const uploadAction = ref(false);
// updated File Transactions Modal
const showModalUpdatedFileTransactions = ref(false);
const lockModal = ref(false);
const paddingModalUpdatedFile = ref("24px 48px");
// filtro de cuentas de bancos:
const imgAllAccountsTheme = computed(() => {
  return globalStore.isDark
    ? "/img/banking-transactions/cuentasBancarias-dark.svg"
    : "/img/banking-transactions/cuentasBancarias-light.svg";
});

const allAccounts = {
  label: "Todas las cuentas",
  id: null,
  img: imgAllAccountsTheme.value,
};

bankingTransactionsStore.selectAccount = allAccounts;

const options = computed(() => {
  return [
    allAccounts,
    ...(organizationStore?.accountsOrganization?.map((account) => ({
      label: `${account?.owner?.name ? account?.owner?.name + "" : ""} ${account?.accountNumber.slice(-4).padStart(6, "•")}`,
      id: account?._id,
      img: account?.bank?.imgUrl,
      title: account?.bank?.name,
    })) || []),
  ];
});

//computed
const selectedValidPaymentsCount = computed(() => {
  const lines = bankingTransactionsStore?.dataPaymentsCharges?.filter(
    (payments) => payments.selected,
  );

  if (lines.some((payments) => payments.status === "voided")) {
    return 0;
  } else {
    return lines.length;
  }
});

const typeCalendar = computed(() => {
  if (bankingTransactionsStore.tab === 0) {
    return "transactions";
  } else {
    return "banks";
  }
});

//functions

//search pagos
const searchData = debounce(async (e) => {
  console.log(e.target.value);
  if (e.target.value.trim() !== "") {
    try {
      bankingTransactionsStore.loadingTables = true;
      // await bankingTransactionsStore.searchPayments(e.target.value);
      bankingTransactionsStore.search = e.target.value;
      emit("reloadData");
    } catch (error) {
      console.error(error);
    } finally {
      bankingTransactionsStore.loadingTables = false;
    }
    // } else {
    //   try {
    //     bankingTransactionsStore.loadingTables = true;
    //     await bankingTransactionsStore.getPaymentsCharges();
    //   } catch (error) {
    //     console.error(error);
    //   } finally {
    //     bankingTransactionsStore.loadingTables = false;
    //   }
  } else {
    bankingTransactionsStore.search = "";
    emit("reloadData");
  }
}, 600);

// fecha
const filterDataByDate = async (c_date) => {
  // bankingTransactionsStore.currentDate = c_date;
  globalStore.setFiltersCalendar(
    c_date,
    "bankingTransactions",
    typeCalendar.value,
  );
  emit("reloadData");
};

// filtrar cuentas de la organizacion
const filterDataByAccount = async (account_date) => {
  bankingTransactionsStore.selectAccount = account_date;
  emit("reloadData");
};

// anular pagos
const voidSelectedPayment = async () => {
  try {
    globalStore.loading = true;

    const arrayIsPartialPayment = [];
    const arrayIsRefund = [];

    bankingTransactionsStore?.dataPaymentsCharges
      .filter((pay) => pay.selected)
      .forEach((doc) => {
        if ("isPartialPayment" in doc) {
          arrayIsPartialPayment.push(doc._id);
        } else if ("isRefund" in doc) {
          arrayIsRefund.push(doc._id);
        }
      });

    console.log("arrayIsPartialPayment", arrayIsPartialPayment);
    console.log("arrayIsRefund", arrayIsRefund);

    if (arrayIsPartialPayment.length > 0) {
      console.log("entre a void pagos");
      await bankingTransactionsStore.voidManyPayments(arrayIsPartialPayment);
    }

    if (arrayIsRefund.length > 0) {
      console.log("entre a void cobros");
      await bankingTransactionsStore.voidedChargesAndRefund(arrayIsRefund);
    }
  } catch (err) {
    console.error("Error al anular los pagos seleccionados:", err);
  } finally {
    setTimeout(async () => {
      emit("reloadData");
      modalVoidPayment.value = false;
      globalStore.loading = false;
    }, 1000);
  }
};

const deleteManyTransactions = async () => {
  console.log("deleteTransactions");
  let response = null;

  try {
    globalStore.loading = true;

    const transactionsIds = bankingTransactionsStore?.dataTransactions
      .filter((transaction) => transaction.selected)
      .map((doc) => doc._id);
    response =
      await bankingTransactionsStore.deleteManyTransaction(transactionsIds);
  } catch (e) {
    console.error(e);
  } finally {
    setTimeout(async () => {
      if (response.success) await bankingTransactionsStore.getTransactions();
      globalStore.loading = false;
    }, 1000);
  }
};

const deleteTransaction = async () => {
  let response = null;

  try {
    globalStore.loading = true;

    const trasactionId = bankingTransactionsStore?.dataTransactions
      .filter((transaction) => transaction.selected)
      .map((doc) => doc._id)[0];
    console.log(trasactionId);
    response = await bankingTransactionsStore.deleteTransaction(trasactionId);
  } catch (e) {
    console.error(e);
  } finally {
    setTimeout(async () => {
      if (response.success) await bankingTransactionsStore.getTransactions();
      globalStore.loading = false;
    }, 1000);
  }
};

watch(ref(uploadAction), async () => {
  loading.value = true;
  document.getElementById("uploadFileInput").click();
  loading.value = false;
});

const uploadFile = async (e) => {
  if (!e.target.files || !e.target.files[0]) {
    return;
  }

  const file = e.target.files[0];
  let fileType = "unknown";
  if (file.type === "application/xml" || file.type === "text/xml") {
    fileType = "xml";
  } else if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    fileType = "xlsx";
  } else if (file.type === "application/vnd.ms-excel") {
    fileType = "xls";
  }

  if (fileType !== "xlsx") {
    return toast.warning("El archivo debe ser EXCEL", { autoClose: 2000 });
  }

  const formData = new FormData();
  formData.append("file", file);
  if (file.size) {
    try {
      globalStore.loading = true;
      await bankingTransactionsStore.uploadFile(formData, fileType);
    } catch (error) {
      console.error("Error al subir el archivo:", error);
    } finally {
      globalStore.loading = false;
    }
    e.target.value = null;
  } else {
    console.warn("File size information unavailable.");
  }
};

const hideModal = () => {
  if (!lockModal.value) {
    showModalUpdatedFileTransactions.value = false;
  }
};
</script>

<template>
  <div class="container__filters">
    <div>
      <u-input
        v-model="bankingTransactionsStore.search"
        class="search"
        icon="search"
        :revers="true"
        placeholder="Buscar..."
        size="s"
        @input="searchData($event)"
        style="width: 320px"
      />
      <u-datepicker
        size="s"
        :date="globalStore.filtersCalendar.bankingTransactions[typeCalendar]"
        :show-filters="true"
        @updated-date="filterDataByDate"
      />
      <u-select
        v-model="bankingTransactionsStore.selectAccount.label"
        icon-dropdown="selector_down"
        padding-options-horizontal="0"
        :img="bankingTransactionsStore.selectAccount.img"
        :img-rounded="true"
        :options="options"
        :full-data="true"
        @full-data="filterDataByAccount"
      >
      </u-select>
      <u-button
        class="btnDesktop"
        text="Filtrar"
        icon="filter"
        :revers="true"
        type="outlined"
        color="--neutral-text-caption"
        size="s"
        :counter="globalStore.appliedFiltersCount"
        :disabled="globalStore.disableFilter == true"
        @click="globalStore.showFilters = true"
      />
      <u-button-icon
        class="btnMobile"
        icon="filter"
        type="outlined"
        color="--neutral-text-caption"
        size="s"
        :counter="globalStore.appliedFiltersCount"
        :disabled="globalStore.disableFilter == true"
        @click="globalStore.showFilters = true"
      />

      <!-- <input
        type="file"
        name="cover"
        id="uploadFileInput"
        @change="uploadFile($event)"
        style="display: none"
      /> -->
      <u-button-icon
        v-if="bankingTransactionsStore?.tab === 1"
        icon="attach"
        type="outlined"
        color="--bg-info-500"
        colorHover="--bg-info-400"
        colorActive="--bg-info-600"
        @click="showModalUpdatedFileTransactions = true"
        tooltip="Subir Excel"
        :disabled="false"
      />
    </div>

    <div>
      <!-- <u-button-icon
        icon="delete"
        :revers="true"
        type="outlined"
        color="--danger-text-default"
        size="m"
        @click="deleteTransaction"
        /> -->

      <u-button
        class="btnDesktop"
        text="Anular"
        icon="close"
        :revers="true"
        type="outlined"
        :disabled="selectedValidPaymentsCount === 0"
        @click="modalVoidPayment = true"
        color="--danger-text-default"
        color-hover="--danger-text-darker"
        size="s"
      />
      <u-button-icon
        class="btnMobile"
        title="Anular"
        type="outlined"
        size="s"
        icon="close"
        color="--danger-text-default"
        colorHover="--danger-text-darker"
        colorActive="--danger-text-darker"
        :disabled="selectedValidPaymentsCount === 0"
        @click="modalVoidPayment = true"
      />
      <!-- <u-button-icon
        size="s"
        type="outlined"
        icon="more"
        color="--neutral-text-caption"
      /> -->
    </div>
  </div>

  <dialog-cancel
    width="600px"
    height="auto"
    :title="
      t(
        module +
          '.modals.void.title.' +
          (selectedValidPaymentsCount == 1 ? 'single' : 'plural'),
      )
    "
    :description="t(module + '.modals.void.description')"
    :showInput="true"
    :confirmationText="t(module + '.modals.void.confirmationText')"
    :customTextBtnDelete="t(module + '.modals.void.confirmationText')"
    :actionModal="voidSelectedPayment"
    :showModal="modalVoidPayment"
    @closeModal="modalVoidPayment = false"
  />

  <!-- dialog cargar archivo de transacciones -->
  <u-dialog
    :showModal="showModalUpdatedFileTransactions"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :padding="paddingModalUpdatedFile"
  >
    <BankingTransactionsDialogUpdatedFileTransactionsUpload
      @closeModal="hideModal"
      @updatePadding="updatePaddingModal"
    />
  </u-dialog>
</template>

<style scoped>
.container__filters {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-self: center;
}

.container__filters > div:first-child {
  display: grid;
  grid-template-columns: 320px auto 250px auto auto;
  gap: 16px;
  align-items: center;
}

.container__filters > div:last-child {
  display: grid;
  grid-template-columns: auto auto;
  gap: 16px;
  align-items: center;
}

.container__filters .search {
  width: 400px;
  min-width: 300px;
  flex-shrink: 0;
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
