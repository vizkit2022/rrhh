<script setup>
import { defineProps, computed } from "vue";
import configTable from "@/utils/configTables/contacts.json";
import useUserStore from "@/stores/user";
import useContactStore from "@/stores/contacts";

import {
  ContactsComponentsCellContact,
  ContactsComponentsCellRoles,
} from "#components";

// Stores
const userStore = useUserStore();
const contactStore = useContactStore();

// Props
const props = defineProps({
  contacts: {
    type: Array,
    default: () => [],
  },
});

// Functions
const actionTable = (obj) => {
  const { emit, data, pos } = obj;
  const emits = {
    showContact: () => {
      if (data._id) {
        userStore.dataSheet.state = 'edit'
        userStore.showModalDataSheet = true;
        userStore.userDataSheetId = data._id;
        userStore.dataSheet.onlyEdit = true;
        contactStore.alreadyLoadedConditionsPred = false;
      }
    },
  };
  emits[emit]();
};

// Component mapping
const slotComponents = {
  contact: ContactsComponentsCellContact,
  roles: ContactsComponentsCellRoles,
};

// const contacts = computed(() => {
//   return [...contactStore.contacts]
// })
</script>

<template>
  <TableBasic
    :configTable="configTable.contacts"
    :content="contactStore.contacts"
    :loading="contactStore.loading"
    @actionTable="actionTable"
  >
    <template
      v-for="(component, name) in slotComponents"
      #[name]="item"
      :key="name"
    >
      <component :is="component" :item="item" />
    </template>
  </TableBasic>
</template>
