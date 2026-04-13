<script setup>
import { defineEmits, computed, defineProps } from "vue";
import useUserStore from "@/stores/user";
import usePaymentsStore from "@/stores/payments";
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import useGlobalStore from "@/stores/global";
import useOutcomesStore from "@/stores/outcomes";

// Stores
const userStore = useUserStore();
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();
const bankingTransactionsStore = useBankingTransactionsStore();
const outcomesStore = useOutcomesStore();

// Emits
const emit = defineEmits([
  "closeModal",
  "changeStep",
  "updateSection",
  "refresh",
]);

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.goToPay.step5";
const buttons = "modules.outcomes.pages.oc.modals.goToPay.buttons";
const error = ref(false);
const errorProp = ref("");
const { name } = useRoute();
const user = {
  _id: paymentsStore?.formGoToPay?.supplier?.contact?._id,
  isContact: true,
};

// EventBus
const { $bus } = useNuxtApp();

// Props
const props = defineProps({
  page: {
    type: String,
    default: "listOc",
  },
});

// Computed
const supplier = computed(() => ({
  name: paymentsStore?.formGoToPay?.supplier?.data?.legalName || "-",
  nickName: paymentsStore?.formGoToPay?.supplier?.data?.nickName || "-",
  email: paymentsStore?.formGoToPay?.supplier?.contact?.email || "-",
  src: paymentsStore?.formGoToPay?.supplier?.imgUrl || "",
}));
const getMsgAlert = computed(() => {
  if (errorProp.value === "") return "-";
  return t(module + `.msg.${errorProp.value}`);
});

// Functions
const save = async () => {
  if (
    paymentsStore.formGoToPay.originAccount !== "" &&
    paymentsStore.formGoToPay.destinationAccount !== ""
  ) {
    paymentsStore.formGoToPay.destinationBankAccounts = JSON.parse(
      JSON.stringify(paymentsStore.bankAccountsByUser),
    );
    let body = JSON.parse(JSON.stringify(paymentsStore.formGoToPay));
    const file = body.file;
    try {
      globalStore.loading = true;
      body.lines = body.lines.map((l) => {
        return {
          outcomeId: l._id,
          amountPaid: l.numbers.amountPaid,
        };
      });
      delete body.paymentMethodName;
      delete body.file;
      const resp = await paymentsStore.createPay(body);
      if (resp._id) {
        error.value = false;
        if (file instanceof File) {
          const resp2 = await paymentsStore.uploadPaymentFile(resp._id, file);
          console.log(resp2);
          if (resp2.success)
            bankingTransactionsStore.dataDetailsPayment = resp2.response;
        } else {
          bankingTransactionsStore.dataDetailsPayment = resp;
        }
        emit("changeStep", true);
        if (props.page === "listOc") {
          // Si estoy en el módulo de incomes
          if (name === "movementGrid") {
            emit("updateSection");
          } else {
            // Estoy en el modulo de compras
            emit("refresh");
          }
        } else if (props.page === "oc") {
          emit("updateSection");
        }
      } else {
        // Manejo de errores
        error.value = true;
        // Solo pagar de un proveedor - 409
        if (resp.status === 409) errorProp.value = "supplier";
        // ⁠Solo pagos en una currency 422
        else if (resp.status === 422) errorProp.value = "currency";
        // ⁠El estado del outcome no permite pagos de oc anuladas - 428
        else if (resp.status === 428) errorProp.value = "void";
        // ⁠El monto a pagar supera el monto pendiente - 406
        else if (resp.status === 406) errorProp.value = "amount";
        // ⁠El monto a pagar es menor o igual a cero - 400
        else if (resp.status === 400) errorProp.value = "cero";
      }
    } catch (error) {
      console.log(error);
      console.error(error);
    } finally {
      globalStore.loading = false;
    }
  }
};
const editSupplier = () => {
  userStore.dataSheet.alertCustom.show = false;
  setTimeout(() => {
    userStore.showModalDataSheet = true;
    userStore.dataSheet.state = "edit";
    userStore.showBtnBack = true;
    userStore.userDataSheetId =
      paymentsStore?.formGoToPay?.supplier?.contact?._id;
    $bus.$on("receiveContact", (receiveContact) => {
      paymentsStore.formGoToPay.supplier = {
        contact: receiveContact,
        data: receiveContact.data,
        imgUrl: receiveContact.imgUrl,
        payment: receiveContact.payment,
      };
    });
  }, 10);
};
const backStep = () => {
  paymentsStore.formGoToPay.destinationBankAccounts = JSON.parse(
    JSON.stringify(paymentsStore.bankAccountsByUser),
  );
  emit("changeStep", false);
};
const bankAccountSelected = (id) => {
  paymentsStore.formGoToPay.destinationAccount = id;
};

// ESCAPE
// const handleEscClose = (e) => {
//   emit("closeModal");
// }

// Mounted
onMounted(() => {
  // document.addEventListener("keydown", handleEscClose)
  paymentsStore.bankAccountsByUser =
    paymentsStore.formGoToPay.destinationBankAccounts;
});

// onUnmounted(() => {
//   document.removeEventListener("keydown", handleEscClose);
// })

const childRef2 = ref(null);
const createAccount = () => {
  childRef2.value?.save();
};
</script>

