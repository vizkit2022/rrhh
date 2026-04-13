<script setup>
import { computed } from "vue";
import useOrganizationStore from "@/stores/organization";

// STORES
const organizationStore = useOrganizationStore();

// COMPUTED
const titleOrg = computed(() => {
  const regex = /\b[A-Za-z]/g;
  const title = organizationStore.organization.razon_social;
  const titleFormat = title.replace(regex, function (match) {
    return match.toUpperCase();
  });

  if (organizationStore.organization.default) {
    const title = titleFormat ? `(${titleFormat})` : "";
    return `MI UNABASE ${title}`;
  }

  return titleFormat || "...";
});
</script>

<template>
  <div class="parameterHeader">
    <img
      :src="organizationStore.organization.imgUrl || '/img/companyDefault.png'"
      :alt="organizationStore.organization.razon_social"
    />
    <div class="parameterHeader__title">
      <h2 class="truncateText">
        {{ titleOrg }}
      </h2>
      <span>Configura los parámetros requeridos en los formularios</span>
    </div>
  </div>
</template>

<style scoped>
.parameterHeader {
  display: grid;
  grid-template-columns: 60px 1fr;
  column-gap: 20px;
  padding: 24px 0;
  border-bottom: 1px solid var(--neutral-border-subtle);
}
.parameterHeader img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 16px;
}
.parameterHeader__title {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.parameterHeader h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 36px;
  text-align: left;
  color: var(--neutral-text-body);
  width: calc(100vw - 250px);
}
.parameterHeader span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-caption);
}

span,
h2 {
  font-family: Nunito;
}
</style>
