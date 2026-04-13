<script setup>
  import useGlobalStore from "@/stores/global";
  const globalStore = useGlobalStore();

import { capitalizeName } from "@/utils/helpers";

  const breadcrumb = ref(globalStore.breadcrumb);
  watch(
    () => globalStore.breadcrumb,
    () => {
      breadcrumb.value = globalStore.breadcrumb;
    }
  );

const { t } = useI18n();
const module = "global.text";
</script>

<template>
  <div class="breadcrumb">
    <template v-if="breadcrumb.length">
      <div v-for="(bread, b) in breadcrumb" :key="b" class="breadcrumb__item">
        <NuxtLink
          :to="bread.path"
          :style="`color: var(${
            b === breadcrumb.length - 1
              ? '--primary-text-default'
              : '--neutral-text-caption'
          })`"
        >
          {{ capitalizeName(bread.name) }}</NuxtLink
        >
        <span
          v-if="b !== breadcrumb.length - 1"
          class="u u-chevron-right"
        ></span>
      </div>
    </template>
    <span v-else class="laoding" v-text="t(module + '.loading')"></span>
  </div>
</template>

<style scoped>
  .breadcrumb {
    display: flex;
  }
  .breadcrumb__item {
    display: flex;
  }
  .laoding,
  .breadcrumb__item a {
    color: var(--neutral-text-subtitle);
    transition: color 0.3s;
  }
  .breadcrumb__item a:hover {
    color: var(--neutral-text-body);
  }
  .laoding,
  .breadcrumb__item a {
    font-size: 12px;
    font-weight: 600;
  }
  .laoding,
  .breadcrumb__item a,
  .breadcrumb__item span {
    font-family: Nunito;
    line-height: 20px;
    letter-spacing: 0em;
  }
  .breadcrumb__item span {
    color: var(--neutral-text-caption);
    font-size: 12px;
    margin: 0 5px;
  }
</style>
