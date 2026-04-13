<script setup>
import useGlobalStore from "@/stores/global";

// STORE
const globalStore = useGlobalStore();

// CONSTANTS
const search = ref("");
</script>

<template>
  <div class="header">
    <div>
      <u-input
        v-model="search"
        icon="search"
        placeholder="Buscar..."
        size="s"
        :revers="true"
        style="width: 320px"
      />
      <u-datepicker size="s" :date="globalStore.currentDate" />
    <u-button
        class="btnDesktop"
        text="Filtrar"
        icon="filter"
        :revers="true"
        type="outlined"
        color="--neutral-surface-default"
        size="s"
        :disabled="false"
      />
      <u-button-icon
        class="btnMobile"
        title="Filtrar"
        type="outlined"
        size="s"
        icon="filter"
        color="--neutral-surface-default"
        :disabled="false"
      />
    </div>
    <div>
        <u-button text="Marcar como leidas" icon="check" size="s" />
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  height: 100%;
}

.header > div:first-child {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
}

.header > div:last-child {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
}

.btnDesktop {
  display: flex;
}
.btnMobile {
  display: none;
}

@media only screen and (max-width: 1330px) {
  .btnDesktop {
    display: none;
  }
  .btnMobile {
    display: flex;
  }
}
</style>
