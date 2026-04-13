<script setup>
import useBankingTransactionsStore from "@/stores/bankingTransactions";
import { transformedDate } from "@/utils/helpers";

//STORES
const bankingTransactionsStore = useBankingTransactionsStore();


const emit = defineEmits(['update:conciliado'])

const props = defineProps({

    data: {
        type: Object,
        default : () => ({})
    },
    isBankingTransaction: {
        type: Boolean,
        default: false
    },
    showHeader: {
        type: Boolean,
        default: true
    },
    isTagPerfectMatchHeader: {
        type: Boolean,
        default: false
    },
    isTagPerfectMatchBody: {
        type: Boolean,
        default: false
    },
    showButtonDesconciliar: {
        type: Boolean,
        default: false
    },
    showCheckBox: {
        type: Boolean,
        default: false
    },

})

const check = ref(false);

const getIconColorTotal = (total) => {
    if(total && String(total).includes('-')) return "u u-trend-down red";
    return "u u-trend-up green";
}


watch(() => props.data, (newValue) => {
    check.value = newValue?.select;
}, { immediate: true })


</script>

<template>
    <div class="container">
        <div>
            <!-- Contenedor de coincidencia perfecta -->
            <div class="tagPerfectMatch" v-if="props.isTagPerfectMatchHeader">
                <u-tags text="Coincidencia Perfecta" size="xs" :delete="false" 
                color="--primary-text-darker" background="--primary-surface-light" />
            </div>

            <div class="containerHeader" v-if="props.showHeader">
                <span>PAGO N° {{ props.data?.lines?.at(0)?.outcomeId?.correlative }}</span>
            </div> 

            <div class="containerBody">
                <!-- Contenido actual -->

                <div class="bodyIzq">   

                    <div class="containerTransactions">
                        <span class="titleTransactions">TRANSFERENCIA - {{ props.data?.transactionNumber }}</span>
                        <div class="containerAccount">
                            <span>PAGADO CON</span>
                            <u-avatar :user="{ name: 'Banco de Chile', src: props.data?.account?.logo }" :size="24" />
                            <span>{{ props.data?.account?.name.toUpperCase() }}</span>
                        </div>
                    </div>

                    <div class="containerInfoTransaction">
                        <div class="left">
                            <div v-if="props.showCheckBox" style="width: 36px; height: 36px; display: flex; justify-content: center; align-items: center;">
                                <u-checkbox
                                v-model="check"
                                @update:model-value="(value) => {
                                    emit('update:conciliado', {value,  data})
                                }"
                                />

                            </div>
                            <div class="info" v-if="!props?.isBankingTransaction">
                                <u-avatar :user="{ name: props?.data?.supplier?.data?.legalName , src: props?.data?.supplier?.imgUrl }" :size="36" />
                                <div class="infoText">
                                    <span class="title">{{ props.data?.reference }}</span>
                                    <span class="subtitle">{{ props.data?.supplier?.data?.legalName }}</span>
                                </div>
                            </div>
                            <div class="info_bank" v-if="props?.isBankingTransaction">
                                <span class="body-m-sb title">{{ props.data?.reference }}</span>
                                <div class="infoText">
                                    <u-avatar :user="{ name: 'Banco de Chile', src: props.data?.recipient?.logo }" :size="24" />
                                    <span class="subtitle">{{ props.data?.destinationAccount ? props.data?.destinationAccount?.legalName : '-' }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="right">
                            <div class="flujo">
                                <!-- <span class="u" :class="getIconColorTotal(props.data?.numbers?.total?.number)"></span> -->
                                <span class="u u-trend-down red"></span>
                                <span class="title"> $ {{ props.data?.numbers?.total?.value }}</span>
                            </div>
                            <span class="date">{{ transformedDate(props.data?.paymentDate ) }}</span>
                        </div>
                    </div>
                </div>

                <div class="bodyDer" v-if="props.showButtonDesconciliar" >
                    <u-button size="m" color="--danger-border-default" 
                    color-text="--danger-text-default" colorHover="--danger-border-darker" colorActive="--danger-border-darker" text="Desconciliar" icon="u-icon-close" type="outlined"
                    />
                </div>

            </div>

        </div>
    </div>

</template>

<style scoped>

    .tagPerfectMatch {
        position: absolute;
        top: -13px;
        right: 0px;
        z-index: 10;
    }


    .container {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 116px;
    }

    .containerHeader {
        display: flex;
        height: 24px;
        width: v-bind("props.showButtonDesconciliar ? '942px' : '704px'");  
        padding: 5px 24px;
        background-color: var(--neutral-surface-softer);
        border: 1px solid var(--neutral-border-light);
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        border-bottom: v-bind("!props.showHeader ? '1px solid var(--neutral-border-light)' : 'none'");
    }

    .containerHeader span {
    font-size: 10px;
    font-weight: 600;
    line-height: 14px;
    letter-spacing: 0.1em;
    text-align: left;
    color: var(--secondary-text-default);
}


    .containerBody {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        width: v-bind("props.showButtonDesconciliar ? '942px' : '704px'");
        height: auto;
        border: 1px solid var(--neutral-border-light);
        border-top: v-bind("!props.showHeader ? '1px solid var(--neutral-border-light)' : 'none'");
        border-top-left-radius: v-bind("!props.showHeader ? '8px' : '0px'");
        border-top-right-radius:  v-bind("!props.showHeader ? '8px' : '0px'");
        border-top-right-radius: v-bind("!props.showHeader ? '8px' : '0px'");
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
    }

    .containerBody .bodyIzq {
        position: relative;
        display: grid;
        grid-template-rows: auto 1fr;
        width: v-bind("props.showButtonDesconciliar ? '746px' : '804px'");
        height: 98px;
        padding: 0px 24px;
        border: v-bind("props.showButtonDesconciliar ? '0' : '1px solid var(--neutral-border-light)'");
        border-top-left-radius: v-bind("!props.showHeader ? '8px' : '0px'");
        border-top-right-radius:  v-bind("!props.showHeader ? '8px' : '0px'");
        border-top-right-radius: v-bind("!props.showHeader ? '8px' : '0px'");
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
    }

    .containerBody .containerTransactions {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        height: 28px;
        margin-top: 4px;
        border-bottom: 1px solid var(--neutral-border-light);
        gap: 8px;
    }

    .containerBody .containerTransactions .titleTransactions {
        font-size: 10px;
        font-weight: 400;
        line-height: 14px;
        letter-spacing: 0.1em;
        color: var(--neutral-text-caption);
    }

    .containerBody .containerTransactions .containerAccount {
        display: flex;
        flex-direction: row;
        height: 24px;
        gap: 8px;
        width: auto;
        align-items: center;
    }

     .containerAccount span {
        font-size: 10px;
        font-weight: 400;
        line-height: 14px;
        letter-spacing: 0.1em;
        color: var(--neutral-text-caption);
    }

    .containerBody .containerInfoTransaction {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin: 12px 0px;
        height: 42px;
        width: 100%;
    }

    .containerBody .containerInfoTransaction .left {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
    }

    /* info payment */

    .containerBody .containerInfoTransaction .left .info {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
    }

    .containerBody .containerInfoTransaction .left .info .infoText {
        display: flex;
        flex-direction: column;
    }

    .containerBody .containerInfoTransaction .left .info .infoText .title {
        color: var(--neutral-text-body);
    }

    .containerBody .containerInfoTransaction .left .info .infoText .subtitle {
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        color: var(--neutral-text-caption);
    }

    /* info bank */

    .containerBody .containerInfoTransaction .left .info_bank {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .containerBody .containerInfoTransaction .left .info_bank .infoText {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
    }

    .containerBody .containerInfoTransaction .left .info_bank .infoText .title {
        font-size: 14px;
        font-weight: 600;
        line-height: 18px;
        color: var(--neutral-text-body);
    }

    .containerBody .containerInfoTransaction .left .info_bank .infoText .subtitle {
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        color: var(--neutral-text-caption);
    }

    .containerBody .containerInfoTransaction .right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        height: 32px;
        width: auto;
        justify-content: center;
        gap: 2px;
    }

    .containerBody .containerInfoTransaction .right .flujo {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 4px;
    }
    .containerBody .containerInfoTransaction .right .flujo .title {
        font-size: 14px;
        font-weight: 600;
        line-height: 18px;
        color: var(--neutral-text-body);
    }
    .containerBody .containerInfoTransaction .right .flujo .u-trend-up {
        font-size: 20px;
        color: var(--success-text-default);
    }
    .containerBody .containerInfoTransaction .right .flujo .u-trend-down {
        font-size: 20px;
        color: var(--danger-text-default);
    }
    .containerBody .containerInfoTransaction .right .date {
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        color: var(--neutral-text-caption);
        text-align: right;
    }

    .bodyDer {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin: 0px 24px;
    }


</style>
