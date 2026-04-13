<script setup>
  import { onMounted, ref,onBeforeUnmount } from "vue";
  import { socialNetworks } from "@/utils/constants";

  import { toast } from "vue3-toastify";

  import useUserStore from "@/stores/user";
  const userStore = useUserStore();

  import useGlobalStore from "@/stores/global";
  const globalStore = useGlobalStore();

  const { $bus } = useNuxtApp();

  const user = ref(null);

  const errorInputs = ref({});

  onMounted(async () => {
    $bus.$on("errorForm", (error) => {
      errorInputs.value = error;
    });
    user.value = userStore.profile;
  });

  onBeforeUnmount(() => {
    $bus.$off("errorForm"); 
  });

  // Validar Formulario
  const validForm = () => {
    if (user.value.name.first === "") {
      toast.error("El nombre es obligatorio.", {
        autoClose: 3000,
      });
      $bus.$emit("errorForm", { name: true, op: 0 });
      return false;
    }
    if (user.value.otherAccounts.web !== "") {
      if (!validateSimpleURL(user.value.otherAccounts.web)) {
        toast.error("El nombre del Sitio Web no es Válido.", {
          autoClose: 3000,
        });
        $bus.$emit("errorForm", { web: true, op: 1 });
        return false;
      }
    }
    $bus.$emit("errorForm", {});
    return true;
  };

  // Save
  const save = async () => {
    if (validForm()) {
      globalStore.loading = true;
      await userStore.updateUser(user.value);
      globalStore.loading = false;
    }
  };
</script>

<template>
  <div class="form" v-if="user">
    <div class="form__content">
      <div class="form__col">
        <div
          class="form__content-cell"
          v-for="socialNetwork in socialNetworks.slice(0, 4)"
          :key="socialNetwork.prop"
        >
          <div>
            <span
              :class="`u u-${socialNetwork.icon} ${
                socialNetwork.prop === 'web'
                  ? errorInputs.web
                    ? 'labelError'
                    : ''
                  : ''
              }`"
            ></span>
            <label
              :class="`${
                socialNetwork.prop === 'web'
                  ? errorInputs.web
                    ? 'labelError'
                    : ''
                  : ''
              }`"
              >{{ socialNetwork.label }}</label
            >
          </div>
          <u-input
            v-model="user.otherAccounts[socialNetwork.prop]"
            size="m"
            :placeholder="socialNetwork.placeholder"
            :error="socialNetwork.prop === 'web' ? errorInputs.web : false"
            @input="
              user.otherAccounts[socialNetwork.prop] = user.otherAccounts[
                socialNetwork.prop
              ].replaceAll(' ', '')
            "
          />
        </div>
      </div>
      <div class="form__col">
        <div
          class="form__content-cell"
          v-for="socialNetwork in socialNetworks.slice(4, 8)"
          :key="socialNetwork.prop"
        >
          <div>
            <span :class="`u u-${socialNetwork.icon}`"></span>
            <label>{{ socialNetwork.label }}</label>
          </div>
          <u-input
            v-model="user.otherAccounts[socialNetwork.prop]"
            size="m"
            placeholder="nombre del usuario"
            @input="
              user.otherAccounts[socialNetwork.prop] = user.otherAccounts[
                socialNetwork.prop
              ].replace(' ', '')
            "
          />
        </div>
      </div>
    </div>
    <div class="form__actions">
      <u-button
        class="mainBtnModify"
        text="Guardar"
        size="l"
        @action-btn="save"
      />
    </div>
  </div>
</template>

<style scoped>
  .form {
    max-width: 1000px;
    height: calc(100vh - 98px - 280px - 20px);
    display: grid;
    grid-template-rows: 1fr 40px;
    gap: 16px;
    margin: 0 auto;
  }
  .form__content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    overflow-y: auto;
    padding-right: 2px;
  }
  .form__content::-webkit-scrollbar {
    width: 5px;
    height: 0px;
  }
  .form__content::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background-color: var(--bg-neutral-300);
  }
  .form__content::-webkit-scrollbar-track {
    background-color: var(--bg-neutral-100);
    border-radius: 3px;
  }
  .form__col {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .form__content-cell {
    display: grid;
    grid-template-columns: 130px 1fr;
    align-items: center;
  }
  .form__content-cell div:nth-child(1) {
    display: grid;
    grid-template-columns: 35px 1fr;
  }
  .form__content-cell div:nth-child(1) span:nth-child(1) {
    color: var(--bg-neutral-700);
    font-size: 24px;
    line-height: 24px;
  }
  .form__content-cell label {
    font-family: Nunito;
    font-size: 14px;
    font-weight: 400;
    line-height: 14px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--bg-neutral-700);
    margin-top: 5px;
  }
  .form__actions {
    display: flex;
    justify-content: flex-end;
  }
  .mainBtnModify {
    width: 150px;
  }
  .labelError {
    color: var(--bg-danger-500) !important;
  }

  @media only screen and (max-width: 1000px) {
    .form__content {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }
</style>
