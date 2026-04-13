<script setup>
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useContactStore from "@/stores/contacts";
import usePermissionsStore from "@/stores/permissions";
import { computed, defineEmits } from "vue";
import { toast } from "vue3-toastify";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();
const userStore = useUserStore();
const contactStore = useContactStore();
const permissionsStore = usePermissionsStore();

// Emits
const emit = defineEmits(["refresh"]);

// Contants
const colorBtn = "--neutral-text-caption";
const colorDelete = "--danger-text-default";
const colorDeleteHover = "--danger-text-darker";
const modalCancel = ref(false);
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.header";
const getColorStatus = (status) => {
  const options = {
    voided: {
      backgroundColor: "var(--danger-surface-shadow-12a)",
      color: "var(--danger-text-darker)",
    },
    forApproval: {
      backgroundColor: "var(--warning-surface-shadow-12a)",
      color: "var(--warning-text-darker)",
    },
    inProcess: {
      backgroundColor: "var(--info-surface-shadow-12a)",
      color: "var(--info-text-darker)",
    },
    closed: {
      backgroundColor: "var(--secondary-surface-shadow-8a)",
      color: "var(--secondary-text-darker)",
    },
    paid: {
      backgroundColor: "var(--primary-surface-shadow-12a)",
      color: "var(--primary-text-default)",
    },
    rejected: {
      backgroundColor: "var(--neutral-surface-harder)",
      color: "var(--neutral-text-caption)",
    },
    default: {
      backgroundColor: "var(--neutral-surface-shadow-12a)",
      color: "var(--neutral-text-darker)",
    },
  };

  return options[status] || options.default;
};

const router = useRouter();
const modalEdit = ref(false);
const modalShare = ref(false);
const modalPaymentRequest = ref(false);

// Computed
const idNumberOC = computed(() => outcomesStore.outcome.idNumber);
const nameOC = computed(() => outcomesStore.outcome.reference);
const origin = computed(() => {
  return getProjectAndIncome(outcomesStore.outcome.income);
});
const supplier = computed(() => ({
  name: outcomesStore.outcome?.supplier?.data?.legalName || "",
  src: outcomesStore.outcome?.supplier?.imgUrl || null,
  contact: outcomesStore.outcome?.supplier?.contact?._id ?? null,
}));
// desactivando boton de voided si tiene o no tiene documentos
const disabledVoided = computed(() => {
  // Si tiene ambos permisos
  // outcomes_voidPurcharse y outcomes_voidPurcharse_with_docs
  // ➜ puede anular siempre (haya documentos o pagos).

  // Si solo tiene outcomes_voidPurcharse
  // ➜ solo puede anular si NO hay documentos ni pagos.

  // Si no tiene ningun permiso
  // ➜ no puede anular.

  const numbers = outcomesStore?.outcome?.numbers;
  const perms = permissionsStore?.myPermissions;

  const documented = numbers?.documented?.numberAprox ?? 0;
  const paid = numbers?.paid?.numberAprox ?? 0;

  if (
    (perms?.outcomes_voidPurcharse &&
      perms?.outcomes_voidPurcharse_with_docs) ||
    (perms?.outcomes_voidPurcharse && documented === 0 && paid === 0)
  ) {
    return false;
  }

  return true;
});
const tileDeleteModal = computed(() => {
  const textLength = ".title_singular";
  return t(
    "modules.outcomes.pages.outcome.tabs.tab1.modals.cancel" + textLength,
  );
});
const descriptionDeleteModal = computed(() => {
  return t(
    "modules.outcomes.pages.outcome.tabs.tab1.modals.cancel.description",
  );
});
const confirmationDeleteModal = computed(() => {
  return t(
    "modules.outcomes.pages.outcome.tabs.tab1.modals.cancel.confirmationText",
  );
});
const btnDeleteModal = computed(() => {
  return t(
    "modules.outcomes.pages.outcome.tabs.tab1.modals.cancel.customTextBtnDelete",
  );
});
const errorMsgCancelDocument = computed(() =>
  t("modules.outcomes.pages.outcome.tabs.tab1.modals.cancel.errorDocuments"),
);
const errorMsgCancelPayment = computed(() =>
  t("modules.outcomes.pages.outcome.tabs.tab1.modals.cancel.errorPayments"),
);
const lockModal = ref(false);

