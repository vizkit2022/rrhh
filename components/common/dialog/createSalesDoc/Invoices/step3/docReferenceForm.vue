<script setup>
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import { useI18n } from "vue-i18n";
import { toast } from "vue3-toastify";
import { formatCurrency, getValueFormaRealTime } from "@/utils/formatAmount";

const { t } = useI18n();
const module = "modules.sales.createSale";

const salesStore = useSalesStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// ── State ─────────────────────────────────────────────────────────────────────
const showAddDocReference = ref(false);

const previousCurrencyId = ref(
  organizationStore?.organization?.currency?._id || null,
);

// ── Currency ──────────────────────────────────────────────────────────────────
const currency = computed(
  () =>
    salesStore?.formDocInvoice?.formRegister?.formDataInvoice?.currency ||
    organizationStore?.organization?.currency,
);

// ── Options ───────────────────────────────────────────────────────────────────
const typeReferenceOptions = computed(() =>
  salesStore.typesDocuments.map((type) => ({
    label: type?.name || "-",
    id: type._id,
    data: type,
  })),
);

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
  const docs = salesStore.formDocInvoice.formRegister.documentReferences;
  if (docs.length === 0 && !showAddDocReference.value) return "form";
  if (docs.length > 0 && !showAddDocReference.value) return "list";
  if (showAddDocReference.value) return "form";
});

// ── Amount handlers ───────────────────────────────────────────────────────────
const onValueAmount = (event) => {
  const currency = {
    ...salesStore.formDocInvoice.formRegister.formDataInvoice.currency,
  };

  const rawValue = event.target.value;
  if (rawValue === "") {
    salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument =
      {
        total: { value: "", lastValue: "", number: 0, lastNumber: 0 },
      };
    return;
  }

  const numbers = getValueFormaRealTime(rawValue, currency, "amount");
  if (numbers) {
    const currentAmount =
      salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument
        .total;
    currentAmount.lastValue = currentAmount.value;
    currentAmount.lastNumber = currentAmount.number;
    currentAmount.number = numbers.numericValue;
    currentAmount.value = formatCurrency(numbers.numericValue, currency.value);
    currentAmount.tempValue = numbers.formattedValue;
  }
};

const onFocusAmount = async (event) => {
  const amount =
    salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument
      .total;
  amount.tempValue = amount.number || "0";
  await nextTick();
  event.target.select();
};

const onBlurAmount = () => {
  const amount =
    salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument
      .total;
  try {
    amount.value = formatCurrency(amount.number, currency.value);
    delete amount.tempValue;
  } catch {
    amount.number = 0;
    amount.value = "";
    delete amount.tempValue;
  }
};

// ── Doc reference helpers ─────────────────────────────────────────────────────
const initCurrencyAmountDocRef = () => {
  // REVIEW FUTURA CAMBIO DE MONEDA DEL DOCUMENTO REFERNECIASO
  // if (
  //   previousCurrencyId.value !==
  //   salesStore.formDocInvoice.formRegister.formDataInvoice.currency?._id
  // ) {
  //   previousCurrencyId.value =
  //     salesStore.formDocInvoice.formRegister.formDataInvoice.currency?._id;
  //   salesStore.formDocInvoice.formRegister.documentReferences = [];
  // }

  salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument.total.number = 0;
  const { number } =
    salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument
      .total;

  salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument.total.value =
    formatCurrency(number, currency.value);
  salesStore.formDocInvoice.formRegister.formDataDocReference.amountDocument.total.lastValue =
    formatCurrency(number, currency.value);
};

const resetFormDocReference = () => {
  salesStore.formDocInvoice.formRegister.formDataDocReference = {
    typeDocument: { id: "", name: "", allData: {} },
    numberDocument: "",
    dateDocument: new Date().toISOString().slice(0, 10),
    amountDocument: {
      total: { value: "0", lastValue: "0", number: 0, lastNumber: 0 },
    },
    fileDocument: null,
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

    if (file.size > 20 * 1024 * 1024) {
      toast.error(t(`${module}.step3.docReference.toastify.maxSizeFile`), {
        autoClose: 3000,
      });
      return;
    }
    if (file.type.startsWith("video/")) return;

    salesStore.formDocInvoice.formRegister.formDataDocReference.fileDocument =
      file;
  };

  fileInput.click();
};

