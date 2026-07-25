import { router } from "../router.js";
import { useStoryStore } from "../stores/story.js";
import { openInEditor } from "./open-in-editor.js";
"use strict";
const builtinCommands = [
  {
    id: "builtin:open-in-editor",
    label: "Open file in editor",
    icon: "carbon:script-reference",
    showIf: ({ route }) => route.name === "story" && !!useStoryStore().currentStory,
    getParams: () => {
      const story = useStoryStore().currentStory;
      let file;
      if (story.docsOnly) {
        file = story.file?.docsFilePath ?? story.file?.filePath;
      } else {
        file = story.file?.filePath;
      }
      return {
        file
      };
    },
    clientAction: ({ file }) => {
      openInEditor(file);
    }
  },
  {
    id: "builtin:histoire-docs",
    label: "Open Histoire Documentation",
    icon: "carbon:help",
    clientAction: () => {
      window.open("https://histoire.dev/guide/getting-started.html", "_blank");
    }
  }
];
function executeCommand(command, params) {
  if (import.meta.hot) {
    import.meta.hot.send("histoire:dev-command", {
      id: command.id,
      params
    });
    command.clientAction?.(params, getCommandContext());
  }
}
function getCommandContext() {
  const storyStore = useStoryStore();
  return {
    route: router.currentRoute.value,
    currentStory: storyStore.currentStory,
    currentVariant: storyStore.currentVariant
  };
}
export {
  builtinCommands,
  executeCommand,
  getCommandContext
};
