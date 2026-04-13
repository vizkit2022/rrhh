<script setup>
import { useI18n } from 'vue-i18n';
import usePermissionsStore from '@/stores/permissions';

// STORE
const permissionStore = usePermissionsStore();


/* VARIABLES REACTIVAS Y CONSTANTES */
// Idioma y módulo
const { t } = useI18n();
const module = "modules.organizations.settings.members.modal.listPermissions";

const emit = defineEmits(['closeModal', 'closeModal'])

const user = ref({})

onMounted(() => {
    user.value = permissionStore.propsListPermissions.memberSelected  ?? {};
})


const handleEscape = (event) => {
    if (event.key === "Escape") {
        emit("closeModal");
    }
}

onMounted(() => {
    document.addEventListener("keyup", handleEscape);
});

onUnmounted(() => {
    document.removeEventListener("keyup", handleEscape);
});

</script>

<template>
    <div class="header">
        <div class="avatarContainer">
          <div class="rowAvatar">
            <u-avatar :user="{name: user?.data?.legalName ?? 'Invitado' , src: user?.imgUrl ?? null}" :size="40" :nothover="true" />
            <div class="colDataAvatar">
              <span class="name">{{ user?.data?.legalName || "Invitado" }}</span>
              <span class="email">{{ permissionStore.propsListPermissions.memberSelected ?.email || "-" }}</span>
            </div>
          </div>
        </div>
        <div class="actions">
        <u-button :text="t(`${module}.buttons.desactive.text`)" icon="user-remove" type="outlined" 
        color="--bg-danger-500" colorHover="--bg-danger-600" colorActive="--bg-danger-700"
        size="s"/>  
        <u-button-icon type="outlined" icon="close" class="btnIconModify" color="--neutral-text-caption" size="s" @action-btn="emit('closeModal')" /> 
      </div>  
      </div>
</template>

<style scoped>

.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.avatarContainer {
  display: flex;
  flex-direction: row;
  gap: 1px;
}

 .avatarContainer .rowAvatar {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
}

 .avatarContainer .rowAvatar .colDataAvatar {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

 .avatarContainer .rowAvatar .colDataAvatar .name {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  text-align: left;
  color: var(--neutral-text-body);
}

 .avatarContainer .rowAvatar .colDataAvatar .email {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-caption);
}

.actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.btnIconModify {
    border-radius: 50%;
    color: var(--neutral-surface-default);
    }


</style>