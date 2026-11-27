import { appsSettingsGet, BusyBarAppClient, displayDraw, generateXpm2 } from "@busy-app/busy-lib";
import { id as APP } from "./appmeta/manifest.json";
import { frameGrid, msToNextSecond, timeDigits } from "./frame.ts";
import { BACKGROUND, DEFAULTS, OFF_COLOR, onColor, resolveSettings } from "./settings.ts";

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
  let shownFrame = "";
  let palette: Record<string, string> = {};
  let redrawTimer: ReturnType<typeof setTimeout> | undefined;

  async function draw() {
    if (stopped) {
      return;
    }

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
    }
  }

  async function tick() {
    await draw();

    if (!stopped) {
      redrawTimer = setTimeout(tick, msToNextSecond(Date.now()));
    }
  }

  async function start() {
    await loadSettings();
    palette = { ".": BACKGROUND, o: OFF_COLOR, "#": onColor(settings) };
    await tick();
  }

  const unbind = listen("input", (event) => {
    if (stopped || event.key !== "back" || event.action !== "short") {
      return;
    }

    stopped = true;
    if (redrawTimer !== undefined) {
      clearTimeout(redrawTimer);
    }

    setTimeout(unbind, 10);
  });

  start();
}

main();
