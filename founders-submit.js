// founders-submit.js
(function () {
  const input = document.getElementById("founderName");
  const btn = document.getElementById("becomeFounderBtn");
  if (!input || !btn) return;

  function cleanName(s) {
    return String(s || "").trim().replace(/\s+/g, " ").slice(0, 32);
  }

  async function submit() {
    const name = cleanName(input.value);

    if (name.length < 2) {
      alert("Please enter at least 2 characters.");
      return;
    }

    btn.disabled = true;

    const { error } = await supabase
      .from("founders")
      .insert([{ name }]);

    btn.disabled = false;

    if (error) {
      // Unique violation etc.
      if ((error.message || "").toLowerCase().includes("duplicate")) {
        alert("That name is already on the wall.");
      } else {
        alert("Couldn’t add you to the wall. Try a different name.");
      }
      return;
    }

    window.location.href = "./founders.html";
  }

  btn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
})();
