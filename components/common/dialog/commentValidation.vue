<script setup>
import useValidationStore from "@/stores/validations";
import useGlobalStore from "@/stores/global";


import svgCircleExcluyente from '@/components/common/components/svgCircleExcluyente.vue';
import svgPlusIncluyente from '@/components/common/components/svgPlusIncluyente.vue';
import svgArrowJerarquia from '@/components/common/components/svgArrowJerarquia.vue';
  import { useI18n } from "vue-i18n";

//store
const validationStore = useValidationStore();
const globalStore = useGlobalStore();

// translations
const { t } = useI18n();

const module = "modules.outcomes.pages.oc.modals.commentValidation";

//emit
const emit = defineEmits(["closeModal"]);

//const
const arraysRulesValidations = [
    {
        reason: { code: "exceeds_amount_to_spend" },
        ruleData: {validation_type: "exclusive"},
        validators: [
            {
                user: {
                    data: {
                        legalName: "Alejandro"
                    },
                    imgUrl: ""
                }
            },
            {
                user: {
                    data: {
                        legalName: "Pedro Rodriguez"
                    },
                    imgUrl: ""
                }
            },
             {
                user: {
                    data: {
                        legalName: "Maria Jose"
                    },
                    imgUrl: ""
                }
            },
            {
                user: {
                    data: {
                        legalName: "Juan Cerati"
                    },
                    imgUrl: ""
                }
            },
             {
                user: {
                    data: {
                        legalName: "Charly Garcia"
                    },
                    imgUrl: ""
                }
            },
            {
                user: {
                    data: {
                        legalName: "Alejandro"
                    },
                    imgUrl: ""
                }
            },
             {
                user: {
                    data: {
                        legalName: "Federico Valverde"
                    },
                    imgUrl: ""
                }
            },
            {
                user: {
                    data: {
                        legalName: "Cristobal"
                    },
                    imgUrl: ""
                }
            }
        ]
    },
    {
        reason: { code: "higher_amount" },
        ruleData: {validation_type: "simple", amount: {value: "$1.000.000"}},
        validators: [
            {
                user: {
                    data: {
                        legalName: "Alejandro Ramos"
                    },
                    imgUrl: ""
                }
            },
        ]
    },
    {
        reason: { code: "issued_by" },
        ruleData: {validation_type: "inclusive"},
        emitor: "María González",
        validators: [
            {
                user: {
                    data: {
                        legalName: "Alejandro Ramos"
                    },
                    imgUrl: ""
                }
            },
            {
                user: {
                    data: {
                        legalName: "Alejandro Ramos"
                    },
                    imgUrl: ""
                }
            }
        ]
    },
     {
        reason: { code: "issued_by" },
        ruleData: {validation_type: "hierarchical"},
        emitor: "María González",
        validators: [
            {
                user: {
                    data: {
                        legalName: "Alejandro Ramos"
                    },
                    imgUrl: ""
                }
            },
            {
                user: {
                    data: {
                        legalName: "Alejandro Ramos"
                    },
                    imgUrl: ""
                }
            }
        ]
    },
]
const data = validationStore.dataModalComment;
const comment = ref('');


const componentValidation = {
    exceeds_amount_to_spend: {
        title: t(`${module}.motive.exceeds_amount_to_spend`),
        icon: "u u-trend-up",
        iconColor: "var(--danger-text-default)",
        bgColor: "var(--danger-surface-shadow-8a)"
    },
    higher_amount: {
        title: t(`${module}.motive.higher_amount`),
        icon: "u u-pay",
        iconColor: "var(--secondary-text-default)",
        bgColor: "var(--secondary-surface-shadow-8a)"
    },
    issued_by: {
        title: t(`${module}.motive.issued_by`),
        icon: "u u-user",
        iconColor: "var(--info-text-default)",
        bgColor: "var(--info-surface-shadow-8a)"
    }
}

const textTypeValidation = {
    exclusive: t(`${module}.typeValidation.exclusive`),
    inclusive: t(`${module}.typeValidation.inclusive`),
    simple: t(`${module}.typeValidation.simple`),
    hierarchical: t(`${module}.typeValidation.hierarchical`)
}

const separatorMap = {
  exclusive : svgCircleExcluyente,
  inclusive : svgPlusIncluyente,
  hierarchical: svgArrowJerarquia,
  simple : ''
};

//computed

const isCommentEmpty = computed(() => {
    return comment.value.trim().length === 0
})


//functions

const skipComment = async () => {
    try {
        globalStore.loading = true;
        const body = {
            validations: data?.validations?.map(v => v._id),
            observation: ''
        }
        await validationStore.sendCommentValidation(body);
    } catch (error) {
        console.error(error);
    } finally {
        globalStore.loading = false;
        emit("closeModal");
    }
}

const createComment = async () => {
    try {
        globalStore.loading = true;
        const body = {
            validations: data?.validations?.map(v => v._id),
            observation: comment.value
        }
        await validationStore.sendCommentValidation(body);
    } catch (error) {
        console.error(error);
    } finally {
        globalStore.loading = false;
        emit("closeModal");
    }
}

//ciclos

</script>

