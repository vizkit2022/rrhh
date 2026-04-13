<script setup>
import { ref } from "vue";

// CONSTANS
const parameters = ref([
  {
    title: "Datos Generales",
    expand: true,
    rows: [
      {
        name: "Nombre",
        prop: "name",
        mandatory: true,
        optional: false,
        noApply: false,
      },
      {
        name: "Alias",
        prop: "alias",
        mandatory: true,
        optional: false,
        noApply: false,
      },
      {
        name: "contactType",
        prop: "Tipo de Contacto",
        mandatory: true,
        optional: false,
        noApply: false,
      },
      {
        name: "Rut",
        prop: "idNumber",
        mandatory: true,
        optional: false,
        noApply: false,
      },
      {
        name: "Giro",
        prop: "giro",
        mandatory: true,
        optional: false,
        noApply: false,
      },
      {
        name: "Roles",
        prop: "role",
        mandatory: true,
        optional: false,
        noApply: false,
      },
      {
        name: "Cumpleaños",
        prop: "birthday",
        mandatory: true,
        optional: false,
        noApply: false,
      },
    ],
  },
  {
    title: "Información de Contacto",
    expand: true,
    rows: [
      {
        name: "Correo",
        prop: "email",
        mandatory: true,
        optional: false,
        noApply: false,
      },
      {
        name: "Teléfono",
        prop: "phone",
        mandatory: true,
        optional: false,
        noApply: false,
      },
      {
        name: "Dirección",
        prop: "address",
        mandatory: true,
        optional: false,
        noApply: false,
      },
      {
        name: "Teléfono Secundario",
        prop: "secondaryPhone",
        mandatory: true,
        optional: false,
        noApply: false,
      },
      {
        name: "Correo Secundario",
        prop: "secondaryEmail",
        mandatory: true,
        optional: false,
        noApply: false,
      },
    ],
  },
]);
</script>

<template>
  <div class="dataSheet">
    <div class="dataSheet__filter">
      <span class="text">Ficha de Contactos</span>
      <u-button text="Guardar" icon="save" />
    </div>
    <div class="dataSheet__table">
      <ParametersComponentsBasicTable
        v-for="parameter in parameters"
        :key="parameter.title"
        :parameter="parameter"
      />
    </div>
  </div>
</template>

<style scoped>
.dataSheet {
  display: grid;
  grid-template-rows: 36px 1fr;
  gap: 24px;
}
.dataSheet__filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 36px;
}
.dataSheet__filter span.text {
  font-family: Nunito;
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: var(--neutral-text-body);
}
.dataSheet__table {
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  padding: 2px;
  box-sizing: border-box;
  height: calc(100vh - 60px - 106px - 36px - 24px - 60px - 20px);
}
.dataSheet__table::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.dataSheet__table::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
</style>
