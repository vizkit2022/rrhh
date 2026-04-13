<script setup></script>

<template>
    <div class="loadingGrilla">
        <u-loading />
        <span class="main">Preparando tu espacio de trabajo</span>
        <span class="second">Obteniendo líneas...</span>
        <u-logo />
    </div>
</template>

<style scoped>
.loadingGrilla {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 16px;
    position: sticky;
    left: 0;
    width: 100%;
    height: calc(100% - 82px);
}
.loadingGrilla span.main {
    font-size: 18px;
    line-height: 18px;
    color: var(--neutral-text-body);
    font-weight: 600;
}
.loadingGrilla span.second {
    font-size: 14px;
    line-height: 14px;
    color: var(--neutral-text-caption);
    font-weight: 500;
}
</style>