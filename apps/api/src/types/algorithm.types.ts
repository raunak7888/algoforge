// Shared types for the algorithm service modules.

export type AlgorithmQuery = {
  categoryId?:  string;
  difficulty?:  string;
  isPublished?: boolean;
  search?:      string;
};