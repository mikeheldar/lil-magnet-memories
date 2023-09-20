<template>
  <q-page class="flex flex-top">
    <div class="col about">
      <h3 class="header">About SpoilerAlert</h3>
      <p>
        Welcome to SpoilerAlert, a platform created by TV show enthusiasts for
        TV show enthusiasts. Our mission is to provide a space where fans can
        discuss TV shows episode by episode without fear of spoilers. Whether
        you're a die-hard binge-watcher or someone who enjoys savoring each
        episode, SpoilerAlert is the place for you.
      </p>
      <p>
        <strong>Our Vision:</strong> We believe in building a thriving community
        around synchronous media culture. We understand the challenges of
        avoiding spoilers while discussing your favorite shows, and we're here
        to solve that problem.
      </p>
      <p>
        <strong>Founders:</strong> SpoilerAlert was founded by Michael
        Helman-Darley, and Richard Smiley, affectionately known as "Smiley," who
        passionately built the first two versions of the site. Smiley was deeply
        committed to bringing people together through TV shows. Tragically, he
        struggled with depression and is no longer with us. Michael is dedicated
        to realizing Smiley's dream and bringing this platform to the world.
      </p>
      <p>
        Join SpoilerAlert today to connect with fellow TV show enthusiasts,
        share your thoughts, and explore the world of TV shows like never
        before. Say goodbye to accidental spoilers and hello to meaningful
        discussions!
      </p>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'AboutPage',
};
</script>

<style lang="scss">
.header {
  color: $primary;
  padding: 10px;
  left: 10px;
  text-align: top;
  font-size: 20px;
  font-weight: bold;
}

.about {
  padding-top: 10px;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 10px;
}
</style>
