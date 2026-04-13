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
    }
  };
  fileInput.click();
};

const handleNextStep = () => {
  if (paymentsStore.toPay.paymentMethod.useBank) {
    $bus.$emit("updatedStepPay", 4);
  }else{
    $bus.$emit("CreateToPay");
  }
};

// Configuración del Bus de Eventos
const { $bus } = useNuxtApp();
$bus.$emit("updateDimensions", { width: "800px", height: "90vh" });

// Inicialización de `percentage` y `amountPaid` en cada línea

paymentsStore.toPay.issueDate = new Date().toISOString().substr(0, 10)
paymentsStore.toPay.paymentDate = new Date().toISOString().substr(0, 10)

</script>


<template>
  <div class="containerModal">
    <div class="container-modal__header">
      <span>
        {{ $t("topay.header." + props.mode) + " - " + $t("topay.subheader.step3") }}
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
      <span class="titulo_formulario">{{ $t("topay.subheader.step3") }}</span>
      <!-- Formulario -->
      <div class="container__form">

        <div class="group">
          <label><span class="icon u u-user"></span>{{ $t("topay.label.paymentMethod")}}</label>
          <u-select
            v-model="paymentsStore.toPay.paymentMethod.label"
            :options="paymentsStore.paymentsMethods"
            :placeholder="$t('topay.placeholder.paymentMethod')"
            :full-data="true"
            @full-data="
              (data) => {
                console.log(data);
                paymentsStore.toPay.paymentMethod = data;
              }
            "
          />
        </div>
        <div class="group" v-if="paymentsStore?.toPay?.paymentMethod?.useBank ">
          <label><span class="icon u u-star"></span>{{ $t("topay.label.transactionNumber")}}</label>
          <u-input
            v-model="paymentsStore.toPay.transactionNumber"
            :placeholder="$t('topay.placeholder.transactionNumber')"
          />
        </div>
        <div class="group">
          <label><span class="icon u u-star"></span>{{ $t("topay.label.issueDate")}}</label>
          <u-input
             type="date"
            v-model="paymentsStore.toPay.issueDate"
            :placeholder="$t('topay.placeholder.issueDate')"
          />
        </div>
        <div class="group">
          <label><span class="icon u u-star"></span>{{ $t("topay.label.paymentDate")}}</label>
          <u-input
            type="date"
            v-model="paymentsStore.toPay.paymentDate"
            :placeholder="$t('topay.placeholder.paymentDate')"
          />
        </div>
        <div class="group">
          <label><span class="icon u u-new-project"></span>{{ $t("topay.label.reference")}}</label>
          <u-input
            v-model="paymentsStore.toPay.reference"
            :placeholder="$t('topay.placeholder.reference')"
          />
        </div>
        <div class="group">
          <label><span class="icon u u-star"></span>{{ $t("topay.label.observations")}}</label>
          <u-textarea
            style="height: 100px"
            v-model="paymentsStore.toPay.observations"
            size="xl"
            :top="true"             
            :placeholder="$t('topay.placeholder.observations')"
          />
        </div>
      </div>

    </div>
    <div class="containerModal__footer">
      <u-button
        :text="'Cancelar'"
        @click="$bus.$emit('updatedStepPay', 2)"
      />
      <u-button
        :text="'Siguiente'"
        @click="handleNextStep()"
        :disabled="!paymentsStore.toPay.paymentMethod || !(paymentsStore.toPay.transactionNumber || !paymentsStore?.toPay?.paymentMethod?.useBank) || !paymentsStore.toPay.issueDate || !paymentsStore.toPay.paymentDate || !paymentsStore.toPay.reference "
      />
    </div>
  </div>
</template>
<style scoped>

 
/* Cambiar el color del ícono en modo oscuro usando ::v-deep */


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

.container__form{
  display: flex;
  flex-direction: column;
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
