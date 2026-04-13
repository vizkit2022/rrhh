<script setup>
import { defineProps, computed } from "vue";
import useGrillaStore from "@/stores/grilla";
import useLinesStore from "@/stores/lines";

// Store
const grillaStore = useGrillaStore();
const linesStore = useLinesStore();

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
const index = computed(() => linesStore.lines.findIndex(
  (l) => l.__id === props.line.data.__id
));
const amountText = computed(() => numberData.value?.value ?? "");
const amountNumber = computed(() => numberData.value?.number ?? 0);
const componentCost = computed(() => {
    if(props.line.data.isParent) return 'div';
    return amountNumber.value === 0 ? 'div' : 'button';
});
const classCost = computed(() => {
  if (props.line.data.isParent) return 'realCost';
  return amountNumber.value === 0 ? 'realCost' : 'realCost withPurchases';
});
const isDeleting = computed(() => props?.line?.data?.__deleting || false);
const existsInBackend = computed(() => props?.line?.data?._id);
const disabled = computed(
  () => !existsInBackend.value || isDeleting.value || grillaStore.updating,
);
const isLocked = computed(
  () =>
    props?.config?.column.prop === "outcomes" &&
    props?.line?.data?.isClosedLine,
);


const showMenuCell = () => {
  if(componentCost.value === 'div') return;

  const id = `realCost-${index.value}`;
  const obj = {
    id,
    type: props?.config?.column?.prop || "",
    header: props?.config?.subcolumn || {},
    line: props?.line || {},
    posLine: index.value || 0,
  };

  console.log('showMenuCell', obj);

  setTimeout(() => {
    grillaStore.showMenuCell(obj);
  }, 10);
};
</script>

<template>
  <div style="width: 100%; height: 100%;">
      <component
        :is="componentCost"
        :class="classCost"
        :disabled="disabled"
        :title="amountNumber"
        @click="showMenuCell"
        :id="componentCost === 'button' ? `realCost-${index}` : ''"
      >
        <div>
          <span class="u u-locked" v-if="isLocked"></span>
        </div>
        <span
          :class="`truncateText ${props.line.data.isParent ? 'category' : 'line'}`"
          >{{ amountText }}</span
        >
      </component>
  </div>
</template>

<style scoped>
.realCost {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  height: 100%;
  width: 100%;
}

.realCost.withPurchases:hover span {
  color: var(--primary-text-default);
}

.realCost .u {
  color: var(--neutral-text-disabled);
}

span {
  display: block;
  max-width: 172px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: v-bind(
    "disabled ? 'var(--neutral-text-disabled)' : 'var(--neutral-text-body)'"
  );
  line-height: 12px;
  transition: 0.3s;
}
span.category {
  font-weight: 800;
}
span.line {
  font-weight: 600;
}
</style>
