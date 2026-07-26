(() => {
  "use strict";

  const STORAGE_KEY = "thox-hermes-gateway:endpoint";
  const CONNECTION_TIMEOUT_MS = 7000;
  const profiles = new Set(["auto", "nova", "mini", "mini-air", "clip", "key", "watch"]);
  const agents = new Set([
    "sadie-weaving",
    "internal-orchestrator",
    "device-engineer",
    "platform-engineer",
    "customer-experience",
    "none"
  ]);

  const profileLabels = {
    auto: "Automatic",
    nova: "ThoxNova",
    mini: "ThoxMini",
    "mini-air": "ThoxMini Air",
    clip: "ThoxClip",
    key: "ThoxKey",
    watch: "ThoxWatch"
  };

  const agentLabels = {
    "sadie-weaving": "Sadie Weaving",
    "internal-orchestrator": "Agent Orchestrator",
    "device-engineer": "Device Engineer",
    "platform-engineer": "Platform Engineer",
    "customer-experience": "Experience Fabric",
    none: "Open normally"
  };

  const state = {
    endpoint: "",
    profile: "auto",
    agent: "sadie-weaving",
    health: "idle"
  };

  const elements = {
    form: document.querySelector("#connectionForm"),
    endpoint: document.querySelector("#endpoint"),
    status: document.querySelector("#status"),
    statusText: document.querySelector("#statusText"),
    clearEndpoint: document.querySelector("#clearEndpoint"),
    deviceGrid: document.querySelector("#deviceGrid"),
    agentList: document.querySelector("#agentList"),
    selectionSummary: document.querySelector("#selectionSummary"),
    launchUrl: document.querySelector("#launchUrl"),
    launchButton: document.querySelector("#launchButton"),
    copyLink: document.querySelector("#copyLink")
  };

  function normalizeEndpoint(value) {
    const raw = String(value || "").trim();
    if (!raw) throw new Error("Enter a THOX Hermes endpoint.");

    let url;
    try {
      url = new URL(raw);
    } catch {
      throw new Error("Use a complete endpoint beginning with http:// or https://.");
    }

    if (!/^https?:$/.test(url.protocol)) {
      throw new Error("Only HTTP and HTTPS endpoints are supported.");
    }
    if (url.username || url.password) {
      throw new Error("Do not include credentials in the endpoint URL.");
    }
    if (!url.hostname) {
      throw new Error("The endpoint must include a valid hostname.");
    }

    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "");
  }

  function endpointUrl(pathname = "/", params = {}) {
    if (!state.endpoint) return "";
    const base = new URL(`${state.endpoint}/`);
    const target = new URL(pathname.replace(/^\//, ""), base);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        target.searchParams.set(key, String(value));
      }
    });
    return target.toString();
  }

  function buildLaunchUrl() {
    return endpointUrl("/", {
      device: state.profile,
      thoxAgent: state.agent,
      source: "thox-device-gateway"
    });
  }

  function setStatus(kind, message) {
    state.health = kind;
    elements.status.dataset.state = kind;
    elements.statusText.textContent = message;
  }

  function updateSelections() {
    document.querySelectorAll("[data-profile]").forEach((button) => {
      const selected = button.dataset.profile === state.profile;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    document.querySelectorAll("[data-agent]").forEach((button) => {
      const selected = button.dataset.agent === state.agent;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    elements.selectionSummary.textContent = `${profileLabels[state.profile]} · ${agentLabels[state.agent]}`;
    const launchUrl = buildLaunchUrl();
    elements.launchUrl.textContent = launchUrl || "Configure a trusted THOX Hermes endpoint above.";
    elements.launchButton.disabled = !launchUrl;
    elements.copyLink.disabled = !launchUrl;
  }

  async function checkHealth(endpoint) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);
    setStatus("checking", "Checking THOX Hermes…");

    try {
      const healthUrl = new URL("health", `${endpoint}/`).toString();
      const response = await fetch(healthUrl, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/json, text/plain;q=0.9" },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Health endpoint returned ${response.status}`);
      setStatus("online", "THOX Hermes is reachable");
      return true;
    } catch (error) {
      const message = error?.name === "AbortError"
        ? "Connection timed out"
        : "Endpoint saved; browser health check was blocked or unavailable";
      setStatus("offline", message);
      console.warn("[THOX Hermes Gateway] Health check failed", error);
      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function saveEndpoint(rawValue) {
    const endpoint = normalizeEndpoint(rawValue);
    state.endpoint = endpoint;
    elements.endpoint.value = endpoint;
    window.localStorage.setItem(STORAGE_KEY, endpoint);
    updateSelections();
    await checkHealth(endpoint);
    return endpoint;
  }

  function clearEndpoint() {
    state.endpoint = "";
    elements.endpoint.value = "";
    window.localStorage.removeItem(STORAGE_KEY);
    setStatus("idle", "No endpoint selected");
    updateSelections();
    elements.endpoint.focus();
  }

  function launch() {
    const url = buildLaunchUrl();
    if (!url) {
      elements.endpoint.focus();
      return;
    }
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(url);
  }

  async function copyLaunchLink() {
    const url = buildLaunchUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      const previous = elements.copyLink.textContent;
      elements.copyLink.textContent = "Copied";
      window.setTimeout(() => {
        elements.copyLink.textContent = previous;
      }, 1800);
    } catch (error) {
      console.warn("[THOX Hermes Gateway] Clipboard access failed", error);
      const temporary = document.createElement("textarea");
      temporary.value = url;
      temporary.setAttribute("readonly", "");
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      document.body.append(temporary);
      temporary.select();
      document.execCommand("copy");
      temporary.remove();
    }
  }

  function restoreState() {
    const query = new URLSearchParams(window.location.search);
    const queryProfile = query.get("device");
    const queryAgent = query.get("agent");
    if (queryProfile && profiles.has(queryProfile)) state.profile = queryProfile;
    if (queryAgent && agents.has(queryAgent)) state.agent = queryAgent;

    const savedEndpoint = window.localStorage.getItem(STORAGE_KEY);
    if (savedEndpoint) {
      try {
        state.endpoint = normalizeEndpoint(savedEndpoint);
        elements.endpoint.value = state.endpoint;
        checkHealth(state.endpoint);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  function bindEvents() {
    elements.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await saveEndpoint(elements.endpoint.value);
      } catch (error) {
        setStatus("offline", error.message || "Invalid endpoint");
        elements.endpoint.setCustomValidity(error.message || "Invalid endpoint");
        elements.endpoint.reportValidity();
        elements.endpoint.setCustomValidity("");
      }
    });

    elements.clearEndpoint.addEventListener("click", clearEndpoint);
    elements.deviceGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-profile]");
      if (!button || !profiles.has(button.dataset.profile)) return;
      state.profile = button.dataset.profile;
      updateSelections();
    });

    elements.agentList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-agent]");
      if (!button || !agents.has(button.dataset.agent)) return;
      state.agent = button.dataset.agent;
      updateSelections();
    });

    elements.launchButton.addEventListener("click", launch);
    elements.copyLink.addEventListener("click", copyLaunchLink);
    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        launch();
      }
    });
  }

  function init() {
    if (Object.values(elements).some((element) => !element)) {
      console.error("[THOX Hermes Gateway] Required interface elements are missing.");
      return;
    }
    restoreState();
    bindEvents();
    updateSelections();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
