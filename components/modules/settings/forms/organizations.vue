<script setup>
import { ref } from "vue";
import useOrganizationStore from "@/stores/organization";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

// TRANSLATIONS
const { t } = useI18n();
const module =
  "modules.organizations.settingsOrganizations.sections.myOrganizations";

// STORE
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();

// ROUTER
const router = useRouter();
const { params } = useRoute();

// CONSTANTS
const idUser = params && params.id ? params.id : null;
const imgTemp = "/img/companyDefault.png";

const organizations = ref([
  {
    _id: 1,
    name: "Mi Organización 1",
    imgUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFhsWkV0yNazew9HGrrkZcJfVs7DsGeMq4LOXwaKHAgA&s",
    users: [
      {
        name: "Fabian",
        _id: 23245,
        imgUrl:
          "https://files-bucket-v4.s3.amazonaws.com/users/65d4f43b1b0e59dd702c7c94/profile/65d4f43b1b0e59dd702c7c94_profile.png",
      },
      {
        name: "Jorge",
        _id: 2897745,
        imgUrl:
          "https://files-bucket-v4.s3.amazonaws.com/user/profile/616d83afa636820018bdc485.JPG?1678067721709?1678456323805",
      },
    ],
  },
  {
    _id: 2,
    name: "Mi Organización 2",
    imgUrl:
      "https://cdn-3.expansion.mx/dims4/default/e9daeb2/2147483647/strip/true/crop/799x555+0+0/resize/1200x834!/format/webp/quality/60/?url=https%3A%2F%2Fcherry-brightspot.s3.amazonaws.com%2F59%2F1b%2F9190da6f43f2b89ef6e861e84910%2Fcaptura.JPG",
    users: [
      {
        name: "Fabian",
        _id: 23245,
        imgUrl:
          "https://files-bucket-v4.s3.amazonaws.com/users/65d4f43b1b0e59dd702c7c94/profile/65d4f43b1b0e59dd702c7c94_profile.png",
      },
      {
        name: "Cami",
        _id: 2897745,
        imgUrl:
          "https://lh3.googleusercontent.com/a/AEdFTp7eTz064TzkJtVL6bRQgpcd6VXn8W3hGJnp-Udu=s96-c",
      },
      {
        name: "Johann",
        _id: 2897745,
        imgUrl:
          "https://files-bucket-v4.s3.amazonaws.com/users/63f623872d8f5f03a4ce1b53/profile/63f623872d8f5f03a4ce1b53_profile.png",
      },
      {
        name: "Jorge",
        _id: 2897745,
        imgUrl:
          "https://files-bucket-v4.s3.amazonaws.com/user/profile/616d83afa636820018bdc485.JPG?1678067721709?1678456323805",
      },
    ],
  },
  {
    _id: 3,
    name: "Mi Organización 3",
    imgUrl:
      "https://steamuserimages-a.akamaihd.net/ugc/1737800726485746149/19B0CB705A3887B0EF82AE8464B45DB9FF596F7B/?imw=512&&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false",
    users: [],
  },
]);

const buttons = [
  {
    icon: "edit",
    disabled: false,
    action: "edit",
    colorHover: "--bg-info-600",
    colorActive: "--bg-info-600",
  },
  {
    icon: "user-new",
    disabled: false,
    action: "new",
    colorHover: "--bg-secondary-500",
    colorActive: "--bg-secondary-500",
  },
  // {
  //   icon: "invoice",
  //   disabled: false,
  //   action: "invoice",
  //   colorHover: "--bg-success-600",
  //   colorActive: "--bg-success-600",
  // },
  {
    icon: "delete",
    disabled: false,
    action: "delete",
    colorHover: "--bg-danger-600",
    colorActive: "--bg-danger-600",
  },
];

// FUNCTIONS

const action = async (id, type = "edit") => {
  const types = {
    edit: () => {
      organizationStore.page.tab = 0;
      organizationStore.page.option = 0;
    },
    new: () => {
      organizationStore.page.tab = 1;
      organizationStore.page.option = 0;
    },
    invoice: () => {
      organizationStore.page.tab = 2;
      organizationStore.page.option = 0;
    },
    delete: () => {
      organizationStore.page.tab = 0;
      organizationStore.page.option = 4;
    },
  };
  types[type]();

  const path = `/settings/${idUser}/organization`;
  const orgId = useCookie("organization");
  if (id !== orgId.value) {
    orgId.value = id;
    globalStore.organizationId = id;
  }
  globalStore.loading = true;
  router.push(path);
};
</script>

