<template>
  <div class="auth-button">
    <button
      v-if="!isAuthenticated"
      @click="login"
      class="btn-login"
    >
      <span class="material-symbols-outlined">login</span>
      Login
    </button>

    <div
      v-else
      class="user-menu"
    >
      <img
        v-if="user?.picture"
        :src="user.picture"
        :alt="user.name"
        class="avatar"
      />
      <span
        v-else
        class="material-symbols-outlined avatar-placeholder"
      >account_circle</span>
      <span class="username">{{ user?.name || user?.email }}</span>

      <div class="separator"></div>

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
        Textures
      </router-link>
      <button
        @click="logout"
        class="btn-logout"
      >
        <span class="material-symbols-outlined">logout</span>
        Logout
      </button>
    </div>
  </div>
</template>

<script setup>
  import { useAuth0 } from '@auth0/auth0-vue'
  import { useRoute } from 'vue-router'

  const { loginWithRedirect, logout: auth0Logout, user, isAuthenticated } = useAuth0()
  const $route = useRoute()

  const login = () => {
    // Save current route to redirect back after login
    sessionStorage.setItem('auth_redirect', window.location.pathname)
    loginWithRedirect()
  }

  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    })
  }
</script>

<style scoped>
  .auth-button {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-menu {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-placeholder {
    font-size: 32px;
    color: #6b7280;
  }

  .username {
    font-size: 0.9rem;
    color: #333;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .btn-login,
  .btn-logout {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn-login {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  }

  .btn-login:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
  }

  .btn-logout {
    background-color: #f0f0f0;
    color: #333;
  }

  .btn-logout:hover {
    background-color: #e0e0e0;
  }

  .btn-login .material-symbols-outlined,
  .btn-logout .material-symbols-outlined {
    font-size: 18px;
  }

  .separator {
    width: 1px;
    height: 24px;
    background: #ddd;
    margin: 0 0.5rem;
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
