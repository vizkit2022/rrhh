<script setup>
import { ref } from "vue";

import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import uColorpicker from "~/components/custom/u-colorpicker.vue";

// Store
const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();

// Constants
const { t } = useI18n();
const module = "modules.organizations.settings.pdf.group";
const sections = ref({});
</script>

<template>
  <div class="config__controls">
    <div class="config__controls-card">
      <div class="config__controls-card-title">
        <span>{{ t(module + ".appearance.title") }}</span>
        <button @click="sections.appearance = !sections.appearance">
          <span class="u u-chevron-down"></span>
        </button>
      </div>
      <div class="config__appearance">
        <div class="config__appearance-group" style="padding-top: 20px">
          <div class="config__appearance-title">
            <span>{{ t(module + ".appearance.sections.logo.title") }}</span>
          </div>
          <div class="config__appearance-content">
            <div class="config__appearance-main">
              <div class="config__appearance-logo">
                <img :src="organizationStore?.organization.imgUrl" alt="" />
                <span class="truncateText">{{ organizationStore?.organization.name }}.jpg</span>
              </div>
              <button class="customBtnIcon" v-if="false">
                <span class="u u-edit"></span>
              </button>
            </div>
            <p>{{ t(module + ".appearance.sections.logo.text") }}</p>
          </div>
        </div>
        <div class="config__appearance-group" style="padding-bottom: 20px">
          <div class="config__appearance-title">
            <span>{{ t(module + ".appearance.sections.color.title") }}</span>
          </div>
          <div class="config__appearance-content">
            <div class="config__appearance-main">
              <u-colorpicker v-model="organizationStore.printPdf.color" />
            </div>
            <p>{{ t(module + ".appearance.sections.color.text") }}</p>
            <div class="config__appearance-content-group" style="padding-top: 10px">
              <u-checkbox :height="20" v-model="organizationStore.printPdf.solidColor" />
              <span>{{ t(module + ".appearance.sections.color.check1") }}
                <strong class="body-xs-r">{{
                  t(module + ".appearance.sections.color.checkInfo1")
                }}</strong></span>
            </div>
            <div class="config__appearance-content-group" style="padding-top: 10px">
              <u-checkbox :height="20" v-model="organizationStore.printPdf.isHeaderTextWhite" />
              <span>{{ t(module + ".appearance.sections.color.check2") }}
                <strong class="body-xs-r">{{
                  t(module + ".appearance.sections.color.checkInfo2")
                }}</strong></span>
            </div>
          </div>
        </div>
      </div>
      <div class="config__controls-card-title">
        <span>{{ t(module + ".content.title") }}</span>
        <button @click="sections.content = !sections.content">
          <span class="u u-chevron-down"></span>
        </button>
      </div>
      <div class="config__content">
        <div class="config__content-group" style="padding-top: 20px">
          <u-checkbox :height="20" v-model="organizationStore.printPdf.showTotal" />
          <span>{{ t(module + ".content.check6") }}</span>
        </div>
        <div class="config__content-group" style="padding-top: 20px">
          <u-checkbox :height="20" v-model="organizationStore.printPdf.shouldShowZeroAmountLines" />
          <span>{{ t(module + ".content.check1") }}</span>
        </div>
        <div class="config__content-group" v-if="false">
          <u-checkbox :height="20" v-model="organizationStore.printPdf.showOvertime" />
          <span>{{ t(module + ".content.check2") }}</span>
        </div>
        <div class="config__content-group">
          <u-checkbox :height="20" v-model="organizationStore.printPdf.showValues" />
          <span>{{ t(module + ".content.check3") }}</span>
        </div>
        <div class="config__content-group">
          <u-checkbox :height="20" v-model="organizationStore.printPdf.showAmounts" />
          <span>{{ t(module + ".content.check4") }}</span>
        </div>
        <div class="config__content-group">
          <u-checkbox :height="20" v-model="organizationStore.printPdf.showUnit" />
          <span>{{ t(module + ".content.check5") }}</span>
        </div>
        <div class="config__content-group" style="padding-top: 20px">
          <u-checkbox :height="20" v-model="organizationStore.printPdf.showDescriptionLine" />
          <span>{{ t(module + ".content.check7") }}</span>
        </div>
        <div class="config__content-group" style="padding-bottom: 20px">
          <u-checkbox :height="20" v-model="organizationStore.printPdf.showDescriptionGroup" />
          <span>{{ t(module + ".content.check8") }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config__controls {
  grid-area: controls;
  transition: 0.3s;
  overflow: auto;
  padding: 2px 2px 4px 4px;
}

.config__controls::-webkit-scrollbar {
  width: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}

.config__controls-card {
  box-shadow: var(--elevation-xs);
  border-radius: 16px;
  padding: 16px 24px;
  height: auto;
  transition: 0.3s;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config__controls-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--neutral-border-light);
  padding-bottom: 10px;
}

.config__controls-card-title span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
}

.config__controls-card-title button,
.customBtnIcon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--neutral-border-subtle);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.3s;
}

.config__controls-card-title button span,
.customBtnIcon span {
  color: var(--neutral-text-caption);
  font-size: 20px;
  line-height: 20px;
  font-weight: 400;
  transition: 0.3s;
}

.config__controls-card-title button:hover,
.customBtnIcon:hover {
  border: 1px solid var(--primary-surface-subtle);
}

.config__controls-card-title button:hover span,
.customBtnIcon:hover span {
  color: var(--primary-text-default);
}

.config__appearance {
  height: v-bind("sections.appearance ? 'auto' : '0px'");
  overflow: hidden;
  transition: ease;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config__content {
  height: v-bind("sections.content ? 'auto' : '0px'");
  overflow: hidden;
  transition: ease;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config__appearance-group {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 10px;
}

.config__appearance-title {
  height: 40px;
  display: flex;
  align-items: center;
  padding-left: 10px;
}

.config__appearance-title span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-caption);
}

.config__appearance-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config__appearance-main {
  height: 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  border: 1px solid var(--neutral-border-light);
  padding: 8px 12px;
  box-sizing: border-box;
}

.config__appearance-content img {
  height: 32px;
  width: 32px;
  aspect-ratio: 1 / 1;
  border-radius: 4px;
}

.config__appearance-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.config__appearance-content .config__appearance-logo span {
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: var(--neutral-text-body);
  width: 200px;
}

.config__appearance-content p {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: var(--neutral-text-caption);
}

.config__content-group,
.config__appearance-content-group {
  display: flex;
  gap: 16px;
  align-items: center;
}

.config__content-group span,
.config__appearance-content-group span {
  font-size: 14px;
  font-weight: 400;
  line-height: 14px;
  color: var(--neutral-text-body);
  padding-top: 2px;
}

.config__appearance-content-group span strong {
  color: var(--neutral-text-caption);
  font-weight: 400;
}

.config__content-group {
  padding-left: 10px;
}
</style>
