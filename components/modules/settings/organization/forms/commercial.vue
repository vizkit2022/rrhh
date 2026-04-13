<script setup>
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import usePermissionsStore from "@/stores/permissions";
import { onlyNumbersAndLetters } from "@/utils/helpers";

// Constants
const { t } = useI18n();
const module = "modules.organizations.settings";

// Variables
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const permissionsStore = usePermissionsStore();

// Save
const save = async () => {
  if (organizationStore.validForm()) {
    globalStore.loading = true;
    await organizationStore.updateOrganizationFunction();
    organizationStore.titleOrg = `${
      organizationStore.organization.name
    } (${organizationStore.organization.razon_social})`;
    const newName = organizationStore.organization.razon_social;
    globalStore.title = "Ajustes";
    globalStore.breadcrumb[2].name = `${organizationStore.organization.name} (${newName})`;
    globalStore.loading = false;
  }
};
</script>

<template>
  <div class="form">
    <div class="form__content">
      <template
        v-for="input in organizationStore.sections[0].inputs"
        :key="input.prop"
      >
        <div
          class="form__input"
          v-if="
            !(
              organizationStore.organization.default &&
              ['idNumber', 'giro'].includes(input.prop)
            )
          "
        >
          <label>
            {{
              t(`${module}.organization.info.commercial.${input.prop}.label`)
            }}
            <span>({{ t(`${module}.${input.required ? 'required' : 'optional'}`) }})</span>
            <span v-if="input.error" style="color: var(--danger-text-default) !important; margin-left: 8px;">
              {{ input.msgError }}
            </span>
          </label>
          <u-input
            v-model="organizationStore.organization[input.prop]"
            :placeholder="
              t(
                `${module}.organization.info.commercial.${input.prop}.placeholder`,
              )
            "
            :error="input.error"
            @input="
              organizationStore.organization[input.prop] = [
                'razon_social',
                'name',
                'giro',
              ].includes(input.prop)
                ? organizationStore.organization[input.prop]
                : onlyNumbersAndLetters($event.target.value)
            "
            :disabled="
              !permissionsStore.myPermissions?.settings_account_info ||
              !permissionsStore.myPermissions?.page_settings
            "
          />
        </div>
      </template>
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
}
.form__acctions {
  display: flex;
  justify-content: flex-end;
}
.mainBtnModify {
  width: 150px;
}
</style>
