<script setup>
import { defineProps } from "vue";
import useGlobalStore from "@/stores/global";
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import useSalesStore from "@/stores/sales";
import {
  SalesDialogDetailsSales,
  SalesDialogSectionsSalesAccountingEntries,
  SalesDialogSectionsSalesDetails,
  SalesDialogSectionsSalesFiles,
} from "#components";
import { useI18n } from "vue-i18n";

/*
::::::::-STORES-:::::::
*/
const globalStore = useGlobalStore();
const salesStore = useSalesStore();
const bankingTransactionsStore = useBankingTransactionsStore();

// i18n
const { t } = useI18n();
const module = "modules.sales.detailsSalesDoc";

//PROPS
const props = defineProps({
  typeDocument: {
    type: String,
    required: false,
    default: "",
  },
});

// Emits
const emit = defineEmits(["closeModal"]);

// Constants
const showMenuERX = ref(false);

// vars
const tabSelected = ref(0);
const views = {
  0: SalesDialogSectionsSalesDetails,
  1: SalesDialogSectionsSalesAccountingEntries,
  2: SalesDialogSectionsSalesFiles,
};
const tabs = computed(() => [
  {
    label: t(`${module}.tabs.tab1`),
    icon: "",
    tab: 0,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(`${module}.tabs.tab2`),
    icon: "",
    tab: 1,
    indicator: false,
    disabled: true,
    main: false,
  },
  {
    label: t(`${module}.tabs.tab3`),
    icon: "",
    tab: 2,
    indicator: false,
    disabled: true,
    main: false,
  },
]);

// Computed
const contentView = computed(() => views[tabSelected.value]);
const othersCurrency = computed(() => {
  return salesStore?.detailsSaleDocument?.currency?.others ?? [];
});

//funtions

const getNameStatus = (status) => {
  const statusObj = {
    reconciled: {
      label: {
        es: "Conciliado",
        en: "Reconciled",
      },
      title: {
        es: "Con transacción bancaria asociada",
        en: "With associated bank transaction",
      },
    },
    unreconciled: {
      label: {
        es: "No Conciliado",
        en: "Unreconciled",
      },
      title: {
        es: "Sin transacción bancaria asociada",
        en: "Without associated bank transaction",
      },
    },
    voided: {
      label: {
        es: "Anulado",
        en: "Voided",
      },
      title: {
        es: "Anulado",
        en: "Voided",
      },
    },
  };

  const lang = globalStore.lang;
  const statusData = statusObj?.[status];

  if (!statusData) return { label: "-", title: "-" };

  return {
    label: statusData.label[lang] || "-",
    title: statusData.title[lang] || "-",
  };
};

const redirectToDocBase = (reference) => {
  const URl_DOCBASE = `/salesDocuments/${reference}`;
  navigateTo(URl_DOCBASE, { external: true, open: { target: "_blank" } });
};

const redirectToBusiness = (item) => {
  console.log("item", item);
  const URL_BUSINESS = `/incomesv2/project/${item?.project?._id}/income/${item?._id}`;
  navigateTo(URL_BUSINESS, { external: true, open: { target: "_blank" } });
};

const redirectToProject = (projectId) => {
  //  navigateTo(`/incomes/project/${item?.item?.lines[0]?.projectId}`, { external: true, open: { target: "_blank" } })
  const URl_PROJECT = `/incomes/project/${projectId}`;
  navigateTo(URl_PROJECT, {
    external: true,
    open: { target: "_blank" },
  });
};

const getColorStatus = (status) => {
  switch (status) {
    case "issue":
      return {
        background: "--info-surface-light",
        color: "--info-text-darker",
      };
    case "voided":
      return {
        background: "--danger-surface-light",
        color: "--danger-text-darker",
      };
    case "settled":
      return {
        background: "--success-surface-light",
        color: "--success-text-darker",
      };
  }
};

