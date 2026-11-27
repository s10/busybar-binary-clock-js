import { appsSettingsGet, BusyBarAppClient, displayDraw, generateXpm2 } from "@busy-app/busy-lib";
import { id as APP } from "./appmeta/manifest.json";
import { frameGrid, timeDigits } from "./frame.ts";
import { BACKGROUND, DEFAULTS, OFF_COLOR, onColor, resolveSettings } from "./settings.ts";

const REDRAW_INTERVAL_MS = 1000;

const client = new BusyBarAppClient({ addr: __BUSY_ADDR__ });

let settings = DEFAULTS;

function report(err: unknown) {
  console.error(`${APP}: ${err instanceof Error ? err.message : String(err)}`);
}

async function loadSettings() {
  try {
    const { values } = await appsSettingsGet(client, { app_id: APP });
    settings = resolveSettings(values);
  } catch (err) {
    report(err);
  }
}

function main() {
  let stopped = false;
  let drawing = false;
  let shownFrame = "";
  let palette: Record<string, string> = {};
  let redrawTimer: ReturnType<typeof setInterval> | undefined;

  async function draw() {
    if (stopped || drawing) {
      return;
    }

    drawing = true;

    try {
      const grid = frameGrid(timeDigits(new Date(), settings), settings);
      const next = grid.join("\n");

      if (next !== shownFrame) {
        await displayDraw(client, {
          application_name: APP,
          elements: [{ id: "frame", type: "xpmbitmap", x: 0, y: 0, data: generateXpm2({ palette, grid }) }],
        });
        shownFrame = next;
      }
    } catch (err) {
      report(err);
    } finally {
      drawing = false;
    }
  }

  async function start() {
    await loadSettings();
    palette = { ".": BACKGROUND, o: OFF_COLOR, "#": onColor(settings) };
    await draw();

    if (!stopped) {
      redrawTimer = setInterval(draw, REDRAW_INTERVAL_MS);
    }
  }

  const unbind = listen("input", (event) => {
    if (stopped || event.key !== "back" || event.action !== "short") {
      return;
    }

    stopped = true;
    clearInterval(redrawTimer);

    setTimeout(unbind, 10);
  });

  start();
}

main();
