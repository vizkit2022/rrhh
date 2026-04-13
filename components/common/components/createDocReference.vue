<script setup>
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import { useI18n } from "vue-i18n";
import {
  formatCurrency,
  convertToNumber,
  getValueFormaRealTime,
} from "@/utils/formatAmount";

// Translations I18n
const { t } = useI18n();
const module = "modules.sales.createSale";
const module2 = "modules.sales.sale.tabs.tab5.information.groups[1]";

// STORES
const salesStore = useSalesStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

//PROPS
const props = defineProps({
  editDocReference: {
    type: Boolean,
    default: false,
  },
});

// EMITS
const emit = defineEmits(["closeModal"]);

//CONST
const showAddDocReference = ref(false);

const formData = {
  client: {
    title: "step3.client.titleHeader",
    fields: [
      {
        icon: "user",
        text: "step3.client.inputsForm.legalName.label",
        type: "text",
        placeholder: "step3.client.inputsForm.legalName.placeholder",
        code: "legalName",
        disabled: false,
      },
      {
        icon: "id",
        text: "step3.client.inputsForm.numberID.label",
        type: "text",
        placeholder: "step3.client.inputsForm.numberID.placeholder",
        code: "numberID",
        disabled: false,
      },
      {
        icon: "work",
        text: "step3.client.inputsForm.economicActivity.label",
        type: "text",
        placeholder: "step3.client.inputsForm.economicActivity.placeholder",
        code: "economicActivity",
        disabled: false,
      },
      {
        icon: "world",
        text: "step3.client.inputsForm.country.label",
        type: "searchGoogle",
        placeholder: "step3.client.inputsForm.country.placeholder",
        code: "country",
        disabled: false,
      },
      {
        icon: "address",
        text: "step3.client.inputsForm.city.label",
        type: "searchGoogle",
        placeholder: "step3.client.inputsForm.city.placeholder",
        code: "city",
        disabled: false,
      },
      {
        icon: "location",
        text: "step3.client.inputsForm.address.label",
        type: "searchGoogle",
        placeholder: "step3.client.inputsForm.address.placeholder",
        code: "address",
        disabled: false,
      },
    ],
  },
  docReference: {
    title: "Documentos Referenciados ",
    fields: [
      {
        icon: "file-text",
        text: "Tipo",
        type: "selectTypeDocument",
        placeholder: "Selecciona un tipo de documento",
        code: "typeDocument",
      },
      {
        icon: "hashtag",
        text: "Número",
        type: "text",
        placeholder: "Ingresa el número del documento",
        code: "numberDocument",
        numeric: true,
      },
      {
        icon: "calendar",
        text: "Fecha",
        type: "date",
        placeholder: "Ingresa la fecha del documento",
        code: "dateDocument",
      },
      {
        icon: "dollar-sign",
        text: "Monto",
        type: "inputFormatNumber",
        placeholder: "Ingresa el monto del documento",
        code: "amountDocument",
        numeric: true,
      },
      {
        icon: "link",
        text: "Adjunto",
        type: "file",
        placeholder: "Selecciona un archivo para adjuntar",
        code: "fileDocument",
      },
    ],
  },
};

//COMPUTED

// crrency de la org
const currency = computed(() => {
  return salesStore?.sale?.salesDoc?.currency?.default;
});

// Verifica si el formulario de documentos referenciados esta lleno
const isDocReferenceFormFilled = computed(() => {
  const {
    typeDocument,
    numberDocument,
    dateDocument,
    amountDocument,
    fileDocument,
  } = salesStore.formDocInvoice.formRegister.formDataDocReference;

  return (
    typeDocument.name !== "" &&
    numberDocument !== "" &&
    dateDocument !== "" &&
    amountDocument?.total?.number !== 0 &&
    fileDocument !== null
  );
});

const docReferenceView = computed(() => {
  // Si editDocReference prop es true, siempre mostrar el formulario
  if (props.editDocReference) return "form";

  const hasDocs =
    salesStore.formDocInvoice.formRegister.documentReferences.length > 0;

  if (showAddDocReference.value) return "form";
  return hasDocs ? "list" : "form";
});

