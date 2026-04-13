    <script setup>
    import useUserStore from "@/stores/user";

    import svgCircleExcluyente from '~/components/common/components/svgCircleExcluyente.vue';
    import svgPlusIncluyente from '~/components/common/components/svgPlusIncluyente.vue';
    import svgArrowJerarquia from '~/components/common/components/svgArrowJerarquia.vue';

    // STORES
    const userStore = useUserStore();

    // PROPS
    const props = defineProps({
        avatars: {
            type: Object,
            required: false, // cambiar a true cuando se necesite
        },
        type: {
            type: String,
            required: false, // cambiar a true cuando se necesite
            validator: value => ["exclusive", "inclusive", "hierarchical", "simple"].includes(value)
        }
    })

    //CONSTANTES

    // Mapa para los estados de los avatares
    const statusMap = {
    Pendiente: {text: 'Pendiente', code: 'pending', border: "statusPendiente", color: "colorPendiente", icon: "", statusColor: '--neutral-text-caption', statusBackground: '--neutral-surface-light' },
    Aprobado: { text: 'Aprobado', code: 'approved', border: "statusAprobado", color: "colorCicleAprobado", icon: "u u-check", statusColor: '--success-text-darker', statusBackground: '--success-surface-light' },
    Rechazado: {text: 'Rechazado', code: 'rejected', border: "statusRechazado", color: "colorCicleRechazado", icon: "u u-close", statusColor: '--danger-text-darker', statusBackground: '--danger-surface-light' }
    };

    const getStatus = (avatar) => {
        // status del la validación del avatar
        let status = avatar?.status;
        // status de la validación del validator
        // (puede ser 'pending', 'approved' o 'rejected')
        let statusValidator = avatar?.statusValidation;
        let statusBolean;

        if (status === true) {
            statusBolean = 'Aprobado';
        } else if (status === null) {
            statusBolean = 'Pendiente';
        } else if (status === false) {
            statusBolean = 'Rechazado';
        }

        return statusMap[statusBolean];
    };

    // Mapa de separadores basado en el tipo (todo en minúscula)
    const separatorMap = {
    exclusive : svgCircleExcluyente,
    inclusive : svgPlusIncluyente,
    hierarchical: svgArrowJerarquia,
    simple : ''
    };

    const showSeparator = index => {
        return index < props.avatars.length - 1 || (props.avatars.length === 1 && props.type === 'simple');
    }



    </script>

    <template>


        <div v-if="type === 'simple'" class="container__validations-item">

            <div class="content__validations-item">

                <div class="user">
                    <div class="containerAvatar">
                        <u-avatar :user="{ name: avatars[0].name, src: avatars[0].imgUrl }" :size="40" :class="getStatus(avatars[0]).border" />
                        <span class="statusContainer" :class="getStatus(avatars[0]).color"><p v-if="getStatus(avatars[0]).code === 'pending'">
                            ...
                        </p></span>
                    </div>      
                    <span class="name">{{ avatars[0].name }}</span>
                </div>

                <!-- <div class="accions" v-if="avatars[0].id === userStore.userSession._id">

                    <span class="u u-check icon-green"></span>
                    <span class="u u-close icon-red"></span>

                    <div>
                        <span class="u u-message"></span>
                    </div>

                </div> -->

                <div class="status">
                    <u-tags  :text="getStatus(avatars[0]).text" size="s" :color="getStatus(avatars[0]).statusColor" :background="getStatus(avatars[0]).statusBackground" :delete="false" />
                </div>
                
            </div>

        </div>
        

        <div v-for="(avatar, index) in avatars" :key="index" v-else class="container__validations-item">

            <div class="content__validations-item">

                <div class="user">
                    <div class="containerAvatar">
                        <u-avatar :user="{ name: avatar.name, src: avatar.imgUrl }" :size="40" :class="getStatus(avatar).border" />
                        <span class="statusContainer" :class="[getStatus(avatar).color, getStatus(avatar).icon]">
                            <p v-if="getStatus(avatar).code === 'pending'">
                            ...
                        </p>
                        </span>
                    </div>      
                    <span>{{ avatar.name }}</span>
                </div>

                <!-- <div class="accions" v-show="true">
                <span v-show="avatar.id === userStore.userSession._id" class="u u-check icon-green" @click=""></span>
                <span v-show="avatar.id === userStore.userSession._id" class="u u-close icon-red"></span>
                <div v-show="avatar.id === userStore.userSession._id">
                    <span class="u u-message"></span>
                </div>
                </div> -->


                <div  class="status">
                    <u-tags :text="getStatus(avatar).text" size="s" :color="getStatus(avatar).statusColor" :background="getStatus(avatar).statusBackground" :delete="false" />
                </div>
                
            </div>

            <div v-if="showSeparator(index)" class="separator">
                <component :is="separatorMap[type]" />
            </div>

        </div>
        

    </template>

    <style scoped>

        .container__validations-item {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: auto;
        }


        .content__validations-item {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
            height: 52px;
            border: 1px solid var(--neutral-border-light);
            border-radius: 14px;
        }

        .user {
            display: flex;
            width: 320px;
            height: 100%;
            align-items: center;
            gap: 8px;
            padding-top: 6px;
            padding-bottom: 6px;
            padding-left: 12px;
        }

        .user .containerAvatar {
            display: flex;
            align-items: center;
            position: relative;
        }

        .user .statusContainer {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 15px;
            font-weight: bold;
            position: absolute;
            bottom: -4px;
            right: -5px;
            }

        .user span p {
            margin-bottom: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            font-weight: bold;
        }

        .user .name {
            color: var(--neutral-text-body);
            font-size: 14px;
            font-weight: 600;
            line-height: 18px;
        }

        /* Colores para cada estado */
        .colorCicleAprobado {
        background-color: var(--success-surface-default);
        color: var(--neutral-border-background);
        }

        .colorPendiente {
        background-color: var(--neutral-surface-default);
        color: var(--neutral-background-default);
        }

        .colorCicleRechazado {
        background-color: var(--danger-surface-default);
        color: var(--neutral-border-background);
        }

        /* Bordes según el estado */
        .statusPendiente {
        border: 2px solid var(--neutral-border-default);
        }
        .statusAprobado {
        border: 2px solid var(--success-border-default);
        }
        .statusRechazado {
        border: 2px solid var(--danger-surface-default);
        }

        .accions {
            display: flex;
            width: 148px;
            height: 100%;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .accions span {
            font-size: 20px;
            width: 28px;
            height: 28px;
            align-items: center;
            justify-content: center;
            display: flex;
        }

        .icon-green {
            color: var(--success-text-default);
        }

        .icon-red {
            color: var(--danger-text-default);
        }


        .accions > div {
            display: flex;
            align-items: center;
            color: var(--info-text-default);
        }

        .status {
            display: flex;
            width: 100px;
            height: 100%;
            align-items: center;
            justify-content: center;
        }

        .separator {
            display: flex;
            width: 60px;
            height: 15.43px;
            align-items: center;
            justify-content: center;
            margin : 4px 0px;
            rotate: 90deg;
        }



    </style>
