<script setup>
import { ref, defineExpose } from "vue";
import useUserStore from "@/stores/user";
import useGlobalStore from "@/stores/global";

const emits = defineEmits(["closeModal", "selectRol"]);

// Stores
const userStore = useUserStore();
const globalStore = useGlobalStore();

const loading = ref(false);

const props = defineProps({
  nameRole: {
    type: String,
    default: "",
  },
});

const confirmAction = async () => {
  try {
    loading.value = true;

    const body = {
      name: {
        es: props.nameRole,
        en: props.nameRole,
      },
      department: {
        es: "Otros",
        en: "Otros",
      },
    };

    const { data: respRole } = await userStore.createUserRole(body);

    const fomartDataRol = {
      label: respRole.name?.[globalStore.lang] || respRole.name?.es,
      id: respRole.id,
      isActive: true,
      suggestion: true,
    };

    emits("selectRol", fomartDataRol);
    emits("closeModal");
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
};

defineExpose({ confirmAction });
</script>

<template>
  <div class="card">
    <!-- HEADER -->
    <div class="card__header">
      <div class="card__header-title">
        <span class="body-l-sb">Estás creando un rol personalizado</span>
      </div>
    </div>

    <!-- BODY -->
    <div class="card__body">
      <!-- <p class="card__body-title body-l-sb">
        ¿Deseas crear este rol personalizado para tu cuenta?
      </p>

      <div class="card__body-name">
        <span class="body-l-sb">NOMBRE DEL ROL</span>
        <span class="body-xl-sb">{{ props.nameRole }}</span>
      </div> -->
      <div class="card__body-description">
        <span class="u u-info-circle"></span>
        <p class="body-m-sb">
          Los roles personalizados mantienen el mismo nombre en todos los
          idiomas. Si utilizas más de un idioma, considera usar un nombre neutro
          o descriptivo.
        </p>
      </div>

      <div class="card__body-noAgain">
        <u-checkbox v-model="userStore.mySettings.hidenMsgCreateRol" />
        <span class="body-m-r">No volver a mostrar este mensaje</span>
      </div>
    </div>

    <!-- DIVIDER -->
    <!-- <div class="card__divider" /> -->

    <!-- ACTIONS -->
    <div class="card__actions">
      <u-button
        type="outlined"
        text="Cancelar"
        :disabled="loading"
        @click="$emit('closeModal')"
      />
      <u-button
        text="Crear Rol"
        :disabled="loading"
        :loading="loading"
        @click="confirmAction"
      />
    </div>
  </div>
</template>

<style scoped>
.card {
  width: 35vw;
  max-width: 540px;
  min-width: 540px;
  height: 30vh;
  max-height: 200px;
  min-height: 200px;
  border-radius: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* HEADER */
.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card__header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--neutral-text-body);
}

.card__icon {
  font-size: 1.3rem;
  line-height: 1;
}

/* DIVIDER */
.card__divider {
  height: 1px;
  background: var(--neutral-border-light);
  margin: -4px 0;
}

/* BODY */
.card__body {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 24px;
  line-height: 1.6;
}

.card__body-title {
  margin: 0;
  color: var(--neutral-text-caption);
}

.card__body-name {
  display: flex;
  flex-direction: column;
  text-align: center;
  margin: 0;
  gap: 15px;
  color: var(--neutral-text-body);
}

.card__body-name span:last-child {
  color: var(--primary-text-default);
}

.card__body-name span:first-child {
  color: var(--neutral-text-caption);
}

.card__body-description {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  border-radius: 8px;
  border: 1px solid var(--info-border-default);
  padding: 8px;
  gap: 6px;
  margin: 0;
  color: var(--neutral-text-body);
}

.card__body-description span {
  font-size: 1.6rem;
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--info-border-default);
}

.card__body-description p {
  margin: 0;
  line-height: 1.4;
  color: var(--neutral-text-body);
}

.card__body-noAgain {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-top: 1px solid var(--neutral-border-light);
  height: 36px;
  color: var(--neutral-text-body);
}

.card__info-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

/* ACTIONS */
.card__actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.btnIconModify {
  border-radius: 50%;
}

/* RESPONSIVE */
@media (max-width: 600px) {
  .card {
    padding: 20px;
    border-radius: 16px;
    width: 90vw;
  }

  .card__actions {
    flex-direction: column-reverse;
  }

  .card__actions > * {
    width: 100%;
  }
}
</style>
