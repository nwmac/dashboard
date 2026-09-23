import { mount, VueWrapper } from '@vue/test-utils';
import ExtensionUrlDropZone from '@shell/pages/c/_cluster/uiplugins/ExtensionUrlDropZone.vue';

const OVERLAY = '[data-testid="extensions-url-drop-overlay"]';

const dragEvent = (type: string, data: Record<string, string> = { 'text/uri-list': 'https://github.com/owner/repo' }, types = Object.keys(data)) => {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperty(event, 'dataTransfer', { value: { types, getData: (t: string) => data[t] || '' } });

  return event;
};

describe('component: ExtensionUrlDropZone', () => {
  let wrapper: VueWrapper<any>;
  let store: any;

  const mountComponent = (props = {}, showModal = false) => {
    store = {
      state:    { 'action-menu': { showModal } },
      dispatch: jest.fn(),
    };

    wrapper = mount(ExtensionUrlDropZone, {
      props,
      global: { provide: { store } },
    });

    return wrapper;
  };

  const fire = async(event: Event) => {
    document.body.dispatchEvent(event);
    await wrapper.vm.$nextTick();

    return event;
  };

  afterEach(() => {
    wrapper?.unmount();
  });

  it('should not show the overlay initially', () => {
    mountComponent();

    expect(wrapper.find(OVERLAY).exists()).toBe(false);
  });

  it('should show the overlay when a URL is dragged over the page', async() => {
    mountComponent();

    await fire(dragEvent('dragenter'));

    expect(wrapper.find(OVERLAY).exists()).toBe(true);
  });

  it('should keep the overlay while dragging between nested elements', async() => {
    mountComponent();

    await fire(dragEvent('dragenter'));
    await fire(dragEvent('dragenter'));
    await fire(dragEvent('dragleave'));

    expect(wrapper.find(OVERLAY).exists()).toBe(true);
  });

  it('should hide the overlay when the drag leaves the page', async() => {
    mountComponent();

    await fire(dragEvent('dragenter'));
    await fire(dragEvent('dragleave'));

    expect(wrapper.find(OVERLAY).exists()).toBe(false);
  });

  it('should not show the overlay when a file is dragged', async() => {
    mountComponent();

    await fire(dragEvent('dragenter', {}, ['Files']));

    expect(wrapper.find(OVERLAY).exists()).toBe(false);
  });

  it('should not show the overlay when disabled', async() => {
    mountComponent({ disabled: true });

    await fire(dragEvent('dragenter'));

    expect(wrapper.find(OVERLAY).exists()).toBe(false);
  });

  it('should not show the overlay when a dialog is open', async() => {
    mountComponent({}, true);

    await fire(dragEvent('dragenter'));

    expect(wrapper.find(OVERLAY).exists()).toBe(false);
  });

  it('should not show the overlay for drags that started in the page', async() => {
    mountComponent();

    await fire(new Event('dragstart', { bubbles: true }));
    await fire(dragEvent('dragenter'));

    expect(wrapper.find(OVERLAY).exists()).toBe(false);
  });

  it('should accept drags again once an internal drag has ended', async() => {
    mountComponent();

    await fire(new Event('dragstart', { bubbles: true }));
    await fire(new Event('dragend', { bubbles: true }));
    await fire(dragEvent('dragenter'));

    expect(wrapper.find(OVERLAY).exists()).toBe(true);
  });

  it('should allow a URL to be dropped', async() => {
    mountComponent();

    const event = await fire(dragEvent('dragover'));

    expect(event.defaultPrevented).toBe(true);
  });

  it('should not allow a file to be dropped', async() => {
    mountComponent();

    const event = await fire(dragEvent('dragover', {}, ['Files']));

    expect(event.defaultPrevented).toBe(false);
  });

  it('should emit the dropped URL and hide the overlay', async() => {
    mountComponent();

    await fire(dragEvent('dragenter'));
    const event = await fire(dragEvent('drop'));

    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.emitted('drop')).toStrictEqual([['https://github.com/owner/repo']]);
    expect(wrapper.find(OVERLAY).exists()).toBe(false);
  });

  it('should show an error if the dropped text is not a URL', async() => {
    mountComponent();

    await fire(dragEvent('drop', { 'text/plain': 'not a url' }));

    expect(wrapper.emitted('drop')).toBeUndefined();
    expect(store.dispatch).toHaveBeenCalledWith('growl/error', {
      title:   'plugins.installFromUrl.error.title',
      message: 'plugins.installFromUrl.error.invalidUrl',
      timeout: 5000,
    }, { root: true });
  });

  it('should not emit when disabled', async() => {
    mountComponent({ disabled: true });

    const event = await fire(dragEvent('drop'));

    expect(event.defaultPrevented).toBe(false);
    expect(wrapper.emitted('drop')).toBeUndefined();
  });

  it('should stop listening to the document when unmounted', async() => {
    mountComponent();
    wrapper.unmount();

    const event = dragEvent('drop');

    document.body.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
