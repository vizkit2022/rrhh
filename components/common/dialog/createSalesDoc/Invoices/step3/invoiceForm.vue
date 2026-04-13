<script setup>
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import { useI18n } from "vue-i18n";
import { debounce } from "@/utils/helpers";

const { t } = useI18n();
const module = "modules.sales.createSale";

const salesStore = useSalesStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

const props = defineProps({
  paymentsTermns: { type: Array, default: () => [] },
  paymentsMethods: { type: Array, default: () => [] },
});

const copyPaymentsTermns = ref([...props.paymentsTermns]);
const emit = defineEmits(["sameCurrencyChange", "validationChange"]);

// Filtro de campos
const visibleFields = computed(() =>
  fields.filter((item) => {
    // Si es invoiceNumber y está en modo invoicing → NO mostrarlo
    // if (item.code === "invoiceNumber" && salesStore.formDocInvoice.invoicing) {
    //   return false;
    // }

    return true;
  }),
);

// ── Invoice number validation ─────────────────────────────────────────────────
const invoiceValidation = ref({
  isValidating: false,
  hasError: false,
  errorMessage: "",
});

watch(invoiceValidation, (val) => emit("validationChange", { ...val }), {
  deep: true,
});

const validateInvoiceNumber = debounce(async (invoiceNumber) => {
  if (!invoiceNumber || invoiceNumber.trim() === "") {
    invoiceValidation.value = {
      isValidating: false,
      hasError: false,
      errorMessage: "",
    };
    return;
  }
  try {
    invoiceValidation.value.isValidating = true;
    invoiceValidation.value.hasError = false;

    const body = {
      number: invoiceNumber,
      salesDocumentType: salesStore.formDocInvoice.typeDocument._id,
      client:
        salesStore.formDocInvoice.formRegister.client.contact ||
        salesStore.formDocInvoice.formRegister.client._id,
    };

    const documentNumberExists =
      await salesStore.checkSalesDocumentNumber(body);
    if (documentNumberExists.success === false) {
      invoiceValidation.value.hasError = false;
      invoiceValidation.value.errorMessage = "";
    }
  } catch (error) {
    invoiceValidation.value.hasError = true;
    invoiceValidation.value.errorMessage = t(
      `${module}.step3.invoice.inputsForm.invoiceNumber.check.inUse`,
    );
  } finally {
    invoiceValidation.value.isValidating = false;
  }
}, 500);

// ── Field helpers ─────────────────────────────────────────────────────────────
const filterNumbers = (event, field, numeric) => {
  const value = event.target.value;

  if (field === "invoiceNumber") {
    validateInvoiceNumber(value);
  }

  if (!numeric) {
    salesStore.formDocInvoice.formRegister.formDataInvoice[field] = value;
    return;
  }
  salesStore.formDocInvoice.formRegister.formDataInvoice[field] = value.replace(
    /\D/g,
    "",
  );
};

// ── Select handlers ───────────────────────────────────────────────────────────
const handleChangePaymentMethod = (paymentMethod) => {
  salesStore.formDocInvoice.formRegister.formDataInvoice.paymentMethod = {
    value: paymentMethod.value,
    label: paymentMethod.label,
    allData: paymentMethod.data,
  };

  if (organizationStore.organization.country.code === "CL") {
    if (paymentMethod.data?.taxCode === 2) {
      salesStore.formDocInvoice.formRegister.formDataInvoice.paymentCondition =
        {
          value: "",
          label: "",
          allData: null,
        };

      copyPaymentsTermns.value = props.paymentsTermns.filter(
        (item) => item.daysToPayment > 0,
      );
    } else {
      copyPaymentsTermns.value = props.paymentsTermns;
    }
  }
};

const handleChangeCondition = (condition) => {
  salesStore.formDocInvoice.formRegister.formDataInvoice.paymentCondition = {
    value: condition.value,
    label: condition.label,
    allData: condition.data,
  };
};

const handleChangeCurrency = (currency) => {
  const isSame =
    organizationStore?.organization?.currency?._id === currency.value;
  emit("sameCurrencyChange", isSame);
  salesStore.formDocInvoice.formRegister.formDataInvoice.currencyName =
    currency.label;
  salesStore.formDocInvoice.formRegister.formDataInvoice.currency =
    currency.data;
};

// ── Expiration date auto-calculation ─────────────────────────────────────────
const calculateExpirationDate = () => {
  const invoice = salesStore.formDocInvoice?.formRegister?.formDataInvoice;
  if (!invoice) return;

  const issueDate = invoice.issueDate ? new Date(invoice.issueDate) : null;
  const daysToPayment =
    invoice?.paymentCondition?.allData?.daysToPayment ?? null;

  if (!issueDate || daysToPayment === null) return;

  const expirationDate = new Date(issueDate);
  if (daysToPayment > 0)
    expirationDate.setDate(expirationDate.getDate() + daysToPayment);
  invoice.expirationDate = expirationDate.toISOString().slice(0, 10);
};

watch(
  () => [
    salesStore.formDocInvoice?.formRegister?.formDataInvoice?.issueDate,
    salesStore.formDocInvoice?.formRegister?.formDataInvoice?.paymentCondition
      ?.value,
  ],
  calculateExpirationDate,
  { immediate: true },
);

