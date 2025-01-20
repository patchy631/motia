import path from "path";
import { build } from "esbuild";
import vm from "vm";

export const loadNodeFileExports = async <T>(filePath: string): Promise<T> => {
  try {
    // Step 1: Resolve the absolute path of the file
    const absPath = path.resolve(filePath);

    // Step 2: Use esbuild to bundle the file and its dependencies
    const result = await build({
      entryPoints: [absPath],
      bundle: true,
      platform: "node",
      format: "cjs",
      write: false, // Keep output in memory
      external: ["@motia/core"], // Add external dependencies to exclude if needed
    });

    const bundledCode = result.outputFiles[0].text;

    // Step 3: Create a sandboxed environment
    const sandbox: Record<string, any> = {};
    const moduleExports: Record<string, any> = {};
    sandbox.exports = moduleExports;
    sandbox.module = { exports: moduleExports };

    // Step 4: Execute the bundled code in the sandbox
    const script = new vm.Script(bundledCode);
    const context = vm.createContext(sandbox);
    script.runInContext(context);

    return sandbox as T;
  } catch (error) {
    console.error(`Failed to build node file in path ${filePath}:`, error);

    throw new Error(`Failed to build node file in path ${filePath}`)
  }
}
