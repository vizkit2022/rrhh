<script setup>
import { defineProps, computed } from "vue";
import useGlobalStore from "@/stores/global";

// Stores
const globalStore = useGlobalStore();

// Props
const props = defineProps({
  roles: {
    type: Array,
    default: () => [{ name: { es: "", en: "" } }],
  },
});

// Computed
const lang = computed(() => globalStore.lang);
</script>

<template>
  <div class="cellCrewRoles">
    <u-tags
      v-for="(role, r) in props.roles"
      size="s"
      :key="r"
      :text="role?.name?.[lang] || '-'"
      :delete="false"
      background="--primary-surface-shadow-8a"
      color="--primary-text-darker"
    />
  </div>
</template>

<style scoped>
.cellCrewRoles {
  display: flex;
  gap: 10px;
  flex-grow: 1;
  overflow-y: auto;
}
.cellCrewRoles::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}
</style>
