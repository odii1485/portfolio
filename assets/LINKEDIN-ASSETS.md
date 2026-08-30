# LinkedIn & social image guide

Use the **right file** for each place ï¿½ aspect ratios are different.

| File | Size | Use on LinkedIn |
|------|------|-----------------|
| `og-card.png` | 1200 ï¿½ 630 (wide) | **Do not** upload as a post image. Only for link previews when you paste your URL in a post. |
| `linkedin-post.png` | 1080 ï¿½ 1350 (portrait 4:5) | **Create post ? Add image** ï¿½ portfolio announcement, ï¿½new site liveï¿½, etc. |
| `linkedin-banner.png` | 1584 ï¿½ 396 (wide banner) | **Profile ? Background photo** (cover behind your headshot). |
| `linkedin-banner.svg` | 1584 ï¿½ 396 (vector) | **Sharpest option** ï¿½ export to PNG at exact size (see below). |

### LinkedIn banner ï¿½ avoid blur & hidden text

LinkedIn places your **profile photo over the bottom-left** of the banner. Do **not** put your name on the far left ï¿½ it will be covered.

- **Safe zone for text:** roughly the **middle 60% to right** of the banner (our SVG uses x ? 468px).
- For **maximum sharpness**, export from `linkedin-banner.svg` (not a resized screenshot):
  1. Open `linkedin-banner.svg` in Chrome or Figma.
  2. Export as PNG at **1584 ï¿½ 396** (100% scale, no compression).
  3. Upload that file as your background photo.

## Quick steps

### Announce your portfolio (post with image)

1. LinkedIn ? **Start a post**
2. Type your caption + paste `https://rahul-odedra.netlify.app/` (link preview uses `og-card.png` automatically)
3. Click **Add a photo** ? choose **`linkedin-post.png`** (not `og-card.png`)
4. Post

### Profile cover (optional)

1. Go to your profile ? pencil on **background image**
2. Upload **`linkedin-banner.png`**

## Edit designs

- Post: edit `linkedin-post.svg`, export PNG as `linkedin-post.png`
- Banner: edit `linkedin-banner.svg`, export PNG as `linkedin-banner.png`
- Link preview: edit `og-card.svg` ? `og-card.png`

Recommended export: PNG, sRGB, no compression artifacts.

### Link preview looks blurry in Post Inspector?

Regenerate `og-card.png` from `og-card.svg` at **1200x630** (vector export, not AI upscale). After deploy, use Post Inspector **Inspect** again — LinkedIn caches old images. Meta tags use `?v=2` to bust cache when the file changes.

