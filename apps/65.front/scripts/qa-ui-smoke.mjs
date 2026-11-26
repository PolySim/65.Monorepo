/* global document, getComputedStyle, Node, requestAnimationFrame -- Browser callbacks executed by Playwright. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { parseArgs } from "node:util";

const {
  values: { playwright, chromium: executablePath, output },
} = parseArgs({
  options: {
    playwright: { type: "string", default: "playwright" },
    chromium: { type: "string" },
    output: { type: "string" },
  },
});
const { chromium } = createRequire(import.meta.url)(playwright);
const origin = "http://127.0.0.1:46254";
if (output) await mkdir(output, { recursive: true });
let browser = await chromium.launch({ executablePath });
const media = (urls) =>
  urls.filter((url) => /\/(Home\/|fond_ecran-)/.test(url));
const hikePath = "/categories/ski/states/south/hike/";
let contextNumber = 0;

async function open(path, { mobile = false, mode, viewport } = {}) {
  const context = await browser.newContext({
    hasTouch: mobile,
    viewport:
      viewport ??
      (mobile ? { width: 390, height: 844 } : { width: 1280, height: 850 }),
  });
  if (mode)
    await context.addCookies([
      { name: "qa-ui", value: mode, url: origin },
      // Isolate authenticated Next fetch cache entries between fixture scenarios.
      {
        name: "qa-run",
        value: `${Date.now()}-${++contextNumber}`,
        url: origin,
      },
    ]);
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort(),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const urls = [];
  page.on("request", (req) => urls.push(req.url()));
  await page.goto(`${origin}${path}`);
  return { context, page, urls };
}

async function focused(locator) {
  assert.equal(
    await locator.evaluate((el) => el === document.activeElement),
    true,
  );
}
async function shot(page, name, { fullPage = false } = {}) {
  if (output)
    await page.screenshot({
      path: join(output, `${name}.png`),
      fullPage,
      animations: "disabled",
    });
}

async function fitsViewport(page, locator) {
  const box = await locator.boundingBox();
  assert.ok(
    box && box.y >= 0 && box.y + box.height <= page.viewportSize().height,
    JSON.stringify(box),
  );
  assert.equal(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
    true,
  );
}

try {
  for (const path of ["/auth/signIn", "/"]) {
    for (const mobile of [false, true]) {
      const { context, page, urls } = await open(path, {
        mobile,
        mode: path === "/" ? "normal" : undefined,
      });
      if (path === "/") {
        const card = page.getByRole("link", {
          name: "Sans photo",
          exact: true,
        });
        await card.waitFor();
        assert.equal(await card.locator("img").count(), 0);
      }
      if (!mobile) {
        await page.waitForFunction(() =>
          [...document.querySelectorAll("picture img")].every(
            (img) => img.complete && img.naturalWidth > 1,
          ),
        );
      }
      const paths = media(urls).map((url) => new URL(url).pathname);
      assert.equal(paths.length, mobile ? 0 : path === "/" ? 3 : 1);
      assert.equal(
        urls.some((url) => url.includes("/api/images?path=null")),
        false,
      );
      console.log(path, mobile ? "390px" : "1280px", paths);
      await shot(
        page,
        `${path === "/" ? "home" : "sign-in"}-${mobile ? "mobile" : "desktop"}`,
      );
      if (path === "/" && mobile) {
        await page.getByRole("button", { name: "Ouvrir le menu" }).click();
        const menu = page.getByRole("dialog");
        const noPhoto = menu.getByRole("link", {
          name: "Sans photo",
          exact: true,
        });
        await noPhoto.waitFor();
        assert.equal(await noPhoto.locator("img").count(), 0);
        await page.getByRole("button", { name: "Ski fictif" }).click();
        await page.getByRole("link", { name: "Massif Sud" }).click();
        await page.waitForURL("**/categories/ski/states/south");
      }
      await context.close();
    }
  }

  for (const mobile of [true, false]) {
    const size = mobile ? "390" : "1280";
    const { context, page } = await open("/", { mobile, mode: "saved" });
    const search = page.getByRole("combobox", {
      name: "Rechercher une activité",
    });
    await fitsViewport(page, search);
    const categories = page.locator("#terrains");
    const skiCategory = categories.getByRole("link", { name: /Ski fictif/ });
    await skiCategory.waitFor();
    if (mobile) await fitsViewport(page, skiCategory);
    await search.fill("inconnu");
    await page.getByText(/Aucune activité ne correspond/).waitFor();
    await search.press("Escape");
    await focused(search);
    assert.equal(await search.getAttribute("aria-expanded"), "false");
    await search.click();
    await page.getByText(/Aucune activité ne correspond/).waitFor();
    await search.fill("Parcours wi");
    const option = page.getByRole("option", { name: /Parcours wide/ });
    await option.waitFor();
    await search.press("ArrowDown");
    assert.equal(
      await search.getAttribute("aria-activedescendant"),
      await option.getAttribute("id"),
    );
    await shot(page, `member-search-${size}`);
    await search.press("Enter");
    await page.waitForURL(`**${hikePath}wide`);
    await page.getByRole("heading", { name: "Parcours wide" }).waitFor();
    await page.getByRole("link", { name: "Activités du massif" }).click();
    await page.waitForURL("**/categories/ski/states/south");
    await page.getByRole("heading", { name: "Massif Sud" }).waitFor();
    await page.getByRole("link", { name: /Parcours wide/ }).waitFor();
    await shot(page, `member-collection-${size}`);
    await page.getByRole("link", { name: "Ski fictif", exact: true }).click();
    const sectors = page.getByRole("navigation", {
      name: "Filtrer par massif",
    });
    await sectors.getByRole("link", { name: "Massif Est" }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "Chargement des activités" })
      .waitFor();
    await page
      .getByRole("heading", { name: "Aucune activité trouvée" })
      .waitFor();
    assert.equal(
      await page
        .getByRole("link", { name: "Voir toute la catégorie" })
        .getAttribute("href"),
      "/categories/ski",
    );
    await shot(page, `member-empty-${size}`);
    await page.goto(`${origin}/favorites`);
    await page.getByRole("heading", { name: "Mes favoris" }).waitFor();
    await page.getByRole("link", { name: /Parcours wide/ }).waitFor();
    // Open in a fresh tab: the collection link must not depend on browser history.
    const direct = await context.newPage();
    await direct.goto(`${origin}${hikePath}wide`);
    const favorite = direct.getByRole("button", {
      name: "Retirer des favoris",
      pressed: true,
    });
    await favorite.waitFor();
    const mapLink = direct.getByRole("link", { name: "Carte", exact: true });
    const photoLink = direct.getByRole("link", { name: "Voir les photos (1)" });
    if (mobile) {
      await fitsViewport(direct, mapLink);
      await fitsViewport(direct, direct.getByText("0 m", { exact: true }));
      const actions = await Promise.all(
        [mapLink, photoLink, favorite].map((action) => action.boundingBox()),
      );
      assert.ok(
        actions.every((box) => box?.height >= 44 && box.y === actions[0].y),
        JSON.stringify(actions),
      );
    }
    await shot(direct, `member-hike-${size}`);
    await (mobile ? mapLink.tap() : mapLink.press("Enter"));
    assert.equal(new URL(direct.url()).hash, "#carte");
    await focused(direct.locator("#carte"));
    await (mobile ? photoLink.tap() : photoLink.press("Enter"));
    assert.equal(new URL(direct.url()).hash, "#photos");
    await focused(direct.locator("#photos"));
    const photo = direct.getByRole("button", { name: /Ouvrir la photo 1/ });
    await photo.press("Enter");
    const dialog = direct.getByRole("dialog", { name: /Galerie photo/ });
    await dialog.waitFor();
    await dialog.getByRole("img").evaluate((img) => img.decode());
    await shot(direct, `hike-gallery-${size}`);
    await direct.keyboard.press("Escape");
    await focused(photo);
    assert.equal(await photo.evaluate((el) => getComputedStyle(el).outlineStyle), "solid");
    assert.equal(await photo.evaluate((el) => getComputedStyle(el).outlineWidth), "2px");
    await direct.getByRole("link", { name: "Activités du massif" }).click();
    await direct.waitForURL("**/categories/ski/states/south");
    await context.close();
    console.log(
      `Parcours membre ${size}px : recherche clavier, collection et massif vide, favoris, lien direct, ancres et galerie`,
    );
  }

  for (const mode of ["normal", "member-error"]) {
    const { context, page } = await open("/favorites", { mobile: true, mode });
    await page
      .getByRole("heading", {
        name:
          mode === "normal"
            ? "Aucun favori enregistré"
            : "Impossible de charger vos favoris",
      })
      .waitFor();
    await shot(page, `member-favorites-${mode}`);
    if (mode === "normal") {
      await page
        .getByRole("link", { name: "Voir les catégories", exact: true })
        .click();
      await page.waitForURL(`${origin}/#terrains`);
    } else {
      await page.getByRole("button", { name: "Réessayer" }).waitFor();
      await page.goto(`${origin}/categories/ski/states/south`);
      await page
        .getByRole("heading", { name: "Impossible de charger les activités" })
        .waitFor();
      await page.goto(`${origin}${hikePath}wide`);
      await page
        .getByRole("button", { name: "Réessayer le chargement du favori" })
        .waitFor();
      await page.goto(`${origin}${hikePath}missing`);
      await page
        .getByRole("heading", { name: "Randonnée introuvable" })
        .waitFor();
      await page.getByRole("link", { name: "Activités du massif" }).waitFor();
      await page.goto(origin);
      await page
        .getByRole("combobox", { name: "Rechercher une activité" })
        .fill("Parcours");
      await page
        .getByText("La recherche est momentanément indisponible.")
        .waitFor();
      await page
        .getByRole("search")
        .locator("..")
        .getByRole("button", { name: "Réessayer" })
        .waitFor();
    }
    await context.close();
  }

  // Isolate the desktop keyboard/map suite from the member journey browser.
  await browser.close();
  browser = await chromium.launch({ executablePath });
  const { context, page, urls } = await open("/", { mode: "keys" });
  const trigger = page.getByRole("button", { name: "Catégories", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("navigation", {
    name: "Catégories",
    exact: true,
  });
  await menu
    .getByRole("status", { name: "Chargement des catégories" })
    .waitFor();
  const walk = menu.getByRole("button", { name: "Massifs : Balades" });
  const ski = menu.getByRole("button", { name: "Massifs : Ski fictif" });
  await walk.waitFor();
  const tabTo = async (locator) => {
    await page.keyboard.press("Tab");
    await focused(locator);
  };
  await tabTo(menu.getByRole("link", { name: "Balades" }));
  await tabTo(walk);
  assert.equal(
    await menu.getByRole("link", { name: "Massif Nord" }).count(),
    0,
  );
  await page.keyboard.press("Space");
  await tabTo(menu.getByRole("link", { name: "Massif Nord" }));
  await tabTo(menu.getByRole("link", { name: "Ski fictif" }));
  await tabTo(ski);
  await page.keyboard.press("Enter");
  await tabTo(menu.getByRole("link", { name: "Massif Sud" }));
  await tabTo(menu.getByRole("link", { name: "Massif Est" }));
  await shot(page, "desktop-menu-focus");
  await page.keyboard.press("Escape");
  await focused(trigger);
  assert.equal(await trigger.getAttribute("aria-expanded"), "false");
  await page.keyboard.press("Space");
  for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
  await focused(ski);
  await page.keyboard.press("Space");
  await tabTo(menu.getByRole("link", { name: "Massif Sud" }));
  await page.keyboard.press("Enter");
  await page.waitForURL("**/categories/ski/states/south");
  await page
    .getByRole("link", { name: /Parcours wide/ })
    .getByText("0 m", { exact: true })
    .waitFor();
  console.log(
    "Clavier desktop : deux catégories, Tab, Entrée/Espace, Échap, navigation ; 0 m en liste",
  );

  await page.goto(`${origin}${hikePath}wide`);
  await page.getByText("0 m", { exact: true }).waitFor();
  const map = page.locator(".leaflet-container");
  const track = map.locator("path.leaflet-interactive");
  await track.waitFor();
  const geometry = await track.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const mapBox = el.closest(".leaflet-container").getBoundingClientRect();
    return {
      segments: (el.getAttribute("d").match(/M/g) ?? []).length,
      margins: [
        box.left - mapBox.left,
        box.top - mapBox.top,
        mapBox.right - box.right,
        mapBox.bottom - box.bottom,
      ].map(Math.round),
    };
  });
  assert.equal(geometry.segments, 3);
  assert.ok(
    geometry.margins.every((margin) => margin >= 23),
    JSON.stringify(geometry),
  );
  await map.scrollIntoViewIfNeeded();
  await shot(page, "gpx-wide");
  console.log("GPX large, marges gauche/haut/droite/bas :", geometry.margins);

  urls.length = 0;
  await page.goto(`${origin}${hikePath}single`);
  await track.waitFor();
  await page.waitForFunction(() =>
    document.querySelector('.leaflet-tile-pane img[src*="/15/"]'),
  );
  assert.ok(urls.some((url) => /tile\.openstreetmap\.org\/15\//.test(url)));
  assert.equal(await page.getByText("Dénivelé positif").count(), 0);
  assert.equal(
    await page.getByRole("link", { name: /Voir les photos/ }).count(),
    0,
  );
  await map.scrollIntoViewIfNeeded();
  await shot(page, "gpx-single");
  console.log(
    "GPX 1 point : marqueur visible, zoom initial 15, dénivelé NULL masqué",
  );

  await page.goto(`${origin}${hikePath}empty`);
  await page
    .getByText("Aperçu du tracé indisponible", { exact: true })
    .waitFor();
  await context.close();

  const gpxError = await open(`${hikePath}error`, { mode: "normal" });
  await gpxError.page
    .getByRole("heading", { name: "L’aperçu du tracé est indisponible" })
    .waitFor();
  await gpxError.page.getByRole("button", { name: "Réessayer" }).waitFor();
  await gpxError.page.getByRole("link", { name: "Télécharger le GPX" }).waitFor();
  await shot(gpxError.page, "hike-gpx-error", { fullPage: true });
  await gpxError.context.close();

  for (const mode of ["empty", "error"]) {
    const { context, page } = await open("/", { mode });
    await page.getByRole("button", { name: "Catégories", exact: true }).click();
    const menu = page.getByRole("navigation", {
      name: "Catégories",
      exact: true,
    });
    await menu
      .getByText(
        mode === "empty"
          ? "Aucune catégorie disponible."
          : "Navigation indisponible.",
      )
      .waitFor();
    await page
      .locator("#terrains")
      .getByText(
        mode === "empty"
          ? "Aucune catégorie disponible."
          : "Les catégories ne peuvent pas être chargées",
        { exact: false },
      )
      .waitFor();
    if (mode === "error")
      await menu.getByRole("button", { name: "Réessayer" }).waitFor();
    await context.close();
  }
  console.log(
    "États chargement, vide et erreur : catégories + GPX vide/erreur vérifiés",
  );

  for (const width of [320, 390, 820, 1440]) {
    const { context, page, urls } = await open(`${hikePath}wide`, {
      mobile: width < 768,
      mode: "normal",
      viewport: { width, height: 850 },
    });
    try {
      const title = page.locator("#hike-title");
      const actions = page.getByRole("group", {
        name: "Actions de la randonnée",
      });
      const cover = page.getByRole("img", {
        name: "Paysage de la randonnée Parcours wide",
      });
      await cover.evaluate((img) => img.decode());
      await fitsViewport(page, title);
      await fitsViewport(page, actions);
      await page.getByRole("button", { name: "Ajouter aux favoris" }).waitFor();
      const actionBox = await actions.boundingBox();
      const coverBox = await cover.boundingBox();
      assert.ok(
        width < 768
          ? actionBox.y + actionBox.height <= coverBox.y
          : actionBox.x + actionBox.width <= coverBox.x,
      );
      assert.equal(
        Math.round(coverBox.width),
        { 320: 288, 390: 358, 820: 370, 1440: 584 }[width],
      );
      assert.equal(
        await cover.evaluate((img) => getComputedStyle(img).objectPosition),
        "50% 23%",
      );
      assert.ok(
        await page.locator("#carte").evaluate((map) =>
          Boolean(
            map.compareDocumentPosition(document.querySelector("#photos")) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        ),
      );
      await page.locator(".leaflet-container").waitFor();
      assert.deepEqual(
        await page.locator("article *").evaluateAll((elements) =>
          elements
            .filter((el) => {
              // Tailwind's shadow-none serializes as transparent zero-size layers.
              const shadow = getComputedStyle(el).boxShadow.replaceAll(
                /rgba\(0, 0, 0, 0\)(?: 0px){4}(?:, )?/g,
                "",
              );
              return shadow && shadow !== "none";
            })
            .map((el) => el.className),
        ),
        [],
      );
      if (output) {
        // Full-page captures must not depend on the browser's lazy-load distance.
        await page.locator("article header img, #photos img").evaluateAll(async (images) => {
          await Promise.all(images.map((image) => {
            image.loading = "eager";
            return image.decode();
          }));
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
        });
        await shot(page, `hike-editorial-${width}`, { fullPage: true });
      }

      urls.length = 0;
      await page.goto(`${origin}${hikePath}long-no-media`);
      await title.filter({ hasText: /Traversée des crêtes/ }).waitFor();
      await fitsViewport(page, title);
      await fitsViewport(page, actions);
      assert.equal(await actions.getByRole("link").count(), 0);
      assert.equal(
        await page
          .locator("article img, #carte, #photos, #hike-key-information, #hike-description-title, #hike-indications-title")
          .count(),
        0,
      );
      assert.ok(!urls.some((url) => /\/api\/(?:gpx|images)\b/.test(url)));
      await shot(page, `hike-long-no-media-${width}`);
      console.log(`Fiche ${width}px : cover ${coverBox.width}px, actions visibles, aucun débordement ; titre long et médias absents OK`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
