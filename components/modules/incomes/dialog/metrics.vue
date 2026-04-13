<script setup>
import { ref, defineEmits, onMounted, defineProps, computed } from "vue";
import { metrics } from "@/utils/labels/incomes.json";
import useGlobalStore from "@/stores/global";
import useLinesStore from "@/stores/lines";
import usePermissionStore from "@/stores/permissions";

// STORES
const globalStore = useGlobalStore();
const linesStore = useLinesStore();
const permissionsStore = usePermissionStore();

// Emits
const emit = defineEmits(["closeModal", "updatedMetrics"]);

// Props
const props = defineProps({
  settings: {
    type: Object,
    default: () => {},
  },
  surcharges: {
    type: Array,
    default: () => [],
  },
});

// Contants
const showSurcharge = ref(false);
const mandatoryPercentage = ref(false);
const settings = ref([]);
const orderMap = { 1: 0, 4: 1, 2: 2, 5: 3, 3: 4, 6: 5 };

// Mapeado de permisos con las metricas de cada columna de la grilla
const permissionMapMetrics = {
  income_grid_col_incomes: ["sumPrice"],
  income_grid_col_budget: ["sumBudget", "budgetUtility", "cost"],
  income_grid_col_cost: ["toSpend"],
  income_grid_col_projected: ["projectedUtility"],
}

// Computed
const lang = computed(() => {
  return globalStore.lang;
});

// Mounted
onMounted(() => {
  settings.value = props.settings.metrics;
  showSurcharge.value = props.settings.surcharges;
  mandatoryPercentage.value = props.settings.metrics[0].mandatoryPercentage;
  console.log('filtered emtrics settings', filteredSettingsMetrics.value)
});

// Functions
const updatedStorage = () => {
  settings.value = settings.value.map((s) => ({
    ...s,
    mandatoryPercentage: mandatoryPercentage.value,
  }));
  mandatoryPercentage.value;
  setTimeout(() => {
    localStorage.setItem(
      "settingsMetrics",
      JSON.stringify({
        metrics: settings.value,
        surcharges: showSurcharge.value,
      })
    );
  }, 0);
  emit("updatedMetrics", {
    metrics: settings.value,
    surcharges: showSurcharge.value,
  });
};

const draggenItem = ref(null);

const handleDragStart = (index) => {
  draggenItem.value = index;
};

const handleDragOver = (event) => {
  event.preventDefault();
};

const handleDrop = (index) => {
  const droppedItem = settings.value.splice(draggenItem.value, 1)[0];
  settings.value.splice(index, 0, droppedItem);
  settings.value = settings.value.map((item, index) => ({
    ...item,
    pos: index,
  }));
  draggenItem.value = null;
  emit("updatedMetrics", {
    metrics: settings.value,
    surcharges: showSurcharge.value,
  });
};

// filtrado de permisos por metricas
const filteredSettingsMetrics = computed(() => {
  //Lista de amountProp Permitidos 
  const allowedMetrics = Object.entries(permissionMapMetrics)
    .filter(([permKey]) => permissionsStore.myPermissions[permKey])
    .flatMap(([_, codes]) => codes);

  return props.settings.metrics
    .filter((m) => allowedMetrics.includes(m.amountProp))
    .slice()
    .sort(
      (a, b) => (orderMap[a.order] || Infinity) - (orderMap[b.order] || Infinity)
    );
})

</script>

