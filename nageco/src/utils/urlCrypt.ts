export const encode = (v: string) => {
  try {
    return btoa(encodeURIComponent(v));
  } catch (e) {
    return v;
  }
};

export const decode = (s: string) => {
  try {
    return decodeURIComponent(atob(s));
  } catch (e) {
    return s;
  }
};
