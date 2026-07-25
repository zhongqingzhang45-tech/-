import { defineStore } from "@histoire/vendors/pinia";
import { reactive, ref, watch } from "@histoire/vendors/vue";
import { useStoryStore } from "./story.js";
"use strict";
const useEventsStore = defineStore("events", () => {
  const storyStore = useStoryStore();
  const events = reactive([]);
  const unseen = ref(0);
  function addEvent(event) {
    events.push(event);
    unseen.value++;
  }
  function reset() {
    events.length = 0;
    unseen.value = 0;
  }
  watch(() => storyStore.currentVariant?.id, () => {
    reset();
  });
  return {
    addEvent,
    reset,
    events,
    unseen
  };
});
export {
  useEventsStore
};
