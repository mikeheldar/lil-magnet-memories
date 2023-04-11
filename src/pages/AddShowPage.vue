<template>
  <q-page class="flex flex-top">
    <div class="col">
      <q-input filled v-model="showToFind" label="show to find" />
      <q-btn
        color="primary"
        glossy
        label="Find Show"
        @click="getTVShows(showToFind)"
        style="width: 100%"
      >
      </q-btn>

      <q-list class="bg-white" separator bordered>
        <q-item v-for="show in shows" :key="show.name" v-ripple>
          <!-- <q-item-section>
            <q-img :src="show.thumbnail" />
          </q-item-section> -->

          <q-item-section>
            <q-item-label>{{ show.name }}</q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ show.year }}</q-item-label>
          </q-item-section>

          <q-item-section>
            <q-btn
              @click="addShow(show)"
              flat
              rounded
              color="primary"
              icon="add_circle_outline"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script>

export default {
  name: 'ProfilePage',
  data() {
    return {
      showToFind: '',
      shows: [
        {
          name: 'test show',
          overview: 'test overview',
        },
      ],
    };
  },
  watch: {
    showToFind() {
      this.getTVShows(this.showToFind);
    },
  },
  methods: {
    getTVShows(query) {
      console.log('In getTVShows');
      const apikey = '24c87807-e9cd-4e9c-8d19-28ef0f44d186';
      const authtoken =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2UiOiIiLCJhcGlrZXkiOiJmYjFjMzVkNC0xYmNmLTQ4MTEtODc1ZS1lOThmM2M2MzcxNDIiLCJjb21tdW5pdHlfc3VwcG9ydGVkIjp0cnVlLCJleHAiOjE2ODM3MTkxMjEsImdlbmRlciI6IiIsImhpdHNfcGVyX2RheSI6MTAwMDAwMDAwLCJoaXRzX3Blcl9tb250aCI6MTAwMDAwMDAwLCJpZCI6IjIzMTYyMjEiLCJpc19tb2QiOmZhbHNlLCJpc19zeXN0ZW1fa2V5IjpmYWxzZSwiaXNfdHJ1c3RlZCI6ZmFsc2UsInBpbiI6IlZLR0dPUVNFIiwicm9sZXMiOltdLCJ0ZW5hbnQiOiJ0dmRiIiwidXVpZCI6IiJ9.PrC4ZBRg9htCVABLOJKb8A3oeukD0PFvReeZMmFj3_EHzcMmJ5qDfRmXPgaT3pmFzjWVPBW4tNKutTunTrNbjQX_YMXXsu4kEGlj49L82tlYJEM3pla0D7LNlJIoVh7r8VNAaOxWxQjtuwV1mYu3d06cvrqVYemCQMu1M8ZWx27wRCsuhaBb5ln4qrFDedrPUz2kt_ZmJKH_9G_eOAhhN_MtJX9iqEtXxZY0Lzpx8u32jogOazIvfk7ob4rgdudci7GMvKXiDPuui92Wan4qs8wi_KCx7ml7J_ud7KGUGA8AAZr0I-nYk5r5n00-fBTVbaswl8YU2yHCpJcLUU37HuDmNNKpm_bld0bkZ5RUD6Rxd4O6c5JwUudknHJ24SoQ5smEBGMIWeI0-GsPAHXpVmzv1Z7VwFuqnMwaHRAAz1BPxR6Tjqgzn7QAUuuCUrOBk6Iz7tI5pDnoeNqFpJ-RChCWqnEDpzwmbRhSGMe6K6E_aYeHM4m4SdyObkX2aUx80djbDkis22j8fKkSKTonypC6mfYMx7yW-ZSFtQkVQHSnfxCvLjAozFuiD-ssP8sNI2edMzs-Zj2yrWV_O_9lhNd-EGCI-lE5KQigVpEWuVSlLARPwoBY5fJroYBD0cja2rP1U2Z6t7kOhewBfh2vPY1jm7vsEZ1mG_5ZSJm7Sro';

      const payload = {
        apikey: apikey,
        pin: 'VKGGOUSEF',
      };
      console.log('payload to send: ', payload);

      const headers = {
        accept: 'application/json',
        Authorization: 'Bearer ' + authtoken,
      };
      console.log('headers to send: ', headers);

      const api_call_string =
        '/search?query=' + query + '&type=series&language=eng&limit=5';
      this.$tvdb
        .get(api_call_string, { headers })
        .then((response) => {
          console.log('response.data.data: ', response.data.data);
          this.shows = response.data.data;
        })
        .catch((error) => {
          console.log(error);
        });
    },
    addShow(showToAdd) {
      console.log('In addShow, show: ', showToAdd);

      const payload = {
        id: showToAdd.id,
        name: showToAdd.name,
      }
      const headers = {
        authorization: sessionStorage.getItem('token'),
      };

      this.$api
        .post('/api-test/add-show', payload, { headers })
        .then((res) => {
          console.log('Response from server: ', res);
        })
        .catch((err) => {
          console.log('Error: ', err);
        });
    },
  },
};
</script>
