# Test images

Drop sample plant photos here to test the Disease Detection agent from the
command line, without clicking through the browser.

These files are git-ignored. They are test fixtures, not app assets, which is why
they do not live in `public/`.

## What to add

Anything a farmer might actually photograph. A useful spread:

| Suggested name          | What it should show                                  |
| ----------------------- | ---------------------------------------------------- |
| `healthy-leaf.jpg`      | A clearly healthy leaf, to check the agent says so   |
| `leaf-blight.jpg`       | Brown or grey lesions, e.g. wheat or rice blight     |
| `leaf-rust.jpg`         | Orange or brown rust pustules                        |
| `powdery-mildew.jpg`    | White powdery coating                                |
| `pest-damage.jpg`       | Chewed edges, holes, visible insects                 |
| `blurry.jpg`            | A deliberately poor photo, to check it admits doubt  |
| `not-a-plant.jpg`       | Anything unrelated, to check it refuses to guess     |

The last three matter as much as the obvious ones. The agent is instructed to say
when a photo is too unclear to judge and to state plainly when a plant looks
healthy, rather than forcing a diagnosis. Those paths need testing too.

JPG, PNG or WebP. Any size is fine, the browser downscales before upload.

## Running the test

With the dev server up:

```
npm run smoke:diagnose
```

It sends every image in this folder to `POST /api/diagnose` and prints what came
back.
