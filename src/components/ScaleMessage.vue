<script setup>


    import { useAppStore } from '../stores/appStore';
    const app = useAppStore()  // Pinia store

    const { plan } = defineProps({
        plan: Object
    })

</script>
<template>
    <div
        v-if="(plan.scaleTo !== plan.scaleFrom)"
        class="flex items-center gap-1 cursor-default"
        v-tooltip.left="`${app.frameCount} sampled ${app.samplingMode} are sufficient for ${plan.length} ${plan.length == 1 ? 'tile' : 'tiles'} of ${plan.scaleTo}px. Downsampling from ${plan.scaleFrom}px to retain proportions.`"
    >
        <span
            v-if="(plan.scaleTo < plan.scaleFrom)"
            class="material-symbols-outlined"
        >close_fullscreen</span>
        <span v-if="(plan.scaleTo < plan.scaleFrom)">Scaling down from</span>
        <span
            v-if="(plan.scaleTo > plan.scaleFrom)"
            class="material-symbols-outlined"
        >open_in_full</span>
        <span v-if="(plan.scaleTo > plan.scaleFrom)">Scaling up from</span>
        <span> {{ plan.scaleFrom }}<span style="font-variant: small-caps;">px</span></span>

        <span>to</span>
        <span> {{ plan.scaleTo }}<span style="font-variant: small-caps;">px</span></span>

    </div>
</template>
<style scoped></style>