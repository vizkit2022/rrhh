<script setup>
import { ref, onMounted } from "vue";

import useIncomesStore from "@/stores/incomes";
import useGlobalStore from "@/stores/global";
const incomesStore = useIncomesStore();
const globalStore = useGlobalStore();
const loading = ref(false);
const fullScreen = ref(false);

globalStore.loading = true;

// Mounted lifecycle hook
onMounted(async () => {
  globalStore.loading = false;
  description.value = incomesStore.income.description;
  observation.value = incomesStore.income.observation;
});

const description = ref("");
const observation = ref("");
const save = async (text) => {
  console.log("se activa save", text);
  if (text == "description") {
    await incomesStore.updateMovementTexts({
      description: description.value,
      _id: incomesStore.income._id,
    });
  } else if (text == "observation") {
    await incomesStore.updateMovementTexts({
      observation: observation.value,
      _id: incomesStore.income._id,
    });
  } else {
    return;
  }
};
</script>

<template>
  <div class="container">
    <!-- <div class="container__filters">
      <div class="search">
        <u-input
          v-model="search"
          placeholder="Buscar ..."
          :revers="true"
          icon="search"
        />
        <u-button
          class="btnDesktop"
          text="Datos Visibles"
          icon="toggle"
          :revers="true"
          type="outlined"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
          @action-btn="visibleDataModal = true"
        />
      </div>
      <div>
        <u-button-icon
          class="btnMobile"
          icon="toggle"
          type="outlined"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
          @action-btn="visibleDataModal = true"
        />
        <u-button-icon
          icon="delete"
          type="outlined"
          color="--bg-danger-500"
          colorHover="--bg-danger-400"
          colorActive="--bg-danger-600"
          @action-btn="modalDelete = true"
          :disabled="
            !incomesStore[tabSelected === 0 ? 'projects' : 'movements'].some(
              (c) => c.selected
            )
          "
        />
        <u-button
          class="btnDesktop"
          text="Crear Proyecto"
          icon="new-project"
          @action-btn="createModal = true"
        />
        <u-button-icon
          class="btnMobile"
          icon="new-project"
          @action-btn="createModal = true"
        />
        <u-button-icon
          :icon="fullScreen ? 'minimize-1' : 'maximize-1'"
          type="outlined"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
          @action-btn="fullScreen = !fullScreen"
        />
      </div>
    </div> -->
    <div class="containerMain">
      <div class="label">Descripción</div>
      <div class="label">Observaciones</div>
    </div>
    <div class="containerMain">
      <u-textarea-html
        v-model="description"
        :disabled="loading"
        heightCustom="calc(50vh)"
        placeholder="Ingrese una descripción del movimiento..."
        @change="save('description')"
      />
      <u-textarea-html
        v-model="observation"
        :disabled="loading"
        heightCustom="calc(50vh)"
        placeholder="Ingrese una observación del movimiento..."
        @change="save('observation')"
      />
    </div>
  </div>
</template>

<style scoped>
.containerMain {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.label {
  font-weight: 600;
  color: var(--neutral-text-body);
  padding-left: 4px;
  margin-bottom: 4px;
}
.container {
  height: v-bind("fullScreen ? '100vh' : 'calc(100vh -  49px  - 52px)'");
  width: v-bind("fullScreen ? '100vw' : 'calc(100vw - 100px )'");
  background-color: var(--neutral-background-default);
  box-shadow: v-bind("fullScreen ? 'none' : 'var(--shadow-1)'");
  border-radius: v-bind("fullScreen ? '0px' : '24px'");
  padding: 20px;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 36px 32px 1fr 60px;
  gap: 20px;
  position: v-bind("fullScreen ? 'absolute' : ''");
  top: 0;
  left: 0;
  z-index: v-bind("fullScreen ? 1000 : ''");
}

.container__filters {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-self: center;
}

.container__filters > div {
  display: flex;
  gap: 24px;
}

.container__filters .search {
  display: grid;
  grid-template-columns: 400px auto auto;
}

.btnMobile {
  display: none;
}
.modalConfirm {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-around;
  gap: 20px;
}
.modalConfirm h2 {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: var(--neutral-text-body);
}
.modalConfirm div {
  display: flex;
  justify-content: space-between;
}
.btnModalModify {
  width: calc(50% - 10px);
}

@media only screen and (max-width: 818px) {
  .container__filters .search {
    grid-template-columns: 1fr;
  }
}

@media only screen and (max-width: 768px) {
  .container {
    height: v-bind("fullScreen ? '100vh' : 'calc(100vh - 80px - 84px )'");
    width: v-bind("fullScreen ? '100vw' : 'calc(100vw - 40px)'");
  }
}
@media only screen and (max-width: 1206px) {
  .btnMobile {
    display: flex;
  }
  .btnDesktop {
    display: none;
  }
  .container__filters > div {
    gap: 12px;
  }
}
</style>
