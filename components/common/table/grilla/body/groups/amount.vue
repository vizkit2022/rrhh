<script setup>
import { defineProps, computed } from "vue";
import useGrillaStore from "@/stores/grilla";

// Store
const grillaStore = useGrillaStore();

// Props
const props = defineProps({
  config: {
    type: Object,
    default: () => ({}),
  },
  line: {
    type: Object,
    default: () => ({}),
  },
});

const numberData = computed(() => {
  const prop = props?.config?.subcolumn?.prop;
  return props?.line?.data?.numbers?.[prop] ?? {};
});

// Computed
const amountText = computed(() => numberData.value?.value ?? "");
const isParent = computed(() => props?.line?.data?.isParent);
const isExpand = computed(() => props?.line?.data?.expand);
const amountNumber = computed(() => numberData.value?.number ?? 0);
const isDeleting = computed(() => props?.line?.data?.__deleting || false);
const existsInBackend = computed(() => props?.line?.data?._id);
const disabled = computed(() => !existsInBackend.value || isDeleting.value || grillaStore.updating);
const isLocked = computed(() => props?.config?.column.prop === 'outcomes' && props?.line?.data?.isClosedLine)

</script>

<template>
  <div class="amount" :title="amountNumber">
    <span class="u u-locked" v-if="isLocked"></span>
    <span v-if="isParent" class="truncateText amountText parent">{{ amountText }}</span>
    <span v-else class="truncateText amountText child">{{ amountText }}</span>
  </div>
</template>


<style scoped>
.amount {
  display: flex;
  align-items: center;
  justify-content: v-bind("isLocked ? 'space-between' : 'flex-end'");
  padding: 0 12px;
  gap: 12px;
  width: 100%;
  height: 100%;
}
.amount .u {
  color: var(--neutral-text-disabled);
}
.amount span {
  display: block;
  max-width: 172px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 12px;
  font-weight: 600;
}
.amount span.parent {
  color: v-bind("disabled ? 'var(--neutral-text-disabled)' : isExpand ? 'var(--neutral-text-body)' : 'var(--neutral-text-title)'");
}
.amount span.child {
  color: v-bind("disabled ? 'var(--neutral-text-disabled)' : 'var(--neutral-text-caption)'");
}
</style>