// FUNTIONS

//HELPERS
// funcion para clonar doc reference para editarlo
function cloneDocReference(doc) {
  return {
    typeDocument: { ...doc.typeDocument },
    numberDocument: doc.numberDocument,
    dateDocument: doc.dateDocument,
    amountDocument: {
      total: { ...doc.amountDocument.total },
    },
    fileDocument: doc.fileDocument,
  };
}

// Funciones Bases de creacion de documentos referenciados
const addDocReference = () => {
  salesStore.formDocInvoice.formRegister.documentReferences.push({
    ...salesStore.formDocInvoice.formRegister.formDataDocReference,
  });

  // Resetear el formulario
  resetFormDocReference();
  initCurrencyAmountDocRef();
  showAddDocReference.value = false;
};

const closeAddDocReference = () => {
  resetFormDocReference();
  initCurrencyAmountDocRef();
  showAddDocReference.value = false;
};

const editDocReference = (item, index) => {
  salesStore.formDocInvoice.formRegister.formDataDocReference = {
    ...cloneDocReference(item),
    editing: true,
    index,
  };
  showAddDocReference.value = true;
};

const deleteDocReference = (item) => {
  const index =
    salesStore.formDocInvoice.formRegister.documentReferences.indexOf(item);
  if (index !== -1) {
    salesStore.formDocInvoice.formRegister.documentReferences.splice(index, 1);
  }
};

const updateDocReference = (item) => {
  const index = item.index;

  salesStore.formDocInvoice.formRegister.documentReferences[index] = item;
  item.editing = false;
  resetFormDocReference();
  showAddDocReference.value = false;
};

const handleChangeDocument = (doc) => {
  salesStore.formDocInvoice.formRegister.formDataDocReference.typeDocument = {
    id: doc.id,
    name: doc.label,
    allData: doc.data,
  };
};

const handleFileUpload = () => {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept =
    ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.bmp,.webp";

  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSize) {
      toast.error(t(`${module}.step3.docReference.toastify.maxSizeFile`), {
        autoClose: 3000,
      });
      return;
    }

    if (file.type.startsWith("video/")) {
      return;
    }

    salesStore.formDocInvoice.formRegister.formDataDocReference.fileDocument =
      file;
  };

  fileInput.click();
};

const typeReferenceOptions = computed(() => {
  return salesStore.typesDocuments.map((type) => ({
    label: type?.name || "-",
    id: type._id,
    data: type,
  }));
});

// ============================================
// UTILIDADES DOCUMENTOS DE REFERENCIA
// ============================================

const initCurrencyAmountDocRef = () => {
  if (
    salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument
      .total.value !== "0"
  )
    return;

  const currency = organizationStore?.organization?.currency || "USD";

  const { value, lastValue } =
    salesStore?.formDocInvoice?.formRegister?.formDataDocReference
      ?.amountDocument?.total;

  salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument.total.value =
    formatCurrency(value, currency);

  salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument.total.lastValue =
    formatCurrency(lastValue, currency);
};

const resetFormDocReference = () => {
  salesStore.formDocInvoice.formRegister.formDataDocReference = {
    typeDocument: { id: "", name: "", allData: {} },
    numberDocument: "",
    dateDocument: new Date().toISOString().slice(0, 10),
    amountDocument: {
      total: {
        value: "0",
        lastValue: "0",
        number: 0,
        lastNumber: 0,
      },
    },
    fileDocument: null,
  };
};

const filterNumbers = (event) => {
  const value = event.target.value;
  const numericValue = value.replace(/\D/g, "");
  event.target.value = numericValue;
};

const selectAll = (event) => {
  event.target.select();
};

