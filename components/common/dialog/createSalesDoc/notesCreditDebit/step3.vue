<script setup>
import useSalesStore from "@/stores/sales";
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";
import { formatNormalDate } from "@/utils/helpers";
import { useI18n } from "vue-i18n";

// Translations I18n
const { t } = useI18n();
const module = "modules.sales.createCreditDebitNote";

//STORE
const salesStore = useSalesStore();
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();

//EMITS
const emit = defineEmits(["closeModal", "changeStep", "updatePadding"]);

const paymentsTermns = ref([]);

// Estados de validación del número de nota (credito/débito)
const numberNoteValidation = ref({
  isValidating: false,
  hasError: false,
  errorMessage: "",
});

//CONST
const formData = {
  credit: {
    tittle: "Datos de la Nota de Crédito",
    fields: [
      {
        text: "Referencia",
        icon: "new-project",
        placeholder: "Ingresa una referencia para el documento",
        type: "text",
        code: "reference",
        disabled: false,
      },
      {
        text: "N° de Nota de Crédito",
        icon: "hashtag",
        placeholder: "Ingresa el numero",
        type: "text",
        code: "noteNumber",
        numeric: true,
        disabled: false,
        validationKey: "noteNumber",
      },
      {
        text: "Condiciones de Pago",
        icon: "open-book",
        type: "selectPaymentCondition",
        code: "paymentCondition",
        disabled: false,
      },
      {
        text: "Fecha de Emisión",
        icon: "calendar",
        type: "date",
        code: "issueDate",
        disabled: false,
      },
      {
        text: "Fecha de Vencimiento",
        icon: "calendar",
        type: "date",
        code: "expirationDate",
        disabled: true,
      },
    ],
  },
};

//COMPUTED
const conditionOfPayOptions = computed(() => {
  return paymentsTermns.value.map((item) => ({
    label: item?.name?.[globalStore.lang] || "-",
    value: item._id,
    data: item,
  }));
});

const disabledContinue = computed(() => {
  const dataNote = salesStore.formCreditDebitNote?.formRegister?.dataNote;
  if (!dataNote) return true;

  return (
    !dataNote.reference ||
    !dataNote.noteNumber ||
    !dataNote.paymentCondition?.value ||
    !dataNote.issueDate ||
    !dataNote.expirationDate
  );
});

//FUNCTIONS

const filterNumbers = async (event, field, numeric) => {
  const value = event.target.value;

  if (field === "noteNumber") {
    validateNoteNumber(value);
  }

  if (numeric) {
    const numericValue = value.replace(/\D/g, "");
    salesStore.formCreditDebitNote.formRegister.dataNote[field] = numericValue;
  } else {
    salesStore.formCreditDebitNote.formRegister.dataNote[field] = value;
  }
};

const validateNoteNumber = debounce(async (noteNumber) => {
  // Si el número está vacío, no validamos
  if (!noteNumber || noteNumber.trim() === "") {
    numberNoteValidation.value.isValidating = false;
    numberNoteValidation.value.hasError = false;
    numberNoteValidation.value.errorMessage = "";
    return;
  }

  try {
    // Iniciamos la validación
    numberNoteValidation.value.isValidating = true;
    numberNoteValidation.value.hasError = false;

    // Preparamos el body para la validación
    const body = {
      number: noteNumber,
      salesDocumentType: salesStore.formCreditDebitNote.typeDocument._id,
      client:
        salesStore.formCreditDebitNote.formRegister.salesDocument[0].client
          ._id ||
        salesStore.formCreditDebitNote.formRegister.salesDocument[0].client
          .contact,
    };

    // Verificamos si el número ya existe
    const documentNumberExists =
      await salesStore.checkSalesDocumentNumber(body);

    if (documentNumberExists.success === false) {
      numberNoteValidation.value.hasError = false;
      numberNoteValidation.value.errorMessage = "";
    }
  } catch (error) {
    numberNoteValidation.value.hasError = true;
    numberNoteValidation.value.errorMessage = t(
      module + ".step3.invoice.inputsForm.invoiceNumber.check.inUse",
    );
  } finally {
    numberNoteValidation.value.isValidating = false;
  }
}, 500);

const handleChangeCondition = (condition) => {
  salesStore.formCreditDebitNote.formRegister.dataNote.paymentCondition = {
    value: condition.value,
    label: condition.label,
    allData: condition.data,
  };
};

const calculateExpirationDate = () => {
  const formDataNote = salesStore.formCreditDebitNote?.formRegister.dataNote;
  if (!formDataNote) return;

  const issueDate = formDataNote.issueDate
    ? new Date(formDataNote.issueDate)
    : null;
  const daysToPayment =
    formDataNote?.paymentCondition?.allData?.daysToPayment ?? null;

  if (!issueDate || daysToPayment === null) return;

  let expirationDate = new Date(issueDate);
  if (daysToPayment > 0) {
    expirationDate.setDate(expirationDate.getDate() + daysToPayment);
  }

  formDataNote.expirationDate = expirationDate.toISOString().slice(0, 10);
};

