<script setup>
  import { ref, onMounted, defineProps } from "vue";

  import { socialNetworks } from "@/utils/constants";

  const props = defineProps({
    user: {
      type: Object,
      default: () => {},
    },
  });

  onMounted(() => {
    setTimeout(() => {
      const btn = document.getElementById("showModalDescription");
      if (btn) btn.addEventListener("click", showModalDescription);
    }, 100);
  });

  const modalDescription = ref(false);

  const showModalDescription = () => {
    modalDescription.value = true;
  };
</script>

<template>
  <div class="container__info-box">
    <span class="title">Información</span>
    <template v-if="props.user.description">
      <p
        v-html="
          props.user.description
            .slice(0, 200)
            .replace(/\n/g, '<br>')
            .concat(
              props.user.description.length > 200
                ? `<button style='color: var(--bg-primary-500); font-size: 12px; margin-left: 5px; font-family: Nunito;' id='showModalDescription'>Ver más</button>`
                : ''
            )
        "
      ></p>
    </template>
    <p v-else>Sin Descripción</p>
    <span class="title">Redes Sociales</span>
    <ul
      v-if="
        user?.otherAccounts &&
        Object.values(user?.otherAccounts).some((v) => !!v)
      "
    >
      <template v-for="sn in socialNetworks" :key="sn.prop">
        <li v-if="user?.otherAccounts[sn.prop]">
          <a
            :href="
              sn.prop === 'web'
                ? props.user.otherAccounts[sn.prop]
                : sn.link + props.user.otherAccounts[sn.prop]
            "
            target="_blank"
          >
            <span :class="`icon u u-${sn.icon}`"></span>
            <span>{{ props.user.otherAccounts[sn.prop] }}</span>
          </a>
        </li>
      </template>
    </ul>
    <span v-else class="msg">Sin Redes Sociales registradas</span>
  </div>
  <u-dialog
    v-if="props.user.description"
    :showModal="modalDescription"
    @closeModal="modalDescription = false"
    position="center"
    width="445px"
    height="600px"
  >
    <ProfileDialogShowDescription
      :description="props.user.description"
      @closeModal="modalDescription = false"
    />
  </u-dialog>
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
