import { StepConfig } from "../types";
import { getModuleExport } from "./get-module-export";

export const getNodeFileConfig = async (filePath: string): Promise<StepConfig> => {
  try {
    return await getModuleExport(filePath, 'config');
  } catch (error) {
    console.error(`Failed to extract config from ${filePath}:`, error);

    throw new Error(`No config found in step ${filePath}`)
  }
}
