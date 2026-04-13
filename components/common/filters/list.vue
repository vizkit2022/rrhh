<script setup>
import { defineProps, computed, ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import useGlobalStore from "@/stores/global";
import usePaymentsStore from "@/stores/payments";

// Stores
const globalStore = useGlobalStore();
const paymentsStore = usePaymentsStore();

// Props
const props = defineProps({
  filter: {
    type: Object,
    default: () => ({
      prop: "",
      options: [],
      typeList: null,
    }),
  },
});

// Constants
const { t } = useI18n();

// load options typeList
const fetchedOptions = ref([]);

const loadOptions = async () => {
  if (props.filter?.typeList === "paymentMethod") {
    try {
      await paymentsStore.getPaymentMethods();

      fetchedOptions.value = paymentsStore.paymentMethods.map((met) => {
        // buscar si ya existía esta opción
        const existing =
          props.filter.options.find((o) => o.id === met._id) ||
          fetchedOptions.value.find((o) => o.id === met._id);

        return {
          names: met?.name,
          value: met?.name?.en?.replace(/\s+/g, ""),
          id: met?._id,
          active: existing?.active ?? false,
        };
      });

      // actualizamos el filter con las opciones procesadas
      props.filter.options = fetchedOptions.value;
    } catch (error) {
      console.error("Error loading options:", error);
      fetchedOptions.value = [];
    }
  }
};

// Computed property for options
const options = computed(() => {
  if (props.filter?.typeList === "paymentMethod") {
    return props.filter?.options || [];
  }
  return props.filter?.options || [];
});

const countOptionsActive = computed(
  () => options.value.filter((op) => op.active).length,
);

// Functions
const getText = (option, label) => {
  const prop = props.filter.prop;
  const val = option.value;
  if (prop && val) {
    return t(`filters.${prop}.options.${val}.${label}`);
  }
  return "";
};

const toggleOption = (option) => {
  const max = props.filter?.maxFiltersActive;

  // si está deshabilitado globalmente, no hacer nada
  if (globalStore.savingFilter || option.custom) return;

  // si es el misma opcion que estaba activa, la desactivamos
  if (option.active) {
    option.active = false;
    return;
  }

  // SIN LÍMITE
  if (!max) {
    option.active = !option.active;
    return;
  }

  //  LÍMITE = 1  → comportamiento tipo radio
  if (max === 1) {
    if (option.active) {
      // si ya está activo lo puedes dejar así
      return;
    }

    // desactivar todos
    options.value.forEach((op) => (op.active = false));

    // activar el nuevo
    option.active = true;
    return;
  }

  // LÍMITE > 1
  if (option.active) {
    option.active = false;
    return;
  }

  if (countOptionsActive.value < max) {
    option.active = true;
  }
};

onMounted(async () => {
  await loadOptions();
});
</script>

<template>
  <div class="list-filter">
    <button
      v-for="option in options"
      :key="option.value"
      :class="{ 'list-filter__button': true, selected: option.active }"
      @click="toggleOption(option)"
      :disabled="globalStore.savingFilter || option.custom"
    >
      <!-- <span class="body-m-sb">{{ getText(option, "label") }}</span> -->
      <span class="body-m-sb">{{
        props.filter.typeList === "paymentMethod"
          ? option.names[globalStore.lang]
          : getText(option, "label")
      }}</span>
      <span v-if="option.secondText" class="body-xs-r">{{
        getText(option, "text")
      }}</span>
    </button>
  </div>
</template>

<style scoped>
.list-filter {
  display: flex;
  flex-direction: column;
  background-color: var(--secondary-surface-shadow-8a);
  border-radius: 14px;
  overflow: hidden;
  padding: 4px;
  gap: 4px;
}
.list-filter__button {
  height: 36px;
  flex-shrink: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  border: none;
  background: none;
  cursor: pointer;
  transition: 0.3s ease-in;
  border-radius: 12px;
}
.list-filter__button:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}
.list-filter__button span:nth-child(1) {
  color: var(--neutral-text-body);
  transition: 0.3s ease-in;
}
.list-filter__button span:nth-child(2) {
  color: var(--neutral-text-caption);
}
.list-filter__button.selected,
.list-filter__button:not(:disabled):hover {
  background-color: var(--secondary-surface-shadow-12a);
}
.list-filter__button.selected span:nth-child(1),
.list-filter__button:not(:disabled):hover span:nth-child(1) {
  color: var(--secondary-text-subtle);
}
</style>
