import { useStorage } from "@histoire/vendors/vue-use";
import { defineStore } from "@histoire/vendors/pinia";
"use strict";
const usePreviewSettingsStore = defineStore("preview-settings", () => {
  const currentSettings = useStorage("_histoire-sandbox-settings-v3", {
    responsiveWidth: 720,
    responsiveHeight: null,
    rotate: false,
    backgroundColor: "transparent",
    checkerboard: false,
    textDirection: "ltr"
  });
  return {
    currentSettings
  };
});
export {
  usePreviewSettingsStore
};
