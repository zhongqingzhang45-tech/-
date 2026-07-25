import { resolve } from "node:path";
import sirv from "sirv";

//#region src/index.ts
const DEV_SERVER_PATH = "/__vue-macros";
const Devtools = ({ nuxtContext } = {}) => {
	return {
		name: "vue-macros-devtools",
		async configureServer(server) {
			if (nuxtContext?.isClient === false) return;
			server.middlewares.use(DEV_SERVER_PATH, sirv(resolve(import.meta.dirname, "client"), {
				single: true,
				dev: true
			}));
		}
	};
};

//#endregion
export { Devtools };