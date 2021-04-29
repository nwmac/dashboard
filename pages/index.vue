<script>
// import { SEEN_WHATS_NEW } from '@/store/prefs';

export default {
  middleware({ redirect, store } ) {
    // TODO:
    // const seenWhatsNew = store.getters['prefs/get'](SEEN_WHATS_NEW);

    // if (!seenWhatsNew || !seenWhatsNew.length) {
    //   return redirect({ name: 'home' });
    // }

    const afterLoginRouteObject = store.getters['prefs/afterLoginRoute'];

    return redirect(afterLoginRouteObject);
  }
};
</script>
