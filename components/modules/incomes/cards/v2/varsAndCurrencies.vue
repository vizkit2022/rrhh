<script setup>
import { computed, ref, defineProps } from "vue";
import useGlobalStore from "@/stores/global";
import {
  IncomesCardsV2Currencies,
  IncomesCardsV2Vars,
} from "#components";

// Stores
const globalStore = useGlobalStore();

// Props
const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

// Vistas
const views = {
    0: IncomesCardsV2Vars,
    1: IncomesCardsV2Currencies
};

const contentView = computed(() => views[tabSelected.value]);

// Computed
const lang = computed(() => globalStore.lang);

// Constants
const tabSelected = ref(0);
const tabs = computed(() => [
  {
    label: t(module + '.vars.label'),
    icon: "",
    tab: 0,
    indicator: false,
    disabled: false,
    main: false,
  },
  {
    label: t(module + '.currency.label'),
    icon: "",
    tab: 1,
    indicator: false,
    disabled: false,
    main: false,
  },
]);
const { t } = useI18n();
const module = "modules.incomes.pages.grilla.menus";

</script>

<template>
    <div class="dropdown">
        <u-tabs class="tabs" :tabs="tabs" v-model="tabSelected" />
        <component v-if="contentView" :is="contentView" :title="false" />
    </div>
</template>

<style scoped>
.dropdown {
    height: 100%;
    display: grid;
    gap: 10px;
    grid-template-rows: auto 1fr;
}
</style>