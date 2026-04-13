<script setup>
import useGlobalStore from "@/stores/global";
import useOrganizationStore from "@/stores/organization";
import usePermissionsStore from "@/stores/permissions";
import cover from "/img/cover.jpg";
import defaultUrl from "/img/default-avatar.png";

const defaultCover = cover;
const defaultImg = defaultUrl;

// Variables
const globalStore = useGlobalStore();
const organizationStore = useOrganizationStore();
const permissionsStore = usePermissionsStore();

const pureColor = ref("");

const handleFileCompany = (e) => {
  if (!e.target.files || !e.target.files[0]) {
    return;
  }

  const file = e.target.files[0];
  const formData = new FormData();
  formData.append("file", file);

  if (file.size) {
    const fileSizeKB = file.size / 1024;
    const fileSizeMB = fileSizeKB / 1024;

    if (fileSizeMB >= 5) {
      toast.error("La Imagen es muy pesada, debe ser menos de 5MB.", {
        autoClose: 2000,
      });
    } else {
      const reader = new FileReader();
      reader.onload = function (e) {
        organizationStore.organization.imgUrlTemp = e.target.result;
        organizationStore.organization.formData = formData;
      };
      reader.readAsDataURL(file);
    }
  } else {
    console.warn("File size information unavailable.");
  }
};
const save = async () => {
  if (organizationStore.validForm()) {
    globalStore.loading = true;
    await organizationStore.updateOrganizationFunction();
    const newName = organizationStore.organization.razon_social;
    globalStore.title = newName;
    globalStore.breadcrumb[2].name = newName;
    globalStore.loading = false;
  }
};
</script>

<template>
  <div class="section">
    <div class="sectionSup">
      <div class="banner">
        <img
          :src="
            organizationStore.organization?.imgCoverTemp ||
            organizationStore.organization?.imgCover ||
            defaultCover
          "
          alt="Logo"
        />
      </div>
      <div class="profile">
        <div class="profile__image">
          <img
            :src="
              organizationStore.organization?.imgUrlTemp ||
              organizationStore.organization?.imgUrl ||
              defaultImg
            "
            title="company"
          />
          <input
            v-if="permissionsStore.myPermissions?.settings_account_info"
            type="file"
            name="img"
            id="img"
            @change="handleFileCompany($event)"
            accept="image/*"
            style="display: none"
            :disabled="
              !permissionsStore.myPermissions?.settings_account_info ||
              !permissionsStore.myPermissions?.page_settings
            "
          />
          <label
            class="btnImg"
            for="img"
            v-if="permissionsStore.myPermissions?.settings_account_info"
          >
            <span class="u u-camera"></span>
          </label>
        </div>
        <div class="profile__snippet">
          <div class="profile__snippet_box">
            <span>
              {{ organizationStore.organization.razon_social || "" }}
            </span>

            <u-verify />
          </div>
        </div>
      </div>
    </div>
    <div class="sectionInf">
      <div class="part1" v-if="!organizationStore.organization.default">
        <label>{{ organizationStore.sections[3].inputs[0].label }}</label>
        <u-textarea
          v-model="organizationStore.organization.description"
          :disabled="
            !permissionsStore.myPermissions?.settings_account_info ||
            !permissionsStore.myPermissions?.page_settings
          "
        />
      </div>
      <div class="part2" v-if="!organizationStore.organization.default">
        <div
          class="group"
          v-for="input in organizationStore.sections[3].inputs.slice(1)"
          :key="input.prop"
        >
          <label
            >{{ input.label }}
            <span v-if="input.error">{{ input.msgError }}</span></label
          >
          <u-input
            v-model="organizationStore.organization.otherAccounts[input.prop]"
            :placeholder="input.placeholder"
            :error="input.error"
            @input="
              organizationStore.organization[input.prop] =
                organizationStore.organization[input.prop].replace(' ', '')
            "
            :disabled="
              !permissionsStore.myPermissions?.settings_account_info ||
              !permissionsStore.myPermissions?.page_settings
            "
          />
        </div>
      </div>
      <div class="part3">
        <div class="group" style="grid-template-columns: auto 1fr">
          <label>Color </label>
          <u-input
            v-model="organizationStore.organization.color"
            :placeholder="'Color hexadecimal'"
            :disabled="
              !permissionsStore.myPermissions?.settings_account_info ||
              !permissionsStore.myPermissions?.page_settings
            "
          />
        </div>
        <u-button
          text="Guardar"
          class="mainBtnModify"
          size="l"
          @click="save"
          :disabled="
            !permissionsStore.myPermissions?.settings_account_info ||
            !permissionsStore.myPermissions?.page_settings
          "
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
span,
label {
  font-family: Nunito;
}
.section {
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  gap: 36px;
}
.sectionSup {
  background-color: var(--neutral-background-default);
  height: 240px;
  box-shadow: var(--shadow-3);
  border-radius: 30px 30px 20px 20px;
}
.sectionInf {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 244px 1fr;
  grid-template-areas: "description social" "action action";
  gap: 24px;
}
.banner {
  position: relative !important;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 20px 20px 0 0;
  background-color: var(--neutral-background-default);
}
.banner img {
  object-fit: cover;
  width: 100%;
  height: 100px;
  border-radius: 24px 24px 0 0;
}
.part1 {
  height: 244px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  grid-area: description;
}
.part2 {
  display: flex;
  flex-direction: column;
  gap: 16px;
  grid-area: social;
}
.part3 {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  grid-area: action;
  padding-top: 20px;
}
.part1 label {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-align: left;
  color: var(--neutral-text-body);
}
.group {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 24px;
  height: 36px;
  align-items: center;
}
.group label {
  color: var(--neutral-text-caption);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-align: left;
}
.group label span {
  color: var(--danger-text-default);
}
.btnImg {
  position: absolute;
  border-radius: 50%;
  background-color: var(--primary-text-default);
  cursor: pointer;
  height: 40px;
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.3s;
  color: var(--white);
  font-size: 22px;
  line-height: 22px;
  top: 50px;
  right: 15px;
  z-index: 2;
}
.btnImg:hover {
  background-color: var(--primary-text-default);
  box-shadow: var(--shadow-2);
}
.profile__snippet {
  display: grid;
  gap: 5px;
  padding-left: 20px;
}

.profile__snippet_box {
  display: flex;
  align-items: center;
  gap: 5px;
}

.profile__snippet span {
  font-size: 24px;
  font-weight: 700;
  line-height: 36px;
  letter-spacing: 0em;
  text-align: left;
  color: var(--neutral-text-body);
}
.profile__image {
  position: relative;
}
.profile__image img {
  position: absolute;
  width: 140px;
  height: 140px;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 50%;
  top: -50px;
  border: 5px solid var(--white);
  box-shadow: var(--shadow-2);
  transition: 0.3s;
  transform: scale(1);
  z-index: 1;
}
.profile__image::after {
  background-color: var(--primary-text-default);
  content: "";
  width: 135px;
  height: 135px;
  position: absolute;
  border-radius: 50%;
  top: -48px;
  left: 3px;
  z-index: 0;
}
.profile {
  display: grid;
  grid-template-columns: 164px 1fr;
  padding: 20px;
  box-sizing: border-box;
}
.mainBtnModify {
  width: 150px;
}
</style>
