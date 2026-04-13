<script setup>
import { ref } from "vue";
import useUserStore from "@/stores/user";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const module = "modules.mySettings";
const moduleAccount = module + ".sections.accountSettings.sections";

// Stores
const userStore = useUserStore();

// Constants
const expand = ref(null);

const expandCard = (pos) => {
  if (pos !== null) {
    expand.value = pos;
  }
};
</script>

<template>
  <div class="account">
    <div class="cards">
      <div class="card">
        <div class="card-label">
          <span>{{ t(`${moduleAccount}.username.label`) }}</span>
        </div>
        <div class="card-content">
          <div class="card__sup" v-if="expand !== 0">
            <span class="main">{{ userStore.mySettings.form.username }}</span>
            <u-button-icon
              icon="edit"
              type="outlined"
              color="--neutral-text-caption"
              colorHover="--neutral-text-subtitle"
              colorActive="--neutral-text-body"
              @click="expandCard(0)"
            />
          </div>
          <MySettingsContainersUserName
            v-if="expand === 0"
            class="card__inf"
            :expand="expand === 0"
            @closeTag="expand = null"
          />
        </div>
      </div>
      <div class="card">
        <div class="card-label">
          <span>{{ t(`${moduleAccount}.password.label`) }}</span>
        </div>
        <div class="card-content">
          <div class="card__sup" v-if="expand !== 1">
            <span class="main">***************</span>
            <u-button-icon
              icon="edit"
              type="outlined"
              color="--neutral-text-caption"
              colorHover="--neutral-text-subtitle"
              colorActive="--neutral-text-body"
              @click="expandCard(1)"
            />
          </div>
          <MySettingsContainersPassword
            v-if="expand === 1"
            class="card__inf"
            :expand="expand === 1"
            @closeTag="expand = null"
          />
        </div>
      </div>
      <div class="card">
        <div class="card-label">
          <span>{{ t(`${moduleAccount}.email.label`) }}</span>
        </div>
        <div class="card-content">
          <div class="card__sup" v-if="expand !== 2">
            <span class="main">{{ userStore.mySettings.form.email }}</span>
            <u-button-icon
              icon="edit"
              type="outlined"
              color="--neutral-text-caption"
              colorHover="--neutral-text-subtitle"
              colorActive="--neutral-text-body"
              @click="expandCard(2)"
            />
          </div>
          <MySettingsContainersEmail
            v-if="expand === 2"
            class="card__inf"
            :expand="expand === 2"
            @closeTag="expand = null"
          />
        </div>
      </div>
      <div class="action desactivate">
        <div class="card-label">
          <u-button
            :text="t(`${module}.buttons.desactive`)"
            color="--danger-text-default"
            colorHover="--danger-text-darker"
            colorActive="--danger-text-darker"
            :disabled="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account {
  padding-right: 2px;
  max-width: 1068px;
}
.cards {
  border: 1px solid var(--neutral-border-light);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;
  max-width: 1060px;
}
.card {
  flex-shrink: 1;
  min-height: 48px;
  height: auto;
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 20px;
}
.card:not(.desactivate) {
  border-bottom: 1px solid var(--neutral-border-light);
  padding-bottom: 10px;
}
.card-label {
  display: flex;
  align-items: center;
  height: 48px;
  padding-left: 16px;
}
.card-label span {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: var(--neutral-text-caption);
}
.card-content {
  height: auto;
}
.card__sup {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding-right: 16px;
}
.card__sup span.main {
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  color: var(--neutral-text-body);
}
.action {
  display: flex;
  justify-content: flex-start;
  min-height: 48px;
  height: auto;
}
span.delete {
  color: var(--danger-text-darker);
}

span {
  font-family: Nunito;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}
</style>
