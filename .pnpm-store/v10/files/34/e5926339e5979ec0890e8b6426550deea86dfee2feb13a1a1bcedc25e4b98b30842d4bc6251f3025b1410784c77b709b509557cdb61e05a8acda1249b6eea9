import type { ConfigMode, FinalSupportPlugin, HistoireConfig, PluginCommand, ServerMarkdownFile, ServerStoryFile } from '@histoire/shared';
import type { ResolvedConfig } from 'vite';
export interface Context {
    root: string;
    config: HistoireConfig;
    resolvedViteConfig: ResolvedConfig;
    mode: ConfigMode;
    storyFiles: ServerStoryFile[];
    supportPlugins: FinalSupportPlugin[];
    markdownFiles: ServerMarkdownFile[];
    registeredCommands?: PluginCommand[];
}
export interface CreateContextOptions {
    mode: Context['mode'];
    configFile?: string;
}
export declare function createContext(options: CreateContextOptions): Promise<Context>;
//# sourceMappingURL=context.d.ts.map