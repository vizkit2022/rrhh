<script setup>
import { computed } from "vue";
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import { useI18n } from "vue-i18n";

// Translations
const { t, locale } = useI18n();
const module =
  "modules.organizations.settings.permissionsProfile.modals.deleteProfile";

// STORE
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();

//PROPS

// EMITS
const emit = defineEmits(["closeModal"]);

// --------------------
// COMPUTED
// --------------------

const selectedProfiles = computed(() => {
  return organizationStore.permissionsProfile.profiles.filter(
    (profile) => profile.selected,
  );
});

const countMembersWithSelectedProfiles = computed(() =>
  selectedProfiles.value.reduce(
    (total, profile) => total + (profile.members?.length || 0),
    0,
  ),
);

// Son multiples perfiles?
const isMultipleProfiles = computed(() => selectedProfiles.value.length > 1);

// Texto de miembros (singular o plural)
const membersText = computed(() => {
  const count = countMembersWithSelectedProfiles.value;

  return count === 1
    ? t(`${module}.warning.membersSingular`)
    : t(`${module}.warning.membersPlural`);
});

// LIMITAR A 3 Y MOSTRAR "N PERFILES MÁS"
const formattedProfilesNames = computed(() => {
  const names = selectedProfiles.value.map(
    (profile) => `“${profile.name[locale.value]}”`,
  );

  const maxToShow = 3;

  if (names.length === 0) return "";

  if (names.length <= maxToShow) {
    if (names.length === 1) return names[0];

    if (names.length === 2) {
      return `${names[0]} ${t(`${module}.common.and`)} ${names[1]}`;
    }

    return `${names.slice(0, -1).join(", ")} ${t(
      `${module}.common.and`,
    )} ${names[names.length - 1]}`;
  }

  const visible = names.slice(0, maxToShow);
  const remaining = names.length - maxToShow;

  return `${visible.join(", ")} ${t(`${module}.common.and`)} ${
    remaining === 1
      ? t(`${module}.extraProfiles.single`, { count: remaining })
      : t(`${module}.extraProfiles.multiple`, { count: remaining })
  }`;
});

// --------------------
// STYLES COMPUTED
// --------------------

const imgTrashTheme = computed(() => {
  return globalStore.isDark ? "/img/trash-dark.gif" : "/img/trash.gif";
});

// --------------------
// FUNCTIONS
// --------------------

const deletePermissionProfiles = async () => {
  try {
    const idsToDelete = selectedProfiles.value.map((profile) => profile._id);

    await organizationStore.deletePermissionsProfile(idsToDelete);
    emit("closeModal");
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <div class="container">
    <img :src="imgTrashTheme" :alt="t(`${module}.alt.trashIcon`)" />

    <div class="text">
      <!-- TITLE -->
      <span class="body-m-sb colorTextBody">
        {{
          isMultipleProfiles
            ? t(`${module}.confirmation.titleMultiple`)
            : t(`${module}.confirmation.titleSingle`)
        }}
      </span>

      <!-- DESCRIPTION -->
      <span class="body-m-sb colorTextCaption">
        {{
          isMultipleProfiles
            ? t(`${module}.description.deletingMultiple`, {
                profiles: formattedProfilesNames,
              })
            : t(`${module}.description.deletingSingle`, {
                profiles: formattedProfilesNames,
              })
        }}
      </span>
    </div>

    <!-- WARNING -->
    <div class="warning" v-if="countMembersWithSelectedProfiles > 0">
      <div class="warning-text">
        <span class="u u-danger-outlined"></span>

        <span class="body-l-sb colorTextBody">
          {{
            isMultipleProfiles
              ? t(`${module}.warning.assignedMultiple`, {
                  count: countMembersWithSelectedProfiles,
                  members:
                    countMembersWithSelectedProfiles === 1
                      ? t(`${module}.warning.membersSingular`)
                      : t(`${module}.warning.membersPlural`),
                })
              : t(`${module}.warning.assignedSingle`, {
                  count: countMembersWithSelectedProfiles,
                  members:
                    countMembersWithSelectedProfiles === 1
                      ? t(`${module}.warning.membersSingular`)
                      : t(`${module}.warning.membersPlural`),
                })
          }}
        </span>
      </div>

      <div class="warning-text_2">
        <i18n-t
          :keypath="`${module}.warning.autoChangeMessage`"
          tag="span"
          class="body-m-sb colorTextBody"
        >
          <template #guestProfile>
            <span class="body-m-xb">“{{ t(`${module}.common.guest`) }}”</span>
          </template>
        </i18n-t>
      </div>
    </div>

    <!-- ACTIONS -->
    <div
      class="actions"
      :style="{
        marginTop: countMembersWithSelectedProfiles > 0 ? '12px' : '0',
      }"
    >
      <u-button
        :text="t(`${module}.buttons.cancel`)"
        color="--neutral-text-caption"
        color-hover="--neutral-text-body"
        color-active="--neutral-text-body"
        type="outlined"
        @click="$emit('closeModal')"
      />

      <u-button
        :text="t(`${module}.buttons.delete`)"
        color="--danger-text-default"
        color-hover="--danger-text-darker"
        color-active="--danger-text-darker"
        @click="deletePermissionProfiles"
      />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 560px;
  gap: 18px;
}

img {
  width: 100px;
  height: 100px;
  margin: 0 auto;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.warning {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--danger-border-subtle);
  padding: 12px;
  border-radius: 16px;
}

.warning-text {
  display: flex;
  gap: 8px;
  align-items: center;
}

.warning-text .u {
  font-size: 22px;
}

.warning-text_2 {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 8px;
  background-color: var(--danger-surface-shadow-8a);
  border-radius: 12px;
}

.actions {
  display: flex;
  justify-content: space-between;
}

.colorTextBody {
  color: var(--neutral-text-body);
}

.colorTextCaption {
  color: var(--neutral-text-caption);
}
</style>
