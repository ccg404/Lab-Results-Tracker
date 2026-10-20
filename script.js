const T = [
        ["Complete Blood Count"],
        ["wbc", "WBC", "/mm³", 5000, 10000],
        ["rbc", "RBC", "mil/mm³", 4.35, 5.9],
        ["hgb", "Hemoglobin", "g/dL", 13.7, 16.7],
        ["hct", "Hematocrit", "%", 40.5, 49.7],
        ["plt", "Platelets", "/mm³", 144000, 372000],
        ["Red Cell Indices"],
        ["mcv", "MCV", "fL", 79.7, 97],
        ["mch", "MCH", "pg", 26.1, 33.3],
        ["mchc", "MCHC", "g/dL", 32.2, 35],
        ["rdw", "RDW-CV", "%", 13.7, 16.7],
        ["Differential Count"],
        ["neut", "Neutrophils", "%", 43.4, 76.2],
        ["lym", "Lymphocytes", "%", 17.4, 46.2],
        ["mono", "Monocytes", "%", 4.5, 10.5],
        ["eos", "Eosinophils", "%", 2, 3],
        ["baso", "Basophils", "%", 0, 0.5],
        ["Clinical Chemistry"],
        ["na", "Sodium", "mmol/L", 136, 146],
        ["k", "Potassium", "mmol/L", 3.5, 5.3],
        ["phos", "Phosphorus", "mg/dL", 2.5, 5],
        ["alb", "Albumin", "g/dL", 3.5, 5.5],
        ["ca", "Total Calcium", "mg/dL", 8.6, 10.2],
        ["cr", "Creatinine", "mg/dL", 0.9, 1.4],
        ["ua", "Uric Acid", "mg/dL", 3.7, 7],
        ["bun", "BUN", "mg/dL", 7, 19],
      ];
      const TS = T.filter((t) => t.length > 1);
      const $ = (i) => document.getElementById(i);
      let E = [],
        editId = null;
      const seed = [];
      try {
        const s = localStorage.getItem("labs");
        E = s ? JSON.parse(s) : seed;
      } catch (e) {
        E = seed;
      }
      function save() {
        E.sort((a, b) => a.date.localeCompare(b.date));
        try {
          localStorage.setItem("labs", JSON.stringify(E));
        } catch (e) {}
      }
      const flag = (v, t) =>
        v == null ? "" : v < t[3] ? "L" : v > t[4] ? "H" : "";
      const fmt = (v) =>
        v == null
          ? "–"
          : (+v).toLocaleString(undefined, { maximumFractionDigits: 2 });
      const fd = (d) =>
        new Date(d + "T00:00").toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "2-digit",
        });

      // form
      $("f").innerHTML = (() => {
        let h = "",
          o = false;
        T.forEach((t) => {
          if (t.length == 1) {
            if (o) h += "</div>";
            h += `<div class="fg"><div class="fgt">${t[0]}</div>`;
            o = true;
          } else
            h += `<div class="tr"><label for="i_${t[0]}">${t[1]}<small>${fmt(t[3])} – ${fmt(t[4])}</small></label><input type="number" inputmode="decimal" step="any" id="i_${t[0]}" placeholder="—"><span class="u">${t[2]}</span><span class="fl" id="fl_${t[0]}"></span></div>`;
        });
        return h + "</div>";
      })();
      function lf() {
        TS.forEach((t) => {
          const x = $("i_" + t[0]).value,
            f = x === "" ? "" : flag(parseFloat(x), t),
            e = $("fl_" + t[0]);
          e.textContent =
            f == "H" ? "High" : f == "L" ? "Low" : x === "" ? "" : "OK";
          e.className = "fl " + (f || (x === "" ? "" : "ok"));
        });
      }
      $("f").addEventListener("input", lf);
      function tab(n) {
        ["entry", "dash"].forEach((k) => {
          $("tab-" + k).hidden = k != n;
          $("b-" + k).classList.toggle("on", k == n);
        });
        scrollTo(0, 0);
      }
      $("b-entry").onclick = () => tab("entry");
      $("b-dash").onclick = () => tab("dash");
      function toast(m) {
        const t = $("toast");
        t.textContent = m;
        t.classList.add("on");
        setTimeout(() => t.classList.remove("on"), 1800);
      }
      $("ts").innerHTML = TS.map(
        (t) => `<option value="${t[0]}">${t[1]}</option>`,
      ).join("");
      $("ts").value = "hgb";
      function clearForm() {
        editId = null;
        $("ft").textContent = "New laboratory panel entry";
        $("d").value = new Date().toISOString().slice(0, 10);
        $("rm").value = "";
        TS.forEach((t) => ($("i_" + t[0]).value = ""));
        lf();
      }
      $("cl").onclick = clearForm;
      $("sv").onclick = () => {
        const d = $("d").value;
        if (!d) {
          alert("Pick a date");
          return;
        }
        const v = {};
        TS.forEach((t) => {
          const x = $("i_" + t[0]).value;
          if (x !== "") v[t[0]] = parseFloat(x);
        });
        if (!Object.keys(v).length) {
          alert("Enter at least one value");
          return;
        }
        const o = {
          id: editId || "e" + Date.now(),
          date: d,
          rm: $("rm").value.trim(),
          v,
        };
        E = E.filter((e) => e.id !== o.id);
        E.push(o);
        save();
        clearForm();
        render();
        toast("Entry saved");
      };
      function edit(id) {
        const e = E.find((x) => x.id == id);
        editId = id;
        $("ft").textContent = "Edit entry";
        $("d").value = e.date;
        $("rm").value = e.rm || "";
        TS.forEach((t) => ($("i_" + t[0]).value = e.v[t[0]] ?? ""));
        lf();
        tab("entry");
      }
      function del(id) {
        if (confirm("Delete this entry?")) {
          E = E.filter((e) => e.id != id);
          save();
          render();
        }
      }

      // compare
      function cmp() {
        const c = E.slice(-8);
        if (!c.length) {
          $("cmp").innerHTML = "<p class='rng'>No entries yet.</p>";
          return;
        }
        let h = `<table><tr><th>Test</th><th>Range</th>${c.map((e) => `<th>${fd(e.date)}${e.rm ? `<div class="rng">${e.rm}</div>` : ""}</th>`).join("")}</tr>`;
        T.forEach((t) => {
          if (t.length == 1) {
            h += `<tr><td colspan="${c.length + 2}" style="color:var(--ac);font-weight:600">${t[0]}</td></tr>`;
            return;
          }
          h +=
            `<tr><td>${t[1]} <span class="rng">${t[2]}</span></td><td class="rng">${fmt(t[3])}–${fmt(t[4])}</td>` +
            c
              .map((e) => {
                const v = e.v[t[0]],
                  f = flag(v, t);
                return `<td class="${f}">${fmt(v)}${f ? " " + f : ""}</td>`;
              })
              .join("") +
            "</tr>";
        });
        $("cmp").innerHTML = h + "</table>";
      }

      // chart
      function chart() {
        const t = TS.find((x) => x[0] == $("ts").value),
          k = t[0];
        $("tr").textContent = `Reference: ${fmt(t[3])}–${fmt(t[4])} ${t[2]}`;
        const p = E.filter((e) => e.v[k] != null).map((e) => ({
          d: e.date,
          v: e.v[k],
        }));
        const s = $("ch");
        if (!p.length) {
          s.innerHTML = `<text x="320" y="125" text-anchor="middle" fill="currentColor" opacity=".6">No data for this test</text>`;
          $("st").innerHTML = "";
          return;
        }
        const W = 640,
          H = 250,
          L = 52,
          R = 14,
          Tp = 14,
          B = 34;
        const all = p.map((a) => a.v).concat([t[3], t[4]]);
        let mn = Math.min(...all),
          mx = Math.max(...all);
        const pad = (mx - mn || 1) * 0.12;
        mn -= pad;
        mx += pad;
        const X = (i) =>
            L +
            (p.length == 1
              ? (W - L - R) / 2
              : (i * (W - L - R)) / (p.length - 1)),
          Y = (v) => Tp + ((mx - v) * (H - Tp - B)) / (mx - mn);
        let o = `<rect x="${L}" y="${Y(t[4])}" width="${W - L - R}" height="${Math.max(2, Y(t[3]) - Y(t[4]))}" fill="var(--band)"/>`;
        for (let i = 0; i <= 4; i++) {
          const v = mn + ((mx - mn) * i) / 4,
            y = Y(v);
          o += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="var(--mut)" stroke-opacity=".3"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="var(--mut)">${fmt(v)}</text>`;
        }
        o += `<polyline fill="none" stroke="var(--tx)" stroke-width="3" points="${p.map((a, i) => X(i) + "," + Y(a.v)).join(" ")}"/>`;
        const step = Math.ceil(p.length / 7);
        p.forEach((a, i) => {
          const f = flag(a.v, t),
            col = f == "H" ? "var(--hi)" : f == "L" ? "var(--lo)" : "var(--ac)";
          o += `<circle cx="${X(i)}" cy="${Y(a.v)}" r="5" fill="${col}"><title>${fd(a.d)}: ${fmt(a.v)} ${t[2]}</title></circle>`;
          if (i % step == 0)
            o += `<text x="${X(i)}" y="${H - 12}" text-anchor="middle" font-size="11" fill="var(--mut)">${fd(a.d)}</text>`;
        });
        s.innerHTML = o;
        const hi = p.filter((a) => a.v > t[4]).length,
          lo = p.filter((a) => a.v < t[3]).length,
          last = p[p.length - 1],
          prev = p[p.length - 2];
        $("st").innerHTML =
          `<span>Latest: ${fmt(last.v)} ${flag(last.v, t)}</span>` +
          (prev
            ? `<span>Change: ${last.v - prev.v > 0 ? "+" : ""}${fmt(last.v - prev.v)}</span>`
            : "") +
          `<span>High ${hi}×</span><span>Low ${lo}×</span><span>Normal ${p.length - hi - lo}×</span>`;
      }
      $("ts").onchange = chart;

      // list
      function list() {
        $("ls").innerHTML = E.length
          ? [...E]
              .reverse()
              .map((e) => {
                const bad = TS.filter((t) => flag(e.v[t[0]], t))
                  .map(
                    (t) =>
                      `<span class="${flag(e.v[t[0]], t)}">${t[1]} ${flag(e.v[t[0]], t)}</span>`,
                  )
                  .join(", ");
                return `<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--bd);padding:8px 0"><div><b>${fd(e.date)}</b> ${e.rm ? `<span class="rng">${e.rm}</span>` : ""}<div style="font-size:.82rem">${bad || "All in range"}</div></div><div class="row"><button class="s" onclick="edit('${e.id}')">Edit</button><button class="s" onclick="del('${e.id}')">Delete</button></div></div>`;
              })
              .join("")
          : "<p class='rng'>No entries yet.</p>";
      }
      const colOf = (f) =>
        f == "H" ? "var(--hi)" : f == "L" ? "var(--lo)" : "var(--ac)";
      function snap() {
        const e = E[E.length - 1];
        if (!e) {
          $("sn").innerHTML = "<p class='rng'>No entries yet.</p>";
          $("dn").innerHTML = "<p class='rng'>0/0 in range</p>";
          $("sd").textContent = "";
          return;
        }
        $("sd").textContent = "· " + fd(e.date) + (e.rm ? " · " + e.rm : "");
        let n = 0,
          h = 0,
          l = 0;
        $("sn").innerHTML = TS.filter((t) => e.v[t[0]] != null)
          .map((t) => {
            const v = e.v[t[0]],
              f = flag(v, t);
            f == "H" ? h++ : f == "L" ? l++ : n++;
            const sp = t[4] - t[3],
              mn = t[3] - sp * 0.6,
              mx = t[4] + sp * 0.6,
              P = (x) =>
                Math.min(100, Math.max(0, ((x - mn) / (mx - mn)) * 100)),
              a = P(t[3]),
              b = P(t[4]);
            return `<div style="font-size:.8rem"><div class="row" style="justify-content:space-between;gap:4px"><span>${t[1]}</span><span class="${f}">${fmt(v)} ${f}</span></div><div style="position:relative;height:8px;background:var(--card);border:2px solid var(--bd);margin:4px 0 8px"><div style="position:absolute;left:${a}%;width:${b - a}%;height:100%;background:var(--ac);opacity:.7"></div><div style="position:absolute;left:calc(${P(v)}% - 2px);top:-5px;width:6px;height:16px;border:2px solid var(--bd);background:${colOf(f)}"></div></div></div>`;
          })
          .join("");
        const tot = n + h + l,
          C = 2 * Math.PI * 40;
        let off = 0;
        const seg = (c, k) => {
          const L = (k / tot) * C,
            s = `<circle r="40" cx="60" cy="60" fill="none" stroke="${c}" stroke-width="16" stroke-opacity="1" stroke-dasharray="${L} ${C - L}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>`;
          off += L;
          return k ? s : "";
        };
        $("dn").innerHTML =
          `<svg viewBox="0 0 120 120" style="width:120px;margin:0 auto">${seg("var(--ac)", n)}${seg("var(--hi)", h)}${seg("var(--lo)", l)}<text x="60" y="58" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">${n}/${tot}</text><text x="60" y="74" text-anchor="middle" font-size="10" fill="var(--mut)">in range</text></svg><div class="chips row" style="justify-content:center;margin-top:6px"><span class="H">${h} high</span><span class="L">${l} low</span></div>`;
      }
      function spark() {
        $("sp").innerHTML = TS.map((t) => {
          const p = E.filter((e) => e.v[t[0]] != null).map((e) => e.v[t[0]]);
          if (!p.length) return "";
          const all = p.concat([t[3], t[4]]);
          let mn = Math.min(...all),
            mx = Math.max(...all);
          const pd = (mx - mn || 1) * 0.1;
          mn -= pd;
          mx += pd;
          const X = (i) =>
              6 + (p.length == 1 ? 54 : (i * 108) / (p.length - 1)),
            Y = (v) => 4 + ((mx - v) * 32) / (mx - mn),
            last = p[p.length - 1],
            f = flag(last, t);
          return `<div onclick="$('ts').value='${t[0]}';chart();$('ch').scrollIntoView({behavior:'smooth',block:'center'})" style="cursor:pointer;border:3px solid var(--bd);background:var(--card);padding:6px 8px;box-shadow:3px 3px 0 var(--bd)"><div class="row" style="justify-content:space-between;font-size:.78rem;gap:4px"><span>${t[1]}</span><span class="${f}">${fmt(last)}</span></div><svg viewBox="0 0 120 40"><rect x="0" y="${Y(t[4])}" width="120" height="${Math.max(1, Y(t[3]) - Y(t[4]))}" fill="var(--band)"/><polyline fill="none" stroke="var(--tx)" stroke-width="2" points="${p.map((v, i) => X(i) + "," + Y(v)).join(" ")}"/>${p.map((v, i) => `<circle cx="${X(i)}" cy="${Y(v)}" r="2.5" fill="${colOf(flag(v, t))}"/>`).join("")}</svg></div>`;
        }).join("");
      }
      function render() {
        snap();
        spark();
        cmp();
        chart();
        list();
      }

      // export/import
      $("ex").onclick = () => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(
          new Blob([JSON.stringify(E, null, 1)], { type: "application/json" }),
        );
        a.download = "lab-results.json";
        a.click();
      };
      $("im").onchange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try {
            const d = JSON.parse(r.result);
            if (!Array.isArray(d)) throw 0;
            if (confirm("Replace current data with imported file?")) {
              E = d;
              save();
              render();
            }
          } catch (x) {
            alert("Invalid file");
          }
        };
        r.readAsText(f);
      };
      clearForm();
      save();
      render();
      tab("dash");