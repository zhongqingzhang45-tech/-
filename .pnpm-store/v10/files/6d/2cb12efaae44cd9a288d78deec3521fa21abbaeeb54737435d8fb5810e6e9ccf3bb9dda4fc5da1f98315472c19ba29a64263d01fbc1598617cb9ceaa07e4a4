import { build } from '../build.js';
import { createContext } from '../context.js';
export async function buildCommand(options) {
    const ctx = await createContext({
        configFile: options.config,
        mode: 'build',
    });
    await build(ctx);
}