const onValueAmount = (event) => {
  const currency = {
    ...salesStore.formDocInvoice.formRegister.formDataInvoice.currency,
  };
  const rawValue = event.target.value;

  // Si está vacío, resetear
  if (rawValue === "") {
    salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument =
      {
        total: {
          value: "",
          lastValue: "",
          number: 0,
          lastNumber: 0,
        },
      };
    return;
  }

  // Usar el helper de formateo en tiempo real
  const numbers = getValueFormaRealTime(rawValue, currency, "amount");

  if (numbers) {
    const currentAmount =
      salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument
        .total;

    // Guardar el valor anterior antes de actualizar
    currentAmount.lastValue = currentAmount.value;
    currentAmount.lastNumber = currentAmount.number;

    // Actualizar con los nuevos valores
    currentAmount.number = numbers.numericValue;
    currentAmount.value = formatCurrency(numbers.numericValue, currency.value);
    currentAmount.tempValue = numbers.formattedValue;
  }
};

const onFocusAmount = async (event) => {
  const amount =
    salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument
      .total;

  // Guardar el valor numérico para mostrarlo sin formato
  amount.tempValue = amount.number || 0;

  await nextTick();
  event.target.select();
};
const onBlurAmount = (event) => {
  const amount =
    salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument
      .total;
  try {
    // Formatear el valor al perder el foco
    amount.value = formatCurrency(amount.number, currency.value, true);
    delete amount.tempValue;
  } catch (error) {
    console.error("Error al formatear el valor:", error);
    amount.number = 0;
    amount.value = "";
    delete amount.tempValue;
  }
};

//EXPOSE
defineExpose({
  isDocReferenceFormFilled,
  addDocReference,
  docReferenceView,
});

