/* eslint-disable no-useless-escape */
export function toSnakeCaseKeys<T = any>(input: any): T {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map((v) => toSnakeCaseKeys(v)) as any;
  if (typeof input !== 'object' || input instanceof Date) return input;

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    const snake = k
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // camelCase → camel_case
      .replace(/[\s\-]+/g, '_')
      .toLowerCase();
    out[snake] = toSnakeCaseKeys(v);
  }
  return out as T;
}
