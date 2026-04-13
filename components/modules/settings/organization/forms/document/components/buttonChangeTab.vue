<script setup>
import { ref } from "vue";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

//STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// CONSTANTS
const tabs = [
  { id: 0, name: {
    en: "Purchase Document",
    es: "Documento de Compras"
  } },
  { id: 1, name: {
    en: "Sales Document",
    es: "Documento de Venta"
  } },
];
</script>

<template>
  <div class="tabs">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="tab"
      :class="{ activeTab: organizationStore.tabDocsType === tab.id }"
      @click="organizationStore.tabDocsType = tab.id"
    >
      <span class="name truncateText">{{ tab.name[globalStore.lang] }}</span>
    </div>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  height: auto;
  width: fit-content;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background-color: var(--secondary-surface-shadow-8a);
  border-radius: 16px;
  justify-content: flex-start;
}

.tab {
  cursor: pointer;
  display: flex;
  min-width: 160px;
  height: 27px;
  width: 192px;
  border-radius: 12px;
  padding: 0px 12px;
  gap: 8px;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.tab:hover {
  background-color: var(--secondary-surface-shadow-12a);
}

.activeTab {
  background-color: var(--secondary-surface-shadow-12a);
}

.tab .name {
  color: var(--neutral-text-body);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0em;
  text-align: center;
}
</style>
