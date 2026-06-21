<template>
  <q-page class="q-pa-lg">
    <div class="page-container">
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
      </div>

      <div v-else-if="!post" class="text-center q-pa-xl">
        <div class="text-h6 text-grey-7 q-mb-md">Post not found.</div>
        <q-btn color="primary" label="Back to Blog" @click="$router.push('/blog')" />
      </div>

      <article v-else>
        <q-btn
          flat
          color="primary"
          icon="arrow_back"
          label="Back to Blog"
          class="q-mb-md"
          @click="$router.push('/blog')"
        />
        <div class="text-caption text-grey-6 q-mb-sm">
          {{ formatDate(post.publishedAt || post.createdAt) }}
        </div>
        <h1 class="text-h4 text-primary q-mb-md">{{ post.title }}</h1>
        <div v-if="displayImages.length" class="q-mb-md">
          <q-img
            v-if="displayImages.length === 1"
            :src="displayImages[0]"
            :ratio="16 / 9"
            class="rounded-borders"
          />
          <div v-else class="row q-col-gutter-sm">
            <div
              v-for="(imageUrl, index) in displayImages"
              :key="`${imageUrl}-${index}`"
              class="col-12"
              :class="index === 0 ? 'col-md-12' : 'col-md-6'"
            >
              <q-img :src="imageUrl" :ratio="index === 0 ? 16 / 9 : 1" class="rounded-borders" />
            </div>
          </div>
        </div>
        <div class="text-body1 content-block" v-html="contentHtml"></div>
        <div v-if="post.tags?.length" class="q-mt-lg">
          <q-chip
            v-for="tag in post.tags"
            :key="`tag-${tag}`"
            color="primary"
            text-color="white"
            size="sm"
            class="q-mr-xs q-mb-xs"
          >
            {{ tag }}
          </q-chip>
        </div>
      </article>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useMeta } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { toAbsoluteUrl } from '../composables/useSiteSeo.js';

const route = useRoute();
const loading = ref(true);
const post = ref(null);

const contentHtml = computed(() =>
  String(post.value?.content || '')
    .split('\n')
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join('')
);

const displayImages = computed(() => {
  const current = post.value;
  if (!current) return [];
  const urls = [];
  const add = (url) => {
    const next = String(url || '').trim();
    if (next && !urls.includes(next)) {
      urls.push(next);
    }
  };
  add(current.featuredImage);
  (current.mediaUrls || []).forEach(add);
  add(current.instagramSync?.mediaUrl);
  (current.instagramSync?.mediaUrls || []).forEach(add);
  return urls;
});

const formatDate = (dateValue) => {
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue || Date.now());
  return d.toLocaleDateString();
};

const applyMeta = () => {
  const current = post.value;
  const title = current
    ? `${current.title} - Lil Magnet Memories Blog`
    : 'Blog Post - Lil Magnet Memories';
  const description =
    current?.seoDescription || current?.excerpt || String(current?.content || '').slice(0, 155) ||
    'Custom magnet ideas, events, and local gift inspiration.';
  const keywords =
    current?.seoKeywords ||
    'custom magnets, photo gifts, holiday gift ideas, Dunwoody, Sandy Springs, team magnets';
  const canonical = toAbsoluteUrl(route.path);
  const image = toAbsoluteUrl(displayImages.value[0] || '/assets/lil-magnet-memories-logo.png');

  useMeta({
    title,
    meta: {
      description: { name: 'description', content: description },
      keywords: { name: 'keywords', content: keywords },
      ogTitle: { property: 'og:title', content: title },
      ogDescription: { property: 'og:description', content: description },
      ogType: { property: 'og:type', content: 'article' },
      ogUrl: { property: 'og:url', content: canonical },
      ogImage: { property: 'og:image', content: image },
      twitterCard: { name: 'twitter:card', content: 'summary_large_image' },
      twitterTitle: { name: 'twitter:title', content: title },
      twitterDescription: { name: 'twitter:description', content: description },
      twitterImage: { name: 'twitter:image', content: image },
    },
    link: {
      canonical: { rel: 'canonical', href: canonical },
    },
  });
};

const loadPost = async () => {
  loading.value = true;
  try {
    post.value = await firebaseService.getBlogPostBySlug(route.params.slug);
  } catch (error) {
    console.error('Failed to load blog post:', error);
    post.value = null;
  } finally {
    loading.value = false;
    applyMeta();
  }
};

watch(() => route.params.slug, () => {
  void loadPost();
});

onMounted(async () => {
  await loadPost();
});
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
}
.content-block :deep(p) {
  margin: 0 0 1rem 0;
  line-height: 1.7;
}
</style>

