<script setup>
import {
  ref,
  watch,
  computed,
  onMounted,
  onUnmounted,
  onBeforeMount,
} from "vue";
import useGlobalStore from "@/stores/global";
import useOutcomesStore from "@/stores/outcomes";
import useContactStore from "@/stores/contacts";
import labels from "@/utils/labels/common.json";
import useOrganizationStore from "@/stores/organization";
import { regexEmail, capitalizeName } from "@/utils/helpers";

// EventBus
const { $bus } = useNuxtApp();

$bus.$emit("updateDimensions", { width: "80vw", height: "90vh" });

// Stores
const globalStore = useGlobalStore();
const outcomesStore = useOutcomesStore();
const contactStore = useContactStore();
const organizationStore = useOrganizationStore();

const search = ref("");
const results = ref([]);
const loadingSearch = ref(false);
const currencyDefault = ref(organizationStore.organization.currency);

outcomesStore.toDocument.currency = currencyDefault;
const createDocument = async () => {
  globalStore.loading = true;

  // Clonar el contenido de 'toDocument' desde 'outcomesStore'
  const body = {
    ...outcomesStore.toDocument,
    lines: outcomesStore.toDocument_lines.filter(
      (line) => line.numbers.total.number !== 0
    ),
  };

  // Asignar valores al cuerpo del documento
  body.documentType = body.documentType._id;
  body.outcomes = [body.outcomes._id];
  body.creator.user = body.creator._id;
  body.idNumber = body.documentNumber;
  body.issueDate = body.issueDate;
  body.receiptDate = body.receiptDate;

  if (outcomesStore.toDocument.outcomes.type === "FXR") {
    const contact = body?.supplier?.contact;

    if (contact) {
      // Verificar si contact existe
      const processedContact =
        (typeof contact === "object" && contact?._id) ||
        (typeof contact === "string" && contact?.trim()) ||
        null;

      if (processedContact) {
        body.supplier.contact = processedContact;
      } else {
        delete body.supplier.contact;
        delete body._id;
      }
    }
    // Si contact no existe, no hacer nada
  }

  // Crear el documento sin archivo
  const resp = await outcomesStore.createDocument(body);
  console.log("resp", resp);
  if (resp.success) {
    $bus.$emit("reduceDocumented", body.lines);

    // Esperar la creación del documento antes de subir el archivo
    console.log(
      "outcomesStore.toDocument.primaryFile",
      outcomesStore.toDocument.primaryFile
    );
    if (outcomesStore.toDocument.primaryFile instanceof File) {
      await outcomesStore.uploadDocumentFile(
        outcomesStore.document_active._id,
        outcomesStore.toDocument.primaryFile,
        "primary"
      );
      await outcomesStore.getDocumentWithLines(
        outcomesStore.document_active._id
      );
    }
    $bus.$emit("refresh");
    $bus.$emit("refreshDocuments");
    $bus.$emit("updatedStepDocument");
  }

  globalStore.loading = false;
};

const readOnlyTax = computed(() => {
  return outcomesStore.toDocument.outcomes.type === "OC";
});

const TotalValidated = computed(() => {
  console.log("wenaaaaa", outcomesStore.toDocument.numbers);
  console.log("validaciones", outcomesStore.toDocument.validations);
  console.log("chao", outcomesStore.toDocument?.numbers?.total?.numberAprox);
  console.log("chabela", outcomesStore.toDocument?.validations?.maxMount);
  return (
    outcomesStore.toDocument.numbers.total.number != 0 &&
    outcomesStore.toDocument?.numbers?.total?.numberAprox <=
      outcomesStore.toDocument?.validations?.maxMount
  );
});

const linesValidated = computed(() => {
  // Verifica que 'toDocument_lines' exista y sea un array
  if (!Array.isArray(outcomesStore.toDocument_lines)) {
    return false; // Retorna false si no es un array
  }

  // Verifica si todas las líneas están validadas
  return outcomesStore.toDocument_lines.every(
    (linea) => linea?.validations?.validate ?? false
  );
});
</script>

