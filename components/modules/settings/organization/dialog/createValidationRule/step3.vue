<script setup>
import useOrganizationStore from "@/stores/organization";
import useValidationStore from '@/stores/validations';
import useGlobalStore from '@/stores/global';
const emit = defineEmits(['closeModal', 'nextStep', 'prevStep', 'updateDimensions', 'updateValidationRules']);

const props = defineProps({
  edit: {
    type: Boolean,
  },
  editItem: {
    type: Object,
  },
});

const organizationStore = useOrganizationStore();
const validationStore = useValidationStore();
const globalStore = useGlobalStore();

const arrayMembers = ref([]);
const search = ref('');

// computed
//computada 
const titleMotive = computed(() => {
  const baseTitle = props.edit ? 'Editar Regla' : 'Crear Regla';
  if (validationStore.formCVR.selectCodeReason !== 'higher_amount') {
    return `${baseTitle} - ${validationStore.formCVR.selectNameReason[globalStore.lang] ? validationStore.formCVR.selectNameReason[globalStore.lang] : validationStore.formCVR.selectNameReason}`;
  } else {
    return `${baseTitle} - Monto mayor a - ${validationStore.formCVR.monto.label}`;
  }
});

// functions

const filterMembers = (search) => {
    const searchTerm = search ? search.toLowerCase() : ""; 
    const members = organizationStore.organization.users;

    const selectedEmails = arrayMembers.value
    .map(arrayMembers => arrayMembers.members?.email || "")
    .filter(email => email !== "");

    return members
        .filter(member => 
            !selectedEmails.includes(member.email) && 
            (member.data.legalName.toLowerCase().includes(searchTerm) || member.email.toLowerCase().includes(searchTerm))
        )
        .map(member => ({
            label: member.data.legalName,
            img: member.imgUrl,
            text: member.email,
            member
        }));
};

const cleanSearch = () => {
    search.value = '';
};

const Close = () => {
    emit('updateDimensions', { width: '1000px', height: '720px' });
    emit('closeModal');

}


const addMember = (member) => {
    arrayMembers.value.push({ members: member });
    validationStore.formCVR.membersAffected = arrayMembers.value;
    validationStore.formCVR.membersIdsAffected = arrayMembers.value.map(m => m.members.user._id);
    nextTick(() => {
        cleanSearch();
    });
};

const cleanMember = (index) => {
    arrayMembers.value.splice(index, 1);
    validationStore.formCVR.membersAffected = arrayMembers.value;
    validationStore.formCVR.membersIdsAffected = arrayMembers.value.map(m => m.members.user._id);
};

const Save = async () => {
    const body = {
        reason: validationStore.formCVR.selectIdReason,
        application_area: validationStore.formCVR.applicationArea,
        validation_type: validationStore.formCVR.selectTypeValidation.value,
        validators: validationStore.formCVR.membersIdsValidators,
        affected_members: validationStore.formCVR.membersIdsAffected
    };

    if (validationStore.formCVR.selectCodeReason === 'higher_amount') {
        body.amount = {
            number : parseInt(validationStore.formCVR.monto.number),
            value : validationStore.formCVR.monto.label
        } 
    }

    try {
        globalStore.loading = true;
        if (props.edit) {
            await validationStore.updateValidationRule(props.editItem.id, body);
        } else {
            await validationStore.createValidationRule(body);
        }
        emit('updateValidationRules');
    } catch (error) {
        console.log(error);
    } finally {
        globalStore.loading = false;
    }

    emit('updateDimensions', { width: '1000px', height: '720px' });
    emit("closeModal");
};


const handleEscape = (event) => {
  if (event.key === "Escape") {
    emit("closeModal");
    emit('updateDimensions', { width: '1000px', height: '720px' });
  }
}

onMounted(() => {
    if (validationStore.formCVR.membersAffected.length > 0) {
        arrayMembers.value = validationStore.formCVR.membersAffected;
    } else {
        arrayMembers.value = [];
    }

    if (props.edit && !validationStore.formCVR.hasInitializedEdit.step3) {
        validationStore.formCVR.hasInitializedEdit.step3 = true;
        console.log('editItem', props.editItem.affectedMembers);
        console.log('arrayMembers', arrayMembers.value);
        console.log('validationStore.formCVR.membersAffected', validationStore.formCVR.membersAffected);
        arrayMembers.value = props.editItem.affectedMembers.map(member => ({
        members: {
            data: {
            legalName: member.data.legalName,
            },
            imgUrl: member.imgUrl,
            email: member.email,
            user: {
            _id: member._id
            },
            permissionsProfile: member.permissionsProfile
        }
        }));

        console.log('arrayMembers', arrayMembers.value);
        validationStore.formCVR.membersAffected = arrayMembers.value;
        validationStore.formCVR.membersIdsAffected = props.editItem.affectedMembers.map(member => member._id);
    }

    document.addEventListener("keydown", handleEscape);
})


