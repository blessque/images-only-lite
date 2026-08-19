# images-only-lite

A photography portfolio that is nothing but the photographs: one page, edge to edge, no
gaps, no captions, no navigation. Put your pictures in a folder, push, and it is online.

Free to host — it runs on GitHub Pages, with no server, no database and no account anywhere
else.

**[See the template's own gallery](https://blessque.github.io/images-only-lite/)** — that
link stays pointed at the original wherever this README gets copied to. **Yours** will be at
`https://<your-username>.github.io/<your-repo>/`; the finished Actions run links straight to
it, and it is also printed in **Settings → Pages**.

## What makes it not just a grid

Every photograph is shown **whole**. Nothing is ever cropped to fit, and rows still fill the
window exactly — the layout solves a row height for each row so both can be true at once.
Wide pictures stay wide, tall ones stay tall, and the wall has no holes in it.

It also does not jump about while it loads. The proportions of every photograph are worked
out when the site is built, so the page reserves the right space before a single image
arrives. Measured on a real build: **CLS 0.00000**.

## Use it

1. Press **Use this template → Create a new repository**.
2. In your new repository, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**. Once, and never again.
3. Put your photographs in `photos/` (delete the samples), edit `site.txt`, and commit.
4. Wait for the green tick on the Actions tab. Your gallery is at
   `https://<your-username>.github.io/<your-repo>/`.

Step 2 really is necessary and no workflow can do it for you — creating a Pages site is not
something GitHub lets a workflow's own token do. If you skip it, the first run stops in a few
seconds and tells you so, rather than building everything and then failing.

You never need to install anything or open a terminal. Adding a photograph later is the
same thing: drop the file into `photos/` on github.com and commit.

### Naming your files

The filename is the whole interface.

| you write | you get |
|---|---|
| `01-…`, `02-…`, `03-…` | the order they appear in |
| `…-solo.jpg` | takes a whole row on its own |
| `…-tight.jpg` | packs more photographs into its row |
| anything else | shares a row normally |

`01-sunrise-over-the-bay-solo.jpg` is a whole-row photograph, first in the gallery, with the
alt text "Sunrise over the bay". A camera dump like `IMG_4821.jpg` gets no alt text, which is
better than alt text that reads "IMG 4821".

`site.txt` is your name on the first line and your contact on the second. They are the only
words on the site.

### Sizes are handled for you

Drop in the full-size file. Every photograph is resized to 400, 800, 1600 and 2400px wide and
converted to WebP when the site builds, and browsers pick whichever fits the screen — so a
phone downloads a phone-sized picture, not your 12MP original. Nothing is upscaled: a small
photograph simply stops early.

The resized copies are **not** stored in your repository. They are made during the build and
published straight to Pages, so committing 200 photographs costs you 200 files, not 800.

## Running it on your own machine

Only if you want to. You do not need this to use the site.

```sh
npm install
npm run gallery   # build the page, then resize everything in photos/
npm run preview   # look at it
npm run verify    # prove it works when served from a subfolder
npm test          # the layout solver's own tests
```

`npm run verify` is worth knowing about: it serves the built site **one directory down**,
because that is where GitHub Pages puts a project repository, and that is the arrangement in
which absolute paths quietly break. It also re-checks that nothing is cropped and that layout
shift is zero.

## What this is not

There is no admin panel, no login and no upload button. Editing means committing files. That
is a deliberate trade for being free, static and impossible to break — but it means this
edition suits someone comfortable with a repository.

If you want drag-and-drop uploading from the page itself, that is the full edition this one
was cut down from: [blessque/images-only](https://github.com/blessque/images-only), which
runs on a Cloudflare Worker, on Node, or on any PHP host.

## Credits

The layout solver, the grid and the type are lifted from
[images-only](https://github.com/blessque/images-only). Inter Tight is under the SIL Open
Font License; see `src/assets/fonts/OFL.txt`. The sample photographs are generated
placeholders — delete them.
