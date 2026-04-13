<script setup>
import useContactStore from "@/stores/contacts";
import useGlobalStore from "@/stores/global";
import useAuthStore from "@/stores/auth";
import useUserStore from "@/stores/user";
import { useI18n } from "vue-i18n";

//Traducciones
const { t } = useI18n();
const module = "modules.contacts.modalContacts";

// BUSS
const { $bus } = useNuxtApp();

// Stores
const contactStore = useContactStore();
const globalStore = useGlobalStore();
const authStore = useAuthStore();
const userStore = useUserStore();

// ############### Functions
// Crear Contacto desde cero
const upsertContact = async () => {
  globalStore.loading = true;
  contactStore.loading = true;
  const isValidForm = userStore.isValidFormDataSheet();
  if (isValidForm) {
    try {
      const receiveContact = await userStore.upsertContact();
      await contactStore.getAllContacts();
      $bus.$emit("receiveContact", receiveContact);
      userStore.showModalDataSheet = false;
    } catch (error) {
      if(error == 401) userStore.dataSheet.errors.email = true;
      console.error("Error create contact:", error);
    } finally {
      contactStore.loading = false;
      globalStore.loading = false;
    }
  } else {
    contactStore.loading = false;
    globalStore.loading = false;
  }
};

const cleanForm = () => {
  userStore.dataSheet = {
    change: false,
    tab: 0,
    alert: false,
    state: "create",
    data: userStore.fillMissingProperties(),
    dataOriginal: userStore.fillMissingProperties(),
    dataTemp: {},
    errors: {},
    disabled: false,
    additionalView: "",
    additionalViewType: "",
  };
};
</script>

<template>
  <div class="cover__footer">
    <u-button
      :text="t(module + '.buttons.clean')"
      size="s"
      icon="change"
      @click="cleanForm"
      type="outlined"
      class="btnFooter"
      :disabled="!userStore.dataSheet.change"
    />
    <u-button
      :text="t(module + '.buttons.create')"
      size="s"
      icon="user-new"
      @click="upsertContact"
      :disabled="contactStore.loading"
      class="btnFooter"
    />
  </div>
</template>

<style scoped>
.cover__footer {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  height: 32px;
  gap: 10px;
}
.btnFooter {
  width: 240px;
}
</style>
