import { MAIN_TEMPLATE, QUERY_NAMED_TEMPLATE, QUERY_TEMPLATE, parseVueRequest, postTransform, preTransform } from "./core-jjznsO4D.js";
import { REGEX_VUE_SFC, createFilter, detectVueVersion } from "@vue-macros/common";
import { createUnplugin } from "unplugin";

//#region src/index.ts
function resolveOptions(options) {
	const version = options.version || detectVueVersion();
	return {
		include: [REGEX_VUE_SFC],
		...options,
		version
	};
}
const name = "unplugin-vue-named-template";
const PrePlugin = createUnplugin((userOptions = {}) => {
	const options = resolveOptions(userOptions);
	const filter = createFilter(options);
	const templateContent = Object.create(null);
	return {
		name: `${name}-pre`,
		enforce: "pre",
		loadInclude(id) {
			return id.includes(QUERY_TEMPLATE);
		},
		load(id) {
			const { filename, query } = parseVueRequest(id);
			return templateContent[filename]?.["mainTemplate" in query ? MAIN_TEMPLATE : query.name];
		},
		transformInclude(id) {
			return filter(id) || id.includes(QUERY_NAMED_TEMPLATE);
		},
		transform(code, id) {
			if (id.includes(QUERY_NAMED_TEMPLATE)) {
				const { filename, query } = parseVueRequest(id);
				const { name: name$1 } = query;
				const request = `${filename}?vue&${QUERY_TEMPLATE}&name=${name$1}`;
				return `import { createTextVNode } from 'vue'
        import { render } from ${JSON.stringify(request)}
export default {
render: (...args) => {
  const r = render(...args)
  return typeof r === 'string' ? createTextVNode(r) : r
}
}`;
			} else return preTransform(code, id, templateContent);
		}
	};
});
const PostPlugin = createUnplugin((userOptions = {}) => {
	const options = resolveOptions(userOptions);
	const filter = createFilter(options);
	const customBlocks = Object.create(null);
	function transformInclude(id) {
		return filter(id) || id.includes(QUERY_TEMPLATE);
	}
	return {
		name: `${name}-post`,
		enforce: "post",
		transformInclude,
		transform(code, id) {
			return postTransform(code, id, customBlocks);
		},
		rollup: { transform: {
			order: "post",
			handler(code, id) {
				if (!transformInclude(id)) return;
				return postTransform(code, id, customBlocks);
			}
		} }
	};
});
const plugin = createUnplugin((userOptions = {}, meta) => {
	return [PrePlugin.raw(userOptions, meta), PostPlugin.raw(userOptions, meta)];
});
var src_default = plugin;

//#endregion
export { PostPlugin, PrePlugin, src_default };