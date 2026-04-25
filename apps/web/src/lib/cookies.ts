export function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = cookie.slice(0, separatorIndex);
    if (key !== name) {
      continue;
    }

    return decodeURIComponent(cookie.slice(separatorIndex + 1));
  }

  return null;
}
