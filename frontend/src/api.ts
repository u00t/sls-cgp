export interface Item {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemPayload = Pick<Item, "name" | "description">;

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    const message = text || response.statusText || "Request failed";
    throw new Error(message);
  }

  if (response.status === 204) {
    // No content responses (e.g., DELETE) don't have a body to parse.
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listItems(): Promise<Item[]> {
  const data = await request<{ items?: Item[] }>("/items");
  return data.items ?? [];
}

export async function createItem(payload: ItemPayload): Promise<Item> {
  return request<Item>("/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateItem(
  id: string,
  payload: ItemPayload,
): Promise<Item> {
  const data = await request<{ attributes?: Item }>(`/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!data.attributes) {
    throw new Error("Update response did not include attributes.");
  }
  return data.attributes;
}

export async function deleteItem(id: string): Promise<void> {
  await request<void>(`/items/${id}`, { method: "DELETE" });
}
