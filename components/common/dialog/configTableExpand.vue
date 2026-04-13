<script setup>
import { ref, defineProps, defineEmits, computed, onBeforeUnmount } from "vue";

const props = defineProps({
  configTableLive: {
    type: Object,
    required: true,
  },
  localStorageName: {
    type: String,
    default: "ConfigExpand",
  },
});

const emit = defineEmits();

const configTableLive = ref(props.configTableLive);

//Subheader
const toggleSubcol = (colIndex, subcolIndex) => {
  const col = configTableLive.value.cols[colIndex];
  const subcol = col.subcols[subcolIndex];

  subcol.show = !subcol.show;

  if (col.subcols.some(sub => sub.show)) {
    col.show = true;
  } else {
    col.show = false;
  }
  saveOptions();
};

//Header
const toggleCol = (colIndex) => {
  const col = configTableLive.value.cols[colIndex];
  col.show = !col.show;

  if (!col.show) {
    col.subcols.forEach(sub => sub.show = false);
  }
  saveOptions();
};

const saveOptions = () => { 
  localStorage.setItem(props.localStorageName, JSON.stringify(configTableLive.value));
};

// Save options before component unmounts
onBeforeUnmount(() => {
  saveOptions();
});

onMounted(() => {
  window.addEventListener("keydown", handleEscapeKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleEscapeKey);
});

const handleEscapeKey = (event) => {
  if (event.key === "Escape" || event.key === "Esc") {
    emit('closeModal');
  }
};

// Filter columns to exclude selected
const filteredCols = computed(() => {
  return configTableLive.value.cols.filter(col => col.type !== 'selected').map(col => {
    return {
      ...col,
      subcols: col.subcols.filter(subcol => subcol.type !== 'selected')
    };
  });
});
</script>

<template>
  <div class="containerVisbleData">
    <div class="containerVisbleData__header">
      <span>{{ $t('configTableExpand.title') }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--neutral-text-caption"
        type="outlined"
        size="l"
        @click="emit('closeModal')"  
      />
    </div>
    <div class="containerVisbleData__body scroll">
      <div class="containerVisbleData__body-item" v-for="(col, colIndex) in filteredCols" :key="colIndex">
        <span>{{ $t(col.translateRoute) }}</span>
        <div class="containerVisbleData__container">
          <div v-for="(subcol, subcolIndex) in col.subcols" :key="subcolIndex" class="containerVisbleData__sub-item">
            <u-switch v-model="subcol.show" @change="toggleSubcol(colIndex, subcolIndex)" />
            <span>{{ $t(subcol.translateRoute) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="containerVisbleData__action">
      <span>{{ $t('configTableExpand.warning') }}</span>
    </div>
  </div>
</template>

<style scoped>
/* BEM CSS */
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
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  line-height: 16px;
}
.containerVisbleData__body-item:not(:last-child) {
  padding-bottom: 24px;
  border-bottom: 1px solid var(--neutral-border-subtle);
}
.containerVisbleData__container {
  background-color: var(--neutral-surface-softer);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  border-radius: 10px;
  padding: 15px 30px 20px;
  box-sizing: border-box;
}
.containerVisbleData__sub-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.containerVisbleData__header,
.containerVisbleData__body-item,
.containerVisbleData__action {
  text-align: left;
  font-weight: 600;
  letter-spacing: 0em;
  color: var(--neutral-text-body);
}

.containerVisbleData__action {
  font-size: 14px;
  line-height: 14px;
  font-weight: 600;
  color: var(--danger-text-default);
}

/* modifications of customs components */
.btnIconModify {
  border-radius: 50%;
}

@media only screen and (max-width: 520px) {
  .containerVisbleData__body {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
