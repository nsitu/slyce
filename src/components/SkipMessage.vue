<script setup>

    import { useAppStore } from '../stores/appStore';
    const app = useAppStore()  // Pinia store

    const { plan } = defineProps({
        plan: Object
    })

</script>
<template>
    <div
        class="flex items-center gap-1 cursor-default"
        v-tooltip.left="`${plan.length} ${app.tileProportion} ${plan.length == 1 ? 'tile' : 'tiles'} at full resolution (${plan.width}x${plan.height}) takes up ${app.frameCount - plan.skipping} of ${app.frameCount} possible sample ${app.samplingMode}. ${plan.skipping} ${app.samplingMode} from frames ${app.frameCount - plan.skipping + 1}-${app.frameCount} do not form a full tile and will be skipped.`"
    >
        <span class="material-symbols-outlined">step_over</span>
        <span>Skipping</span>
        <span> {{ plan.skipping }} frames</span>
    </div>
</template>

<style scoped>
    .small-icon {
        font-size: 1.125rem;
    }
</style>