<template>
  <div class="container-modal">
    <div class="container-modal__header">
      <span v-text="'Subir Documentar - Datos del Documento'"></span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        color="--neutral-text-caption"
        size="m"
        @click="$bus.$emit('closeAndBack')"
      />
    </div>

    <div class="container-modal__content">
      <div>
        <div class="header_container">
          <div class="info-avatar">
            <span class="info-avatar-document"
              >{{ outcomesStore?.toDocument.documentType.name }} N°{{
                outcomesStore?.toDocument.documentNumber
              }}</span
            >
            <span class="info-avatar-ref">{{
              outcomesStore?.toDocument.reference
            }}</span>

            <!-- Bloque con información adicional del proveedor -->
            <div class="info-avatar__details">
              <u-avatar
                :user="{
                  name:
                    outcomesStore?.toDocument?.supplier?.data?.legalName || '',
                  src: outcomesStore?.toDocument?.supplier?.imgUrl || '',
                }"
                :size="24"
              />
              <span>{{
                outcomesStore?.toDocument?.supplier?.data?.legalName || ""
              }}</span>
              <span>{{
                outcomesStore?.toDocument?.supplier?.data?.idNumber
              }}</span>
            </div>
          </div>

          <div class="card">
            <div class="card-item">
              <span :class="`u u-${TotalValidated ? 'success' : 'danger'}-outlined icon-alert`" ></span>
              <div class="doble-line">
                <span class="doble-line-firts">Subtotal</span>
                <span class="doble-line-second">{{
                  outcomesStore.toDocument.numbers.totalNet.value
                }}</span>
              </div>
            </div>
            <div class="card-item">
              <span :class="`u u-${TotalValidated ? 'success' : 'danger'}-outlined icon-alert`" ></span>
              <div class="doble-line">
                <span class="doble-line-firts">Impuestos</span>
                <span class="doble-line-second">{{
                  outcomesStore.toDocument.numbers.totalTaxAddition.value
                }}</span>
              </div>
            </div>
            <div class="card-item">
              <span :class="`u u-${TotalValidated ? 'success' : 'danger'}-outlined icon-alert`" ></span>
              <div class="doble-line">
                <span class="doble-line-firts">Retencion</span>
                <span class="doble-line-second">{{
                  outcomesStore.toDocument.numbers.totalRetencion.value
                }}</span>
              </div>
            </div>
            <div class="card-item">
              <span :class="`u u-${TotalValidated ? 'success' : 'danger'}-outlined icon-alert`" ></span>
              <div class="doble-line">
                <span class="doble-line-firts">Total</span>
                <span class="doble-line-second">{{
                  outcomesStore.toDocument.numbers.total.value
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="containerModal__table">
        <TableMiniGrid
          :showTotals="false"
          page="toDocument"
          propertyStoreTotals="toDocument"
          propertyStoreLines="toDocument_lines"
          :readOnlyTax="readOnlyTax"
        />
      </div>
      <div class="table-footer">
        <div>
          <span
            v-if="
              !TotalValidated &&
              outcomesStore.toDocument.numbers.total.number != 0
            "
            class="danger"
          >
            <span class="u u-info-circle danger"></span>
            {{ $t("CreateDocument.error.total.Exceeded") }}
          </span>
          <span v-else-if="!linesValidated" class="danger">
            <span class="u u-info-circle danger"></span>
            {{ $t("CreateDocument.error.lines.Exceeded") }}
          </span>
        </div>
        <div class="container-taxes-min">
          <table-taxes-min
            :heightList="outcomesStore.taxes.length * 32 + 'px'"
            :taxesList="outcomesStore.toDocument.numbers"
            :currencyFormat="outcomesStore.toDocument.currency.default"
            page="toDocument"
          />
        </div>
      </div>
    </div>
    <div class="container-modal__footer">
      <u-button
        :text="'Volver'"
        type="outlined"
        class="mainBtnModify"
        @click="$bus.$emit('updatedStepDocument', 2)"
      />
      <u-button
        :text="labels.modal.createOc.step1.buttons.next[globalStore.lang]"
        class="mainBtnModify"
        @click="createDocument()"
        :disabled="
          outcomesStore.toDocument.numbers.total.number == 0 ||
          (!TotalValidated && outcomesStore.outcome_active.type == 'OC')
        "
      />
    </div>
  </div>
</template>

<style scoped>
span,
label,
button {
  font-family: Nunito;
}

.icon-alert {
  font-size: 24px;
  line-height: 24px;
}
.icon-alert.u-danger-outlined:before  {
  color: var(--danger-text-default) !important;
}

/* Sections */
.container-modal {
  display: flex;
  flex-direction: column;

  width: 100%;
  height: 100%;
  gap: 24px;
}

.search-container {
  display: flex;
  gap: 10px;
  height: fit-content;
}
.search-bar {
  width: 100%;
  flex-grow: 1;
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
.container-modal__content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
  padding: 0 5px 2px 0;
}
.container-modal__footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.container-modal__content::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.container-modal__content::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

/* Sections */
.containerModal__body {
  display: flex;
  flex-direction: column;
  height: fit-content;
  padding: 15px 20px;
  row-gap: 20px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 0px 0px 10px 10px;
}

.header_container {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.Info_Avatar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.DobleLine {
  display: flex;
  flex-direction: column;
}

.DobleLine > span:first-of-type {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}
.DobleLine > span:last-of-type {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  text-align: left;
  color: var(--bg-neutral-500);
}

.containerModal__content-form {
  padding: 12px 12px 12px 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 48px;
  row-gap: 16px;
  direction: rtl;
}

.containerModal__content-form .group {
  height: 60px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  direction: ltr;
}
.containerModal__content-form .item--span-2 {
  grid-column: span 2;
  display: grid;
  align-items: center;
}
.containerModal__content-form .group label {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-body);
  display: grid;
  grid-template-columns: auto 1fr;
}
.containerModal__content-form .group span.optional {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-caption);
}

.document {
  padding: 10px 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--neutral-border-subtle);
  gap: 5px;
  border-radius: 10px;
}

