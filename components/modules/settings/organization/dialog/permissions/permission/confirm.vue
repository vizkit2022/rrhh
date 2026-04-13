<script setup>
import { defineEmits, computed } from "vue";
import { useI18n } from "vue-i18n";
import usePermissionStore from "@/stores/permissions";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";

//STORE
const permissionStore = usePermissionStore();
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

// EMITS
const emit = defineEmits(["closeModal"]);

// Constants
const { t } = useI18n();
const color = "--neutral-text-caption";
const KEY_LABELS =
  "modules.organizations.settings.members.modal.permissions.sections.permission.texts";

// Variables
const newProfile = ref(false);
const newProfileName = ref("");

// Computed
const userName = computed(() => {
  return permissionStore?.modalPermissions?.member?.data?.legalName || "";
});
const currentProfile = computed(() => {
  return (
    permissionStore?.modalPermissions?.profile?.name?.[globalStore.lang] || ""
  );
});

// Funcionts
const saveForEveryone = async () => {
  try {
    globalStore.loading = true;
    const idProfile = permissionStore?.modalPermissions?.profile?._id;

    const body = { permissions: permissionStore.getIdsPermissions() };

    await permissionStore.updatePermissions(idProfile, body);
    await permissionStore.getProfilePermissions();
  } catch (error) {
    console.error("Error saving profile for everyone:", error);
  } finally {
    globalStore.loading = false;
    emit("closeModal");
  }
};
const saveForThisUser = async () => {
  try {
    globalStore.loading = true;
    const body = {
      code: newProfileName.value.trim(),
      description: newProfileName.value.trim(),
      isActive: true,
      name: {
        es: newProfileName.value.trim(),
        en: newProfileName.value.trim(),
      },
      permissions: permissionStore.getIdsPermissions(),
      userId: permissionStore?.modalPermissions?.member?.user?._id,
    };

    const resp = await permissionStore.createProfilePermissions(body);
    await permissionStore.getProfilePermissions();
    await permissionStore.updateProfilePermissions({
      userId: permissionStore?.modalPermissions?.member?.user?._id,
      permissionId: resp._id,
    });

    const pos = organizationStore.organization.users.findIndex(
      (u) => u.user._id === body.userId,
    );
    if (pos !== -1) {
      organizationStore.organization.users[pos].permissionsProfile = {
        _id: resp._id,
        name: resp.name,
      };
    }
  } catch (error) {
    console.error("Error saving profile for this user:", error);
  } finally {
    globalStore.loading = false;
    emit("closeModal");
  }
};
</script>

<template>
  <div class="confirm">
    <span class="confirm__title">{{ t(KEY_LABELS + ".text1") }}</span>
    <span
      class="confirm__text"
      v-html="
        t(KEY_LABELS + '.text2', {
          user: permissionStore?.modalPermissions?.member?.data?.legalName,
          profileName: currentProfile,
        })
      "
    ></span>
    <template v-if="newProfile">
      <span class="confirm__label">{{ t(KEY_LABELS + ".text8") }}</span>
      <u-input
        size="s"
        v-model="newProfileName"
        :placeholder="
          t(KEY_LABELS + '.text9', {
            user: permissionStore?.modalPermissions?.member?.data?.legalName,
          })
        "
      />
      <span class="confirm__snippet">{{
        t(KEY_LABELS + ".text10", { user: userName })
      }}</span>
    </template>
    <template v-else>
      <!-- Actualizar perfil para todos los usuarios -->
      <button class="confirm__option" @click="saveForEveryone">
        <span class="u u-role"></span>
        <div>
          <span>{{ t(KEY_LABELS + ".text3") }}</span>
          <span>{{
            t(KEY_LABELS + ".text4", { profileName: currentProfile })
          }}</span>
        </div>
      </button>
      <!-- Creal perfil personalizado -->
      <button class="confirm__option" @click="newProfile = true">
        <span class="u u-user-new"></span>
        <div>
          <span>{{ t(KEY_LABELS + ".text5") }}</span>
          <span>{{
            t(KEY_LABELS + ".text6", {
              user: userName,
              profileName: currentProfile,
            })
          }}</span>
        </div>
      </button>
      <div class="confirm__alert">
        <span class="u u-warning-outlined"></span>
        <span>{{ t(KEY_LABELS + ".text7") }}</span>
      </div>
    </template>
    <div class="confirm__actions">
      <template v-if="newProfile">
        <div></div>
        <div></div>
        <!-- Volver a vista de no nuevo perfil -->
        <u-button
          :color="color"
          type="outlined"
          :text="t(KEY_LABELS + '.text11')"
          size="s"
          @click="newProfile = false"
        />
        <!-- Guardar nuevo perfil -->
        <u-button
          icon="save"
          :text="t(KEY_LABELS + '.text12')"
          size="s"
          @click="saveForThisUser"
          :disabled="!newProfileName.trim()"
        />
      </template>
      <template v-else>
        <!-- Volver de modal -->
        <u-button
          :color="color"
          type="outlined"
          :text="t(KEY_LABELS + '.text13')"
          size="s"
          @click="permissionStore.modalPermissions.confirm = false"
        />
        <div class="spacer"></div>
        <!-- Solo para este usuario -->
        <u-button
          type="outlined"
          :text="t(KEY_LABELS + '.text14')"
          size="s"
          @click="newProfile = true"
        />
        <!-- Actualizar perfil para todos los usuarios -->
        <u-button
          type="outlined"
          :text="t(KEY_LABELS + '.text15')"
          size="s"
          @click="saveForEveryone"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.confirm {
  width: 564px;
  height: auto;
  display: grid;
  row-gap: 12px;
}
.confirm__title {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: var(--neutral-text-body);
}
.confirm__text {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-caption);
  margin-bottom: 16px;
}
.confirm__text strong {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
}
.confirm__option {
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 12px;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: 24px 1fr;
  column-gap: 12px;
  align-items: center;
}
.confirm__option .u {
  font-size: 24px;
  line-height: 24px;
  color: var(--neutral-text-caption);
}
.confirm__option div {
  display: grid;
  row-gap: 2px;
  text-align: left;
}
.confirm__option div span:nth-child(1) {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  color: var(--neutral-text-body);
}
.confirm__option div span:nth-child(2) {
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: var(--neutral-text-caption);
}
.confirm__alert {
  border: 1px solid var(--warning-border-default);
  padding: 8px;
  display: grid;
  grid-template-columns: 24px 1fr;
  column-gap: 8px;
  align-items: center;
  border-radius: 8px;
}
.confirm__alert .u {
  font-size: 24px;
  line-height: 24px;
}
.confirm__alert span:nth-child(2) {
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-body);
}
.confirm__actions {
  margin-top: 24px;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  column-gap: 16px;
}
.confirm__label {
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  color: var(--neutral-text-body);
  margin-bottom: -4px;
}
.confirm__snippet {
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: var(--neutral-text-caption);
  margin-top: -8px;
}

@media only screen and (max-width: 768px) {
  .confirm {
    width: calc(100vw - 40px);
    max-width: 100vw;
  }
  .spacer {
    display: none;
  }
  .confirm__actions {
    grid-template-columns: v-bind(
      "newProfile ? '1fr 1fr auto auto' : 'auto 1fr auto auto'"
    );
    column-gap: 10px;
  }
}
</style>
