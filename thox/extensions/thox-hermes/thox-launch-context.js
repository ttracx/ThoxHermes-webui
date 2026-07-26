(() => {
  "use strict";

  const activationPrompts = Object.freeze({
    "sadie-weaving": "Activate Sadie Weaving, THOX Hermes Chief Agentic Officer. Use THOX.ai product truth, coordinate specialist agents, preserve local-first privacy, and return an execution-ready plan with owners, dependencies, risks, and next actions.",
    "internal-orchestrator": "Act as the THOX internal Agent Orchestrator. Decompose this session into parallel specialist workstreams, assign the correct DigitalHuman or internal agent to each stream, define handoff contracts, and maintain a concise execution ledger.",
    "device-engineer": "Activate the THOX Device Engineering agent. Prioritize manufacturability, accurate device specifications, repairability, printable assembly architecture, verification evidence, and cross-device consistency.",
    "platform-engineer": "Activate the THOX Platform Engineering agent. Work across THOXCore, ThoxRoute, MeshStack, local model runtimes, device APIs, observability, security, tests, and deployment automation.",
    "customer-experience": "Activate the THOX Customer Experience Fabric agent. Align messaging with product truth and THOX.ai branding, identify customer intent, recommend measurable UX improvements, and produce implementation-ready outputs."
  });

  function applyLaunchContext() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") !== "thox-device-gateway") return;

    const agentId = params.get("thoxAgent");
    if (!agentId || agentId === "none") return;
    const prompt = activationPrompts[agentId];
    if (!prompt) {
      console.warn(`[THOX Hermes] Ignoring unknown launch agent: ${agentId}`);
      return;
    }

    const prepare = () => {
      if (!window.THoxHermes?.preparePrompt) return false;
      window.THoxHermes.preparePrompt(prompt, { autosend: false });
      window.history.replaceState({}, document.title, `${window.location.pathname}?device=${encodeURIComponent(params.get("device") || "auto")}`);
      return true;
    };

    if (!prepare()) {
      document.addEventListener("thox:ready", prepare, { once: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyLaunchContext, { once: true });
  } else {
    applyLaunchContext();
  }
})();
