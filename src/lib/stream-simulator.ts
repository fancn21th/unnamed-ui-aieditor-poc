export interface StreamSimulatorOptions {
  minChunkSize?: number;
  maxChunkSize?: number;
  delayMs?: number;
  delayJitter?: number;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function* createStreamSimulator(
  text: string,
  options?: StreamSimulatorOptions,
): AsyncGenerator<string> {
  const minChunkSize = options?.minChunkSize ?? 1;
  const maxChunkSize = options?.maxChunkSize ?? 20;
  const delayMs = options?.delayMs ?? 50;
  const delayJitter = options?.delayJitter ?? 30;

  let offset = 0;
  while (offset < text.length) {
    const chunkSize = randomInt(minChunkSize, maxChunkSize);
    const chunk = text.slice(offset, offset + chunkSize);
    offset += chunkSize;

    const jitter = randomInt(-delayJitter, delayJitter);
    const waitMs = Math.max(0, delayMs + jitter);
    await sleep(waitMs);

    yield chunk;
  }
}
