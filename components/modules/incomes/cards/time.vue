<script setup>
import { defineEmits, onMounted, onUnmounted } from "vue";

// Emits  
const emit = defineEmits(["saveDropdown","dropdownClose"]);

onMounted(() => {
  document.addEventListener("keydown", handleEscapeKey);
})

onUnmounted(() => {
  document.removeEventListener("keydown", handleEscapeKey);
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    emit("dropdownClose");
  }
};
</script>

<template>
    <div>Tiempo</div>
</template>

<style scoped></style>