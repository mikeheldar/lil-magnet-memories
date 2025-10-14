import { boot } from 'quasar/wrappers';

// Initialize Facebook SDK
export default boot(({ app }) => {
  // Load Facebook SDK
  window.fbAsyncInit = function () {
    window.FB.init({
      appId: '4054337747943866',
      cookie: true,
      xfbml: true,
      version: 'v21.0', // Latest version as of 2024
    });

    window.FB.AppEvents.logPageView();
  };

  // Load the SDK asynchronously
  (function (d, s, id) {
    var js,
      fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    fjs.parentNode.insertBefore(js, fjs);
  })(document, 'script', 'facebook-jssdk');

  // Make FB available globally in Vue components
  app.config.globalProperties.$fb = () => window.FB;
});
