<script setup>
import { computed, onMounted, watch } from "vue";
import { metrics } from "@/utils/labels/incomes.json";
import useIncomeStore from "@/stores/incomes";
import useLinesStore from "@/stores/lines";
import useGlobalStore from "@/stores/global";
import usePermissionStore from "@/stores/permissions";
// Stores
const incomesStore = useIncomeStore();
const linesStore = useLinesStore();
const globalStore = useGlobalStore();
const permissionsStore = usePermissionStore();

// Constans
const settings = ref(false);
const settingsMetrics = ref({ surcharges: true, metrics: [] });
const surcharges = ref([]);

// mapeado de permisos con las metricas de cada columna de la grilla
const permissionMapMetrics = {
  income_grid_col_incomes: ["sumPrice"],
  income_grid_col_budget: ["sumBudget", "budgetUtility", "cost"],
  income_grid_col_cost: ["toSpend"],
  income_grid_col_projected: ["projectedUtility"],
}

// Mounted
onMounted(() => {
  getSettings();
});

watch(
  () => linesStore.linesSurcharges,
  () => {
    surcharges.value = linesStore.linesSurcharges
      .filter((l) => !l.isCut)
      .map((l, pos) => {
        return {
          ...l,
          show: surcharges?.value?.[pos]?.show || false,
          order: pos + 1,
        };
      });
  }
);

watch(
  () => incomesStore.totalGrossIncome,
  () => {
    getSettings();
  }
);

// Functions
const getSettings = () => {
  const settingsStorage = localStorage.getItem("settingsMetrics");
  if (settingsStorage) {
    const settings = JSON.parse(settingsStorage);
    settingsMetrics.value = mergeTableSettings(settings);
  } else {
    settingsMetrics.value = mergeTableSettings();
  }
};

const mergeTableSettings = (config = null) => {
  const totalsProps = config
    ? config.metrics
    : [
        {
          label: { es: "Total Venta", en: "Total Sale" },
          amountProp: "sumPrice",
          bgcolor: "--warning-surface-light",
          color: "--warning-text-darker",
          show: true,
          disabled: false,
          order: 1,
          mandatoryPercentage: true,
          showPercentage: false,
        },
        {
          label: { es: "Total Presupuestado", en: "Production Cost" },
          amountProp: "sumBudget",
          bgcolor: "--info-surface-light",
          color: "--info-text-darker",
          show: true,
          order: 2,
          mandatoryPercentage: true,
          showPercentage: false,
        },
        {
          label: { es: "Costo Total", en: "Actual Cost" },
          amountProp: "cost",
          bgcolor: "--danger-surface-light",
          color: "--danger-text-darker",
          show: true,
          order: 4,
          mandatoryPercentage: true,
          showPercentage: false,
        },
        {
          label: { es: "Por Gastar", en: "Budget Remaining" },
          amountProp: "toSpend",
          bgcolor: "--danger-surface-light",
          color: "--danger-text-darker",
          show: true,
          order: 5,
          mandatoryPercentage: true,
          showPercentage: false,
        },
        {
          label: { es: "Utilidad Proyectada", en: "Projected Utility" },
          amountProp: "projectedUtility",
          percentage: "projectedMargin",
          bgcolor: "--success-surface-light",
          color: "--success-text-darker",
          show: true,
          order: 6,
          mandatoryPercentage: true,
          showPercentage: true,
        },
      ];
  const metrics = totalsProps.map((t) => {
    return {
      ...t,
      percentage: {
        state: t.showPercentage,
        value:
          totals.value[t.percentage]?.value !== undefined
            ? totals.value[t.percentage].value
            : "0 %",
      },
    };
  });
  const surchargesAmount = config
    ? config.surcharges
    : surcharges.value.length !== 0;
  return {
    metrics,
    surcharges: surchargesAmount,
  };
};

const updatedMetrics = (newSettings) => {
  settingsMetrics.value = newSettings;
};

// Computed
const lang = computed(() => {
  return globalStore.lang;
});

const totals = computed(() => {
  return incomesStore?.totalGrossIncome;
});

const totalSurcarges = computed(() => {
  return incomesStore?.totalGrossIncome?.surcharges?.value || "-";
});

const getPercentage = (prop) => {
  if (prop === "budgetUtility") {
    return incomesStore?.totalGrossIncome?.budgetMargin?.value || "0%";
  }
  if (prop === "projectedUtility") {
    return incomesStore?.totalGrossIncome?.projectedMargin?.value || "0%";
  } else {
    return "0%";
  }
};

const getAmount = (prop) => {
  return incomesStore?.totalGrossIncome[prop]?.value || "-";
};

