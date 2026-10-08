// Accounts and sync for the website version.
//
// Inside Claude, the app saves through window.claude.use("db") and use("user").
// On the website there is no Claude runtime, so this file provides those same two
// on top of Supabase. index.html stays identical to the Claude artifact.
// Anything else the app asks for (like "sample", Pip's AI) resolves to null,
// and the app hides that feature.
(() => {
  if (window.claude) return; // running inside Claude: use the real runtime

  const cfg = window.COINLEAF_CONFIG || {};
  const sb = cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
    : null;
  const sessionReady = sb ? sb.auth.getSession().then(r => r.data.session).catch(() => null) : Promise.resolve(null);

  function docStore(uid){
    const table = () => sb.from("docs");
    return {
      doc: path => ({
        async get(){
          const { data, error } = await table().select("data").eq("path", path).maybeSingle();
          if (error) throw error;
          return { exists: !!data, data: () => (data ? data.data : undefined) };
        },
        async set(value){
          const { error } = await table().upsert({ user_id: uid, path, data: value, updated_at: new Date().toISOString() });
          if (error) throw error;
        },
        async delete(){
          const { error } = await table().delete().eq("path", path);
          if (error) throw error;
        },
      }),
    };
  }

  window.claude = {
    async use(name){
      const session = await sessionReady;
      if (!session) return null;
      if (name === "user") return { id: async () => session.user.id, email: session.user.email };
      if (name === "db") return docStore(session.user.id);
      return null;
    },
  };

  if (!sb) return; // not configured: the app runs on this device only

  /* ---------- account button and sign-in dialog ---------- */
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  let session = null, step = "email", email = "", msg = "", busy = false;

  function view(){
    if (session) return `<h2 id="acctTitle">Your account</h2>
      <p>Signed in as <b>${esc(session.user.email)}</b>. Your villages save to your account and sync to every device where you sign in.</p>
      <p class="hint">Signing out removes the village from this device. It stays safe in your account.</p>
      <div class="row"><button class="btn small" data-acct="signout">Sign out</button><button class="btn small ghost" data-acct="close">Close</button></div>`;
    if (step === "code") return `<h2 id="acctTitle">Check your email</h2>
      <p>We sent a sign-in code to <b>${esc(email)}</b>. Type it here, or tap the link in the email on this device.</p>
      <form data-acct-form="code" class="section"><label class="fld" style="flex:none" for="acctCode"><span>Sign-in code</span>
        <input id="acctCode" inputmode="numeric" autocomplete="one-time-code" maxlength="10" required></label>
        ${msg ? `<p class="hint bad">${esc(msg)}</p>` : ""}
        <div class="row"><button class="btn small gold" type="submit" ${busy ? "disabled" : ""}>${busy ? "Signing in…" : "Sign in"}</button><button class="btn small ghost" type="button" data-acct="back">Use a different email</button></div></form>`;
    return `<h2 id="acctTitle">Sign in to sync</h2>
      <p>Sign in to keep your village safe in your account and open it on any device. No password needed: we'll email you a code.</p>
      <form data-acct-form="email" class="section"><label class="fld" style="flex:none" for="acctEmail"><span>Email</span>
        <input id="acctEmail" type="email" autocomplete="email" required value="${esc(email)}"></label>
        ${msg ? `<p class="hint bad">${esc(msg)}</p>` : ""}
        <p class="hint">The village on this device moves into your account the first time you sign in.</p>
        <div class="row"><button class="btn small gold" type="submit" ${busy ? "disabled" : ""}>${busy ? "Sending…" : "Email me a code"}</button><button class="btn small ghost" type="button" data-acct="close">Not now</button></div></form>`;
  }
  function paint(){
    const box = document.getElementById("acctBody"); if (box) box.innerHTML = view();
    const btn = document.getElementById("acctBtn"); if (btn) btn.textContent = session ? "Account" : "Sign in";
  }
  function open(){
    msg = ""; paint(); document.getElementById("acctModal").hidden = false;
    const f = document.querySelector("#acctBody input"); if (f) setTimeout(() => f.focus(), 30);
  }
  const close = () => { document.getElementById("acctModal").hidden = true; };

  function clearDevice(){
    try { Object.keys(localStorage).filter(k => k.startsWith("coinleaf")).forEach(k => localStorage.removeItem(k)); } catch(e){}
  }

  document.addEventListener("DOMContentLoaded", () => {
    const row = document.getElementById("profBtn") && document.getElementById("profBtn").parentElement;
    if (row){
      const b = document.createElement("button"); b.id = "acctBtn"; b.className = "btn small"; b.type = "button"; b.textContent = "Sign in";
      b.addEventListener("click", open); row.insertBefore(b, row.firstChild);
    }
    const m = document.createElement("div"); m.id = "acctModal"; m.className = "modal"; m.hidden = true;
    m.innerHTML = `<div class="dialog frame" role="dialog" aria-modal="true" aria-labelledby="acctTitle"><div id="acctBody" class="section"></div></div>`;
    document.body.appendChild(m);
    m.addEventListener("click", async e => {
      if (e.target === m) return close();
      const a = e.target.closest("[data-acct]"); if (!a) return;
      const act = a.dataset.acct;
      if (act === "close") close();
      if (act === "back"){ step = "email"; msg = ""; paint(); }
      if (act === "signout"){ await sb.auth.signOut().catch(() => {}); clearDevice(); location.reload(); }
    });
    m.addEventListener("submit", async e => {
      e.preventDefault(); if (busy) return;
      const kind = e.target.dataset.acctForm; busy = true; msg = "";
      if (kind === "email"){
        email = (document.getElementById("acctEmail").value || "").trim(); paint();
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
        busy = false;
        if (error) msg = /rate|too many|seconds/i.test(error.message) ? "Too many tries for now. Wait a minute, then try again." : "That didn't work. Check the email address and try again.";
        else step = "code";
        paint(); const f = document.querySelector("#acctBody input"); if (f) f.focus();
      } else {
        const token = (document.getElementById("acctCode").value || "").replace(/\s/g, ""); paint();
        const { error } = await sb.auth.verifyOtp({ email, token, type: "email" });
        busy = false;
        if (error){ msg = "That code didn't work. Check it, or ask for a new one."; paint(); return; }
        location.reload();
      }
    });
    sessionReady.then(s => { session = s; paint(); });
    sessionReady.then(() => sb.auth.onAuthStateChange((evt, s) => { session = s; paint(); }));
  });
})();
