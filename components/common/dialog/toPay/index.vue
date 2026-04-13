<script setup>
import { ref, computed, defineEmits, onMounted, onBeforeUnmount} from 'vue'; 
import usepaymentsStore from "@/stores/payments";
import { formatCurrency, convertToNumber } from "@/utils/formatAmount";
import useGlobalStore from "@/stores/global";
import { toast } from 'vue3-toastify';
import useUserStore from "@/stores/user";
import useOrganizationStore from "@/stores/organization";
const { $bus } = useNuxtApp();
  
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();
const paymentsStore  = usepaymentsStore();
const userStore = useUserStore();

const props = defineProps({
  lines: { type: Array, default: [] },
  mode: { type: String, default: "pagarDocumento" },
});

const currentStep = ref(2);
const isLoading = ref(true); // Bandera de carga

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape);
  $bus.$off("updatedStepPay");
  $bus.$off("CreateToPay");
  paymentsStore.clean();
});

// Función para manejar el evento Escape
const handleEscape = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    console.log('Tecla Escape presionada');
    $bus.$emit("closeDialog");
  }
};

onMounted(async () => {
  paymentsStore.getPaymentMethods();
  window.addEventListener('keydown', handleEscape);
  
  // Crear una copia no reactiva de las líneas
  const copiedLines = JSON.parse(JSON.stringify(props.lines)); 

  paymentsStore.toPay.lines = copiedLines.map(line => {
    if (props.mode == "pagarCompra") {
      line.outcomeId = line._id;
    } else {
      line.documentId = line._id;
    }
    delete line.archived;
    delete line.createdAt; 
    delete line.creator; 
    delete line.dates; 
    delete line.businessArea; 
    delete line.description; 
    delete line.documents; 
    delete line.dueDate; 
    delete line.files; 
    delete line.owner; 
    delete line.updatedAt; 

    if (line.currency.default === null) {
      console.log("currency faltante, recuperando desde la organización");
      line.currency.default = organizationStore.organization.currency;
    }

    line.totalPayable = { 
      number: line.numbers?.total.number, 
      value: formatCurrency(line.numbers?.total.number, line.currency.default, false) }; // Total a pagar
    line.totalPaid =  { number: line.numbers?.paid.number, value: "" }; // Total a pagar
    line.percentage = { number: 0, value: "" }; // Porcentaje relacionado al pago
    line.amountPaid = { number: 0, value: "" }; // Total pagado
    return line;
  });

  // Inicializar los valores de la sección de pago
  paymentsStore.toPay.mode = props.mode;
  paymentsStore.toPay.supplier = paymentsStore.toPay.lines[0].supplier;
  paymentsStore.toPay.totalToPay.value = "";
  paymentsStore.toPay.totalToPay.number = 0;
  paymentsStore.toPay.paymentMethod = "";
  paymentsStore.toPay.transactionNumber = "";
  paymentsStore.toPay.issueDate = "";
  paymentsStore.toPay.paymentDate = "";
  paymentsStore.toPay.createdBy._id = userStore.userSession._id;
  paymentsStore.toPay.createdBy.legalName = userStore.userSession.data.legalName;
  paymentsStore.toPay.createdBy.imgUrl = userStore.userSession.imgUrl;
  paymentsStore.toPay.reference = "";
  paymentsStore.toPay.observations = "";
  
  $bus.$on("updatedStepPay", (next) => {
    console.log("esta llegando a updatedStepPay");
    if (typeof next === 'number') {
      currentStep.value = next;
    }
  });

  $bus.$on("CreateToPay", () => {
    CreatePayment();
  });

  isLoading.value = false; // Termina el proceso
});


const CreatePayment = async () => {
  globalStore.loading = true;
  const resp = await paymentsStore.createPayment(); 
  console.log(resp);
  globalStore.loading = false;

  if (resp.success) {     
    paymentsStore.payment_active = resp.data;
    console.log(resp.data);
    console.log(paymentsStore.payment_active);
    if(paymentsStore.toPay.primaryFile){
      await paymentsStore.uploadFile(paymentsStore.payment_active._id, paymentsStore.toPay.primaryFile, "primary"); 
      await paymentsStore.getPaymentbyID(paymentsStore.payment_active._id); 
    }
    $bus.$emit('updatedStepPay', 6);
    $bus.$emit('refresh');
    $bus.$emit('refreshPayment');
  } else{
    console.log(resp.error);
  }
}

const emit = defineEmits(["nextStep", "prevStep"]);
const isPagarDocumento = computed(() => props.mode === "pagarDocumento");
const isPagarCompra = computed(() => props.mode === "pagarCompra");



</script>

<!-- Template Section -->
<template>
  <div v-if="!isLoading" class="container-modal">
    <DialogToPayStep1 v-if="currentStep === 1" :mode="props.mode" />
    <DialogToPayStep2 v-if="currentStep === 2" :mode="props.mode" />
    <DialogToPayStep3 v-if="currentStep === 3" :mode="props.mode" />
    <DialogToPayStep4 v-if="currentStep === 4" :mode="props.mode" />
    <DialogToPayStep5 v-if="currentStep === 5" :mode="props.mode" />
    <DialogViewPayment v-if="currentStep === 6" />
  </div>
</template>

<!-- CSS Section -->
<style scoped>
.container-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 24px;
}

.modal__title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.modal__loading {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
}
</style>
