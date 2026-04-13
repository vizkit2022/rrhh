<script setup>
import useUserStore from "@/stores/user";
import { useI18n } from "vue-i18n";

// ── Translation ────────────────────────────────────────────────────────────────
const { t } = useI18n();
const module = "modules.contacts.modalContacts.infGeneral.cards.links";

// ─── Store ─────────────────────────────────────────────────────────────────────
const userStore = useUserStore();

// ─── Lista de todas las redes sociales disponibles ────────────────────────────
const socialNetworks = [
  {
    label: "Web",
    icon: "website",
    prop: "web",
    placeholder: t(`${module}.web.placeholder`),
  },
  {
    label: "Instagram",
    icon: "instagram",
    prop: "instagram",
    placeholder: t(`${module}.instagram.placeholder`),
  },
  {
    label: "Facebook",
    icon: "facebook",
    prop: "facebook",
    placeholder: t(`${module}.facebook.placeholder`),
  },
  {
    label: "LinkedIn",
    icon: "linkedin",
    prop: "linkedin",
    placeholder: t(`${module}.linkedin.placeholder`),
  },
  {
    label: "Youtube",
    icon: "youtube",
    prop: "youtube",
    placeholder: t(`${module}.youtube.placeholder`),
  },
  {
    label: "X",
    icon: "x",
    prop: "x",
    placeholder: t(`${module}.x.placeholder`),
  },
  {
    label: "Behance",
    icon: "behance",
    prop: "behance",
    placeholder: t(`${module}.behance.placeholder`),
  },
  {
    label: "GitHub",
    icon: "github",
    prop: "github",
    placeholder: t(`${module}.github.placeholder`),
  },
  {
    label: "SoundCloud",
    icon: "soundcloud",
    prop: "soundCloud",
    placeholder: t(`${module}.soundcloud.placeholder`),
  },
  {
    label: "Spotify",
    icon: "spotify",
    prop: "spotify",
    placeholder: t(`${module}.spotify.placeholder`),
  },
  {
    label: "Vimeo",
    icon: "vimeo",
    prop: "vimeo",
    placeholder: t(`${module}.vimeo.placeholder`),
  },
];

// ─── Estado reactivo ───────────────────────────────────────────────────────────
const visibleSocialNetworks = ref([]);
const socialLink = ref({ type: "", url: "" });
const isAddingLink = ref(false);

// ─── Computed ──────────────────────────────────────────────────────────────────
const isEditing = computed(() => userStore.dataSheet.state !== "show");

// ─── Computed ──────────────────────────────────────────────────────────────────
const otherAccounts = computed(
  () => userStore.dataSheet.data?.otherAccounts ?? {},
);

const allNetworksUsed = computed(() => {
  const usedProps = ["web", ...visibleSocialNetworks.value.map((s) => s.prop)];
  return socialNetworks.every((s) => usedProps.includes(s.prop));
});

