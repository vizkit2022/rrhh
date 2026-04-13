<template>
  <div class="containerLoagingPage">
    <div class="containerLoagingPage__circle">
      <u-logo class="logo" />
    </div>
  </div>
</template>

<style scoped>
  .containerLoagingPage {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: transparent;
    backdrop-filter: blur(2px);
    z-index: 999999;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);
  }

  .containerLoagingPage__circle {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    animation: pulse 2s infinite;
    display: flex;
    justify-content: center;
    align-items: center;
    transform: scale(0.8);
  }

  .logo {
    width: 80px;
    height: 80px;
    opacity: 0.5;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.8);
      box-shadow: 0 0 0 0 rgb(224, 224, 224, 1);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 60px rgb(224, 224, 224, 0);
    }
    100% {
      transform: scale(0.8);
      box-shadow: 0 0 0 0 rgb(224, 224, 224, 0);
    }
  }
</style>
