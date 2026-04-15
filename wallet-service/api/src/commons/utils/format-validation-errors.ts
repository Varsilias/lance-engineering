import { ValidationError } from '@nestjs/common';

export function formatValidationErrors(errors: ValidationError[]) {
  const flat: Array<{ field: string; errors: string[] }> = [];

  const walk = (e: ValidationError, path: string[] = []) => {
    const fieldPath = [...path, e.property].join('.');
    if (e.constraints) {
      flat.push({
        field: fieldPath
          .split('.')
          .map((p) => p.replace(/\[(\d+)\]/g, '_$1')) // normalize indexes like items[0] -> items_0
          .map((s) => s.replace(/([A-Z])/g, '_$1').toLowerCase()) // camel -> snake
          .join('.'),
        errors: Object.values(e.constraints),
      });
    }
    if (e.children?.length)
      e.children.forEach((child) => walk(child, [...path, e.property]));
  };

  errors.forEach((e) => walk(e));
  return flat;
}
