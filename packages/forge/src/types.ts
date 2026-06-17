export type StructureType =
  | "array"
  | "linkedList"
  | "tree"
  | "graph"
  | "stack"
  | "queue"
  | "memory";

export type HighlightRole =
  | "comparing" | "swapped" | "found" | "notFound"
  | "visiting"  | "visited" | "done"
  | "current"   | "sorted"  | "pivot"
  | "lo"        | "hi"      | "mid"
  | "traversing"| "relaxed" | "path"
  | "inserted"  | "deleted" | "rotated"
  | "active"    | "inactive";

export interface ArrayState {
  type: "array";
  values: (number | string | null)[];
  sortedIndices?: number[];
  labels?: Record<number, string>;
}

export interface LinkedListNode {
  id: string;
  value: number | string;
  next: string | null;
}

export interface LinkedListState {
  type: "linkedList";
  nodes: LinkedListNode[];
  headId: string | null;
}

export interface TreeNode {
  id: string;
  value: number | string;
  left: TreeNode | null;
  right: TreeNode | null;
  height?: number;
  color?: "red" | "black";
}

export interface TreeState {
  type: "tree";
  root: TreeNode | null;
}

export interface GraphNode {
  id: string;
  label?: string;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight?: number;
}

export interface GraphState {
  type: "graph";
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
  weighted: boolean;
  visitedNodes?: string[];
  visitedEdges?: [string, string][];
  distances?: Record<string, number>;
  path?: string[];
}

export interface StackState {
  type: "stack";
  values: (number | string)[];
  label?: string;
}

export interface QueueState {
  type: "queue";
  values: (number | string)[];
  label?: string;
}

export interface MemoryFrame {
  id: string;
  label: string;
  slots: { name: string; value: unknown }[];
  role: HighlightRole;
}

export interface MemoryState {
  type: "memory";
  frames: MemoryFrame[];
}

export type StructureState =
  | ArrayState
  | LinkedListState
  | TreeState
  | GraphState
  | StackState
  | QueueState
  | MemoryState;

export interface ArrayHighlight {
  indices: number[];
  role: HighlightRole;
}

export interface GraphHighlight {
  nodeId?: string;
  edge?: [string, string];
  role: HighlightRole;
}

export interface TreeHighlight {
  nodeId: string;
  role: HighlightRole;
}

export type StructureHighlight = ArrayHighlight | GraphHighlight | TreeHighlight;

export interface PointerMap {
  [structureId: string]: Record<string, number | string>;
}

export interface Step {
  index: number;
  state: Record<string, StructureState>;
  highlights: Record<string, StructureHighlight>;
  pointers: PointerMap;
  message: string;
  phase?: string;
  metadata?: {
    lineNumber?: number;
    operationCount?: number;
    callDepth?: number;
  };
}

export interface ForgeCode {
  version: 1;
  language: "js";
  body: string;
  requiredStructures: StructureType[];
}

export interface GuardRanges {
  array?: {
    minLength: number;
    maxLength: number;
    minVal: number;
    maxVal: number;
    sorted?: boolean;
    unique?: boolean;
  };
  target?: { min: number; max: number; existsInArray?: boolean };
  graph?: {
    minNodes: number;
    maxNodes: number;
    directed: boolean;
    weighted: boolean;
    minWeight?: number;
    maxWeight?: number;
    connected?: boolean;
    acyclic?: boolean;
  };
  tree?: {
    minNodes: number;
    maxNodes: number;
    minVal: number;
    maxVal: number;
    balanced?: boolean;
  };
  startNode?: "first" | "random";
}

export interface AlgorithmInput {
  array?: (number | string)[];
  target?: number | string;
  graph?: { nodes: GraphNode[]; edges: GraphEdge[] };
  startNode?: string;
  tree?: TreeNode | null;
  matrix?: number[][];
}

export type Difficulty = "beginner" | "intermediate" | "advanced";