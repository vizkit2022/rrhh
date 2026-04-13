<script setup>
  import { defineEmits, defineProps } from "vue";

  const props = defineProps({
    description: {
      type: String,
      default: "",
    },
  });

  const emit = defineEmits(["closeModal"]);
</script>

<template>
  <div class="containerDialog">
    <div class="containerDialog__title">
      <span>Descripción</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--bg-neutral-200"
        colorHover="--bg-neutral-400"
        colorActive="--bg-neutral-600"
        size="l"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="containerDialog__content scroll">
      <p v-html="props.description.replace(/\n/g, '<br>')"></p>
    </div>
  </div>
</template>

<style scoped>
  .containerDialog {
    height: 100%;
    display: grid;
    grid-template-rows: 40px 1fr;
    gap: 20px;
  }
  .containerDialog__title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    width: 100%;
  }
  .containerDialog__title span {
    font-family: Nunito;
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-700);
  }
  .containerDialog__content {
    overflow-y: auto;
    padding-right: 10px;
  }
  .containerDialog__content p {
    text-align: justify;
  }
  /* modifications of customs components */
  .btnIconModify {
    border-radius: 50%;
    color: var(--bg-neutral-500);
  }
</style>