onUnmounted(() => {
  document.removeEventListener("keydown", handleEscape);
})


</script>

<template>
    <div class="modal">
        <div class="modal__header">
            <span class="truncateText">{{ titleMotive }}</span>
            <u-button-icon type="outlined" icon="close" class="btnIconModify" color="--neutral-text-caption" size="s" @action-btn="Close" />
        </div>

        <div class="modal__content">
            <span>La regla se aplicará a los siguientes miembros de tu organización</span>
            <div class="modal__content__members">
                <!-- <u-select icon="user" placeholder="Selecciona un miembro de tu organización" iconDropdown="selector_down" size="l" />-->
                <u-search 
                    v-model="search" 
                    :avatar="true"
                    :snippet="true" 
                    :options="filterMembers(search)"
                    @selectedOption="addMember($event.member)"
                    icon="user" 
                    placeholder="Selecciona un miembro de tu organización" 
                    size="l" 
                    style="width: 100%;" 
                    @cleanInput="cleanSearch"
                />
        
                <span class="msjMembersRegla">CADA VEZ QUE ESTOS USUARIOS CREEN UNA COMPRA QUE CUMPLA CON LA REGLA SELECCIONADA SE ACTIVARÁ EL PROCESO DE VALIDACIÓN</span> 

                <div class="modal__content__members__selected">
                    <div v-if="arrayMembers.length > 0" v-for="(member, index) in 
                    arrayMembers" :key="index" class="modal__content__selectedMember">
                        <div class="memberInfo" >
                            <u-button-icon type="text" icon="close" color="--neutral-text-disabled" :text-size="40" @action-btn="cleanMember(index)" />
                            <u-avatar :user="{ name: member.members?.data.legalName, src: member.members?.imgUrl }" :size="40" />
                            <div class="memberInfo__text">
                                <span class="memberInfo__text-name truncateText">{{ member.members?.data.legalName }}</span>
                                <span class="memberInfo__text-email truncateText">{{ member.members?.email }}</span>
                            </div>
                        </div>
                        <div class="tag">
                            <span class="truncateText">{{ member.members.permissionsProfile ? member.members.permissionsProfile?.name?.[globalStore.lang] : 'Owner'  }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal__actions">
            <u-button text="Volver" type="outlined" @click="emit('prevStep')" />
            <u-button text="Guardar" @click="Save" :disabled="arrayMembers.length === 0" />
        </div>
    </div>
</template>

<style scoped>
    .modal {
        display: grid;
        grid-template-rows: 40px 523px 36px;
        gap: 24px;
        height: 100%;
        width: 100%;
    }

    .modal__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 40px;
        width: 100%;
    }

  .modal__header span {
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: 0em;
    width: 500px;
    text-align: left;
    color: var(--neutral-text-body);
}   

    .modal__header .btnIconModify {
        border-radius: 50%;
        color: var(--neutral-surface-default);
    }

    .modal__content{
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: 523px;
        width: 100%;
    }

    .modal__content span {
        font-size: 12px;
        font-weight: 600;
        line-height: 16px;
        letter-spacing: 0em;
        text-align: left;
        color: var(--neutral-text-body);
    }

    .modal__content__members {
        display: grid;
        grid-template-rows: 40px 28px 1fr;
        padding: 16px;
        gap: 16px;
        border: 1px solid var(--neutral-border-subtle);
        border-radius: 16px;
        width: 100%;
        height: 499px;
    }


    .modal__content__members .msjMembersRegla {
        font-size: 10px;
        font-weight: 600;
        line-height: 14px;
        letter-spacing: 0.1em;
        text-align: left;
        color: var(--neutral-text-caption);
    }

    .modal__content__members__selected {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        overflow-y: auto;
    }

    .modal__content__selectedMember{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 6px 12px;
        width: 100%;
        height: 52px;
    }

    .modal__content__selectedMember .memberInfo {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
    }

    .modal__content__selectedMember .memberInfo__text {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 200px;
    }

    .modal__content__selectedMember .memberInfo__text-name {
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
        letter-spacing: 0em;
        text-align: left;
        color: var(--neutral-text-body);
    }

    .modal__content__selectedMember .memberInfo__text-email {
        font-size: 14px;
        font-weight: 400;
        line-height: 16px;
        letter-spacing: 0em;
        text-align: left;
        color: var(--neutral-text-caption);
    }

    .modal__content__selectedMember .tag {
    padding: 0 10px;
    background-color: var(--neutral-surface-light);
    display: flex;
    align-items: center;
    justify-content: center;
    justify-self: end;
    height: 28px;
    width: auto;
    max-width: 140px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
    color: var(--neutral-text-caption);
    }

    .modal__actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 25px;
        gap: 16px;
        width: 100%;
        height: 36px;
    }

</style>