const getTextStatus = (status) => {
  switch (status) {
    case "issue":
      return {
        es: "Emitido",
        en: "Emit",
      };
    case "voided":
      return {
        es: "Anulado",
        en: "Voided",
      };
    case "settled":
      return {
        es: "Saldada",
        en: "Settled",
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

const handleEsc = (event) => {
  if (event.key === "Escape") {
    emit("closeModal");
  }
};

onMounted(async () => {
  // MIENTRAS SE MANAJE LAS OTHER CURRENCYS CON EL ENDPOINT
  document.addEventListener("keydown", handleEsc);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleEsc);
});
</script>

<template>
  <div class="modal-content">
    <div class="modal-header" id="modal-header">
      <div class="izq">
        <span class="truncateText">{{
          salesStore?.detailsSaleDocument?.salesDoc?.salesDocumentType?.name
        }}</span>
        <span class="title">
          {{ `N° ${salesStore?.detailsSaleDocument?.salesDoc?.number}` }}
        </span>
        <u-tags
          :text="
            getTextStatus(salesStore?.detailsSaleDocument?.salesDoc?.status)?.[
              globalStore.lang
            ]
          "
          :color="
            getColorStatus(salesStore?.detailsSaleDocument?.salesDoc?.status)
              ?.color
          "
          :background="
            getColorStatus(salesStore?.detailsSaleDocument?.salesDoc?.status)
              ?.background
          "
          size="xs"
          :delete="false"
          style="margin: 0 auto"
        />
        <ComponentsExchangeRateViewer
          v-model="showMenuERX"
          :currencies="
            salesStore?.detailsSaleDocument?.salesDoc?.currency?.others
          "
        />
      </div>

      <u-button-icon
        icon="close"
        class="btnIconModify"
        @action-btn="emit('closeModal')"
        color="--neutral-text-caption"
        type="outlined"
        size="s"
      />
    </div>
    <div class="modal-scroll">
      <div class="modal-body">
        <!--GRUPO SUPERIOR-->
        <div class="group">
          <div class="info-group">
            <span class="label" v-text="t(`${module}.labels.reference`)"></span>
            <span
              class="text"
              v-text="
                salesStore?.detailsSaleDocument?.salesDoc?.reference || '-'
              "
            ></span>
          </div>
          <div class="info-group">
            <span class="label" v-text="t(`${module}.labels.createdBy`)"></span>
            <div class="supplier">
              <u-avatar
                :user="{
                  name:
                    salesStore?.detailsSaleDocument?.salesDoc?.creator?.user
                      ?.data?.legalName ||
                    salesStore?.detailsSaleDocument?.salesDoc?.client?.data
                      ?.legalName,
                  src:
                    salesStore?.detailsSaleDocument?.salesDoc?.creator?.user
                      ?.imgUrl ||
                    salesStore?.detailsSaleDocument?.salesDoc?.client?.imgUrl,
                }"
                :size="24"
              />
              <span
                class="text"
                v-text="
                  salesStore?.detailsSaleDocument?.salesDoc?.creator?.user?.data
                    ?.legalName ||
                  salesStore?.detailsSaleDocument?.salesDoc?.client?.data
                    ?.legalName ||
                  '-'
                "
              >
              </span>
            </div>
          </div>
          <div class="info-group">
            <span class="label" v-text="t(`${module}.labels.typeDoc`)"></span>
            <!-- <u-tags
              :delete="false"
              :text="`${salesStore?.detailsSaleDocument?.salesDoc?.salesDocumentType?.tag || '-'}`"
              style="width: max-content;"
              color="--info-text-darker"
              background="--info-surface-light"
              size="s"
            /> -->
            <u-tags
              :title="`${
                salesStore?.detailsSaleDocument?.salesDoc?.salesDocumentType
                  ?.tag ||
                getTextCode(
                  salesStore?.detailsSaleDocument?.salesDoc?.salesDocumentType
                    ?.code,
                )?.[globalStore.lang] ||
                '-'
              }`"
              :text="`${
                salesStore?.detailsSaleDocument?.salesDoc?.salesDocumentType
                  ?.tag ||
                getTextCode(
                  salesStore?.detailsSaleDocument?.salesDoc?.salesDocumentType
                    ?.code,
                )?.[globalStore.lang] ||
                '-'
              }`"
              size="xs"
              :alignCenterText="true"
              :background="
                getColorTypeCode(
                  salesStore?.detailsSaleDocument?.salesDoc?.salesDocumentType
                    ?.code,
                )?.background
              "
              :color="
                getColorTypeCode(
                  salesStore?.detailsSaleDocument?.salesDoc?.salesDocumentType
                    ?.code,
                )?.color
              "
              maxWidth="500px"
              :delete="false"
              style="width: max-content"
            />
          </div>
          <div class="info-group">
            <span class="label" v-text="t(`${module}.labels.currency`)"></span>
            <span
              class="text"
              v-text="
                salesStore?.detailsSaleDocument?.salesDoc?.currency?.default
                  ?.name[globalStore.lang] || '-'
              "
            ></span>
          </div>
          <div class="info-group date-group">
            <span class="label">{{ t(`${module}.labels.dates.dates`) }}</span>
            <div class="date">
              <div>
                <span v-text="t(`${module}.labels.dates.issue`)"></span>
                <span
                  v-text="
                    transformedDate(
                      salesStore?.detailsSaleDocument?.salesDoc?.issueDate,
                    )
                  "
                ></span>
              </div>
              <div>
                <span>{{ t(`${module}.labels.dates.dueDate`) }}</span>
                <span
                  v-text="
                    transformedDate(
                      salesStore?.detailsSaleDocument?.salesDoc?.expirationDate,
                    )
                  "
                ></span>
              </div>
            </div>
          </div>
        </div>
        <div class="group">
          <div
            class="info-group"
            v-if="
              salesStore?.detailsSaleDocument?.salesDoc?.salesDocumentType
                ?.code === 'credit' ||
              salesStore?.detailsSaleDocument?.salesDoc?.salesDocumentType
                ?.code === 'debit'
            "
          >
            <span class="label" v-text="t(`${module}.labels.baseDoc`)"></span>
            <div class="supplier">
              <span
                class="text"
                v-text="
                  salesStore?.detailsSaleDocument?.salesDoc?.salesDocument
                    ?.reference || '-'
                "
              ></span>

              <span
                class="u u-click"
                v-if="salesStore?.detailsSaleDocument?.lines?.length === 1"
                style="
                  color: var(--info-text-darker);
                  font-size: 20px;
                  cursor: pointer;
                "
                @click="
                  redirectToDocBase(
                    salesStore?.detailsSaleDocument?.salesDoc?.salesDocument
                      ?._id,
                  )
                "
              ></span>
            </div>
          </div>
          <div class="info-group">
            <span class="label" v-text="t(`${module}.labels.business`)"></span>
            <div class="supplier">
              <span
                class="text"
                v-text="
                  salesStore?.detailsSaleDocument?.lines?.length === 1
                    ? salesStore?.detailsSaleDocument?.lines[0]?.referenceIncome
                        ?.name || '-'
                    : 'Varios Negocios'
                "
              ></span>

              <span
                class="u u-click"
                v-if="salesStore?.detailsSaleDocument?.lines?.length === 1"
                style="
                  color: var(--info-text-darker);
                  font-size: 20px;
                  cursor: pointer;
                "
                @click="
                  redirectToBusiness(
                    salesStore?.detailsSaleDocument?.lines[0]?.referenceIncome,
                  )
                "
              ></span>
            </div>
          </div>
          <div class="info-group">
            <span class="label" v-text="t(`${module}.labels.project`)"></span>
            <div class="supplier">
              <span
                class="text"
                v-text="
                  salesStore?.detailsSaleDocument?.lines?.length === 1
                    ? salesStore?.detailsSaleDocument?.lines[0]?.referenceIncome
                        ?.project?.name || '-'
                    : `Varios Proyectos`
                "
              ></span>
              <span
                class="u u-click"
                v-if="salesStore?.detailsSaleDocument?.lines?.length === 1"
                style="
                  color: var(--info-text-darker);
                  font-size: 20px;
                  cursor: pointer;
                "
                @click="
                  redirectToProject(
                    salesStore?.detailsSaleDocument?.lines[0]?.referenceIncome
                      ?.project?._id,
                  )
                "
              ></span>
            </div>
          </div>
          <div class="info-group">
            <span class="label">{{ t(`${module}.labels.client`) }}</span>
            <div class="supplier">
              <u-avatar
                :user="{
                  name: salesStore?.detailsSaleDocument?.salesDoc?.client?.data
                    ?.legalName,
                  src: salesStore?.detailsSaleDocument?.salesDoc?.client
                    ?.imgUrl,
                }"
                :size="24"
              />
              <span
                class="text"
                v-text="
                  salesStore?.detailsSaleDocument?.salesDoc?.client?.data
                    ?.legalName || '-'
                "
              ></span>
            </div>
          </div>
        </div>
      </div>

      <u-tabs class="tabs" :tabs="tabs" v-model="tabSelected" />
      <component v-if="contentView" :is="contentView" />
    </div>
  </div>
</template>

<style scoped>
.modal-content {
  width: 700px;
  max-width: 95vw; /* responsive */
  height: 100%; /* modal con límite */
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* header */
.modal-header {
  flex-shrink: 0; /* NO se encoge */
  height: 40px;
  display: grid;
  grid-template-columns: 1fr 35px;
  align-items: center;
}

.modal-header .izq {
  display: grid;
  grid-template-columns: auto auto auto auto;
  position: relative;
  align-items: center;
  justify-content: start;
  gap: 10px;
  width: 1fr;
}

.modal-header .title {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--secondary-text-default);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-header .status-tag {
  justify-self: center;
}

.modal-header .btnIconModify {
  justify-self: end;
}

.modal-scroll {
  flex: 1; /* ocupa el resto */
  overflow-y: auto; /* scroll vertical */
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 4px; /* evita salto por scrollbar */
}

.modal-scroll::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.modal-scroll::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

/* body */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal-body .info-group {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 24px;
  align-items: center;
  height: 28px;
}
.modal-body span.label {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.modal-body span.text {
  display: flex;
  align-items: center;
  height: 100%;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.modal-body .info-group .supplier {
  display: flex;
  gap: 10px;
  align-items: center;
}
.date-group {
  height: 48px !important;
  align-items: flex-start !important;
}
.date-group span.label {
  padding-top: 7px;
}
.group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
}
.modal-body .info-group .date {
  width: 100%;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  height: 48px;
  padding: 6px 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.modal-body .info-group .date div {
  display: flex;
  flex-direction: column;
  padding-top: 1px;
}
.modal-body .info-group .date div span:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.modal-body .info-group .date div span:nth-child(2) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.modal-body .info-group .date div:not(:last-child) {
  border-right: 1px solid var(--neutral-border-subtle);
}
.tag {
  font-size: 12px !important;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  margin-left: 10px;
}
.reconciled {
  color: var(--success-text-darker) !important;
  background-color: var(--success-surface-shadow-12a) !important;
}
.unreconciled {
  color: var(--warning-text-darker) !important;
  background-color: var(--warning-surface-shadow-12a) !important;
}
.voided {
  color: var(--danger-text-darker) !important;
  background-color: var(--danger-surface-shadow-12a) !important;
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}

.mainBtnModify {
  width: 135px;
}
</style>
