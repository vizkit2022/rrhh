<script setup>
import { ref, onMounted, defineProps, defineEmits } from "vue";

import useLinesStore from "@/stores/lines";
import useIncomeStore from "@/stores/incomes";

// STORES
const linesStore = useLinesStore();
const incomesStore = useIncomeStore();

// EMITS
const emit = defineEmits(["loading"]);

// MOUNTED
onMounted(() => {
  linesStore.breadcrumbs = [
    { icon: "folder", label: "Categorías", sub: false, id: "" },
  ];
});

// ACTIONS
const filterByCategory = async (breadcrumb, b) => {
  console.log("filtro categoria", "la id", breadcrumb.id);
  linesStore.breadcrumbs.splice(b + 1, linesStore.breadcrumbs.length - b);
  emit("loading", true);
  !breadcrumb.id ? (breadcrumb.id = "null") : null;
  await linesStore.getAllLinesIncomes({ parent: breadcrumb.id });
  emit("loading", false);
};
</script>

<template>
  <div class="content-breadcrumb">
    <template v-for="(breadcrumb, b) in linesStore.breadcrumbs" :key="b">
      <button
        @click="filterByCategory(breadcrumb, b)"
        :class="b === linesStore.breadcrumbs.length - 1 ? 'current' : ''"
      >
        <span class="u u-folder" v-if="b === 0"></span>
        <span>{{ breadcrumb.label }}</span>
      </button>
      <span v-if="b !== linesStore.breadcrumbs.length - 1">/</span>
    </template>
  </div>
</template>

<style scoped>
span,
label,
button {
  font-family: Nunito;
}
.content-breadcrumb {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 0 16px;
  height: 28px;
}
.content-breadcrumb button {
  display: flex;
  gap: 5px;
}
.content-breadcrumb button span:not(.u) {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
}
.content-breadcrumb span {
  color: var(--neutral-text-caption);
  transition: 0.3s;
}
.content-breadcrumb button span.u {
  font-size: 16px;
  line-height: 16px;
}
.content-breadcrumb button:hover span {
  color: var(--primary-text-default);
}
.content-breadcrumb button.current span {
  color: var(--primary-text-subtle);
}
</style>
