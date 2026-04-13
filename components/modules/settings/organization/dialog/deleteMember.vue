<script setup>
  import { computed, defineEmits } from "vue";
  import useOrganizationStore from "@/stores/organization";
  import useGlobalStore from "@/stores/global";

  const organizationStore = useOrganizationStore();
  const globalStore = useGlobalStore();
  const saving = ref(false);
  const emit = defineEmits(["closeModal", "lockModal"]);

  const { t } = useI18n();
  const module = "modules.organizations.settings.members.modal.deleteMember";

  const deleteMember = async () => {
    const body = {
      users: [],
    };
    body.users = users.value.map((u) => {
      return u.user ? { id: u.user._id } : { email: u.email };
    });
    globalStore.loading = true;
    emit("lockModal", true);
    await organizationStore.deleteUsers(body);
    await organizationStore.getOrganizationById();
    emit("lockModal", false);
    emit("closeModal");
    globalStore.loading = false;
  };

  const users = computed(() =>
    organizationStore.organization.users.filter((u) => u.selected)
  );

</script>

<template>
    <div class="modal">
    <div class="modal__header">
      <span>{{ t(module + ".title") }}</span>
      <u-button-icon
        icon="close"
        class="btnIconModify"
        color="--neutral-surface-light"
        size="m"
        :disabled="saving"
        @action-btn="emit('closeModal')"
      />
    </div>
    <div class="modal__content">
      <span class="modal__content-text">
        {{ t(module + ".questionText", { numberUsers : users.filter((u) => u.selected).length.toString() }) }}<br />
      </span>
      <div class="modal__content-list">
        <div
          class="modal__content-item"
          v-for="member in users"
          :key="member._id"
        >
          <button @click="member.selected = !member.selected">
            <span class="u u-cancel"></span>
          </button>
          <u-avatar
            :size="32"
            :user="{
              name: member?.data?.name?.first ?? 'Invitado',
              src: member?.imgUrl ?? null,
            }"
          />
          <div class="text">
            <span
              >{{ member?.data?.legalName ?? "Invitado" }}</span
            >
            <span>{{ member?.email ?? "Invitado@unabase" }}</span>
          </div>
          <div class="tag">
            <span>{{ member.permissions }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="modal__actions">
      <u-button
        :text="t(module + '.buttonDelete')"
        class="mainBtnModify"
        size="l"
        @action-btn="deleteMember"
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
    color: var(--neutral-text-body);
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
    color: var(--neutral-text-body);
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
    background-color: var(--neutral-surface-light);
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
    color: var(--neutral-text-caption);
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