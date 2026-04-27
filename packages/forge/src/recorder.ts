import type {
  Step,
  StructureState,
  StructureHighlight,
  PointerMap,
  ArrayState,
  StackState,
  QueueState,
  GraphState,
  TreeState,
  TreeNode,
} from "./types";

export class ForgeRecorder {
  private steps: Step[] = [];
  private state: Record<string, StructureState> = {};
  private highlights: Record<string, StructureHighlight> = {};
  private pointers: PointerMap = {};
  private message: string = "";
  private phase: string = "";
  private operationCount: number = 0;
  private callDepth: number = 0;

  init(type: StructureState["type"], id: string, value: unknown) {
    switch (type) {
      case "array":
        this.state[id] = {
          type: "array",
          values: structuredClone(value) as (number | string)[],
        };
        break;
      case "stack":
        this.state[id] = { type: "stack", values: [] };
        break;
      case "queue":
        this.state[id] = { type: "queue", values: [] };
        break;
      case "graph":
        this.state[id] = {
          type: "graph",
          ...(structuredClone(value) as Omit<GraphState, "type">),
        };
        break;
      case "tree":
        this.state[id] = {
          type: "tree",
          root: structuredClone(value) as TreeNode,
        };
        break;
      case "linkedList":
        this.state[id] = {
          type: "linkedList",
          ...(structuredClone(value) as any),
        };
        break;
    }
  }

  update(id: string, values: (number | string)[]) {
    (this.state[id] as ArrayState).values = structuredClone(values);
  }

  swap(id: string, i: number, j: number) {
    const arr = (this.state[id] as ArrayState).values;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    this.operationCount++;
  }

  markSorted(id: string, index: number) {
    const s = this.state[id] as ArrayState;
    s.sortedIndices = [...(s.sortedIndices ?? []), index];
  }

  markAllSorted(id: string) {
    const s = this.state[id] as ArrayState;
    s.sortedIndices = s.values.map((_, i) => i);
  }

  push(id: string, value: number | string) {
    (this.state[id] as StackState).values.push(value);
  }

  pop(id: string) {
    (this.state[id] as StackState).values.pop();
  }

  enqueue(id: string, value: number | string) {
    (this.state[id] as QueueState).values.push(value);
  }

  dequeue(id: string) {
    (this.state[id] as QueueState).values.shift();
  }

  visitNode(id: string, nodeId: string) {
    const g = this.state[id] as GraphState;
    g.visitedNodes = [...(g.visitedNodes ?? []), nodeId];
    this.operationCount++;
  }

  visitEdge(id: string, from: string, to: string) {
    const g = this.state[id] as GraphState;
    g.visitedEdges = [...(g.visitedEdges ?? []), [from, to]];
  }

  setDistance(id: string, nodeId: string, dist: number) {
    const g = this.state[id] as GraphState;
    g.distances = { ...(g.distances ?? {}), [nodeId]: dist };
  }

  setPath(id: string, path: string[]) {
    (this.state[id] as GraphState).path = path;
  }

  highlight(id: string, indices: number[], role: StructureHighlight["role"]) {
    this.highlights[id] = { indices, role } as any;
  }

  highlightNode(id: string, nodeId: string, role: StructureHighlight["role"]) {
    this.highlights[id] = { nodeId, role } as any;
  }

  highlightEdge(
    id: string,
    from: string,
    to: string,
    role: StructureHighlight["role"]
  ) {
    this.highlights[id] = { edge: [from, to], role } as any;
  }

  setPointers(id: string, ptrs: Record<string, number | string>) {
    this.pointers[id] = ptrs;
  }

  setMessage(msg: string) {
    this.message = msg;
  }

  setPhase(phase: string) {
    this.phase = phase;
  }

  enterCall() {
    this.callDepth++;
  }

  exitCall() {
    this.callDepth--;
  }

  snap() {
    this.steps.push({
      index: this.steps.length,
      state: structuredClone(this.state),
      highlights: structuredClone(this.highlights),
      pointers: structuredClone(this.pointers),
      message: this.message,
      phase: this.phase,
      metadata: {
        operationCount: this.operationCount,
        callDepth: this.callDepth,
      },
    });
    this.highlights = {};
    this.message = "";
  }

  done() {
    this.snap();
  }

  getSteps(): Step[] {
    return this.steps;
  }

  _getQueueValues(id: string): (number | string)[] {
    return (this.state[id] as QueueState).values;
  }
}