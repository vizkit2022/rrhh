<script setup>
import { ref, defineProps, onMounted, onUnmounted } from "vue";
import useGlobalStore from "@/stores/global";
import usepaymentsStore from "@/stores/payments";
import configTable from "@/utils/configTables/payments.json";

 
import { useI18n } from "vue-i18n";
// EventBus

const globalStore = useGlobalStore();
const paymentsStore = usepaymentsStore();
 

const { $bus } = useNuxtApp();


const { t, d } = useI18n(); // Obtener funciones para traducción de textos y fechas

const props = defineProps({
  closeDirect: {
    type: Boolean,
    default: false,
  },
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    CloseButton();
  }
};

onMounted(() => {
  //$bus.$emit("updateDimensions", { width: "800px", height: "90vh" });
  window.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscapeKey);
});

const actionTable = (obj) => {
  const { emit, data, pos } = obj;
  const emits = {
    delete: () => {
      console.log("Eliminar");
    },
    edit: () => {
      console.log("Editar");
    },
    new: () => {
      console.log("Nuevo");
    },
    show: () => {
      console.log("Mostrar");
    },
    deleteGlobal: () => {
      console.log("Eliminar Global");
    },
    openNewLink: () => {
      if (data?.url ?? "") {
        window.open(data.url, "_blank"); // Abre en una nueva pestaña
        console.log("Nuevo enlace abierto: " + data.url);
      } else {
        console.log("No hay URL disponible");
      }
    },

    showModalDocument: () => {
      OpenModalViewDocument(data?._id ?? "");

    },
  };
  emits[emit]();
};

// Stores


const uploadDocumentFileSecunday = async () => {
  // Crear un input tipo file para solicitar el archivo
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  // Aceptar imágenes y documentos (PDF, Word, Excel)
  fileInput.accept =
    "image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  fileInput.onchange = async () => {
    const file = fileInput?.files?.[0] ?? null;
    if (file) {
      globalStore.loading = true;
      try {
        const paymentId = paymentsStore.payment_active?._id ?? "";
        if (paymentId) {
          await paymentsStore.uploadDocumentFile(paymentId, file, "secondary");
          await paymentsStore.getDocumentWithLines(paymentId);
        } else {
          console.error("No hay ID de pago activo disponible.");
        }

      } catch (error) {
        console.error("Error al subir el archivo: ", error);
      } finally {
        globalStore.loading = false; // Se ejecuta siempre
      }
    }
  };
  // Simular un clic para abrir el cuadro de diálogo de selección de archivos
  fileInput.click();
};

const modoTab1 = ref(true);
const ChangeModoTab1 = () => {
  modoTab1.value = !modoTab1.value;
};

const CloseButton = () => {
  console.log("generando emit CloseModalPayment");
  $bus.$emit("CloseModalPayment");
};

const tabSelected = ref(0);
const tabs = [
  {
    label: "Detalles del Pago",
    icon: "",
    tab: 0,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: "Observaciones",
    icon: "",
    tab: 1,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: "Archivos",
    icon: "",
    tab: 2,
    indicator: false,
    disabled: false,
    main: false,
  },
];

const parseISODateAsUTC = (isoDate) => {
  const date = new Date(isoDate);
  const utcFormattedDate = date.toLocaleDateString('en-CA', { timeZone: 'UTC' });
  return utcFormattedDate;
};
</script>

