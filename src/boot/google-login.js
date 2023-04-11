import { boot } from 'quasar/wrappers';
import vue3GoogleLogin from 'vue3-google-login';


export default boot(({ app }) => {
  // for use inside Vue files through this.$eventbus
  app.use(vue3GoogleLogin, {
    clientId:
      '483299815090-0c487kh6kslbf31j3b2m5c7seij8e2gq.apps.googleusercontent.com',
  });
});
