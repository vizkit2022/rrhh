<script setup>
import useGlobalStore from "@/stores/global";
import useSalesStore from "@/stores/sales";
import { useI18n } from "vue-i18n";

// TRANSLATIONS
const { t, locale } = useI18n();
const module = "modules.sales.createSale";

// STORE
const globalStore = useGlobalStore();
const salesStore = useSalesStore();

// EMITS
const emit = defineEmits(["closeModal", "changeStep"]);

const closeStep = () => emit("closeModal");
const prevStep = () => emit("changeStep", false);
const nextStep = () => emit("changeStep", true);

const getNameCode = (code) => {
  switch (code) {
    case "invoice":
      return {
        es: "Documento base",
        en: "Base Document",
      };
    default:
      return "";
  }
};

// styles img
const imgSii = computed(() => {
  return globalStore.isDark ? "/img/sii-dark.png" : "/img/sii-light.png";
});

// styles
const backgroundContainerIntro = computed(() => {
  return globalStore.isDark === false
    ? "var(--neutral-background-darker)"
    : "var(--neutral-surface-darker)";
});
</script>

<template>
  <div class="confirm-sii">
    <!-- Header -->
    <div class="header">
      <span class="body-l-sb">{{
        t(`${module}.stepConfirmSii.titleHeader`, {
          typeDoc:
            salesStore?.formDocInvoice?.typeDocument?.tag ||
            getNameCode(salesStore?.formDocInvoice?.typeDocument?.code)[
              globalStore.lang
            ],
        })
      }}</span>
      <u-button-icon
        @click="closeStep"
        icon="u u-close"
        type="outlined"
        color="--neutral-text-caption"
        size="l"
        style="border-radius: 50%"
      />
    </div>

    <!-- Content -->
    <div class="content">
      <div class="img">
        <img :src="imgSii" alt="SII Warning" class="sii" />
        <div class="logo center-x-y">
          <u-logo style="width: 31px" />
          <u-logo-text class="logoText" />
        </div>
      </div>

      <div class="info">
        <div class="container-intro">
          <span class="body-m-sb intro">
            {{ t(`${module}.stepConfirmSii.text`) }}
          </span>
        </div>

        <div class="list">
          <div class="item">
            <span
              class="u u-locked iconItem"
              style="color: var(--info-text-default)"
            ></span>
            <span class="body-m-sb">
              {{ t(`${module}.stepConfirmSii.points.point1`) }}
            </span>
          </div>

          <div class="item">
            <span
              class="u u-open iconItem"
              style="color: var(--primary-text-default)"
            ></span>
            <span class="body-m-sb">
              {{ t(`${module}.stepConfirmSii.points.point2`) }}
            </span>
          </div>

          <div class="item">
            <span
              class="u u-file-text iconItem"
              style="color: var(--secondary-text-default)"
            ></span>
            <span class="body-m-sb">
              {{ t(`${module}.stepConfirmSii.points.point3`) }}
            </span>
          </div>

          <div class="item">
            <span
              class="u u-circle-check iconItem"
              style="color: var(--success-text-default)"
            ></span>
            <span class="body-m-sb">
              {{ t(`${module}.stepConfirmSii.points.point4`) }}
            </span>
          </div>

          <div class="item_checkbox">
            <u-checkbox v-model="salesStore.formDocInvoice.dialogNotices.sii" />
            <span class="body-m-sb">
              {{ t(`${module}.stepConfirmSii.msg.notShowNotice`) }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <u-button
        :text="t(`${module}.buttons.back`)"
        type="outlined"
        @click="prevStep"
      />
      <u-button :text="t(`${module}.buttons.next`)" @click="nextStep" />
    </div>
  </div>
</template>

<style scoped>
.confirm-sii {
  width: 80vw;
  max-width: 556px;
  height: 80vh;
  max-height: 752px;
  padding: 0px 0px;
  border-radius: 12px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  justify-content: center;
  gap: 24px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--neutral-text-body);
}

.img {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 74px;
}

.img .sii {
  width: 100%;
  max-width: 200px;
  height: auto;
  align-self: center;
}

.logo.center-x-y {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.content {
  display: flex;
  flex-direction: column;
  margin-top: 6px;
  color: var(--neutral-text-body);
  padding: 0 20px;
  gap: 34px;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.container-intro {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  min-height: 34px;
  padding: 8px 16px;
  border-radius: 12px;
  gap: 12px;
  background-color: v-bind(backgroundContainerIntro);
}

.intro {
  color: var(--neutral-text-body);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.iconItem {
  font-size: 24px;
  min-width: 24px;
}

.item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  border-radius: 16px;
  padding: 0px 16px;
  gap: 12px;
  height: 52px;
  border: 1px solid var(--neutral-border-light);
}

.item span {
  color: var(--neutral-text-body);
}

.item_checkbox {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  border-radius: 16px;
  padding: 0px 16px;
  gap: 18px;
  height: 52px;
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
</style>
