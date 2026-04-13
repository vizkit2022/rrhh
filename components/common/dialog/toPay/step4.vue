<script setup>
// Importaciones
import { ref, computed, onMounted } from "vue";
import { formatCurrency, convertToNumber } from "@/utils/formatAmount";
import useOrganizationStore from "@/stores/organization";
import usepaymentsStore from "@/stores/payments";

// Stores
const organizationStore = useOrganizationStore();
const paymentsStore = usepaymentsStore();

// Props
const props = defineProps({
  mode: String, // Modo: "pagarDocumento" o "pagarCompra"
});

// Variables y constantes
const currencyDefault = ref(organizationStore.organization.currency);
const lines = paymentsStore.toPay.lines;

const isPrimaryFileEmpty = computed(() => {
  const primaryFile = paymentsStore.toPay.primaryFile;
  return !(primaryFile instanceof File) || !primaryFile.name;
});

const handleFileUpload = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Guardar el archivo en paymentsStore.toPay.toDocument.primaryFile
      paymentsStore.toPay.primaryFile = file;
      console.log(file);
    }
  };
  fileInput.click();
};
const selectedBank = ref(null);

const handleNextStep = () => {
  
  if (paymentsStore.toPay.paymentMethod.useBank) {
    $bus.$emit("updatedStepPay", 5);
  }else{
    $bus.$emit("CreateToPay");
  }
};

// Configuración del Bus de Eventos
const { $bus } = useNuxtApp();
$bus.$emit("updateDimensions", { width: "800px", height: "90vh" });

const BankCounst = ref([
  { name: "Banco Estado", Type: "Cuenta Vista" ,  numeroCuenta: "123456789" , image: "https://yt3.googleusercontent.com/ytc/AIdro_n5FFD64KDH-_s9dM1XKo3AVY9Cte9a5VIAMzER9qpOkg=s900-c-k-c0x00ffffff-no-rj"},
  { name: "Scotiabank", Type: "Cuenta Corriente" , numeroCuenta: "123456789", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRs00v1Xb2q0yWRGDLnFNSGKxTyoLdecn0l0A&s"},
]);
// Inicialización de `percentage` y `amountPaid` en cada línea
</script>


<template>
  <div class="containerModal">
    <div class="container-modal__header">
      <span>
        {{ $t("topay.header." + props.mode) + " - " + $t("topay.subheader.step4") }}
      </span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        color="--neutral-text-caption"
        size="m"
        @click="$bus.$emit('CloseModalPayment')"
      />
    </div>
    <div class="containerModal__content">
      <!-- Montos y subir archivo -->
      <div class="container_header">
        <div class="container_header_montos">          
          <span class="monto_total">{{ formatCurrency(paymentsStore?.toPay?.totalToPay?.number || 0, currencyDefault.value) }}</span>
          <span class="monto_total_label">{{ $t("topay.label.totalAmountToPay") }}</span>
        </div>
      
        <u-button
          v-if="isPrimaryFileEmpty"
          size="s"
          icon="attach"
          :text="'Subir Documento'"
          type="outlined"
          color="--bg-primary-500"
          colorHover="--bg-primary-600"
          colorActive="--bg-primary-700"
          @click="handleFileUpload"
        />
        <OutcomesComponentsFileCard
          v-else
          :nombreArchivo="paymentsStore.toPay.primaryFile.name"
          page="modalDocumentar"
        />


      </div>
      <!-- Separador literal una linea -->
      <div class="separator"></div>
      <!-- Titulo formualrio -->
      <div class="form_titulo">
        <span class="titulo_formulario">{{ $t("topay.subheader.step4title") }}</span>
        
        <div class="addAcount">
          <span class="u u-new"></span>
          <span class="">{{ $t("topay.subheader.step4add") }}</span>
        </div>        
      </div>
      
      
      <!-- Formulario -->
      <div class="container__form">
        <div
          v-for="(bankCount, index) in BankCounst"
          :key="index"
          class="bank-option"
          @click="selectedBank = bankCount.name"
        >

          <div class="bank-info">
            <input
              type="radio"
              :name="'bankOption'"
              :value="bankCount.name"
              v-model="selectedBank"
              class="bank-option__radio"
            />
            <div class="bank-option__content">
              <div class="bank-option__content__title">
                <span>{{ bankCount.name }}</span>
                <span class="u u-edit"></span>
              </div>
              <div class="bank-option__content__subtitle">
                <span class="u u-credit-card"></span>
                <span>{{ bankCount.Type }}</span>
              </div>
              <div class="bank-option__content__subtitle">
                <span class="u u-hashtag"></span>
                <span>{{ bankCount.numeroCuenta }}</span>
              </div>
            </div>
          </div>
          <u-avatar
              :user="{
                name: '',
                src: bankCount.image || '',
              }"
              :size="32"
            />
        </div>
      </div>

    </div>
    <div class="containerModal__footer">
      <u-button
        :text="'Cancelar'"
        @click="$bus.$emit('updatedStepPay', 3)"
      />
      <u-button
        :text="'Siguiente'"
        @click="handleNextStep()"
        :disabled="!selectedBank"
      />
    </div>
  </div>
