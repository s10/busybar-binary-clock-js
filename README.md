# Binary Clock

A clock for the [BUSY Bar](https://busy.app) that shows the time as columns of binary digits.

![Binary Clock at 15:19:08, squares](screenshots/1-large.png)

## How to read it

Each column is one decimal digit of the time: two columns for hours, two for minutes and two for seconds. A column has four bits, worth 8, 4, 2 and 1 from top to bottom. Add up the lit bits to get the digit.

In the picture above the columns read 1, 5, 1, 9, 0, 8, which is 15:19:08.

With rectangle bits and wide spacing, at 15:27:29:

![Binary Clock at 15:27:29, rectangles](screenshots/2-large.png)

The enlarged pictures are drawn from the 72×16 captures in `screenshots/1.png` and `screenshots/2.png`, which come from a BUSY Bar.

## Settings

| Setting | Values | Default |
|---|---|---|
| Color | Green, Amber, Red, Cyan, White, Custom | Green |
| Custom color | Any color; used when Color is Custom. Change it in the Web UI | `#00FF00` |
| Bit shape | Square (3×3), Rectangle (6×3), Long rectangle (9×3), Fill the bar (as wide as fits) | Square |
| Spacing | Tight, Medium, Wide | Medium |
| Show seconds | On, off | On |
| Time format | 24-hour, 12-hour. The 12-hour clock has no AM/PM mark | 24-hour |

Long rectangles with seconds do not fit at wide spacing, so they are drawn at medium spacing then.

The app reads its settings when it starts. Open it again to see a change.

A short press of Back closes the app.

## Build and install

The project needs Node 24 and pnpm.

```sh
pnpm install
pnpm test          # unit tests
pnpm build         # dist/io.github.s10.binary_clock.tgz
pnpm app:install   # install on the BUSY Bar connected over USB
pnpm app:run       # start the app
```

## License

MIT, see [LICENSE](LICENSE).
