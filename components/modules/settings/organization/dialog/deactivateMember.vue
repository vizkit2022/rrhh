<script setup>
  import { ref, defineEmits } from "vue";
  import useGlobalStore from "@/stores/global";
  import useOrganizationStore from "@/stores/organization";

  //   Variables
  const organizationStore = useOrganizationStore();
  const globalStore = useGlobalStore();
  const emit = defineEmits(["closeModal", "lockModal"]);
  const saving = ref(false);
  const users = ref(
    JSON.parse(
      JSON.stringify(
        organizationStore.organization.users.filter((u) => u.selected)
      )
    )
  );
  const save = async (state) => {
    const body = {
      status: state ? "active" : "inactive",
      users: [],
    };

    body.users = users.value
      .filter((u) => u.selected)
      .map((u) => {
        return u.id ? { id: u.id._id } : { email: u.email };
      });

    globalStore.loading = true;
    emit("lockModal", true);
    await organizationStore.changeStatusUser(body);
    await organizationStore.getOrganizationById();
    emit("lockModal", false);
    emit("closeModal");
    globalStore.loading = false;
  };
</script>

<template>
  <div class="modal">
    <div class="modal__header">
      <span>Cambiar Estado a los Miembros</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--bg-neutral-200"
        colorHover="--bg-neutral-400"
        colorActive="--bg-neutral-600"
        size="m"
        :disabled="saving"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="modal__content">
      <span class="modal__content-text">
        ¿Estas seguro que quieres cambiar de estado a estos
        {{ users.filter((u) => u.selected).length }} usuarios?<br />
        Podrás revertir este cambio cuando desees.
      </span>
      <div class="modal__content-list">
        <div
          class="modal__content-item"
          v-for="member in users"
          :key="member._id"
          :style="`opacity: ${
            member.selected ? 1 : 0.5
          }; background-color: var(${
            member.selected ? '--white' : '--bg-neutral-100'
          })`"
        >
          <button @click="member.selected = !member.selected">
            <span class="u u-cancel"></span>
          </button>
          <u-avatar
            :size="32"
            :user="{
              name: member?.id?.name?.first ?? 'Invitado',
              src: member?.id?.imgUrl ?? null,
            }"
          />
          <div class="text">
            <span
              >{{ member?.id?.name?.first ?? "Invitado" }}
              {{ member?.id?.name?.last ?? "" }}</span
            >
            <span>{{ member?.id?.emails[0]?.email ?? member.email }}</span>
          </div>
          <div class="tag">
            <span>{{ member.permissions }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="modal__actions">
      <u-button
        text="Activar"
        class="mainBtnModify"
        size="l"
        :disabled="saving || !users.some((u) => u.selected)"
        @action-btn="save(true)"
        color="--bg-primary-500"
        colorHover="--bg-primary-600"
        colorActive="--bg-primary-700"
      />
      <u-button
        text="Desactivar"
        class="mainBtnModify"
        size="l"
        :disabled="saving || !users.some((u) => u.selected)"
        @action-btn="save(false)"
        color="--bg-danger-500"
        colorHover="--bg-danger-600"
        colorActive="--bg-danger-700"
      />
    </div>
  </div>
</template>

<style scoped>
  span {
    font-family: Nunito;
  }
  .modal {
    height: 100%;
    display: grid;
    grid-template-rows: 40px 1fr 40px;
    gap: 32px;
  }
  .modal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    width: 100%;
  }
  .modal__header span {
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-700);
  }
  .modal__content {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 40px;
  }
  .modal__content-text {
    font-size: 14px;
    font-weight: 600;
    line-height: 18px;
    text-align: center;
    color: var(--bg-neutral-500);
  }
  .modal__content-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: scroll;
    height: 185px;
    padding-right: 10px;
  }
  .modal__content-list::-webkit-scrollbar {
    width: 8px;
    height: 0px;
  }

  .modal__content-list::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: var(--bg-neutral-500);
  }
  .modal__content-item {
    display: grid;
    grid-template-columns: 26px 32px 1fr auto;
    gap: 20px;
    align-items: center;
    transition: 0.3s;
    padding: 10px 20px;
    border-radius: 10px;
  }
  .modal__content-item button span {
    color: var(--bg-neutral-400);
    font-size: 26px;
    transition: 0.3s;
  }
  .modal__content-item button:hover span {
    color: var(--bg-neutral-500);
  }
  .modal__content-item .text {
    display: grid;
    grid-template-rows: 1fr 1fr;
  }
  .modal__content-item .text span:nth-child(1) {
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    text-align: left;
    color: var(--bg-neutral-700);
  }
  .modal__content-item .text span:nth-child(2) {
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
    text-align: left;
    color: var(--bg-neutral-500);
  }
  .modal__content-item .tag {
    padding: 0 10px;
    background-color: var(--bg-neutral-300);
    display: flex;
    align-items: center;
    height: 20px;
    border-radius: 20px;
  }
  .modal__content-item .tag span {
    font-size: 12px;
    font-weight: 600;
    line-height: 12px;
    text-align: left;
    color: var(--bg-neutral-500);
  }
  .modal__actions {
    display: flex;
    justify-content: flex-end;
    gap: 20px;
  }

  /* CUSTOM COMPONENTS - MODIFY */
  .btnIconModify {
    border-radius: 50%;
    color: var(--bg-neutral-500);
  }
  .mainBtnModify {
    width: 135px;
  }
</style>