<template>
  <div class="modal">
    <div class="modal__header">
      <span class="truncateText">{{ metrics.title[lang] }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--bg-neutral-200"
        colorHover="--bg-neutral-400"
        colorActive="--bg-neutral-600"
        size="m"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="modal__content">
      <div class="modal__card" v-if="props.surcharges.length">
        <span class="title">{{ metrics.subtitle1[lang] }}</span>
        <div class="card__check">
          <u-checkbox
            :height="16"
            v-model="showSurcharge"
            @click="updatedStorage"
          />
          <span>{{ metrics.additionalText.subtitle1[lang] }}</span>
        </div>
        <div class="card__box">
          <div
            class="card__box-group"
            v-for="(surcharge, s) in props.surcharges"
            :key="s"
          >
            <u-switch v-model="surcharge.show" :disabled="showSurcharge" />
            <span class="truncateText">{{ surcharge.name }}</span>
          </div>
        </div>
      </div>
      <div class="modal__card">
        <span class="title">{{ metrics.subtitle2[lang] }}</span>
        <div class="card__box">
          <div
            class="card__box-group"
            v-for="(setting, s) in filteredSettingsMetrics"
            :key="s"
          >
            <u-switch v-model="setting.show" @click="updatedStorage" />
            <span>{{ setting.label[lang] }}</span>
          </div>
          <div class="card__check double">
            <u-checkbox
              :height="16"
              v-model="mandatoryPercentage"
              @click="updatedStorage"
            />
            <span>{{ metrics.additionalText.subtitle2[lang] }}</span>
          </div>
        </div>
      </div>
      <div class="modal__card last">
        <span class="title">{{ metrics.subtitle3[lang] }}</span>
        <div class="card__tags">
          <div
            class="card__tag"
            v-for="(setting, s) in filteredSettingsMetrics"
            :key="s"
            :style="`background-color: var(${setting.bgcolor});`"
            :draggable="true"
            @dragstart="handleDragStart(s)"
            @dragover="handleDragOver"
            @drop="handleDrop(s)"
          >
            <span
              class="u u-dragndrop"
              :style="`color: var(${setting.color});`"
            ></span>
            <span :style="`color: var(${setting.color});`">{{
              setting.label[lang]
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
span {
  font-family: Nunito;
}
.modal {
  height: 100%;
  display: grid;
  grid-template-rows: 40px 1fr;
  gap: 16px;
}
/* header */
.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}
.modal__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}
/* content */
.modal__content {
  display: flex;
  flex-direction: column;
  gap: 32px;
  overflow-y: auto;
  padding: 0 5px;
}
.modal__content::-webkit-scrollbar {
  width: 8px;
  height: 0px;
}
.modal__content::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: var(--bg-neutral-300);
}
.modal__content::-webkit-scrollbar-track {
  background-color: var(--bg-neutral-100);
  border-radius: 4px;
}
.modal__card {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.modal__card:not(.last) {
  border-bottom: 1px solid var(--neutral-border-subtle);
  padding-bottom: 16px;
}
.modal__card span.title {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
.card__check {
  display: flex;
  gap: 16px;
  padding: 0 16px;
  align-items: center;
  height: 36px;
}
.card__check span,
.msg {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: var(--neutral-text-body);
}
.msg {
  color: var(--neutral-text-caption);
}
.card__box {
  width: 100%;
  height: auto;
  border-radius: 16px;
  padding: 16px 24px;
  background-color: var(--secondary-surface-shadow-8a);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}
.card__box-group {
  height: 32px;
  display: flex;
  gap: 16px;
  align-items: center;
}
.card__check.double {
  grid-column: span 2;
  border-top: 1px solid var(--neutral-border-subtle);
  padding-top: 10px;
}
.card__box-group span {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: var(--neutral-text-body);
  max-width: 150px;
}
.card__tags {
  width: calc(100% - 32px);
  display: flex;
  gap: 16px;
  overflow-x: auto;
  margin: 0 16px;
  padding-bottom: 5px;
}
.card__tags::-webkit-scrollbar {
  width: 0px;
  height: 8px;
}
.card__tags::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: var(--bg-neutral-300);
}
.card__tags::-webkit-scrollbar-track {
  background-color: var(--bg-neutral-100);
  border-radius: 4px;
}
.card__tag {
  flex-shrink: 0;
  width: auto;
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  padding: 4px 8px;
  cursor: move;
  border-radius: 40px;
}
.card__tag span:nth-child(2) {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-body);
}
/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
  color: var(--bg-neutral-500);
}
</style>
