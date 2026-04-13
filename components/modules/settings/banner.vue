<script setup>
  import { onMounted } from "vue";

  import defaultUrl from "/img/default-avatar.png";
  const defaultImg = defaultUrl;

  import cover from "/img/cover.jpg";
  const defaultCover = cover;

  import useUserStore from "@/stores/user";
  const userStore = useUserStore();

  import useGlobalStore from "@/stores/global";
  const globalStore = useGlobalStore();

  const user = ref();

  onMounted(() => {
    user.value = userStore.profile;
  });

  const handleFileCoverUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) {
      return;
    }

    if (e.target.files[0]) {
      const file = e.target.files[0];

      let formData = new FormData();
      formData.append("file", file);

      globalStore.loading = true;
      const resp = await userStore.updatedImageUser(formData, "cover");
      if (resp) {
        const reader = new FileReader();
        reader.onload = function (e) {
          user.value.coverUrl = e.target.result;
        };
        reader.readAsDataURL(file);
      }
      globalStore.loading = false;
    }
  };

  const handleFileUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) {
      return;
    }

    if (e.target.files[0]) {
      const file = e.target.files[0];

      let formData = new FormData();
      formData.append("file", file);

      globalStore.loading = true;
      const resp = await userStore.updatedImageUser(formData);
      if (resp) {
        await userStore.getUserByToken();
        const reader = new FileReader();
        reader.onload = function (e) {
          user.value.imgUrl = e.target.result;
        };

        reader.readAsDataURL(file);
      }

      globalStore.loading = false;
    }
  };
</script>

<template>
  <div class="banner" v-if="user">
    <div class="banner__sup">
      <img :src="user?.coverUrl || defaultCover" alt="banner" />
      <input
        type="file"
        name="cover"
        id="cover"
        @change="handleFileCoverUpload($event)"
        accept="image/*"
        style="display: none"
      />
      <label class="btnBanner" for="cover">
        <span class="u u-image"></span><span>Cambiar Imagen</span>
      </label>
    </div>
    <div class="banner__inf">
      <div class="banner__profile">
        <img :src="user?.imgUrl || defaultImg" title="user" />
        <input
          type="file"
          name="img"
          id="img"
          @change="handleFileUpload($event)"
          accept="image/*"
          style="display: none"
        />
        <label class="btnImg" for="img">
          <span class="u u-camera"></span>
        </label>
      </div>
      <div class="banner__snippet">
        <span>
          {{ user?.data?.legalName || "" }}
        </span>
        <span v-if="user?.data?.nickName"> ( {{ user?.data?.nickName }} ) </span>
        <u-verify />
      </div>
    </div>
  </div>
</template>

<style scoped>
  span {
    font-family: Nunito;
  }
  .banner {
    display: grid;
    grid-template-rows: 1fr 100px;
  }
  .banner__sup {
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 20px 20px 0 0;
    background-color: var(--white);
  }
  .banner__sup img {
    object-fit: cover;
    width: 100%;
    border-radius: 24px 24px 0 0;
    position: absolute;
    z-index: 0;
  }
  .banner__inf {
    display: grid;
    grid-template-columns: 164px 1fr;
    padding: 20px;
    box-sizing: border-box;
  }
  .banner__profile {
    position: relative;
  }
  .banner__profile img {
    position: absolute;
    width: 165px;
    height: 165px;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border-radius: 50%;
    top: -105px;
    border: 5px solid var(--white);
    box-shadow: var(--shadow-2);
    transition: 0.3s;
    transform: scale(1);
    z-index: 1;
  }
  .banner__profile::after {
    background-color: var(--bg-primary-500);
    content: "";
    width: 160px;
    height: 160px;
    position: absolute;
    border-radius: 50%;
    top: -103px;
    z-index: 0;
  }
  .btnBanner {
    position: absolute;
    border-radius: 10px;
    background-color: var(--white);
    top: 20px;
    right: 20px;
    transition: 0.3s;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    cursor: pointer;
  }
  .btnBanner:hover {
    box-shadow: var(--shadow-2);
  }
  .btnBanner span {
    color: var(--bg-neutral-500);
  }
  .btnBanner span:nth-child(1) {
    font-size: 22px;
    line-height: 22px;
  }
  .btnBanner span:nth-child(2) {
    font-size: 16px;
    line-height: 16px;
    font-weight: 600;
  }
  .btnBanner:hover span {
    color: var(--bg-neutral-600);
  }
  .btnImg {
    position: absolute;
    border-radius: 50%;
    background-color: var(--bg-primary-500);
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
    bottom: 10px;
    right: 0px;
    z-index: 2;
  }
  .btnImg:hover {
    background-color: var(--bg-primary-400);
    box-shadow: var(--shadow-2);
  }
  .banner__snippet {
    padding-left: 20px;
    display: flex;
    align-items: center;
    padding-bottom: 10px;
    gap: 5px;
  }
  .banner__snippet span:nth-child(1) {
    font-size: 24px;
    font-weight: 700;
    line-height: 36px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-700);
  }
  .banner__snippet span:nth-child(2) {
    font-family: Nunito;
    font-size: 24px;
    font-weight: 600;
    line-height: 36px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-500);
  }
</style>
