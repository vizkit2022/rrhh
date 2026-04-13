<script setup>
import useUserStore from "@/stores/user";

// STORES
const userStore = useUserStore();

</script>

<template>
  <div class="cover__topBar">
    <button @click="userStore.showModalDataSheet = false">
      <span class="u u-undo"></span>
      <span>Volver</span>
    </button>
  </div>
</template>

<style scoped>
.cover__topBar {
  width: 100%;
  height: 32px;
}

button {
  color: var(--secondary-text-default);
  animation: pulse 1.5s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 0 20px;
  height: 32px;
  background-color: var(--secondary-surface-light);
  border-radius: 16px;
}

button span {
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 24px;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(76, 75, 224, 0.3);
  }
  70% {
    box-shadow: 0 0 0 8px rgb(76, 75, 224, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgb(76, 75, 224, 0);
  }
}
</style>
