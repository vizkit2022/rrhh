<script setup>
import useUserStore from "@/stores/user";
import { useI18n } from "vue-i18n";

//Traducciones
const { t } = useI18n();
const module = "modules.contacts.modalContacts.infGeneral.cards.links";

// STORES
const userStore = useUserStore();
</script>

<template>
  <div class="card" v-if="Object.values(userStore.dataSheet.data).length">
    <div class="card__header">
      <h2>{{ t(module + ".title") }}</h2>
    </div>
    <div class="card__list">
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-website"></span>
          <span class="label">{{ t(module + ".web.label") }}</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.web.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.otherAccounts.web"
              :error="userStore.dataSheet.errors.web"
              @change="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text truncateText">{{
              userStore.dataSheet.data.otherAccounts.web || "-"
            }}</span>
          </div>
        </div>
      </div>
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-instagram" style="margin-top: -2px !important;"></span>
          <span class="label">{{ t(module + ".instagram.label") }}</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.instagram.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.otherAccounts.instagram"
              :error="userStore.dataSheet.errors.instagram"
              @change="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text truncateText">{{
              userStore.dataSheet.data.otherAccounts.instagram || "-"
            }}</span>
          </div>
        </div>
      </div>
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-facebook" style="margin-top: -2px !important;"></span>
          <span class="label">{{ t(module + ".facebook.label") }}</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.facebook.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.otherAccounts.facebook"
              :error="userStore.dataSheet.errors.facebook"
              @change="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text textDisabled truncateText">{{
              userStore.dataSheet.data.otherAccounts.facebook || "-"
            }}</span>
          </div>
        </div>
      </div>
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-linkedin" style="margin-top: -2px !important;"></span>
          <span class="label">{{ t(module + ".linkedin.label") }}</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.linkedin.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.otherAccounts.linkedin"
              :error="userStore.dataSheet.errors.linkedin"
              @change="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text textDisabled truncateText">{{
              userStore.dataSheet.data.otherAccounts.linkedin || "-"
            }}</span>
          </div>
        </div>
      </div>
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-youtube"></span>
          <span class="label">{{ t(module + ".youtube.label") }}</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.youtube.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.otherAccounts.youtube"
              :error="userStore.dataSheet.errors.youtube"
              @change="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text textDisabled truncateText">{{
              userStore.dataSheet.data.otherAccounts.youtube || "-"
            }}</span>
          </div>
        </div>
      </div>
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-x"></span>
          <span class="label">{{ t(module + ".x.label") }}</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder=" t(module + '.x.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.otherAccounts.x"
              :error="userStore.dataSheet.errors.x"
              @change="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text textDisabled truncateText">{{
              userStore.dataSheet.data.otherAccounts.x || "-"
            }}</span>
          </div>
        </div>
      </div>
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-behance"></span>
          <span class="label">{{ t(module + ".behance.label") }}</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.behance.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.otherAccounts.behance"
              :error="userStore.dataSheet.errors.behance"
              @change="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text textDisabled truncateText">{{
              userStore.dataSheet.data.otherAccounts.behance || "-"
            }}</span>
          </div>
        </div>
      </div>
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-github"></span>
          <span class="label">{{ t(module + ".github.label") }}</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.github.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.otherAccounts.github"
              :error="userStore.dataSheet.errors.github"
              @change="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text textDisabled truncateText">{{
              userStore.dataSheet.data.otherAccounts.github || "-"
            }}</span>
          </div>
        </div>
      </div>
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-soundcloud"></span>
          <span class="label">{{ t(module + ".soundcloud.label") }}</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.soundcloud.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.otherAccounts.soundCloud"
              :error="userStore.dataSheet.errors.soundCloud"
              @change="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text textDisabled truncateText">{{
              userStore.dataSheet.data.otherAccounts.soundCloud || "-"
            }}</span>
          </div>
        </div>
      </div>
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-spotify"></span>
          <span class="label">Spotify</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.spotify.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.otherAccounts.spotify"
              :error="userStore.dataSheet.errors.spotify"
              @change="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text textDisabled truncateText">{{
              userStore.dataSheet.data.otherAccounts.spotify || "-"
            }}</span>
          </div>
        </div>
      </div>
      <div class="card__item">
        <div class="card__item-sup">
          <span class="u u-vimeo"></span>
          <span class="label">Vimeo</span>
          <div class="card__item-input">
            <u-input
              v-if="userStore.dataSheet.state !== 'show'"
              :placeholder="t(module + '.vimeo.placeholder')"
              size="s"
              v-model="userStore.dataSheet.data.otherAccounts.vimeo"
              :error="userStore.dataSheet.errors.vimeo"
              @change="userStore.dataSheet.change = true"
              :disabled="userStore.dataSheet.state === 'show'"
            />
            <span v-else class="text textDisabled truncateText">{{
              userStore.dataSheet.data.otherAccounts.vimeo || "-"
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Contenedor */
.card {
  background-color: var(--neutral-surface-softer);
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 16px;
  padding: 12px;
}
/* Header */
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
  text-align: left;
  color: var(--neutral-text-body);
}
.card__header::v-deep(.btn) {
  transform: scale(0.8);
  border: transparent;
}
/* List */
.card__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  height: 100%;
  padding-right: 2px;
}
.card__list::-webkit-scrollbar,
.card__item-inf::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: var(--neutral-surface-light);
  border-radius: 20px;
}
.card__list::-webkit-scrollbar-thumb,
.card__item-inf::-webkit-scrollbar-thumb {
  background: var(--neutral-surface-subtle);
  border-radius: 5px;
}
/* Item */
.card__item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0 8px 0 10px;
  box-sizing: border-box;
  border-radius: 8px;
  background-color: var(--neutral-background-default);
}
.card__item-sup {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 48px;
}
.card__item-inf {
  display: flex;
  gap: 2px;
  width: 100%;
  flex-wrap: wrap;
  max-height: 78px;
  overflow-y: auto;
  margin-bottom: 10px;
}
.card__item span.u {
  width: 8px;
  color: var(--neutral-text-caption);
  font-size: 16px;
  line-height: 16px;
  margin-top: -1px !important;
}
.card__item span.label {
  width: 60px;
  font-size: 12px;
  font-weight: 600;
  line-height: 12px;
  text-align: left;
  color: var(--neutral-text-caption);
}
.card__item span.text {
  width: 100%;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
  color: var(--neutral-text-body);
  padding-left: 12px;
}
.card__item span.textDisabled {
  font-weight: 400;
  color: var(--bg-neutral-400);
}
.card__item-input {
  flex-grow: 1;
  width: 220px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.card__item-input::v-deep(.containerInput),
.card__item-input::v-deep(.containerSearch) {
  width: 100%;
}

.card__item-input::v-deep(.containerSelect .containerSelectInput),
.card__item-input::v-deep(.containerSearch input),
.card__item-input::v-deep(.containerInput input) {
  border: var(--neutral-background-default) 1px solid !important;
}

/* Global */
h2,
span {
  font-family: Nunito;
}
</style>
