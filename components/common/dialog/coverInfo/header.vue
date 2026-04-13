<script setup>
import { computed } from "vue";

import useGlobalStore from "@/stores/global";
import useUserStore from "@/stores/user";
import useContactStore from "@/stores/contacts";
import { useI18n } from "vue-i18n";

//Traducciones
const { t } = useI18n();
const module = "modules.contacts.modalContacts";

// BUSS
const { $bus } = useNuxtApp();

// STORES
const globalStore = useGlobalStore();
const userStore = useUserStore();
const contactStore = useContactStore();

// COMPUTED
const user = computed(() => {
  const state =
    userStore?.dataSheet?.state === "create" ? "data" : "dataOriginal";

  const dataSheetState = userStore?.dataSheet?.[state];

  const name = dataSheetState?.data?.legalName || "-";
  const src = dataSheetState?.imgUrl || "";
  const alias = dataSheetState?.data?.nickName || "-";
  const email = dataSheetState?.email || "-";

  return { name, src, alias, email };
});

// CONSTANTS
const btns = ["share", "email", "message"];

// ACTIONS
const actions = {
  share: () => console.log("share"),
  email: () => console.log("email"),
  message: () => console.log("message"),
};

const mapActions = (type) => {
  if (actions[type]) {
    actionstype;
  }
};

// Functions
const save = async () => {
  const isValidForm = userStore.isValidFormDataSheet();
  if (isValidForm) {
    globalStore.loading = true;
    try {
      contactStore.loading = true;
      const { data } = userStore.dataSheet;
      const receiveContact = await userStore.upsertContact(data);
      await contactStore.getAllContacts();
      $bus.$emit("receiveContact", receiveContact);
      userStore.showModalDataSheet = false;
      // clear options conditions pred
      contactStore.alreadyLoadedConditionsPred = false;
      contactStore.optionConditionsPred = [];
    } catch (error) {
      if(error == 401) userStore.dataSheet.errors.email = true;
      console.error("Error create contact:", error);
    } finally {
      contactStore.loading = false;
      globalStore.loading = false;
    }
  }
};

const clear = () => {
  if (userStore?.dataSheet?.onlyEdit) {
    userStore.showModalDataSheet = false;
    // clear options conditions pred
    contactStore.alreadyLoadedConditionsPred = false;
    contactStore.optionConditionsPred = [];
  } else {
    userStore.dataSheet.state = "create";
    const formattedData = userStore.fillMissingProperties();
    userStore.dataSheet.data = JSON.parse(JSON.stringify(formattedData));
    userStore.dataSheet.dataOriginal = JSON.parse(
      JSON.stringify(formattedData)
    );
    userStore.dataSheet.dataTemp = {};
    userStore.dataSheet.additionalView = "";
    userStore.dataSheet.additionalViewType = "";
    userStore.dataSheet.change = false;
    userStore.dataSheet.disabled = false;
    userStore.dataSheet.errors.email = {};
  }
};
</script>

<template>
  <div class="cover__header">
    <u-avatar :user="user" :size="80" :hover="true" />
    <div class="cover__header-title">
      <div>
        <h2>{{ user.name }}</h2>
        <u-verify
          class="verify"
          v-if="userStore?.dataSheet?.data?.user?.isValidate"
        />
      </div>
      <span class="alias">{{ user.alias }}</span>
      <span class="email">{{ user.email }}</span>
    </div>
    <div class="cover__header-actions">
      <template v-if="['selected', 'edit'].includes(userStore.dataSheet.state)">
        <template v-if="userStore?.dataSheet?.change">
          <div v-if="userStore.dataSheet.showFormBankAccount" class="textAlert">
            <span class="u u-warning-outlined"></span>
            <span>{{ t(module + '.alerts.infGeneral.text2') }}</span>
          </div>
          <u-button :text="t(module + '.buttons.cancel')" @click="clear" type="outlined" size="s" />
          <u-button :text="t(module + '.buttons.save')" @click="save" :disabled="userStore.dataSheet.showFormBankAccount" size="s" />
        </template>
        <template v-if="false">
          <u-button-icon
            v-for="btn in btns"
            :key="btn"
            :icon="btn"
            type="outlined"
            size="s"
            @click="mapActions(btn)"
          />
        </template>
      </template>
      <u-button-icon
        v-else
        icon="close"
        class="btnIconModify"
        type="outlined"
        color="--neutral-text-caption"
        size="m"
        @click="userStore.showModalDataSheet = false"
      />
    </div>
  </div>
</template>

<style scoped>
.cover__header {
  width: 100%;
  height: 80px;
  gap: 16px;
}
.cover__header,
.cover__header-title div {
  display: flex;
  align-items: center;
}
.cover__header-title {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.cover__header-title div {
  gap: 10px;
}
.cover__header-actions {
  width: auto;
  display: flex;
  align-items: center;
  gap: 16px;
}
.cover__header-title h2,
.cover__header-title span {
  font-family: Nunito;
}
.cover__header-title h2 {
  font-size: 20px;
  font-weight: 600;
  line-height: 24px;
  color: var(--neutral-text-body);
}
.cover__header-title span {
  font-weight: 600;
  text-align: left;
  line-height: 16px;
}
.cover__header-title span.alias {
  font-size: 14px;
  color: var(--neutral-text-caption);
}
.cover__header-title span.email {
  font-size: 12px;
  color: var(--primary-text-default);
}
.verify {
  height: 16px;
}
.textAlert {
  font-size: 14px;
  line-height: 14px;
  color: var(--neutral-text-body);
  border: 1px solid var(--warning-border-default);
  padding: 8px 12px;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
}
/* styles deep */
.cover__header::v-deep(.containerAvatar__hover) {
  cursor: auto;
}
/* CUSTOM COMPONENTS - MODIFY */
.btnIconModify {
  border-radius: 50%;
}
</style>
