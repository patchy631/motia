import { loadNodeFileExports } from "./load-node-file-exports";

export const getModuleExport = async (filePath: string, exportName: string) => {
  try {
    const sandbox = await loadNodeFileExports<{
      module: { exports: Record<string, any> };
      exports: Record<string, any>;
    }>(filePath);

    const exportedModule = sandbox.module.exports[exportName] || sandbox.exports[exportName];

    return exportedModule;
  } catch (error) {
    console.error(`Failed to extract ${exportName} from ${filePath}:`, error);

    throw new Error(`No ${exportName} found in step ${filePath}`)
  }
}