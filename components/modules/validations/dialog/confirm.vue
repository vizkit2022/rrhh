<script setup>
import useValidationStore from "@/stores/validations";
import useGlobalStore from "@/stores/global";

const validationStore = useValidationStore();
const globalStore = useGlobalStore();

const props = defineProps({
    data: {
        type: Object,
        default: () => ({})
    }
})

const emit = defineEmits(['closeModal']);

//constants 
const msjValue = ref(false);

const confirm = async () => {
    globalStore.loading = true;
    try {
        validationStore.viewModalStatusValidacions.showConfirm = msjValue.value;
        await validationStore.updateValidatorUserStatus(props.data._id, { approved : true });
        await validationStore.getValidations();
        emit('closeModal');
    } catch (error) {
        console.log(error);
    }   finally { 
        globalStore.loading = false;    
    }
};

const cancel = () => {
    validationStore.viewModalStatusValidacions.showConfirm = msjValue.value;
    emit('closeModal');
}



</script>

<template>
    <div class="modal__container">
        
        <div class="header">
                <div class="img">
                    <span class="u u-warning"></span>
                </div>
                <p>¿Estás seguro de que deseas aprobar la orden de compra?</p>
                <div class="avise">
                    <span class="u u-danger-outlined icon"></span>
                    <span class="text">Al aprobar, estás confirmando que la información de la orden de compra es correcta y permites que esta esté disponible para continuar con su debido proceso.</span>
                </div>
        </div>

        <div class="checkboxHidenMessage">
            <div class="checkbox">
                <u-checkbox v-model="msjValue" />
            </div>
            <span>No volver a mostrar este mensaje</span>
        </div>

        <div class="actions">
            <u-button text="Cancelar" type="outlined" @action-btn="cancel" />
            <u-button text="Aprobar" @action-btn="confirm"  />
        </div>
    </div>

</template>

<style scoped>
    .modal__container {
        display: grid;
        grid-template-rows: 208px 36px 36px;
        justify-content: center;
        gap: 24px;
        width: 100%;
        height: 100%;
    }

    .header {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 470px;
        height: 208px;
        gap: 16px;
    }

    .img {
        display: flex;
        justify-content: center;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background-color: var(--neutral-background-light);
    }

    .avise {
        display: flex;
        flex-direction: row;
        gap: 8px;
        width: 422px;
        height: 36px;
    }

    .avise .icon {
        font-size: 16px;
        line-height: 16px;
        color: var(--danger-text-default);
    }
    .avise .text {
        font-size: 14px;
        font-weight: 600;
        line-height: 18px;
        text-align: left;
        color: var(--neutral-text-caption);
    }

    .checkboxHidenMessage {
        display: flex;
        flex-direction: row;
        gap: 8px;
        align-items: center;
        width: 470px;
        height: 36px;
        padding-left: 16px;        
    }

    .checkboxHidenMessage .checkbox {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 30px;
        height: 30px;
    }

    .checkboxHidenMessage span {
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        text-align: left;
        color: var(--neutral-text-body);
    }

    .actions {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        gap: 16px;
        width: 470px;
        height: 36px;
    }

</style>