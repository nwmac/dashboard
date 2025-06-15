import { coverageTestFunction } from '@shell/utils/coverage';

describe('coverage unit test', () => {
  it('test 1', () => {
    expect(coverageTestFunction(false, 0, 1)).toBe(101);
  });
});