// ── Options ───────────────────────────────────────────────────────────────────
const currenciesOptions = computed(() =>
  salesStore.formDocInvoice.formRegister.formDataInvoice.currencies.map(
    (item) => ({
      label: item?.name?.[globalStore.lang] || "-",
      value: item._id,
      data: item,
    }),
  ),
);

const paymentMethodsOptions = computed(() =>
  props.paymentsMethods.map((item) => ({
    label: item?.name?.[globalStore.lang] || "-",
    value: item._id,
    data: item,
  })),
);

const conditionOfPayOptions = computed(() =>
  copyPaymentsTermns.value.map((item) => ({
    label: item?.name?.[globalStore.lang] || "-",
    value: item._id,
    data: item,
  })),
);

// ── Form fields definition ────────────────────────────────────────────────────
const fields = [
  { icon: "new-project", code: "reference", type: "text" },
  {
    icon: "hashtag",
    code: "invoiceNumber",
    type: "text",
    validationKey: "invoiceNumber",
  },
  { icon: "open-book", code: "currency", type: "selectCurrency" },
  { icon: "pay", code: "paymentMethod", type: "selectPaymentMethod" },
  {
    icon: "open-book",
    code: "paymentCondition",
    type: "selectPaymentCondition",
  },
  { icon: "calendar", code: "issueDate", type: "date", disabled: false },
  { icon: "calendar", code: "expirationDate", type: "date", disabled: true },
];
</script>

<template>
  <div class="container_data_client">
    <div class="header_body">
      <div class="izq">
        <span
          class="body-l-sb"
          v-text="t(`${module}.step3.invoice.subTitle`)"
        />
      </div>
    </div>

    <div class="container_data">
      <div
        v-for="item in visibleFields"
        :key="item.code"
        class="data"
        :class="{
          'data--with-validation': item.validationKey === 'invoiceNumber',
        }"
      >
        <div class="data_izq">
          <span :class="`u u-${item.icon}`" />
          <span class="body-m-sb">
            {{ t(`${module}.step3.invoice.inputsForm.${item.code}.label`) }}
          </span>
        </div>

        <div class="data_der">
          <!-- Text input -->
          <u-input
            v-if="item.type === 'text'"
            v-model="
              salesStore.formDocInvoice.formRegister.formDataInvoice[item.code]
            "
            :placeholder="
              t(`${module}.step3.invoice.inputsForm.${item.code}.placeholder`)
            "
            size="m"
            style="width: 100%"
            @input="(e) => filterNumbers(e, item.code, item.numeric)"
            :error="
              item.validationKey === 'invoiceNumber' &&
              invoiceValidation.hasError
            "
          />

          <!-- Validating indicator -->
          <div
            v-if="
              item.validationKey === 'invoiceNumber' &&
              invoiceValidation.isValidating
            "
            class="verifying"
          >
            <u-loading :width="16" />
            <span class="body-s-r">
              {{
                t(
                  `${module}.step3.invoice.inputsForm.invoiceNumber.check.verifying`,
                )
              }}
            </span>
          </div>

          <!-- Error indicator -->
          <div
            v-else-if="
              item.validationKey === 'invoiceNumber' &&
              invoiceValidation.hasError
            "
            class="verifying error"
          >
            <span class="u u-alert-circle" />
            <span class="body-s-r">{{ invoiceValidation.errorMessage }}</span>
          </div>

          <!-- Payment method select -->
          <u-select
            v-if="item.type === 'selectPaymentMethod'"
            v-model="
              salesStore.formDocInvoice.formRegister.formDataInvoice[item.code]
                .label
            "
            :options="paymentMethodsOptions"
            :placeholder="
              t(`${module}.step3.invoice.inputsForm.${item.code}.placeholder`)
            "
            :full-data="true"
            @full-data="handleChangePaymentMethod"
            size="m"
            style="width: 100%"
          />

          <!-- Payment condition select -->
          <u-select
            v-if="item.type === 'selectPaymentCondition'"
            v-model="
              salesStore.formDocInvoice.formRegister.formDataInvoice[item.code]
                .label
            "
            :options="conditionOfPayOptions"
            :placeholder="
              t(`${module}.step3.invoice.inputsForm.${item.code}.placeholder`)
            "
            :full-data="true"
            @full-data="handleChangeCondition"
            size="m"
            style="width: 100%"
          />

          <!-- Currency select -->
          <u-select
            v-if="item.type === 'selectCurrency'"
            v-model="
              salesStore.formDocInvoice.formRegister.formDataInvoice
                .currencyName
            "
            :options="currenciesOptions"
            :placeholder="
              t(`${module}.step3.invoice.inputsForm.${item.code}.placeholder`)
            "
            :full-data="true"
            @full-data="handleChangeCurrency"
            size="m"
            style="width: 100%"
          />

          <!-- Date -->
          <u-calendar
            v-if="item.type === 'date'"
            v-model="
              salesStore.formDocInvoice.formRegister.formDataInvoice[item.code]
            "
            style="width: 100%"
            :disabled="item.disabled"
            size="m"
            :error="false"
          />
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

.header_body .izq span {
  color: var(--neutral-text-body);
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

.data {
  display: grid;
  grid-template-columns: 180px 376px;
  height: 48px;
}

.data--with-validation {
  position: relative;
}
.data--with-validation ::v-deep(.containerInput input) {
  padding-right: 180px !important;
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

.verifying .u {
  font-size: 14px;
}
</style>
