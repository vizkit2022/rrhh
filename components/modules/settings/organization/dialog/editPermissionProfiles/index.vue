<script setup>
import usePermissionStore from "@/stores/permissions";
import useOrganizationStore from "@/stores/organization";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// TRANSLATIONS
const { t, locale } = useI18n();
const moduleEdit =
  "modules.organizations.settings.permissionsProfile.modals.editProfile";

// STORES
const permissionStore = usePermissionStore();
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();

//PROPS
const props = defineProps({
  permissionProfile: {
    type: Object,
    default: () => ({}),
  },
});

//EMITS
const emit = defineEmits(["closeModal"]);

// CONSTANTS
const originalEditState = ref(null);
const icons = {
  globals: "information",
  projects: "folder",
  incomes: "network",
  outcomes: "shopping-cart",
  settings: "settings",
  catalog: "book",
};

// COMPUTED
const disabledSave = computed(() => {
  const current =
    organizationStore.permissionsProfile.edit.info.name[locale.value] || "";

  return !current;
});

const getIdsPermissions = () => {
  let ids = [];
  organizationStore.permissionsProfile.edit.permissions.forEach((p) => {
    p.groups.forEach((g) => {
      g.subcategories.forEach((s) => {
        s.permissions.forEach((perm) => {
          if (perm.activate) ids.push(perm._id);
        });
      });
    });
  });
  return ids;
};

const saveEdit = async () => {
  try {
    globalStore.loading = true;

    const body = {
      name: {
        es: organizationStore.permissionsProfile.edit.info.name.es,
        en: organizationStore.permissionsProfile.edit.info.name.en,
      },
      members: organizationStore.permissionsProfile.edit.info.members.map(
        (m) => m.user,
      ),
      permissions: getIdsPermissions(),
    };

    await organizationStore.editPermissionsProfile(
      props.permissionProfile._id,
      body,
    );

    await organizationStore.getPermissionsProfile();
  } catch (error) {
    console.log(error);
  } finally {
    handleCloseModal();
    globalStore.loading = false;
  }
};

//FUNCTIONS

const filterMembers = (search) => {
  const searchTerm = search ? search.toLowerCase() : "";
  const members = organizationStore.organization.users;

  const selectedEmails = organizationStore.permissionsProfile.edit.info.members
    .map((member) => member.email || "")
    .filter((email) => email !== "");

  return members
    .filter(
      (member) =>
        member.user._id !== organizationStore.organization.owner._id &&
        !selectedEmails.includes(member.email) &&
        (member.data.legalName.toLowerCase().includes(searchTerm) ||
          member.email.toLowerCase().includes(searchTerm)),
    )
    .map((member) => ({
      label: member.data.legalName,
      img: member.imgUrl,
      text: member.email,
      id: member.user._id,
      member,
    }));
};

const saveSelected = async (selectedMember) => {
  const formatMember = {
    imgUrl: selectedMember.img,
    legalName: selectedMember.label,
    email: selectedMember.text,
    user: selectedMember.id,
  };

  organizationStore.permissionsProfile.edit.info.members.push(formatMember);

  await nextTick();
  organizationStore.permissionsProfile.edit.search = "";
};

const cleanSearch = () => {
  organizationStore.permissionsProfile.edit.search = "";
};
const handleCloseModal = () => {
  organizationStore.permissionsProfile.edit = JSON.parse(
    JSON.stringify(originalEditState.value),
  );

  emit("closeModal");
};

const initPermissions = () => {
  if (!props.permissionProfile) return;

  const basePermissions = JSON.parse(
    JSON.stringify(permissionStore.permissions),
  );

  const idsProfilePermissionAssigned = props.permissionProfile?.permissions.map(
    (p) => p._id,
  );

  organizationStore.permissionsProfile.edit.permissions = basePermissions.map(
    (p) => {
      p.slotName = p.area_code === "globals" ? "system" : "table";

      p.title = {
        main: p.area_name,
        sub: "",
        icon: icons[p.area_code] || "information",
      };

      p.groups.forEach((g) => {
        g.subcategories.forEach((s) => {
          s.permissions.forEach((perm) => {
            const ID = perm._id;
            const isAssigned = idsProfilePermissionAssigned.includes(ID);
            perm.activate = isAssigned;
            perm.noActivate = !isAssigned;
          });
        });
      });

      return p;
    },
  );

  organizationStore.permissionsProfile.edit.info = JSON.parse(
    JSON.stringify(props.permissionProfile),
  );

  originalEditState.value = JSON.parse(
    JSON.stringify(organizationStore.permissionsProfile.edit),
  );
};

onBeforeMount(() => {
  initPermissions();
});
</script>

