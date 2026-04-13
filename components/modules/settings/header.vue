<script setup>
import useOrganizationStore from "@/stores/organization";
import { useI18n } from "vue-i18n";

// STORE
const organizationStore = useOrganizationStore();

// TRANSLATIONS
const { t } = useI18n();
const module = "modules.organizations.settingsOrganizations";

// ROUTER
const router = useRouter();

// FUNCTION
const crearOrg = () => {
  const path = "/organization/create";
  router.push(path);
};
</script>

<template>
  <div class="organizationHeader">
    <img
      :src="organizationStore.organization.imgUrl || '/img/companyDefault.png'"
      :alt="organizationStore.organization.razon_social"
    />

    <div class="organizationHeader__title">
      <div class="left">
        <h2 class="truncateText">
          {{ organizationStore.titleOrg || "..." }}
        </h2>
      </div>

      <div class="right">
        <u-button
          :text="t(module + '.buttons.createOrganization')"
          icon="building"
          @click="crearOrg"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.organizationHeader {
  display: grid;
  grid-template-columns: 80px 1fr;
  grid-template-rows: 1fr;
  grid-template-areas: "logo title";
  column-gap: 20px;
}

/* Logo */
.organizationHeader img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 16px;
  grid-area: logo;
}

/* Contenedor título + acciones */
.organizationHeader__title {
  grid-area: title;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

/* Título */
.organizationHeader__title .left {
  display: flex;
  min-width: 0;
}

.organizationHeader__title h2 {
  font-family: Nunito;
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  color: var(--neutral-text-body);
  margin: 0;
}

/* Acciones (botón a la derecha) */
.organizationHeader__title .right {
  display: flex;
  justify-content: flex-end;
}
</style>