// ─── Funciones ─────────────────────────────────────────────────────────────────
const openLink = (url) => {
  if (!url) return;
  let formattedUrl = url.trim();
  if (!/^https?:\/\//i.test(formattedUrl))
    formattedUrl = `https://${formattedUrl}`;
  if (!formattedUrl.includes(".")) formattedUrl += ".com";
  window.open(formattedUrl, "_blank", "noopener,noreferrer");
};

const addLink = () => {
  if (!allNetworksUsed.value) isAddingLink.value = true;
};

const closeAddLink = () => {
  isAddingLink.value = false;
  socialLink.value = { type: "", url: "" };
};

const deleteLink = (prop) => {
  otherAccounts.value[prop] = "";
  userStore.dataSheet.change = true;
  syncVisibleNetworks();
};

const saveNewLink = ({ type, url }) => {
  otherAccounts.value[type] = url;
  userStore.dataSheet.change = true;
  syncVisibleNetworks();
  closeAddLink();
};

const syncVisibleNetworks = () => {
  if (!otherAccounts.value) return;
  visibleSocialNetworks.value = socialNetworks.filter((social) => {
    const value = otherAccounts.value[social.prop];
    return value && social.prop !== "web";
  });
};

const cleanLinks = () => {
  syncVisibleNetworks();
  closeAddLink();
};

// ─── Ciclo de vida ─────────────────────────────────────────────────────────────
watch(
  otherAccounts,
  (val) => {
    if (val) syncVisibleNetworks();
  },
  { immediate: true, deep: true },
);

// ─── Exponer al padre ──────────────────────────────────────────────────────────
defineExpose({ cleanLinks });
</script>

<template>
  <div class="card" v-if="Object.values(userStore.dataSheet.data).length">
    <!-- Header -->
    <div class="card__header">
      <h2>{{ t(`${module}.title`) }}</h2>

      <template v-if="isEditing">
        <!-- Botón "+" para agregar enlace -->
        <u-button-icon
          v-if="!isAddingLink"
          class="btn_add"
          icon="new"
          size="s"
          type="text"
          :disabled="allNetworksUsed"
          @click="addLink"
        />
        <!-- Botón cancelar formulario -->
        <button v-else class="btn_cancel" @click="closeAddLink">
          <span class="u u-close"></span>
          <span>Cancelar</span>
        </button>
      </template>
    </div>

    <!-- Lista -->
    <div class="card__list">
      <!-- Web: siempre visible -->
      <div class="card__item">
        <div class="card__item-row">
          <span class="u u-website"></span>
          <span class="label">{{ t(`${module}.web.label`) }}</span>

          <div class="card__item-input">
            <u-input
              v-if="isEditing"
              :placeholder="t(`${module}.web.placeholder`)"
              size="s"
              v-model="otherAccounts.web"
              :error="userStore.dataSheet.errors.web"
              @change="userStore.dataSheet.change = true"
            />
            <span v-else class="text truncateText">{{
              otherAccounts.web || "-"
            }}</span>
          </div>

          <u-button-icon
            v-if="isEditing"
            icon="click"
            size="s"
            type="text"
            :disabled="!otherAccounts.web"
            @click="openLink(otherAccounts.web)"
          />
        </div>
      </div>

      <!-- Redes agregadas por el usuario -->
      <div
        class="card__item"
        v-for="social in visibleSocialNetworks"
        :key="social.prop"
      >
        <div class="card__item-row">
          <span :class="`u u-${social.icon}`"></span>
          <span class="label">{{ social.label }}</span>

          <div class="card__item-input">
            <u-input
              v-if="isEditing"
              :placeholder="social.placeholder"
              size="s"
              v-model="otherAccounts[social.prop]"
              :error="userStore.dataSheet.errors[social.prop]"
              @change="userStore.dataSheet.change = true"
            />
            <span v-else class="text truncateText">{{
              otherAccounts[social.prop] || "-"
            }}</span>
          </div>

          <u-button-icon
            v-if="isEditing"
            icon="click"
            size="s"
            type="text"
            :disabled="!otherAccounts[social.prop]"
            @click="openLink(otherAccounts[social.prop])"
          />
          <u-button-icon
            v-if="isEditing"
            icon="close"
            size="s"
            type="text"
            color="--danger-text-default"
            color-hover="--danger-text-darker"
            color-active="--danger-text-subtle"
            @click="deleteLink(social.prop)"
          />
        </div>
      </div>

      <!-- Formulario para agregar nueva red -->
      <u-input-links
        v-if="isEditing && isAddingLink"
        v-model="socialLink"
        size="m"
        :required="true"
        :auto-focus="isAddingLink"
        :used-networks="['web', ...visibleSocialNetworks.map((s) => s.prop)]"
        @save="saveNewLink"
      />
    </div>
  </div>
</template>

<style scoped>
.card {
  background-color: var(--neutral-surface-softer);
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 16px;
  padding: 12px;
}

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
}

.card h2 {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
}

.btn_add,
.btn_cancel {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: transparent;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
  cursor: pointer;
}
.btn_add {
  color: var(--white);
}
.btn_cancel {
  color: var(--neutral-text-body);
}

.card__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 100%;
  height: 100%;
  padding-right: 2px;
}

.card__list::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.card__list::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}

.card__item {
  background-color: var(--neutral-background-default);
  border-radius: 8px;
  padding: 0 8px 0 10px;
}

.card__item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
}

.card__item span.u {
  font-size: 16px;
  line-height: 16px;
  color: var(--neutral-text-caption);
  width: 16px;
  flex-shrink: 0;
}

.card__item span.label {
  width: 70px;
  font-size: 12px;
  font-weight: 600;
  color: var(--neutral-text-caption);
  flex-shrink: 0;
}

.card__item-input {
  flex-grow: 1;
  display: flex;
  align-items: center;
}

.card__item span.text {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
  padding-left: 12px;
  width: 100%;
}

.card__item-input::v-deep(.containerInput),
.card__item-input::v-deep(.containerSearch) {
  width: 100%;
}

.card__item-input::v-deep(.containerInput input),
.card__item-input::v-deep(.containerSearch input) {
  border: var(--neutral-background-default) 1px solid !important;
}

h2,
span {
  font-family: Nunito;
}
</style>
