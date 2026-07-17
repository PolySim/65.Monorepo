export const getGpxDownloadUrl = (path: string) =>
  `/api/gpx?path=${encodeURIComponent(path)}`;