onMounted(async () => {
  initCurrencyAmountDocRef();
  await salesStore.getTypeDocuments();
});
</script>
<template>
  <div class="body_content">
    <div class="container_data_client">
      <div class="container_data">
        <!-- ==================== LISTA DE DOCUMENTOS ==================== -->
        <!-- Solo mostrar la lista si NO está en modo editDocReference -->
        <div
          v-if="
            !props.editDocReference &&
            showAddDocReference === false &&
            salesStore.formDocInvoice.formRegister.documentReferences.length > 0
          "
          class="container_buttons"
        >
          <span class="body-m-sb" v-text="t(`${module2}.label`)"></span>
          <u-button
            :text="t(`${module}.step3.docReference.buttons.addDocument`)"
            size="xs"
            type="none"
            icon="new"
            @click="showAddDocReference = true"
            :disabled="
              showAddDocReference ||
              salesStore.formDocInvoice.formRegister.documentReferences
                .length === 0
            "
          />
        </div>
        <div
          v-for="(item, index) in salesStore.formDocInvoice.formRegister
            .documentReferences"
          v-if="!props.editDocReference && docReferenceView === 'list'"
          class="data_doc_reference"
          :key="item.numberDocument"
        >
          <div class="izq">
            <span class="body-m-sb" style="color: var(--neutral-text-body)">
              {{ item.typeDocument.name }}
            </span>
            <div class="content_number">
              <span
                class="u u-hashtag"
                style="color: var(--primary-text-default)"
              ></span>
              <span class="body-s-r">N° {{ item.numberDocument }}</span>
            </div>
            <div class="content_date">
              <span
                class="u u-calendar"
                style="color: var(--primary-text-default)"
              ></span>
              <span class="body-s-r">{{ item.dateDocument }}</span>
            </div>
          </div>
          <div class="der">
            <u-button-icon
              icon="edit"
              type="text"
              size="s"
              @click="editDocReference(item, index)"
            />
            <u-button-icon
              icon="delete"
              type="text"
              size="s"
              color="--danger-text-default"
              color-hover="--danger-text-darker"
              color-active="--danger-text-subtle"
              @click="deleteDocReference(item)"
            />
          </div>
        </div>

        <!-- ==================== FORMULARIO DE DOCUMENTO ==================== -->
        <div v-if="docReferenceView === 'form'" class="data_form_doc_reference">
          <div class="container_addDocument">
            <div class="header_addDocument">
              <span class="body-m-sb">{{
                props.editDocReference
                  ? t(`${module}.step3.docReference.subTitle`)
                  : t(`${module}.step3.docReference.titleForm`)
              }}</span>
              <!-- Solo mostrar acciones si NO está en modo editDocReference -->
              <div v-if="!props.editDocReference" class="actions">
                <u-button-icon
                  :icon="
                    salesStore.formDocInvoice.formRegister.formDataDocReference
                      .editing
                      ? 'edit'
                      : 'save'
                  "
                  size="s"
                  type="outlined"
                  :disabled="!isDocReferenceFormFilled"
                  @click="
                    () => {
                      salesStore.formDocInvoice.formRegister
                        .formDataDocReference.editing
                        ? updateDocReference(
                            salesStore.formDocInvoice.formRegister
                              .formDataDocReference,
                          )
                        : addDocReference();
                    }
                  "
                />
                <u-button-icon
                  icon="close"
                  size="s"
                  type="text"
                  color="--neutral-text-caption"
                  @click="closeAddDocReference"
                  :disabled="
                    salesStore.formDocInvoice.formRegister.documentReferences
                      .length === 0
                  "
                />
              </div>
              <!-- Si está en modo editDocReference, mostrar solo el botón de editar -->
              <!-- <div v-else class="actions">
                <u-button-icon
                  icon="edit"
                  size="s"
                  type="outlined"
                  :disabled="!isDocReferenceFormFilled"
                  @click="
                    updateDocReference(
                      salesStore.formDocInvoice.formRegister
                        .formDataDocReference
                    )
                  "
                />
              </div> -->
            </div>

            <div class="body_addDocument">
              <div
                v-for="item in formData?.docReference?.fields"
                class="container_input"
                :key="item.code"
              >
                <div class="izq">
                  <span :class="`u u-${item.icon}`"></span>
                  <span class="body-m-sb">{{
                    t(
                      `${module}.step3.docReference.inputsForm.${item.code}.label`,
                    )
                  }}</span>
                </div>

                <div class="der">
                  <!-- Select de tipo de documento -->
                  <u-select
                    v-if="item.type === 'selectTypeDocument'"
                    v-model="
                      salesStore.formDocInvoice.formRegister
                        .formDataDocReference.typeDocument.name
                    "
                    border-style="none"
                    borderRadius="8px"
                    :options="typeReferenceOptions || []"
                    :placeholder="
                      t(
                        `${module}.step3.docReference.inputsForm.${item.code}.placeholder`,
                      )
                    "
                    size="m"
                    style="width: 100%"
                    :full-data="true"
                    @full-data="handleChangeDocument"
                  />

                  <!-- Input de texto -->
                  <u-input
                    v-if="item.type === 'text'"
                    v-model="
                      salesStore.formDocInvoice.formRegister
                        .formDataDocReference[item.code]
                    "
                    class="inputs"
                    :placeholder="
                      t(
                        `${module}.step3.docReference.inputsForm.${item.code}.placeholder`,
                      )
                    "
                    size="m"
                    style="width: 100%"
                  />

                  <!-- Input de monto -->
                  <input
                    v-if="item.type === 'inputFormatNumber'"
                    type="text"
                    :id="`input-${item.code}`"
                    @focus="onFocusAmount"
                    @input="onValueAmount"
                    @blur="onBlurAmount"
                    :value="
                      salesStore.formDocInvoice.formRegister
                        .formDataDocReference.amountDocument.total.tempValue !==
                      undefined
                        ? salesStore.formDocInvoice.formRegister
                            .formDataDocReference.amountDocument.total.tempValue
                        : salesStore.formDocInvoice.formRegister
                            .formDataDocReference.amountDocument.total.value
                    "
                    autocomplete="off"
                    class="input-amount"
                  />

                  <!-- Calendario -->
                  <u-calendar
                    v-if="item.type === 'date'"
                    borderStyle="0px"
                    v-model="
                      salesStore.formDocInvoice.formRegister
                        .formDataDocReference[item.code]
                    "
                    :disabled="item.disabled"
                    size="m"
                    :error="false"
                    style="width: 100%"
                  />

                  <!-- Botón para adjuntar archivo -->
                  <u-button
                    v-if="
                      item.type === 'file' &&
                      !salesStore.formDocInvoice.formRegister
                        .formDataDocReference.fileDocument
                    "
                    :text="
                      t(
                        `${module}.step3.docReference.inputsForm.${item.code}.buttons`,
                      )
                    "
                    size="xs"
                    type="none"
                    icon="attach"
                    @click="handleFileUpload"
                  />

                  <!-- Archivo adjuntado -->
                  <div
                    v-if="
                      item.type === 'file' &&
                      salesStore.formDocInvoice.formRegister
                        .formDataDocReference.fileDocument
                    "
                    class="container_file"
                  >
                    <span class="truncateText body-m-sb">
                      {{
                        salesStore?.formDocInvoice?.formRegister
                          ?.formDataDocReference?.fileDocument?.name
                      }}
                    </span>
                    <u-button-icon
                      icon="close"
                      size="s"
                      type="text"
                      color="--neutral-text-caption"
                      @click="
                        salesStore.formDocInvoice.formRegister.formDataDocReference.fileDocument =
                          null
                      "
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.body_content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.body_content .container_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.body_content .container_data_client .container_data {
  display: flex;
  flex-direction: column;
  width: 600px;
  height: 380px;
  padding: 12px;
  gap: 16px;
  border-radius: 16px;
  border: 1px solid var(--neutral-border-light);
  overflow-y: auto;
}

