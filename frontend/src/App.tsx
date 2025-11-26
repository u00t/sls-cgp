import { useEffect, useMemo, useState } from "react";
import {
  createItem,
  deleteItem,
  listItems,
  updateItem,
  type Item,
  type ItemPayload,
} from "./api";
import "./App.css";

const emptyForm: ItemPayload = { name: "", description: "" };

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ItemPayload>(emptyForm);
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ItemPayload>(emptyForm);

  const apiBase =
    (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ??
    "";

  const subtitle = useMemo(() => {
    if (apiBase) {
      return `Connected to ${apiBase}`;
    }
    return "Ready to talk to your deployed serverless CRUD API";
  }, [apiBase]);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listItems();
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load items. Check your API base URL."
      );
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    key: keyof ItemPayload,
    value: ItemPayload[keyof ItemPayload]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createItem({
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
      });

      refresh();
      // setItems((prev) => [created, ...prev]);
      setForm(emptyForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create item. Check your API base URL."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditDraft({ name: item.name, description: item.description });
  };

  const saveEdit = async (id: string) => {
    if (!editDraft.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateItem(id, {
        name: editDraft.name.trim(),
        description: editDraft.description?.trim() || undefined,
      });

      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));

      setEditingId(null);
      setEditDraft(emptyForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update item. Check your API base URL."
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setSaving(true);
    setError(null);

    try {
      await deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete item. Check your API base URL."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.description ?? "").toLowerCase().includes(term)
    );
  }, [items, filter]);

  return (
    <div className="page">
      <header className="hero w-full">
        <div className="w-full">
          <p className="eyebrow">Serverless CRUD</p>
          <h1>SLS Guru Test Project</h1>
          <p className="subtitle">{subtitle}</p>
          <div className="hero-actions">
            <button className="cta" onClick={refresh} disabled={loading}>
              Refresh items
            </button>
            <div className="meta">
              <span className="dot" /> {filteredItems.length} items tracked
            </div>
          </div>
        </div>
        <div className="hero-card">
          <div className="flex gap-1">
            <span className="w-20">API base</span>
            <strong className="flex-1">{apiBase || "Same origin"}</strong>
          </div>
          <div className="flex">
            <span className="w-20">Status</span>
            <strong>{loading ? "Loading..." : "Live"}</strong>
          </div>
          <p className="muted">
            Configure <code>VITE_API_BASE</code> in your environment to point at
            the deployed API Gateway endpoint.
          </p>
        </div>
      </header>

      <section className="panel-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Create</p>
              <h2>Add a new item</h2>
            </div>
            <span className="helper">POST /items</span>
          </div>
          <form className="form" onSubmit={handleCreate}>
            <label>
              Name
              <input
                type="text"
                placeholder="e.g. Launch checklist"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </label>
            <label>
              Description
              <textarea
                placeholder="Why this item matters..."
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </label>
            <button type="submit" className="cta" disabled={saving}>
              {saving ? "Saving..." : "Create item"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2>Items dashboard</h2>
            </div>
            <div className="filters">
              <input
                type="search"
                placeholder="Filter items..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <button className="ghost" onClick={refresh} disabled={loading}>
                ↻
              </button>
            </div>
          </div>
          {error && <div className="alert">{error}</div>}
          {loading ? (
            <div className="empty">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="empty">
              <p>No items yet.</p>
              <p className="muted">
                Create your first record to see it appear here.
              </p>
            </div>
          ) : (
            <ul className="item-list">
              {filteredItems.map((item) => (
                <li key={item.id} className="item">
                  <div className="item-main">
                    {editingId === item.id ? (
                      <div className="edit-fields">
                        <input
                          type="text"
                          value={editDraft.name}
                          onChange={(e) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                        <textarea
                          value={editDraft.description ?? ""}
                          onChange={(e) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          rows={2}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="item-title">{item.name}</div>
                        {item.description && (
                          <p className="muted">{item.description}</p>
                        )}
                      </>
                    )}
                    <div className="meta">
                      <span className="dot" />
                      Updated {new Date(item.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="item-actions">
                    {editingId === item.id ? (
                      <>
                        <button
                          className="cta small"
                          onClick={() => saveEdit(item.id)}
                          disabled={saving}
                          type="button"
                        >
                          Save
                        </button>
                        <button
                          className="ghost small"
                          onClick={() => {
                            setEditingId(null);
                            setEditDraft(emptyForm);
                          }}
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="ghost small"
                          onClick={() => startEdit(item)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="danger small"
                          onClick={() => remove(item.id)}
                          disabled={saving}
                          type="button"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
