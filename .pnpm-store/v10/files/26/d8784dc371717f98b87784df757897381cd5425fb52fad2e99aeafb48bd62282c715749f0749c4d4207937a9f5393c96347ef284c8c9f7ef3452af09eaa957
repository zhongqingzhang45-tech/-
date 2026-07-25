import { useDark, useToggle } from "@histoire/vendors/vue-use";
import { watch } from "@histoire/vendors/vue";
import { histoireConfig } from "./config.js";
"use strict";
const isDark = useDark({
  valueDark: "htw-dark",
  initialValue: histoireConfig.theme.defaultColorScheme,
  storageKey: "histoire-color-scheme",
  storage: histoireConfig.theme.storeColorScheme ? localStorage : sessionStorage
});
const toggleDark = useToggle(isDark);
function applyDarkToControls() {
  window.__hst_controls_dark?.forEach((ref) => {
    ref.value = isDark.value;
  });
}
watch(isDark, () => {
  applyDarkToControls();
}, {
  immediate: true
});
window.__hst_controls_dark_ready = () => {
  applyDarkToControls();
};
export {
  isDark,
  toggleDark
};
