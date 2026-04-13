<script setup>
import { defineEmits, defineProps } from "vue";
import usePaymentsStore from "@/stores/payments";

// Stores
const paymentsStore = usePaymentsStore();

// Emits
const emit = defineEmits(["closeModal","nextStep","backStep"]);

// Props
const props = defineProps({
  page: {
    type: String,
    default: "listOc"
  },
  payState: {
    type: String,
    default: ""
  } 
});

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.goToPay.step2";
const buttons = "modules.outcomes.pages.oc.modals.goToPay.buttons";
const module2 = "modules.outcomes.pages.outcome";

// Functions
const hasMultipleIncomes = (origin) => {
  return origin.length > 1;
};
const removeOC = (i) => {
  if(paymentsStore.formGoToPay.lines.length !== 1) {
    if(Array.isArray(paymentsStore.formGoToPay?.lines) && i >= 0 && i < paymentsStore.formGoToPay.lines.length) {
      paymentsStore.formGoToPay.lines.splice(i, 1);
    }
  }
}

const handleEscClose = (e) => {
  if (e.key === "Escape") {
    emit("closeModal");
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleEscClose);
})

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscClose);
})

</script>

<template>
  <div class="step2_1">
    <div class="step2_1__header">
      <span>{{ t(module + '.title3') }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        @click="emit('closeModal')"
        type="outlined"
        size="s"
      />
    </div>
    <div class="step2_1__alert" v-if="!['','todoBien'].includes(props.payState)">
        <span class="u u-danger-outlined"></span>
        <p>{{ t(module + '.alerts.' + props.payState + '.text') }} <strong>{{ t(module + '.alerts.' + props.payState + '.main') }}</strong></p>
    </div>
    <span class="step2_2__title">{{ t(module + '.itemSelected') }} ({{ paymentsStore.formGoToPay.lines.length }})</span>
    <div class="step2__body-table">
      <div class="step2__body-table-header">
        <div class="col left first">
          <span v-text="t(module + '.table.headers.supplier')"></span>
        </div>
        <div class="col left">
          <span v-text="t(module + '.table.headers.purchase')"></span>
        </div>
        <div class="col left">
          <span v-text="t(module + '.table.headers.reference')"></span>
        </div>
        <div class="col right">
          <span v-text="t(module + '.table.headers.state')"></span>
        </div>
        <div class="col right">
          <span v-text="t(module + '.table.headers.unpaid')"></span>
        </div>
        <div class="col right last"></div>
      </div>
      <div class="step2_2__body-table-item" v-for="(item, i) in paymentsStore.formGoToPay.lines" :key="item._id">
        <div class="col left supplier">
          <u-avatar :user="{name: item?.supplier?.data?.legalName || '', src: item?.supplier?.imgUrl}" :size="32" />
          <span class="truncateText" v-text="capitalizeName(item?.supplier?.data?.legalName || '')"></span>
        </div>
        <div class="col left">
          <a :class="`tag ${item?.type}`" :href="`/outcomes/${item?._id}`" target="_blank" rel="noopener noreferrer">
            {{ item?.tagManagementDoc || item?.type }} - {{ item?.idNumber }} <span class="u u-click"></span>
          </a>
        </div>
        <div class="col left name">
          <span class="truncateText" v-text="capitalizeName(item?.reference || '')"></span>
          <span v-if="hasMultipleIncomes(item?.income || [])" v-text="t(module + '.mulitpleIncomes')"></span>
          <a v-else
            class="income"
            :title="item?.income?.[0]?.project?.name + ' / ' + item?.income?.[0]?.name"
            :href="`/incomesv2/project/${item?.income?.[0]?.project?._id}/income/${item?.income?.[0]?._id}`"
            target="_blank" rel="noopener noreferrer">
            <span class="u u-open"></span>
            <span
              class="truncateText"
              v-text="capitalizeName(item?.income?.[0]?.name || '')"
            ></span>
          </a>
        </div>
        <div class="col right colStatus">
          <span :class="`status ${item.status || ''}`">
            {{  item.status ? t(module2 + '.tabs.tab1.status.' + item.status) : '-' }}
          </span>
        </div> 
        <div class="col right">
          <span v-text="item?.numbers?.unpaid?.value"></span>
        </div> 
        <div class="col right last">
          <u-button-icon
            icon="close"
            class="btnIconModify"
            :color="color"
            type="text"
            size="s"
            @click="removeOC(i)"
            :disabled="paymentsStore.formGoToPay.lines.length === 1"
          />
        </div>
      </div>
    </div>
    <div class="step2_2__footer">
      <u-button
        v-if="props.page === 'listOc'"
        :text="t(buttons + '.cancel')"
        type="outlined"
        class="mainBtnModify"
        @click="emit('closeModal')"
        size="s"
        />
        <u-button
        v-else
        :text="t(buttons + '.back')"
        type="outlined"
        class="mainBtnModify"
        @click="emit('backStep')"
        size="s"
      />
      <u-button
        :text="t(buttons + '.continue')"
        class="mainBtnModify"
        size="s"
        :disabled="props.payState !== 'todoBien'"
        @click="emit('nextStep')"
      />
    </div>
  </div>
</template>

<style scoped>
/* Container */
.step2_1 {
  width: 80vw;
  max-width: 1200px;
  height: auto;
  max-height: calc(85vh - 80px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media only screen and (max-width: 768px) {
  .step2_1 {
    width: calc(100vw - 40px);
    max-height: calc(100vh - 80px);
  }
  .step2__body-table {
    height: calc(100vh - 100px) !important;
  }
}

/* Alert */
.step2_1__alert {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px;
    border-radius: 12px;
    padding: 8px;
    border: 1px solid var(--danger-border-default);
}
.step2_1__alert span {
    font-size: 20px;
    line-height: 20px;
    color: var(--danger-text-default) !important;
}
.step2_1__alert p {
    font-weight: 400;
    font-size: 16px;
    line-height: 20px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: var(--neutral-text-body);
}
/* Title */
.step2_2__title {
    font-weight: 600;
    font-size: 16px;
    line-height: 20px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: var(--neutral-text-body);
}

/* Tabla */

.step2__body-table {
  overflow: auto;
  border-radius: 16px;
  border: 1px solid var(--neutral-border-light);
  height: calc(85vh - 80px - 80px - 44px - 32px - 206px);
  position: relative;
}

.step2__body-table::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.step2__body-table::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.step2__body-table-header {
  position: sticky;
  top: 0;
  z-index: 2;
}

.step2__body-table-header,
.step2_2__body-table-item {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(180px, 1fr) 130px minmax(180px, 1fr) 125px 160px 50px;
}

.step2__body-table-header .col {
  background-color: var(--neutral-surface-softer);
  border-bottom: 1px solid var(--neutral-border-light);
}

.col {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 46px;
}

.col span {
  width: 100%;
}

.col.name {
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.step2_2__body-table-item .col span {
  color: var(--neutral-text-body);
}

.income {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px;
  align-items: center;
  margin-top: 2px;
}

.income span {
  transition: 0.3s;
}

.income:hover span {
  color: var(--primary-text-default) !important;
}

.income span.u {
  font-size: 12px;
  color: var(--primary-text-subtle);
  font-weight: 400;
}

.col.name span:nth-child(2) {
  color: var(--neutral-text-caption);
  font-weight: 400;
  font-size: 12px;
}

.col.first {
  padding-left: 20px;
}

.col.last {
  padding-right: 20px;
}

.col.right span {
  text-align: right;
}

.col.colStatus {
  justify-content: flex-end;
}

.col.left {
  text-align: left;
}

.col.supplier {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 8px;
  padding-left: 20px;
}

.col span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  color: var(--neutral-text-caption);
}

.col a.tag {
  font-size: 12px;
  line-height: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 10px;
  text-align: center;
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 5px;
}

.col a.tag.OC {
  background-color: var(--info-surface-shadow-12a);
  color: var(--info-text-darker);
}
.col a.tag.OC span.u {
  color: var(--info-text-darker);
}

.col a.tag.FXR {
  background-color: var(--warning-surface-shadow-12a);
  color: var(--warning-text-darker);
}

.col a.tag.FXR span.u {
  color: var(--warning-text-darker);
}

.step2_2__body-table-item .col.first {
  gap: 8px;
}

.step2_2__body-table-item .col.first span {
  width: auto;
}

.step2_2__body-table-item .col {
  background-color: var(--neutral-background-default);
  transition: 0.3s;
}

.step2_2__body-table-item:hover .col {
  background-color: var(--primary-surface-shadow-8a);
}

.status {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  width: auto !important;
}
.status.forApproval {
  background-color: var(--warning-surface-light);
  color: var(--warning-text-darker) !important;
}
.status.inProcess {
  background-color: var(--info-surface-light);
  color: var(--info-text-darker) !important;
}
.status.rejected {
  background-color: var(--danger-surface-light);
  color: var(--danger-text-darker) !important;
}
.status.closed {
  background-color: var(--success-surface-light);
  color: var(--success-text-darker) !important;
}
.status.voided {
  background-color: var(--neutral-surface-light);
  color: var(--neutral-text-caption) !important;
}
.status.paid {
  background-color: var(--secondary-surface-light);
  color: var(--secondary-text-darker) !important;
}


/* header */
.step2_1__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.step2_1__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* footer */
.step2_2__footer {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
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
