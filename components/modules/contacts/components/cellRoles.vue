<script setup>
import { defineProps, computed } from "vue";
import useGlobalStore from "@/stores/global";

// Stores
const globalStore = useGlobalStore();

// PROPS
const { item } = defineProps({
  item: {
    type: Object,
    default: () => {},
  },
});

// Computed
const lang = computed(() => {
  return globalStore.lang;
});
</script>

<template>
  <div class="cellRoles">
    <u-tags
      v-for="(role, r) in item?.item?.roles"
      :key="r"
      :text="role.name[lang]"
      size="s"
      :delete="false"
      background="--primary-surface-shadow-12a"
      color="--primary-text-default"
    />
  </div>
</template>

<style scoped>
.cellRoles {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  overflow-x: auto;
}
.cellRoles::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}
</style>
