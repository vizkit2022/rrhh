<script setup>
  import { ref, defineProps, defineEmits, onMounted, watch } from "vue";

  const props = defineProps({
    options: {
      type: Array,
      default: () => [],
    },
    colection: {
      type: String,
      default: "columnsProjects",
    },
  });
  const options = ref([]);
  const emit = defineEmits(["closeModal", "updatedHeaders"]);

  onMounted(() => {
    options.value = props.options;
  });

  const saveOptions = () => {
    localStorage.setItem(props.colection, JSON.stringify(options.value));
    setTimeout(() => {
      emit("updatedHeaders");
    }, 500);
  };
</script>

<template>
  <div class="containerVisbleData">
    <div class="containerVisbleData__header">
      <span>Columnas de la Tabla</span>
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
    <div class="containerVisbleData__body scroll">
      <div
        class="containerVisbleData__body-item"
        v-for="(op, o) in options"
        :key="o"
      >
        <u-switch v-model="op.val" @click="saveOptions" />
        <span>{{ op.label }}</span>
      </div>
    </div>
    <div class="containerVisbleData__action">
      <span>Estos cambios solo se verán en este dispositivo.</span>
    </div>
  </div>
</template>

<style scoped>
  .containerVisbleData {
    height: 100%;
    display: grid;
    grid-template-rows: 40px 1fr 20px;
    gap: 20px;
    font-family: Nunito;
  }
  .containerVisbleData__header {
    font-size: 18px;
    line-height: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .containerVisbleData__body {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 20px;
    row-gap: 15px;
    column-gap: 10px;
    overflow-y: auto;
  }
  .containerVisbleData__action {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    align-items: center;
  }
  .containerVisbleData__body-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    line-height: 16px;
  }

  .containerVisbleData__header,
  .containerVisbleData__body-item,
  .containerVisbleData__action {
    text-align: left;
    font-weight: 600;
    letter-spacing: 0em;
    color: var(--bg-neutral-700);
  }

  .containerVisbleData__action {
    font-size: 14px;
    line-height: 14px;
    font-weight: 600;
    color: var(--bg-primary-500);
  }

  /* modifications of customs components */
  .btnIconModify {
    border-radius: 50%;
    color: var(--bg-neutral-500);
  }

  @media only screen and (max-width: 520px) {
    .containerVisbleData__body {
      grid-template-columns: repeat(1, 1fr);
    }
  }
</style>
