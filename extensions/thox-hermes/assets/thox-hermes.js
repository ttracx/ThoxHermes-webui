(() => {
  "use strict";

  const EXTENSION_ID = "thox-hermes";
  const DEFAULT_ORIGIN = "http://127.0.0.1:17789";
  const DEVICE_MODES = ["web", "thoxnova", "thoxmini", "thoxmini-air", "thoxclip", "thoxkey"];
  const DEFAULT_STATE = Object.freeze({
    organization: "THOX.ai",
    runtime: { status: "offline", version: "unavailable", route: "local sidecar" },
    digital_humans: [
      {
        id: "sadie-weaving",
        name: "Sadie Weaving",
        role: "THOX Hermes Chief Agentic Officer",
        status: "configured",
        model: "ThoxRoute"
      }
    ],
    internal_agents: [
      { id: "orchestrator", name: "Hermes Orchestrator", domain: "coordination", status: "configured" },
      { id: "research", name: "Research Agent", domain: "research", status: "configured" },
      { id: "builder", name: "Builder Agent", domain: "implementation", status: "configured" },
      { id: "reviewer", name: "Review Agent", domain: "quality and safety", status: "configured" }
    ],
    devices: [
      { id: "thoxnova", name: "ThoxNova", class: "edge AI slate", status: "unpaired", channel: "local" },
      { id: "thoxmini", name: "ThoxMini", class: "USB edge compute", status: "unpaired", channel: "USB-NCM" },
      { id: "thoxmini-air", name: "ThoxMini Air", class: "wireless edge assistant", status: "unpaired", channel: "Wi-Fi / BLE" },
      { id: "thoxclip", name: "ThoxClip", class: "MagSafe / Qi2 edge accessory", status: "unpaired", channel: "BLE" },
      { id: "thoxkey", name: "ThoxKey", class: "portable AI workspace", status: "unpaired", channel: "USB" },
      { id: "thoxwatch", name: "ThoxWatch", class: "wearable companion", status: "unpaired", channel: "BLE" },
      { id: "thoxvault", name: "ThoxVault", class: "wireless private storage", status: "unpaired", channel: "Wi-Fi / USB" }
    ],
    routes: [
      { id: "local", name: "Local inference", status: "unknown", provider: "THOXCore / llama.cpp / Ollama" },
      { id: "mesh", name: "MeshStack", status: "unknown", provider: "device mesh" },
      { id: "fallback", name: "Cloud fallback", status: "unknown", provider: "configured provider" }
    ],
    alerts: []
  });

  let state = clone(DEFAULT_STATE);
  let activeTab = "overview";
  let overlay;
  let content;
  let lastError = "";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function settings() {
    try {
      const api = window.HermesExtensionSettings || window.hermesExt;
      if (api?.settingsForExtension) return api.settingsForExtension(EXTENSION_ID);
      if (api?.settings?.forExtension) return api.settings.forExtension(EXTENSION_ID);
    } catch (error) {
      console.warn("[thox-hermes] settings unavailable", error);
    }
    return null;
  }

  function storage() {
    try {
      const api = window.HermesExtensionSettings || window.hermesExt;
      if (api?.storageForExtension) return api.storageForExtension(EXTENSION_ID);
      if (api?.storage?.forExtension) return api.storage.forExtension(EXTENSION_ID);
    } catch (error) {
      console.warn("[thox-hermes] storage unavailable", error);
    }
    return null;
  }

  function getSetting(key, fallback) {
    try {
      const value = settings()?.get(key);
      return value === undefined || value === null || value === "" ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function getStored(key, fallback) {
    try {
      const value = storage()?.get(key);
      return value === undefined || value === null ? fallback : value;
    } catch (_) {
      try {
        const value = localStorage.getItem(`thox-hermes:${key}`);
        return value === null ? fallback : JSON.parse(value);
      } catch (_) {
        return fallback;
      }
    }
  }

  function setStored(key, value) {
    try {
      storage()?.set(key, value);
      return;
    } catch (_) {
      try {
        localStorage.setItem(`thox-hermes:${key}`, JSON.stringify(value));
      } catch (_) {}
    }
  }

  function thoxMark(size = 20) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" stroke-width="1.7"/><path d="M8 9h8M8 12h5M8 15h8M2 9h2M2 15h2M20 9h2M20 15h2M9 2v2M15 2v2M9 20v2M15 20v2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
  }

  function icon(name) {
    const icons = {
      close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.7-2.6L20 11M4 13l2.2 4.6A7 7 0 0 0 17.9 15"/></svg>'
    };
    return icons[name] || "";
  }

  function applyBranding() {
    document.documentElement.classList.add("thox-hermes", "dark");
    document.title = "THOX Hermes";
    const title = document.getElementById("appTitlebarTitle");
    if (title) title.textContent = "THOX Hermes";
    const subtitle = document.getElementById("appTitlebarSub");
    if (subtitle) {
      subtitle.hidden = false;
      subtitle.textContent = "Private agent fabric";
    }
    const titleIcon = document.querySelector(".app-titlebar-icon");
    if (titleIcon) titleIcon.innerHTML = thoxMark(18);

    const configuredMode = String(getSetting("default_device_mode", "web"));
    const storedMode = String(getStored("device_mode", configuredMode));
    setDeviceMode(DEVICE_MODES.includes(storedMode) ? storedMode : "web", false);
  }

  function makeNavButton(className, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.tooltip = label;
    button.setAttribute("aria-label", label);
    button.innerHTML = thoxMark(20);
    button.addEventListener("click", openCommandFabric);
    return button;
  }

  function injectNavigation() {
    if (document.querySelector(".thox-nav-button")) return;
    const rail = document.querySelector(".rail");
    if (rail) {
      const button = makeNavButton("rail-btn thox-nav-button has-tooltip", "THOX Command Fabric");
      const spacer = rail.querySelector(".rail-spacer");
      rail.insertBefore(button, spacer || rail.lastElementChild);
    }

    const mobile = document.querySelector(".sidebar-nav");
    if (mobile) {
      const button = makeNavButton("nav-tab thox-nav-button has-tooltip has-tooltip--bottom", "THOX Command Fabric");
      button.dataset.label = "THOX";
      const settingsButton = mobile.querySelector('[data-panel="settings"]');
      mobile.insertBefore(button, settingsButton || null);
    }
  }

  function injectOverlay() {
    if (document.getElementById("thoxCommandOverlay")) return;
    overlay = document.createElement("div");
    overlay.id = "thoxCommandOverlay";
    overlay.className = "thox-command-overlay";
    overlay.dataset.open = "false";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "THOX Hermes Command Fabric");
    overlay.innerHTML = `
      <section class="thox-command-shell">
        <header class="thox-command-header">
          <div class="thox-brand-mark">${thoxMark(23)}</div>
          <div class="thox-command-title">
            <strong>THOX Hermes Command Fabric</strong>
            <span>Your AI. Your Data. Your Rules.</span>
          </div>
          <button type="button" class="thox-icon-button" data-thox-refresh aria-label="Refresh THOX status">${icon("refresh")}</button>
          <button type="button" class="thox-command-close" data-thox-close aria-label="Close THOX Command Fabric">${icon("close")}</button>
        </header>
        <nav class="thox-command-tabs" aria-label="THOX Command Fabric sections">
          ${["overview", "digital-humans", "agents", "devices", "routes", "device-modes"].map((tab) => `<button type="button" class="thox-command-tab" data-thox-tab="${tab}" aria-selected="${tab === activeTab}">${tab.replaceAll("-", " ")}</button>`).join("")}
        </nav>
        <main class="thox-command-content" id="thoxCommandContent"></main>
      </section>`;
    document.body.appendChild(overlay);
    content = overlay.querySelector("#thoxCommandContent");

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest("[data-thox-close]")) closeCommandFabric();
      const tab = event.target.closest("[data-thox-tab]");
      if (tab) switchTab(tab.dataset.thoxTab);
      const refresh = event.target.closest("[data-thox-refresh]");
      if (refresh) refreshState(true);
      const deviceMode = event.target.closest("[data-device-mode]");
      if (deviceMode) setDeviceMode(deviceMode.dataset.deviceMode, true);
      const launch = event.target.closest("[data-launch-human]");
      if (launch) launchDigitalHuman(launch.dataset.launchHuman);
      const command = event.target.closest("[data-device-command]");
      if (command) runSafeDeviceCommand(command.dataset.deviceId, command.dataset.deviceCommand);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && overlay?.dataset.open === "true") closeCommandFabric();
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "t") {
        event.preventDefault();
        openCommandFabric();
      }
    });
  }

  function openCommandFabric() {
    if (!overlay) injectOverlay();
    overlay.dataset.open = "true";
    document.body.style.overflow = "hidden";
    render();
    refreshState(false);
    overlay.querySelector("[data-thox-close]")?.focus();
  }

  function closeCommandFabric() {
    if (!overlay) return;
    overlay.dataset.open = "false";
    document.body.style.overflow = "";
  }

  function switchTab(tab) {
    activeTab = tab;
    overlay?.querySelectorAll("[data-thox-tab]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.thoxTab === tab));
    });
    render();
  }

  function mergeState(payload) {
    if (!payload || typeof payload !== "object") return clone(DEFAULT_STATE);
    return {
      organization: String(payload.organization || DEFAULT_STATE.organization),
      runtime: { ...DEFAULT_STATE.runtime, ...(payload.runtime || {}) },
      digital_humans: safeArray(payload.digital_humans).length ? payload.digital_humans : clone(DEFAULT_STATE.digital_humans),
      internal_agents: safeArray(payload.internal_agents).length ? payload.internal_agents : clone(DEFAULT_STATE.internal_agents),
      devices: safeArray(payload.devices).length ? payload.devices : clone(DEFAULT_STATE.devices),
      routes: safeArray(payload.routes).length ? payload.routes : clone(DEFAULT_STATE.routes),
      alerts: safeArray(payload.alerts)
    };
  }

  async function refreshState(showFeedback) {
    const origin = String(getSetting("sidecar_origin", DEFAULT_ORIGIN)).replace(/\/$/, "");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(`${origin}/api/overview`, {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`THOX sidecar returned ${response.status}`);
      state = mergeState(await response.json());
      state.runtime.status = state.runtime.status || "online";
      lastError = "";
    } catch (error) {
      state = mergeState(DEFAULT_STATE);
      state.runtime.status = "offline";
      lastError = error?.name === "AbortError" ? "THOX sidecar timed out" : String(error?.message || error);
      if (showFeedback) console.warn("[thox-hermes] refresh failed", error);
    } finally {
      clearTimeout(timeout);
      if (overlay?.dataset.open === "true") render();
    }
  }

  function status(value) {
    return String(value || "unknown").toLowerCase();
  }

  function statusLine(value, label) {
    const stateValue = status(value);
    return `<span class="thox-status-line"><span class="thox-status-dot" data-state="${escapeHtml(stateValue)}"></span>${escapeHtml(label || stateValue)}</span>`;
  }

  function metric(label, value, helper) {
    return `<article class="thox-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(helper)}</small></article>`;
  }

  function header(title, copy) {
    return `<div class="thox-toolbar"><div class="thox-toolbar-copy"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p></div>${statusLine(state.runtime.status, state.runtime.status === "online" ? "local runtime online" : "local runtime unavailable")}</div>`;
  }

  function row(item, kind) {
    const name = item.name || item.id || "Unnamed";
    const descriptor = item.role || item.class || item.domain || item.provider || "";
    const secondary = item.model || item.channel || item.provider || item.version || "";
    const itemStatus = item.status || "unknown";
    let actions = "";
    if (kind === "human") {
      actions = `<button class="thox-action primary" data-launch-human="${escapeHtml(item.id)}">Open chat</button>`;
    } else if (kind === "device") {
      actions = `<button class="thox-action" data-device-id="${escapeHtml(item.id)}" data-device-command="diagnostics">Diagnostics</button><button class="thox-action" data-device-mode="${escapeHtml(item.id)}">Use mode</button>`;
    }
    return `<article class="thox-row"><div class="thox-row-main"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(descriptor)}</span></div><div class="thox-row-meta">${escapeHtml(secondary)}</div><span class="thox-row-chip">${escapeHtml(itemStatus)}</span><div class="thox-row-actions">${actions}</div></article>`;
  }

  function renderOverview() {
    const onlineDevices = state.devices.filter((device) => ["online", "healthy", "ready"].includes(status(device.status))).length;
    const activeAgents = state.internal_agents.filter((agent) => !["offline", "disabled", "error"].includes(status(agent.status))).length;
    return `${header("Private agent operations across every THOX surface", "Operate DigitalHumans, internal Hermes agents, local inference routes, and THOX devices from one consistent control fabric.")}
      ${lastError ? `<div class="thox-error">${escapeHtml(lastError)}. Start the THOX sidecar for live telemetry; configured definitions remain available offline.</div>` : ""}
      <section class="thox-metric-grid">
        ${metric("DigitalHumans", state.digital_humans.length, "persona and role profiles")}
        ${metric("Internal agents", activeAgents, "configured or active")}
        ${metric("Devices online", onlineDevices, `${state.devices.length} registered`) }
        ${metric("Routes", state.routes.length, "local, mesh, fallback")}
      </section>
      <section class="thox-section"><div class="thox-section-header"><h3>DigitalHuman command</h3><span>humanfabric</span></div><div class="thox-list">${state.digital_humans.map((item) => row(item, "human")).join("")}</div></section>
      <section class="thox-section"><div class="thox-section-header"><h3>Device fleet</h3><span>meshstack</span></div><div class="thox-list">${state.devices.slice(0, 5).map((item) => row(item, "device")).join("")}</div></section>`;
  }

  function renderCollection(title, copy, items, kind) {
    return `${header(title, copy)}<div class="thox-list">${items.length ? items.map((item) => row(item, kind)).join("") : '<div class="thox-empty">No records are available.</div>'}</div>`;
  }

  function renderDeviceModes() {
    const current = document.documentElement.dataset.thoxDevice || "web";
    const names = {
      web: "Web / desktop",
      thoxnova: "ThoxNova",
      thoxmini: "ThoxMini",
      "thoxmini-air": "ThoxMini Air",
      thoxclip: "ThoxClip",
      thoxkey: "ThoxKey"
    };
    return `${header("One THOX experience, adapted to each device", "Device modes preserve the same agent identity, controls, and privacy posture while reducing layout density for the target surface.")}
      <section class="thox-section"><div class="thox-section-header"><h3>Active device mode</h3><span>${escapeHtml(names[current] || current)}</span></div><div class="thox-device-selector">${DEVICE_MODES.map((mode) => `<button type="button" data-device-mode="${mode}" aria-pressed="${String(mode === current)}">${escapeHtml(names[mode])}</button>`).join("")}</div></section>
      <section class="thox-section"><div class="thox-section-header"><h3>Behavior</h3><span>responsive PWA</span></div><div class="thox-list">
        <article class="thox-row"><div class="thox-row-main"><strong>Web / desktop</strong><span>Full three-panel Hermes workspace plus THOX command fabric.</span></div><div class="thox-row-meta">Mac, Windows, Linux, browser</div><span class="thox-row-chip">full</span><div></div></article>
        <article class="thox-row"><div class="thox-row-main"><strong>ThoxNova</strong><span>Touch-first command surface with reduced width and larger hit targets.</span></div><div class="thox-row-meta">6-inch portrait slate</div><span class="thox-row-chip">touch</span><div></div></article>
        <article class="thox-row"><div class="thox-row-main"><strong>Mini / Air / Clip / Key</strong><span>Companion shell that prioritizes chat, status, and a compact device command panel.</span></div><div class="thox-row-meta">edge companion</div><span class="thox-row-chip">compact</span><div></div></article>
      </div></section>`;
  }

  function render() {
    if (!content) return;
    const renderers = {
      overview: renderOverview,
      "digital-humans": () => renderCollection("DigitalHuman roster", "Manage THOX DigitalHuman identities and open a governed Hermes session with the selected persona.", state.digital_humans, "human"),
      agents: () => renderCollection("Internal agent teams", "See the functional agents that support research, orchestration, implementation, review, and operations.", state.internal_agents, "agent"),
      devices: () => renderCollection("THOX device fleet", "Keep one branded operating model across ThoxNova, ThoxMini, ThoxMini Air, ThoxClip, ThoxKey, ThoxWatch, and ThoxVault.", state.devices, "device"),
      routes: () => renderCollection("Inference and mesh routes", "Surface local inference, MeshStack connectivity, and explicitly configured fallback routes without exposing provider secrets.", state.routes, "route"),
      "device-modes": renderDeviceModes
    };
    content.innerHTML = (renderers[activeTab] || renderOverview)();
  }

  function setDeviceMode(mode, persist) {
    if (!DEVICE_MODES.includes(mode)) return;
    document.documentElement.dataset.thoxDevice = mode;
    if (persist) setStored("device_mode", mode);
    if (overlay?.dataset.open === "true") render();
  }

  function launchDigitalHuman(id) {
    const human = state.digital_humans.find((item) => String(item.id) === String(id));
    if (!human) return;
    closeCommandFabric();
    document.getElementById("btnNewChat")?.click();
    window.setTimeout(() => {
      const input = document.querySelector("#msg, #messageInput, #promptInput, textarea");
      if (!input) return;
      const prompt = `Activate the ${human.name} DigitalHuman profile (${human.role}). Use THOX Hermes governance, local-first routing, privacy-preserving tools, and the current workspace context.`;
      input.value = prompt;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    }, 120);
  }

  async function runSafeDeviceCommand(deviceId, command) {
    const origin = String(getSetting("sidecar_origin", DEFAULT_ORIGIN)).replace(/\/$/, "");
    try {
      const response = await fetch(`${origin}/api/devices/${encodeURIComponent(deviceId)}/commands`, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ command })
      });
      if (!response.ok) throw new Error(`Command rejected (${response.status})`);
      const result = await response.json();
      window.dispatchEvent(new CustomEvent("thox:toast", { detail: result }));
      await refreshState(false);
    } catch (error) {
      lastError = String(error?.message || error);
      render();
    }
  }

  function initialize() {
    applyBranding();
    injectNavigation();
    injectOverlay();
    refreshState(false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
