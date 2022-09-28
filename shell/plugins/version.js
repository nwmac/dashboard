import { setIsPrime } from '@shell/config/version';

export default async function({
  $axios
}) {

  try {
    const v = await $axios.get('/rancherversion');

    // TODO: Set value using setIsPrime
  } catch (e) {
    console.log('Failed to fetch Ranhcer Version', e); // eslint-disable-line no-console
  }
}
