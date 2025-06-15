// Test util for statement coverage between e2e and unit tests

export function coverageTestFunction(argA: boolean, numberA: number, numberB?: number): number {
  console.log('coverageTestFunction');

  let result = 0;

  if (argA) {
    result += 10;
  } else {
    result += 100;
  }

  result += numberA > 50 ? 1000 : 0;

  result += numberB || 0;

  return result;
}
