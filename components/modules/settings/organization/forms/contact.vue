<script setup>
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import usePermissionsStore from "@/stores/permissions";
import { useI18n } from "vue-i18n";

// Translations
const { t } = useI18n();
const module = "modules.organizations.settings";

// Variables
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();
const permissionsStore = usePermissionsStore();

// Acciones
const errorInput = (input, msg) => {
  input.msgError = msg;
  input.error = msg !== "";
};

// Save
const save = async () => {
  if (organizationStore.validForm()) {
    globalStore.loading = true;
    await organizationStore.updateOrganizationFunction();
    const newName = organizationStore.organization.razon_social;
    globalStore.title = newName;
    globalStore.breadcrumb[2].name = newName;
    globalStore.loading = false;
  }
};
</script>

<template>
  <div class="form">
    <div class="form__content">
      <div
        class="form__input"
        v-for="input in organizationStore.sections[2].inputs"
        :key="input.prop"
      >
        <label>
          {{ t(`${module}.organization.info.contact.${input.prop}.label`) }}
          <span>({{ t(`${module}.optional`) }})</span>
          <span>{{ input.msgError }}</span>
        </label>
        <u-input-phone
          v-if="['phone', 'phone2'].includes(input.prop)"
          v-model="organizationStore.organization.contact[input.prop]"
          :error="input.error"
          @msgError="(e) => errorInput(input, e)"
          :disabled="
            !permissionsStore.myPermissions?.settings_account_info ||
            !permissionsStore.myPermissions?.page_settings
          "
        />
        <template v-else>
          <u-input
            v-model="organizationStore.organization.contact[input.prop]"
            :placeholder="input.placeholder"
            :error="input.error"
            :disabled="
              !permissionsStore.myPermissions?.settings_account_info ||
              !permissionsStore.myPermissions?.page_settings
            "
          />
        </template>
      </div>
    </div>
    <div class="form__acctions">
      <u-button
        text="Guardar"
        class="mainBtnModify"
        size="l"
        @click="save"
        :disabled="
          !permissionsStore.myPermissions?.settings_account_info ||
          !permissionsStore.myPermissions?.page_settings
        "
      />
    </div>
  </div>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  height: 100%;
  max-width: 600px;
}
.form__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form__input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form__input label {
  font-family: Nunito;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-body);
}
.form__input label span {
  color: var(--neutral-text-caption);
  margin-left: 5px;
}
.form__acctions {
  display: flex;
  justify-content: flex-end;
}
.mainBtnModify {
  width: 150px;
}
</style>
