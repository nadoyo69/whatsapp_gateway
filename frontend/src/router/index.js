import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guest: true }
    },
    {
      path: '/',
      component: () => import('../components/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue')
        },
        {
          path: 'sessions',
          name: 'sessions',
          component: () => import('../views/SessionsView.vue')
        },
        {
          path: 'sender',
          name: 'sender',
          component: () => import('../views/SenderView.vue')
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('../views/UsageReportsView.vue')
        },
        {
          path: 'chats',
          redirect: '/reports'
        },
        {
          path: 'webhooks',
          name: 'webhooks',
          component: () => import('../views/WebhooksView.vue')
        },
        {
          path: 'api-keys',
          name: 'api-keys',
          component: () => import('../views/ApiKeysView.vue')
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/UsersView.vue')
        },
        {
          path: 'docs',
          name: 'docs',
          component: () => import('../views/DocsView.vue')
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const token = localStorage.getItem('wa_token');

  if (to.meta.requiresAuth && !token) {
    next({ name: 'login' });
  } else if (to.meta.guest && token) {
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
