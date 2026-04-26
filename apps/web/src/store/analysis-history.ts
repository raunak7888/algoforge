"use client";

import { create } from "zustand";
import type { AnalysisHistoryItem, AnalysisRecord } from "@algoforge/analysis";
import { fetchAnalysisById, fetchAnalysesPage } from "@/lib/analyses";

type AnalysisHistoryState = {
  analysesById: Record<string, AnalysisRecord>;
  historyById: Record<string, AnalysisHistoryItem>;
  orderedHistoryIds: string[];
  fetchedCursorKeys: string[];
  nextCursor: string | null;
  hasMore: boolean;
  initialized: boolean;
  isFetchingPage: boolean;
  pageError: string | null;
  activeAnalysisId: string | null;
  activeDetailError: string | null;
  reset: () => void;
  cacheAnalysis: (analysis: AnalysisRecord) => void;
  fetchInitialPage: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
  fetchAnalysis: (analysisId: string) => Promise<AnalysisRecord>;
  setActiveAnalysisId: (analysisId: string | null) => void;
};

const INITIAL_CURSOR_KEY = "__initial__";
const pageRequests = new Map<string, Promise<void>>();
const detailRequests = new Map<string, Promise<AnalysisRecord>>();
let storeGeneration = 0;

function sortHistoryIds(historyById: Record<string, AnalysisHistoryItem>): string[] {
  return Object.values(historyById)
    .sort((left, right) => {
      const byDate =
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();

      if (byDate !== 0) {
        return byDate;
      }

      return right.id.localeCompare(left.id);
    })
    .map((item) => item.id);
}

function toHistoryItem(analysis: AnalysisRecord): AnalysisHistoryItem {
  return {
    id: analysis.id,
    language: analysis.language,
    complexity: analysis.result.complexity.time.worst,
    suggestion: analysis.result.improvements[0]?.suggestion ?? null,
    createdAt: analysis.createdAt,
  };
}

function mergeHistoryItems(
  historyById: Record<string, AnalysisHistoryItem>,
  items: AnalysisHistoryItem[],
) {
  const nextHistoryById = { ...historyById };

  for (const item of items) {
    nextHistoryById[item.id] = item;
  }

  return {
    historyById: nextHistoryById,
    orderedHistoryIds: sortHistoryIds(nextHistoryById),
  };
}

function createPageRequest(
  cursor: string | null,
  set: (
    partial:
      | Partial<AnalysisHistoryState>
      | ((state: AnalysisHistoryState) => Partial<AnalysisHistoryState>),
  ) => void,
) {
  const cursorKey = cursor ?? INITIAL_CURSOR_KEY;
  const existingRequest = pageRequests.get(cursorKey);
  const requestGeneration = storeGeneration;

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    set({
      isFetchingPage: true,
      pageError: null,
    });

    try {
      const response = await fetchAnalysesPage(cursor);
      if (requestGeneration !== storeGeneration) {
        return;
      }

      set((state) => {
        const merged = mergeHistoryItems(state.historyById, response.data);
        const nextFetchedCursorKeys = state.fetchedCursorKeys.includes(cursorKey)
          ? state.fetchedCursorKeys
          : [...state.fetchedCursorKeys, cursorKey];

        return {
          ...merged,
          fetchedCursorKeys: nextFetchedCursorKeys,
          nextCursor: response.meta.nextCursor,
          hasMore: response.meta.hasMore,
          initialized: true,
        };
      });
    } catch (error) {
      if (requestGeneration !== storeGeneration) {
        return;
      }

      set({
        pageError: error instanceof Error ? error.message : "Failed to load analyses.",
      });
      throw error;
    } finally {
      pageRequests.delete(cursorKey);
      if (requestGeneration === storeGeneration && pageRequests.size === 0) {
        set({ isFetchingPage: false });
      }
    }
  })();

  pageRequests.set(cursorKey, request);
  return request;
}

function createDetailRequest(
  analysisId: string,
  set: (
    partial:
      | Partial<AnalysisHistoryState>
      | ((state: AnalysisHistoryState) => Partial<AnalysisHistoryState>),
  ) => void,
) {
  const existingRequest = detailRequests.get(analysisId);
  const requestGeneration = storeGeneration;

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      const analysis = await fetchAnalysisById(analysisId);
      if (requestGeneration !== storeGeneration) {
        throw new Error("Analysis request expired.");
      }

      set((state) => {
        const merged = mergeHistoryItems(state.historyById, [toHistoryItem(analysis)]);

        return {
          ...merged,
          analysesById: {
            ...state.analysesById,
            [analysis.id]: analysis,
          },
          activeDetailError: null,
        };
      });

      return analysis;
    } catch (error) {
      if (requestGeneration !== storeGeneration) {
        throw error;
      }

      set({
        activeDetailError:
          error instanceof Error ? error.message : "Failed to load this analysis.",
      });
      throw error;
    } finally {
      detailRequests.delete(analysisId);
    }
  })();

  detailRequests.set(analysisId, request);
  return request;
}

export const useAnalysisHistoryStore = create<AnalysisHistoryState>((set, get) => ({
  analysesById: {},
  historyById: {},
  orderedHistoryIds: [],
  fetchedCursorKeys: [],
  nextCursor: null,
  hasMore: false,
  initialized: false,
  isFetchingPage: false,
  pageError: null,
  activeAnalysisId: null,
  activeDetailError: null,
  reset: () => {
    storeGeneration += 1;
    pageRequests.clear();
    detailRequests.clear();
    set({
      analysesById: {},
      historyById: {},
      orderedHistoryIds: [],
      fetchedCursorKeys: [],
      nextCursor: null,
      hasMore: false,
      initialized: false,
      isFetchingPage: false,
      pageError: null,
      activeAnalysisId: null,
      activeDetailError: null,
    });
  },
  cacheAnalysis: (analysis) =>
    set((state) => {
      const merged = mergeHistoryItems(state.historyById, [toHistoryItem(analysis)]);

      return {
        ...merged,
        analysesById: {
          ...state.analysesById,
          [analysis.id]: analysis,
        },
        activeAnalysisId: analysis.id,
      };
    }),
  fetchInitialPage: async () => {
    const state = get();

    if (state.initialized || state.fetchedCursorKeys.includes(INITIAL_CURSOR_KEY)) {
      return;
    }

    await createPageRequest(null, set);
  },
  fetchNextPage: async () => {
    const state = get();

    if (!state.hasMore || !state.nextCursor) {
      return;
    }

    if (state.fetchedCursorKeys.includes(state.nextCursor)) {
      return;
    }

    await createPageRequest(state.nextCursor, set);
  },
  fetchAnalysis: async (analysisId) => {
    const cached = get().analysesById[analysisId];

    if (cached) {
      set({
        activeAnalysisId: analysisId,
        activeDetailError: null,
      });
      return cached;
    }

    set({
      activeAnalysisId: analysisId,
      activeDetailError: null,
    });

    return createDetailRequest(analysisId, set);
  },
  setActiveAnalysisId: (analysisId) =>
    set({
      activeAnalysisId: analysisId,
      activeDetailError: null,
    }),
}));
