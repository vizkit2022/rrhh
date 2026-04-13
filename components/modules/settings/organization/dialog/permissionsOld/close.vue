<script setup>
const props = defineProps({
    user: {
        type: Object,
    },
});

const emit = defineEmits(["closeModal"]);

const handleEscape = (event) => {
    if (event.key === "Escape") {
        emit("closeModal");
    }
}

onMounted(() => {
    document.addEventListener("keyup", handleEscape);
});

onUnmounted(() => {
    document.removeEventListener("keyup", handleEscape);
});

</script>

<template>
        <div class="modal__header">
            <span class="titleName">{{ user?.data?.name?.first + " " + user?.data?.name?.last }}</span>
            <u-button-icon type="outlined" icon="close" class="btnIconModify" color="--neutral-text-caption" size="s"
                @action-btn="emit('closeModal')" />
        </div>
</template>

<style scoped>
    .modal__header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    width: 100%;
    }

    .btnIconModify {
    border-radius: 50%;
    color: var(--neutral-surface-default);
    }
</style>
