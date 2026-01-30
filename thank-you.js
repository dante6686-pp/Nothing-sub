// thank-you.js
(function () {
  const params = new URLSearchParams(location.search);
  const plan = (params.get("plan") || "basic").toLowerCase();
  const subId = params.get("sub") || "";
  const payer = params.get("payer") || ""; // optional
  const tx = params.get("tx") || "";       // optional

  const elSubtitle = document.getElementById("tySubtitle");
  const elLine = document.getElementById("tyLine");
  const elMeta = document.getElementById("tyMeta");

  const founderBlock = document.getElementById("founderBlock");
  const founderName = document.getElementById("founderName");
  const saveBtn = document.getElementById("saveFounderBtn");
  const founderStatus = document.getElementById("founderStatus");

  // Copy per plan
  const copy = {
    basic: {
      subtitle: "$1 / month — a quiet commitment to absolutely nothing.",
      line: "You’re subscribed to Nothing Basic. Nothing will occur monthly until you cancel.",
    },
    premium: {
      subtitle: "$2 / month — the same nothing, delivered with unnecessary elegance.",
      line: "You’re subscribed to Nothing Premium. Silence, but make it posh.",
    },
    founder: {
      subtitle: "$4 one-time — you didn’t buy anything. You claimed a place on the Wall.",
      line: "Payment received. Choose a name and join the Founder Wall.",
    },
  };

  const chosen = copy[plan] || copy.basic;
  if (elSubtitle) elSubtitle.textContent = chosen.subtitle;
  if (elLine) elLine.textContent = chosen.line;

  // Meta line (optional)
  const metaBits = [];
  if (subId) metaBits.push(`Reference: ${subId}`);
  if (tx) metaBits.push(`TX: ${tx}`);
  if (payer) metaBits.push(`Payer: ${payer}`);
  if (elMeta) elMeta.textContent = metaBits.length ? metaBits.join(" · ") : "";

  // Founder-only UI
  const isFounder = plan === "founder";
  if (isFounder && founderBlock) founderBlock.style.display = "block";

  function getSb() {
    return window.supabaseClient || window.sb || null;
  }

  function normalizeName(input) {
    // trim + collapse spaces, then clamp length
    const cleaned = String(input || "").trim().replace(/\s+/g, " ").slice(0, 32);
    const key = cleaned.toLowerCase(); // used for uniqueness
    return { cleaned, key };
  }

  async function saveFounder() {
    const sb = getSb();
    if (!sb) {
      if (founderStatus) founderStatus.textContent = "Supabase not configured on this page yet.";
      return;
    }

    const raw = founderName?.value || "";
    const { cleaned, key } = normalizeName(raw);

    if (cleaned.length < 2) {
      if (founderStatus) founderStatus.textContent = "Name is too short. Give it at least 2 characters.";
      return;
    }

    if (saveBtn) saveBtn.disabled = true;
    if (founderStatus) founderStatus.textContent = "Adding you to the Wall…";

    // Requires DB changes:
    // - founders.name_key (text)
    // - unique index on founders.name_key
    const payload = {
      name: cleaned,
      name_key: key,
    };

    const { error } = await sb.from("founders").insert(payload);

    if (error) {
      console.error(error);

      const msg = (error.message || "").toLowerCase();
      if (msg.includes("duplicate") || msg.includes("unique")) {
        if (founderStatus) founderStatus.textContent = "That name is already on the wall. Try a different one.";
      } else {
        if (founderStatus) founderStatus.textContent = "Save failed: " + (error.message || "Unknown error");
      }

      if (saveBtn) saveBtn.disabled = false;
      return;
    }

    if (founderStatus) founderStatus.textContent = "Done. Welcome to the Wall of Nothing.";
    if (saveBtn) saveBtn.textContent = "Added ✓";

    // Optional: jump to wall after a moment
    // setTimeout(() => (window.location.href = "./founders.html"), 700);
  }

  if (isFounder && saveBtn) {
    saveBtn.addEventListener("click", saveFounder);
    founderName?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveFounder();
    });
  }
})();