const closeStep = () => {
  emit("closeModal");
};

const nextStep = () => {
  emit("changeStep", true);
};

const backStep = () => {
  emit("changeStep", false);
};

// LIFECYCLE

watch(
  () => [
    salesStore.formCreditDebitNote?.formRegister?.dataNote?.issueDate,
    salesStore.formCreditDebitNote?.formRegister?.dataNote?.paymentCondition
      ?.value,
  ],
  calculateExpirationDate,
  { immediate: true },
);

onMounted(async () => {
  paymentsTermns.value = await paymentsStore.getPaymentTerms();
});
</script>

<template>
  <div class="container">
    <div class="header">
      <span>{{
        t(`${module}.step3.titleHeader`, {
          typeDoc: salesStore?.formCreditDebitNote?.typeDocument?.name,
        })
      }}</span>
      <u-button-icon
        icon="close"
        color="--neutral-text-caption"
        @action-btn="closeStep"
        type="outlined"
        style="border-radius: 50%"
      />
    </div>
    <div class="cardClient">
      <div>
        <span
          :title="`${
            salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(0)
              ?.salesDocumentType?.name
          } N°${
            salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(0)
              ?.number
          } `"
          class="body-xs-r"
          >{{
            `${
              salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                0,
              )?.salesDocumentType?.name
            } N°${
              salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                0,
              )?.number
            } `
          }}</span
        >
      </div>
      <div>
        <img
          :src="
            salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(0)
              ?.client?.imgUrl
          "
          alt="client logo"
          width="48"
          height="48"
        />
        <div>
          <span
            :title="
              salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                0,
              )?.reference
            "
            class="truncateText body-l-sb"
            >{{
              salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                0,
              )?.reference
            }}</span
          >
          <span
            :title="
              salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                0,
              )?.lines?.length > 1
                ? 'Varios Negocios'
                : salesStore?.formCreditDebitNote?.formRegister?.salesDocument
                    ?.at(0)
                    ?.lines?.at(0)?.referenceIncome?.name
            "
            class="truncateText body-m-sb"
            >{{
              salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                0,
              )?.lines?.length > 1
                ? "Varios Negocios"
                : salesStore?.formCreditDebitNote?.formRegister?.salesDocument
                    ?.at(0)
                    ?.lines?.at(0)?.referenceIncome?.name
            }}</span
          >
        </div>
        <div>
          <span
            :title="
              salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                0,
              )?.numbers?.totalPostCreditAndDebit?.value
            "
            class="truncateText body-m-sb"
            >{{
              salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                0,
              )?.numbers?.totalPostCreditAndDebit?.value
            }}</span
          >
          <span
            :title="
              formatNormalDate(
                salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                  0,
                )?.issueDate,
              )
            "
            class="truncateText body-s-sb"
            >{{
              formatNormalDate(
                salesStore?.formCreditDebitNote?.formRegister?.salesDocument?.at(
                  0,
                )?.issueDate,
              )
            }}</span
          >
        </div>
      </div>
    </div>
    <div class="line"></div>
    <div class="body">
      <!-- Content for Step 3 goes here -->
      <span class="body_header">{{
        t(`${module}.step3.subTitle`, {
          typeDoc: salesStore?.formCreditDebitNote?.typeDocument?.name,
        })
      }}</span>
      <div class="body_form">
        <div v-for="field in formData.credit.fields" class="data">
          <div class="data_izq">
            <span :class="`u u-${field.icon}`"></span>
            <span class="body-m-sb truncateText">{{
              t(`${module}.step3.inputs.${field.code}.label`, {
                typeDoc: salesStore?.formCreditDebitNote?.typeDocument?.name,
              })
            }}</span>
          </div>

          <div class="data_der">
            <u-input
              v-if="field.type === 'text'"
              v-model="
                salesStore.formCreditDebitNote.formRegister.dataNote[field.code]
              "
              :class="{
                'input-with-validation': field.validationKey === 'noteNumber',
                'input-validating':
                  field.validationKey === 'noteNumber' &&
                  numberNoteValidation.isValidating,
              }"
              :placeholder="field.placeholder"
              :type="field.type"
              :disabled="field.disabled"
              style="width: 100%"
              :error="
                field.validationKey === 'noteNumber'
                  ? numberNoteValidation.hasError
                  : false
              "
              @input="filterNumbers($event, field.code, field.numeric)"
            />

            <div
              v-if="
                field.validationKey === 'noteNumber' &&
                numberNoteValidation.isValidating
              "
              class="verifying"
            >
              <u-loading :width="16" />
              <span class="body-s-r">{{
                t(`${module}.step3.warnings.verifying`)
              }}</span>
            </div>

            <div
              v-else-if="
                field.validationKey === 'noteNumber' &&
                numberNoteValidation.hasError
              "
              class="verifying error"
            >
              <span class="u u-alert-circle"></span>
              <span class="body-s-r">{{
                numberNoteValidation.errorMessage
              }}</span>
            </div>

            <u-select
              v-if="field.type === 'selectPaymentCondition'"
              v-model="
                salesStore.formCreditDebitNote.formRegister.dataNote[field.code]
                  .label
              "
              :disabled="field.disabled"
              :options="conditionOfPayOptions"
              :full-data="true"
              style="width: 100%"
              @fullData="handleChangeCondition"
            />

            <u-calendar
              v-if="field.type === 'date'"
              v-model="
                salesStore.formCreditDebitNote.formRegister.dataNote[field.code]
              "
              :disabled="field.disabled"
              style="width: 100%"
            />
          </div>

          <!-- <div class="izq">
            <span class="u u-new-project"></span>
            <span>Referencia</span>
          </div>

          <div class="der">
               <u-input placeholder="Ingresa una referencia para la factura" />
          </div> -->
        </div>
      </div>
      <!-- Add more detailed content as needed -->
    </div>
    <div class="footer">
      <u-button
        :text="t(`${module}.buttons.back`)"
        type="outlined"
        @click="backStep"
      ></u-button>
      <u-button
        :text="t(`${module}.buttons.next`)"
        @click="nextStep"
        :disabled="disabledContinue"
      ></u-button>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-rows: auto auto auto 1fr auto;
  gap: 24px;
  height: 80vh;
  width: 80vw;
  max-height: 752px;
  max-width: 556px;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.header span {
  color: var(--neutral-text-body);
}

/* CARD CLIENT */
.cardClient {
  display: flex;
  flex-direction: column;
  height: 100px;
  width: 100%;
  border: 1px solid var(--neutral-border-light);
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
}

.cardClient > div:nth-child(1) {
  display: flex;
  align-items: center;
  height: 50%;
  width: 100%;
}

.cardClient > div:nth-child(1) > span:nth-child(1) {
  color: var(--neutral-text-caption);
  letter-spacing: 0.25px;
}

.cardClient > div:nth-child(2) {
  display: grid;
  grid-template-columns: 48px 339px 145px;
}

.cardClient > div:nth-child(2) img {
  border-radius: 50%;
}

.cardClient > div:nth-child(2) > div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 12px;
  gap: 4px;
}

.cardClient > div:nth-child(2) > div:nth-child(2) > span:nth-child(1) {
  color: var(--primary-text-default);
}

.cardClient > div:nth-child(2) > div:nth-child(2) > span:nth-child(2) {
  color: var(--neutral-text-body);
}

.cardClient > div:nth-child(2) > div:nth-child(3) {
  text-align: right;
}

.cardClient > div:nth-child(2) > div:nth-child(3) > span:nth-child(1) {
  color: var(--neutral-text-body);
}

.cardClient > div:nth-child(2) > div:nth-child(3) > span:nth-child(2) {
  color: var(--neutral-text-caption);
}

/* LINE */
.line {
  height: 1px;
  background-color: var(--neutral-border-subtle);
  width: 100%;
}

/* BODY */
.body {
  display: grid;
  grid-template-rows: 20px 1fr;
  gap: 24px;
  min-height: 0;
}

.body_header {
  display: flex;
  border-bottom: v-bind("borderLine");
  color: var(--neutral-text-body);
}

.body_form {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  gap: 8px;
  overflow-y: auto;
}

.body_form .data {
  display: grid;
  grid-template-columns: 180px 1fr;
  height: 48px;
}

.data_izq {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: var(--neutral-text-caption);
}

.data_der {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
}

/* FOOTER */
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Input Styles */
::v-deep(.inputs) {
  border: 0;
  border-radius: 8px;
  width: 100%;
}

/* Verifying and Error Styles */
/* Agregar padding cuando está verificando */
::v-deep(.input-validating input) {
  padding-right: 115px !important;
}

/* Ajustar el mensaje de verificación */
.verifying {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  height: auto;
  max-height: 32px;
  background-color: transparent;
  border-radius: 4px;
  color: var(--primary-text-default);
  pointer-events: none;
}

.verifying.error {
  background-color: transparent;
  color: var(--danger-text-default);
}

.verifying .body-s-r {
  font-size: 12px;
  line-height: 16px;
  font-weight: 400;
  white-space: nowrap;
}

.verifying .u {
  font-size: 14px;
}
</style>