<template>
  <div class="container-modal" >
    <div class="container-modal__header" >
      <div class="container-modal__header-left">
        <span v-text="paymentsStore?.payment_active?.reference ?? 'referencia del Pago'"></span>
        <span
          class="second-text"
          v-text="
            ' N° ' +
            (paymentsStore.payment_active?.transactionNumber ?? '123')
          "
        ></span>
        <span class="bubble" v-text="'Asignado'"></span>
      </div>

      <u-button-icon
        icon="close"
        class="btnIconModify"
        type="outlined"
        color="--neutral-text-caption"
        size="m"
        @click="CloseButton()"
      />
    </div>

    <div class="container-modal__content" >
      <div class="container-modal__content__info" >
        <div class="line">
          <div class="line__label">{{ $t("viewPayment.origin") }}</div>
          <div class="line__value">
            {{ paymentsStore.payment_active?.lines.length > 1 ? $t("topay.extras.variosOrigenes") : (paymentsStore.payment_active?.lines[0].outcomeId?.reference ?? paymentsStore.payment_active?.lines[0].documentId?.reference ?? "") }}
          </div>
        </div>
        <div class="line">
          <div class="line__label">{{ $t("viewPayment.emisor") }}</div>
          <div class="line__value">
            <div class="containerModal__body__subHeader__avatar">
              <u-avatar
                :user="{
                  name:
                    paymentsStore?.payment_active?.createdBy?.legalName ??
                    '',
                  src: paymentsStore?.payment_active?.createdBy?.imgUrl ?? '',
                }"
                :size="32"
              />
              <span
                >{{
                  paymentsStore?.payment_active?.createdBy?.legalName ??
                  ""
                }}
              </span>
            </div>
          </div>
        </div>
        <div class="line">
          <div class="line__label">{{ $t("viewPayment.receptor") }}</div>
          <div class="line__value">
            <div class="containerModal__body__subHeader__avatar">
              <u-avatar
                :user="{
                  name:
                    paymentsStore?.payment_active?.supplier?.data?.legalName ??
                    '',
                  src: paymentsStore?.payment_active?.supplier?.imgUrl ?? '',
                }"
                :size="32"
              />
              <span
                >{{
                  paymentsStore?.payment_active?.supplier?.data?.legalName ??
                  ""
                }}
              </span>
            </div>
          </div>
        </div>
        <div class="line">
          <div class="line__label">{{ $t("viewPayment.cuenta") }}</div>
          <div class="line__value">
            <div class="containerModal__body__subHeader__avatar">
              <u-avatar
                :user="{
                  name:
                    paymentsStore?.payment_active?.supplier?.data?.legalName ??
                    '',
                  src: paymentsStore?.payment_active?.supplier?.imgUrl ?? '',
                }"
                :size="32"
              />
              <span
                >{{
                  paymentsStore?.payment_active?.supplier?.data?.legalName ??
                  ""
                }}
              </span>
            </div>
          </div>
        </div>
        <div class="line">
          <div class="line__label">{{ $t("viewPayment.modalidad") }}</div>
          <div class="line__value">
            <span
              class="bubble"
              v-text="paymentsStore.payment_active?.paymentMethod.name"
            >
            
            </span>
          </div>
        </div>
        <div class="line" v-if="paymentsStore.payment_active?.paymentMethod.useBank">
          <div class="line__label">{{ $t("viewPayment.transactionNumber") }}</div>
          <div class="line__value">
            {{ paymentsStore?.payment_active?.transactionNumber ?? ''}}
          </div>
        </div>

        <div class="line">
          <div class="line__label">{{ $t("viewPayment.monto") }}</div>
          <div class="line__value">
            {{ paymentsStore?.payment_active?.lines.reduce((total, line) => total + line.amountPaid.number, 0) ?? '' }}
          </div>
        </div>

        <div class="line">
          <div class="line__label dates">{{ $t("viewPayment.dates") }}</div>
          <div class="Container__Box" style="width: fit-content">
            <div class="Doble_line">
              <span>{{ $t("viewPayment.Registro") }}</span>
              <span>{{
                paymentsStore?.payment_active?.createdAt
                  ? $d(
                      parseISODateAsUTC(
                        paymentsStore?.payment_active?.createdAt
                      ),
                      "short"
                    )
                  : "-"
              }}</span>
            </div>

            <div class="Doble_line">
              <span>{{ $t("viewPayment.pago") }}</span>
              <span>{{
                paymentsStore?.payment_active?.paymentDate
                  ? $d(
                      parseISODateAsUTC(
                        paymentsStore?.payment_active?.paymentDate
                      ),
                      "short"
                    )
                  : "-"
              }}</span>
            </div>

          </div>
        </div>
      </div>
      <u-tabs class="tabs" :tabs="tabs" v-model="tabSelected" />
      <template v-if="tabSelected == 0 ">
        <div class="transferencias">

          <div class="transferencias__elemento" v-for="line in paymentsStore.payment_active?.lines" :key="line._id">
            <div class="transferencias__elemento-top">
              <span v-if="line.outcomeId">{{ $t("viewPayment.outcome.title") }} N°{{line.outcomeId.correlative}}</span>
              <span v-if="line.documentId" >{{line.documentId.documentType.name}} N°{{line.documentId.documentNumber}}</span>

              <span>fecha</span>
            </div>

            <div class="transferencias__elemento-bottom">
              <div class="transferencias__elemento-left" v-if="line.outcomeId">
                <span class="transferencias__referencia">{{line.outcomeId?.reference ?? ""}}</span>
              
                <span class="transferencias__datos">
                  <span class="u u-folder"></span> 
                  {{line.outcomeId?.income?.name ?? ""}} - {{line.outcomeId?.income?.project?.name ?? ""}}
                </span> 
              </div>

              <div class="transferencias__elemento-left" v-if="line.documentId">
                <span class="transferencias__referencia">{{ line.documentId?.reference ?? "" }}</span>

                <span class="transferencias__datos">
                  <span class="u u-shopping-cart"></span>
                  {{ line?.documentId?.outcomes?.map(o => o.reference).join(', ') || "" }}
                </span>

                <span class="transferencias__datos">
                  <span class="u u-folder"></span>
                  {{ line?.documentId?.outcomes?.map(o => o.income?.name).join(', ') || "" }} - 
                  {{ line?.documentId?.outcomes?.map(o => o.income?.project?.name).join(', ') || "" }}
                </span>
              </div>

              <div class="transferencias__monto">
                <span>{{line.amountPaid.value}}</span>
              </div>
            </div>  
          </div>
        </div>
      </template>

      <template v-else-if="tabSelected == 1 ">
        <TableBasic
          :configTable="configTable.config2"
          :content="paymentsStore?.payment_active?.observations ? [{observations :paymentsStore.payment_active.observations}] : []"
        >
        </TableBasic>
      </template>

      <template v-else-if="tabSelected == 2 ">
        <TableBasic
          :configTable="configTable.config3"
          :content="paymentsStore?.payment_active?.files ?? []"
          @actionTable="actionTable"
        >
          <!-- Slot para hacer clic en el nombre del archivo -->
          <template v-slot:fileName="item">
            <!-- Extraer la extensión después del último punto y convertirla a mayúsculas -->
            <img
              class="thumbnail"
              loading="lazy"
              :src="`/img/iconsFile/${item.item.name
                .substring(item.item.name.lastIndexOf('.') + 1)
                .toUpperCase()}.svg`"
              alt="file icon"
            />
            {{ item.item.name }}
          </template>

          <template v-slot:fechaFormatted="item">
            <span v-if="item.item.date">
              {{ $d(new Date(item.item.date), "short") }}
            </span>
          </template>
        </TableBasic>

        <u-button
          icon="attach"
          text="Adjuntar Archivo"
          type="outlined"
          color="--bg-success-500"
          colorHover="--bg-success-600"
          colorActive="--bg-success-700"
          class="PayButton"
          @click="uploadDocumentFileSecunday"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
span,
label,
button {
  font-family: Nunito;
}

/* Sections */
.container-modal {
  display: flex;
  flex-direction: column;

  width: 100%;
  height: 100%;
  gap: 24px;
}

.bubble {
  color: var(--neutral-text-caption);
  background-color: var(--neutral-surface-light);
  padding: 4px 8px;
  border-radius: 12px;
  font-family: Nunito;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  align-content: center;
}

.container-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.container-modal__header > span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-body);
}
.container-modal__header-left {
  color: var(--neutral-text-body);
  display: flex;
  gap: 20px;
  align-items: center;
}

.container-modal__content__info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.PayButton {
  width: fit-content;
  align-self: end;
}

.Transferencias {
  gap: 24px;
  display: flex;
  flex-direction: column;
  align-items: left;
}

.line {
  min-height: 32px;
  display: flex;
  align-items: center;
}

.line__label {
  width: 170px; /* Ajusta el valor para aumentar el ancho */
  color: var(--neutral-text-caption);
  font-family: Nunito;
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  text-align: left;
}

.line__value {
  color: var(--neutral-text-body);
  font-family: Nunito;
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  flex: 1;
}

.dates {
  align-self: flex-start;
  margin-top: 4px;
}

::v-deep .indicator {
  border: 0px;
  margin: 0px;
  height: 50px;
  box-shadow: unset;
  padding: 0px; /* Agrega espaciado */
  /* Agrega más estilos según sea necesario */
}

::v-deep .indicator {
  border: 0px;
  margin: 0px;
  height: 50px;
  box-shadow: unset;
  padding: 0px; /* Agrega espaciado */
  /* Agrega más estilos según sea necesario */
}

.Container__Box {
  display: flex;
  flex-direction: row;
  width: 100%;
  border: 1px solid var(--bg-neutral-200, #d6dae1);
  height: 54px;
  gap: 24px;
  border-radius: 8px;
  border: 1px 0px 0px 0px;
  align-items: center;
}

.Container__separador {
  width: 100%;
}

.Container__separador:not(:last-child) {
  border-right: 1px solid var(--bg-neutral-200, #d6dae1);
}

.Doble_line {
  margin: 6px 0px;
  justify-content: center;
  width: 120px;
  height: 36px;
  gap: 0px;
  display: flex;
  flex-direction: column;
}
.Doble_line:first-child {
  margin-left: 12px;
}

.Doble_line:not(:last-child) {
  border-right: 1px solid var(--bg-neutral-200, #d6dae1);
  padding-right: 1px;
}

.Doble_line span:first-child {
  color: var(--neutral-text-caption);
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
}
.Doble_line span:last-child {
  color: var(--neutral-text-body);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  font-family: Nunito;
}

.container-modal__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.containerModal__body__subHeader {
  position: relative;
  padding-inline: 27px;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.containerModal__body__subHeader__avatar {
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

.second-text {
  color: var(--secondary-text-default);
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

.card__header span {
  color: var(--neutral-text-caption);
  font-size: 10px;
  font-weight: 400;
  line-height: 14px;
  letter-spacing: 0.1em;
  text-align: left;
}

.card__body {
  display: flex;
  flex-direction: row;
  text-wrap: nowrap;
  justify-content: space-between;
}

.card__info,
.card__value {
  display: flex;
  flex-direction: column;
}

.card__info-name {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--primary-text-default);
}

.card__info-date {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-body);
}

.card__value-money {
  font-size: 14px;
  font-weight: 800;
  line-height: 18px;
  text-align: right;
  color: var(--neutral-text-body);
}
.card__info-percentage {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--primary-text-default);
}

.additional-col2 {
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

.cellOrigin {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 2px;
  flex-direction: column;
}

.cellOrigin span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}

.cellOrigin span:nth-child(1) { color: var(--neutral-text-body); }
.cellOrigin span:nth-child(2) { color: var(--neutral-text-caption); }

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

.transferencias__elemento{
  padding: 8px;
  padding-inline: 16px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;

  display: flex;
  flex-direction: column;
  gap: 12px;
}
.transferencias__elemento-top{  
  padding-bottom: 4px;
  min-height: 28px;
  width: 100%;
  display: flex;
  justify-content : space-between;
  color: var(--neutral-text-caption);
  font-family: Nunito;
  font-size: 10px;
  font-weight: 400;
  line-height: 14px;
  letter-spacing: 0.1em;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  text-transform: uppercase;
  align-items: center;
  border-bottom: 1px solid var(--neutral-border-subtle);
}

.transferencias__elemento-bottom{
   
  display: flex;
  justify-content : space-between;
  color: var(--neutral-text-caption);
   
  align-items: center;
 
}
.transferencias__elemento-left{
    gap: 2px;
    display: flex;
    flex-direction: column;
}

.transferencias__referencia{ 
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  color: var(--primary-text-default);
}

.transferencias__datos{  
  font-family: Nunito;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  color: var(--neutral-text-caption);
}
.transferencias__monto{   
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: right;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
  color: var(--neutral-text-body);
}
</style>
