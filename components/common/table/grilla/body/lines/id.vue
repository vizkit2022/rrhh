<script setup>
import { defineProps } from "vue";
import useGrillaStore from "@/stores/grilla";

// Stores
const grillaStore = useGrillaStore();

// Props
const props = defineProps({
  line: {
    type: Object,
    default: () => ({}),
  },
});

// Computed
const isDeleting = computed(() => props?.line?.data?.__deleting || false);
const existsInBackend = computed(() => props?.line?.data?._id);
const disabled = computed(() => {
  if(grillaStore.selectedCellsState !== null) return false;
  return !existsInBackend.value || isDeleting.value || grillaStore.updating;
});

</script>

<template>
  <td :style="grillaStore.getColumnStyle('id')" :class="{ 'body-fixed-column': grillaStore.fixed }">
    <div class="id">
      <span v-text=" props?.line?.data?.globalOrder || '-'"></span>
    </div>
  </td>
</template>

<style scoped>
td {
  border-right: 1px solid var(--neutral-border-subtle);
}
.id {
  height: 100%;
  width: 100%;
  padding: 0 12px;
  display: flex;
  align-items: center;
}
.id span {
  color: v-bind("disabled ? 'var(--neutral-text-disabled)' : 'var(--neutral-text-body)'");
  font-size: 12px !important;
  font-weight: 600;
  line-height: 10px;
}
</style>