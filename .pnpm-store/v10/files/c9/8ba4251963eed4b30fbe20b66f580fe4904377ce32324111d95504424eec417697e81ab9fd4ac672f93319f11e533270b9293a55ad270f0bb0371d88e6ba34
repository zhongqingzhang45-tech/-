import { quansync } from "quansync/macro";
import { loadConfig } from "unconfig";

//#region src/config.ts
const loadConfig$1 = quansync(function* (cwd) {
	const { config } = yield loadConfig({
		sources: [{
			files: "vue-macros.config",
			extensions: [
				"mts",
				"cts",
				"ts",
				"mjs",
				"cjs",
				"js",
				"json",
				""
			]
		}, {
			files: "package.json",
			extensions: [],
			rewrite: (config$1) => config$1?.vueMacros
		}],
		defaults: {},
		cwd
	});
	return config;
});

//#endregion
export { loadConfig$1 as loadConfig };