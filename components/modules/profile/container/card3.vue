<script setup>
  import { defineProps } from "vue";
  import useGlobalStore from "@/stores/global";
  const globalStore = useGlobalStore();

  import { transformedDate } from "@/utils/helpers";

  import useUserStore from "@/stores/user";
  const userStore = useUserStore();

  const props = defineProps({
    user: {
      type: Object,
      default: () => {},
    },
  });
</script>

<template>
  <div class="container__info-box">
    <span class="title">Últimos proyectos</span>
    <template v-if="userStore.relatedIncomesByUser?.length">
      <div class="items scroll">
        <div
          class="itemProject"
          v-for="project in userStore.relatedIncomesByUser"
          :key="project"
        >
          <div>
            <span class="date">{{ transformedDate(project.createdAt) }}</span>
            <div>
              <img
                src="https://www.expreso.info/files/2021-07/Vina%20del%20Mar.jpg"
                alt="city"
              />
            </div>
          </div>
          <div class="content">
            <span>{{ project.name }}</span>
            <span>Company</span>
            <template v-if="props.user.roles.length > 0">
              <div class="tagsBox">
                <u-tags
                  v-for="role in props.user.roles"
                  :key="role._id"
                  :text="role.name[globalStore.lang]"
                  size="s"
                  color="--bg-primary-500"
                  background="--bg-primary-100"
                  :delete="false"
                />
              </div>
            </template>
            <span v-else class="msg">Sin Roles</span>
          </div>
        </div>
      </div>
    </template>
    <div v-else>
      <span class="msg">Sin proyectos</span>
    </div>
  </div>
</template>

<style scoped>
  .container__info-box {
    background-color: var(--white);
    border-radius: 24px;
    box-shadow: var(--shadow-1);
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .container__info-box .title {
    font-family: Nunito;
    font-size: 14px;
    font-weight: 600;
    line-height: 14px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-700);
  }
  .container__info-box p {
    font-family: Nunito;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-500);
    /* text-align: justify; */
  }
  .container__info-box ul {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .container__info-box ul li a {
    display: grid;
    grid-template-columns: 20px 1fr;
    align-items: center;
    gap: 10px;
    transition: 0.3s;
  }
  .container__info-box ul li a:hover span {
    color: var(--bg-primary-500) !important;
  }
  .container__info-box ul li a span:nth-child(1) {
    font-size: 20px;
    line-height: 20px;
    color: var(--bg-neutral-500);
  }
  .container__info-box ul li a span:nth-child(2) {
    font-family: Nunito;
    font-size: 14px;
    font-weight: 600;
    line-height: 14px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-500);
    margin-top: 2px;
  }

  .msg {
    color: var(--bg-neutral-400) !important;
    font-weight: 400 !important;
    font-size: 12px !important;
    line-height: 12px !important;
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: 390px;
    overflow-y: auto;
    padding-right: 10px;
  }
  .item,
  .itemProject {
    display: flex;
    gap: 20px;
    transition: 0.3s;
  }
  .item img,
  .itemProject img {
    height: 40px;
    width: 80px;
    transform: scale(1);
    transition: 0.3s;
  }
  .item div:nth-child(1),
  .itemProject div:nth-child(1) div {
    display: grid;
    place-content: center;
    overflow: hidden;
    height: 40px;
    width: 80px;
    border-radius: 8px;
  }
  .itemProject div:nth-child(1) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
  }
  .item:hover img,
  .itemProject:hover img {
    transform: scale(1.2);
  }
  .item:hover span,
  .itemProject:hover span {
    color: var(--bg-neutral-600);
  }
  .item div:nth-child(2),
  .itemProject .content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .item div span {
    font-family: Nunito;
    font-weight: 600;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-500);
  }
  .item div span:nth-child(1),
  .itemProject .content span:nth-child(1) {
    font-size: 14px;
    text-transform: capitalize;
  }
  .item div span:nth-child(2),
  .itemProject .content span:nth-child(2) {
    font-size: 12px;
  }
  .itemProject .content span:nth-child(2) {
    color: var(--bg-neutral-500);
  }
  .itemProject .date {
    font-family: Nunito;
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.1em;
    text-align: left;
    color: var(--bg-neutral-400);
    transition: 0.3s;
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
</style>
