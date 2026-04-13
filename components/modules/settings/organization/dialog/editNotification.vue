<script setup>
import useOrganizationStore from "@/stores/organization";
import useNotificationStore from "@/stores/notifications";
import useGlobalStore from "@/stores/global";

//STORE
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();
const notificationStore = useNotificationStore();

// EMITS
const emit = defineEmits(["closeModal"]);

//CONSTANS
const arrayMembers = ref([]);
const search = ref("");
const isActiveCreatorMember = ref(false);

const notificationsState = ref({
  system: true,
  email: true,
});

const notificationButtons = [
  {
    key: "system",
    text: "Sistema",
    icon: "notification",
  },
  {
    key: "email",
    text: "Email",
    icon: "notification",
  },
];

// COMPUTED
const countMembers = computed(() => {
  return arrayMembers.value.length + (isActiveCreatorMember.value ? 1 : 0);
});

// FUNCTIONS
const edit = () => {
    notificationStore.cleanEditNotification();
    emit("closeModal");
}

const closeEdit = () => {
    notificationStore.cleanEditNotification();
    emit("closeModal");
}

const toggleNotification = (key) => {
  notificationsState.value[key] = !notificationsState.value[key];
};

const cleanSearch = () => {
  search.value = "";
};

const filterMembers = (search) => {
  const searchTerm = search ? search.toLowerCase() : "";
  const members = organizationStore.organization.users;

  const selectedEmails = arrayMembers.value
    .map((arrayMembers) => arrayMembers.members?.email || "")
    .filter((email) => email !== "");

  return members
    .filter(
      (member) =>
        !selectedEmails.includes(member.email) &&
        (member.data.legalName.toLowerCase().includes(searchTerm) ||
          member.email.toLowerCase().includes(searchTerm))
    )
    .map((member) => ({
      label: member.data.legalName,
      img: member.imgUrl,
      text: member.email,
      member,
    }));
};

const addMember = (member) => {
  arrayMembers.value.push({ members: member });
  notificationStore.settings.editNotification.membersAffected = arrayMembers.value;
  notificationStore.settings.editNotification.membersIdsAffected = arrayMembers.value.map(
    (m) => m.members.user._id
  );
  
  nextTick(() => {
    cleanSearch();
  });
};

const cleanMember = (index) => {
  arrayMembers.value.splice(index, 1);
  notificationStore.settings.editNotification.membersAffected = arrayMembers.value;
  notificationStore.settings.editNotification.membersIdsAffected = arrayMembers.value.map(
    (m) => m.members.user._id
  );
};
</script>

