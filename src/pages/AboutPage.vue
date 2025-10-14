<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="text-h4 text-purple q-mb-md text-weight-bold">
          About Spoiler Alert
        </div>
        <div class="text-subtitle2 text-grey-7 q-mb-lg">
          Watch together. Discuss freely. No spoilers.
        </div>

        <!-- Mission Card -->
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="tv" class="q-mr-sm" />
              Our Mission
            </div>
            <p class="text-body1">
              Spoiler Alert is where TV lovers come together to discuss their
              favorite shows—episode by episode—without worrying about spoilers.
            </p>
            <p class="text-body1">
              Whether you're binge-watching or savoring one episode at a time,
              connect with friends who are on the same episode and share your
              thoughts freely.
            </p>
          </q-card-section>
        </q-card>

        <!-- Features Card -->
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="stars" class="q-mr-sm" />
              What Makes Us Special
            </div>
            <q-list>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="shield" color="purple" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium"
                    >Spoiler-Free</q-item-label
                  >
                  <q-item-label caption
                    >Only see discussions from people on the same episode or
                    behind you</q-item-label
                  >
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="people" color="purple" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium"
                    >Watch with Friends</q-item-label
                  >
                  <q-item-label caption
                    >Connect with friends and discover what shows you're both
                    watching</q-item-label
                  >
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="track_changes" color="purple" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium"
                    >Track Your Progress</q-item-label
                  >
                  <q-item-label caption
                    >Keep track of which episodes you've watched and what's
                    next</q-item-label
                  >
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="forum" color="purple" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium"
                    >Episode Discussions</q-item-label
                  >
                  <q-item-label caption
                    >Share reactions, theories, and thoughts with your
                    community</q-item-label
                  >
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Story Card -->
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="favorite" class="q-mr-sm" />
              Our Story
            </div>
            <p class="text-body1">
              Spoiler Alert was founded by
              <strong>Michael Helman-Darley</strong> and
              <strong>Richard "Smiley" Smiley</strong>, who built the first two
              versions with passion and dedication.
            </p>
            <p class="text-body1">
              Smiley believed deeply in the power of TV shows to bring people
              together. He envisioned a platform where fans could share their
              love for shows without the fear of spoilers ruining the
              experience.
            </p>
            <p class="text-body1">
              Tragically, Smiley struggled with depression and is no longer with
              us. Michael continues to build Spoiler Alert in his honor,
              committed to realizing their shared dream of creating a community
              where TV lovers can connect, discuss, and enjoy shows together.
            </p>
            <div class="text-body2 text-italic text-grey-7 q-mt-md">
              This platform is dedicated to Smiley's memory and his vision of
              bringing people together through the stories we love.
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'AboutPage',
};
</script>
