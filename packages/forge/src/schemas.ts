import { z } from "zod";

export const StructureTypeSchema = z.enum([
  "array",
  "linkedList",
  "tree",
  "graph",
  "stack",
  "queue",
  "memory"
]);

export const DifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

export const ForgeCodeSchema = z.object({
  version: z.literal(1),
  language: z.literal("js"),
  body: z.string().min(1),
  requiredStructures: z.array(StructureTypeSchema),
});

export const GuardRangesSchema = z.object({
  array: z.object({
    minLength: z.number().int().min(0),
    maxLength: z.number().int().min(1),
    minVal: z.number(),
    maxVal: z.number(),
    sorted: z.boolean().optional(),
    unique: z.boolean().optional(),
  }).optional(),
  target: z.object({
    min: z.number(),
    max: z.number(),
    existsInArray: z.boolean().optional(),
  }).optional(),
  graph: z.object({
    minNodes: z.number().int().min(1),
    maxNodes: z.number().int().min(1),
    directed: z.boolean(),
    weighted: z.boolean(),
    minWeight: z.number().optional(),
    maxWeight: z.number().optional(),
    connected: z.boolean().optional(),
    acyclic: z.boolean().optional(),
  }).optional(),
  tree: z.object({
    minNodes: z.number().int().min(1),
    maxNodes: z.number().int().min(1),
    minVal: z.number(),
    maxVal: z.number(),
    balanced: z.boolean().optional(),
  }).optional(),
  startNode: z.enum(["first", "random"]).optional(),
});

export const CreateCategorySchema = z.object({
  id: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  iconName: z.string().max(50).optional(),
  sortOrder: z.number().int().default(0),
});

export const UpdateCategorySchema = CreateCategorySchema.partial().omit({ id: true });

export const CreateAlgorithmSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  categoryId: z.string().min(1),
  forgeCode: ForgeCodeSchema,
  inputSchema: z.record(z.string(), z.unknown()),
  guardRanges: GuardRangesSchema,
  timeComplexity: z.string().max(100).optional(),
  spaceComplexity: z.string().max(100).optional(),
  difficulty: DifficultySchema.default("beginner"),
  tags: z.array(z.string().max(50)).default([]),
  isPublished: z.boolean().default(false),
});

export const UpdateAlgorithmSchema = CreateAlgorithmSchema.partial().omit({ slug: true });

export const CreateSnapshotSchema = z.object({
  algorithmId: z.string().uuid(),
  input: z.record(z.string(), z.unknown()),
});

export const CategoryResponseSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  iconName: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AlgorithmResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  categoryId: z.string(),
  forgeCode: ForgeCodeSchema,
  inputSchema: z.record(z.string(), z.unknown()),
  guardRanges: GuardRangesSchema,
  timeComplexity: z.string().nullable(),
  spaceComplexity: z.string().nullable(),
  difficulty: DifficultySchema,
  tags: z.array(z.string()),
  isPublished: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const SnapshotResponseSchema = z.object({
  id: z.string(),
  algorithmId: z.string(),
  input: z.record(z.string(), z.unknown()),
  steps: z.array(z.unknown()),
  executionTimeMs: z.number(),
  createdAt: z.string().datetime(),
});

export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
export type CreateAlgorithm = z.infer<typeof CreateAlgorithmSchema>;
export type UpdateAlgorithm = z.infer<typeof UpdateAlgorithmSchema>;
export type CreateSnapshot = z.infer<typeof CreateSnapshotSchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type AlgorithmResponse = z.infer<typeof AlgorithmResponseSchema>;
export type SnapshotResponse = z.infer<typeof SnapshotResponseSchema>;