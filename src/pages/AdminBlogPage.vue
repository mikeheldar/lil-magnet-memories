<template>
  <q-page class="q-pa-md">
    <div class="page-container">
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="text-h4 text-primary text-weight-bold">Blog Manager</div>
          <div class="text-body2 text-grey-7">
            Create SEO content and queue Instagram publishing requests.
          </div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn color="secondary" icon="event" label="Import Event Drafts" @click="importEventDrafts" :loading="importingEvents" />
          <q-btn color="primary" icon="add" label="New Post" @click="startNewPost" />
        </div>
      </div>

      <q-card class="q-mb-md">
        <q-card-section>
          <q-form @submit.prevent="savePost" class="q-gutter-md">
            <q-input v-model="form.title" label="Title *" filled />
            <q-input v-model="form.slug" label="Slug (optional)" filled hint="Auto-generated if blank" />
            <q-input v-model="form.excerpt" type="textarea" label="Excerpt" filled autogrow />
            <q-input v-model="form.content" type="textarea" label="Content *" filled autogrow />
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input v-model="form.tagsText" label="Tags (comma separated)" filled />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model="form.locationTargetsText" label="Location targets (comma separated)" filled />
              </div>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input v-model="form.seoDescription" type="textarea" label="SEO Description" filled autogrow />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model="form.seoKeywords" type="textarea" label="SEO Keywords" filled autogrow />
              </div>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-select
                  v-model="form.status"
                  :options="['draft', 'published']"
                  label="Status"
                  filled
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="form.sourceType" label="Source Type" filled />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="form.sourceUrl" label="Source URL" filled />
              </div>
            </div>
            <q-input
              v-model="form.instagramCaption"
              type="textarea"
              label="Instagram Caption"
              filled
              autogrow
            />
            <div class="row q-gutter-sm">
              <q-btn color="primary" type="submit" :loading="saving" :label="editingPostId ? 'Update Post' : 'Create Post'" />
              <q-btn
                v-if="editingPostId"
                color="orange"
                icon="send"
                label="Queue Instagram Publish"
                :loading="queueingInstagram"
                @click="queueInstagramPublish"
              />
              <q-btn flat color="grey-7" label="Reset Form" @click="resetForm" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">Posts</div>
          <q-table
            :rows="posts"
            :columns="columns"
            row-key="id"
            flat
            bordered
            :loading="loading"
          >
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-chip dense :color="props.row.status === 'published' ? 'positive' : 'grey-7'" text-color="white">
                  {{ props.row.status }}
                </q-chip>
              </q-td>
            </template>
            <template #body-cell-instagram="props">
              <q-td :props="props">
                <q-chip dense color="purple" text-color="white">
                  {{ props.row.instagram?.publishStatus || 'not_requested' }}
                </q-chip>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn flat dense icon="edit" color="primary" @click="editPost(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useMeta, useQuasar } from 'quasar';
import { authService } from '../services/authService';
import { firebaseService } from '../services/firebaseService.js';

