export const readCollection = (response, key) => {
  const value = response?.data?.[key];
  return Array.isArray(value) ? value : [];
};

export const readEntity = (response, key) => response?.data?.[key] ?? null;

export const readNumber = (response, key, fallback = 0) => {
  const value = response?.data?.[key];
  return typeof value === 'number' ? value : fallback;
};
