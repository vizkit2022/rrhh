<script setup>
import { ref} from "vue";

import {
  DialogCoverInfoCardsGeneral,
  DialogCoverInfoCardsContact,
  DialogCoverInfoCardsLinks,
} from "#components";

// CONSTANTS
const cards = ref([
  {
    title: "Datos Generales",
    inputs: [
      {
        label: "Nombre",
        required: true,
        disabled: false,
        icon: "user",
        prop: "name",
        placeholder: "Ingresa el nombre",
        show: true,
        type: "search"
      },
      {
        label: "Alias",
        required: true,
        disabled: true,
        icon: "usuarios",
        prop: "legalName",
        placeholder: "Ingresa el alias",
        show: true,
        type: "input",
      },
      {
        label: "Contacto",
        required: false,
        disabled: true,
        icon: "user",
        prop: "contact",
        placeholder: "Selecciona el tipo contacto",
        show: true,
        type: "select",
      },
      {
        label: "Rut",
        required: false,
        disabled: true,
        icon: "credit-card",
        prop: "idNumber",
        placeholder: "Ingresa el RUT",
        show: true,
        type: "input",
      },
      {
        label: "Giro",
        required: false,
        disabled: true,
        icon: "dribbble",
        prop: "businessActivity",
        placeholder: "Ingresa el giro",
        show: true,
        type: "input",
      },
      {
        label: "Roles",
        required: false,
        disabled: true,
        icon: "building",
        prop: "roles",
        placeholder: "Ingresa los roles",
        show: true,
        type: "search",
      },
      {
        label: "Cumpleaños",
        required: false,
        disabled: true,
        icon: "calendar",
        prop: "birthday",
        placeholder: "Ingresa la fecha de cumpleaños",
        show: true,
        type: "date",
      },
    ],
  },
  {
    title: "Información del Contacto",
    inputs: [
      {
        label: "Correo",
        required: true,
        disabled: true,
        icon: "email",
        prop: "email",
        placeholder: "Ingresa el correo electrónico",
        show: true,
        type: "input",
      },
      {
        label: "Teléfono",
        required: true,
        disabled:false,
        icon: "phone",
        prop: "phone",
        placeholder: "Ingresa el teléfono",
        show: true,
        type: "phone",
      },
      {
        label: "País",
        required: false,
        disabled: false,
        icon: "web",
        prop: "country",
        placeholder: "Ingresa el país",
        show: true,
        type: "map",
      },
      {
        label: "Región",
        required: false,
        disabled: false,
        icon: "web",
        prop: "state",
        placeholder: "Ingresa la región",
        show: true,
        type: "map",
      },
      {
        label: "Ciudad",
        required: false,
        disabled: false,
        icon: "web",
        prop: "city",
        placeholder: "Ingresa la ciudad",
        show: true,
        type: "map",
      },
      {
        label: "Dirección",
        required: false,
        disabled: false,
        icon: "pin",
        prop: "address",
        placeholder: "Ingresa la dirección",
        show: true,
        type: "input",
      },
      {
        label: "Teléfono 2",
        required: false,
        disabled: false,
        icon: "phone",
        prop: "phone2",
        placeholder: "Ingresa el teléfono",
        show: true,
        type: "phone",
      },
      {
        label: "Correo 2",
        required: true,
        disabled:false,
        icon: "email",
        prop: "email2",
        placeholder: "Ingresa el correo electrónico",
        show: true,
        type: "input",
      },
    ],
  },
  {
    title: "Enlaces",
    inputs: [
      {
        label: "Instagram",
        required: false,
        disabled: false,
        icon: "Instagram",
        prop: "instagram",
        placeholder: "Ingresa enlace de Instagram",
        show: true,
        type: "input",
      },
      {
        label: "Linkedin",
        required: false,
        disabled: false,
        icon: "linkedIn",
        prop: "linkedIn",
        placeholder: "Ingresa enlace de Linkedin",
        show: true,
        type: "input",
      },
      {
        label: "Youtube",
        required: false,
        disabled: false,
        icon: "youtube",
        prop: "youtube",
        placeholder: "Ingresa enlace de Youtube",
        show: true,
        type: "input",
      },
      {
        label: "X",
        required: false,
        disabled: false,
        icon: "x",
        prop: "x",
        placeholder: "Ingresa enlace de X",
        show: true,
        type: "input",
      },
      {
        label: "Behance",
        required: false,
        disabled: false,
        icon: "behance",
        prop: "behance",
        placeholder: "Ingresa enlace de Behance",
        show: true,
        type: "input",
      },
      {
        label: "Github",
        required: false,
        disabled: false,
        icon: "github",
        prop: "github",
        placeholder: "Ingresa enlace de Github",
        show: true,
        type: "input",
      },
    ],
  },
]);
const views = [
  DialogCoverInfoCardsGeneral,
  DialogCoverInfoCardsContact,
  DialogCoverInfoCardsLinks,
];
</script>

<template>
  <div class="cover__content">
    <component
      v-for="(view, v) in views"
      :key="v"
      :is="view"
      :card="cards[v]"
    />
  </div>
</template>

<style scoped>
.cover__content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  overflow-x: auto;
  padding: 0 2px 2px 0;
  width: 100%;
  height: 100%;
}
.cover__content::-webkit-scrollbar {
  height: 8px;
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.cover__content::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
</style>
