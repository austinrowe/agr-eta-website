(function () {
  "use strict";
  var SUPABASE_URL = "https://kmsxpnhmouwvopextxdq.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_Jw5kb4um_5fsmOMgomzMyA_jWxCwulH";

  function rpc(name, payload) {
    return fetch(SUPABASE_URL + "/rest/v1/rpc/" + name, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify(payload),
    }).then(function (res) {
      if (res.ok) return null;
      return res.json().catch(function () { return {}; }).then(function (body) {
        throw new Error((body && body.message) || "Something went wrong. Try again in a moment.");
      });
    });
  }

  function val(data, name) {
    return (data.get(name) || "").toString().trim();
  }

  function wireForm(formId, rpcName, buildPayload, successMsg) {
    var form = document.getElementById(formId);
    if (!form) return;
    var msg = form.querySelector(".form-msg");
    var btn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var hp = form.querySelector(".hp");
      if (hp && hp.value) {
        // Honeypot tripped: pretend it worked so a bot doesn't learn anything.
        form.reset();
        if (msg) { msg.textContent = successMsg; msg.className = "form-msg ok"; }
        return;
      }

      var data = new FormData(form);
      var payload = buildPayload(data);
      var originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending...";
      if (msg) { msg.textContent = ""; msg.className = "form-msg"; }

      rpc(rpcName, payload)
        .then(function () {
          form.reset();
          if (msg) { msg.textContent = successMsg; msg.className = "form-msg ok"; }
        })
        .catch(function (err) {
          if (msg) { msg.textContent = err.message; msg.className = "form-msg err"; }
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = originalText;
        });
    });
  }

  wireForm(
    "interest-form",
    "submit_interest",
    function (d) {
      return {
        p_name: val(d, "name"),
        p_email: val(d, "email"),
        p_phone: val(d, "phone"),
        p_year: val(d, "year"),
        p_hometown: val(d, "hometown"),
        p_high_school: val(d, "high_school"),
        p_major: val(d, "major"),
        p_notes: val(d, "notes"),
        p_hp: val(d, "hp"),
      };
    },
    "Thanks — an officer will be in touch soon."
  );

  wireForm(
    "recommend-form",
    "submit_recommendation",
    function (d) {
      return {
        p_name: val(d, "name"),
        p_suggested_by: val(d, "suggested_by"),
        p_relationship: val(d, "relationship"),
        p_phone: val(d, "phone"),
        p_email: val(d, "email"),
        p_notes: val(d, "notes"),
        p_hp: val(d, "hp"),
      };
    },
    "Thanks for the recommendation — recruitment will follow up."
  );

  wireForm(
    "contact-update-form",
    "submit_contact_update",
    function (d) {
      return {
        p_name: val(d, "name"),
        p_old_email: val(d, "old_email"),
        p_email: val(d, "email"),
        p_phone: val(d, "phone"),
        p_employer: val(d, "employer"),
        p_job_title: val(d, "job_title"),
        p_note: val(d, "note"),
        p_hp: val(d, "hp"),
      };
    },
    "Thanks — your info is on its way to the alumni board."
  );

  wireForm(
    "pledge-form",
    "submit_pledge",
    function (d) {
      return {
        p_name: val(d, "name"),
        p_email: val(d, "email"),
        p_amount: parseFloat(val(d, "amount")) || 0,
        p_frequency: val(d, "frequency"),
        p_note: val(d, "note"),
        p_hp: val(d, "hp"),
      };
    },
    "Thank you — someone from the alumni board will follow up."
  );

  // Live "what's new" on the homepage. Leaves the page's own built-in list
  // alone if the fetch fails or nothing is published yet.
  var list = document.getElementById("updates-list");
  if (list) {
    fetch(
      SUPABASE_URL +
        "/rest/v1/site_updates?select=title,body,link,linktext,published_at&status=eq.published&order=published_at.desc&limit=5",
      { headers: { apikey: SUPABASE_ANON_KEY } }
    )
      .then(function (res) {
        return res.ok ? res.json() : [];
      })
      .then(function (items) {
        if (!items || items.length === 0) return;
        list.innerHTML = items
          .map(function (u) {
            var when = new Date(u.published_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            });
            var link = u.link
              ? ' <a href="' + escapeHtml(u.link) + '" target="_blank" rel="noopener">' +
                escapeHtml(u.linktext || u.link) +
                "</a>"
              : "";
            return (
              '<li><span class="when">' +
              when +
              "</span><div><b>" +
              escapeHtml(u.title) +
              "</b><p>" +
              escapeHtml(u.body) +
              link +
              "</p></div></li>"
            );
          })
          .join("");
      })
      .catch(function () {
        /* keep whatever was already built into the page */
      });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