const handleChangeDocument = (doc) => {
  salesStore.formDocInvoice.formRegister.formDataDocReference.typeDocument = {
    id: doc.id,
    name: doc.label,
    allData: doc.data,
  };
};

const filterNumbers = (event, field, numeric) => {
  const value = event.target.value;
  if (!numeric) {
    salesStore.formDocInvoice.formRegister.formDataDocReference[field] = value;
    return;
  }
  salesStore.formDocInvoice.formRegister.formDataDocReference[field] =
    value.replace(/\D/g, "");
};

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

// ── CRUD doc references ───────────────────────────────────────────────────────
const addDocReference = () => {
  salesStore.formDocInvoice.formRegister.documentReferences.push({
    ...salesStore.formDocInvoice.formRegister.formDataDocReference,
  });
  resetFormDocReference();
  initCurrencyAmountDocRef();
  showAddDocReference.value = false;
};

const updateDocReference = (item) => {
  const index = item.index;
  salesStore.formDocInvoice.formRegister.documentReferences[index] = item;
  item.editing = false;
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
  if (index !== -1)
    salesStore.formDocInvoice.formRegister.documentReferences.splice(index, 1);
};

const closeAddDocReference = () => {
  resetFormDocReference();
  initCurrencyAmountDocRef();
  showAddDocReference.value = false;
};

// Expose so parent can trigger addDocReference from footer button
defineExpose({ addDocReference });

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  initCurrencyAmountDocRef();
});

// ── Fields ────────────────────────────────────────────────────────────────────
const fields = [
  { icon: "file-text", code: "typeDocument", type: "selectTypeDocument" },
  { icon: "hashtag", code: "numberDocument", type: "text", numeric: true },
  { icon: "calendar", code: "dateDocument", type: "date" },
  {
    icon: "dollar-sign",
    code: "amountDocument",
    type: "inputFormatNumber",
    numeric: true,
  },
  { icon: "link", code: "fileDocument", type: "file" },
];
</script>

