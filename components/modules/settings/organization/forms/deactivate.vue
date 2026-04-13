<script setup>
import { ref, computed } from "vue";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import usePermissionsStore from "@/stores/permissions";
import useAuthStore from "@/stores/auth";
import useUserStore from "@/stores/user";
import { useI18n } from "vue-i18n";

// Translations
const { t } = useI18n();
const module = "modules.organizations.settings";

// Variables
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();
const authStore = useAuthStore();
const userStore = useUserStore();
const permissionsStore = usePermissionsStore();
const router = useRouter();
const { params } = useRoute();
const idUser = params && params.id ? params.id : null;
const lockModal = ref(false);
const confirm = ref(false);

const deactivate = async () => {
  lockModal.value = true;
  globalStore.loading = true;
  await organizationStore.deleteOrganization(
    organizationStore.organization._id,
  );
  const pos = organizationStore.organizationsByUser.findIndex(
    (org) => org._id === organizationStore.organization._id,
  );
  organizationStore.organizationsByUser.splice(pos, 1);

  const newOrg = organizationStore.organizationsByUser[0];
  if (newOrg._id !== globalStore.organizationId) {
    const orgId = useCookie("organization");
    globalStore.organizationId = newOrg._id;
    orgId.value = newOrg._id;
  }

  await organizationStore.getAllOrganizationsByUser(
    userStore?.userSession?._id ?? authStore.user._id,
  );
  await organizationStore.getOrganizationById();
  setTimeout(async () => {
    globalStore.loading = false;
    confirm.value = false;
    lockModal.value = false;
    const path = `/my-settings`;
    router.replace(path);
    userStore.mySettings.tab = 3;
  }, 0);
};

const descriptionDialogConfirm = computed(() => {
  const text = {
    es: "Al hacer clic en el botón 'Eliminar', se borrará permanentemente la organización. Esta acción no podrá ser revertida.",
    en: "By clicking the “Delete” button, the organization will be permanently deleted. This action cannot be reversed.",
  };
  return text[globalStore.lang] || text["es"];
});

const titleDialogConfirm = computed(() => {
  const text = {
    es: "¿Deseas eliminar la organización?",
    en: "Do you wish to eliminate the organization?",
  };
  return text[globalStore.lang] || text["es"];
});
</script>

<template>
  <div class="form">
    <div class="form__content">
      <h2>{{ t(module + ".organization.deactivate.label") }}</h2>
      <p>
        {{ t(module + ".organization.deactivate.text1") }}
      </p>
      <p>
        {{ t(module + ".organization.deactivate.text2") }}
      </p>
      <span>{{ t(module + ".organization.deactivate.text3") }}</span>
      <span>{{ t(module + ".organization.deactivate.text4") }}</span>
      <p>
        {{ t(module + ".organization.deactivate.text5") }}
      </p>
    </div>
    <div class="form__acctions">
      <u-button
        :text="t(module + '.organization.deactivate.buttons.desactivate')"
        class="mainBtnModify"
        size="l"
        color="--bg-danger-500"
        colorHover="--bg-danger-700"
        colorActive="--bg-danger-700"
        @action-btn="confirm = true"
        :disabled="
          organizationStore.organization.default ||
          !permissionsStore.myPermissions?.settings_account_info ||
          !permissionsStore.myPermissions?.page_settings
        "
      />
    </div>
    <dialog-confirm
      width="600px"
      height="auto"
      :title="titleDialogConfirm"
      :description="descriptionDialogConfirm"
      :showInput="true"
      :confirmationText="organizationStore.organization.razon_social"
      :actionModal="deactivate"
      :showModal="confirm"
      @closeModal="confirm = false"
    />
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
.form__content h2,
.form__content p,
.form__content span {
  font-family: Nunito;
  font-weight: 600;
}
.form__content h2 {
  color: var(--neutral-text-body);
  font-size: 24px;
  line-height: 36px;
}
.form__content p,
.form__content span {
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
.form__content span {
  position: relative;
  margin-left: 15px;
}
.form__content span::before {
  content: "";
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: var(--danger-text-default);
  left: -15px;
  top: 5px;
  border-radius: 50%;
}
.form__acctions {
  display: flex;
  justify-content: flex-end;
}
.modal {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}
.modal div {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal p {
  text-align: center;
  font-size: 20px;
}
.modal p span {
  color: var(--primary-text-default);
}
.mainBtnModify {
  width: 250px;
}
.btnModalModify {
  width: calc(50% - 10px);
}
</style>
