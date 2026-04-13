<script setup>
import useGrillaStore from "@/stores/grilla";

const grillaStore = useGrillaStore();
</script>

<template>
  <div class="cloud">
    <template v-if="grillaStore.cloud.loading">
      <span class="u u-cloud-on"></span>
      <u-loading :width="18" class="loading" color="--neutral-text-disabled" />
    </template>
    <span v-else class="u u-cloud-check"></span>
  </div>
</template>
<!-- <span class="counter">{{ grillaStore.cloud.counter }}</span> -->

<style scoped>
.cloud {
  position: relative;
  width: 29px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.cloud span {
  font-size: 32px;
  line-height: 32px;
  color: v-bind(
    "grillaStore.cloud.loading ? 'var(--neutral-text-disabled)' : 'var(--neutral-text-caption)'"
  );
}
.cloud .loading {
  position: absolute;
  background-color: var(--neutral-background-darker);
  border-radius: 50%;
  bottom: 2px;
  right: 0px;
}
</style>
