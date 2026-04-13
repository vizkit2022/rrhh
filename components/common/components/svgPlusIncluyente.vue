<script setup>
defineProps({
  color: {
    type: String,
    default: "currentColor",
  },
  size: {
    type: [String, Number],
    default: 12,
  },
});
</script>

<template>
  <svg
    :style="{ fill: color }"
    :width="size"
    :height="size"
    viewBox="0 0 12 12"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M5.25 11.25C5.25 11.6642 5.58579 12 6 12C6.41421 12 6.75 11.6642 6.75 11.25V6.75H11.25C11.6642 6.75 12 6.41421 12 6C12 5.58579 11.6642 5.25 11.25 5.25H6.75V0.75C6.75 0.335786 6.41421 0 6 0C5.58579 0 5.25 0.335786 5.25 0.75V5.25H0.75C0.335786 5.25 0 5.58579 0 6C0 6.41421 0.335786 6.75 0.75 6.75H5.25V11.25Z"
    />
  </svg>
</template>