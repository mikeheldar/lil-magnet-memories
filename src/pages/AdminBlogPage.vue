<template>
  <q-page class="q-pa-md admin-blog-page">
    <div class="page-container">
      <div class="row items-start justify-between q-mb-md q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="text-h4 text-primary text-weight-bold">Blog Manager</div>
          <div class="text-body2 text-grey-7">
            Create SEO content from Instagram posts (no Business account required).
          </div>
        </div>
        <div class="col-12 col-md-auto row q-gutter-sm">
          <q-btn
            color="indigo"
            icon="sync"
            label="Sync Instagram Posts"
            no-caps
            @click="syncInstagramDrafts"
            :loading="syncingInstagram"
          />
          <q-btn
            color="negative"
            outline
            icon="delete_sweep"
            label="Clear Instagram Drafts"
            no-caps
            @click="confirmClearInstagramDrafts"
            :loading="clearingInstagram"
          />
          <q-btn
            color="secondary"
            icon="event"
            label="Import Event Drafts"
            no-caps
            @click="importEventDrafts"
            :loading="importingEvents"
          />
          <q-btn color="primary" icon="add" label="New Post" no-caps @click="startNewPost" />
        </div>
      </div>

      <q-card class="q-mb-md">
        <q-card-section>
          <q-form @submit.prevent="savePost" class="blog-form">
            <div class="form-section">
              <div class="form-section__title">Post details</div>
              <div class="form-section__fields">
                <q-input v-model="form.title" label="Title *" filled stack-label />
                <q-input
                  v-model="form.slug"
                  label="Slug (optional)"
                  filled
                  stack-label
                  hint="Auto-generated if blank"
                />
                <q-input
                  v-model="form.excerpt"
                  type="textarea"
                  label="Excerpt"
                  filled
                  stack-label
                  :rows="3"
                />
                <q-input
                  v-model="form.content"
                  type="textarea"
                  label="Content *"
                  filled
                  stack-label
                  :rows="8"
                />
              </div>
            </div>

            <div class="form-section">
              <div class="form-section__title">Photos</div>
              <div class="text-caption text-grey-7 q-mb-sm">
                Paste an Instagram post URL to import photos and caption, or sync recent posts from your profile.
              </div>
              <div class="row q-col-gutter-sm q-mb-md items-end">
                <div class="col-12 col-md">
                  <q-input
                    v-model="instagramImportUrl"
                    label="Instagram post URL"
                    filled
                    stack-label
                    hint="Example: https://www.instagram.com/p/ABC123/"
                    clearable
                  />
                </div>
                <div class="col-12 col-md-auto row q-gutter-sm">
                  <q-btn
                    color="indigo-7"
                    icon="download"
                    label="Import into form"
                    no-caps
                    :loading="importingInstagramUrl"
                    @click="importInstagramUrlIntoForm"
                  />
                  <q-btn
                    color="indigo"
                    outline
                    icon="save"
                    label="Save as draft"
                    no-caps
                    :loading="importingInstagramUrl"
                    @click="importInstagramUrlAsDraft"
                  />
                </div>
              </div>
              <div v-if="form.mediaUrls.length" class="row q-col-gutter-sm q-mb-md">
                <div
                  v-for="(url, index) in form.mediaUrls"
                  :key="`${url}-${index}`"
                  class="col-6 col-sm-4 col-md-3"
                >
                  <q-card
                    flat
                    bordered
                    class="photo-pick-card cursor-pointer"
                    :class="{ 'photo-pick-card--selected': form.featuredImage === url }"
                    @click="selectFeaturedImage(url)"
                  >
                    <q-img :src="url" ratio="1" spinner-color="primary">
                      <div class="absolute-top-right q-pa-xs">
                        <q-icon
                          v-if="form.featuredImage === url"
                          name="star"
                          color="amber"
                          size="20px"
                        />
                      </div>
                    </q-img>
                    <q-card-section class="q-pa-xs text-center">
                      <div class="text-caption">
                        {{ form.featuredImage === url ? 'Featured' : 'Set featured' }}
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
              <q-input
                v-model="form.featuredImage"
                label="Featured image URL"
                filled
                stack-label
                hint="Used on the blog list and at the top of the post"
              />
            </div>

            <div class="form-section">
              <div class="form-section__title">Tags & SEO</div>
              <div class="form-section__fields">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.tagsText"
                      label="Tags (comma separated)"
                      filled
                      stack-label
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="form.locationTargetsText"
                      label="Location targets (comma separated)"
                      filled
                      stack-label
                    />
                  </div>
                </div>
                <q-input
                  v-model="form.seoDescription"
                  type="textarea"
                  label="SEO Description"
                  filled
                  stack-label
                  :rows="3"
                />
                <q-input
                  v-model="form.seoKeywords"
                  type="textarea"
                  label="SEO Keywords"
                  filled
                  stack-label
                  :rows="3"
                />
              </div>
            </div>

            <div class="form-section">
              <div class="form-section__title">Publishing</div>
              <div class="form-section__fields">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <q-select
                      v-model="form.status"
                      :options="['draft', 'published']"
                      label="Status"
                      filled
                      stack-label
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="form.sourceType" label="Source Type" filled stack-label />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input v-model="form.sourceUrl" label="Source URL" filled stack-label />
                  </div>
                </div>
                <q-input
                  v-model="form.instagramCaption"
                  type="textarea"
                  label="Instagram Caption"
                  filled
                  stack-label
                  :rows="4"
                />
              </div>
            </div>

            <div class="row q-gutter-sm q-mt-md">
              <q-btn
                color="primary"
                type="submit"
                no-caps
                :loading="saving"
                :label="editingPostId ? 'Update Post' : 'Create Post'"
              />
              <q-btn
                v-if="editingPostId"
                color="orange"
                icon="send"
                label="Queue Instagram Publish"
                no-caps
                :loading="queueingInstagram"
                @click="queueInstagramPublish"
              />
              <q-btn flat color="grey-7" label="Reset Form" no-caps @click="resetForm" />
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
const syncingInstagram = ref(false);
const clearingInstagram = ref(false);
const importingInstagramUrl = ref(false);
const instagramImportUrl = ref('');
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
  featuredImage: '',
  mediaUrls: [],
  instagramSync: null,
});
const form = ref(baseForm());