<template>
  <div class="container_data_client">
    <!-- Header -->
    <div class="header_body">
      <div class="izq">
        <span
          class="body-l-sb"
          v-text="t(`${module}.step3.docReference.subTitle`)"
        />
        <span class="body-l-sb">{{
          t(`${module}.step3.docReference.optional`)
        }}</span>
      </div>
      <div class="der">
        <u-button
          :text="t(`${module}.step3.docReference.buttons.addDocument`)"
          size="xs"
          type="none"
          icon="new"
          @click="showAddDocReference = true"
          :disabled="
            showAddDocReference ||
            salesStore.formDocInvoice.formRegister.documentReferences.length ===
              0
          "
        />
      </div>
    </div>

    <div class="container_data">
      <!-- List of added references -->
      <template v-if="docReferenceView === 'list'">
        <div
          v-for="(item, index) in salesStore.formDocInvoice.formRegister
            .documentReferences"
          :key="item.numberDocument"
          class="data_doc_reference"
        >
          <div class="izq">
            <span class="body-m-sb" style="color: var(--neutral-text-body)">
              {{ item.typeDocument.name }}
            </span>
            <div class="content_number">
              <span
                class="u u-hashtag"
                style="color: var(--primary-text-default)"
              />
              <span class="body-s-r">N° {{ item.numberDocument }}</span>
            </div>
            <div class="content_date">
              <span
                class="u u-calendar"
                style="color: var(--primary-text-default)"
              />
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
      </template>

      <!-- Add / edit form -->
      <div v-if="docReferenceView === 'form'" class="data_form_doc_reference">
        <div class="container_addDocument">
          <div class="header_addDocument">
            <span class="body-m-sb">{{
              t(`${module}.step3.docReference.titleForm`)
            }}</span>
            <div class="actions">
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
                  salesStore.formDocInvoice.formRegister.formDataDocReference
                    .editing
                    ? updateDocReference(
                        salesStore.formDocInvoice.formRegister
                          .formDataDocReference,
                      )
                    : addDocReference()
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
          </div>

          <div class="body_addDocument">
            <div
              v-for="item in fields"
              :key="item.code"
              class="container_input"
            >
              <div class="izq">
                <span :class="`u u-${item.icon}`" />
                <span class="body-m-sb">
                  {{
                    t(
                      `${module}.step3.docReference.inputsForm.${item.code}.label`,
                    )
                  }}
                </span>
              </div>

              <div class="der">
                <!-- Type document select -->
                <u-select
                  v-if="item.type === 'selectTypeDocument'"
                  v-model="
                    salesStore.formDocInvoice.formRegister.formDataDocReference
                      .typeDocument.name
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

                <!-- Text input -->
                <u-input
                  v-if="item.type === 'text'"
                  v-model="
                    salesStore.formDocInvoice.formRegister.formDataDocReference[
                      item.code
                    ]
                  "
                  class="inputs"
                  :placeholder="
                    t(
                      `${module}.step3.docReference.inputsForm.${item.code}.placeholder`,
                    )
                  "
                  size="m"
                  style="width: 100%"
                  @input="(e) => filterNumbers(e, item.code, item.numeric)"
                />

                <!-- Amount input -->
                <input
                  v-if="item.type === 'inputFormatNumber'"
                  type="text"
                  :id="`input-${item.code}`"
                  @focus="onFocusAmount"
                  @input="onValueAmount"
                  @blur="onBlurAmount"
                  :value="
                    salesStore.formDocInvoice.formRegister.formDataDocReference
                      .amountDocument.total.tempValue ??
                    salesStore.formDocInvoice.formRegister.formDataDocReference
                      .amountDocument.total.value
                  "
                  autocomplete="off"
                  class="input-amount"
                />

                <!-- Date -->
                <u-calendar
                  v-if="item.type === 'date'"
                  borderStyle="0px"
                  v-model="
                    salesStore.formDocInvoice.formRegister.formDataDocReference[
                      item.code
                    ]
                  "
                  :disabled="item.disabled"
                  size="m"
                  :error="false"
                  style="width: 100%"
                />

                <!-- File upload -->
                <u-button
                  v-if="
                    item.type === 'file' &&
                    !salesStore.formDocInvoice.formRegister.formDataDocReference
                      .fileDocument
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

                <!-- Attached file display -->
                <div
                  v-if="
                    item.type === 'file' &&
                    salesStore.formDocInvoice.formRegister.formDataDocReference
                      .fileDocument
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
</template>

<style scoped>
.container_data_client {
  display: grid;
  grid-template-rows: auto 1fr;
  width: 100%;
  height: 100%;
  padding-top: 24px;
  gap: 24px;
  overflow: hidden;
  min-height: 0;
}

.header_body {
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
  justify-content: space-between;
}

.header_body .izq {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3px;
}

.header_body .izq span:nth-child(1) {
  color: var(--neutral-text-body);
}
.header_body .izq span:nth-child(2) {
  color: var(--neutral-text-caption);
}

.header_body .der {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.container_data {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.data_doc_reference {
  display: grid;
  grid-template-columns: 452px 70px;
  align-items: center;
  width: 100%;
  height: 80px;
  gap: 16px;
  padding: 8px;
  border-radius: 16px;
  border: 1px solid var(--neutral-border-light);
}

.data_doc_reference .izq {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 8px;
}

.data_doc_reference .izq .content_number,
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
  padding-right: 8px;
  gap: 8px;
  color: var(--neutral-text-body);
}

.data_form_doc_reference {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 16px;
  padding: 12px;
}

.container_addDocument {
  display: grid;
  grid-template-rows: 32px 232px;
  width: 100%;
  height: auto;
  padding: 12px;
  border-radius: 16px;
  gap: 16px;
  background-color: var(--neutral-surface-softer);
}

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

.body_addDocument {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.container_input {
  display: grid;
  grid-template-columns: 100px 1fr;
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
  width: 380px;
  gap: 8px;
  color: var(--neutral-text-caption);
  padding-left: 18px;
  padding-right: 8px;
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

.truncateText {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

::v-deep(.inputs) {
  border: 0;
  border-radius: 8px;
  width: 100%;
}
</style>
