//# filename: apps/api/src/services/category.service.ts

import { randomUUID } from "crypto";
import {
  CategoryResponseSchema,
  type CreateCategory,
  type UpdateCategory,
  type CategoryResponse,
} from "@algoforge/forge";
import { categoryRepository } from "../repositories/category.repository";
import { AppError } from "../utils/app-error";

function serialize(category: {
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
    const rows = await categoryRepository.findAll();
    return rows.map(serialize);
  }

  async getCategoryById(id: string): Promise<CategoryResponse> {
    const row = await categoryRepository.findById(id);
    if (!row) throw AppError.notFound("Category not found.");
    return serialize(row);
  }

  async createCategory(input: CreateCategory): Promise<CategoryResponse> {
    const row = await categoryRepository.create({
      id: input.id ?? randomUUID(),
      label: input.label,
      description: input.description,
      iconName: input.iconName,
      sortOrder: input.sortOrder,
    });
    return serialize(row);
  }

  async updateCategory(id: string, input: UpdateCategory): Promise<CategoryResponse> {
    const row = await categoryRepository.update(id, {
      label: input.label,
      description: input.description,
      iconName: input.iconName,
      sortOrder: input.sortOrder,
    });
    return serialize(row);
  }

  async deleteCategory(id: string): Promise<void> {
    const count = await categoryRepository.countAlgorithmsInCategory(id);
    if (count > 0) {
      throw AppError.badRequest(
        "Cannot delete category with associated algorithms.",
      );
    }
    await categoryRepository.delete(id);
  }
}

export const categoryService = new CategoryService();