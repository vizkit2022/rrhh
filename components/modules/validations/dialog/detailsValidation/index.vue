<script setup>
import {formatNormalDate} from "@/utils/helpers";

    const props = defineProps({
        data: {
            type: Object,
            required: true,
            default: () => ({})
        }
    })

    const emit = defineEmits(['closeModal'])

    const statusMap = {
        pending : {
            text : 'Pendiente',
            color : '--neutral-text-caption',
            background : '--neutral-surface-light',
        },
        approved : {
            text : 'Aprobada',
            color : '--success-text-darker',
            background : '--success-surface-light',
        },
        rejected : {
            text : 'Rechazada',
            color : '--danger-text-darker',
            background : '--danger-surface-light',
        }
    }

    const typeValidation = {
        exclusive : 'Excluyente',
        inclusive : 'Incluyente',
        hierarchical : 'Jerarquía',
        simple : 'Directa'
    }
    

  const tabs = computed(() => [
            { label: "Detalle", tab: 0 },
            { label: "Validaciones", tab: 1},
            { label: "Comentarios", tab: 2, disabled: true },
        ]);
  const activeTab = ref(0);

</script>

<template>
    <div class="modal__container">
        <div class="header">
            <div class="header__title">
                 <span>Descripción de la solicitud</span>
                <u-tags :text="statusMap[data?.status].text" size="s" :color="statusMap[data?.status].color" :background="statusMap[data?.status].background" :delete="false" />
            </div>
            <u-button-icon
                type="outlined"
                icon="close"
                class="btnIconModify"
                color="--neutral-text-caption"
                size="s"
                @click="emit('closeModal')"
                style="border-radius: 50%;"
            />
        </div>

        <div class="content">
            <div class="content__description">
                <div class="content__description-item">
                    <span class="label">Solicitante</span>
                    <u-avatar :user="{name: data?.userRequester.name, src: data?.userRequester.avatar}" :size="24" />
                    <span class="name">{{ data?.userRequester.name }}</span>
                </div>

                <div class="content__description-item">
                    <span class="label">Fecha</span>
                    <span class="date">{{ formatNormalDate(data?.date) }}</span>
                </div>

                <div class="content__description-item">
                    <span class="label">Origen</span>
                    <span class="origin">
                        <span class="textMovement">{{ data?.project?.text1 }}</span>
                        <p>-</p>
                        <span class="textProject">{{ data?.project?.text2 }}</span>
                    </span>
                </div>

                <div class="content__description-item">
                    <span class="label">Motivo</span>
                    <div class="reason">
                        <span class="title">{{ data?.reason }}</span>
                        <span class="u u-info-circle icon"></span>
                    </div>
                </div>

                <div class="content__description-item">
                    <span class="label">Modo de Validación</span>
                    <div class="reason">
                        <span class="title">{{ typeValidation[data?.validationRule?.type] }}</span>
                    </div>
                </div>

            </div>

            <div class="content__tabs">
                <u-tabs v-model="activeTab" :tabs="tabs" />
            </div>

            <!-- <ValidationsDialogDetailsValidationContentDetails v-if="activeTab === 0" :data="data.fullData?.outcome" :fullData="data.fullData" /> -->

            <ValidationsDialogDetailsValidationContentDetailsNew v-if="activeTab === 0" :data="data" />

            <ValidationsDialogDetailsValidationContentValidations v-if="activeTab === 1" :data="data" />

        </div>  

    </div>
</template>

<style scoped>  

    .modal__container {
        display: grid;
        grid-template-rows : 40px 1fr;
        gap: 24px;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header__title {
        display: flex;
        flex-direction: row;
        gap: 10px;
        align-items: center;
    }

    .content {
        display: grid;
        grid-template-rows: 188px 32px 1fr;
        gap: 48px;
    }

    .content__description {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .content__description-item {
        display: flex;
        height: 28px;
        flex-direction: row;
        gap: 12px;
        align-items: center;
    }

    .content__description-item .label {
        width: 140px;
        height: 18px;
        font-size: 14px;
        font-weight: 600;
        color: var(--neutral-text-caption);
    }

    .content__description-item .name {
        font-size: 14px;
        line-height: 18px;
        font-weight: 400;
        color: var(--neutral-text-body);
    }

    .content__description-item .date {
        width: 140px;
        height: 18px;
        font-size: 14px;
        line-height: 18px;
        font-weight: 400;
        color: var(--neutral-text-body);
    }

    .content__description-item .origin {
        display: flex;
        flex-direction: row;
        gap: 4px;
        font-size: 14px;
        line-height: 18px;
        font-weight: 600;
        color: var(--neutral-text-body);
    }

    .content__description-item .reason {
        display: flex;
        align-items: center;
        flex-direction: row;
        gap: 8px;
    }

    .content__description-item .title {
        font-size: 14px;
        line-height: 18px;
        font-weight: 400;
        color: var(--neutral-text-body);
    }

    .content__description-item .icon {
        font-size: 20px;
        color: var(--info-text-default);
    }

    .content__tabs {
        height: 32px;   
    }

    


</style>