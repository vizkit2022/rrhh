<script setup>
  import { ref } from "vue";

  import useWizardStore from "@/stores/wizard";
  const wizardStore = useWizardStore();

  // Variables
  const company = ref({
    name: "",
    options: [
      {
        label: "Falabella",
        img: "https://brandemia.org/contenido/subidas/2021/08/11-falabella-com-1200x670.jpg",
        id: 3098345435324434,
      },
      {
        label: "Adidas",
        img: "https://static.vecteezy.com/system/resources/previews/010/994/474/non_2x/adidas-symbol-logo-white-clothes-design-icon-abstract-football-illustration-with-red-background-free-vector.jpg",
        id: 3434654874453466,
      },
      {
        label: "Apple",
        img: "https://1000logos.net/wp-content/uploads/2016/10/apple-emblem.jpg",
        id: 3434565686786789,
      },
    ],
    img: null,
    id: null,
  });

  // Acciones
  const fullData = (data) => {
    company.value.img = data.img;
    company.value.id = data.id;
  };
  const nextStep = () => {
    wizardStore.data.member.company = company.value.name;
    wizardStore.data.member.idCompany = company.value.id;
    wizardStore.step = 2;
    wizardStore.oldStep = 6;
  };
  const backStep = () => {
    wizardStore.data.member.company = "";
    wizardStore.data.member.idCompany = null;
    company.value.name = "";
    company.value.id = "";
    company.value.img = null;
    wizardStore.step = 1;
    wizardStore.oldStep = null;
  };
</script>

<template>
  <div class="containerPage">
    <div class="containerPage__card">
      <div class="sup">
        <div class="logo">
          <img src="/Unabase.svg" alt="Isotipo" /> &nbsp;
          <img src="/logo.svg" alt="logo" />
        </div>
        <div class="content">
          <h2 class="title">¿A qué organización perteneces?</h2>
          <p class="subtitle">Selecciona a qué organización perteneces</p>
          <div class="company">
            <img v-if="company.img" :src="company.img" alt="Logo company" />
            <span v-else class="u u-building"></span>
          </div>
          <div class="groupInput">
            <label>Nombre de la Organización</label>
            <u-select
              v-model="company.name"
              :options="company.options"
              :full-data="true"
              @full-data="fullData"
            />
          </div>
        </div>
      </div>
      <div class="actions">
        <u-button
          size="xl"
          text="Volver"
          type="text"
          @action-btn="backStep"
        ></u-button>
        <u-button
          size="xl"
          text="Siguiente"
          @action-btn="nextStep"
          style="width: 200px"
        ></u-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  span,
  label,
  p,
  h2,
  button {
    font-family: Nunito;
  }
  .containerPage__card {
    width: 500px;
    max-height: 650px;
    height: 80vh;
    padding: 60px 40px;
    box-sizing: border-box;
    border-radius: 24px;
    gap: 10px;
    background-color: var(--white);
    box-shadow: var(--shadow-1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: column;
  }
  .sup {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 20px;
  }
  .logo {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
  }
  .logo img:nth-child(1) {
    height: 32px;
  }
  .logo img:nth-child(2) {
    height: 28px;
  }
  .title {
    font-size: 28px;
    font-weight: 600;
    line-height: 42px;
    text-align: left;
    color: var(--bg-neutral-700);
  }
  .subtitle {
    font-size: 14px;
    font-weight: 600;
    line-height: 18px;
    text-align: left;
    color: var(--bg-neutral-500);
  }
  .company {
    width: 120px;
    height: 120px;
    border-radius: 24px;
    background-color: var(--bg-primary-100);
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
  .company span {
    font-size: 60px;
    line-height: 60px;
    color: var(--bg-primary-500);
  }
  .company img {
    height: 120px;
    width: auto;
  }
  .groupInput {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .groupInput label {
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    text-align: left;
    color: var(--bg-neutral-700);
  }
  .actions {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
</style>
