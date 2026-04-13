<script setup>
const props = defineProps({
  // data status
  data: {
    type: Object,
    default: null,
  },
  idSale: {
    type: String,
    default: "",
  },
  // typeStatus
  typeStatus: {
    type: String,
    default: "",
  },
  tooltipOffsetX: {
    type: Number,
    default: 0,
  },
});
</script>

<template>
  <!-- Status SII CHILE-->
  <SalesComponentsStatusSii
    v-if="props.typeStatus === 'sii'"
    :data="props.data"
    :id-sale="props.idSale"
    :tooltip-offset-x="props.tooltipOffsetX"
  />
</template>

<style scoped></style>
