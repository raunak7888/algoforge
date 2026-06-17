// Backward-compatible re-export.
// Implementation has been split into services/algorithm/ sub-modules.
// Any file that previously imported from this path continues to work.
export { algorithmService } from "./algorithm/index";
export type { AlgorithmQuery } from "../types/algorithm.types";