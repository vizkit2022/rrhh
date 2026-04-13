<script setup>
import { defineProps, defineEmits, computed, watch } from "vue";
import useGlobalStore from "@/stores/global";
import useContactStore from "@/stores/contacts";
import useUserStore from "@/stores/user";
import labels from "@/utils/labels/contacts.json";
import { toast } from "vue3-toastify";
import { useI18n } from "vue-i18n";

// Traductor
const { t } = useI18n();
const { locale } = useI18n();
const module = "modules.contacts";

// Stores
const globalStore = useGlobalStore();
const contactStore = useContactStore();
const userStore = useUserStore();

// Constants
const search = ref("");
const mainColor = "--bg-neutral-500";
const secondColor = "--bg-neutral-600";
const placeholder = "Buscar contactos";
const labelModal = labels.crudContacts.modal.delete;
const isDeleteModalVisible = ref(false);

// Emit
const emit = defineEmits(["update:modelValue"]);

// Props
const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true,
  },
});

// Functions
const deleteContact = async () => {
  if (contactStore.contacts.every((contact) => contact.selected)) {
    globalStore.loading = true;
    await contactStore.deleteAllContacts();
    globalStore.loading = false;
  } else if (contactStore.contacts.some((contact) => contact.selected)) {
    globalStore.loading = true;
    await contactStore.deleteContacts();
    globalStore.loading = false;
  } else {
    toast.warning("Debes seleccionar al menos un contacto");
  }
};

// Computed
const singular = computed(() => {
  return contactStore.contacts.filter((contact) => contact.selected).length ===
    1
    ? "singular"
    : "plural";
});

const showContact = () => {
  userStore.showModalDataSheet = true;
  userStore.dataSheet.state = "create";
};

// Watch
// watch(
//   () => search.value,
//   (newVal, oldVal) => {
//     contactStore.loading = true;
//     const toSearch = newVal.toLocaleLowerCase().trim();
//     contactStore.filterContactsFront(toSearch);
//     setTimeout(() => {
//       contactStore.loading = false;
//     }, 10);
//   }
// );

const searchTimeout = ref(null);
const lastSearch = ref("");

const searchContacts = (e) => {
  const val = e.target.value.trim();

  // Cancelar timeout anterior
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  // Si el valor no cambió, no buscar
  if (val === lastSearch.value) return;

  // Nuevo timeout de espera (ej: 300 ms tras dejar de tipear)
  searchTimeout.value = setTimeout(async () => {
    try {
    contactStore.loading = true;

    if (val === "") {
      await contactStore.getAllContacts();
      return;
    }

    lastSearch.value = val;

      const resp = await userStore.findByUsersByNameOrEmail(true, true, val, {
        archived: true,
        onlyContacts: true,
      });

      contactStore.contacts = resp?.length ? resp : [];
    } catch (error) {
      console.error(error);
    } finally {
      contactStore.loading = false;
    }
  }, 300);
};

const mapperSearchResultUsers = (list) => {
  return list.map((item) => {
    return {
      label: item?.data?.legalName || "-",
      text: item?.email || "-",
      img: item?.imgUrl ?? null,
      oldData: { ...item },
    };
  });
};
</script>

<template>
  <div class="filters">
    <div class="flex">
      <u-input
        v-model="search"
        size="s"
        class="search"
        :placeholder="t(module + '.inputs.search.placeholder')"
        icon="search"
        :revers="true"
        @input="searchContacts"
      />
      <u-button
        :text="t(module + '.buttons.filter')"
        icon="filter"
        type="outlined"
        size="s"
        :color="mainColor"
        :colorActive="secondColor"
        :colorHover="secondColor"
      />
    </div>
    <div class="flex">
      <u-button-icon
        icon="delete"
        type="outlined"
        size="s"
        :color="mainColor"
        :colorActive="secondColor"
        :colorHover="secondColor"
        @click="isDeleteModalVisible = true"
        :disabled="!contactStore.contacts.some((contact) => contact.selected)"
      />
      <!--
      <u-button-icon
        icon="share"
        type="outlined"
        size="s"
        :color="mainColor"
        :colorActive="secondColor"
        :colorHover="secondColor"
      />-->

      <u-button
        :text="t(module + '.buttons.addContact')"
        icon="user-new"
        size="s"
        @click="showContact"
      />
      <!--
      <u-button-icon
        icon="more"
        type="outlined"
        size="s"
        :color="mainColor"
        :colorActive="secondColor"
        :colorHover="secondColor"
      />-->
    </div>
  </div>
  <dialog-confirm
    width="600px"
    height="auto"
    :title="labelModal.title[globalStore.lang][singular]"
    :description="labelModal.description[globalStore.lang][singular]"
    :showInput="true"
    :confirmationText="labelModal.textConfirm[globalStore.lang][singular]"
    :actionModal="deleteContact"
    :showModal="isDeleteModalVisible"
    @closeModal="isDeleteModalVisible = false"
  />
  <!-- <u-dialog
          :showModal="createContactModal"
          @closeModal="createContactModal = false"
          position="right"
          width="445px"
        >
          <contactsDialogCreateContact
            :edit="edit"
            @changeEdit="edit = false"
            @closeModal="createContactModal = false"
          />
        </u-dialog> -->
</template>

<style scoped>
.flex,
.filters {
  display: flex;
  gap: 10px;
}
.filters {
  justify-content: space-between;
}
.filters .search {
  width: 320px;
}
</style>
