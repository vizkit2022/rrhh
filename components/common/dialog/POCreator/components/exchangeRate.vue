<script setup>
import { computed, ref, defineProps, defineEmits } from "vue";
import usePaymentsStore from "@/stores/payments";
import useSalesStore from "@/stores/sales";
import useOutcomesStore from "@/stores/outcomes";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

// Stores
const paymentsStore = usePaymentsStore();
const globalStore = useGlobalStore();
const salesStore = useSalesStore();
const outcomesStore = useOutcomesStore();
const organizationStore = useOrganizationStore();

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
const disabledOptions = ref(false);

// Computed
const lang = computed(() => globalStore.lang);

const displayedCurrencies = computed(() => {
  const currencies = outcomesStore.formPO.currencies || [];

  const source = outcomesStore.formPO.currency
    ? outcomesStore.formPO.currencies.filter(
        (c) => c._id !== outcomesStore.formPO.currency._id,
      )
    : currencies;

  localTempCurrencies.value = JSON.parse(JSON.stringify(source));

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

// Functions
const selectedCurrency = async (currency, c) => {
  disabledOptions.value = true;
  if (currency?._id === outcomesStore.formPO.currency?._id) return;

  const obj = {
    ...currency,
    value: currency.value,
  };

  outcomesStore.formPO.currency = obj;
  outcomesStore.formPO.currencyName = obj.name[lang.value];

  outcomesStore.formPO.loadings.currencies = true;
  const resp = await globalStore.getMyCurrencies(false, currency._id);
  outcomesStore.formPO.loadings.currencies = false;

  outcomesStore.formPO.currencies = [];
  if (resp) {
    const normalizeToNumber = (value) => {
      if (value === null || value === undefined || value === "") return 0;

      return Number(value.replace(",", ""));
    };

    outcomesStore.formPO.currencies = resp.currencies.map((c) => {
      return {
        ...c,
        valueToday: normalizeToNumber(c.value),
        valueManual: normalizeToNumber(c.value),
      };
    });
  }

  emit("realoadGetCurrencies");
  emit("recalculateTable");
  disabledOptions.value = false;
};
</script>

<template>
  <div class="exchangeRate" :class="{ show: props.showMenu }">
    <!-- LISTADO -->
    <div class="exhangeRate__list">
      <div class="exchangeRate__list-header">
        <span class="body-s-r">Selecciona para cambiar de moneda</span>
      </div>
      <button
        class="exchangeRate__op"
        v-for="(currency, c) in displayedCurrencies"
        :key="currency._id"
        :class="{
          selected: currency._id === outcomesStore.formPO.currency?._id,
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
      </button>

      <span v-if="!outcomesStore.formPO.currencies.length" class="noData">
        Sin monedas
      </span>

      <span v-if="!displayedCurrencies.length" class="noData">
        Sin monedas disponibles
      </span>
    </div>
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
  height: 28px;
  align-items: center;
  justify-content: space-between;
  padding-right: 12px;
}

.exchangeRate__list-header ::nth-child(1) {
  color: var(--neutral-text-body);
}

.exchangeRate__op {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: 0.3s;
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

.exchangeRate__op div.tag {
  height: 24px;
  border: 1px solid var(--secondary-border-subtle);
  border-radius: 8px;
  background-color: var(--secondary-surface-softer);
  display: flex;
  align-items: center;
  padding: 0 4px;
}
.exchangeRate__op div.tag span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--secondary-text-darker);
}
.exchangeRate__op span.label {
  font-weight: 600;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0%;
  vertical-align: middle;
  color: var(--neutral-text-body);
  text-align: left;
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
</style>
