<script setup>
import useGlobalStore from "@/stores/global";
import useContactsStore from "@/stores/contacts";

// Stores
const globalStore = useGlobalStore();
const contactsStore = useContactsStore();

// search
const search = ref("");

onMounted(async () => {
  // const resp = await globalStore.getFilters()
  await contactsStore.getAllContacts();
  globalStore.showFilters = false;
  const resp = {
    filters: [
      {
        prop: "visiblevalidations",
        type: "list",
        options: [
          { value: "myvalidations", active: false },
          { value: "allvalidations", active: false },
        ],
        expand: false,
      },
      {
        prop: "validationState",
        type: "list",
        options: [
          { value: "approved", active: false },
          { value: "rejected", active: false },
          { value: "pending", active: false },
        ],
        expand: false,
      },
      {
        prop: "validationMotive",
        type: "list",
        options: [
          { value: "exceedBudget", active: false },
          { value: "exceedBudget", active: false },
          { value: "userValidation", active: false },
        ],
        expand: false,
      },
      {
        prop: "rulevalidation",
        type: "list",
        options: [
          { value: "direct", active: false },
          { value: "inclusive", active: false },
          { value: "exclusive", active: false },
          { value: "hierarchy", active: false },
        ],
        expand: false,
      },
    ],
  };
  globalStore.initFilters(resp);
});
</script>

<template>
  <div class="container__filters">
    <div>
      <u-input
        v-model="search"
        class="search"
        icon="search"
        :revers="true"
        placeholder="Buscar..."
        size="m"
      />
      <u-datepicker size="m" />
      <u-button
        text="Filtrar"
        icon="filter"
        :revers="true"
        type="outlined"
        color="--neutral-text-caption"
        size="m"
        :counter="globalStore.appliedFiltersCount"
        @click="globalStore.showFilters = true"
      />
    </div>
  </div>
</template>

<style scoped>
.container__filters {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-self: center;
}

.container__filters > div {
  display: flex;
  gap: 16px;
}

.container__filters .search {
  display: grid;
  grid-template-columns: 400px auto auto auto;
}
</style>
