<script setup>
import { computed, defineProps, defineEmits, onMounted, onUnmounted } from "vue";
import useGlobalStore from "@/stores/global";
import useIncomesStore from "@/stores/incomes";

// Stores
const globalStore = useGlobalStore();
const incomesStore = useIncomesStore();

// Emits
const emit = defineEmits(["saveDropdown","dropdownClose"]);

// Props
const props = defineProps({
    config: {
      type: Object,
      default: () => ({})
    }
});

// Computed
const units = computed(() => {
    let units = JSON.parse(JSON.stringify(incomesStore?.configuration?.units?.unitsByIncomes || []));
    units.unshift({
        id: 0,
        name: globalStore.lang === "es" ? "Sin Unidad" : "No Unit",
        plural: globalStore.lang === "es" ? "Sin Unidad" : "No Unit",
        colorLabel: "",
    });
    return units;
});
const isPluralProp = computed(() => {
    const prop = props?.config?.type === 'incomes' ? 'amount1' : 'budgetAmount1'
    return props?.config?.line?.numbers?.[prop].number === 1 ? 'name' : 'plural'
});

// Constants
const { t } = useI18n();
const module = "modules.incomes.pages.grilla.menus.units";

// Methods
const selectUnit = (unit) => {
    const TYPE = props.config?.type || "incomes";
    emit("saveDropdown", {
        // Tipo de Dropdown
        type: "unit",
        // Propiedad a actualizar
        prop: TYPE === "incomes" ? "unit" : "unitBudget",
        // Nuevos valores
        newValue: unit.id === 0 ? null : unit,
        // Posición de la línea
        posLine: props.config?.posLine || 0,
    });
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
        <span class="title" v-text="t(module + '.label')"></span>
        <div class="dropdown__list">
            <button v-for="(unit, u) in units" :key="u" 
                @click="selectUnit(unit)"
                :style="`background-color: ${unit.colorLabel || 'var(--neutral-surface-shadow-12a)'};`">
                <span v-text="unit[isPluralProp]"></span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.dropdown {
    height: 100%;
    display: grid;
    gap: 10px;
    grid-template-rows: auto 1fr;
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
    gap: 5px;
}
.dropdown__list::-webkit-scrollbar {
    width: 8px;
}
.dropdown__list::-webkit-scrollbar-thumb {
    background-color: var(--neutral-border-subtle);
    border-radius: 5px;
}
.dropdown__list button {
    padding: 2px 4px;
    border-radius: 16px;
    transition: 0.3s;
}
.dropdown__list button span {
    font-weight: 600;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: var(--neutral-text-body);
}
</style>