// Functions
const cancelPO = async () => {
  try {
    const body = { outcomes: [outcomesStore.outcome._id] };
    const { success, data } = await outcomesStore.archiveOutcome(body);
    if (success) {
      router.replace({ path: "/outcomes" });
    } else {
      if (data === "Cant delete outcomes with documents") {
        toast.error(errorMsgCancelDocument.value, { autoClose: 3000 });
      } else if (data === "Cant delete outcomes with payments") {
        toast.error(errorMsgCancelPayment.value, { autoClose: 3000 });
      }
    }
  } catch (err) {
    console.log("error", err.message);
  }
};

const printPO = async () => {
  try {
    globalStore.loading = true;
    const response = await outcomesStore.generarPDF(outcomesStore.outcome);
    if (response) {
      window.open(response, "_blank");
    } else {
      console.error("No se pudo generar el Blob para la descarga del PDF.");
    }
  } catch (error) {
    console.error("Error al descargar el PDF:", error);
  } finally {
    globalStore.loading = false;
  }
};

const hideModal = () => {
  if (!lockModal.value) {
    modalEdit.value = false;
    modalShare.value = false;
    goToClosedModal.value = false;
    configOpenClose.value = {};
    modalPaymentRequest.value = false;
    lockModal.value = false;
  }
};

const getProjectAndIncome = (items = null) => {
  if (!items) return { project: "", income: "" };
  const text = t(
    "modules.outcomes.pages.oc.sections.documents.modals.document.text.various",
  );

  const projectIds = new Set(items.map((item) => item.project._id));
  if (projectIds.size > 1) {
    return { project: text, income: "" };
  }

  const incomeIds = new Set(items.map((item) => item._id));
  const incomeNames = new Set(items.map((item) => item.name));

  return {
    project: items[0]?.project?.name || "",
    income: incomeIds.size > 1 ? text : [...incomeNames][0] || "",
  };
};

const showSupplier = () => {
  if (supplier.value.contact) {
    const id = supplier.value.contact;
    userStore.showModalDataSheet = true;
    userStore.userDataSheetId = id;
    userStore.dataSheet.onlyEdit = true;
    contactStore.alreadyLoadedConditionsPred = false;
  }
};

const goToClosedModal = ref(false);
const configOpenClose = ref({});

const selectedOptions = (op) => {
  const { prop } = op;
  const options = {
    open: () => openClosedModal(),
    closed: () => openClosedModal(true),
  };
  if (prop && options[prop]) options[prop]();
};

const openClosedModal = (closed = false) => {
  goToClosedModal.value = true;
  configOpenClose.value = {
    ids: [outcomesStore.outcome._id],
    closed,
  };
};

const optionsBtnOptions = computed(() => {
  let options = [];
  if (outcomesStore.outcome.status === "closed") {
    options.push({
      label: { default: t(module + ".buttons.open.label") },
      icon: "unlocked",
      prop: "open",
    });
  } else {
    options.push({
      label: { default: t(module + ".buttons.closed.label") },
      icon: "locked",
      prop: "closed",
    });
  }
  return options;
});
</script>

