<template>
  <q-page class="q-pa-lg">
    <div class="page-container">
      <div class="text-center q-mb-xl">
        <div class="text-caption text-grey-6 q-mb-xs">
          <router-link to="/blog" class="crumb-link">Blog</router-link>
          <span class="q-mx-xs">/</span>
          <span>Tag</span>
        </div>
        <div class="text-h4 text-primary text-weight-bold">
          {{ tagLabel }} magnet ideas
        </div>
        <div class="text-body1 text-grey-7 q-mt-sm">
          Custom photo &amp; novelty magnet ideas tagged
          <strong>{{ tagLabel }}</strong> — gifts, events, and memory inspiration.
        </div>
      </div>

      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
      </div>

      <div v-else-if="!posts.length" class="text-center q-pa-xl text-grey-6">
        No posts tagged “{{ tagLabel }}” yet.
        <div class="q-mt-md">
          <q-btn flat color="primary" to="/blog" label="Back to Blog" no-caps />
        </div>
      </div>

      <div v-else class="row q-col-gutter-md">
        <div v-for="post in posts" :key="post.id" class="col-12 col-md-6 col-lg-4">
          <router-link :to="`/blog/${post.slug}`" class="blog-card-link">
            <q-card class="blog-card" flat bordered>
              <q-img
                v-if="post.featuredImage"
                :src="post.featuredImage"
                :alt="post.title"
                :ratio="16 / 9"
                class="rounded-borders"
              />
              <q-card-section>
                <div class="text-caption text-grey-6 q-mb-xs">
                  {{ formatDate(post.publishedAt || post.createdAt) }}
                </div>
                <div class="text-h6 text-primary q-mb-sm">{{ post.title }}</div>
                <div class="text-body2 text-grey-7">
                  {{ post.excerpt || excerptFromContent(post.content) }}
                </div>
              </q-card-section>
            </q-card>
          </router-link>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useMeta } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { useSiteSeo, toAbsoluteUrl } from '../composables/useSiteSeo.js';
import { postHasTagSlug, tagLabelForSlug } from '../utils/blogTags.js';

const route = useRoute();
const loading = ref(true);
const allPosts = ref([]);

const slug = computed(() => String(route.params.tag || ''));
const posts = computed(() =>
  allPosts.value.filter((p) => postHasTagSlug(p, slug.value))
);
const tagLabel = computed(() => tagLabelForSlug(slug.value, allPosts.value));

const excerptFromContent = (content) =>
  String(content || '').slice(0, 140).trim() + '...';
const formatDate = (dateValue) => {
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue || Date.now());
  return d.toLocaleDateString();
};

useSiteSeo(() => ({
  title: `${tagLabel.value} Magnet Ideas - Lil Magnet Memories Blog`,
  description: `Custom photo and novelty magnet gift ideas tagged ${tagLabel.value} — for holidays, birthdays, team events, and family memories in the Atlanta area.`,
  keywords: `${tagLabel.value} magnets, custom photo magnets, magnet gift ideas, personalized magnets`,
  path: route.path,
  breadcrumb: [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: tagLabel.value, path: route.path },
  ],
}));

// CollectionPage + ItemList JSON-LD so Google understands this is a topic hub
// listing the tagged posts (spreads crawl equity + topical authority).
useMeta(() => {
  const items = posts.value;
  if (!items.length) return {};
  return {
    script: {
      tagCollectionLd: {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${tagLabel.value} magnet ideas`,
          url: toAbsoluteUrl(route.path),
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: items.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: toAbsoluteUrl(`/blog/${p.slug}`),
              name: p.title,
            })),
          },
        }),
      },
    },
  };
});

async function load() {
  loading.value = true;
  try {
    allPosts.value = await firebaseService.getPublishedBlogPosts(120);
  } catch (error) {
    console.error('Failed to load blog posts:', error);
    allPosts.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}
.crumb-link {
  color: inherit;
  text-decoration: none;
}
.crumb-link:hover {
  text-decoration: underline;
}
.blog-card-link {
  display: block;
  height: 100%;
  text-decoration: none;
  color: inherit;
}
.blog-card {
  height: 100%;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.blog-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}
</style>
