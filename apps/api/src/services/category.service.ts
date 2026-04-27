import { prisma } from "@algoforge/db";
import {
    CategoryResponseSchema,
    type CreateCategory,
    type UpdateCategory,
    type CategoryResponse,
} from "@algoforge/forge";
import { AppError } from "../utils/app-error";
import { randomUUID } from "crypto";

function serializeCategory(category: {
    id: string;
    label: string;
    description: string | null;
    iconName: string | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}): CategoryResponse {
    return CategoryResponseSchema.parse({
        id: category.id,
        label: category.label,
        description: category.description,
        iconName: category.iconName,
        sortOrder: category.sortOrder,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
    });
}

class CategoryService {
    async listCategories(): Promise<CategoryResponse[]> {
        const categories = await prisma.category.findMany({
            orderBy: { sortOrder: "asc" },
        });
        return categories.map(serializeCategory);
    }

    async getCategoryById(id: string): Promise<CategoryResponse> {
        const category = await prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            throw AppError.notFound("Category not found.");
        }

        return serializeCategory(category);
    }

    async createCategory(input: CreateCategory): Promise<CategoryResponse> {
        const category = await prisma.category.create({
            data: {
                ...input,
                id: input.id ?? randomUUID(), // ✅ generate if missing
            },
        });

        return serializeCategory(category);
    }

    async updateCategory(
        id: string,
        input: UpdateCategory,
    ): Promise<CategoryResponse> {
        const category = await prisma.category.update({
            where: { id },
            data: input,
        });
        return serializeCategory(category);
    }

    async deleteCategory(id: string): Promise<void> {
        const count = await prisma.algorithm.count({
            where: { categoryId: id },
        });

        if (count > 0) {
            throw AppError.badRequest(
                "Cannot delete category with associated algorithms.",
            );
        }

        await prisma.category.delete({
            where: { id },
        });
    }
}

export const categoryService = new CategoryService();