.body_content .container_data_client .container_data::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.body_content .container_data_client .container_data::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-subtle);
  border-radius: 5px;
}

.body_content .data_doc_reference {
  display: grid;
  grid-template-columns: 450px 70px;
  align-items: center;
  width: 100%;
  height: 96px;
  gap: 16px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--neutral-border-light);
}

.data_doc_reference .izq {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 8px;
}

.data_doc_reference .izq .content_number {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: var(--neutral-text-body);
}

.data_doc_reference .izq .content_date {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: var(--neutral-text-body);
}

.data_doc_reference .der {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--neutral-text-body);
}

.body_content .data_form_doc_reference {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 16px;
  padding: 12px;
}

.body_content .data_form_doc_reference .container_addDocument {
  display: grid;
  grid-template-rows: 32px auto;
  width: 100%;
  height: auto;
  padding: 16px;
  border-radius: 16px;
  gap: 16px;
  background-color: var(--neutral-surface-softer);
}

.body_content
  .data_form_doc_reference
  .container_addDocument
  .header_addDocument {
  display: grid;
  grid-template-columns: 1fr 72px;
  align-items: center;
}

.header_addDocument span {
  color: var(--neutral-text-body);
}

.header_addDocument .actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.body_content
  .data_form_doc_reference
  .container_addDocument
  .body_addDocument {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.body_content
  .data_form_doc_reference
  .container_addDocument
  .body_addDocument
  .container_input {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  height: 40px;
  border-radius: 8px;
  gap: 8px;
  background-color: var(--neutral-background-default);
}

.container_input .izq {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: var(--neutral-text-caption);
  padding: 2px 8px;
}

.container_input .der {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: var(--neutral-text-caption);
  padding: 2px 8px;
}

.container_input .der .container_file {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 380px; /* Más ancho: 380px -> 420px */
  gap: 8px;
  color: var(--neutral-text-caption);
  padding-left: 18px;
  padding-right: 8px;
}

/* Actions */
.container_buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.container_buttons span {
  color: var(--neutral-text-body);
  padding: 0 10px;
}

/* verificacion */

.verifying {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  height: auto;
  max-height: 32px;
  background-color: transparent;
  color: var(--primary-text-default);
}

.verifying.error {
  color: var(--danger-text-default);
}

.verifying .body-s-r {
  font-size: 12px;
  line-height: 16px;
  font-weight: 400;
  white-space: nowrap;
}

/* inputs */

::v-deep(.inputs) {
  border: 0;
  border-radius: 8px;
  width: 100%;
}

.input-amount {
  width: 100%;
  height: 36px;
  padding: 8px 20px;
  border: 1px solid var(--neutral-background-default);
  border-radius: 8px;
  font-size: 14px;
  line-height: 20px;
  color: var(--neutral-text-body);
  background-color: var(--neutral-background-default);
  transition: border-color 0.2s;
}

.input-amount:focus {
  outline: none;
  border-color: var(--primary-border-default);
}

.input-amount:hover:not(:focus) {
  border-color: var(--primary-border-default);
}
</style>