<template>
  <div class="outcomes__page-header">
    <div class="outcomes__page-header-title">
      <div class="outcomes__page-header-title-text">
        <span>{{ capitalizeName(origin.project) }}</span>
        <span v-if="origin.income !== ''">•</span>
        <span v-if="origin.income !== ''">{{
          capitalizeName(origin.income)
        }}</span>
      </div>
      <div class="outcomes__page-header-title-main">
        <span class="truncateText">{{
          nameOC || t(module + ".defaultTitle")
        }}</span>
        <span>•</span>
        <span>N° {{ idNumberOC }}</span>
        <u-button-icon
          icon="edit"
          type="text"
          size="s"
          @click="modalEdit = true"
          class="editBtn"
          v-if="!['voided', 'closed'].includes(outcomesStore.outcome.status)"
        />
      </div>
      <div class="outcomes__page-header-title-snippet">
        <button
          @click="showSupplier"
          :disabled="supplier.contact === null"
          :title="t(module + '.buttons.showSupplier.tooltip')"
        >
          <u-avatar :user="supplier" :size="24" />
          <span class="truncateText">{{ supplier?.name }}</span>
        </button>
        <span
          v-if="outcomesStore?.outcome?.status"
          :style="getColorStatus(outcomesStore.outcome.status)"
          class="tag"
          >{{ t(module + `.tags.${outcomesStore.outcome.status}`) }}</span
        >
      </div>
    </div>
    <div class="outcomes__page-header-buttons">
      <div class="outcomes__page-header-actions">
        <u-button
          text="Solicitar Pago"
          type="outlined"
          size="s"
          icon="invoice"
          @click="modalPaymentRequest = true"
          v-if="!['voided', 'closed'].includes(outcomesStore.outcome.status)"
        />
        <u-button
          :text="t(module + '.buttons.cancel.label')"
          icon="cancel"
          type="outlined"
          :color="colorDelete"
          :colorHover="colorDeleteHover"
          :colorActive="colorDeleteHover"
          :disabled="disabledVoided"
          size="s"
          v-if="!['voided', 'closed'].includes(outcomesStore.outcome.status)"
          @click="modalCancel = true"
        />
        <u-button-icon
          icon="download"
          type="outlined"
          :color="colorBtn"
          size="s"
          @click="printPO"
        />
        <u-button-icon
          icon="share"
          type="outlined"
          :color="colorBtn"
          size="s"
          @click="modalShare = true"
        />
        <u-button-menu
          v-if="outcomesStore.outcome.status !== 'voided'"
          :onlyIcon="true"
          size="s"
          icon="more"
          :showArrow="false"
          orientation="right"
          type="outlined"
          :options="optionsBtnOptions"
          @selectedOption="selectedOptions"
        />
      </div>
    </div>
  </div>
  <!-- Anular -->
  <dialog-cancel
    width="600px"
    height="auto"
    :title="tileDeleteModal"
    :description="descriptionDeleteModal"
    :confirmationText="confirmationDeleteModal"
    :customTextBtnDelete="btnDeleteModal"
    :showInput="true"
    :actionModal="cancelPO"
    :showModal="modalCancel"
    @closeModal="modalCancel = false"
  />

  <!-- Editar -->
  <u-dialog
    :showModal="modalEdit"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <OutcomesDialogEdit @closeModal="hideModal" />
  </u-dialog>

  <!-- Compartir -->
  <u-dialog
    :showModal="modalShare"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <OutcomesDialogShare @closeModal="hideModal" />
  </u-dialog>

  <!-- Solicitud de Pago -->
  <u-dialog
    :showModal="modalPaymentRequest"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <OutcomesDialogPaymentRequest @closeModal="hideModal" />
  </u-dialog>

  <u-dialog
    :showModal="goToClosedModal"
    :lockModal="lockModal"
    @closeModal="hideModal"
    width="auto"
    height="auto"
    :persistent="true"
  >
    <DialogCloseOutcome
      @closeModal="hideModal"
      @refresh="emit('refresh')"
      :config="configOpenClose"
    />
  </u-dialog>
</template>

<style scoped>
.outcomes__page-header {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  align-items: center;
  width: 100%;
}

.outcomes__page-header-title-main {
  display: flex;
  align-items: center;
}

.outcomes__page-header-title-main button.editBtn {
  margin-left: 10px;
  transform: scale(0.8);
}

.outcomes__page-header-title-text span,
.outcomes__page-header-title-main span:nth-child(2) {
  font-weight: 400;
  font-size: 10px;
  line-height: 10px;
  letter-spacing: 10%;
  text-transform: uppercase;
  color: var(--neutral-text-caption);
}

.outcomes__page-header-title-text span:nth-child(2),
.outcomes__page-header-title-main span:nth-child(2) {
  margin: 0 8px;
  vertical-align: middle;
}

.outcomes__page-header-title-main span:nth-child(1) {
  font-weight: 600;
  font-size: 18px;
  line-height: 18px;
  letter-spacing: 0%;
  color: var(--neutral-text-body);
  max-width: 350px;
}

.outcomes__page-header-title-main span:nth-child(3) {
  font-weight: 400;
  font-size: 18px;
  line-height: 18px;
  letter-spacing: 0%;
  color: var(--secondary-text-default);
}

.outcomes__page-header-title-snippet {
  display: flex;
  align-items: center;
  gap: 12px;
}
.outcomes__page-header-title-snippet button {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 8px;
  align-items: center;
  max-width: 300px;
  transition: 0.3s;
}
.outcomes__page-header-title-snippet button:hover span {
  color: var(--primary-text-default);
}
.outcomes__page-header-title-snippet button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.outcomes__page-header-title-snippet span {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.outcomes__page-header-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btnMobile {
  display: none;
}

.tag {
  font-size: 10px;
  line-height: 10px;
  font-weight: 600;
  padding: 2px 14px;
  border-radius: 12px;
}

@media only screen and (max-width: 1200px) {
  .btnMobile {
    display: inline-flex;
  }
}
</style>
