<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary">
        Print Template - Order #{{ orderNumber }}
      </div>
      <div class="q-mt-md">
        <q-btn
          color="primary"
          icon="print"
          label="Print"
          @click="window.print()"
        />
        <q-btn
          flat
          label="Back to Orders"
          @click="$router.push('/orders')"
          class="q-ml-sm"
        />
      </div>
    </div>

    <!-- Print Pages Container -->
    <div class="print-container">
      <!-- Generate pages (6 photos per page) -->
      <div
        v-for="(page, pageIndex) in pages"
        :key="pageIndex"
        class="print-page"
      >
        <div class="print-grid">
          <div v-for="(photoIndex, gridIndex) in 6" :key="gridIndex" class="print-square">
            <img
              v-if="page[gridIndex]"
              :src="page[gridIndex].url"
              :alt="page[gridIndex].name || `Photo ${photoIndex + 1}`"
              class="print-image"
            />
          </div>
        </div>
        <div class="print-footer">
          Order #{{ orderNumber }} - Page {{ pageIndex + 1 }} of {{ pages.length }}
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'PrintTemplatePage',
  setup() {
    const route = useRoute();
    const photos = ref([]);
    const orderNumber = ref('');

    // Parse photos and quantities from query parameters
    const parseOrderData = () => {
      try {
        const photosParam = route.query.photos;
        const quantitiesParam = route.query.quantities;

        if (photosParam) {
          photos.value = JSON.parse(photosParam);
        }

        if (route.query.orderNumber) {
          orderNumber.value = route.query.orderNumber;
        }

        console.log('Parsed photos:', photos.value);
      } catch (error) {
        console.error('Error parsing order data:', error);
      }
    };

    // Organize photos into pages (6 per page)
    const pages = computed(() => {
      const pagesArray = [];
      const photosPerPage = 6;

      for (let i = 0; i < photos.value.length; i += photosPerPage) {
        const pagePhotos = photos.value.slice(i, i + photosPerPage);
        // Pad with nulls if less than 6 photos
        while (pagePhotos.length < photosPerPage) {
          pagePhotos.push(null);
        }
        pagesArray.push(pagePhotos);
      }

      return pagesArray;
    });

    onMounted(() => {
      parseOrderData();
    });

    return {
      photos,
      orderNumber,
      pages,
    };
  },
};
</script>

<style scoped>
/* Print-specific styles */
@media print {
  body {
    margin: 0;
    padding: 0;
  }

  .q-page {
    background: white;
    padding: 0;
  }

  .text-center,
  .q-btn {
    display: none !important;
  }

  .print-container {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  .print-page {
    width: 8.5in;
    height: 11in;
    page-break-after: always;
    margin: 0;
    padding: 1in;
    background: white;
    border: none;
    display: flex;
    flex-direction: column;
  }

  .print-grid {
    display: grid;
    grid-template-columns: repeat(2, 2.6in);
    grid-template-rows: repeat(3, 2.6in);
    gap: 0.55in;
    justify-content: center;
    flex: 1;
  }

  .print-square {
    width: 2.6in;
    height: 2.6in;
    border: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: white;
  }

  .print-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .print-footer {
    text-align: center;
    padding-top: 0.3in;
    font-size: 10pt;
    color: #666;
  }
}

/* Screen styles */
@media screen {
  .print-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: 2rem;
  }

  .print-page {
    width: 8.5in;
    height: 11in;
    background: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    padding: 1in;
    border: 1px solid #ddd;
  }

  .print-grid {
    display: grid;
    grid-template-columns: repeat(2, 2.6in);
    grid-template-rows: repeat(3, 2.6in);
    gap: 0.55in;
    justify-content: center;
    flex: 1;
    min-height: 0;
  }

  .print-square {
    width: 2.6in;
    height: 2.6in;
    border: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: white;
    min-height: 0;
  }

  .print-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .print-footer {
    text-align: center;
    padding-top: 0.3in;
    font-size: 10pt;
    color: #666;
    border-top: 1px solid #ddd;
    margin-top: 0.3in;
  }
}
</style>

