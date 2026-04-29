// filename: packages/forge/src/schemas.ts

import { z } from "zod";

export const StructureTypeSchema = z.enum([
  "array",
  "linkedList",
  "tree",
  "graph",
  "stack",
  "queue",
  "memory",
]);

export const DifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

export const ForgeCodeSchema = z.object({
  version: z.literal(1),
  language: z.literal("js"),
  body: z.string().min(1),
  requiredStructures: z.array(StructureTypeSchema),
});

export const GuardRangesSchema = z.object({
  array: z
    .object({
      minLength: z.number().int().min(0),
      maxLength: z.number().int().min(1),
      minVal: z.number(),
      maxVal: z.number(),
      sorted: z.boolean().optional(),
      unique: z.boolean().optional(),
    })
    .optional(),
  target: z
    .object({
      min: z.number(),
      max: z.number(),
      existsInArray: z.boolean().optional(),
    })
    .optional(),
  graph: z
    .object({
      minNodes: z.number().int().min(1),
      maxNodes: z.number().int().min(1),
      directed: z.boolean(),
      weighted: z.boolean(),
      minWeight: z.number().optional(),
      maxWeight: z.number().optional(),
      connected: z.boolean().optional(),
      acyclic: z.boolean().optional(),
    })
    .optional(),
  tree: z
    .object({
      minNodes: z.number().int().min(1),
      maxNodes: z.number().int().min(1),
      minVal: z.number(),
      maxVal: z.number(),
      balanced: z.boolean().optional(),
    })
    .optional(),
  startNode: z.enum(["first", "random"]).optional(),
});

export const InputSchema = z.record(z.string(), z.unknown());

// Structures that require explicit guard ranges. Stack, queue, linkedList,
// and memory do not have configurable input constraints.
const GUARDED_STRUCTURES = ["array", "graph", "tree"] as const;
type GuardedStructure = (typeof GUARDED_STRUCTURES)[number];

function crossValidateGuardRanges(
  requiredStructures: string[],
  guardRanges: z.infer<typeof GuardRangesSchema>,
  ctx: z.RefinementCtx,
  basePath: (string | number)[],
): void {
  for (const structure of requiredStructures) {
    if (!GUARDED_STRUCTURES.includes(structure as GuardedStructure)) continue;
    const key = structure as GuardedStructure;
    if (!guardRanges[key]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `forge.guardRanges.${key} is required when forge.forgeCode.requiredStructures includes "${key}".`,
        path: [...basePath, key],
      });
    }
  }
}

const DisplayCodeEntrySchema = z.object({
  language: z.string().min(1),
  code: z.string().min(1),
});

export const CreateAlgorithmSchema = z
  .object({
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
    name: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    categoryId: z.string().min(1),
    difficulty: DifficultySchema.default("beginner"),
    isPublished: z.boolean().default(false).optional(),

    complexity: z.object({
      time: z.object({
        best: z.string().min(1),
        average: z.string().min(1),
        worst: z.string().min(1),
      }),
      space: z.string().min(1),
    }),

    // Accepts multiple display-code variants (e.g. js + python).
    // Must include at least one entry. Forge code is always JS and separate.
    displayCodes: z.array(DisplayCodeEntrySchema).min(1),

    forge: z.object({
      forgeCode: ForgeCodeSchema,
      inputSchema: InputSchema,
      guardRanges: GuardRangesSchema,
    }),

    tags: z.array(z.string().min(1)),
  })
  .superRefine((data, ctx) => {
    crossValidateGuardRanges(
      data.forge.forgeCode.requiredStructures,
      data.forge.guardRanges,
      ctx,
      ["forge", "guardRanges"],
    );
  });

export const UpdateAlgorithmSchema = z
  .object({
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    categoryId: z.string().min(1).optional(),
    difficulty: DifficultySchema.optional(),
    isPublished: z.boolean().optional(),

    complexity: z
      .object({
        time: z
          .object({
            best: z.string().min(1).optional(),
            average: z.string().min(1).optional(),
            worst: z.string().min(1).optional(),
          })
          .optional(),
        space: z.string().min(1).optional(),
      })
      .optional(),

    // When provided, replaces all display-code entries (same pattern as tags).
    displayCodes: z.array(DisplayCodeEntrySchema).min(1).optional(),

    forge: z
      .object({
        forgeCode: ForgeCodeSchema.optional(),
        inputSchema: InputSchema.optional(),
        guardRanges: GuardRangesSchema.optional(),
      })
      .optional(),

    tags: z.array(z.string().min(1)).optional(),
  })
  .superRefine((data, ctx) => {
    // Only cross-validate when both sides of forge are supplied in the update.
    const structures = data.forge?.forgeCode?.requiredStructures;
    const guardRanges = data.forge?.guardRanges;
    if (structures && guardRanges) {
      crossValidateGuardRanges(structures, guardRanges, ctx, [
        "forge",
        "guardRanges",
      ]);
    }
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

export const AlgorithmListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  categoryId: z.string(),
  difficulty: DifficultySchema,
  complexity: z
    .object({
      timeBest: z.string().nullable(),
      timeAverage: z.string().nullable(),
      timeWorst: z.string().nullable(),
      space: z.string().nullable(),
    })
    .nullable(),
});

export const AlgorithmDetailSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  difficulty: DifficultySchema,
  complexity: z
    .object({
      timeBest: z.string().nullable(),
      timeAverage: z.string().nullable(),
      timeWorst: z.string().nullable(),
      space: z.string().nullable(),
    })
    .nullable(),
  displayCode: z
    .object({
      language: z.string(),
      code: z.string(),
    })
    .nullable(),
  tags: z.array(z.object({ id: z.string(), label: z.string() })),
  forge: z
    .object({
      forgeCode: ForgeCodeSchema,
      inputSchema: InputSchema,
      guardRanges: GuardRangesSchema,
      version: z.number().optional(),
    })
    .nullable()
    .optional(),
});

export const AlgorithmExecutionSchema = z.union([
  z.object({
    algorithmId: z.string(),
    name: z.string(),
    forge: z.object({
      forgeCode: ForgeCodeSchema,
      inputSchema: InputSchema,
      guardRanges: GuardRangesSchema,
      version: z.number().optional(),
    }),
  }),
  z.object({
    status: z.literal("INCOMPLETE_ALGORITHM"),
    message: z.string(),
  }),
]);

export const CreateCategorySchema = z.object({
  id: z.string().min(1).max(50).optional(),
  label: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  iconName: z.string().max(50).optional(),
  sortOrder: z.number().int().default(0),
});

export const UpdateCategorySchema = CreateCategorySchema.partial().omit({
  id: true,
});

export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
export type CreateAlgorithm = z.infer<typeof CreateAlgorithmSchema>;
export type UpdateAlgorithm = z.infer<typeof UpdateAlgorithmSchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type AlgorithmListItem = z.infer<typeof AlgorithmListItemSchema>;
export type AlgorithmDetail = z.infer<typeof AlgorithmDetailSchema>;
export type AlgorithmExecution = z.infer<typeof AlgorithmExecutionSchema>;