import { boot } from 'quasar/wrappers';
import hello from 'hellojs';

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api
  hello.init({
    facebook: '4054337747943866',
  });

  app.config.globalProperties.$hello = hello;
});
