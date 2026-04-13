<script setup>
  import { ref, onMounted } from "vue";

  import useUserStore from "@/stores/user";
  const userStore = useUserStore();

  // Define variables
  const { name } = useRoute();
  const page = ref(name);
  const idUser = ref(null);

  onMounted(() => {
    idUser.value = userStore.userSession._id ?? null;
  });

  const options = [
    { icon: "inicio", text: "Inicio", path: "/home", disabled: true },
    { icon: "network", text: "Network", path: "/network", disabled: true },
    { icon: "ventas", text: "Proyectos", path: "/incomes", disabled: false },
    { icon: "compras", text: "Compras", path: "/outcomes", disabled: false },
    {
      icon: "contabilidad",
      text: "Contabilidad",
      path: "/accounting",
      disabled: true,
    },
    {
      icon: "icono-pagos",
      text: "Cobros y Pagos",
      path: "/payments",
      disabled: true,
    },
    { icon: "usuarios", text: "Contactos", path: "/contacts", disabled: false },
    { icon: "reportes", text: "Catalogo", path: "/catalog", disabled: true },
    { icon: "ajustes", text: "Ajustes", path: "/settings", disabled: false },
    {
      icon: "permisos",
      text: "Matriz de Permisos",
      path: "/permissions",
      disabled: true,
    },
  ];
</script>

<template>
  <div>
    <div class="containerVarMobile">
      <div class="containerBtn">
        <!-- <NuxtLink to="/home" class="containerBtn_logo" @click="page = ''"> -->
        <NuxtLink
          to="/incomes"
          class="containerBtn_logo"
          @click="page = 'incomes'"
        >
          <u-logo class="logo" />
        </NuxtLink>
      </div>
      <ul class="scroll">
        <li v-for="(op, i) in options" :key="i">
          <NuxtLink
            @click="op.disabled ? '' : (page = op.path.replace('/', ''))"
            :to="
              op.disabled
                ? ''
                : op.text === 'Ajustes'
                ? `${op.path}/${idUser}`
                : op.path
            "
            class="containerBtn_item"
            :class="`${page === op.path.replace('/', '') ? 'selected' : ''} ${
              op.disabled ? 'disabled' : ''
            }`"
          >
            <span :class="[`icon`, `u-${op.icon}`]"></span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
  .containerVarMobile {
    width: 100vw;
    height: 60px;
    display: grid;
    grid-template-columns: 60px 1fr;
    box-shadow: var(--shadow-2);
    position: absolute;
    left: -20px;
    bottom: -20px;
  }
  .containerVarMobile ul {
    display: flex;
    justify-content: space-between;
  }
  .containerVarMobile ul li,
  .containerBtn_item,
  .containerBtn,
  .containerBtn_logo {
    min-width: 60px;
    width: 100%;
    height: 60px;
  }
  .containerBtn_item,
  .containerBtn_logo {
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.3s;
  }
  .containerBtn_item span {
    font-size: 24px;
    line-height: 24px;
    transition: 0.3s;
    color: var(--bg-neutral-700);
  }
  .containerBtn_item.disabled {
    cursor: not-allowed;
  }
  .containerBtn_item.disabled span {
    color: var(--bg-neutral-400);
  }
  .containerBtn_item:not(.disabled):hover {
    background-color: var(--bg-primary-500);
    transition: 0.3s;
  }
  .containerBtn_item:not(.disabled):hover span {
    color: var(--white);
    transition: 0.2s;
  }
  .scroll::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background-color: transparent;
  }
  .scroll::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
  .logo {
    width: 30px;
  }
  .selected {
    background-color: var(--bg-primary-500);
  }
  .selected span {
    color: var(--white);
  }
</style>
