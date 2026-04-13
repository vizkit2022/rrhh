<script setup>
import { ref, computed, defineProps, watch } from 'vue';
import useOrganizationStore from "@/stores/organization";
import useValidationStore from '@/stores/validations';
import useGlobalStore from "@/stores/global";
import svgCircleExcluyente from './svgCircleExcluyente.vue';
import svgPlusIncluyente from './svgPlusIncluyente.vue';
import svgArrowJerarquia from './svgArrowJerarquia.vue';

const organizationStore = useOrganizationStore();
const globalStore = useGlobalStore();
const validationStore = useValidationStore();

const props = defineProps({
    optionSelectedValidator: {
        type: String,
        default: '',
    }
});

const emit = defineEmits(["updateValidators"]);

const validators = ref([{ search: "", members: null }, { search: "", members: null }]);
const directSearch = ref({ search: "", members: null });

const imgSelector = {
    exclusive: svgCircleExcluyente,
    inclusive: svgPlusIncluyente,
    hierarchical: svgArrowJerarquia,
};

const imgSelected = computed(() => {
    const option = props.optionSelectedValidator ? props.optionSelectedValidator : "simple";
    return imgSelector[option] || "";
});

const filterMembers = (search) => {
    const searchTerm = search ? search.toLowerCase() : ""; 
    const members = organizationStore.organization.users;

    const selectedEmails = validators.value
    .map(validator => validator.members?.email || "")
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
            id : member.user._id,
            member
        }));
};

const cleanSearchValidator = (index) => {
    validators.value[index] = { search: "", members: null };
};

const cleanSearchDirect = () => {
    directSearch.value = { search: "", members: null };
};

const removeValidator = (index) => {
    validators.value.splice(index, 1);
    validationStore.formCVR.membersValidators = validators.value;
    validationStore.formCVR.membersIdsValidators = validators.value.map(m => m.members?.user?._id);
};

const addValidator = () => {
    validators.value.push({ search: "", members: null });
};

const saveSelected = (index, selectedMember) => {
    validators.value[index].members = selectedMember.member;
    validators.value[index].search = "";
    console.log('validadores', validators.value);
};

const saveSelectedDirect = (selectedMember) => {
    directSearch.value.members = selectedMember.member;
    directSearch.value.search = "";
};

watch(validators, (newVal) => {
    emit("updateValidators", newVal);
}, { deep: true });

watch(directSearch, (newVal) => {
    emit("updateValidators", [newVal]);
}, { deep: true });


onMounted(() => {
    console.log('filtrado', validators.value);
    if(validationStore.formCVR.selectTypeValidation.value === 'simple') {
        directSearch.value = validationStore.formCVR.membersValidators[0] ? validationStore.formCVR.membersValidators[0] : directSearch.value; 
    } else {
        validators.value = validationStore.formCVR.membersValidators.length > 0 ? validationStore.formCVR.membersValidators : validators.value;
    }
});

</script>

<template>
    <div class="container">
        <div v-if="optionSelectedValidator !== 'simple'" v-for="(validator, index) in validators" :key="index" class="validatorGroup">
            
            <div class="contentInput" v-if="!validator.members">
                <u-search 
                    v-model="validator.search" 
                    :avatar="true"
                    :snippet="true" 
                    :options="filterMembers(validator.search)"  
                    icon="user" 
                    placeholder="Selecciona un miembro de tu organización" 
                    size="l" 
                    @cleanInput="cleanSearchValidator(index)"
                    @selectedOption="saveSelected(index, $event)"
                    style="width: 100%;" 
                />
                <u-button-icon v-if="index >= 2" icon="close" type="text" color="--neutral-text-caption" @action-btn="removeValidator(index)" size="s" />
            </div>

            <div v-else class="selectedMember">
                <img :src="validator.members.imgUrl" alt="Avatar" class="memberAvatar" />
                <div class="memberInfo">
                    <p class="memberName truncateText">{{ validator.members.data.legalName }}</p>
                    <p class="memberEmail truncateText">{{ validator.members.email }}</p>
                </div>
                <div class="tag">
                    <span class="truncateText"> {{ validator.members.permissionsProfile?.name?.[globalStore.lang]  ? validator.members.permissionsProfile.name[globalStore.lang] : 'Owner' }}</span>
                </div>

                <u-button-icon icon="close" style="margin: 0 auto;" type="text" color="--neutral-text-caption" @action-btn="cleanSearchValidator(index)" size="s" />
            </div>

            <component v-if="index !== validators.length - 1" :is="imgSelected" color="var(--neutral-text-caption)" class="separator" :class="{ rotated: props.optionSelectedValidator === 'hierarchical'}" />

            <u-button 
                v-if="index === validators.length - 1" 
                color="--neutral-text-caption" 
                text="Agregar Validador" 
                icon="user-new" 
                type="text" 
                size="xl" 
                @click="addValidator" 
            />
        </div>

        <div v-else>
            <div class="contentInput" v-if="!directSearch.members">
                <u-search 
                    v-model="directSearch.search" 
                    :avatar="true"
                    :snippet="true" 
                    :options="filterMembers(directSearch.search)"
                    @selectedOption="saveSelectedDirect($event)"
                    icon="user" 
                    placeholder="Selecciona un miembro de tu organización" 
                    size="l" 
                    style="width: 100%;" 
                    @cleanInput="cleanSearchDirect"
                />
            </div>

            <div v-else class="selectedMember">
                <img :src="directSearch.members.imgUrl" alt="Avatar" class="memberAvatar" />
                <div class="memberInfo">
                    <p class="memberName truncateText">{{ directSearch.members.data.legalName }}</p>
                    <p class="memberEmail truncateText">{{ directSearch.members.email }}</p>
                </div>
                <div class="tag">
                    <span class="truncateText"> {{ directSearch.members.permissionsProfile?.name?.[globalStore.lang] ? directSearch.members.permissionsProfile.name[globalStore.lang] : 'Owner' }}</span>
                </div>
                <u-button-icon icon="close" type="text" style="margin: 0 auto;" color="--neutral-text-caption" @action-btn="cleanSearchDirect" size="s" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 0px 8px;
    overflow-y: auto;
    gap: 16px;
}

.container::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

.container::-webkit-scrollbar-thumb {
    background-color: var(--neutral-border-subtle);
    border-radius: 5px;
}

.validatorGroup {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.contentInput {
    display: flex;
    width: 100%;
    height: 64px;
    border: 1px solid var(--neutral-border-light);
    border-radius: 8px; 
    align-items: center;
    padding: 12px;
    gap: 8px;
}

.selectedMember {
    display: grid;
    grid-template-columns: 40px 200px auto 40px;
    align-items: center;
    width: 100%;
    height: 64px;
    padding: 12px;
    border: 1px solid var(--neutral-border-light);
    border-radius: 8px;
    background-color: var(--neutral-background);
    gap: 12px;
}

.memberAvatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.memberInfo {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 200px;
}

.memberName {
    font-size: 16px;
    font-weight: 600;
    line-height: 20px;
    color: var(--neutral-text-body);
}

.memberEmail {
    font-size: 14px;
    font-weight: 400;
    line-height: 18px;
    color: var(--neutral-text-caption);
}

.tag {
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

.separator {
    align-self: flex-start;
    margin-left: 24px;
    width: 12px;
    height: 12px;
    color: var(--neutral-text-body);
}   

.rotated {
  transform: rotate(90deg);
}


</style>