<template>
  <div class="container">
    <div class="container__header">
      <span
        >{{ t(`${moduleEdit}.title`) }} -
        {{ permissionProfile?.name?.[locale] }}</span
      >
      <u-button-icon
        icon="close"
        type="outlined"
        color="--neutral-text-caption"
        size="s"
        class="btnIconModify"
        @click="handleCloseModal"
      />
    </div>

    <div class="container_actions">
      <u-input
        v-model="organizationStore.permissionsProfile.edit.info.name[locale]"
        :placeholder="t(`${moduleEdit}.inputs.name.placeholder`)"
        size="s"
        style="width: 100%; max-width: 600px"
      />
      <u-button
        :text="t(`${moduleEdit}.buttons.save`)"
        icon="save"
        size="s"
        :disabled="disabledSave"
        @click="saveEdit"
      />
    </div>

    <div class="container_content">
      <div class="addMembers">
        <div class="addMembers__header">
          <span class="body-xs-r textColor">{{
            t(`${moduleEdit}.inputs.addMembers.label`)
          }}</span>
          <u-search
            :placeholder="t(`${moduleEdit}.inputs.addMembers.placeholder`)"
            size="m"
            icon="search"
            :avatar="true"
            :snippet="true"
            :options="
              filterMembers(organizationStore.permissionsProfile.edit.search)
            "
            v-model="organizationStore.permissionsProfile.edit.search"
            @selectedOption="saveSelected"
            @cleanInput="cleanSearch"
            :max-hover-option="true"
          />
        </div>
        <div
          class="members"
          v-if="
            organizationStore.permissionsProfile.edit.info.members.length > 0
          "
        >
          <div
            class="member"
            v-for="member in organizationStore.permissionsProfile.edit.info
              .members"
            :key="member.user"
          >
            <u-avatar
              :user="{ name: member?.legalName, src: member?.imgUrl }"
              :size="36"
              user="name"
            />
            <div class="member_info">
              <span class="body-m-sb truncateText textColor">{{
                member?.legalName || "-"
              }}</span>
              <span class="body-s-r truncateText textColorCaption">{{
                member?.email || "-"
              }}</span>
            </div>
            <u-button-icon
              icon="close"
              type="text"
              color="--neutral-text-caption"
              colorHover="--danger-text-default"
              colorActive="--danger-text-darker"
              size="s"
              @click="
                organizationStore.permissionsProfile.edit.info.members =
                  organizationStore.permissionsProfile.edit.info.members.filter(
                    (m) => m.user !== member.user,
                  )
              "
            />
          </div>
        </div>
        <div class="noMembers" v-else>
          <u-tax :width="80" />
          <span class="body-xs-r textColor">{{
            t(`${moduleEdit}.noMembers.title`)
          }}</span>
        </div>
      </div>
      <div class="permission__cards">
        <SettingsOrganizationDialogEditPermissionProfilesComponentsCard
          v-for="(card, c) in organizationStore.permissionsProfile.edit
            .permissions"
          :key="c"
          :title="card.title"
          :permission="card"
          :pos="c"
        >
          <SettingsOrganizationDialogEditPermissionProfilesComponentsSystem
            v-if="card.slotName === 'system'"
            :item="card"
          />
          <SettingsOrganizationDialogEditPermissionProfilesComponentsTable
            v-if="card.slotName === 'table'"
            :item="card"
            ,
            :pos="c"
          />
        </SettingsOrganizationDialogEditPermissionProfilesComponentsCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: calc(100vw - 200px);
  max-width: 1299px;
  height: calc(100vh - 200px);
  max-height: 800px;
  display: grid;
  grid-template-rows: 40px 32px 1fr;
  gap: 24px;
}

.container__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  width: 100%;
}

.container_actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  width: 100%;
  gap: 12px;
}

.container_content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  height: 100%;
  width: 100%;
  min-height: 0;
}

.addMembers {
  display: grid;
  grid-template-rows: 58px 1fr;
  gap: 16px;
  height: 100%;
  width: 100%;
  padding-right: 24px;
  border-right: 1px solid var(--neutral-border-light);
}

.addMembers__header {
  display: flex;
  flex-direction: column;
  height: 58px;
  gap: 8px;
  width: 100%;
}

.members {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  width: 100%;
  overflow-y: auto;
}

.member {
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  gap: 12px;
  height: 36px;
  width: 100%;
}

.member_info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.noMembers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 30%;
  width: 100%;
}

.permission__cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  width: 100%;
  height: 100%;
}

.permission__cards::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.permission__cards::-webkit-scrollbar-thumb {
  background-color: var(--neutral-border-darker);
  border-radius: 10px;
}

.permission__cards::-webkit-scrollbar-track {
  background-color: var(--neutral-border-subtle);
  border-radius: 10px;
}

.btnIconModify {
  border-radius: 50%;
  color: var(--neutral-surface-default);
}

.textColor {
  color: var(--neutral-text-body);
}

.textColorCaption {
  color: var(--neutral-text-caption);
}

@media only screen and (max-width: 768px) {
  .container {
    width: calc(100vw - 40px);
    max-width: 100vw;
    height: calc(100vh - 40px);
    max-height: 100vh;
  }
}
</style>
