import { boot } from 'quasar/wrappers';
import { EventBus } from 'quasar';

const eventbus = new EventBus();

export default boot(({ app }) => {
  // for use inside Vue files through this.$eventbus
  app.config.globalProperties.$eventbus = eventbus;
});

export { eventbus };
