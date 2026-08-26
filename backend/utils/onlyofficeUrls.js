/**
 * The OnlyOffice Document Server container fetches document URLs and posts
 * callbacks itself — server-to-server, not through the browser — so
 * "localhost" in those URLs would resolve to the container's own loopback,
 * not this machine. host.docker.internal is Docker Desktop's DNS name for
 * reaching the host from inside a container. Local dev only.
 */
export function toContainerReachableUrl(browserUrl) {
  try {
    const parsed = new URL(browserUrl);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      parsed.hostname = "host.docker.internal";
    }
    return parsed.origin;
  } catch {
    return browserUrl;
  }
}

// The backend's own base URL, as reachable FROM the Document Server
// container. Falls back to the backend's own port (5000) since there's no
// browser-facing NEXT_PUBLIC_BASEURL to read on the server side.
export const CONTAINER_BASE_URL = toContainerReachableUrl(
  process.env.BACKEND_BASEURL || "http://localhost:5000"
);
