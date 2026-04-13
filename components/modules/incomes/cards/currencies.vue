<script setup>
import { computed, defineProps, nextTick, onMounted, defineEmits } from "vue";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import useIncomesStore from "@/stores/incomes";

// Stores
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const incomesStore = useIncomesStore();

// Emits
const emit = defineEmits(["saveDropdown"]);

// Props
const props = defineProps({
    title: {
        type: Boolean,
        default: true
    },
    config: {
        type: Object,
        default: () => ({})
    }
});

// Computed
const lang = computed(() => globalStore.lang);
const orgId = computed(() => organizationStore?.organization?._id);
const currencyIncome = computed(() => incomesStore?.income?.currency?.default || {})

// Constants
const currencyList = JSON.parse(JSON.stringify([{currency: incomesStore.income.currency.default, valueManual: 1, valueToday: 1}, ...incomesStore.income.currency.others]));
const currencies = ref(currencyList);
const { t } = useI18n();
const module = "modules.incomes.pages.grilla.menus.currency";

// Functions
const selectCurrency = (pos) => {
    currencies.value.forEach((currency, c)=> {
        currency.selected = c === pos;
    });

    const prop = props.config.type === 'incomes' ? 'price' : 'budget';
    const objC = currencies.value[pos]
    const newValue = { ...objC.currency, value: String(objC.valueManual), number: objC.valueManual };


    emit("saveDropdown", {
        // Tipo de Dropdown
        type: "currency",
        // Propiedad a actualizar
        prop,
        // Nuevos valores
        newValue,
        // Posición de la línea
        posLine: props.config?.posLine || 0,
    });
};
const goToPage = async () => {
  organizationStore.page = {
    tab: 3,
    option: 7
  };

  await nextTick();
  navigateTo(`/settings/${orgId.value}/organization`);
};

// Mounted
onMounted(() => {
    const prop = props.config.type === 'incomes' ? 'currency' : 'currencyBudget';
    let idCurrency = null
    if(props?.config?.line?.[prop]) {
        idCurrency = props.config.line[prop]._id;
    } else {
        idCurrency = currencyIncome.value._id;
    }
    currencies.value.forEach(c => {
        if(c.currency._id === idCurrency) {
            c.selected = true;
        }
    });
});
</script>

<template>
    <div class="dropdown">
        <span class="title" v-if="props.title" v-text="t(module + '.label')"></span>
        <div class="dropdown__list">
            <button v-for="(objC, c) in currencies" :key="c" :class="{btnCurrency: true, selected: objC.selected}" @click="selectCurrency(c)">
                <span v-text="objC?.currency?.code"></span>
                <span v-text="objC?.currency?.name[lang]" class="truncateText"></span>
                <span v-text="objC?.currency?.symbol"></span>
            </button>
            <div v-if="currencies.length === 0" class="noCurrencies">
                <span>{{ t(module + '.noData.main') }}</span>
                <img src="../../../../public/img/banking-transactions/lupa.svg" alt="logo search">
                <span>{{ t(module + '.noData.second') }}</span>
                <u-button type="outlined" icon="open" :text="t(module + '.noData.button')" @click="goToPage" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.dropdown {
    height: 100%;
    display: grid;
    gap: 10px;
    grid-template-rows: v-bind("props.title ? 'auto 1fr' : '1fr'");
}
.dropdown span.title {
    font-weight: 700;
    font-size: 10px;
    line-height: 14px;
    letter-spacing: 10%;
    vertical-align: middle;
    text-transform: uppercase;
    color: var(--neutral-text-caption);
}
.dropdown__list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: v-bind("props.title ? '250px' : '275px'");
    padding-right: 1px;
}
.dropdown__list::-webkit-scrollbar {
    width: 8px;
}
.dropdown__list::-webkit-scrollbar-thumb {
    background-color: var(--neutral-border-subtle);
    border-radius: 5px;
}
.dropdown__list button.btnCurrency {
    padding: 4px 8px;
    border-radius: 8px;
    display: grid;
    grid-template-columns: 48px 1fr auto;
    gap: 10px;
    align-items: center;
    transition: 0.3s;
}
.dropdown__list button.selected {
    background-color: var(--primary-surface-shadow-12a);
}
.dropdown__list button:not(.selected):hover {
    background-color: var(--primary-surface-shadow-8a);
}
.dropdown__list button span:nth-child(1) {
    font-weight: 600;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: var(--secondary-text-darker);
    border: 1px solid var(--secondary-border-subtle);
    background-color: var(--secondary-surface-softer);
    padding: 4px 8px;
    border-radius: 8px;
}
.dropdown__list button span:nth-child(2) {
    text-align: left;
    font-weight: 600;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: var(--neutral-text-body);
}
.dropdown__list button span:nth-child(3) {
    font-weight: 600;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0%;
    vertical-align: middle;
    text-align: right;
    color: var(--neutral-text-body);
}
.dropdown__list .noCurrencies {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    justify-content: center;
}
.dropdown__list .noCurrencies span {
    text-align: center;
    color: var(--neutral-text-caption);
    font-weight: 600;
    font-size: 14px;
}
.dropdown__list .noCurrencies button {
    margin-top: 10px;
}
</style>