// filtrado de permisos por metricas por permiso
const filteredMetrics = computed(() => {
  return settingsMetrics.value.metrics.filter((m) => {
    return (
        Object.entries(permissionMapMetrics).some(([permKey, codes]) => {
          return permissionsStore.myPermissions[permKey] === true && codes.includes(m.amountProp)
        }) && m.show
    )
  });
})


</script>

<template>
  <div class="containerChips">
    <div class="chips">
      <div class="chips__list">
        <div class="chips__item" v-if="settingsMetrics.surcharges && permissionsStore.myPermissions.view_income_movement_totales">
          <span class="chips__title truncateText">
            {{ metrics.additionalText.mainMetric[lang] }}
          </span>
          <div></div>
          <u-loading v-if="incomesStore.loadings.metrics" :width="16" />
          <span v-else class="chips__amount">{{ totalSurcarges }}</span>
        </div>
        <template v-else>
          <div
            class="chips__item"
            v-for="(surcharge, s) in surcharges.filter((s) => s.show)"
            :key="s"
          >
            <span class="chips__title truncateText">
              {{ surcharge.name }}
            </span>
            <u-loading v-if="incomesStore.loadings.metrics" :width="16" />
            <span v-else class="chips__amount">{{
              surcharge.numbers.sumPrice.value || 0
            }}</span>
          </div>
        </template>
        <div
          class="chips__item"
          v-for="(total, t) in filteredMetrics"
          :key="t"
          :style="`column-gap: ${
            total.mandatoryPercentage && total.percentage.state ? '10px' : '0px'
          };`"
        >
          <span
            class="chips__title truncateText"
            :style="`color: var(${total.color});`"
            >{{ total.label[lang] }}</span
          >
          <u-loading v-if="incomesStore.loadings.metrics" :width="16" />
          <span class="chips__amount" v-else>{{ getAmount(total.amountProp) }}</span>
          <div
            :class="`chips__percentage ${
              total.percentage.positive === '+' ? 'positive' : 'negative'
            }`"
          >
            <template
              v-if="total.mandatoryPercentage && total.percentage.state"
            >
              <u-loading v-if="incomesStore.loadings.metrics" :width="16" />
              <span v-else>{{ getPercentage(total.amountProp) }}</span>
            </template>
          </div>
        </div>
      </div>
      <button class="chips__config" @click="settings = true">
        <span class="u u-settings"></span>
      </button>
    </div>
  </div>
  <u-dialog
    :showModal="settings"
    width="600px"
    height="610px"
    @closeModal="settings = false"
  >
    <IncomesDialogMetrics
      @closeModal="settings = false"
      :settings="settingsMetrics"
      :surcharges="surcharges"
      @updatedMetrics="updatedMetrics"
    />
  </u-dialog>
</template>

<style scoped>
span {
  font-family: Nunito;
}
.containerChips {
  display: flex;
  justify-content: center;
  width: 100%;
}
.chips {
  width: auto;
  display: grid;
  grid-template-columns: auto 36px;
  gap: 20px;
}
.chips__list {
  height: 48px;
  padding: 2px 4px 6px;
  width: auto;
  display: flex;
  gap: 20px;
  overflow-y: auto;
}
.chips__list::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}
.chips__item {
  flex-shrink: 0;
  width: auto;
  max-width: 225px;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: 1fr 1fr;
  grid-template-areas: "title percentage" "amount percentage";
  height: 40px;
  padding: 4px 12px;
  border-radius: 12px;
  background-color: var(--neutral-background-default);
  box-shadow: var(--elevation-xs);
}
.chips__config {
  margin-top: 2px;
  width: 40px;
  height: 40px;
  padding: 4px 12px;
  border-radius: 12px;
  background-color: var(--neutral-background-default);
  box-shadow: var(--elevation-xs);
  display: flex;
  justify-content: center;
  align-items: center;
}
.chips__config span {
  font-size: 24px;
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.chips__config:hover span {
  color: var(--primary-text-default);
  transition: 0.3s;
}
.chips__title {
  grid-area: title;
  font-size: 10px;
  font-weight: 800;
  line-height: 14px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--primary-text-default);
}
.chips__amount {
  grid-area: amount;
  font-size: 14px;
  font-weight: 800;
  line-height: 18px;
  color: var(--neutral-text-body);
}
.chips__percentage {
  grid-area: percentage;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  display: flex;
  align-items: center;
}
.chips__percentage.positive span {
  color: var(--success-text-default);
}
.chips__percentage.negative span {
  color: var(--danger-text-default);
}
.chips__percentage button {
  display: flex;
  justify-content: center;
  align-items: center;
}
.chips__percentage button span {
  font-size: 16px;
  line-height: 16px;
  color: var(--neutral-text-caption);
}
</style>
