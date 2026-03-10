export function chunkText(text: string): string[] {
  return text.split("\n").map((line) => line + "\n");
}