<template>
  <div class="modal">
    <!----- HEADER ----->
    <div class="modal__header">
      <span class="truncateText">Editar notificación</span>
      <u-button-icon
        type="outlined"
        icon="close"
        class="btnIconModify"
        color="--neutral-text-caption"
        size="s"
        @action-btn="closeEdit"
      />
    </div>

    <!----- EDIT TYPE NOTIFICATION ----->
    <div class="moda__type">
      <div>
        <span class="body-m-sb" style="color: var(--primary-text-default)"
          >Creación de compras</span
        >
        <!-- <span class="body-s-r">1 de 15 seleccionados</span> -->
        <span class="body-s-r">{{ `${countMembers} de ${organizationStore.organization.users.length} seleccionados` }}</span>
      </div>
      <div>
        <u-button
          v-for="btn in notificationButtons"
          :key="btn.key"
          :text="btn.text"
          :icon="btn.icon"
          size="xs"
          :style="{
            border: notificationsState[btn.key]
              ? '1px solid var(--secondary-border-darker)'
              : '1px solid var(--neutral-border-subtle)',
          }"
          :color="
            notificationsState[btn.key]
              ? '--secondary-surface-light'
              : '--neutral-background-default'
          "
          :colorText="
            notificationsState[btn.key]
              ? '--secondary-text-default'
              : '--neutral-text-caption'
          "
          :colorHover="
            notificationsState[btn.key]
              ? '--secondary-surface-softer'
              : '--neutral-surface-subtle'
          "
          :colorTextHover="
            notificationsState[btn.key]
              ? '--secondary-text-default'
              : '--neutral-text-caption'
          "
          :colorActive="
            notificationsState[btn.key]
              ? '--secondary-surface-harder'
              : '--neutral-surface-subtle'
          "
          :colorTextActive="
            notificationsState[btn.key]
              ? '--secondary-text-default'
              : '--neutral-text-caption'
          "
          @click="toggleNotification(btn.key)"
        />
      </div>
    </div>

    <!----- SELECT MEMBERS ----->

    <div class="modal__content">
      <span>Selecciona que miembros recibirán la notificación</span>
      <div class="modal__content__members">
        <u-search
          v-model="search"
          :avatar="true"
          :snippet="true"
          :options="filterMembers(search)"
          @selectedOption="addMember($event.member)"
          icon="user"
          placeholder="Selecciona un miembro de tu organización"
          size="l"
          style="width: 100%"
          @cleanInput="cleanSearch"
        />

        <div class="member__list">
        <div class="modal__content__memberCreator">
            <u-checkbox v-model="isActiveCreatorMember" style="margin: 0 auto;" />
            <u-avatar :size="40" />
            <div class="memberInfo__text">
                <span class="memberInfo__text-name truncateText">Creador de la compra</span>
                <!-- <span class="memberInfo__text-email truncateText">{{
                Correo
                }}</span> -->
            </div>
        </div>

        <div class="modal__content__members__selected">
          <div
            v-if="arrayMembers.length > 0"
            v-for="(member, index) in arrayMembers"
            :key="index"
            class="modal__content__selectedMember"
          >
            <div class="memberInfo">
              <u-button-icon
                type="text"
                icon="close"
                color="--neutral-text-disabled"
                :text-size="40"
                @action-btn="cleanMember(index)"
              />
              <u-avatar
                :user="{
                  name: member.members?.data.legalName,
                  src: member.members?.imgUrl,
                }"
                :size="40"
              />
              <div class="memberInfo__text">
                <span class="memberInfo__text-name truncateText">{{
                  member.members?.data.legalName
                }}</span>
                <span class="memberInfo__text-email truncateText">{{
                  member.members?.email
                }}</span>
              </div>
            </div>
            <div class="tag">
              <span class="truncateText">{{
                member.members.permissionsProfile
                  ? member.members.permissionsProfile?.name?.[globalStore.lang]
                  : "Owner"
              }}</span>
            </div>
          </div>
        </div>
        </div>


      </div>
    </div>

    <div class="modal__actions">
      <u-button text="Cancelar" @click="closeEdit" type="outlined" />
      <u-button text="Editar" @click="edit" />
    </div>
  </div>
</template>

<style scoped>
.modal {
  display: grid;
  grid-template-rows: 40px 68px 523px 36px;
  gap: 24px;
  height: 100%;
  width: 100%;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.modal__header span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  width: 500px;
  text-align: left;
  color: var(--neutral-text-body);
}

.modal__header .btnIconModify {
  border-radius: 50%;
  color: var(--neutral-surface-default);
}

.moda__type {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 12px;
  height: 68px;
  width: 100%;
}

.moda__type div:nth-child(1) {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.moda__type div:nth-child(2) {
  display: flex;
  gap: 8px;
}

.modal__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 523px;
  width: 100%;
}

.modal__content span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

.modal__content__members {
  display: grid;
grid-template-rows: 40px 1fr;
  padding: 16px;
  gap: 16px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 16px;
  width: 100%;
  height: 499px;
}

.modal__content__members .msjMembersRegla {
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  letter-spacing: 0.1em;
  text-align: left;
  color: var(--neutral-text-caption);
}

.member__list {
  display: flex;
  flex-direction: column;
  gap: 4px; 
  overflow: hidden; 
  min-height: 0; 
}

.modal__content__memberCreator {
    display: grid;
    align-items: center;
    grid-template-columns: 40px 40px 1fr;
    padding: 6px 12px;
    gap: 8px;
    width: 100%;
    height: 52px;
}



.modal__content__members__selected {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  overflow-y: auto;
}

.modal__content__selectedMember {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  width: 100%;
  height: 52px;
}

.modal__content__selectedMember .memberInfo {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.modal__content__selectedMember .memberInfo__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 200px;
}

 .memberInfo__text-name {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}

.modal__content__selectedMember .memberInfo__text-email {
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-caption);
}

.modal__content__selectedMember .tag {
  padding: 0 10px;
  background-color: var(--neutral-surface-light);
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: end;
  height: 28px;
  width: auto;
  max-width: 140px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

.modal__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  width: 100%;
  height: 36px;
}
</style>
