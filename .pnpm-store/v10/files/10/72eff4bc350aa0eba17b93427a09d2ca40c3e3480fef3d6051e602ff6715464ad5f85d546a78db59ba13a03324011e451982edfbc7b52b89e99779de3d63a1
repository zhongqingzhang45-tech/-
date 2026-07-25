import { reactive } from "@histoire/vendors/vue";
import { histoireConfig } from "./config.js";
"use strict";
const receivedSettings = reactive({});
function applyPreviewSettings(settings) {
  Object.assign(receivedSettings, settings);
  document.documentElement.setAttribute("dir", settings.textDirection);
  const contrastColor = getContrastColor(settings);
  document.documentElement.style.setProperty("--histoire-contrast-color", contrastColor);
  if (histoireConfig.autoApplyContrastColor) {
    document.documentElement.style.color = contrastColor;
  }
}
function getContrastColor(setting) {
  return histoireConfig.backgroundPresets.find((preset) => preset.color === setting.backgroundColor)?.contrastColor ?? "unset";
}
export {
  applyPreviewSettings,
  getContrastColor,
  receivedSettings
};
