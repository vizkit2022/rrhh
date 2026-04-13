<script setup>
  import { defineProps, computed } from "vue";
  import useGlobalStore from "@/stores/global";

  const globalStore = useGlobalStore();

  const props = defineProps({
    size: {
      type: String,
      default: "m",
    },
    placeholder: {
      type: String,
      default: "",
    },
  });

  const placeholderText = computed(() => {
    const placeholders = {
      es: "Buscar ...",
      en: "Search ...",
    };
    return (
      props.placeholder || placeholders[globalStore.lang] || placeholders.es
    );
  });
</script>

<template>
  <div :class="['search', props.size]">
    <button class="searchType">
      <span class="u u-building"></span>
    </button>
    <input :class="props.size" type="text" :placeholder="placeholderText" />
  </div>
</template>

<style scoped>
  * {
    font-family: Nunito;
  }
  .search {
    display: flex;
    position: relative;
  }
  input {
    width: calc(100% - 50px);
    padding: 0 20px;
    border: 1px solid var(--neutral-border-default);
    border-left: none;
    color: var(--neutral-text-body);
    position: absolute;
    right: 0px;
    font-size: 14px;
  }
  input::placeholder {
    color: var(--neutral-text-caption);
  }
  input:not(:disabled):active,
  input:not(:disabled):focus {
    width: calc(100% - 50px + 1px);
    z-index: 2;
    box-shadow: v-bind(
      "props.error ? 'inset var(--bg-danger-500) 0px 0px 0px 1px' : 'inset var(--primary-border-subtle) 0px 0px 0px 1px'"
    );
    border: v-bind(
      "props.error ? '1px solid var(--bg-danger-500)' : '1px solid var(--primary-border-subtle)'"
    );
  }

  /* Sizes */
  input.xl,
  .search.xl {
    height: 48px;
  }
  input.l,
  .search.l {
    height: 40px;
  }
  input.m,
  .search.m {
    height: 36px;
  }
  input.s,
  .search.s {
    height: 32px;
  }

  /* Rounded Corners */
  input.xl {
    border-radius: 0 18px 18px 0;
  }
  input.l {
    border-radius: 0 16px 16px 0;
  }
  input.m {
    border-radius: 0 14px 14px 0;
  }
  input.s {
    border-radius: 0 12px 12px 0;
  }

  .search.xl .searchType {
    border-radius: 18px 0 0 18px;
  }
  .search.l .searchType {
    border-radius: 16px 0 0 16px;
  }
  .search.m .searchType {
    border-radius: 14px 0 0 14px;
  }
  .search.s .searchType {
    border-radius: 12px 0 0 12px;
  }
  /* Boton del tipo del buscador */
  .searchType {
    width: 50px;
    height: 100%;
    border: 1px solid var(--neutral-border-default);
    background-color: var(--neutral-surface-shadow-8a);
    transition: 0.3s;
    position: absolute;
    left: 0px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    padding-left: 2px;
  }
  .searchType span {
    color: var(--neutral-text-caption);
    font-size: 18px;
    transition: 0.3s;
  }
  .searchType.selected,
  .searchType:hover {
    width: 51px;
    z-index: 2;
    background-color: var(--primary-surface-shadow-8a);
    border: 1px solid var(--primary-border-subtle);
    box-shadow: inset var(--primary-border-subtle) 0px 0px 0px 1px;
  }
  .searchType.selected span,
  .searchType:hover span {
    color: var(--primary-text-default);
  }
</style>
