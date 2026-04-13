<script setup>
import { defineEmits, ref, computed } from "vue";
import useGlobalStore from "@/stores/global";
import useOutcomesStore from "@/stores/outcomes";
import usePaymentsStore from "@/stores/payments";

import { capitalizeName, debounce, transformedDate } from "@/utils/helpers";

// Stores
const globalStore = useGlobalStore();
const outcomesStore = useOutcomesStore();
const paymentsStore = usePaymentsStore();

import {
  DialogViewDocumentTotales,
  DialogViewDocumentAssignment,
  DialogViewDocumentFiles,
} from "#components";

// Emits
const emit = defineEmits(["closeModal"]);

// Vars
const tabSelected = ref(0);
const tabs = computed(() => ([
  {
    label: t(module + '.tabs.totals'),
    icon: "",
    tab: 0,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(module + '.tabs.assignment'),
    icon: "",
    tab: 1,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(module + '.tabs.files'),
    icon: "",
    tab: 2,
    indicator: false,
    disabled: false,
    main: false,
  },
]));

// Constants
const views = {
  0: DialogViewDocumentTotales,
  1: DialogViewDocumentAssignment,
  2: DialogViewDocumentFiles,
};
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.sections.documents.modals.document";

// Computed
const document = computed(() => outcomesStore.document_active);
const documentType = computed(() => {
  // Falta mejorar el N°
  return {
    main: (outcomesStore.document_active?.documentType?.name || '') + ' N° ' + (outcomesStore.document_active?.documentNumber || ''),
    text: outcomesStore.document_active?.documentType?.name || '-'
  };
});
const origin = computed(() => {
  if((outcomesStore.document_active?.outcomes?.length || 0) <= 1) {
    const income = outcomesStore.document_active?.outcomes?.[0]?.income[0]?.name;
    const project = outcomesStore.document_active?.outcomes?.[0]?.income[0]?.project?.name;
    return capitalizeName(income) + ' - ' + capitalizeName(project);
  } else {
    return t(module + '.text.various');
  }
});
const supplier = computed(() => {
  return {
    name: outcomesStore?.document_active?.supplier?.data?.legalName || '',
    src: outcomesStore?.document_active?.supplier?.imgUrl || '',
  }
});

// Functions
const getStatus = (status) => {
  if(status) {
    const props = ["active", "voided"];
    const prop = props.includes(status) ? status : "active";
    return t(module + ".text." + prop)
  } return ""
};
const getPayTermName = (payTerm) => {
  if(payTerm) {
    const payT = paymentsStore.paymentTerms.find(p => p._id === payTerm);
    if(payT) return payT.name[globalStore.lang];
    return "-";
  } else {
    return "-";
  }
};
const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    if(!outcomesStore.document_active.processing) emit("closeModal");
  };
};

// Mounted
onMounted(() => {
  window.addEventListener("keydown", handleEscapeKey);
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleEscapeKey);
});

</script>

<template>
  <div class="document">
    <div class="document__header">
      <span v-text="capitalizeName(documentType.main)" class="type truncateText"></span>
      <span v-text="getStatus(document?.status)" :class="`tag ${document?.status}`"></span>
      <div></div>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        color="--neutral-text-caption"
        size="m"
        @click="emit('closeModal')"
      />
    </div>
    <div class="document__container">
      <div class="document__snippet">
        <div class="group">
          <span class="label" v-text="t(module + '.labels.reference')"></span>
          <span v-text="capitalizeName(document?.reference)" class="text"></span>
        </div>
        <div class="group">
          <span class="label" v-text="t(module + '.labels.origin')"></span>
          <span v-text="origin" class="text"></span>
        </div>
        <div class="group">
          <span class="label" v-text="t(module + '.labels.supplier')"></span>
          <div class="supplier"><u-avatar :user="supplier" :size="24" /><span class="text" v-text="supplier.name"></span></div>
        </div>
        <div class="group">
          <span class="label" v-text="t(module + '.labels.documentType')"></span>
          <span v-text="capitalizeName(documentType.text)" class="text"></span>
        </div>
        <div class="group">
          <span class="label" v-text="t(module + '.labels.documentNumber')"></span>
          <span v-text="document?.documentNumber || '-'" class="text"></span>
        </div>
        <div class="group">
          <span class="label" v-text="t(module + '.labels.paymentTerm')"></span>
          <span v-text="getPayTermName(document?.paymentTerm)" class="text"></span>
        </div>
        <div class="group groudDate">
          <span class="label" v-text="t(module + '.labels.dates')"></span>
          <div class="date">
            <div>
              <span v-text="t(module + '.labels.issue')"></span>
              <span v-text="transformedDate(document?.issueDate)"></span>
            </div>
            <div>
              <span v-text="t(module + '.labels.receipt')"></span>
              <span v-text="transformedDate(document?.receiptDate)"></span>
            </div>
            <div>
              <span v-text="t(module + '.labels.dueDate')"></span>
              <span v-text="transformedDate(document?.dueDate)"></span>
            </div>
          </div>
        </div>
      </div>
      <div class="document__content">
        <u-tabs class="tabs" :tabs="tabs" v-model="tabSelected" />
        <component :is="views[tabSelected]" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.document {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
}
.document__header {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 10px;
}
.document__header span.ref {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.document__header span.type {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--secondary-text-default);
  text-transform: uppercase;
}
.document__header span.tag {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 600;
}
.document__header span.tag.active {
  color: var(--success-text-darker);
  background-color: var(--success-surface-light);
}
.document__header span.tag.voided {
  color: var(--danger-text-darker);
  background-color: var(--danger-surface-light);
}
.document__header span.point {
  width: 5px;
  height: 5px;
  background-color: var(--neutral-text-caption);
  border-radius: 50%;
}
.document__container {
  display: flex;
  flex-direction: column;
  gap: 36px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding-right: 4px;
}
.document__container::-webkit-scrollbar {
    width: 8px;
    height: 0px;
    background: var(--neutral-surface-light);
    border-radius: 20px;
}

.document__container::-webkit-scrollbar-thumb {
    background: var(--neutral-surface-subtle);
    border-radius: 5px;
}
/* Snippet */
.document__snippet {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.document__snippet .group{
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 24px;
  align-items: center;
  height: 28px;
}
.document__snippet span.label {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.document__snippet span.text {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.document__snippet .group .supplier {
  display: flex;
  gap: 10px;
  align-items: center;
}
.groudDate {
  height: 48px !important;
  align-items: flex-start !important;
}
.groudDate span.label {
  padding-top: 7px;
}
.document__snippet .group .date {
  width: 100%;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  height: 48px;
  padding: 6px 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.document__snippet .group .date div {
  display: flex;
  flex-direction: column;
  padding-top: 1px;
}
.document__snippet .group .date div span:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.document__snippet .group .date div span:nth-child(2) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.document__snippet .group .date div:not(:last-child) {
  border-right: 1px solid var(--neutral-border-subtle);
}

/* Content */
.document__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
</style>