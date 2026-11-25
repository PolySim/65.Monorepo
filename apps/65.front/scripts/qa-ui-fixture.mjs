import { createServer } from "node:http";

const state = (id, name) => ({ id, name, image_path: "fixture.svg" });
const north = state("north", "Massif Nord");
const south = state("south", "Massif Sud");
const categories = [
  { id: "walk", name: "Balades", image_path: "fixture.svg", states: [north] },
  {
    id: "ski",
    name: "Ski fictif",
    image_path: "fixture.svg",
    states: [south, state("east", "Massif Est")],
  },
  { id: "other", name: "Sans photo", image_path: null, states: [] },
];
const hikes = ["wide", "single", "empty", "error"].map((id) => ({
  id,
  title: `Parcours ${id}`,
  category: categories[1],
  state: south,
  elevation: id === "wide" ? 0 : null,
  ...(id === "wide"
    ? {
        mainImage: { id: "wide-cover", path: "fixture.svg" },
        distance: 12.5,
        duration: "4 h 30",
        difficulty: { id: "marcheur", name: "Marcheur" },
      }
    : {}),
  images: id === "wide" ? [{ id: "wide-photo", path: "fixture.svg" }] : [],
  gpxFiles: [{ path: `${id}.gpx` }],
}));

createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const { pathname } = url;
  const mode = /(?:^|;\s*)qa-ui=([\w-]+)/.exec(req.headers.cookie ?? "")?.[1];
  const json = (data, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };
  const file = (text, type) => {
    res.writeHead(200, { "Content-Type": type });
    res.end(text);
  };
  if (pathname === "/api/auth/get-session")
    return json(mode ? { user: { id: "fixture", name: "QA fictive" } } : null);
  if (!mode) return json(null, 401);
  if (pathname === "/users") return json({ id: "fixture", roleId: "member" });
  if (pathname === "/categories") {
    await new Promise((resolve) => setTimeout(resolve, 650));
    if (mode === "error") return json(null, 503);
    return json(mode === "empty" ? [] : categories);
  }
  if (pathname === "/hikes/filters") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const { categoryId, stateId } = JSON.parse(body || "{}");
    if (mode === "member-error") return json(null, 503);
    if (stateId === "east")
      await new Promise((resolve) => setTimeout(resolve, 800));
    return json(
      hikes.filter(
        (hike) =>
          (!categoryId || hike.category.id === categoryId) &&
          (!stateId || hike.state.id === stateId),
      ),
    );
  }
  if (pathname === "/hikes/favorites") {
    if (mode === "member-error") return json(null, 503);
    return json(mode === "saved" ? [hikes[0]] : []);
  }
  if (pathname === "/hikes/suggestions") {
    if (mode === "member-error") return json(null, 503);
    return json(
      hikes
        .filter(({ title }) =>
          title.toLowerCase().includes(url.searchParams.get("q").toLowerCase()),
        )
        .map((hike) => ({
          id: hike.id,
          title: hike.title,
          categoryId: hike.category.id,
          categoryName: hike.category.name,
          stateId: hike.state.id,
          stateName: hike.state.name,
        })),
    );
  }
  if (pathname.endsWith("/favorite"))
    return mode === "member-error"
      ? json(null, 503)
      : json({ isFavorite: mode === "saved" });
  if (pathname.startsWith("/hikes/")) {
    const hike = hikes.find(({ id }) => pathname === `/hikes/${id}`);
    return json(hike ?? null, hike ? 200 : 404);
  }
  if (pathname === "/gpx") {
    const name = url.searchParams.get("path");
    const tracks = {
      "wide.gpx":
        '<trk><trkseg><trkpt lat="42.1" lon="-1.8"/><trkpt lat="42.35" lon="-1.45"/></trkseg><trkseg><trkpt lat="42.5" lon="-0.7"/><trkpt lat="42.8" lon="-0.5"/></trkseg></trk><trk><trkseg><trkpt lat="43" lon="0.7"/><trkpt lat="43.2" lon="1.7"/></trkseg></trk>',
      "single.gpx": '<trk><trkseg><trkpt lat="42.8" lon="0.1"/></trkseg></trk>',
      "empty.gpx": "",
    };
    if (!Object.hasOwn(tracks, name)) return json(null, 404);
    return file(`<gpx>${tracks[name]}</gpx>`, "application/gpx+xml");
  }
  if (
    pathname === "/images" &&
    url.searchParams.get("path") === "fixture.svg"
  ) {
    return file(
      '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><rect width="480" height="300" fill="#346854"/></svg>',
      "image/svg+xml",
    );
  }
  return json(null, 404);
}).listen(46253, "127.0.0.1", () => console.log("Fixture UI: 127.0.0.1:46253"));
