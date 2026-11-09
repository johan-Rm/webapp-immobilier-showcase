export const toCamelCase = (value: string) => value.charAt(0).toLowerCase() + value.slice(1)

export const toSnakeCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
