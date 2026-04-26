import { type SafeUser } from "@algoforge/analysis";
import { apiFetch } from "./api";

export async function fetchMe(): Promise<SafeUser | null> {
  try {
    const response = await apiFetch("/api/auth/me");
    if (!response.ok) return null;
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    return null;
  }
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}
