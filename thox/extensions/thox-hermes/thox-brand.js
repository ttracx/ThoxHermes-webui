(() => {
  "use strict";

  /**
   * THOX Hermes Suite browser extension.
   *
   * Design constraints:
   * - Never rename Hermes API routes, CSRF headers, DOM IDs, or localStorage keys.
   * - Brand only user-visible text and presentation.
   * - Use same-origin assets and existing authenticated WebUI APIs.
   * - Fail softly when upstream selectors change.
   */

  const EXTENSION_ID = "thox-hermes-suite";
  const STORAGE_PREFIX = "thox-hermes:";
  const DEVICE_PROFILES = ["auto", "nova", "mini", "mini-air", "clip", "key", "watch"];
  const currentScript = document.currentScript;
  const extensionBase = currentScript?.src
    ? new URL("./", currentScript.src)
    : new URL("/extensions/thox-hermes/", window.location.origin);
  const assetUrl = (path) => new URL(path, extensionBase).toString();

  const agents = [
    {
      id: "sadie-weaving",
      icon: "SW",
      label: "Sadie Weaving",
      description: "Chief Agentic Officer and executive DigitalHuman.",
      prompt:
        "Activate Sadie Weaving, THOX Hermes Chief Agentic Officer. Use THOX.ai product truth, coordinate specialist agents, preserve local-first privacy, and return an execution-ready plan with owners, dependencies, risks, and next actions."
    },
    {
      id: "internal-orchestrator",
      icon: "AO",
      label: "Agent Orchestrator",
      description: "Route work across THOX internal specialist agents.",
      prompt:
        "Act as the THOX internal Agent Orchestrator. Decompose this session into parallel specialist workstreams, assign the correct DigitalHuman or internal agent to each stream, define handoff contracts, and maintain a concise execution ledger."
    },
    {
      id: "device-engineer",
      icon: "DE",
      label: "Device Engineer",
      description: "Hardware, firmware, CAD, printing, and validation.",
      prompt:
        "Activate the THOX Device Engineering agent. Prioritize manufacturability, accurate device specifications, repairability, printable assembly architecture, verification evidence, and cross-device consistency."
    },
    {
      id: "platform-engineer",
      icon: "PE",
      label: "Platform Engineer",
      description: "THOXCore, ThoxRoute, MeshStack, and local inference.",
      prompt:
        "Activate the THOX Platform Engineering agent. Work across THOXCore, ThoxRoute, MeshStack, local model runtimes, device APIs, observability, security, tests, and deployment automation."
    },
    {
      id: "customer-experience",
      icon: "CX",
      label: "Experience Fabric",
      description: "Customer experience, content, support, and UX learning.",
      prompt:
        "Activate the THOX Customer Experience Fabric agent. Align messaging with product truth and THOX.ai branding, identify customer intent, recommend measurable UX improvements, and produce implementation-ready outputs."
    },
    {
      id: "security-reviewer",
      icon: "SR",
      label: "Security Reviewer",
      description: "Local-first threat review and safe execution controls.",
      prompt:
        "Activate the THOX Security Review agent. Apply least privilege, local-first data handling, secrets hygiene, auditability, explicit approval for destructive actions, and actionable remediation with verification steps."
    }
  ];

  const quickActions = [
    {
      id: "new-chat",
      icon: "+",
      label: "New session",
      description: "Open a clean THOX Hermes conversation.",
      type: "dom",
      selectors: [
        "#newSessionBtn",
        "#btnNewSession",
        "[data-action='new-session']",
        "[aria-label='New conversation']",
        "[aria-label='New chat']"
      ]
    },
    {
      id: "workspace",
      icon: "WS",
      label: "Workspace",
      description: "Open files, previews, and project context.",
      type: "dom",
      selectors: [
        "#workspaceToggle",
        "#btnWorkspace",
        "[data-action='workspace']",
        "[aria-label*='Workspace']"
      ]
    },
    {
      id: "terminal",
      icon: ">_",
      label: "Terminal",
      description: "Open the authenticated Hermes terminal surface.",
      type: "dom",
      selectors: [
        "#terminalToggle",
        "#btnTerminal",
        "[data-action='terminal']",
        "[aria-label*='Terminal']"
      ]
    },
    {
      id: "fleet-status",
      icon: "FS",
      label: "Fleet status",
      description: "Prepare a device and agent health audit.",
      type: "prompt",
      prompt:
        "Audit the current THOX device and internal-agent fleet. Report reachable services, model/provider status, active sessions, failed jobs, resource pressure, security warnings, and prioritized remediation."
    },
    {
      id: "meshstack",
      icon: "MS",
      label: "MeshStack",
      description: "Coordinate connected and offline THOX nodes.",
      type: "prompt",
      prompt:
        "Open a MeshStack operations session. Discover available THOX nodes, summarize connectivity and synchronization state, identify stale or conflicting state, and recommend safe reconciliation actions."
    },
    {
      id: "thoxroute",
      icon: "TR",
      label: "ThoxRoute",
      description: "Inspect local and fallback model routing.",
      type: "prompt",
      prompt:
        "Inspect ThoxRoute for this environment. Summarize the active local model, fallback providers, endpoint health, context limits, recent routing failures, latency, and the safest optimization opportunities."
    }
  ];

  function getExtensionSettings() {
    try {
      const api = window.HermesExtensionSettings || window.hermesExt?.settings;
      if (window.HermesExtensionSettings?.settingsForExtension) {
        return window.HermesExtensionSettings.settingsForExtension(EXTENSION_ID);
      }
      if (api?.forExtension) {
        return api.forExtension(EXTENSION_ID);
      }
    } catch (error) {
      console.warn("[THOX Hermes] Extension settings unavailable", error);
    }
    return null;
  }

  function getSetting(key, fallback) {
    try {
      const settings = getExtensionSettings();
      const value = settings?.get?.(key);
      if (value !== undefined && value !== null) return value;
      const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return stored === null ? fallback : JSON.parse(stored);
    } catch (error) {
      console.warn(`[THOX Hermes] Could not read setting ${key}`, error);
      return fallback;
    }
  }

  function setSetting(key, value) {
    try {
      const settings = getExtensionSettings();
      if (settings?.set) settings.set(key, value);
      window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn(`[THOX Hermes] Could not persist setting ${key}`, error);
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

  function inferDeviceProfile() {
    const explicit = new URLSearchParams(window.location.search).get("device");
    if (explicit && DEVICE_PROFILES.includes(explicit)) return explicit;

    const saved = getSetting("device_profile", "auto");
    if (saved && saved !== "auto" && DEVICE_PROFILES.includes(saved)) return saved;

    const shortestSide = Math.min(window.screen?.width || window.innerWidth, window.screen?.height || window.innerHeight);
    if (shortestSide <= 390) return "watch";
    if (window.innerWidth <= 560) return "mini-air";
    if (window.innerWidth <= 820) return "mini";
    return "nova";
  }

  function setDeviceProfile(profile, persist = true) {
    const normalized = DEVICE_PROFILES.includes(profile) ? profile : "auto";
    const resolved = normalized === "auto" ? inferDeviceProfile() : normalized;
    document.documentElement.dataset.thoxDevice = resolved;
    if (persist) setSetting("device_profile", normalized);

    document.querySelectorAll(".thox-device-chip").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.profile === normalized));
    });

    const profileLabel = document.querySelector("[data-thox-profile-label]");
    if (profileLabel) profileLabel.textContent = normalized === "auto" ? `Auto · ${resolved}` : normalized;

    document.dispatchEvent(new CustomEvent("thox:device-profile", { detail: { profile: resolved } }));
  }

  function replaceTextNode(node) {
    if (!node?.nodeValue || !/Hermes/i.test(node.nodeValue)) return;
    const parent = node.parentElement;
    if (!parent) return;
    if (parent.closest("script, style, code, pre, textarea, input, [contenteditable='true']")) return;

    let value = node.nodeValue;
    value = value.replace(/\bHermes Control Center\b/g, "THOX Command Center");
    value = value.replace(/\bHermes WebUI\b/g, "THOX Hermes");
    value = value.replace(/\bHermes Web UI\b/g, "THOX Hermes");
    value = value.replace(/\bHermes Agent\b/g, "THOX Hermes Agent");
    value = value.replace(/(?<!THOX )\bHermes\b/g, "THOX Hermes");
    node.nodeValue = value;
  }

  function brandSubtree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      replaceTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest("script, style, code, pre, textarea, input, [contenteditable='true']")) {
          return NodeFilter.FILTER_REJECT;
        }
        return /Hermes/i.test(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(replaceTextNode);
  }

  function applyDocumentBranding() {
    document.documentElement.classList.add("thox-hermes", "dark");
    document.title = "THOX Hermes";

    const metaUpdates = [
      ["meta[name='application-name']", "THOX Hermes"],
      ["meta[name='apple-mobile-web-app-title']", "THOX Hermes"],
      ["meta[name='theme-color']", "#050806"]
    ];
    metaUpdates.forEach(([selector, value]) => {
      document.querySelectorAll(selector).forEach((element) => element.setAttribute("content", value));
    });

    const titlebarIcon = document.querySelector(".app-titlebar-icon");
    if (titlebarIcon && !titlebarIcon.querySelector(".thox-titlebar-mark")) {
      titlebarIcon.textContent = "";
      const mark = document.createElement("img");
      mark.className = "thox-titlebar-mark";
      mark.src = assetUrl("assets/thox-mark.svg");
      mark.alt = "";
      mark.setAttribute("aria-hidden", "true");
      titlebarIcon.append(mark);
    }

    const iconLinks = document.querySelectorAll("link[rel~='icon'], link[rel='apple-touch-icon']");
    iconLinks.forEach((link) => {
      link.href = assetUrl("assets/thox-mark.svg");
      link.type = "image/svg+xml";
    });

    const manifestLink = document.querySelector("link[rel='manifest']");
    if (manifestLink) manifestLink.href = assetUrl("assets/manifest.webmanifest");

    brandSubtree(document.body);
  }

  function findComposer() {
    const candidates = [
      "#messageInput",
      "#composerInput",
      "#chatInput",
      "textarea[name='message']",
      ".composer textarea",
      "textarea",
      "[contenteditable='true'][role='textbox']",
      "[contenteditable='true']"
    ];
    return candidates.map((selector) => document.querySelector(selector)).find(Boolean) || null;
  }

  function setComposerValue(composer, text) {
    if (!composer) return false;
    composer.focus();
    if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(composer), "value")?.set;
      if (setter) setter.call(composer, text);
      else composer.value = text;
    } else {
      composer.textContent = text;
    }
    composer.dispatchEvent(new Event("input", { bubbles: true }));
    composer.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function findSendButton() {
    const selectors = [
      "#sendBtn",
      "#btnSend",
      "[data-action='send']",
      "button[aria-label='Send']",
      "button[aria-label*='Send message']",
      ".composer button[type='submit']"
    ];
    return selectors.map((selector) => document.querySelector(selector)).find(Boolean) || null;
  }

  async function copyFallback(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Activation prompt copied to clipboard.");
      return true;
    } catch (error) {
      console.warn("[THOX Hermes] Clipboard fallback failed", error);
      return false;
    }
  }

  async function preparePrompt(prompt, options = {}) {
    const composer = findComposer();
    if (!composer || !setComposerValue(composer, prompt)) {
      await copyFallback(prompt);
      toast("Composer was not found. Prompt copied instead.");
      return false;
    }

    const autosend = options.autosend ?? getSetting("agent_autosend", false);
    if (autosend) {
      const send = findSendButton();
      if (send && !send.disabled) {
        send.click();
        toast("THOX agent activation sent.");
        return true;
      }
      toast("Prompt prepared. Send control is not currently available.");
      return false;
    }

    toast("THOX agent activation prepared in the composer.");
    return true;
  }

  function clickFirst(selectors) {
    for (const selector of selectors || []) {
      const element = document.querySelector(selector);
      if (element instanceof HTMLElement && !element.hasAttribute("disabled")) {
        element.click();
        return true;
      }
    }
    return false;
  }

  async function runQuickAction(action) {
    if (action.type === "prompt") {
      await preparePrompt(action.prompt);
      closeLauncher();
      return;
    }
    if (action.type === "dom" && clickFirst(action.selectors)) {
      closeLauncher();
      return;
    }
    toast(`${action.label} is not exposed by this upstream build yet.`);
  }

  function createActionButton(item, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "thox-action";
    button.dataset.actionId = item.id;

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

  function createSection(title) {
    const section = document.createElement("section");
    section.className = "thox-section";
    const heading = document.createElement("h2");
    heading.className = "thox-section__heading";
    heading.textContent = title;
    section.append(heading);
    return section;
  }

  function createLauncher() {
    if (document.querySelector(".thox-launcher-button")) return;
    if (!getSetting("show_launcher", true)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "thox-launcher-button";
    button.setAttribute("aria-label", "Open THOX Command Center");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "thoxCommandCenter");

    const buttonMark = document.createElement("img");
    buttonMark.src = assetUrl("assets/thox-mark.svg");
    buttonMark.alt = "";
    buttonMark.setAttribute("aria-hidden", "true");
    button.append(buttonMark);

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
    const title = document.createElement("h1");
    title.className = "thox-command-center__title";
    title.textContent = "THOX Hermes";
    const subtitle = document.createElement("p");
    subtitle.className = "thox-command-center__subtitle";
    subtitle.textContent = "Your AI. Your Data. Your Rules.";
    identityCopy.append(title, subtitle);
    identity.append(mark, identityCopy);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "thox-command-center__close";
    close.setAttribute("aria-label", "Close THOX Command Center");
    close.textContent = "×";
    close.addEventListener("click", closeLauncher);
    header.append(identity, close);

    const body = document.createElement("div");
    body.className = "thox-command-center__body";

    const agentsSection = createSection("DigitalHumans and internal agents");
    const agentGrid = document.createElement("div");
    agentGrid.className = "thox-grid";
    agents.forEach((agent) => {
      agentGrid.append(createActionButton(agent, async () => {
        await preparePrompt(agent.prompt);
        closeLauncher();
      }));
    });
    agentsSection.append(agentGrid);

    const appsSection = createSection("Device and platform apps");
    const appGrid = document.createElement("div");
    appGrid.className = "thox-grid";
    quickActions.forEach((action) => {
      appGrid.append(createActionButton(action, () => runQuickAction(action)));
    });
    appsSection.append(appGrid);

    const deviceSection = createSection("Adaptive device profile");
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
    profileText.textContent = "Auto";
    status.append(dot, statusText, profileText);

    body.append(agentsSection, appsSection, deviceSection, status);
    panel.append(header, body);
    document.body.append(panel, button);

    button.addEventListener("click", () => {
      if (panel.hidden) openLauncher();
      else closeLauncher();
    });

    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        panel.hidden ? openLauncher() : closeLauncher();
      }
      if (event.key === "Escape" && !panel.hidden) closeLauncher();
    });

    document.addEventListener("pointerdown", (event) => {
      if (panel.hidden) return;
      if (!panel.contains(event.target) && !button.contains(event.target)) closeLauncher();
    });

    setDeviceProfile(getSetting("device_profile", "auto"), false);
    checkHealth(status, statusText);
  }

  function openLauncher() {
    const panel = document.querySelector(".thox-command-center");
    const button = document.querySelector(".thox-launcher-button");
    if (!panel || !button) return;
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    window.requestAnimationFrame(() => panel.querySelector("button")?.focus());
  }

  function closeLauncher() {
    const panel = document.querySelector(".thox-command-center");
    const button = document.querySelector(".thox-launcher-button");
    if (!panel || !button) return;
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    button.focus({ preventScroll: true });
  }

  async function checkHealth(statusElement, textElement) {
    try {
      const response = await fetch(new URL("health", document.baseURI), {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      statusElement.dataset.state = "online";
      textElement.textContent = "THOX Hermes backend online";
    } catch (error) {
      statusElement.dataset.state = "offline";
      textElement.textContent = "Backend unavailable";
      console.warn("[THOX Hermes] Health check failed", error);
    }
  }

  function observeDynamicBranding() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(brandSubtree);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    try {
      applyDocumentBranding();
      setDeviceProfile(getSetting("device_profile", "auto"), false);
      createLauncher();
      observeDynamicBranding();

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
      console.error("[THOX Hermes] Extension initialization failed", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
