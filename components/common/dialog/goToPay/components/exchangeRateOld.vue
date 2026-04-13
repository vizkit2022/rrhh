<script setup>
import { computed, ref, defineProps, defineEmits } from "vue";
import usePaymentsStore from "@/stores/payments";
import useSalesStore from "@/stores/sales";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();
const salesStore = useSalesStore();
const organizationStore = useOrganizationStore();

// Emits
const emit = defineEmits([
  "closeMenu",
  "recalculateTable",
  "realoadGetCurrencies",
]);

// Props
const props = defineProps({
  showMenu: {
    type: Boolean,
    default: false,
  },
  classNameBtn: {
    type: String,
    default: "",
  },
});

// Constants
const color = "--neutral-text-caption";
const { t } = useI18n();
const module = "modules.outcomes.pages.oc.modals.goToPay.step2";
const localTempCurrencies = ref([]);
const tempCurrency = ref(null);
const showAllCurrencies = ref(true);
const disabledOptions = ref(false);

// Computed
const lang = computed(() => globalStore.lang);

const isCurrentBase = computed(() => {
  // Tomamos la primera línea si existe
  const line = salesStore?.formDocInvoice?.formRegister?.business?.[0];

  const lines = salesStore?.formDocInvoice?.formRegister?.business;

  const currentCurrency =
    salesStore?.formDocInvoice?.formRegister?.formDataInvoice?.currency?._id;

  const isEqualCurrency = lines?.every(
    (line) => line?.currency?.default?._id === currentCurrency,
  );

  if (isEqualCurrency) {
    return true;
  } else {
    return false;
  }
});

const getCurrenciesEXR = () => {
  const currencyOrg = organizationStore?.organization?.currency?._id;
  const currencyDefaultId =
    salesStore?.formDocInvoice?.formRegister?.formDataInvoice?.currency?._id;

  const currentLines = salesStore.formDocInvoice.formRegister.business || [];

  const currencies = paymentsStore.formGoToPay.currencies || [];

  const existingOthers = paymentsStore.formGoToPay.othersCurrency || [];

  const linesCurrencies = [
    ...new Set(
      currentLines.map((line) => line?.currency?.default?._id).filter(Boolean),
    ),
  ];

  const currenciesForRates = new Set();

  // 1. Monedas de líneas distintas a la org
  linesCurrencies.forEach((id) => {
    if (id !== currencyOrg) currenciesForRates.add(id);
  });

  // 2. Si moneda base ≠ org → incluir org
  if (currencyDefaultId && currencyDefaultId !== currencyOrg) {
    currenciesForRates.add(currencyOrg);
  }

  paymentsStore.formGoToPay.othersCurrency = currencies
    .filter((c) => currenciesForRates.has(c._id))
    .map((c) => {
      const prev = existingOthers.find((o) => o._id === c._id);

      return {
        ...c,
        valueToday: Number(c.value),
        valueManual: prev?.valueManual ?? Number(c.value),
      };
    });
};

const displayedCurrencies = computed(() => {
  const formData = paymentsStore.formGoToPay;

  if (!formData) return [];

  // Si la moneda base es la org, tomamos de currencies
  const source = showAllCurrencies.value
    ? formData.currencies.filter((c) => c._id !== formData.currency._id)
    : formData.othersCurrency;

  // Si no hay source, tomamos currencies
  localTempCurrencies.value = source ? JSON.parse(JSON.stringify(source)) : [];

  return localTempCurrencies.value;
});

