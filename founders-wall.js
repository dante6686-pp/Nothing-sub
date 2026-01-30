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

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

    // total count (all, not filtered)
    countEl.textContent = String(all.length);

    listEl.innerHTML = "";

    if (!items.length) {
      emptyEl && (emptyEl.style.display = "block");
      return;
    }
    emptyEl && (emptyEl.style.display = "none");

    items.forEach((row, idx) => {
      const item = document.createElement("div");

      const isTop10 = idx < 10;
      const isFirstEver = idx === items.length - 1; // <-- UWAGA: to zależy od sortu.
      // Lepiej: "1st ever" = najstarszy rekord w OGÓLE. To nie zależy od sortu.
      // Zrobimy to poprawnie niżej.

      item.className = "fwItem" + (isTop10 ? " fwItemTop10" : "");

      item.innerHTML = `
        <div class="fwLeft">
          <div class="fwItemNameWrap">
            <div class="fwItemName">${escapeHtml(row.name || "")}</div>
            <span class="fwBadgeInline" style="display:none;">1st ever</span>
          </div>
        </div>
        <div class="fwRight">
          <div class="fwItemMeta">${fmtDate(row.created_at)}</div>
        </div>
      `;

      listEl.appendChild(item);
    });

    // ustaw "1st ever" dla NAJSTARSZEGO z ALL (niezależnie od sortu)
    const oldest = all.reduce((best, cur) => {
      const b = new Date(best.created_at).getTime() || Infinity;
      const c = new Date(cur.created_at).getTime() || Infinity;
      return c < b ? cur : best;
    }, all[0]);

    if (oldest && oldest.name) {
      // znajdź element po nazwie (pierwsze dopasowanie)
      const nodes = listEl.querySelectorAll(".fwItem");
      nodes.forEach((node) => {
        const nameEl = node.querySelector(".fwItemName");
        const badgeEl = node.querySelector(".fwBadgeInline");
        if (!nameEl || !badgeEl) return;
        if ((nameEl.textContent || "").trim() === (oldest.name || "").trim()) {
          badgeEl.style.display = "inline-flex";
        }
      });
    }
  }

  async function load() {
    const { data, error } = await sb
      .from("founders")
      .select("name, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error(error);
      countEl.textContent = "0";
      emptyEl && (emptyEl.style.display = "block");
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
