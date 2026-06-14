<template>
  <q-page class="q-pa-lg">
    <div class="page-container">
      <div class="text-center q-mb-xl">
        <div class="text-h4 text-primary text-weight-bold">Magnet Ideas Blog</div>
        <div class="text-body1 text-grey-7 q-mt-sm">
          Gift ideas, local events, and memory inspiration for families, teams, and holidays.
        </div>
      </div>

      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
      </div>

      <div v-else-if="!posts.length" class="text-center q-pa-xl text-grey-6">
        Blog posts are coming soon.
      </div>

      <div v-else class="row q-col-gutter-md">
        <div v-for="post in posts" :key="post.id" class="col-12 col-md-6 col-lg-4">
          <q-card class="blog-card cursor-pointer" flat bordered @click="$router.push(`/blog/${post.slug}`)">
            <q-img
              v-if="post.featuredImage"
              :src="post.featuredImage"
              :ratio="16 / 9"
              class="rounded-borders"
            />
            <q-card-section>
              <div class="text-caption text-grey-6 q-mb-xs">
                {{ formatDate(post.publishedAt || post.createdAt) }}
              </div>
              <div class="text-h6 text-primary q-mb-sm">{{ post.title }}</div>
              <div class="text-body2 text-grey-7">{{ post.excerpt || excerptFromContent(post.content) }}</div>
              <div v-if="post.tags?.length" class="q-mt-md">
                <q-chip
                  v-for="tag in post.tags.slice(0, 4)"
                  :key="`${post.id}-${tag}`"
                  dense
                  size="sm"
                  color="primary"
                  text-color="white"
                  class="q-mr-xs q-mb-xs"
                >
                  {{ tag }}
                </q-chip>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { firebaseService } from '../services/firebaseService.js';
import { useSiteSeo } from '../composables/useSiteSeo.js';

const route = useRoute();

useSiteSeo(() => ({
  title: 'Magnet Gift Ideas Blog - Lil Magnet Memories',
  description:
    'Explore custom magnet gift ideas for holidays, birthdays, team events, and family memories in Dunwoody and Sandy Springs.',
  keywords:
    'magnet gift ideas, custom photo magnets, holiday gifts, Dunwoody gifts, Sandy Springs gifts, team magnets, family photo gifts',
  path: route.path,
  image: '/assets/lil-magnet-memories-logo.png',
}));

const loading = ref(true);
const posts = ref([]);

const excerptFromContent = (content) => String(content || '').slice(0, 140).trim() + '...';
const formatDate = (dateValue) => {
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue || Date.now());
  return d.toLocaleDateString();
};

onMounted(async () => {
  try {
    posts.value = await firebaseService.getPublishedBlogPosts(120);
  } catch (error) {
    console.error('Failed to load blog posts:', error);
    posts.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}
.blog-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.blog-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}
</style>

