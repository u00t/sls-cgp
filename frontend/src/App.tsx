import { useEffect, useMemo, useState, type FormEventHandler } from "react";
import {
  createItem,
  deleteItem,
  listItems,
  updateItem,
  type Item,
  type ItemPayload,
} from "./api";

const emptyForm: ItemPayload = { name: "", description: "" };

const buttonBase =
  "inline-flex items-center gap-2 rounded-xl border font-semibold text-sm transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed";
const buttonSizes = {
  default: "px-4 py-3",
  small: "px-3 py-2 text-xs",
};
const primaryButton = `${buttonBase} border-emerald-400/50 bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-900 shadow-[0_12px_30px_rgba(16,185,129,0.35)] hover:shadow-[0_14px_36px_rgba(16,185,129,0.35)]`;
const ghostButton = `${buttonBase} border-white/10 bg-white/5 text-slate-200 hover:border-white/30`;
const dangerButton = `${buttonBase} border-rose-400/60 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20`;

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

  const handleCreate: FormEventHandler<HTMLFormElement> = async (e) => {
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#0f1a37,#030712_55%),radial-gradient(circle_at_80%_10%,#0a2b3f,transparent_35%),#020617]">
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-6 -top-24 h-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-12 text-slate-50">
          <header className="grid gap-4 rounded-2xl border border-white/10 bg-linear-to-br from-slate-900/80 via-slate-950 to-slate-900/70 p-8 shadow-2xl backdrop-blur xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400">
                  Serverless CRUD
                </p>
                <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                  SLS Guru Test Project
                </h1>
                <p className="max-w-2xl text-slate-400">{subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className={`${primaryButton} ${buttonSizes.default}`}
                  onClick={refresh}
                  disabled={loading}
                >
                  Refresh items
                </button>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                  {filteredItems.length} items tracked
                </div>
              </div>
            </div>
            <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">API base</span>
                  <span className="flex-1 rounded-lg bg-black/30 px-3 py-2 font-semibold text-slate-50">
                    {apiBase || "Same origin"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Status</span>
                  <span className="rounded-lg bg-black/30 px-3 py-2 font-semibold text-emerald-200">
                    {loading ? "Loading..." : "Live"}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  Configure{" "}
                  <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs text-emerald-200">
                    VITE_API_BASE
                  </code>{" "}
                  to point to your deployed API Gateway endpoint.
                </p>
              </div>
            </div>
          </header>

          <section className="grid gap-4 lg:grid-cols-2 mt-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400">
                    Create
                  </p>
                  <h2 className="text-xl font-semibold text-slate-50">
                    Add a new item
                  </h2>
                </div>
                <span className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-slate-300">
                  POST /items
                </span>
              </div>
              <form className="space-y-4" onSubmit={handleCreate}>
                <label className="block space-y-2 text-sm font-semibold text-slate-100">
                  <span>Name</span>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                    placeholder="e.g. Launch checklist"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </label>
                <label className="block space-y-2 text-sm font-semibold text-slate-100">
                  <span>Description</span>
                  <textarea
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                    placeholder="Why this item matters..."
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    rows={3}
                  />
                </label>
                <button
                  type="submit"
                  className={`${primaryButton} ${buttonSizes.default}`}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Create item"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400">
                    Inventory
                  </p>
                  <h2 className="text-xl font-semibold text-slate-50">
                    Items dashboard
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    className="w-full min-w-[200px] max-w-xs rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                    placeholder="Filter items..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <button
                    className={`${ghostButton} ${buttonSizes.default}`}
                    onClick={refresh}
                    disabled={loading}
                    type="button"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-rose-400/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-center text-slate-300">
                  Loading items...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-center text-slate-300">
                  <p className="font-semibold">No items yet.</p>
                  <p className="text-sm text-slate-400">
                    Create your first record to see it appear here.
                  </p>
                </div>
              ) : (
                <ul className="grid gap-3">
                  {filteredItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-4 shadow-sm md:flex-row md:items-start md:justify-between"
                    >
                      <div className="flex-1 space-y-2">
                        {editingId === item.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                              value={editDraft.name}
                              onChange={(e) =>
                                setEditDraft((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                            />
                            <textarea
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
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
                            <div className="text-lg font-semibold text-slate-50">
                              {item.name}
                            </div>
                            {item.description && (
                              <p className="text-sm text-slate-400">
                                {item.description}
                              </p>
                            )}
                          </>
                        )}
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                          Updated {new Date(item.updatedAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {editingId === item.id ? (
                          <>
                            <button
                              className={`${primaryButton} ${buttonSizes.small}`}
                              onClick={() => saveEdit(item.id)}
                              disabled={saving}
                              type="button"
                            >
                              Save
                            </button>
                            <button
                              className={`${ghostButton} ${buttonSizes.small}`}
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
                              className={`${ghostButton} ${buttonSizes.small}`}
                              onClick={() => startEdit(item)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className={`${dangerButton} ${buttonSizes.small}`}
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
      </div>
    </div>
  );
}

export default App;
