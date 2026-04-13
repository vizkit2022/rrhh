<script setup>
import useUserStore from "@/stores/user";
import { useI18n } from "vue-i18n";

// ── Translation --──────────────────────────────────────────────────────────────
const { t, locale } = useI18n();
const module = "modules.mySettings";
const moduleLinks = module + ".sections.links";

// ─── Store ────────────────────────────────────────────────────────────────────
const userStore = useUserStore();

// ─── Lista de todas las redes sociales disponibles ───────────────────────────
const socialNetworks = [
  {
    label: "Web",
    icon: "network",
    prop: "web",
    placeholder: "Ingrese su enlace web.",
  },
  {
    label: "Instagram",
    icon: "instagram",
    prop: "instagram",
    placeholder: "Ingrese su enlace de Instagram.",
  },
  {
    label: "Facebook",
    icon: "facebook",
    prop: "facebook",
    placeholder: "Ingrese su enlace de Facebook.",
  },
  {
    label: "LinkedIn",
    icon: "linkedin",
    prop: "linkedin",
    placeholder: "Ingrese su enlace de LinkedIn.",
  },
  {
    label: "Youtube",
    icon: "youtube",
    prop: "youtube",
    placeholder: "Ingrese su enlace de YouTube.",
  },
  { label: "X", icon: "x", prop: "x", placeholder: "Ingrese su enlace de X." },
  {
    label: "Behance",
    icon: "behance",
    prop: "behance",
    placeholder: "Ingrese su enlace de Behance.",
  },
  {
    label: "GitHub",
    icon: "github",
    prop: "github",
    placeholder: "Ingrese su enlace de GitHub.",
  },
  {
    label: "SoundCloud",
    icon: "soundcloud",
    prop: "soundCloud",
    placeholder: "Ingrese su enlace de SoundCloud.",
  },
  {
    label: "Spotify",
    icon: "spotify",
    prop: "spotify",
    placeholder: "Ingrese su enlace de Spotify.",
  },
  {
    label: "Vimeo",
    icon: "vimeo",
    prop: "vimeo",
    placeholder: "Ingrese su enlace de Vimeo.",
  },
];

// ─── Estado reactivo ──────────────────────────────────────────────────────────

// Redes que el usuario ya agregó (se muestran en pantalla)
const visibleSocialNetworks = ref([]);

// Datos del nuevo enlace que se está por agregar
const socialLink = ref({ type: "", url: "" });

// Controla si se muestra el formulario para agregar un enlace
const isAddingLink = ref(false);

// ─── Computed ─────────────────────────────────────────────────────────────────

// Devuelve true si el usuario ya usó todas las redes disponibles
const allNetworksUsed = computed(() => {
  const usedProps = ["web", ...visibleSocialNetworks.value.map((s) => s.prop)];
  return socialNetworks.every((s) => usedProps.includes(s.prop));
});

// Shortcut para acceder a los enlaces guardados del usuario
const otherAccounts = computed(() => userStore.mySettings.form.otherAccounts);

// ─── Funciones ────────────────────────────────────────────────────────────────

// Abre el enlace en una nueva ventana
const openLink = (url) => {
  if (!url) return;

  let formattedUrl = url.trim();

  // Si no tiene http o https lo agregamos
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  // Si no tiene punto (.) asumimos que falta .com
  if (!formattedUrl.includes(".")) {
    formattedUrl += ".com";
  }

  window.open(formattedUrl, "_blank", "noopener,noreferrer");
};

// Muestra el formulario para agregar un nuevo enlace (si quedan redes disponibles)
const addLink = () => {
  if (!allNetworksUsed.value) isAddingLink.value = true;
};

// Cierra el formulario y limpia el enlace temporal
const closeAddLink = () => {
  isAddingLink.value = false;
  socialLink.value = { type: "", url: "" };
};

// Elimina un enlace por su prop (ej: "instagram") y actualiza la vista
const deleteLink = (prop) => {
  otherAccounts.value[prop] = "";
  userStore.mySettings.change = true;
  syncVisibleNetworks();
};

// Guarda el nuevo enlace en el store y actualiza la lista visible
const saveNewLink = ({ type, url }) => {
  otherAccounts.value[type] = url;
  userStore.mySettings.change = true;
  syncVisibleNetworks();
  closeAddLink();
};

// Sincroniza visibleSocialNetworks con lo que hay guardado en el store.
// Filtra las redes que tienen valor y excluye "web" (se muestra aparte)
const syncVisibleNetworks = () => {
  visibleSocialNetworks.value = socialNetworks.filter((social) => {
    const value = otherAccounts.value[social.prop];
    return value && social.prop !== "web";
  });
};

// Limpia todo: lista visible + formulario abierto (se expone al padre)
const cleanLinks = () => {
  syncVisibleNetworks();
  closeAddLink();
};

// ─── Ciclo de vida ────────────────────────────────────────────────────────────

// Al montar el componente, cargamos las redes que el usuario ya tenía guardadas
onMounted(syncVisibleNetworks);

