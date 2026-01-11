<template>
    <!-- Header -->
    <div class="flex gap-3 items-center justify-between p-4 w-full">
        <div class="flex gap-3 items-center">

            <span class="cascadia slyce ml-5">
                slyce
                <!-- <span>f</span>
                <span style="margin-left: -0.1rem;">l</span>
                <span style="margin-left: -0.1rem;">o</span> -->
            </span>

            <div class="separator"></div>
            <span class="cascadia tagline">Video Texture Builder for</span>

            <a href="https://rivvon.ca"><img
                    style="width: 8rem;"
                    src="/rivvon-black.svg"
                /></a>

            <!-- Navigation Links -->
            <div
                v-if="isAuthenticated"
                class="nav-links flex gap-4 ml-8"
            >
                <router-link
                    to="/"
                    class="nav-link text-sm font-medium"
                    :class="$route.path === '/' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'"
                >
                    Create
                </router-link>
                <router-link
                    to="/my-textures"
                    class="nav-link text-sm font-medium"
                    :class="$route.path === '/my-textures' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'"
                >
                    My Textures
                </router-link>
            </div>

        </div>
        <AuthButton />
    </div>
</template>

<script setup>
    import { useAuth0 } from '@auth0/auth0-vue'
    import AuthButton from './AuthButton.vue'

    const { isAuthenticated } = useAuth0()
</script>

<style scoped>


    .separator {
        width: 3px;
        height: 4rem;
        background: #ddd;
        padding: 0px;
        margin: 0 2rem;
    }

    svg {
        width: 8rem;
    }

    svg path {
        fill: #434242;
    }
</style>