</template>
<style scoped>

.bank-option {
  border: 1px solid var(--neutral-border-light);
  background-color: var(--neutral-background-default);
  border-radius: 16px;
  padding-block: 8px;
  padding-inline: 16px;
  gap: 8px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.bank-option__radio {
  margin: 0px;
}

.bank-info{
  display: flex;
  gap: 8px;
}

.bank-option__content {
  display: flex;
  align-items: center;
  flex-direction: column;
  align-items: flex-start;
  gap : 4px;
}


.bank-option__content__title{
  gap: 4px;
  align-items: center;
  display: flex;
  height: 28px;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
}

.bank-option__content__subtitle{
  gap: 4px;
  display: flex;
  align-items: center;
  height: 20px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 400;
  color: var(--neutral-text-caption);
}
.u-credit-card, .u-hashtag {
  color: var(--primary-text-default);
}

.u{
  font-size: 20px;
}

.bank-option__image {
  width: 50px;
  height: 50px;
  margin-left: 1rem;
  object-fit: cover;
}

.separator{
  border-top: 1px solid var(--neutral-surface-harder);
}

.containerModal {
  display: grid;
  grid-template-rows: auto 1fr auto;
  width: 100%;
  height: 100%;
  gap: 16px;
}

.container-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.container-modal__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
}

.container_header_montos  {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.monto_total {
  color: var(--neutral-text-body);
  width: 600;
  font-size: 18px;
  line-height: 24px;
}
.monto_total_label {
  color: var(--neutral-text-caption);
  width: 600;
  font-size: 16px;
  line-height: 20px;
}
.containerModal__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  padding: 16px;
}

.containerModal__content::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.containerModal__content::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: var(--neutral-border-default); /* Variable para facilitar ajustes */
}

.containerModal__content::-webkit-scrollbar-track {
  border-radius: 5px;
  background-color: var(--neutral-border-darker); /* Color del track para contraste */
}

.containerModal__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.container_header {

  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.container_search {
  width: 100%;
}
.container_provedor_selected {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.supplier_info .legal-name {
  font-size: 18px;
  font-weight: 600;
}
.supplier_info .nickName {
  font-size: 16px;
  color: var(--neutral-text-caption);
}
.supplier_info .address {
  font-size: 14px;
  color: var(--primary-text-default);
}
.btnIconModify {
  border-radius: 50%;
}
.titulo_formulario {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
}

.addAcount{
  display: flex;
  align-items: center;
  color: var(--primary-text-default);
  gap: 4px;
  cursor: pointer;
}

.container__form{
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form_titulo{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.container__form .group {
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: none;
  gap: 8px;
}

.container__form .group label {
  display: flex;
  font-size: 14px;
  line-height: 18px;
  font-weight: 600;
  color: var(--neutral-text-caption);
  padding-top: 9px;
}

.container__form .group .icon {
  margin-right: 8px;
  font-size: 16px;
}

.container__form .group span.optional {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-caption);
}




</style>
