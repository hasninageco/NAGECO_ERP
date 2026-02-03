const rawBase = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const API_BASE = rawBase.replace(/\/$/, "");

/**
 * Joins API_BASE with a path segment, ensuring a single slash.
 */
export const buildApiUrl = (path = "") => {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

export { API_BASE };