<template>
  <div class="step5">
    <div class="step5__header">
      <span v-text="t(module + '.title2')"></span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        :color="color"
        @action-btn="emit('closeModal')"
        type="outlined"
        size="s"
      />
    </div>
    <div class="step5__body">
      <div class="step5__body-header">
        <u-avatar :size="64" :user="supplier" />
        <div class="step5__body-header-text">
          <div class="title">
            <span v-text="supplier.name"></span>
            <span class="u u-verify"></span>
          </div>
          <span class="text" v-text="supplier.nickName"></span>
          <span class="email" v-text="supplier.email"></span>
        </div>
        <u-button-icon
          class="step5__body-header-button"
          icon="edit"
          :title="t(module + '.buttons.edit')"
          size="s"
          @click="editSupplier"
        />
      </div>
      <div class="line"></div>
      <div class="alert" v-if="error">
        <span class="u u-info-circle"></span>
        <span v-text="getMsgAlert"></span>
      </div>
      <div class="step3__body-container">
        <div class="step3__body-container-subTitle">
          <span v-text="t(module + '.subTitle')" class="subTitle"></span>
        </div>
        <DialogCoverInfoCardsPayMethod
          ref="childRef2"
          :refresh="false"
          width="700px"
          maxHeight="320px"
          :user="user"
          :bankAccountSelected="true"
          @bankAccountSelected="bankAccountSelected"
          :unknownAccount="true"
          :initial-bank-account-id="
            paymentsStore.formGoToPay.destinationAccount
          "
        />
      </div>
    </div>
    <div class="step5__footer">
      <u-button
        :text="t(buttons + '.back')"
        type="outlined"
        class="mainBtnModify"
        @click="backStep"
        size="s"
        style="width: 135px"
      />
      <u-button
        v-if="childRef2?.showForm"
        :text="t(buttons + '.account')"
        @click="createAccount"
        size="s"
        style="width: 135px"
      />
      <u-button
        v-else
        :text="t(buttons + '.create')"
        class="mainBtnModify"
        @click="save"
        size="s"
        style="width: auto; padding: 0 36px"
        :disabled="paymentsStore.formGoToPay.destinationAccount === ''"
      />
    </div>
  </div>
</template>

<style scoped>
.step5 {
  width: 700px;
  height: auto;
  display: grid;
  grid-template-rows: 40px 1fr 40px;
  gap: 16px;
}

/* header */
.step5__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.step5__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

/* body */
.step5__body {
  height: 100%;
  display: grid;
  grid-template-rows: 64px 1px 1fr;
  gap: 24px;
}

.line {
  background-color: var(--neutral-border-subtle);
  height: 1px;
  width: 100%;
}

.step5__body-header {
  height: 64px;
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 16px;
  grid-template-areas: "avatar text";
  align-items: center;
  position: relative;
}

.step5__body-header-text {
  display: flex;
  flex-direction: column;
}

.step5__body-header .title {
  display: flex;
  gap: 16px;
}

.step5__body-header .title span {
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step5__body-header span.text {
  font-weight: 600;
  font-size: 18px;
  line-height: 18px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.step5__body-header span.email {
  font-weight: 600;
  font-size: 16px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--primary-text-default);
}

.step5__body-header-avatar {
  grid-area: avatar;
}

.step5__body-header-title {
  grid-area: title;
}

.step5__body-header-subTitle {
  grid-area: subTitle;
}

.step5__body-header-email {
  grid-area: email;
}

.step5__body-header-button {
  position: absolute;
  left: 40px;
  bottom: -5px;
  border-radius: 50%;
  transform: scale(0.8);
  box-shadow: var(--elevation-xs);
}

.subTitle {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step3__body-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step5__body-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
  padding-right: 10px;
  height: calc(85vh - 80px - 80px - 44px - 32px - 120px);
}

.step5__body-cards::-webkit-scrollbar {
  width: 8px;
  height: 0px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.step5__body-cards::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.step5__body-card {
  display: grid;
  grid-template-columns: auto 1fr 40px;
  gap: 20px;
  padding: 16px;
  box-sizing: border-box;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  align-items: center;
}

.step5__body-card-details {
  display: flex;
  flex-direction: column;
}

.step5__body-card-details-title,
.step5__body-card-details-account {
  display: flex;
  gap: 10px;
  align-items: center;
}

.step5__body-card-details-title span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}

.step5__body-card-details-account span:nth-child(1) {
  font-size: 17px;
  color: var(--primary-text-default);
}

.step5__body-card-details-account span:nth-child(2) {
  font-weight: 400;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-caption);
}

.step3__body-container-subTitle {
  display: flex;
  justify-content: space-between;
}

.alert {
  display: grid;
  grid-template-columns: auto 1fr;
  border: 1px solid var(--danger-border-default);
  border-radius: 10px;
  padding: 0 10px;
  box-sizing: border-box;
  gap: 12px;
  align-items: center;
  height: 60px;
}

.alert span:nth-child(1) {
  font-size: 28px;
  color: var(--danger-border-default);
}

.alert span:nth-child(2) {
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  font-weight: 600;
  color: var(--neutral-text-body);
}

/* footer */
.step5__footer {
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
</style>
