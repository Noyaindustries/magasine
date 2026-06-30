import { toast } from "@/lib/toast";

/** Reads the JSON error message from an API response. */
export async function readApiError(
  res: Response,
  fallback = "Something went wrong"
): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string; message?: string };
    return data.error ?? data.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function toastNetworkError(message = "Network error. Please try again.") {
  toast.error(message);
}

/** Shows an error toast if the response is not OK. Returns true if OK. */
export async function toastIfNotOk(
  res: Response,
  fallback = "Something went wrong"
): Promise<boolean> {
  if (res.ok) return true;
  toast.error(await readApiError(res, fallback));
  return false;
}
