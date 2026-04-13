<script setup>
import { ref, computed, defineEmits, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { formatDateString } from "@/utils/helpers";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import usePaymentsStore from "@/stores/payments";

// Stores
const outcomesStore = useOutcomesStore();
const globalStore = useGlobalStore();
const userStore = useUserStore();
const paymentsStore = usePaymentsStore();

// Emits
const emit = defineEmits(["closeModal"]);

// Constants
const { t } = useI18n();
const color = "--neutral-text-caption";
const module = "modules.outcomes.pages.oc.modals.paymentRequest";

// Computed
const outcome = computed(() => outcomesStore.outcome);
const supplier = computed(() => {
  const supplier = outcomesStore.outcome.supplier;
  const src = supplier.imgUrl;
  const name = supplier.data.legalName;
  const obj = { name, src };
  return obj;
});
const creator = computed(() => {
  const creator = outcomesStore.outcome.creator;
  const src = creator.user.imgUrl;
  const name = creator.user.data.legalName;
  const obj = { name, src };
  return obj;
});
const request = computed(() => {
  const request = userStore.userSession;
  const src = request.imgUrl;
  const name = request.data.legalName;
  const obj = { name, src };
  return obj;
});
const origin = computed(() => {
  if (outcomesStore?.outcome?.income?.length === 1) {
    const income = outcomesStore.outcome.income[0].name;
    const project = outcomesStore.outcome.income[0].project.name;
    return `${income} - ${project}`;
  }
  return t(module + ".texts.text4");
});

// Functions
const close = () => emit("closeModal");
const save = async () => {
  try {
    globalStore.loading = true;
    const idOutcome = outcome.value._id;
    await paymentsStore.requestPayment(idOutcome);
  } catch (error) {
    console.error(error);
  } finally {
    globalStore.loading = false;
    close();
  }
};
</script>

<template>
  <div class="payment">
    <div class="payment__header">
      <span>{{ t(module + ".title") }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        @click="close"
        type="outlined"
        size="s"
      />
    </div>
    <div class="payment__body">
      <span class="payment__body-text">{{ t(module + ".subtitle1") }}</span>
      <span class="payment__body-subtext">{{ t(module + ".subtitle2") }}</span>
      <div class="payment__body-card">
        <div class="payment__body-card-group">
          <span class="u u-role"></span>
          <span class="label">{{ t(module + ".groups.label1") }}</span>
          <div class="box avatar">
            <u-avatar :size="24" :user="request" />
            <span>{{ request.name }}</span>
          </div>
        </div>
        <div class="payment__body-card-group">
          <span class="u u-role"></span>
          <span class="label">{{ t(module + ".groups.label2") }}</span>
          <div class="box avatar">
            <u-avatar :size="24" :user="creator" />
            <span>{{ creator.name }}</span>
          </div>
        </div>
        <div class="payment__body-card-group">
          <span class="u u-shopping-cart"></span>
          <span class="label">{{ t(module + ".groups.label3") }}</span>
          <div class="box">
            <span
              >{{ outcome.tagManagementDoc }} - {{ outcome.reference }}</span
            >
          </div>
        </div>
        <div class="payment__body-card-group">
          <span class="u u-folder"></span>
          <span class="label">{{ t(module + ".groups.label4") }}</span>
          <div class="box">
            <span class="truncateText">{{ origin }}</span>
          </div>
        </div>
        <div class="payment__body-card-group">
          <span class="u u-calendar"></span>
          <span class="label">{{ t(module + ".groups.label5") }}</span>
          <div class="box">
            <span>{{
              formatDateString(outcome.issueDate, globalStore.lang)
            }}</span>
          </div>
        </div>
        <div class="payment__body-card-group">
          <span class="u u-user"></span>
          <span class="label">{{ t(module + ".groups.label6") }}</span>
          <div class="box avatar">
            <u-avatar :size="24" :user="supplier" />
            <span>{{ supplier.name }}</span>
          </div>
        </div>
        <div class="payment__body-card-group">
          <span class="u u-pay"></span>
          <span class="label">{{ t(module + ".groups.label7") }}</span>
          <div class="box">
            <span>{{ outcome.numbers.total.value }}</span>
          </div>
        </div>
      </div>
      <div class="payment__body-msg">
        <div class="payment__body-msg-title">
          <span class="u u-magic-wand"></span>
          <span>{{ t(module + ".texts.text1") }}</span>
        </div>
        <p>
          {{ t(module + ".texts.text2") }}
          <a href="/contacts" target="_blank" rel="noopener noreferrer">{{
            t(module + ".texts.text3")
          }}</a>
        </p>
      </div>
    </div>
    <div class="payment__actions">
      <u-button
        :text="t(module + '.buttons.cancel')"
        type="outlined"
        class="mainBtnModify"
        @click="close"
        size="s"
      />
      <u-button
        :text="t(module + '.buttons.send')"
        icon="email"
        class="mainBtnModify"
        @click="save"
        size="s"
      />
    </div>
  </div>
</template>

<style scoped>
.payment {
  width: 800px;
  height: 600px;
  display: grid;
  grid-template-rows: 36px 1fr 36px;
  gap: 24px;
}

/* header y actions */
.payment__header,
.payment__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
  width: 100%;
}
.payment__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* body */
.payment__body {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}
.payment__body-text {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.payment__body-subtext {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.payment__body-card {
  background-color: var(--neutral-surface-shadow-8a);
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.payment__body-card-group {
  display: grid;
  grid-template-columns: 16px 120px 1fr;
  align-items: center;
  column-gap: 16px;
  height: 28px;
}
.payment__body-card-group .label {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}
.payment__body-card-group .u {
  color: var(--neutral-text-caption);
  font-size: 18px;
  line-height: 18px;
}
.payment__body-card-group .box {
  display: grid;
  align-items: center;
}
.payment__body-card-group .box.avatar {
  grid-template-columns: 24px 1fr;
  column-gap: 12px;
}
.payment__body-card-group .box span {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.payment__body-msg {
  border: 1px solid var(--secondary-border-subtle);
  border-radius: 16px;
  padding: 12px;
  gap: 8px;
  display: flex;
  flex-direction: column;
}
.payment__body-msg-title {
  display: grid;
  grid-template-columns: 16px 1fr;
  gap: 8px;
  align-items: center;
}
.payment__body-msg-title span:not(.u) {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.payment__body-msg-title span.u {
  color: var(--secondary-text-default);
}
.payment__body-msg p {
  font-size: 14px;
  line-height: 18px;
  letter-spacing: 0%;
  color: var(--neutral-text-body);
  padding: 4px 12px;
  border-radius: 12px;
  background-color: var(--secondary-surface-shadow-8a);
}
.payment__body-msg p a {
  color: var(--secondary-text-darker);
  margin-left: 8px;
  transition: 0.3s;
  cursor: pointer;
  text-decoration: underline;
}
.payment__body-msg p a:hover {
  color: var(--secondary-text-subtle);
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  width: 135px;
}
</style>
