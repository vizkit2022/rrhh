<script setup>
import useOrganizationStore from "@/stores/organization";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";
import { useI18n } from "vue-i18n";

//  Translation
const { t, locale } = useI18n();
const module = "modules.mySettings";
const moduleMyOrganizations = module + ".sections.myOrganizations";

const organizationStore = useOrganizationStore();
const userStore = useUserStore();
const globalStore = useGlobalStore();

const router = useRouter();
const imgTemp = "/img/companyDefault.png";
const { params } = useRoute();
const idUser = params && params.id ? params.id : null;
const idOrganization = useCookie("organization").value;

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

const action = async (id, type = null) => {
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

  if (type !== null) {
    globalStore.isRedirectConfig = true;
    types[type]();
  }

  const path = `/settings/${id}/organization`;
  const orgId = useCookie("organization");
  if (id !== orgId.value) {
    orgId.value = id;
    globalStore.organizationId = id;
    return;
  }
  globalStore.loading = true;
  router.push(path);
};

const crearOrg = () => {
  const path = "/organization/create";
  router.push(path);
};

const ownerOrg = (org) => {
  return org.owner._id === userStore.userSession._id;
};
</script>

<template>
  <div class="organizations">
    <div class="organization__list">
      <!-- MI UNABASE (primera organización / default) -->
      <template v-if="organizationStore.organizationsByUser.length">
        <span class="subtitle">{{
          t(`${moduleMyOrganizations}.labels.label1`)
        }}</span>
        <div
          class="item"
          @click="action(organizationStore?.organizationsByUser?.[0]?._id)"
        >
          <img
            :src="
              organizationStore?.organizationsByUser?.[0]?.imgUrl || imgTemp
            "
            class="item__logo"
          />
          <span class="item__text">
            {{
              `${organizationStore?.organizationsByUser?.[0]?.razon_social || ""} (${organizationStore?.organizationsByUser?.[0]?.name || ""})`
            }}
          </span>
          <div class="item__creator">
            <div class="creator">
              <span class="u u-user"></span>
              <span>{{ t(`${moduleMyOrganizations}.tagsUser.creator`) }}</span>
            </div>
          </div>
          <div class="item__users">
            <template
              v-if="organizationStore?.organizationsByUser?.[0]?.users.length"
            >
              <u-avatar
                v-for="(user, u) in organizationStore?.organizationsByUser?.[0]
                  ?.users.length > 4
                  ? organizationStore?.organizationsByUser?.[0]?.users.slice(
                      0,
                      4,
                    )
                  : organizationStore?.organizationsByUser?.[0]?.users"
                :key="u"
                :user="{ name: user.name, src: user?.imgUrl }"
                :size="40"
                class="avatarModify"
                :style="`z-index: ${4 + u};`"
              />
              <div
                v-if="
                  organizationStore?.organizationsByUser?.[0]?.users.length > 4
                "
                class="counter"
              >
                <span
                  >+{{
                    organizationStore?.organizationsByUser?.[0]?.users.length -
                    4
                  }}</span
                >
              </div>
            </template>
            <span v-else class="text">-</span>
          </div>
          <div class="item__buttons">
            <u-button-icon
              v-for="button in buttons"
              :key="button.action"
              :icon="button.icon"
              type="text"
              color="--bg-neutral-500"
              :disabled="button.disabled"
              :colorHover="button.colorHover"
              :colorActive="button.colorActive"
              @click.stop="
                action(
                  organizationStore?.organizationsByUser?.[0]?._id,
                  button.action,
                )
              "
              size="s"
              class="btnIconModify"
            />
          </div>
        </div>

        <!-- MIS ORGANIZACIONES (las demás, sin la default) -->
        <span class="subtitle">{{
          t(`${moduleMyOrganizations}.labels.label2`)
        }}</span>
        <span
          v-if="organizationStore.organizationsByUser.length === 1"
          class="noOrg"
        >
          No tienes otras organizaciones
        </span>
        <template
          v-for="organization in organizationStore.organizationsByUser"
          :key="organization?._id"
        >
          <div
            class="item"
            v-if="!organization?.default"
            @click="action(organization._id)"
          >
            <img :src="organization?.imgUrl || imgTemp" class="item__logo" />
            <span class="item__text">
              {{ `${organization?.razon_social} (${organization?.name})` }}
            </span>
            <div class="item__creator">
              <div class="creator" v-if="ownerOrg(organization)">
                <span class="u u-user"></span>
                <span>Creador</span>
              </div>
              <div class="invited" v-else>
                <span class="u u-user"></span>
                <span>{{
                  t(`${moduleMyOrganizations}.tagsUser.invited`)
                }}</span>
              </div>
            </div>
            <div class="item__users">
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
              <span v-else class="text">-</span>
            </div>
            <div class="item__buttons">
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
                @click.stop="action(organization._id, button.action)"
                class="btnIconModify"
              />
            </div>
          </div>
        </template>
      </template>

      <!-- LOADING -->
      <div
        v-if="!organizationStore.organizationsByUser.length"
        class="loading-container"
      >
        <u-loading color="--bg-neutral-500" />
        <span class="body-l-sb">Cargando...</span>
        <u-logo />
      </div>
    </div>
    <div class="organization__footer">
      <u-button
        :text="t(`${module}.buttons.createOrganization`)"
        icon="building"
        @click="crearOrg"
      />
    </div>
  </div>
</template>

<style scoped>
.organizations {
  display: grid;
  grid-template-rows: 1fr 40px;
  gap: 20px;
}
.organization__list {
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: min-content;
  align-items: flex-start;
  gap: 20px;
  flex-grow: 1;
  flex-shrink: 1;
  overflow: auto;
  scrollbar-gutter: stable;
  height: auto;
  min-height: 200px;
  padding-right: 12px;
}
.organization__list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.organization__list::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
.item {
  display: grid;
  grid-template-columns: 64px 1fr 200px 150px 200px;
  align-items: center;
  gap: 20px;
  border-radius: 8px;
  border: 1px solid var(--neutral-border-subtle);
  background-color: var(--neutral-background-default);
  transition: 0.3s cubic-bezier(0.455, 0.03, 0.515, 0.955);
  padding: 0 20px;
  height: 112px;
  flex-shrink: 1;
}
.item:hover {
  box-shadow: var(--shadow-3);
}
.item__text {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--primary-text-default);
}
.item__logo {
  object-fit: cover;
  width: 64px;
  height: 64px;
  border-radius: 10px;
}
.item__creator {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
}
.item__creator div {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 20px;
}
.item__creator span.u {
  font-size: 16px;
  font-weight: 400;
  line-height: 16px;
}
.item__creator span:not(.u) {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}
.creator {
  background-color: var(--secondary-surface-softer);
  color: var(--secondary-text-darker);
}
.invited {
  background-color: var(--info-surface-softer);
  color: var(--info-text-darker);
}
.item__users {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
}
.item__buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
}
.avatarModify:not(:nth-child(1)) {
  margin-left: -20px;
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
.subtitle {
  color: var(--neutral-text-caption);
  font-size: 14px;
}
.noOrg {
  color: var(--bg-neutral-400);
  font-size: 12px;
}
.text {
  color: var(--neutral-text-caption);
  font-size: 20px;
}
.organization__footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}
.loading-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding-top: 60px;
  gap: 20px;
}
.btnIconModify {
  height: 106px;
  width: 100%;
}
</style>
