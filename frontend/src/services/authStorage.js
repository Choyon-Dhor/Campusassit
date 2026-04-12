export const AUTH_TOKEN_KEY = 'campusassist_token';
export const AUTH_USER_KEY = 'campusassist_user';

const readValue = (storage, key) => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const writeValue = (storage, key, value) => {
  try {
    storage.setItem(key, value);
  } catch {}
};

const removeValue = (storage, key) => {
  try {
    storage.removeItem(key);
  } catch {}
};

export const getStoredToken = () =>
  readValue(localStorage, AUTH_TOKEN_KEY) || readValue(sessionStorage, AUTH_TOKEN_KEY);

export const getStoredUser = () => {
  const rawUser = readValue(localStorage, AUTH_USER_KEY) || readValue(sessionStorage, AUTH_USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

export const persistAuth = (token, user, { remember = true } = {}) => {
  const primaryStorage = remember ? localStorage : sessionStorage;
  const secondaryStorage = remember ? sessionStorage : localStorage;

  removeValue(secondaryStorage, AUTH_TOKEN_KEY);
  removeValue(secondaryStorage, AUTH_USER_KEY);

  writeValue(primaryStorage, AUTH_TOKEN_KEY, token);
  writeValue(primaryStorage, AUTH_USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  removeValue(localStorage, AUTH_TOKEN_KEY);
  removeValue(localStorage, AUTH_USER_KEY);
  removeValue(sessionStorage, AUTH_TOKEN_KEY);
  removeValue(sessionStorage, AUTH_USER_KEY);
};
