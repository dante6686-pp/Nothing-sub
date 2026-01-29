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

  // copy per plan
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
    }
  };

  const chosen = copy[plan] || copy.basic;
  elSubtitle.textContent = chosen.subtitle;
  elLine.textContent = chosen.line;

  // meta line (optional)
  const metaBits = [];
  if (subId) metaBits.push(`Reference: ${subId}`);
  if (tx) metaBits.push(`TX: ${tx}`);
  if (payer) metaBits.push(`Payer: ${payer}`);
  elMeta.textContent = metaBits.length ? metaBits.join(" · ") : "";

  // founder-only UI
  const isFounder = plan === "founder";
  if (isFounder) founderBlock.style.display = "block";

  // If no supabase client configured, don't blow up
  function getSb() {
    // support either `window.supabaseClient` or `window.sb`
    return window.supabaseClient || window.sb || null;
  }

  async function saveFounder() {
    const sb = getSb();
    if (!sb) {
      founderStatus.textContent = "Supabase not configured on this page yet.";
      return;
    }

    const raw = (founderName.value || "").trim();

    // small validation
    if (raw.length < 2) {
      founderStatus.textContent = "Name is too short. Give it at least 2 characters.";
      return;
    }
    if (raw.length > 32) {
      founderStatus.textContent = "Name is too long. Max 32 characters.";
      return;
    }

    saveBtn.disabled = true;
    founderStatus.textContent = "Adding you to the Wall…";

    // IMPORTANT: change table name here if yours is different
    const payload = { name: raw };

    const { data, error } = await sb.from("founders").insert(payload);

    if (error) {
      console.error(error);
      founderStatus.textContent =
        "Save failed: " + (error.message || "Unknown error");
      saveBtn.disabled = false;
      return;
    }

    founderStatus.textContent = "Done. Welcome to the Wall of Nothing.";
    saveBtn.textContent = "Added ✓";
  }

  if (isFounder && saveBtn) {
    saveBtn.addEventListener("click", saveFounder);
    founderName?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveFounder();
    });
  }
})();
