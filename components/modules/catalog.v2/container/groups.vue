<script setup>
  import useCatalogStore from "@/stores/catalog";
  import { onMounted, ref, defineEmits } from "vue";
  const catalogStore = useCatalogStore();
  const search = ref("");
  const headers = [
    { type: "checkbox", button: false, grid: "20px", property: "selected" },
    {
      type: "text_group",
      label: "Item",
      button: true,
      grid: "minmax(350px,1fr)",
      property: "name",
    },
    {
      type: "date",
      label: "Creación",
      button: true,
      grid: "150px",
      property: "createdAt",
    },
    {
      type: "mount",
      label: "Precio Promedio",
      grid: "minmax(150px,1fr)",
      property: "numbers.price.average.value",
      position: "right",
    },
    {
      type: "mount",
      label: "Precio Establecido",
      grid: "minmax(150px,1fr)",
      property: "numbers.price.default.value",
      position: "right",
    },
    {
      type: "mount",
      label: "Costo Promedio",
      button: true,
      grid: "minmax(140px,1fr)",
      property: "numbers.budget.average.value",
      position: "right",
    },
    {
      type: "mount",
      label: "Costo Establecido",
      grid: "minmax(140px,1fr)",
      property: "numbers.budget.default.value",
      position: "right",
    },
    {
      type: "mount",
      label: "Frecuencia de Uso",
      button: true,
      grid: "minmax(100px,1fr)",
      property: "numbers.budget.default.value",
      position: "right",
    },
  ];


  onMounted(async () => {
    catalogStore.page = 1;
    catalogStore.nextPage = 1;
    await catalogStore.getItemsGroups();
  });
</script>

<template>
  <div class="container">
    <div class="container__filters">
      <div>
        <u-input v-model="search" type="text" placeholder="Buscar..." />
        <!-- <u-button
          class="btnDesktop"
          text="Filtrar"
          icon="filter"
          :revers="true"
          type="outlined"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
        /> -->
        <u-button
          class="btnDesktop"
          text="Datos Visibles"
          icon="toggle"
          :revers="true"
          type="outlined"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
        />
      </div>
      <div>
        <!-- <u-button-icon
          class="btnMobile"
          type="outlined"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
          icon="filter"
        /> -->
        <u-button-icon
          class="btnMobile"
          icon="toggle"
          type="outlined"
          color="--bg-neutral-500"
          colorHover="--bg-neutral-600"
          colorActive="--bg-neutral-700"
        />
        <u-button-icon
          icon="delete"
          type="outlined"
          color="--bg-danger-500"
          colorHover="--bg-danger-400"
          colorActive="--bg-danger-600"
        />
        <u-button text="Desagrupar" icon="folder" type="outlined" />

        <u-button class="btnDesktop" text="Agregar item" icon="new-project" />
        <u-button-icon class="btnMobile" icon="new-project" />
      </div>
    </div>
    <catalogTableGroups :headers="headers" :content="catalogStore.groups" />
  </div>
</template>

<style scoped>
  .container {
    height: calc(100vh - 80px - 84px - 140px - 52px);
    width: calc(100vw - 100px);
    background-color: var(--white);
    box-shadow: var(--shadow-1);
    border-radius: 24px;
    padding: 20px;
    box-sizing: border-box;
    display: grid;
    grid-template-rows: 36px 1fr;
    gap: 20px;
  }

  .container__filters {
    display: flex;
    justify-content: space-between;
    gap: 24px;
  }

  .container__filters > div {
    display: flex;
    gap: 24px;
  }

  .btnMobile {
    display: none;
  }

  @media only screen and (max-width: 768px) {
    .container {
      height: calc(100vh - 80px - 84px - 140px - 52px - 60px);
      width: calc(100vw - 40px);
    }
    input {
      width: 120px;
    }
  }
  @media only screen and (max-width: 1060px) {
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
