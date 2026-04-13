export const cellComponents = {
  number: defineAsyncComponent(() => import("../components/common/table/grilla/body/groups/number.vue")),
  unit: defineAsyncComponent(() => import("../components/common/table/grilla/body/groups/unit.vue")),
  currency: defineAsyncComponent(() => import("../components/common/table/grilla/body/groups/currency.vue")),
  amount: defineAsyncComponent(() => import("../components/common/table/grilla/body/groups/amount.vue")),
  realCost: defineAsyncComponent(() => import("../components/common/table/grilla/body/groups/realCost.vue")),
  percentage: defineAsyncComponent(() => import("../components/common/table/grilla/body/groups/percentage.vue")),
};
