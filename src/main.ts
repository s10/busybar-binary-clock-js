import { appsSettingsGet, BusyBarAppClient, displayDraw, generateXpm2 } from "@busy-app/busy-lib";
import { id as APP } from "./appmeta/manifest.json";
import { fadeColumns, frameGrid, msToNextSecond, renderGrid, timeDigits } from "./frame.ts";
import { DEFAULTS, framePalette, resolveSettings } from "./settings.ts";

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
  let shownDigits: number[] = [];
  let palette: Record<string, string> = {};
  let redrawTimer: ReturnType<typeof setTimeout> | undefined;

  async function send(grid: string[]) {
    await displayDraw(client, {
      application_name: APP,
      elements: [{ id: "frame", type: "xpmbitmap", x: 0, y: 0, data: generateXpm2({ palette, grid }) }],
    });
  }

  async function draw() {
    if (stopped) {
      return;
    }

    try {
      const digits = timeDigits(new Date(), settings);
      const grid = frameGrid(digits, settings);
      const next = grid.join("\n");

      if (next !== shownFrame) {
        if (settings.effect === "fade" && shownDigits.length === digits.length) {
          await send(renderGrid(fadeColumns(shownDigits, digits, 1), settings));
          await send(renderGrid(fadeColumns(shownDigits, digits, 2), settings));
        }

        await send(grid);
        shownFrame = next;
        shownDigits = digits;
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
    palette = framePalette(settings);
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