const $q = useQuasar();
useMeta({
  title: 'Blog Manager - Admin',
  meta: {
    robots: {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  },
});

const loading = ref(true);
const saving = ref(false);
const importingEvents = ref(false);
const queueingInstagram = ref(false);
const posts = ref([]);
const editingPostId = ref(null);

const columns = [
  { name: 'title', label: 'Title', field: 'title', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
  { name: 'sourceType', label: 'Source', field: 'sourceType', align: 'left' },
  { name: 'instagram', label: 'Instagram', field: 'instagram', align: 'left' },
  { name: 'updatedAt', label: 'Updated', field: (row) => formatDate(row.updatedAt), align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'left' },
];

const baseForm = () => ({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  tagsText: '',
  locationTargetsText: 'Dunwoody, Sandy Springs, Atlanta',
  seoDescription: '',
  seoKeywords:
    'custom magnets, gift ideas, holiday gifts, memories, photo gifts, Dunwoody, Sandy Springs, team magnets',
  status: 'draft',
  sourceType: 'manual',
  sourceUrl: '',
  instagramCaption: '',
});
const form = ref(baseForm());

const formatDate = (value) => {
  const d = value instanceof Date ? value : new Date(value || Date.now());
  return d.toLocaleString();
};

const resetForm = () => {
  form.value = baseForm();
  editingPostId.value = null;
};

const loadPosts = async () => {
  loading.value = true;
  try {
    posts.value = await firebaseService.getBlogPostsForAdmin(400);
  } catch (error) {
    console.error('Failed loading admin blog posts:', error);
    $q.notify({ type: 'negative', message: 'Could not load blog posts.' });
    posts.value = [];
  } finally {
    loading.value = false;
  }
};

const parseCommaList = (raw) =>
  String(raw || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

const savePost = async () => {
  if (!form.value.title || !form.value.content) {
    $q.notify({ type: 'warning', message: 'Title and content are required.' });
    return;
  }
  saving.value = true;
  try {
    const payload = {
      title: form.value.title,
      slug: form.value.slug,
      excerpt: form.value.excerpt,
      content: form.value.content,
      tags: parseCommaList(form.value.tagsText),
      locationTargets: parseCommaList(form.value.locationTargetsText),
      seoDescription: form.value.seoDescription,
      seoKeywords: form.value.seoKeywords,
      status: form.value.status,
      sourceType: form.value.sourceType,
      sourceUrl: form.value.sourceUrl,
      instagram: {
        publishRequested: false,
        publishStatus: 'not_requested',
        caption: form.value.instagramCaption || '',
      },
    };

    if (editingPostId.value) {
      await firebaseService.updateBlogPost(editingPostId.value, payload);
      $q.notify({ type: 'positive', message: 'Blog post updated.' });
    } else {
      const user = authService.getCurrentUser?.();
      await firebaseService.createBlogPost(payload, user?.email || null);
      $q.notify({ type: 'positive', message: 'Blog post created.' });
    }

    await loadPosts();
    resetForm();
  } catch (error) {
    console.error('Failed saving post:', error);
    $q.notify({ type: 'negative', message: error?.message || 'Could not save blog post.' });
  } finally {
    saving.value = false;
  }
};

const editPost = (row) => {
  editingPostId.value = row.id;
  form.value = {
    title: row.title || '',
    slug: row.slug || '',
    excerpt: row.excerpt || '',
    content: row.content || '',
    tagsText: (row.tags || []).join(', '),
    locationTargetsText: (row.locationTargets || []).join(', '),
    seoDescription: row.seoDescription || '',
    seoKeywords: row.seoKeywords || '',
    status: row.status || 'draft',
    sourceType: row.sourceType || 'manual',
    sourceUrl: row.sourceUrl || '',
    instagramCaption: row.instagram?.caption || '',
  };
};

const queueInstagramPublish = async () => {
  if (!editingPostId.value) {
    $q.notify({ type: 'warning', message: 'Save the post before queueing Instagram publish.' });
    return;
  }
  queueingInstagram.value = true;
  try {
    await firebaseService.requestInstagramPublishForBlogPost(
      editingPostId.value,
      form.value.instagramCaption || ''
    );
    $q.notify({
      type: 'positive',
      message:
        'Instagram publish queued. Connect this queue to your Meta Graph API worker/cloud function to auto-publish.',
      timeout: 5000,
    });
    await loadPosts();
  } catch (error) {
    console.error('Failed queueing Instagram publish:', error);
    $q.notify({ type: 'negative', message: 'Could not queue Instagram publish.' });
  } finally {
    queueingInstagram.value = false;
  }
};

const importEventDrafts = async () => {
  importingEvents.value = true;
  try {
    const createdIds = await firebaseService.importMarketEventsAsBlogDrafts(25);
    $q.notify({
      type: 'positive',
      message: `Imported ${createdIds.length} event drafts into blog.`,
    });
    await loadPosts();
  } catch (error) {
    console.error('Failed importing event drafts:', error);
    $q.notify({ type: 'negative', message: 'Could not import event drafts.' });
  } finally {
    importingEvents.value = false;
  }
};

onMounted(async () => {
  await loadPosts();
});
</script>

<style scoped>
.page-container {
  max-width: 1280px;
  margin: 0 auto;
}
</style>

