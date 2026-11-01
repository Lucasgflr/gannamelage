import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
    {
        path: '/login',
        name: 'login',
        component: () => import('../pages/Login.vue'),
        meta: { guest: true },
    },
    {
        path: '/',
        name: 'dashboard',
        component: () => import('../pages/Dashboard.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/properties/create',
        name: 'properties.create',
        component: () => import('../pages/PropertyForm.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/properties/:id/edit',
        name: 'properties.edit',
        component: () => import('../pages/PropertyForm.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/properties/:id/view',
        name: 'properties.view',
        component: () => import('../pages/PropertyView.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/p/:slug',
        name: 'landing',
        component: () => import('../pages/LandingPage.vue'),
        meta: { public: true },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login' });
    } else if (to.meta.guest && authStore.isAuthenticated) {
        next({ name: 'dashboard' });
    } else {
        next();
    }
});

export default router;
