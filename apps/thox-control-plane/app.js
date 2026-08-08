(() => {
  "use strict";
  const devices = [
    ["ThoxNova", "Edge AI slate", "Full touch command surface"],
    ["ThoxMini", "USB edge compute", "Private portable agent runtime"],
    ["ThoxAir", "Wireless edge assistant", "Mesh-connected companion"],
    ["ThoxClip", "MagSafe / Qi2 accessory", "Context and sensor companion"],
    ["ThoxKey", "Portable AI workspace", "Owner-controlled agents and data"],
    ["ThoxWatch", "Wearable companion", "BLE status and action surface"],
    ["ThoxVault", "Wireless private storage", "Offline data and recovery plane"]
  ];
  const root = document.getElementById("deviceList");
  if (!root) return;
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  root.innerHTML = devices.map(([name, type, role]) => `<article class="device"><strong>${escape(name)}</strong><span>${escape(type)}</span><em>${escape(role)}</em></article>`).join("");
})();
