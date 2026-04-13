<script setup>
  import useWizardStore from "@/stores/wizard";
  import useGlobalStore from "@/stores/global";

  // Stores
  const wizardStore = useWizardStore();
  const globalStore = useGlobalStore();

  const { t } = useI18n();
  const module = "modules.wizard.steps.welcome";
  const button = "modules.wizard.buttons";
</script>

<template>
  <div class="containerPage__card">
    <div class="logo">
      <u-logo class="img" />
      <u-logo-text class="text" />
    </div>
    <div class="content">
      <img class="welcome" :src="`/img/welcome${globalStore.isDark ? '-dark' : ''}.svg`" alt="Welcome" />
      <h2 class="title headline-m-sb">{{ t(module + ".title") }}</h2>
      <p class="subtitle body-l-sb">{{ t(module + ".text") }}</p>
    </div>
    <div class="actions">
      <u-button
        size="xl"
        :text="t(button + '.welcome')"
        @action-btn="wizardStore.step = 1"
        style="width: 280px"
      ></u-button>
    </div>
  </div>
</template>

<style scoped>
  .containerPage__card {
    width: 500px;
    height: 85vh;
    max-height: 780px;
    min-height: 690px;
    

    padding: 48px 24px;
    box-sizing: border-box;
    border-radius: 24px;
    gap: 48px;
    background-color: var(--neutral-background-default);
    box-shadow: var(--elevation-xl);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: column;
    animation: section 0.8s ease-in;
  }
  @keyframes section {
    0%, 5% {
      opacity: 0;
    } 100% {
      opacity: 1;
    }
  }
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  .logo {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .logo .img {
    height: 28px;
    width: 28px;
  }
  .logo .text {
    height: 24px;
    width: 124px;
  }
  .title {
    color: var(--neutral-text-body);
    text-align: center;
    margin: 10px 0 5px;
  }
  .subtitle {
    color: var(--neutral-text-caption);
    text-align: center;
    padding: 0 40px;
  }
  .actions {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .welcome {
    width: 80%;
  }
</style>
