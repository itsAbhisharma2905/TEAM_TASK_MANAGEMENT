export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const details = data.details?.fieldErrors;
    const firstFieldError = details ? Object.values(details).flat().find(Boolean) : null;
    throw new Error(firstFieldError ? String(firstFieldError) : data.error ?? "Request failed");
  }

  return data;
}
