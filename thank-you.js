(function () {
  const input = document.getElementById("founderNameTY");
  const btn = document.getElementById("addFounderBtn");
  const msg = document.getElementById("statusMsg");

  if (!input || !btn || !msg) return;

  function setMsg(text, isError = false) {
    msg.textContent = text;
    msg.style.color = isError ? "rgba(255,180,180,.9)" : "";
  }

  function cleanName(s) {
    return String(s || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 32);
  }

  async function addFounder() {
    const name = cleanName(input.value);

    if (name.length < 2) {
      setMsg("Please enter at least 2 characters.", true);
      return;
    }

    setMsg("");
    btn.disabled = true;

    const { error } = await supabase.from("founders").insert([{ name }]);

    btn.disabled = false;

    if (error) {
      const text = (error.message || "").toLowerCase();

      if (text.includes("duplicate") || text.includes("unique")) {
        setMsg("That name is already on the wall. Try a different one.", true);
      } else if (text.includes("check constraint") || text.includes("violates")) {
        setMsg("Unsupported characters. Try letters/numbers/spaces/dot/underscore/dash.", true);
      } else {
        setMsg("Couldn’t add you right now. Try again in a moment.", true);
      }
      return;
    }

    setMsg("Added. Welcome to nothing. Redirecting…");
    setTimeout(() => (window.location.href = "./founders.html"), 700);
  }

  btn.addEventListener("click", addFounder);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addFounder();
  });
})();
