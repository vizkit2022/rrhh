<script setup>
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import { useI18n } from "vue-i18n";

// TRANSLATIONS
const { t } = useI18n();
const module = "modules.organizations.settings.taxes.modal.create";

// STORE
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();

//form
const form = organizationStore.formCreateTax;
const type = computed(() => form.step1.type);
</script>

<template>
  <div class="resumen">
    <img v-if="type === 'tax'" src="/img/tax.svg" alt="tax" />
    <img v-else src="/img/fee.svg" alt="surcharge" />
    <div class="info">
      <div class="names">
        <span>{{ t(`${module}.components.cardResumen.type.${type}`) }}</span>
        <span class="main"
          >{{ form.step1.name
          }}<strong v-if="form.step1.abbr">
            ( {{ form.step1.abbr }} )</strong
          ></span
        >
      </div>

      <div class="percentage">
        <span> {{ form.step1.retentionName }} </span>
        <span>{{ form.step1.percentage }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* RESUMEN */
.resumen {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  padding: 16px;
  gap: 16px;
  box-sizing: border-box;
  box-shadow: var(--elevation-xs);
  border: 1px solid var(--neutral-border-subtle);
}
.resumen .main {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  color: var(--primary-text-default);
}
.resumen .main strong {
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-caption);
}
.resumen img {
  width: 45px;
  height: 45px;
}
.resumen .info {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 100%;
}
.resumen .info .names {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
}

.resumen .info .names span:nth-child(1) {
  font-weight: 400;
  font-size: 10px;
  line-height: 14px;
  color: var(--neutral-text-caption);
  text-transform: uppercase;
}

.resumen .info .main {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  color: var(--primary-text-default);
}

.resumen .percentage {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
}
.resumen .percentage span:nth-child(1) {
  font-weight: 400;
  font-size: 10px;
  line-height: 14px;
  color: var(--neutral-text-caption);
  text-transform: uppercase;
}
.resumen .percentage span:nth-child(2) {
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  color: var(--neutral-text-body);
}
</style>
