// founders-wall.js
(function () {
  const sb = window.supabaseClient || window.sb || null;

  const listEl = document.getElementById("foundersList");
  const emptyEl = document.getElementById("fwEmpty");
  const countEl = document.getElementById("founderCount");
  const searchEl = document.getElementById("fwSearch");
  const sortBtn = document.getElementById("fwSortBtn");

  if (!sb || !listEl || !countEl) return;

  let all = [];
  let sortMode = (sortBtn?.dataset.sort || "newest"); // newest | oldest

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  }

  function render() {
    const q = (searchEl?.value || "").trim().toLowerCase();

    let items = all.slice();
    if (q) items = items.filter(x => (x.name || "").toLowerCase().includes(q));

    // sort
    items.sort((a, b) => {
      const da = new Date(a.created_at).getTime() || 0;
      const db = new Date(b.created_at).getTime() || 0;
      return sortMode === "oldest" ? da - db : db - da;
    });

    countEl.textContent = String(all.length);

    listEl.innerHTML = "";
    if (!items.length) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    for (const row of items) {
      const item = document.createElement("div");
      item.className = "fwItem";
      item.innerHTML = `
        <div class="fwItemName">${escapeHtml(row.name || "")}</div>
        <div class="fwItemMeta">${fmtDate(row.created_at)}</div>
      `;
      listEl.appendChild(item);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function load() {
    // Pobieramy z Supabase
    const { data, error } = await sb
      .from("founders")
      .select("name, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error(error);
      countEl.textContent = "0";
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }

    all = data || [];
    render();
  }

  // events
  searchEl?.addEventListener("input", render);

  sortBtn?.addEventListener("click", () => {
    sortMode = sortMode === "newest" ? "oldest" : "newest";
    sortBtn.dataset.sort = sortMode;
    sortBtn.textContent = sortMode === "newest" ? "Newest" : "Oldest";
    render();
  });

  load();
})();
