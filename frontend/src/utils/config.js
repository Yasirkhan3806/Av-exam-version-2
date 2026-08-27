// Single source of truth for the backend API origin. Previously redeclared
// inline as `process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000"` in
// ~47 files under varying local names (BASEURL, BASE_URL, BaseUrl, baseUrl,
// API_URL, BROWSER_BASE_URL) — changing the fallback or the env var name
// meant editing every one of them. Import BASEURL from here instead.
export const BASEURL = process.env.NEXT_PUBLIC_BASEURL || "http://localhost:5000";
