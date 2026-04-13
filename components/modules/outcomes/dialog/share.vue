<script setup>
import { ref, defineEmits, defineProps } from "vue";
import useOutcomesStore from "@/stores/outcomes";
import usePaymentsStore from "@/stores/payments";
import useBankingTransactionsStore from "@/stores/bankingTransactions";

// Stores
const outcomesStore = useOutcomesStore();
const paymentsStore = usePaymentsStore();
const bankingTransactionsStore = useBankingTransactionsStore();

const props = defineProps({
  module: {
    type: String,
    default: "outcome"
  }
})

// Emits
const emit = defineEmits(["closeModal"]);

// Constants
const { t } = useI18n();
const color = "--neutral-text-caption";
const module = "modules.outcomes.pages.oc.modals.share";
const saving = ref(false);

const sendEmailOutcome = async () => {
  saving.value = true;
  try {
    if(props.module === "outcome") {
      const body = { outcomeId: outcomesStore.outcome._id };
      await outcomesStore.sendEmailOutcome(body);
    } else {
      const body = { paymentId: bankingTransactionsStore.dataDetailsPayment._id };
      await paymentsStore.sendEmailPayment(body);
    }
    emit("closeModal");
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  } finally {
    saving.value = false;
  }
};


</script>

<template>
  <div class="share">
    <p>{{ t(module + ".title") }}</p>
    <div class="share__actions">
      <u-button
        type="outlined"
        :color="color"
        size="s"
        :text="t(module + '.buttons.cancel')"
        @click="emit('closeModal')"
        :disabled="saving"
      />
      <u-button
        :disabled="saving"
        icon="email"
        size="s"
        :text="t(module + '.buttons.send' + (saving ? 'ing' : ''))"
        @click="sendEmailOutcome"
      />
    </div>
  </div>
</template>

<style scoped>
.share {
  width: 450px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.share p {
  color: var(--neutral-text-body);
  font-size: 20px;
  text-align: center;
}
.share__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.share__actions button {
  width: 150px;
}
</style>
