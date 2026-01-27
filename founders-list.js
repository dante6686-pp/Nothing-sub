// founders-list.js
(async function () {
  const listEl = document.getElementById("foundersList");
  const countEl = document.getElementById("foundersCount");
  const emptyEl = document.getElementById("foundersEmpty");
  if (!listEl || !countEl) return;

  const { data, error } = await supabase
    .from("founders")
    .select("name, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    emptyEl.style.display = "block";
    emptyEl.textContent = "Couldn’t load the wall. (Still nothing, though.)";
    return;
  }

  const founders = data || [];
  countEl.textContent = String(founders.length);

  listEl.innerHTML = "";
  if (founders.length === 0) {
    emptyEl.style.display = "block";
    return;
  }
  emptyEl.style.display = "none";

  for (const f of founders) {
    const li = document.createElement("li");
    li.className = "founderItem";

    const name = document.createElement("span");
    name.textContent = f.name;

    const meta = document.createElement("span");
    meta.className = "muted founderMeta";
    const d = f.created_at ? new Date(f.created_at) : null;
    meta.textContent = d && !isNaN(d) ? d.toLocaleDateString() : "";

    li.appendChild(name);
    li.appendChild(meta);
    listEl.appendChild(li);
  }
})();