// ─── Exponer métodos al componente padre ──────────────────────────────────────
defineExpose({ cleanLinks });
</script>

<template>
  <div class="links">
    <div class="links__card">
      <!-- Encabezado con título y botón para abrir/cerrar el formulario -->
      <div class="links__header">
        <h2>{{ t(`${moduleLinks}.title`) }}</h2>

        <!-- Botón "+" para agregar, se deshabilita si ya se usaron todas las redes -->
        <u-button-icon
          v-if="!isAddingLink"
          class="btn_add"
          icon="new"
          size="s"
          type="text"
          :disabled="allNetworksUsed"
          @click="addLink"
        />

        <!-- Botón "X" para cancelar el formulario -->
        <button v-else class="btn_cancel" @click="closeAddLink">
          <span class="u u-close"></span>
          <span>{{ t(`${module}.buttons.cancel`) }}</span>
        </button>
        <!-- <u-button-icon
          v-else
          icon="close"
          size="s"
          type="text"
          color="--danger-text-default"
          color-hover="--danger-text-darker"
          color-active="--danger-text-subtle"
          @click="closeAddLink"
        /> -->
      </div>

      <div class="links__form">
        <!-- Campo "Web" siempre visible (no se puede eliminar) -->
        <div class="links__input">
          <span class="u u-network"></span>
          <span class="label">Web</span>
          <u-input
            placeholder="Ingrese su enlace web."
            v-model="otherAccounts.web"
            @input="userStore.mySettings.change = true"
          />
          <u-button-icon
            icon="click"
            size="s"
            type="text"
            :disabled="!otherAccounts.web"
            @click="openLink(otherAccounts.web)"
          />
        </div>

        <!-- Redes que el usuario ya agregó, con botón para eliminarlas -->
        <div
          class="links__input"
          v-for="social in visibleSocialNetworks"
          :key="social.prop"
        >
          <span :class="`u u-${social.icon}`"></span>
          <span class="label">{{ social.label }}</span>
          <u-input
            :placeholder="social.placeholder"
            v-model="otherAccounts[social.prop]"
            @input="userStore.mySettings.change = true"
          />
          <u-button-icon
            icon="click"
            size="s"
            type="text"
            :disabled="!otherAccounts[social.prop]"
            @click="openLink(otherAccounts[social.prop])"
          />
          <u-button-icon
            icon="close"
            size="s"
            type="text"
            color="--danger-text-default"
            color-hover="--danger-text-darker"
            color-active="--danger-text-subtle"
            @click="deleteLink(social.prop)"
          />
        </div>

        <!-- Formulario para seleccionar y guardar una nueva red social -->
        <u-input-links
          v-if="isAddingLink"
          v-model="socialLink"
          size="m"
          :required="true"
          :auto-focus="isAddingLink"
          :used-networks="['web', ...visibleSocialNetworks.map((s) => s.prop)]"
          @save="saveNewLink"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.links {
  display: inline;
}

.links__card {
  min-width: 520px;
  max-width: 520px;
  width: 50%;
  background-color: var(--neutral-surface-softer);
  border: 1px solid var(--neutral-border-light);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.links__header {
  display: flex;
  justify-content: space-between;
  height: 48px;
  align-items: center;
}

.links__header h2 {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
  margin: 10px 0 20px;
}

.btn_add {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  margin: 10px 0 20px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
  color: var(--white);
  cursor: pointer;
}

.btn_cancel {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: transparent;
  border: none;
  margin: 10px 0 20px;
  border: 1px solid var(--neutral-border-subtle);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
  color: var(--neutral-text-body);
  cursor: pointer;
}

/* Reducimos el botón de acción y quitamos su borde */
.links__card::v-deep(.btn) {
  transform: scale(0.8);
  border: transparent;
}

.links__form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.links__input {
  background-color: var(--neutral-background-default);
  border-radius: 8px;
  min-height: 40px;
  display: flex;
  padding: 0 10px 0 15px;
  align-items: center;
  gap: 10px;
}

.links__input .label {
  width: 130px;
}

/* Ícono de la red social */
.links__input span {
  font-size: 18px;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

/* Texto del label (no ícono) */
.links__input span:not(.u) {
  font-size: 14px;
  font-weight: 600;
}

/* El input ocupa todo el espacio disponible */
.links__input::v-deep(.containerInput),
.links__input::v-deep(.containerSearch) {
  width: 100%;
}

/* Borde invisible cuando el input no está en hover */
.links__input::v-deep(.containerInput input:not(:hover)),
.links__input::v-deep(.containerSearch input:not(:hover)) {
  border: var(--neutral-background-default) 1px solid !important;
}

/* Borde rojo en el select si hay error de validación */
.links__input::v-deep(.containerSelect .containerSelectInput) {
  border: v-bind(
    "userStore?.mySettings?.errors?.type ? 'var(--bg-danger-500) 1px solid' : 'var(--neutral-background-default) 1px solid'"
  ) !important;
}

span,
h2 {
  font-family: Nunito;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}
</style>
