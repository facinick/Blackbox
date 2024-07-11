function containsNumber(str: string) {
  return /\d/.test(str);
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function areEqualSets<T>(set1: Set<T>, set2: Set<T>): boolean {
  return (
    // short circuit for early return
    set1.size === set2.size && [...set1].every((val) => set2.has(val))
  );
}

function aNotInB<T>(set1: Set<T>, set2: Set<T>): T[] {
  const a = Array.from(set1);
  const b = Array.from(set2);

  const diff = a.filter((x) => !b.includes(x));

  return diff;
}

async function withRetry<T>(
  func: () => Promise<T>,
  maxAttempts: number = 3,
  intervalMs: number = 3_000,
): Promise<T> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      return await func();
    } catch (error) {
      attempts++;
      if (attempts < maxAttempts) {
        await sleep(intervalMs);
      }
    }
  }
  throw new Error('Max retry attempts reached');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function sleep(durationMs: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

export {
  containsNumber,
  capitalizeFirstLetter,
  areEqualSets,
  aNotInB,
  withRetry,
  clamp,
};