<template>
    <div class="validation-page">
        <!-- header -->
        <div class="page-header">
            <span><span class="u u-warning-outlined"></span> {{ t(module + '.title') }}</span>
            <!-- <p>Tu compra {{ data?.outcome?.type }} N° {{ data?.outcome?.idNumber }} requiere validación antes de ser procesada</p> -->
             <p v-text="t(module + '.subtitle', { typeOutcome: data?.outcome?.type, idOutcome: data?.outcome?.idNumber  })"> </p>
        </div>

        <!-- content validations -->
            <div class="validation-rules-section">
                <span v-text="t(module + '.titleRulesValidations')"></span>
                
                <div class="validation-rules-list">

                    <div class="validation-rule-item" v-for="(rules, index) in data?.validations" :key="index" >
                        <!-- validations (aqui va el componente) -->                
                        <div class="rule-content">
                            <span>
                                <span :style="{ color: componentValidation[rules.reason?.code]?.iconColor }" :class="componentValidation[rules.reason?.code]?.icon"></span>{{ componentValidation[rules.reason?.code]?.title }}<span v-if="rules.reason?.code === 'higher_amount'">{{ rules.ruleData?.amount?.value }}</span><span v-if="rules.reason?.code === 'issued_by'">{{ data?.outcome?.creator }}</span> 
                            </span>

                            <div class="validators-container" :style="{ backgroundColor: componentValidation[rules.reason?.code]?.bgColor }">

                                <span class="validation-type-label">{{ textTypeValidation[rules.ruleData?.validation_type] }}</span>
                                
                                <!--Tipos de validaciones dentro del contenedor-->
                                <div class="validators-grid">
                                <div class="validator-item" v-for="(validator, index) in rules.validators" :key="index">
                                    <u-avatar :user="{ src: validator.user?.imgUrl, name: validator.user?.data?.legalName }" :size="24" />
                                    <span>{{ validator.user?.data?.legalName }} </span>
                                    <component v-if="index < rules.validators.length -1" :is="separatorMap[rules.ruleData?.validation_type]" />
                                </div>
                                </div>


                            </div>

                        </div>
                        
                    </div>
                </div>

            </div>

        <!-- text area -->
        <div class="comment-section">
            <span v-text="t(module + '.comment.title')"></span>
            <u-textarea v-model="comment" :placeholder="t(module + '.comment.placeholder')" />
        </div>

        <!-- actions -->
        <div class="actions-section">
            <u-button @click="skipComment" :text="t(module + '.buttons.skipComment')" type="outlined" />
            <u-button @click="createComment" :disabled="isCommentEmpty" :text="t(module + '.buttons.createComment')" icon="u u-message" />
        </div>

    </div>
</template>

<style scoped>

.validation-page {
    display: grid;
    width: 100%;
    height: 100%;
    grid-template-rows: 50px auto 248px 36px;
    gap : 24px;
}

.page-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.page-header span {
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0em;
    text-align: left;
    color: var(--neutral-text-body);
}

.page-header p {
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    letter-spacing: 0em;
    font-style: regular;
    text-align: left;
    color: var(--neutral-text-caption);
}

.validation-rules-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.validation-rules-section span {
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0em;
    font-style: semi-bold;
    text-align: left;
    color: var(--neutral-text-body);
}

.validation-rules-list{
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: auto;
    max-height: 338px;
    padding: 0px 5px;
}

.validation-rules-list::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

.validation-rules-list::-webkit-scrollbar-thumb {
    border-radius: 5px;
    background-color: var(--neutral-border-default);
  }

.validation-rules-list::-webkit-scrollbar-track {
    background-color: var(--neutral-border-darker);
    border-radius: 4px;
  }

.validation-rule-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    height: 100%;
}

.rule-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid var(--neutral-border-subtle);
    border-radius: 16px;
    height: auto;
    min-height: 98px;
    max-height: 200px;
    width: 100%;
    padding: 8px;
}

.rule-content span {
    display: flex;
    font-size: 14px;
    font-weight: 600;
    line-height: 18px;
    letter-spacing: 0em;
    font-style: semi-bold;
    color: var(--neutral-text-body);
    gap: 8px;
}

.validators-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: auto;
    min-height: 50px;
    max-height: 100px;
    gap: 8px;
    border-radius: 12px;
    padding: 4px 12px;
}

.validators-container .validation-type-label {
    font-size: 10px;
    font-weight: 400;
    line-height: 14px;
    letter-spacing: 0.1em;
    color: var(--neutral-text-caption);
}

.validators-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, max-content));
  gap: 8px;
  overflow: auto;
  max-height: 46px;
}

.validators-grid::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

.validators-grid::-webkit-scrollbar-thumb {
    border-radius: 5px;
    background-color: var(--neutral-border-default);
  }

.validators-grid::-webkit-scrollbar-track {
    background-color: var(--neutral-border-darker);
    border-radius: 4px;
  }

.validator-item {
    width: auto; 
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.validator-item span {
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    font-style: semi-bold;
    line-height: 18px;
    color: var(--neutral-text-body);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
    max-width: 100%;
}

/* El componente separador mantiene su tamaño natural */
.validator-item > *:not(span) {
    flex-shrink: 0; /* Evita que el componente se comprima */
}

/* textarea */

.comment-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.comment-section span {
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0em;
    font-style: semi-bold;
    color: var(--neutral-text-body);
}

.actions-section {
    display: flex;
    justify-self: end;
    gap: 8px;
}

</style>
