<script setup>
import { computed, ref, defineProps, defineEmits } from "vue";
import usePaymentsStore from "@/stores/payments";
import useGlobalStore from "@/stores/global";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();

// Emits
const emit = defineEmits(["closeMenu", "recalculateTable"]);

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
const showAllCurrencies = ref(true); // Iniciado en true para mostrar monedas por defecto
const disabledOptions = ref(false);

// Computed
const lang = computed(() => globalStore.lang);

const isCurrentBase = computed(() => {
  // Tomamos la primera línea si existe
  const line = paymentsStore.formDeposits.lines?.[0];

  const currencyline =
    line?.currency?.default?._id || line?.currency?.default || "";

  if (paymentsStore.formDeposits.currency?._id === currencyline) {
    return true;
  } else {
    return false;
  }
});

const displayedCurrencies = computed(() => {
  const currencies = paymentsStore.formDeposits.currencies || [];
  localTempCurrencies.value = JSON.parse(JSON.stringify(currencies));

  const baseCurrencyId =
    paymentsStore.formDeposits.lines?.[0]?.currency?.default?._id ||
    paymentsStore.formDeposits.lines?.[0]?.currency?.default;

  // El toggle tiene prioridad sobre todo
  if (showAllCurrencies.value) {
    return localTempCurrencies.value; // Mostrar todas las monedas
  } else {
    return localTempCurrencies.value.filter((c) => c._id === baseCurrencyId); // Mostrar solo tasa de cambio
  }
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

  // Verificar si existe la base currency al montar
  // const baseCurrencyId =
  //   paymentsStore.formDeposits.lines?.[0]?.currency?.default?._id ||
  //   paymentsStore.formDeposits.lines?.[0]?.currency?.default;

  // // Si no hay base currency, mostrar todas las monedas
  // // Si hay base currency, mostrar tasa de cambio
  // showAllCurrencies.value = baseCurrencyId;

  // Si hay base currency, mostrar tasa de cambio
  paymentsStore.formDeposits.currencies.forEach((c) => {
    if (c._id === localTempCurrencies.value[0]._id) {
      showAllCurrencies.value = false;
    }
  });
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Functions
// OLD CODE SELECTED CURRENCY
// const selectedCurrency = (currency, c) => {
//   if (currency?._id === paymentsStore.formDeposits.currency?._id) return;
//   tempCurrency.value = { ...currency, pos: c };
//   valueERX.value = currency.value;
// };

const selectedCurrency = async (currency, c) => {
  disabledOptions.value = true;
  if (currency?._id === paymentsStore.formDeposits.currency?._id) return;

  const obj = {
    ...currency,
    value: currency.value,
  };

  paymentsStore.formDeposits.currency = obj;

  // emit("closeMenu");

  paymentsStore.formDeposits.currencyLoading = true;
  const resp = await globalStore.getMyCurrencies(false, currency._id);
  paymentsStore.formDeposits.currencyLoading = false;

  paymentsStore.formDeposits.currencies = [];
  if (resp) {
    const normalizeToNumber = (value) => {
      if (value === null || value === undefined || value === "") return 0;

      return Number(value.replace(",", ""));
    };

    paymentsStore.formDeposits.currencies = resp.currencies.map((c) => {
      return {
        ...c,
        valueToday: normalizeToNumber(c.value),
        valueManual: normalizeToNumber(c.value),
      };
    });
  }

  emit("recalculateTable");
  disabledOptions.value = false;
};

const saveERX = (tempLocalCurrency) => {
  // Encontrar el índice correcto en el array original usando el _id
  const originalIndex = paymentsStore.formDeposits.currencies.findIndex(
    (curr) => curr._id === tempLocalCurrency._id,
  );

  if (originalIndex !== -1) {
    // Actualizar solo el objeto en la posición correcta del array original
    paymentsStore.formDeposits.currencies[originalIndex] = {
      ...paymentsStore.formDeposits.currencies[originalIndex],
      valueManual: tempLocalCurrency.valueManual,
    };
  }

  emit("recalculateTable");
};

watch(
  () => paymentsStore.formDeposits.currency?._id,
  () => {
    showAllCurrencies.value = false;
  },
);
</script>

<template>
  <div class="exchangeRate" :class="{ show: props.showMenu }">
    <!-- LISTADO -->
    <div class="exhangeRate__list" v-show="!tempCurrency">
      <div class="exchangeRate__list-header">
        <span class="body-s-r">{{
          isCurrentBase ? "Monedas" : "Tasa de cambio"
        }}</span>
        <u-button
          :text="showAllCurrencies ? 'Tasa de cambio' : 'Monedas'"
          :icon="showAllCurrencies ? 'undo' : 'change'"
          size="xs"
          type="outlined"
          :disabled="disabledOptions"
          color="--secondary-text-default"
          color-hover="--secondary-surface-subtle"
          color-active="--secondary-surface-darker"
          @click="showAllCurrencies = !showAllCurrencies"
        />
      </div>
      <button
        class="exchangeRate__op"
        v-for="(currency, c) in displayedCurrencies"
        :key="currency._id"
        :class="{
          selected: currency._id === paymentsStore.formDeposits.currency?._id,
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

      <span v-if="!paymentsStore.formDeposits.currencies.length" class="noData">
        Sin monedas
      </span>

      <span v-if="!displayedCurrencies.length" class="noData">
        Sin tasa de cambio
      </span>
    </div>

    <!-- FORM -->
    <!-- <div class="exhangeRate__form" v-show="tempCurrency">
      <div class="exchangeRate__form-header">
        <div class="tag">
          <span>{{ tempCurrency?.code || "-" }}</span>
        </div>

        <span class="name">{{ tempCurrency?.name[lang] }}</span>

        <u-button-icon
          icon="close"
          size="s"
          type="outlined"
          :color="color"
          @click="tempCurrency = null"
        />
      </div>

      <div class="exchangeRate__form-actions">
        <span class="label">Tasa de Cambio</span>

        <u-input class="input" v-model="valueERX" size="s" align="right" />

        <u-button
          class="btn"
          text="Guardar"
          size="s"
          @click="saveTepCurrency"
        />
      </div>
    </div> -->
  </div>
</template>

<style scoped>
/* Exchange Rate */
.exchangeRate {
  width: 360px;
  height: auto;
  position: absolute;
  background-color: var(--neutral-background-default);
  border-radius: 12px;
  box-shadow: var(--elevation-l);
  top: 32px;
  right: 0px;
  padding: 16px;
  transform-origin: top right;
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
  width: 330px;
  max-height: 184px;
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

.exchangeRate__list-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-right: 12px;
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
}
.exchangeRate__op:hover,
.exchangeRate__op.selected {
  background-color: var(--primary-surface-shadow-8a);
  border: 1px solid var(--primary-border-subtle);
  cursor: pointer;
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
.exchangeRate__op.disabled {
  opacity: 0.5;
  pointer-events: none;
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
