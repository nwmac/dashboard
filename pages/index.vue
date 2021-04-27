<script>
// import { seenWhatsNewAlready } from '@/utils/version';

export default {
  middleware({ redirect, store } ) {

    // TODO - do we want to do this?
    // const hasSeenWhatsNew = seenWhatsNewAlready(store);

    // // Take the user back to the home page if they have not seen the release notes
    // if (!hasSeenWhatsNew) {
    //   return redirect({ name: 'home' });
    // }

    const afterLoginRouteObject = store.getters['prefs/afterLoginRoute'];

    return redirect(afterLoginRouteObject);
  }
};
</script>