<template>
  <div class="section" v-if="organizationStore.organizationsByUser.length">
    <div class="section__cards">
      <span class="subtitle">{{ t(module + ".labels.myUnabase") }}</span>
      <div class="card">
        <div
          class="card__name"
          @click="action(organizationStore?.organizationsByUser?.[0]?._id)"
        >
          <img
            :src="
              organizationStore?.organizationsByUser?.[0]?.imgUrl || imgTemp
            "
            :alt="
              organizationStore?.organizationsByUser?.[0]?.razon_social || ''
            "
          />
          <span>
            {{
              `${organizationStore?.organizationsByUser?.[0]?.razon_social || ""} (${organizationStore?.organizationsByUser?.[0]?.name || ""})`
            }}</span
          >
        </div>
        <div
          class="card__users"
          @click="action(organizationStore?.organizationsByUser?.[0]?._id)"
        >
          <template
            v-if="organizationStore?.organizationsByUser?.[0]?.users.length"
          >
            <u-avatar
              v-for="(user, u) in organizationStore?.organizationsByUser?.[0]
                ?.users"
              :key="u"
              :user="{ name: user.name, src: user?.id?.imgUrl }"
              :size="40"
              class="avatarModify"
              :style="`z-index: ${4 + u};`"
            />
          </template>
          <div v-else>-</div>
        </div>
        <div class="card__actions">
          <u-button-icon
            v-for="button in buttons"
            :key="button.action"
            :icon="button.icon"
            type="text"
            color="--bg-neutral-500"
            :color-hover="button.colorHover"
            :color-active="button.colorActive"
            size="s"
            :disabled="button.action === 'delete'"
            @click="
              action(
                organizationStore?.organizationsByUser?.[0]?._id,
                button.action,
              )
            "
            class="btnIconModify"
          />
        </div>
      </div>
      <span class="subtitle">{{ t(module + ".labels.myOrganizations") }}</span>
      <span
        v-if="organizationStore.organizationsByUser.length === 1"
        class="noOrg"
        >{{ t(module + ".labels.noOrganizations") }}</span
      >
      <template
        v-for="organization in organizationStore.organizationsByUser"
        :key="organization?._id"
      >
        <div class="card" v-if="!organization?.default">
          <div class="card__name" @click="action(organization._id)">
            <img
              :src="organization?.imgUrl || imgTemp"
              :alt="organization?.razon_social"
            />
            <span>{{
              `${organization?.razon_social} (${organization?.name})`
            }}</span>
          </div>
          <div class="card__users" @click="action(organization._id, 'new')">
            <template v-if="organization?.users.length">
              <u-avatar
                v-for="(user, u) in organization?.users.length > 4
                  ? organization?.users.slice(0, 4)
                  : organization?.users"
                :key="u"
                :user="{ name: user.name, src: user?.imgUrl }"
                :size="40"
                class="avatarModify"
                :style="`z-index: ${4 + u};`"
              />
              <div v-if="organization?.users.length > 4" class="counter">
                <span>+{{ organization?.users.length - 4 }}</span>
              </div>
            </template>
            <div v-else>-</div>
          </div>
          <div class="card__actions">
            <u-button-icon
              v-for="button in buttons"
              :key="button.action"
              :icon="button.icon"
              type="text"
              color="--bg-neutral-500"
              :color-hover="button.colorHover"
              :color-active="button.colorActive"
              size="s"
              :disabled="button.disabled"
              @click="action(organization._id, button.action)"
              class="btnIconModify"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
  <div
    v-if="!organizationStore.organizationsByUser.length"
    class="loading-container"
  >
    <u-loading color="--bg-neutral-500" />
    <span class="body-l-sb">{{ t(module + ".labels.loading") }}</span>
    <u-logo />
  </div>
</template>

<style scoped>
.section {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 36px 1fr;
  gap: 20px;
}
.section__actions {
  display: flex;
  justify-content: flex-end;
}
.section__cards {
  display: flex;
  height: calc(100vh - 265px);
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding-right: 12px;
  padding-top: 10px;
}

.section__cards::-webkit-scrollbar {
  width: 5px;
  height: 0px;
}

.section__cards::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: var(--neutral-border-default);
}
.section__cards::-webkit-scrollbar-track {
  background-color: var(--neutral-background-default);
  border-radius: 3px;
}

.card {
  flex-shrink: 0;
  height: auto;
  background-color: var(--neutral-background-light);
  display: grid;
  grid-template-columns: repeat(2, 1fr) 156px;
  gap: 20px;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid var(--neutral-border-default);
  transition: 0.3s cubic-bezier(0.455, 0.03, 0.515, 0.955);
  height: 106px;
}
.card:hover {
  box-shadow: var(--shadow-3);
}
.card__name {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 16px;
  align-items: center;
  box-sizing: border-box;
  padding: 20px 0 20px 20px;
  cursor: pointer;
}
.card__users {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
}
.card__actions {
  display: grid;
  grid-template-columns: repeat(
    3,
    1fr
  ); /* Cambio temporal porque oculte el ultimo boton invoice en los card de org */
  padding-right: 20px;
}
.card__name img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 16px;
}
.card__name span {
  font-family: Nunito;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--primary-text-default);
}
.avatarModify:not(:nth-child(1)) {
  margin-left: -20px;
}
.btnIconModify {
  height: 106px;
  width: 100%;
}
.subtitle {
  color: var(--neutral-text-caption);
  font-size: 14px;
}
.noOrg {
  color: var(--bg-neutral-400);
  font-size: 12px;
}
.counter {
  background-color: var(--bg-primary-500);
  height: 40px;
  width: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  z-index: 8;
  left: 80px;
}
.counter span {
  font-weight: 600;
  font-size: 14px;
  line-height: 14px;
  color: var(--white);
}
.loading-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding-top: 120px;
  gap: 20px;
}
</style>
