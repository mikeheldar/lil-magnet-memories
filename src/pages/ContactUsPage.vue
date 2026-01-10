<template>
  <q-page class="contact-us-page q-pa-lg">
    <div class="page-container">
      <div class="text-h4 text-center q-mb-lg text-primary">Contact Us</div>
      <div class="text-body1 text-center text-grey-7 q-mb-xl">
        We'd love to hear from you! Get in touch with any questions or feedback.
      </div>

      <q-card class="contact-card">
        <q-card-section>
          <div class="row q-col-gutter-lg">
            <div class="col-12 col-md-6">
              <div class="text-h6 q-mb-md">Get in Touch</div>
              <div class="q-mb-md">
                <q-icon name="email" size="24px" class="q-mr-sm text-primary" />
                <a href="mailto:info@lilmagnetmemories.com" class="text-body1">
                  info@lilmagnetmemories.com
                </a>
              </div>
              <div class="q-mb-md">
                <q-icon name="phone" size="24px" class="q-mr-sm text-primary" />
                <span class="text-body1">(078) 793-7384</span>
              </div>
              <div class="q-mt-lg">
                <div class="text-h6 q-mb-md">Follow Us</div>
                <a
                  href="https://www.instagram.com/lilmagnetmemories"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="instagram-link"
                >
                  <q-icon name="camera_alt" size="24px" class="q-mr-sm" />
                  <span class="text-body1">@lilmagnetmemories</span>
                </a>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-h6 q-mb-md">Send Us a Message</div>
              <p class="text-body2 text-grey-7">
                For the fastest response, please email us directly or reach out
                on Instagram. We typically respond within 24-48 hours.
              </p>
              <p class="text-body2 text-grey-7 q-mt-md">
                If you're at a market event, feel free to stop by our booth and
                say hello!
              </p>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'ContactUsPage',
};
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
}

.contact-card {
  margin-top: 2rem;
}

.instagram-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;
}

.instagram-link:hover {
  opacity: 0.8;
}
</style>
