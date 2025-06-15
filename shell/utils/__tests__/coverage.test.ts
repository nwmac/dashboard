import { shallowMount } from '@vue/test-utils';
import { coverageTestFunction } from '@shell/utils/coverage';
import CoverageTestComponent from '@shell/pages/coverageCheck.vue';

describe('coverage unit test', () => {
  it('test 1', () => {
    expect(coverageTestFunction(false, 0, 1)).toBe(101);
  });

  it('test component', () => {
    const wrapper = shallowMount(CoverageTestComponent, {});

    wrapper.vm.coverageTestFunction(false, 0, 1);
  });
});
