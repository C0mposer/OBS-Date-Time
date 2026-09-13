(() => {
      const defaults = {
        layout: "date-time",
        arrangement: "stacked",
        hour12: "1",
        seconds: true,
        ampm: true,
        dateFormat: "numeric",
        separator: " - ",
        timezone: "",
        template: "{time}\n{date}",
        font: "Lato, Arial, sans-serif",
        customFont: "",
        fontSize: 72,
        fontWeight: 300,
        textColor: "#ffffff",
        align: "center",
        letterSpacing: 0,
        lineHeight: 1.08,
        bgColor: "#000000",
        bgOpacity: 45,
        paddingX: 28,
        paddingY: 18,
        borderColor: "#ffffff",
        borderWidth: 0,
        radius: 12,
        opacity: 100,
        strokeColor: "#000000",
        strokeWidth: 0,
        shadowColor: "#000000",
        shadowOpacity: 55,
        shadowX: 0,
        shadowY: 4,
        shadowBlur: 14,
        canvasWidth: 900,
        canvasHeight: 260
      };

      const presets = {
        clean: {
          font: "Inter, ui-sans-serif, system-ui, sans-serif",
          customFont: "", fontSize: 72, fontWeight: 700, textColor: "#ffffff",
          bgColor: "#000000", bgOpacity: 0, paddingX: 14, paddingY: 10,
          borderWidth: 0, radius: 0, strokeWidth: 0,
          shadowOpacity: 65, shadowX: 0, shadowY: 3, shadowBlur: 12
        },
        boxed: {
          font: "Inter, ui-sans-serif, system-ui, sans-serif",
          customFont: "", fontSize: 66, fontWeight: 700, textColor: "#ffffff",
          bgColor: "#0b0d12", bgOpacity: 82, paddingX: 32, paddingY: 22,
          borderColor: "#ffffff", borderWidth: 2, radius: 18, strokeWidth: 0,
          shadowOpacity: 45, shadowX: 0, shadowY: 8, shadowBlur: 24
        },
        retro: {
          font: "'Courier New', monospace",
          customFont: "", fontSize: 68, fontWeight: 700, textColor: "#78ff90",
          bgColor: "#001a05", bgOpacity: 86, paddingX: 26, paddingY: 18,
          borderColor: "#78ff90", borderWidth: 2, radius: 2,
          strokeColor: "#052709", strokeWidth: 1.5,
          shadowColor: "#78ff90", shadowOpacity: 28, shadowX: 0, shadowY: 0, shadowBlur: 12
        },
        minimal: {
          font: "Arial, Helvetica, sans-serif",
          customFont: "", fontSize: 58, fontWeight: 500, textColor: "#ffffff",
          bgColor: "#000000", bgOpacity: 0, paddingX: 0, paddingY: 0,
          borderWidth: 0, radius: 0, strokeWidth: 0,
          shadowOpacity: 0, shadowX: 0, shadowY: 0, shadowBlur: 0
        }
      };

      const boolKeys = new Set(["seconds", "ampm"]);
      const numberKeys = new Set([
        "fontSize", "fontWeight", "letterSpacing", "lineHeight", "bgOpacity",
        "paddingX", "paddingY", "borderWidth", "radius", "opacity",
        "strokeWidth", "shadowOpacity", "shadowX", "shadowY", "shadowBlur",
        "canvasWidth", "canvasHeight"
      ]);

      const params = new URLSearchParams(location.search);
      const isOverlay = params.get("overlay") === "1";
      const editorApp = document.getElementById("editorApp");
      const overlayApp = document.getElementById("overlayApp");
      const previewClock = document.getElementById("previewClock");
      const overlayClock = document.getElementById("overlayClock");
      const browseFontsBtn = document.getElementById("browseFontsBtn");
      const clearSystemFontBtn = document.getElementById("clearSystemFontBtn");
      const systemFontBrowser = document.getElementById("systemFontBrowser");
      const systemFontSearch = document.getElementById("systemFontSearch");
      const systemFontSelect = document.getElementById("systemFontSelect");
      const systemFontStatus = document.getElementById("systemFontStatus");
      const selectedSystemFont = document.getElementById("selectedSystemFont");
      let localFontFamilies = [];

      function fromParams() {
        const s = {...defaults};
        for (const key of Object.keys(defaults)) {
          if (!params.has(key)) continue;
          const raw = params.get(key);
          if (boolKeys.has(key)) s[key] = raw === "1";
          else if (numberKeys.has(key)) {
            const n = Number(raw);
            if (Number.isFinite(n)) s[key] = n;
          } else s[key] = raw ?? "";
        }
        return s;
      }

      let state = fromParams();

      function hexToRgba(hex, alphaPct) {
        const h = hex.replace("#", "");
        const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
        const n = parseInt(full || "000000", 16);
        const r = (n >> 16) & 255;
        const g = (n >> 8) & 255;
        const b = n & 255;
        return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, Number(alphaPct))) / 100})`;
      }

      function safeTimeZone(tz) {
        if (!tz.trim()) return undefined;
        try {
          new Intl.DateTimeFormat("en-US", { timeZone: tz }).format();
          return tz.trim();
        } catch {
          return undefined;
        }
      }

      function parts(now, s) {
        const timeZone = safeTimeZone(s.timezone);
        const hour12 = s.hour12 === "1";
        const timeOptions = {
          hour: "2-digit",
          minute: "2-digit",
          second: s.seconds ? "2-digit" : undefined,
          hour12,
          timeZone
        };

        let time = new Intl.DateTimeFormat("en-US", timeOptions).format(now);
        if (hour12 && !s.ampm) time = time.replace(/\s?[AP]M$/i, "");

        let dateOptions;
        switch (s.dateFormat) {
          case "short":
            dateOptions = { month: "short", day: "numeric", year: "numeric", timeZone };
            break;
          case "numeric":
            dateOptions = { month: "2-digit", day: "2-digit", year: "numeric", timeZone };
            break;
          case "weekday":
            dateOptions = { weekday: "long", month: "long", day: "numeric", timeZone };
            break;
          case "iso": {
            const isoParts = new Intl.DateTimeFormat("en-CA", {
              year: "numeric", month: "2-digit", day: "2-digit", timeZone
            }).formatToParts(now);
            const map = Object.fromEntries(isoParts.map(p => [p.type, p.value]));
            return {
              time,
              date: `${map.year}-${map.month}-${map.day}`,
              weekday: new Intl.DateTimeFormat("en-US", {weekday: "long", timeZone}).format(now),
              month: new Intl.DateTimeFormat("en-US", {month: "long", timeZone}).format(now),
              day: new Intl.DateTimeFormat("en-US", {day: "numeric", timeZone}).format(now),
              year: new Intl.DateTimeFormat("en-US", {year: "numeric", timeZone}).format(now)
            };
          }
          default:
            dateOptions = { month: "long", day: "numeric", year: "numeric", timeZone };
        }

        return {
          time,
          date: new Intl.DateTimeFormat("en-US", dateOptions).format(now),
          weekday: new Intl.DateTimeFormat("en-US", {weekday: "long", timeZone}).format(now),
          month: new Intl.DateTimeFormat("en-US", {month: "long", timeZone}).format(now),
          day: new Intl.DateTimeFormat("en-US", {day: "numeric", timeZone}).format(now),
          year: new Intl.DateTimeFormat("en-US", {year: "numeric", timeZone}).format(now)
        };
      }

      function contentText(now, s) {
        const p = parts(now, s);
        const sep = s.arrangement === "stacked" ? "\n" : s.separator;

        if (s.layout === "time") return p.time;
        if (s.layout === "date") return p.date;
        if (s.layout === "date-time") return `${p.date}${sep}${p.time}`;
        if (s.layout === "custom") {
          return s.template
            .replaceAll("{time}", p.time)
            .replaceAll("{date}", p.date)
            .replaceAll("{weekday}", p.weekday)
            .replaceAll("{month}", p.month)
            .replaceAll("{day}", p.day)
            .replaceAll("{year}", p.year);
        }
        return `${p.time}${sep}${p.date}`;
      }

      function applyClockStyle(el, s) {
        const family = s.customFont.trim() || s.font;
        el.className = `clock align-${s.align}`;
        el.style.fontFamily = family;
        el.style.fontSize = `${s.fontSize}px`;
        el.style.fontWeight = String(s.fontWeight);
        el.style.color = s.textColor;
        el.style.letterSpacing = `${s.letterSpacing}px`;
        el.style.lineHeight = String(s.lineHeight);
        el.style.background = hexToRgba(s.bgColor, s.bgOpacity);
        el.style.padding = `${s.paddingY}px ${s.paddingX}px`;
        el.style.border = `${s.borderWidth}px solid ${s.borderColor}`;
        el.style.borderRadius = `${s.radius}px`;
        el.style.opacity = String(s.opacity / 100);
        el.style.webkitTextStroke = `${s.strokeWidth}px ${s.strokeColor}`;
        el.style.paintOrder = "stroke fill";
        el.style.textShadow = `${s.shadowX}px ${s.shadowY}px ${s.shadowBlur}px ${hexToRgba(s.shadowColor, s.shadowOpacity)}`;
      }

      function renderClock(el, s) {
        el.textContent = contentText(new Date(), s);
        applyClockStyle(el, s);
      }

      function buildOverlayUrl(s) {
        const url = new URL(location.href);
        url.search = "";
        url.hash = "";
        url.searchParams.set("overlay", "1");

        for (const [key, val] of Object.entries(s)) {
          if (val === defaults[key]) continue;
          if (boolKeys.has(key)) url.searchParams.set(key, val ? "1" : "0");
          else url.searchParams.set(key, String(val));
        }
        return url.toString();
      }

      function quoteFontFamily(family) {
        return `"${String(family).replaceAll('"', '\\"')}"`;
      }

      function displayFontFamily(cssFamily) {
        return String(cssFamily || "").replace(/^['"]|['"]$/g, "");
      }

      function updateSystemFontUi() {
        if (!selectedSystemFont) return;
        if (state.customFont.trim()) {
          selectedSystemFont.textContent = displayFontFamily(state.customFont);
          clearSystemFontBtn.hidden = false;
        } else {
          selectedSystemFont.textContent = "None selected";
          clearSystemFontBtn.hidden = true;
        }
      }

      function renderSystemFontOptions(filter = "") {
        if (!systemFontSelect) return;
        const query = filter.trim().toLocaleLowerCase();
        const filtered = query
          ? localFontFamilies.filter(name => name.toLocaleLowerCase().includes(query))
          : localFontFamilies;

        systemFontSelect.replaceChildren();
        for (const family of filtered) {
          const option = document.createElement("option");
          option.value = family;
          option.textContent = family;
          option.style.fontFamily = quoteFontFamily(family);
          systemFontSelect.appendChild(option);
        }
        systemFontStatus.textContent = `${filtered.length} of ${localFontFamilies.length} installed font families`;
      }

      async function browseInstalledFonts() {
        systemFontBrowser.hidden = false;
        systemFontStatus.textContent = "Requesting access to installed fonts…";

        if (!("queryLocalFonts" in window)) {
          systemFontStatus.textContent = "Installed-font browsing is not supported by this browser. Use a Chromium-based browser for this picker.";
          return;
        }

        try {
          const fonts = await window.queryLocalFonts();
          localFontFamilies = [...new Set(fonts.map(font => font.family).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
          renderSystemFontOptions(systemFontSearch.value);
          systemFontSearch.focus();
        } catch (err) {
          if (!window.isSecureContext) {
            systemFontStatus.textContent = "Installed-font access requires HTTPS or localhost.";
          } else if (err?.name === "NotAllowedError") {
            systemFontStatus.textContent = "Font access was not allowed.";
          } else {
            systemFontStatus.textContent = `Could not read installed fonts: ${err?.message || err}`;
          }
        }
      }

      function syncAllInputs() {
        document.querySelectorAll("[data-key]").forEach(el => {
          const key = el.dataset.key;
          const value = state[key];
          if (el.type === "checkbox") el.checked = !!value;
          else el.value = value;
        });
        document.getElementById("templateRow").hidden = state.layout !== "custom";
        document.getElementById("separatorField").hidden = state.arrangement !== "inline";
        document.getElementById("layoutRow").classList.toggle("three", state.arrangement === "inline");
        updateSystemFontUi();
      }

      function updateEditor() {
        renderClock(previewClock, state);
        document.getElementById("urlPreview").textContent = buildOverlayUrl(state);
        document.getElementById("previewSizeLabel").textContent =
          `${state.canvasWidth} × ${state.canvasHeight} recommended`;
        document.getElementById("templateRow").hidden = state.layout !== "custom";
        document.getElementById("separatorField").hidden = state.arrangement !== "inline";
        document.getElementById("layoutRow").classList.toggle("three", state.arrangement === "inline");

        const tzField = document.querySelector('[data-key="timezone"]');
        if (state.timezone.trim() && !safeTimeZone(state.timezone)) {
          tzField.style.borderColor = "#e36a6a";
          tzField.title = "Invalid IANA timezone; local timezone will be used.";
        } else {
          tzField.style.borderColor = "";
          tzField.title = "";
        }
      }

      function setStateKey(key, raw, inputType) {
        if (boolKeys.has(key)) state[key] = !!raw;
        else if (numberKeys.has(key)) state[key] = Number(raw);
        else state[key] = raw;

        if (key === "font") state.customFont = "";

        document.querySelectorAll(`[data-key="${CSS.escape(key)}"]`).forEach(el => {
          if (el.type === "checkbox") el.checked = !!state[key];
          else if (el !== document.activeElement) el.value = state[key];
        });
        updateSystemFontUi();
        updateEditor();
      }

      async function copyLink() {
        const url = buildOverlayUrl(state);
        const status = document.getElementById("status");
        try {
          await navigator.clipboard.writeText(url);
          status.textContent = "Browser Source link copied.";
        } catch {
          const ta = document.createElement("textarea");
          ta.value = url;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
          status.textContent = "Browser Source link copied.";
        }
        setTimeout(() => status.textContent = "", 2200);
      }

      if (isOverlay) {
        document.body.style.background = "transparent";
        editorApp.hidden = true;
        overlayApp.hidden = false;

        const setPosition = () => {
          overlayApp.style.justifyContent =
            state.align === "left" ? "flex-start" : state.align === "right" ? "flex-end" : "center";
          overlayApp.style.alignItems = "center";
        };
        setPosition();
        renderClock(overlayClock, state);
        setInterval(() => renderClock(overlayClock, state), 250);
        return;
      }

      document.body.classList.add("editor-mode");
      syncAllInputs();
      updateEditor();
      setInterval(() => renderClock(previewClock, state), 250);

      document.querySelectorAll("[data-key]").forEach(el => {
        const evt = (el.type === "range" || el.type === "color" || el.tagName === "TEXTAREA" || el.type === "text")
          ? "input" : "change";
        el.addEventListener(evt, () => {
          const key = el.dataset.key;
          const raw = el.type === "checkbox" ? el.checked : el.value;
          setStateKey(key, raw, el.type);
        });
      });

      document.querySelectorAll("[data-preset]").forEach(btn => {
        btn.addEventListener("click", () => {
          Object.assign(state, presets[btn.dataset.preset]);
          syncAllInputs();
          updateEditor();
        });
      });

      browseFontsBtn?.addEventListener("click", browseInstalledFonts);
      clearSystemFontBtn?.addEventListener("click", () => {
        state.customFont = "";
        updateSystemFontUi();
        updateEditor();
      });
      systemFontSearch?.addEventListener("input", () => renderSystemFontOptions(systemFontSearch.value));
      systemFontSelect?.addEventListener("change", () => {
        if (!systemFontSelect.value) return;
        state.customFont = quoteFontFamily(systemFontSelect.value);
        updateSystemFontUi();
        updateEditor();
      });
      systemFontSelect?.addEventListener("dblclick", () => {
        if (systemFontSelect.value) systemFontBrowser.hidden = true;
      });

      document.getElementById("copyBtn").addEventListener("click", copyLink);
      document.getElementById("openBtn").addEventListener("click", () => {
        window.open(buildOverlayUrl(state), "_blank", "noopener");
      });
      document.getElementById("resetBtn").addEventListener("click", () => {
        state = {...defaults};
        syncAllInputs();
        updateEditor();
      });
    })();
