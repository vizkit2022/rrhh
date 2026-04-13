<script setup>
  import { ref, onMounted, defineProps } from "vue";

  import useUserStore from "@/stores/user";
  const userStore = useUserStore();
  import useGlobalStore from "@/stores/global";
  const globalStore = useGlobalStore();

  import defaultUrl from "/img/default-avatar.png";
  import cover from "/img/cover.jpg";
  const defaultImg = defaultUrl;
  const defaultCover = cover;

  const props = defineProps({
    myProfile: {
      type: Boolean,
      default: false,
    },
  });

  const user = ref({
    imgUrl: defaultImg,
    coverUrl: defaultCover,
  });

  onMounted(() => {
    user.value = userStore.profile;
  });
</script>

<template>
  <div class="container__snippet">
    <div class="container__snippet-part1">
      <img :src="user?.coverUrl || defaultImg" alt="banner" />
      <!-- <button class="btnBanner">
          <span class="u u-more"></span>
        </button> -->
    </div>
    <div class="container__snippet-part2">
      <div class="container__snippet-part2-1">
        <div class="avatarProfile">
          <img :src="user?.imgUrl || defaultImg" title="user" />
        </div>
        <div class="points" style="opacity: 0">
          <button class="btnPoint" v-for="n in 5" :key="n">
            <span class="u u-star"></span>
          </button>
        </div>
        <a class="link" style="opacity: 0">Ver más</a>
      </div>
      <div class="container__snippet-part2-2">
        <div class="container__snippet-part2-2-sup">
          <div class="sup-1">
            <div class="sup-1__name">
              <h2>
                {{ user?.name?.first || "" }} {{ user?.name?.last || "" }}
              </h2>
              <span v-if="user?.name?.nickName"
                >( {{ user?.name?.nickName }} )</span
              >
              <u-verify />
            </div>
            <span class="sup-1__nick" style="display: none">@tati_espi</span>
          </div>
          <div class="sup-2">
            <template v-if="user?.emails?.length && !props.myProfile">
              <a :href="`mailto:${user.emails[0].email}`" target="_blank">
                <u-button
                  text="Contactar"
                  size="m"
                  icon="new-project"
                  color="--bg-neutral-500"
                  colorHover="--bg-neutral-400"
                  colorActive="--bg-neutral-600"
                />
              </a>
            </template>
            <u-button
              v-if="!props.myProfile"
              text="Agregar"
              size="m"
              icon="user-new"
            />
          </div>
        </div>
        <div class="container__snippet-part2-2-inf">
          <div class="inf__1">
            <template v-if="user?.roles">
              <span>Roles</span>
              <template v-if="user.roles.length > 0">
                <div class="tagsBox">
                  <u-tags
                    v-for="user in user.roles"
                    :key="user._id"
                    :text="user.name[globalStore.lang]"
                    size="s"
                    color="--bg-primary-500"
                    background="--bg-primary-100"
                    :delete="false"
                  />
                </div>
              </template>
              <span v-else class="msg">Sin Roles</span>
            </template>
          </div>
          <div class="inf__1">
            <span>Idiomas</span>
            <div v-if="user?.languages?.length" class="tagsBox">
              <u-tags
                v-for="(language, l) in user.languages"
                :key="l"
                :text="language.spanish"
                size="s"
                :delete="false"
              />
            </div>
            <div v-else>
              <span class="msg"> Sin Idiomas registrados. </span>
            </div>
          </div>
          <div class="inf__2">
            <span style="opacity: 0">Conexiones</span>
            <div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .container__snippet {
    display: grid;
    grid-template-rows: 1fr 1fr;
    overflow: hidden;
    background-color: var(--white);
    border-radius: 24px;
    box-shadow: var(--shadow-1);
  }
  .container__snippet-part1 {
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .container__snippet-part1 img {
    object-fit: cover;
    width: 100%;
    border-radius: 24px 24px 0 0;
    position: absolute;
    z-index: 0;
  }
  .btnBanner {
    position: absolute;
    border-radius: 10px;
    background-color: var(--white);
    height: 32px;
    width: 32px;
    top: 10px;
    right: 10px;
    transition: 0.3s;
  }
  .btnBanner:hover {
    box-shadow: var(--shadow-2);
  }
  .btnBanner span {
    color: var(--bg-neutral-500);
    font-size: 20px;
  }
  .btnBanner:hover span {
    color: var(--bg-neutral-600);
  }
  .container__snippet-part2 {
    position: relative;
    display: grid;
    grid-template-columns: 164px 1fr;
    padding: 20px;
    box-sizing: border-box;
    gap: 20px;
  }
  .container__snippet-part2-1 {
    display: grid;
    grid-template-rows: 65px 30px auto;
    gap: 15px;
  }
  .container__snippet-part2-2 {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }
  .container__snippet-part2-2-sup {
    display: flex;
    justify-content: space-between;
  }
  .sup-1__nick {
    font-family: Nunito;
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-500);
  }
  .sup-1 {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sup-1__name {
    display: flex;
    align-items: flex-end;
    gap: 10px;
  }
  .sup-1__name h2,
  .sup-1__name span {
    font-family: Nunito;
    font-size: 24px;
    font-weight: 600;
    line-height: 24px;
    letter-spacing: 0em;
    text-align: left;
  }
  .sup-1__name h2 {
    color: var(--bg-neutral-700);
  }
  .sup-1__name span {
    color: var(--bg-neutral-500);
  }
  .sup-2 {
    display: flex;
    gap: 10px;
  }
  .link {
    color: var(--bg-primary-600);
    font-size: 12px;
    text-align: center;
  }
  .container__snippet-part2-1 .points {
    display: flex;
    justify-content: center;
    gap: 2px;
  }
  .container__snippet-part2-2-inf {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }
  .inf__1,
  .inf__2 {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .inf__1:nth-child(1) {
    padding-right: 20px;
  }
  .inf__1:nth-child(2) {
    border-left: 1px solid var(--bg-neutral-300);
    border-right: 1px solid var(--bg-neutral-300);
    padding: 0 20px;
  }
  .inf__2 {
    padding-left: 20px;
  }
  .tagsBox {
    display: flex;
    gap: 10px;
    flex-wrap: nowrap;
    overflow-x: scroll;
    height: 24px;
    max-width: calc((100vw - 60px - 40px - 60px - 164px - 80px) / 3);
  }
  .tagsBox::-webkit-scrollbar {
    width: 0px;
    height: 0px;
  }
  .inf__1 span,
  .inf__2 span {
    font-family: Nunito;
    font-size: 12px;
    font-weight: 600;
    line-height: 12px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-700);
  }
  .btnPoint {
    height: 30px;
    width: 20px;
  }
  .btnPoint span {
    color: var(--bg-warning-500);
    font-size: 20px;
    line-height: 20px;
  }
  .avatarProfile {
    position: relative;
  }
  .avatarProfile img {
    position: absolute;
    width: 165px;
    height: 165px;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border-radius: 50%;
    top: -100px;
    border: 5px solid var(--white);
    box-shadow: var(--shadow-2);
  }
  .avatarProfile::before {
    background-color: var(--bg-primary-500);
    content: "";
    width: 160px;
    height: 160px;
    position: absolute;
    border-radius: 50%;
    top: -98px;
    z-index: 0;
  }
</style>
