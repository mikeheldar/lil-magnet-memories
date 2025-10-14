import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/MyShowsPage.vue') },
      { path: '/login', component: () => import('pages/LoginPage.vue') },
      { path: '/register', component: () => import('pages/RegisterPage.vue') },
      { path: '/profile', component: () => import('pages/ProfilePage.vue') },
      { path: '/admin', component: () => import('pages/AdminPage.vue') },
      { path: '/add-show', component: () => import('pages/AddShowPage.vue') },
      { path: '/my-shows', component: () => import('pages/MyShowsPage.vue') },
      { path: '/friends', component: () => import('pages/FriendsPage.vue') },
      {
        path: '/accept-invite/:token',
        component: () => import('pages/AcceptInvitePage.vue'),
      },
      { path: '/about', component: () => import('pages/AboutPage.vue') },
      { path: '/show/:show_id', component: () => import('pages/ShowPage.vue') },
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