.pill {
  font-size: 12px;
  position: absolute;
  top: 0px;
  right: 0px;
  color: var(--warning-surface-default);
  padding: 4px 8px;
  background-color: var(--warning-surface-light);
  border-radius: 10px;
}

.document__title {
  width: 100%;
  color: var(--neutral-surface-subtle);
  font-size: 10px;
  font-weight: 400;
}

.document__names {
  display: flex;
  gap: 10px;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}

.document__names > span {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  color: var(--primary-text-default);
}

.document__body {
  color: var(--neutral-text-body);
  display: flex;
  justify-content: space-between;
}

.document__values {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.money {
  text-wrap: nowrap;
  font-size: 14px;
  font-weight: 600;
}

.date {
  text-wrap: nowrap;
  font-size: 12px;
  font-weight: 400;
}

.table-footer {
  display: flex;
  justify-content: space-between;
}

.container-modal__content-title {
  width: 100%;
  height: 32px;
  background-color: var(--neutral-surface-light);
  padding: 0 24px;
  display: flex;
  align-items: center;
  border-left: 1px solid var(--neutral-border-subtle);
  border-right: 1px solid var(--neutral-border-subtle);
}

.container-modal__content-title.primary {
  border-top: 1px solid var(--neutral-border-subtle);
  border-radius: 10px 10px 0 0;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
}

.container-modal__content-title span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-body);
}

span.danger {
  color: var(--danger-text-default);
}

.card {
  justify-content: end;
  display: flex;
  flex-direction: row;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 10px;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 2px;
}

.card-item {
  align-items: center;
  justify-content: space-evenly;
  flex-direction: row;
  width: 150px;
  display: flex;
  padding: 8px;
}

.card-item:not(:first-child) {
  border-left: 1px solid var(--neutral-border-subtle);
}

.doble-line {
  display: flex;
  flex-direction: column;
}

.doble-line-firts {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-caption, #98a2b3);
}

.doble-line-second {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body, #545f72);
}

.info-avatar-document {
  text-transform: uppercase;
  font-weight: 400;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 10%;
  color: var(--secondary-text-default);
}
.info-avatar-ref {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: var(--neutral-text-body);
}
.info-avatar {
  display: flex;
  flex-direction: column;
  align-items: left; /* Alinea los elementos verticalmente en el centro */
}

.info-avatar__details {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-avatar__details > span {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

.container-taxes-min {
  width: 400px;
  align-self: self-end;
}

.contentLabel {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.loadMsg {
  color: var(--neutral-surface-subtle);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 5px;
}
.errorMsg {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  position: relative;
}
.errorMsg span,
.errorMsg button {
  color: var(--danger-surface-darker);
}
.errorMsg .u {
  animation: pulse ease-in-out 1s infinite;
  border-radius: 50%;
}
.minMenu {
  position: absolute;
  transition: 0.3s;
  transform-origin: center right;
  background-color: var(--neutral-background-default);
  padding: 16px 20px;
  border-radius: 10px;
  box-shadow: var(--shadow-2);
  z-index: 2;
  display: grid;
  grid-template-rows: auto auto;
  gap: 10px;
  max-width: 280px;
}
.minMenu span {
  color: var(--neutral-text-body);
}
.minMenu strong {
  color: var(--primary-text-default);
}
.minMenu button {
  width: auto;
  margin-left: auto;
  background-color: var(--primary-surface-default);
  color: var(--white);
  font-size: 12px;
  line-height: 12px;
  padding: 5px 10px;
  border-radius: 10px;
  transition: 0.3s;
}
.minMenu button:hover {
  background-color: var(--primary-surface-subtle);
}
.btnEmail {
  padding: 5px 20px !important;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(224, 85, 75, 0.3);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(224, 75, 75, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(224, 75, 75, 0);
  }
}

/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
.mainBtnModify {
  min-width: 135px;
}

.containerModal__table {
  overflow-x: auto;
  max-width: 100%;
  max-height: calc(100% - 274px - 28px);
}

.containerModal__table::-webkit-scrollbar,
.containerModal__content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.containerModal__table::-webkit-scrollbar-thumb,
.containerModal__content::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: var(--neutral-surface-light);
}

.containerModal__table::-webkit-scrollbar-track,
.containerModal__content::-webkit-scrollbar-track {
  background: var(--neutral-surface-subtle);
  border-radius: 4px;
}

.icon {
  font-size: 32px;
  color: var(--success-text-default);
}
</style>
