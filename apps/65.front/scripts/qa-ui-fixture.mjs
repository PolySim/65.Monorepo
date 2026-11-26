import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { parseArgs } from "node:util";

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
        mainImage: { id: "wide-cover", path: "fixture-hike-cover.webp" },
        mainImagePosition: 23,
        content: "Une boucle fictive traverse les pentes du massif avant de rejoindre le col. Le retour emprunte le vallon, puis retrouve le sentier de départ.\nLe parcours alterne passages dégagés et lisières en sous-bois.",
        indication: "Itinéraire fictif pour les essais. Aucun balisage ni accès réel n’est décrit.",
        distance: 12.5,
        duration: "4 h 30",
        difficulty: { id: "marcheur", name: "Marcheur" },
      }
    : {}),
  images: id === "wide" ? [{ id: "wide-photo", path: "fixture-hike-photo.webp" }] : [],
  gpxFiles: [{ path: `${id}.gpx` }],
}));

const sparseHike = {
  id: "long-no-media",
  title: "Traversée des crêtes et des vallons du Massif Sud par le sentier de Montagnedelagrandecrêteetdeshautesvallées",
  category: categories[1],
  state: south,
};
const hikePhotos = {
  "fixture-hike-cover.webp": await readFile(new URL("../public/Home/neige-900.webp", import.meta.url)),
  "fixture-hike-photo.webp": await readFile(new URL("../public/Home/refuge-900.webp", import.meta.url)),
};

const catalogHikes = Array.from({ length: 24 }, (_, index) => ({
  ...hikes[0],
  id: `catalog-${index}`,
  title: `Activité catalogue ${index}`,
  mainImage:
    index === 2
      ? null
      : { id: `cover-${index}`, path: `catalog-${index}.svg` },
}));

const catalogCategories = categories.map((category) =>
  category.id === "ski"
    ? {
        ...category,
        states: [
          { ...south, image_path: "catalog-menu.svg" },
          { ...state("east", "Massif Est"), image_path: "catalog-1.svg" },
          { ...state("west", "Massif Ouest"), image_path: null },
        ],
      }
    : category,
);

const { values: args } = parseArgs({ options: {
  "hike-delay": { type: "string", default: "0" },
  "hike-trace": { type: "boolean" },
} });
const delayMs = Number(args["hike-delay"]);
const delay = () => new Promise((resolve) => setTimeout(resolve, delayMs));
const retryAttempts = new Set();

createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const { pathname } = url;
  if (args["hike-trace"]) {
    const start = Date.now();
    res.once("finish", () => console.log(JSON.stringify({
      pathname, method: req.method, start, end: Date.now(), status: res.statusCode,
    })));
  }
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
    return json(mode ? { user: { id: `fixture-${mode}`, name: "QA fictive" } } : null);
  if (!mode) return json(null, 401);
  if (pathname === "/users") return json({ id: "fixture", roleId: "member" });
  if (pathname === "/categories") {
    await new Promise((resolve) => setTimeout(resolve, 650));
    if (mode === "error") return json(null, 503);
    if (mode === "empty") return json([]);
    return json(mode === "catalog" ? catalogCategories : categories);
  }
  if (pathname === "/hikes/filters") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const { categoryId, stateId } = JSON.parse(body || "{}");
    if (mode === "member-error") return json(null, 503);
    if (stateId === "east")
      await new Promise((resolve) => setTimeout(resolve, 800));
    return json(
      (mode === "catalog" ? catalogHikes : hikes).filter(
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
  if (pathname.endsWith("/favorite")) {
    if (delayMs) await delay();
    return mode === "member-error"
      ? json(null, 503)
      : json({ isFavorite: mode === "saved" });
  }
  if (pathname.startsWith("/hikes/")) {
    if (delayMs) await delay();
    if (mode === "detail-retry" && !retryAttempts.has(req.headers.cookie)) {
      retryAttempts.add(req.headers.cookie);
      return json(null, 503);
    }
    if (pathname === "/hikes/missing-empty") return file("", "text/plain");
    if (pathname === `/hikes/${sparseHike.id}`) return json(sparseHike);
    const hike = (mode === "catalog" ? catalogHikes : hikes).find(
      ({ id }) => pathname === `/hikes/${id}`,
    );
    if (hike && mode === "detail-other") return json({ ...hike, title: "Autre compte fictif" });
    return json(hike ?? null, hike ? 200 : 404);
  }
  if (pathname === "/gpx") {
    if (delayMs) await delay();
    const name = url.searchParams.get("path");
    const tracks = {
      "wide.gpx":
        '<trk><trkseg><trkpt lat="42.1" lon="-1.8"/><trkpt lat="42.35" lon="-1.45"/></trkseg><trkseg><trkpt lat="42.5" lon="-0.7"/><trkpt lat="42.8" lon="-0.5"/></trkseg></trk><trk><trkseg><trkpt lat="43" lon="0.7"/><trkpt lat="43.2" lon="1.7"/></trkseg></trk>',
      "single.gpx": '<trk><trkseg><trkpt lat="42.8" lon="0.1"/></trkseg></trk>',
    };
    if (name === "empty.gpx") return file("", "application/gpx+xml");
    if (!Object.hasOwn(tracks, name)) return json(null, 404);
    return file(`<gpx>${tracks[name]}</gpx>`, "application/gpx+xml");
  }
  const imagePath = url.searchParams.get("path");
  if (pathname === "/images" && Object.hasOwn(hikePhotos, imagePath)) {
    if (delayMs) await delay();
    return file(hikePhotos[imagePath], "image/webp");
  }
  if (
    pathname === "/images" &&
    (imagePath === "fixture.svg" ||
      (imagePath !== "catalog-1.svg" &&
        /^catalog-(?:menu|\d+)\.svg$/.test(imagePath ?? "")))
  ) {
    if (delayMs) await delay();
    return file(
      '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><rect width="480" height="300" fill="#346854"/></svg>',
      "image/svg+xml",
    );
  }
  return json(null, 404);
}).listen(46253, "127.0.0.1", () => console.log("Fixture UI: 127.0.0.1:46253"));
