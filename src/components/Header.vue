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
                class="nav-links flex gap-2 ml-8"
            >
                <router-link
                    to="/"
                    class="nav-link"
                    :class="$route.path === '/' ? 'nav-link-active' : ''"
                >
                    Create
                </router-link>
                <router-link
                    to="/my-textures"
                    class="nav-link"
                    :class="$route.path === '/my-textures' ? 'nav-link-active' : ''"
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

    .nav-link {
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        background-color: #f0f0f0;
        color: #333;
        text-decoration: none;
        transition: all 0.2s;
    }

    .nav-link:hover {
        background-color: #e0e0e0;
    }

    .nav-link-active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
    }

    .nav-link-active:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
</style>