/**
 * Public surface of the algorithm service.
 * Controllers and other services import from here only.
 * Internal sub-modules are implementation details and must not be imported directly.
 */
export { listAlgorithms } from "./query.service";
export { getAlgorithmById, getAlgorithmBySlug } from "./detail.service";
export { getAlgorithmVisualization as getAlgorithmExecution } from "./viz.service";
export { createAlgorithm, updateAlgorithm, deleteAlgorithm } from "./mutation.service";
export type { AlgorithmQuery } from "../../types/algorithm.types";

import { listAlgorithms } from "./query.service";
import { getAlgorithmById, getAlgorithmBySlug } from "./detail.service";
import { getAlgorithmVisualization } from "./viz.service";
import { createAlgorithm, updateAlgorithm, deleteAlgorithm } from "./mutation.service";

/** Named object alias — import as `algorithmService.listAlgorithms(...)` */
export const algorithmService = {
  listAlgorithms,
  getAlgorithmById,
  getAlgorithmBySlug,
  getAlgorithmExecution: getAlgorithmVisualization,
  createAlgorithm,
  updateAlgorithm,
  deleteAlgorithm,
};