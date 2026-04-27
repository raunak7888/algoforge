import { prisma } from "@algoforge/db";
import {
    SnapshotResponseSchema,
    type CreateSnapshot,
    type SnapshotResponse,
    ForgeRecorder,
} from "@algoforge/forge";
import { AppError } from "../utils/app-error";
import { algorithmService } from "./algorithm.service";

function serializeSnapshot(snapshot: {
    id: string;
    algorithmId: string;
    input: unknown;
    steps: unknown;
    executionTimeMs: number;
    createdAt: Date;
}): SnapshotResponse {
    return SnapshotResponseSchema.parse({
        id: snapshot.id,
        algorithmId: snapshot.algorithmId,
        input: snapshot.input,
        steps: snapshot.steps,
        executionTimeMs: snapshot.executionTimeMs,
        createdAt: snapshot.createdAt.toISOString(),
    });
}

class SnapshotService {
    async createSnapshot(input: CreateSnapshot): Promise<SnapshotResponse> {
        const algorithm = await algorithmService.getAlgorithmById(
            input.algorithmId,
        );

        const startTime = Date.now();
        const steps = await this.executeForgeCode(
            algorithm.forgeCode.body,
            input.input,
        );
        const executionTimeMs = Date.now() - startTime;

        const snapshot = await prisma.snapshot.create({
            data: {
                algorithmId: input.algorithmId,
                input: input.input as any,
                steps: steps as any,
                executionTimeMs,
            },
        });

        return serializeSnapshot(snapshot);
    }

    async getSnapshotById(id: string): Promise<SnapshotResponse> {
        const snapshot = await prisma.snapshot.findUnique({
            where: { id },
        });

        if (!snapshot) {
            throw AppError.notFound("Snapshot not found.");
        }

        return serializeSnapshot(snapshot);
    }

    async listSnapshotsByAlgorithm(
        algorithmId: string,
    ): Promise<SnapshotResponse[]> {
        const snapshots = await prisma.snapshot.findMany({
            where: { algorithmId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return snapshots.map(serializeSnapshot);
    }

    async deleteSnapshot(id: string): Promise<void> {
        await prisma.snapshot.delete({
            where: { id },
        });
    }

    private async executeForgeCode(
        code: string,
        input: Record<string, unknown>,
    ): Promise<unknown[]> {
        const forge = new ForgeRecorder();
        const context = { forge, input };

        try {
            const fn = new Function("forge", "input", code);
            fn(context.forge, context.input);
            return forge.getSteps();
        } catch (error) {
            throw AppError.badRequest(
                `ForgeCode execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
        }
    }
}

export const snapshotService = new SnapshotService();
