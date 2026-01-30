// thank-you.js
(function () {
  const params = new URLSearchParams(location.search);

  // no default plan: direct entry -> home
  const planRaw = params.get("plan");
  const plan = (planRaw || "").toLowerCase();
  const allowedPlans = ["basic", "premium", "founder"];

  if (!allowedPlans.includes(plan)) {
    window.location.replace("./index.html");
    return;
  }

  const subId = params.get("sub") || "";
  const payer = params.get("payer") || "";
  const tx = params.get("tx") || "";

  const elSubtitle = document.getElementById("tySubtitle");
  const elLine = document.getElementById("tyLine");
  const elMeta = document.getElementById("tyMeta");

  // founder
  const founderBlock = document.getElementById("founderBlock");
  const founderName = document.getElementById("founderName");
  const saveFounderBtn = document.getElementById("saveFounderBtn");
  const founderStatus = document.getElementById("founderStatus");

  // email (basic/premium)
  const emailBlock = document.getElementById("emailBlock");
  const subEmail = document.getElementById("subEmail");
  const saveEmailBtn = document.getElementById("saveEmailBtn");
  const emailStatus = document.getElementById("emailStatus");

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
    },
  };

  const chosen = copy[plan] || copy.basic;
  if (elSubtitle) elSubtitle.textContent = chosen.subtitle;
  if (elLine) elLine.textContent = chosen.line;

  // meta line
  const metaBits = [];
  if (subId) metaBits.push(`Reference: ${subId}`);
  if (tx) metaBits.push(`TX: ${tx}`);
  if (payer) metaBits.push(`Payer: ${payer}`);
  if (elMeta) elMeta.textContent = metaBits.length ? metaBits.join(" · ") : "";

  function getSb() {
    return window.supabaseClient || window.sb || null;
  }

  // ---------- Founder saving ----------
  function normalizeName(input) {
    const cleaned = String(input || "").trim().replace(/\s+/g, " ").slice(0, 32);
    const key = cleaned.toLowerCase();
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

    if (saveFounderBtn) saveFounderBtn.disabled = true;
    if (founderStatus) founderStatus.textContent = "Adding you to the Wall…";

    const payload = { name: cleaned, name_key: key };
    const { error } = await sb.from("founders").insert(payload);

    if (error) {
      console.error(error);
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("duplicate") || msg.includes("unique")) {
        if (founderStatus) founderStatus.textContent = "That name is already on the wall. Try a different one.";
      } else {
        if (founderStatus) founderStatus.textContent = "Save failed: " + (error.message || "Unknown error");
      }
      if (saveFounderBtn) saveFounderBtn.disabled = false;
      return;
    }

    if (founderStatus) founderStatus.textContent = "Done. Welcome to the Wall of Nothing.";
    if (saveFounderBtn) saveFounderBtn.textContent = "Added ✓";
  }

  // ---------- Subscriber email saving ----------
  function normalizeEmail(input) {
    const cleaned = String(input || "").trim().toLowerCase().slice(0, 200);
    return { cleaned, key: cleaned };
  }

  function looksLikeEmail(e) {
    // quick & dirty, enough for now
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  async function saveSubscriberEmail() {
    const sb = getSb();
    if (!sb) {
      if (emailStatus) emailStatus.textContent = "Supabase not configured.";
      return;
    }

    const { cleaned, key } = normalizeEmail(subEmail?.value || "");

    if (!looksLikeEmail(cleaned)) {
      if (emailStatus) emailStatus.textContent = "Enter a valid email.";
      return;
    }

    if (saveEmailBtn) saveEmailBtn.disabled = true;
    if (emailStatus) emailStatus.textContent = "Subscribing you to nothing…";

    const payload = {
      email: cleaned,
      email_key: key,
      plan: plan,        // "basic" or "premium"
      status: "active",
    };

    const { error } = await sb.from("subscribers").insert(payload);

    if (error) {
      console.error(error);
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("duplicate") || msg.includes("unique")) {
        if (emailStatus) emailStatus.textContent = "This email is already subscribed to nothing.";
      } else {
        if (emailStatus) emailStatus.textContent = "Save failed: " + (error.message || "Unknown error");
      }
      if (saveEmailBtn) saveEmailBtn.disabled = false;
      return;
    }

    if (emailStatus) emailStatus.textContent = "Done. Nothing will arrive monthly.";
    if (saveEmailBtn) saveEmailBtn.textContent = "Saved ✓";
  }

  // ---------- UI rules ----------
  const isFounder = plan === "founder";
  const isSub = plan === "basic" || plan === "premium";

  if (founderBlock) founderBlock.style.display = isFounder ? "block" : "none";
  if (emailBlock) emailBlock.style.display = isSub ? "block" : "none";

  if (isFounder && saveFounderBtn) {
    saveFounderBtn.addEventListener("click", saveFounder);
    founderName?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveFounder();
    });
  }

  if (isSub && saveEmailBtn) {
    saveEmailBtn.addEventListener("click", saveSubscriberEmail);
    subEmail?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveSubscriberEmail();
    });
  }
})();