const handleClickOutside = (event) => {
  const dropdown = document.querySelector(".exchangeRate");
  const btn = document.querySelector(`.${props.classNameBtn}`);
  if (
    dropdown &&
    btn &&
    !dropdown.contains(event.target) &&
    !btn.contains(event.target)
  ) {
    emit("closeMenu");
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

watch(
  () => paymentsStore?.formGoToPay?.othersCurrency,
  (others) => {
    // Si hay tasas de cambio → vista tasa de cambio
    if (others && others.length > 0) {
      showAllCurrencies.value = false;
    } else {
      showAllCurrencies.value = true;
    }
  },
  { immediate: true, deep: true },
);

// Functions
const selectedCurrency = async (currency, c) => {
  disabledOptions.value = true;
  if (currency?._id === paymentsStore.formGoToPay.currency._id) return;

  const obj = {
    ...currency,
    value: currency.value,
  };

  paymentsStore.formGoToPay.currency = obj;
  paymentsStore.formGoToPay.currencyName = obj.name[lang.value];

  // emit("closeMenu");

  salesStore.loadings.currencies = true;
  const resp = await globalStore.getMyCurrencies(false, currency._id);
  salesStore.loadings.currencies = false;

  // igualmente no es necesario cambiar el valor
  paymentsStore.formGoToPay.currencies = [];
  if (resp) {
    const normalizeToNumber = (value) => {
      if (value === null || value === undefined || value === "") return 0;

      return Number(value.replace(",", ""));
    };

    // no deberia ser necesario cambiar el valor de las monedas
    paymentsStore.formGoToPay.currencies = resp.currencies.map((c) => {
      return {
        ...c,
        valueToday: normalizeToNumber(c.value),
        valueManual: normalizeToNumber(c.value),
      };
    });

    paymentsStore.formGoToPay.othersCurrency = resp.currencies.map((c) => {
      return {
        ...c,
        valueToday: normalizeToNumber(c.value),
        valueManual: normalizeToNumber(c.value),
      };
    });
  }

  // getCurrenciesEXR();
  emit("realoadGetCurrencies");
  emit("recalculateTable");
  showAllCurrencies.value = false;

  disabledOptions.value = false;
};
const saveERX = (tempLocalCurrency) => {
  const others = paymentsStore.formGoToPay.othersCurrency;
  const index = others.findIndex((c) => c._id === tempLocalCurrency._id);

  if (index !== -1) {
    others[index] = {
      ...others[index],
      valueManual: Number(tempLocalCurrency.valueManual),
    };
  }
  emit("recalculateTable");
};

const goBackToAllCurrencies = () => {
  showAllCurrencies.value = true;
  tempCurrency.value = null;
};

const goBackToExchangeRate = () => {
  showAllCurrencies.value = false;
  tempCurrency.value = null;
};
</script>

<template>
  <div class="exchangeRate" :class="{ show: props.showMenu }">
    <!-- LISTADO -->
    <div class="exhangeRate__list" v-show="!tempCurrency">
      <div class="exchangeRate__list-header">
        <span class="body-s-r">{{
          showAllCurrencies ? "Monedas" : "Tasa de cambio"
        }}</span>
        <u-button
          v-if="!showAllCurrencies"
          text="Monedas"
          icon="change"
          :disabled="disabledOptions"
          size="xs"
          type="outlined"
          color="--secondary-text-default"
          color-hover="--secondary-surface-subtle"
          color-active="--secondary-surface-darker"
          @click.stop="goBackToAllCurrencies"
        />
        <u-button
          v-else-if="
            showAllCurrencies &&
            paymentsStore.formGoToPay.othersCurrency.length > 0
          "
          text="Tasa de cambio"
          icon="undo"
          :disabled="disabledOptions"
          size="xs"
          type="outlined"
          color="--secondary-text-default"
          color-hover="--secondary-surface-subtle"
          color-active="--secondary-surface-darker"
          @click.stop="goBackToExchangeRate"
        />
      </div>
      <button
        class="exchangeRate__op"
        :disabled="disabledOptions"
        v-for="(currency, c) in displayedCurrencies"
        :key="currency._id"
        :class="{
          selected: currency._id === paymentsStore.formGoToPay.currency?._id,
          disabled: disabledOptions,
        }"
        @click.stop="selectedCurrency(currency, c)"
      >
        <div class="tag">
          <span>{{ currency?.code || "-" }}</span>
        </div>

        <span class="label truncateText" :title="currency.name[lang]">{{
          currency.name[lang]
        }}</span>
        <!-- <span class="amount" v-if="currency.value"></span> -->
        <input
          v-if="!showAllCurrencies"
          style="background-color: var(--neutral-background-default)"
          class="amount"
          type="number"
          v-model="currency.valueManual"
          @click.stop
          @mousedown.stop
          @focus="$event.target.select()"
        />
        <u-button-icon
          v-if="!showAllCurrencies"
          title="Guardar tasa de cambio"
          icon="save"
          size="s"
          type="outlined"
          color="--primary-text-default"
          @click.stop="saveERX(currency)"
        />
      </button>

      <span v-if="!paymentsStore.formGoToPay.currencies.length" class="noData">
        Sin monedas
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Exchange Rate */
.exchangeRate {
  width: 380px;
  height: auto;
  position: absolute;
  background-color: var(--neutral-background-default);
  border-radius: 12px;
  box-shadow: var(--elevation-l);
  top: 32px;
  left: 0px;
  padding: 16px;
  transform-origin: top left;
  transform: scale(0);
  transition: 0.3s;
}
.exchangeRate.show {
  transform: scale(1);
  opacity: 1;
  pointer-events: auto;
}
.exhangeRate__list {
  display: grid;
  overflow: auto;
  width: 360px;
  max-height: 212px;
  padding-right: 2px;
  gap: 5px;
}
.exhangeRate__list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.exhangeRate__list::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-subtle);
  border-radius: 5px;
}
.exhangeRate__list::-webkit-scrollbar-track {
  background-color: var(--neutral-border-darker);
  border-radius: 5px;
}

