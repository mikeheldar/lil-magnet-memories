import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/login', component: () => import('pages/LoginPage.vue') },
      { path: '/register', component: () => import('pages/RegisterPage.vue') },
      { path: '/profile', component: () => import('pages/ProfilePage.vue') },
      { path: '/api-test', component: () => import('pages/ApiTestPage.vue') },
      { path: '/add-show', component: () => import('pages/AddShowPage.vue') },
      {
        path: '/forgot-password',
        component: () => import('pages/ForgotPasswordPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
