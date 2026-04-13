<script setup>
import { computed, ref, defineProps, defineEmits, onMounted, onUnmounted } from "vue";
import useGlobalStore from "@/stores/global";
import {
  IncomesCardsCurrencies,
  IncomesCardsVars,
} from "#components";

// Stores
const globalStore = useGlobalStore();

// Emits  
const emit = defineEmits(["saveDropdown","dropdownClose"]);

// Props
const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

// Vistas
const views = {
    0: IncomesCardsVars,
    1: IncomesCardsCurrencies
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

// Functions
const saveDropdown = (data) => {
  emit("saveDropdown", data);
};

onMounted(() => {
  document.addEventListener("keydown", handleEscapeKey);
})

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscapeKey);
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    emit("dropdownClose");
  }
};

</script>

<template>
    <div class="dropdown">
        <u-tabs class="tabs" :tabs="tabs" v-model="tabSelected" />
        <component v-if="contentView" :is="contentView" :title="false" :config="config" @saveDropdown="saveDropdown" />
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