/* .exhangeRate__list :nth-child(1) {
  color: var(--neutral-text-body);
} */

.exchangeRate__list-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-right: 12px;
  height: 28px;
}

.exchangeRate__list-header ::nth-child(1) {
  color: var(--neutral-text-body);
}

.exchangeRate__op {
  display: grid;
  grid-template-columns: v-bind(
    "showAllCurrencies ? 'auto 1fr 100px' : 'auto 1fr 100px 40px'"
  );
  gap: 12px;
  align-items: center;
  transition: 0.3s;
  padding: 4px 4px;
  border: 1px solid transparent;
  border-radius: 6px;
  height: 41px;
}
.exchangeRate__op:hover,
.exchangeRate__op.selected {
  background-color: var(--primary-surface-shadow-8a);
  border: 1px solid var(--primary-border-subtle);
  cursor: pointer;
}

.exchangeRate__op.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.exchangeRate__op div.tag,
.exchangeRate__form-header div.tag {
  height: 24px;
  border: 1px solid var(--secondary-border-subtle);
  border-radius: 8px;
  background-color: var(--secondary-surface-softer);
  display: flex;
  align-items: center;
  padding: 0 4px;
}
.exchangeRate__op div.tag span,
.exchangeRate__form-header div.tag span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--secondary-text-darker);
}
.exchangeRate__op span.label,
.exchangeRate__form-header .name,
.exchangeRate__op span.amount {
  font-weight: 600;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.exchangeRate__op span.label {
  text-align: left;
}
.exchangeRate__op span.amount {
  text-align: right;
}
.exchangeRate__op input {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  transition: 0.3s;
  font-weight: 400;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
  text-align: end;
  padding: 0 8px;
}
.exchangeRate__op input:hover {
  border: 1px solid var(--primary-border-subtle);
}
.exchangeRate__op input[type="number"]::-webkit-inner-spin-button,
.exchangeRate__op input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.exchangeRate__op input::selection {
  background-color: var(--primary-text-subtle);
  color: var(--neutral-background-default);
}
.noData {
  color: var(--neutral-text-caption) !important;
  height: 40px;
  font-size: 14px !important;
  line-height: 14px !important;
  width: 100%;
  text-align: center !important;
  padding-top: 18px;
}
.exhangeRate__form {
  display: grid;
  row-gap: 10px;
  padding: 4px 4px;
}
.exchangeRate__form-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  column-gap: 10px;
  align-items: center;
}
.exchangeRate__form-header .btn {
  border-radius: 50%;
  transform: scale(0.8);
}
.exchangeRate__form-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas: "label label" "input btn";
  row-gap: 4px;
  column-gap: 10px;
}
.exchangeRate__form-actions .label {
  grid-area: label;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
}
.exchangeRate__form-actions .btn {
  grid-area: btn;
}
.exchangeRate__form-actions .input {
  grid-area: input;
}
</style>
