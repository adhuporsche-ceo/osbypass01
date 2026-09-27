/**
 * Resilient API client for Distrobyetz OS Guardian
 * Ensures all API calls parse JSON safely and never throw HTML doctype syntax errors.
 */

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    
    // Validate Content-Type
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.warn(`[safeFetchJson] Warning: Expected JSON from ${url}, received: ${contentType}`);
      return null;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn(`[safeFetchJson] HTTP ${res.status} from ${url}:`, errData);
      return null;
    }

    const data: T = await res.json();
    return data;
  } catch (err) {
    console.warn(`[safeFetchJson] Fetch failed for ${url}:`, err);
    return null;
  }
}
