import { defineStore } from "@histoire/vendors/pinia";
import { ref } from "@histoire/vendors/vue";
import { getCommandContext, executeCommand } from "../util/commands.js";
"use strict";
const useCommandStore = defineStore("command", () => {
  const selectedCommand = ref(null);
  const showPromptsModal = ref(false);
  function activateCommand(command) {
    selectedCommand.value = command;
    if (command.prompts?.length) {
      showPromptsModal.value = true;
    } else {
      const params = command.getParams?.(getCommandContext()) ?? {};
      executeCommand(command, params);
    }
  }
  return {
    selectedCommand,
    showPromptsModal,
    activateCommand
  };
});
export {
  useCommandStore
};
