(() => {
  "use strict";

  const EXTENSION_ID = "thox-hermes-suite";
  const STORAGE_PREFIX = "thox-hermes:";
  const DEVICE_PROFILES = ["auto", "nova", "mini", "mini-air", "clip", "key", "watch"];
  const currentScript = document.currentScript;
  const extensionBase = currentScript?.src
    ? new URL("./", currentScript.src)
    : new URL("/extensions/thox-hermes/", window.location.origin);
  const assetUrl = (path) => new URL(path, extensionBase).toString();

  const agents = Object.freeze([
    {
      id: "sadie-weaving",
      icon: "SW",
      label: "Sadie Weaving",
      description: "Chief Agentic Officer and executive DigitalHuman.",
      prompt: "Activate Sadie Weaving, THOX Hermes Chief Agentic Officer. Use THOX.ai product truth, coordinate specialist agents, preserve local-first privacy, and return an execution-ready plan with owners, dependencies, risks, and next actions."
    },
    {
      id: "internal-orchestrator",
      icon: "AO",
      label: "Agent Orchestrator",
      description: "Route work across THOX internal specialist agents.",
      prompt: "Act as the THOX internal Agent Orchestrator. Decompose this session into parallel specialist workstreams, assign the correct DigitalHuman or internal agent to each stream, define handoff contracts, and maintain a concise execution ledger."
    },
    {
      id: "device-engineer",
      icon: "DE",
      label: "Device Engineer",
      description: "Hardware, firmware, CAD, printing, and validation.",
      prompt: "Activate the THOX Device Engineering agent. Prioritize manufacturability, accurate device specifications, repairability, printable assembly architecture, verification evidence, and cross-device consistency."
    },
    {
      id: "platform-engineer",
      icon: "PE",
      label: "Platform Engineer",
      description: "THOXCore, ThoxRoute, MeshStack, and local inference.",
      prompt: "Activate the THOX Platform Engineering agent. Work across THOXCore, ThoxRoute, MeshStack, local model runtimes, device APIs, observability, security, tests, and deployment automation."
    },
    {
      id: "customer-experience",
      icon: "CX",
      label: "Experience Fabric",
      description: "Customer experience, support, content, and UX learning.",
      prompt: "Activate the THOX Customer Experience Fabric agent. Align messaging with product truth and THOX.ai branding, identify customer intent, recommend measurable UX improvements, and produce implementation-ready outputs."
    },
    {
      id: "security-reviewer",
      icon: "SR",
      label: "Security Reviewer",
      description: "Local-first threat review and safe execution controls.",
      prompt: "Activate the THOX Security Review agent. Apply least privilege, local-first data handling, secrets hygiene, auditability, explicit approval for destructive actions, and actionable remediation with verification steps."
    }
  ]);

  const quickActions = Object.freeze([
    {
      id: "new-chat",
      icon: "+",
      label: "New session",
      description: "Open a clean THOX Hermes conversation.",
      selectors: ["#btnNewChat", "#btnTitlebarNewChat", "#newSessionBtn", "[data-action='new-session']", "[aria-label='New conversation']"]
    },
    {
      id: "workspace",
      icon: "WS",
      label: "Workspace",
      description: "Open files, previews, and project context.",
      selectors: ["#workspaceToggle", "#btnWorkspace", "[data-action='workspace']", "[aria-label*='Workspace']"]
    },
    {
      id: "terminal",
      icon: ">_",
      label: "Terminal",
      description: "Open the authenticated Hermes terminal surface.",
      selectors: ["#terminalToggle", "#btnTerminal", "[data-action='terminal']", "[aria-label*='Terminal']"]
    },
    {
      id: "fleet-status",
      icon: "FS",
      label: "Fleet status",
      description: "Prepare a device and agent health audit.",
      prompt: "Audit the current THOX device and internal-agent fleet. Report reachable services, model/provider status, active sessions, failed jobs, resource pressure, security warnings, and prioritized remediation."
    },
    {
      id: "meshstack",
      icon: "MS",
      label: "MeshStack",
      description: "Coordinate connected and offline THOX nodes.",
      prompt: "Open a MeshStack operations session. Discover available THOX nodes, summarize connectivity and synchronization state, identify stale or conflicting state, and recommend safe reconciliation actions."
    },
    {
      id: "thoxroute",
      icon: "TR",
      label: "ThoxRoute",
      description: "Inspect local and fallback model routing.",
      prompt: "Inspect ThoxRoute for this environment. Summarize the active local model, fallback providers, endpoint health, context limits, recent routing failures, latency, and the safest optimization opportunities."
    }
  ]);

  function extensionSettings() {
    try {
      if (window.HermesExtensionSettings?.settingsForExtension) {
        return window.HermesExtensionSettings.settingsForExtension(EXTENSION_ID);
      }
      if (window.hermesExt?.settings?.forExtension) {
        return window.hermesExt.settings.forExtension(EXTENSION_ID);
      }
    } catch (error) {
      console.warn("[THOX Hermes] Extension settings unavailable", error);
    }
    return null;
  }

  function getSetting(key, fallback) {
    try {
      const value = extensionSettings()?.get?.(key);
      if (value !== undefined && value !== null) return value;
      const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return stored === null ? fallback : JSON.parse(stored);
    } catch (error) {
      console.warn(`[THOX Hermes] Could not read ${key}`, error);
      return fallback;
    }
  }

  function setSetting(key, value) {
    try {
      extensionSettings()?.set?.(key, value);
      window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn(`[THOX Hermes] Could not save ${key}`, error);
    }
  }

  function toast(message, timeout = 3200) {
    let region = document.querySelector(".thox-toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "thox-toast-region";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.append(region);
    }
    const item = document.createElement("div");
    item.className = "thox-toast";
    item.textContent = message;
    region.append(item);
    window.setTimeout(() => item.remove(), timeout);
  }

  function inferredDeviceProfile() {
    const requested = new URLSearchParams(window.location.search).get("device");
    if (requested && DEVICE_PROFILES.includes(requested) && requested !== "auto") return requested;
    const shortestSide = Math.min(window.screen?.width || innerWidth, window.screen?.height || innerHeight);
    if (shortestSide <= 390) return "watch";
    if (innerWidth <= 560) return "mini-air";
    if (innerWidth <= 820) return "mini";
    return "nova";
  }

  function setDeviceProfile(profile, persist = true) {
    const normalized = DEVICE_PROFILES.includes(profile) ? profile : "auto";
    const resolved = normalized === "auto" ? inferredDeviceProfile() : normalized;
    document.documentElement.dataset.thoxDevice = resolved;
    if (persist) setSetting("device_profile", normalized);

    document.querySelectorAll(".thox-device-chip").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.profile === normalized));
    });
    const label = document.querySelector("[data-thox-profile-label]");
    if (label) label.textContent = normalized === "auto" ? `Auto · ${resolved}` : normalized;
    document.dispatchEvent(new CustomEvent("thox:device-profile", { detail: { profile: resolved } }));
  }

  function applyBrand() {
    document.documentElement.classList.add("thox-hermes", "dark");
    document.title = "THOX Hermes";
    document.querySelectorAll("meta[name='theme-color']").forEach((meta) => meta.setAttribute("content", "#050806"));
    document.querySelector("meta[name='apple-mobile-web-app-title']")?.setAttribute("content", "THOX Hermes");

    const title = document.querySelector("#appTitlebarTitle");
    if (title) title.textContent = "THOX Hermes";
    const subtitle = document.querySelector("#appTitlebarSub");
    if (subtitle) {
      subtitle.textContent = "LOCAL AGENT FABRIC";
      subtitle.hidden = false;
    }

    const icon = document.querySelector(".app-titlebar-icon");
    if (icon) {
      icon.textContent = "";
      const mark = document.createElement("img");
      mark.className = "thox-titlebar-mark";
      mark.src = assetUrl("assets/thox-mark.svg");
      mark.alt = "";
      mark.setAttribute("aria-hidden", "true");
      icon.append(mark);
    }

    document.querySelectorAll("link[rel~='icon'], link[rel='apple-touch-icon']").forEach((link) => {
      link.href = assetUrl("assets/thox-mark.svg");
      link.type = "image/svg+xml";
    });
    const manifest = document.querySelector("link[rel='manifest']");
    if (manifest) manifest.href = assetUrl("assets/manifest.webmanifest");
  }

  function composer() {
    return ["#messageInput", "#composerInput", "#chatInput", "textarea[name='message']", ".composer textarea", "textarea", "[contenteditable='true'][role='textbox']"]
      .map((selector) => document.querySelector(selector))
      .find(Boolean) || null;
  }

  function updateComposer(target, text) {
    if (!target) return false;
    target.focus();
    if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), "value")?.set;
      if (setter) setter.call(target, text);
      else target.value = text;
    } else {
      target.textContent = text;
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function sendButton() {
    return ["#sendBtn", "#btnSend", "[data-action='send']", "button[aria-label='Send']", ".composer button[type='submit']"]
      .map((selector) => document.querySelector(selector))
      .find(Boolean) || null;
  }

  async function preparePrompt(prompt, options = {}) {
    const target = composer();
    if (!target || !updateComposer(target, prompt)) {
      try {
        await navigator.clipboard.writeText(prompt);
        toast("Composer unavailable; activation prompt copied.");
      } catch (error) {
        console.warn("[THOX Hermes] Prompt preparation failed", error);
        toast("Composer unavailable. Open a session and retry.");
      }
      return false;
    }

    const autosend = options.autosend ?? getSetting("agent_autosend", false);
    if (autosend) {
      const button = sendButton();
      if (button && !button.disabled) {
        button.click();
        toast("THOX agent activation sent.");
        return true;
      }
    }
    toast("THOX agent activation prepared in the composer.");
    return true;
  }

  function clickFirst(selectors = []) {
    for (const selector of selectors) {
      const target = document.querySelector(selector);
      if (target instanceof HTMLElement && !target.hasAttribute("disabled")) {
        target.click();
        return true;
      }
    }
    return false;
  }

  function actionButton(item, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "thox-action";
    const icon = document.createElement("span");
    icon.className = "thox-action__icon";
    icon.textContent = item.icon;
    icon.setAttribute("aria-hidden", "true");
    const copy = document.createElement("span");
    copy.className = "thox-action__copy";
    const label = document.createElement("span");
    label.className = "thox-action__label";
    label.textContent = item.label;
    const description = document.createElement("span");
    description.className = "thox-action__description";
    description.textContent = item.description;
    copy.append(label, description);
    button.append(icon, copy);
    button.addEventListener("click", handler);
    return button;
  }

  function section(title) {
    const wrapper = document.createElement("section");
    wrapper.className = "thox-section";
    const heading = document.createElement("h2");
    heading.className = "thox-section__heading";
    heading.textContent = title;
    wrapper.append(heading);
    return wrapper;
  }

  function closeLauncher({ restoreFocus = true } = {}) {
    const panel = document.querySelector(".thox-command-center");
    const button = document.querySelector(".thox-launcher-button");
    if (!panel || !button) return;
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    if (restoreFocus) button.focus({ preventScroll: true });
  }

  function openLauncher() {
    const panel = document.querySelector(".thox-command-center");
    const button = document.querySelector(".thox-launcher-button");
    if (!panel || !button) return;
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => panel.querySelector("button")?.focus());
  }

  async function healthCheck(status, text) {
    try {
      const response = await fetch(new URL("health", document.baseURI), {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      status.dataset.state = "online";
      text.textContent = "THOX Hermes backend online";
    } catch (error) {
      status.dataset.state = "offline";
      text.textContent = "Backend unavailable";
      console.warn("[THOX Hermes] Health check failed", error);
    }
  }

  function createLauncher() {
    if (document.querySelector(".thox-launcher-button") || !getSetting("show_launcher", true)) return;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "thox-launcher-button";
    trigger.setAttribute("aria-label", "Open THOX Command Center");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", "thoxCommandCenter");
    const triggerMark = document.createElement("img");
    triggerMark.src = assetUrl("assets/thox-mark.svg");
    triggerMark.alt = "";
    trigger.append(triggerMark);

    const panel = document.createElement("aside");
    panel.id = "thoxCommandCenter";
    panel.className = "thox-command-center";
    panel.setAttribute("aria-label", "THOX Command Center");
    panel.hidden = true;

    const header = document.createElement("div");
    header.className = "thox-command-center__header";
    const identity = document.createElement("div");
    identity.className = "thox-command-center__identity";
    const mark = document.createElement("img");
    mark.src = assetUrl("assets/thox-mark.svg");
    mark.alt = "THOX.ai";
    const identityCopy = document.createElement("div");
    const heading = document.createElement("h1");
    heading.className = "thox-command-center__title";
    heading.textContent = "THOX Hermes";
    const subheading = document.createElement("p");
    subheading.className = "thox-command-center__subtitle";
    subheading.textContent = "Your AI. Your Data. Your Rules.";
    identityCopy.append(heading, subheading);
    identity.append(mark, identityCopy);
    const close = document.createElement("button");
    close.type = "button";
    close.className = "thox-command-center__close";
    close.setAttribute("aria-label", "Close THOX Command Center");
    close.textContent = "×";
    close.addEventListener("click", () => closeLauncher());
    header.append(identity, close);

    const body = document.createElement("div");
    body.className = "thox-command-center__body";
    const agentSection = section("DigitalHumans and internal agents");
    const agentGrid = document.createElement("div");
    agentGrid.className = "thox-grid";
    agents.forEach((agent) => agentGrid.append(actionButton(agent, async () => {
      await preparePrompt(agent.prompt);
      closeLauncher({ restoreFocus: false });
    })));
    agentSection.append(agentGrid);

    const appSection = section("Device and platform apps");
    const appGrid = document.createElement("div");
    appGrid.className = "thox-grid";
    quickActions.forEach((action) => appGrid.append(actionButton(action, async () => {
      if (action.prompt) await preparePrompt(action.prompt);
      else if (!clickFirst(action.selectors)) toast(`${action.label} is unavailable in this upstream build.`);
      closeLauncher({ restoreFocus: false });
    })));
    appSection.append(appGrid);

    const deviceSection = section("Adaptive device profile");
    const chips = document.createElement("div");
    chips.className = "thox-device-list";
    DEVICE_PROFILES.forEach((profile) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "thox-device-chip";
      chip.dataset.profile = profile;
      chip.textContent = profile === "mini-air" ? "Mini Air" : profile.charAt(0).toUpperCase() + profile.slice(1);
      chip.setAttribute("aria-pressed", "false");
      chip.addEventListener("click", () => setDeviceProfile(profile));
      chips.append(chip);
    });
    deviceSection.append(chips);

    const status = document.createElement("div");
    status.className = "thox-status";
    status.dataset.state = "checking";
    const dot = document.createElement("span");
    dot.className = "thox-status__dot";
    dot.setAttribute("aria-hidden", "true");
    const statusText = document.createElement("span");
    statusText.textContent = "Checking THOX Hermes backend…";
    const profileText = document.createElement("span");
    profileText.dataset.thoxProfileLabel = "";
    status.append(dot, statusText, profileText);

    body.append(agentSection, appSection, deviceSection, status);
    panel.append(header, body);
    document.body.append(panel, trigger);
    trigger.addEventListener("click", () => panel.hidden ? openLauncher() : closeLauncher());

    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        panel.hidden ? openLauncher() : closeLauncher();
      } else if (event.key === "Escape" && !panel.hidden) {
        closeLauncher();
      }
    });
    document.addEventListener("pointerdown", (event) => {
      if (!panel.hidden && !panel.contains(event.target) && !trigger.contains(event.target)) {
        closeLauncher({ restoreFocus: false });
      }
    });

    setDeviceProfile(getSetting("device_profile", "auto"), false);
    healthCheck(status, statusText);
  }

  function init() {
    try {
      applyBrand();
      setDeviceProfile(getSetting("device_profile", "auto"), false);
      createLauncher();
      window.THoxHermes = Object.freeze({
        version: "1.0.0",
        open: openLauncher,
        close: closeLauncher,
        setDeviceProfile,
        preparePrompt,
        agents: agents.map(({ id, label, description }) => ({ id, label, description }))
      });
      document.dispatchEvent(new CustomEvent("thox:ready", {
        detail: { version: window.THoxHermes.version, deviceProfile: document.documentElement.dataset.thoxDevice }
      }));
    } catch (error) {
      console.error("[THOX Hermes] Initialization failed", error);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