const collectPostMediaUrls = (row) => {
  const urls = [];
  const add = (url) => {
    const next = String(url || '').trim();
    if (next && !urls.includes(next)) {
      urls.push(next);
    }
  };
  add(row?.featuredImage);
  (row?.mediaUrls || []).forEach(add);
  add(row?.instagramSync?.mediaUrl);
  (row?.instagramSync?.mediaUrls || []).forEach(add);
  return urls;
};

const formatDate = (value) => {
  const d = value instanceof Date ? value : new Date(value || Date.now());
  return d.toLocaleString();
};

const resetForm = () => {
  form.value = baseForm();
  editingPostId.value = null;
};

const startNewPost = () => {
  resetForm();
};

const selectFeaturedImage = (url) => {
  form.value.featuredImage = url;
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
    const existing = editingPostId.value
      ? posts.value.find((p) => p.id === editingPostId.value)
      : null;
    const mediaUrls = form.value.mediaUrls.filter(Boolean);
    const featuredImage = form.value.featuredImage || mediaUrls[0] || null;

    const payload = {
      title: form.value.title,
      slug: form.value.slug,
      excerpt: form.value.excerpt,
      content: form.value.content,
      featuredImage,
      mediaUrls,
      tags: parseCommaList(form.value.tagsText),
      locationTargets: parseCommaList(form.value.locationTargetsText),
      seoDescription: form.value.seoDescription,
      seoKeywords: form.value.seoKeywords,
      status: form.value.status,
      sourceType: form.value.sourceType,
      sourceUrl: form.value.sourceUrl,
      instagram: {
        publishRequested: existing?.instagram?.publishRequested || false,
        publishStatus: existing?.instagram?.publishStatus || 'not_requested',
        publishedUrl: existing?.instagram?.publishedUrl || null,
        caption: form.value.instagramCaption || '',
      },
      instagramSync: form.value.instagramSync || existing?.instagramSync || null,
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
  const mediaUrls = collectPostMediaUrls(row);
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
    instagramCaption: row.instagram?.caption || row.instagramSync?.lastCaption || '',
    featuredImage: row.featuredImage || mediaUrls[0] || '',
    mediaUrls,
    instagramSync: row.instagramSync || null,
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

const applyInstagramPreview = (preview) => {
  if (!preview) return;
  form.value = {
    ...form.value,
    title: preview.title || form.value.title,
    slug: preview.slug || form.value.slug,
    excerpt: preview.excerpt || form.value.excerpt,
    content: preview.content || form.value.content,
    featuredImage: preview.featuredImage || form.value.featuredImage,
    mediaUrls: Array.isArray(preview.mediaUrls) ? preview.mediaUrls.filter(Boolean) : [],
    tagsText: (preview.tags || []).join(', '),
    seoDescription: preview.seoDescription || form.value.seoDescription,
    seoKeywords: preview.seoKeywords || form.value.seoKeywords,
    sourceType: preview.sourceType || 'instagram',
    sourceUrl: preview.sourceUrl || form.value.sourceUrl,
    instagramCaption: preview.instagramCaption || form.value.instagramCaption,
    instagramSync: preview.instagramSync || form.value.instagramSync,
    status: 'draft',
  };
  editingPostId.value = null;
};

const importInstagramUrlIntoForm = async () => {
  const url = String(instagramImportUrl.value || '').trim();
  if (!url) {
    $q.notify({ type: 'warning', message: 'Paste an Instagram post URL first.' });
    return;
  }

  importingInstagramUrl.value = true;
  try {
    const result = await firebaseService.importInstagramPostFromUrl(url, { saveDraft: false });
    applyInstagramPreview(result?.preview);
    $q.notify({
      type: 'positive',
      message: 'Instagram post loaded into the form. Review and click Create Post.',
      timeout: 5000,
    });
  } catch (error) {
    console.error('Failed importing Instagram URL into form:', error);
    $q.notify({
      type: 'negative',
      message: error?.message || 'Could not import Instagram post.',
      timeout: 8000,
      multiLine: true,
    });
  } finally {
    importingInstagramUrl.value = false;
  }
};

const importInstagramUrlAsDraft = async () => {
  const url = String(instagramImportUrl.value || '').trim();
  if (!url) {
    $q.notify({ type: 'warning', message: 'Paste an Instagram post URL first.' });
    return;
  }

  importingInstagramUrl.value = true;
  try {
    const result = await firebaseService.importInstagramPostFromUrl(url, { saveDraft: true });
    if (result?.action === 'skipped') {
      $q.notify({ type: 'info', message: 'That Instagram post is already saved as a draft.' });
    } else {
      $q.notify({
        type: 'positive',
        message: result?.action === 'updated' ? 'Instagram draft updated.' : 'Instagram draft created.',
      });
    }
    await loadPosts();
    if (result?.preview) {
      applyInstagramPreview(result.preview);
      if (result?.postId) {
        editingPostId.value = result.postId;
      }
    }
  } catch (error) {
    console.error('Failed saving Instagram URL as draft:', error);
    $q.notify({
      type: 'negative',
      message: error?.message || 'Could not save Instagram draft.',
      timeout: 8000,
      multiLine: true,
    });
  } finally {
    importingInstagramUrl.value = false;
  }
};

const syncInstagramDrafts = async () => {
  syncingInstagram.value = true;
  try {
    const result = await firebaseService.syncInstagramPostsAsBlogDrafts(25);
    const created = Number(result?.createdCount || 0);
    const updated = Number(result?.updatedCount || 0);
    const skipped = Number(result?.skippedCount || 0);
    $q.notify({
      type: 'positive',
      message: `Instagram sync complete: ${created} created, ${updated} updated, ${skipped} skipped.`,
      timeout: 5000,
    });
    await loadPosts();
  } catch (error) {
    console.error('Failed syncing Instagram drafts:', error);
    $q.notify({
      type: 'negative',
      message: error?.message || 'Could not sync Instagram posts.',
      timeout: 8000,
      multiLine: true,
    });
  } finally {
    syncingInstagram.value = false;
  }
};

const confirmClearInstagramDrafts = () => {
  const draftCount = posts.value.filter(
    (post) =>
      post.status !== 'published' &&
      (post.sourceType === 'instagram' || post.instagramSync?.instagramPostId)
  ).length;

  $q.dialog({
    title: 'Clear Instagram drafts?',
    message:
      draftCount > 0
        ? `Delete ${draftCount} Instagram-synced draft${draftCount === 1 ? '' : 's'} so you can test a fresh sync. Published Instagram posts are kept.`
        : 'No Instagram-synced drafts to delete. Published posts are never removed.',
    cancel: true,
    persistent: true,
    ok: {
      label: draftCount > 0 ? 'Delete drafts' : 'OK',
      color: 'negative',
      flat: draftCount === 0,
    },
  }).onOk(async () => {
    if (draftCount === 0) return;
    await clearInstagramDrafts();
  });
};

const clearInstagramDrafts = async () => {
  clearingInstagram.value = true;
  try {
    const result = await firebaseService.clearInstagramSyncedBlogDrafts();
    const deleted = Number(result?.deletedCount || 0);
    const skippedPublished = Number(result?.skippedPublishedCount || 0);

    const editingId = editingPostId.value;
    await loadPosts();

    if (editingId && !posts.value.some((post) => post.id === editingId)) {
      resetForm();
    }

    $q.notify({
      type: 'positive',
      message:
        deleted > 0
          ? `Removed ${deleted} Instagram draft${deleted === 1 ? '' : 's'}.${skippedPublished ? ` ${skippedPublished} published post${skippedPublished === 1 ? ' was' : 's were'} kept.` : ''}`
          : 'No Instagram drafts to remove.',
      timeout: 5000,
    });
  } catch (error) {
    console.error('Failed clearing Instagram drafts:', error);
    $q.notify({
      type: 'negative',
      message: error?.message || 'Could not clear Instagram drafts.',
    });
  } finally {
    clearingInstagram.value = false;
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

.blog-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a4673;
  margin-bottom: 12px;
}

.form-section__fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section__fields :deep(.q-field) {
  width: 100%;
}

.photo-pick-card {
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.photo-pick-card--selected {
  border-color: #1a4673 !important;
  box-shadow: 0 0 0 2px rgba(26, 70, 115, 0.2);
}
</style>
