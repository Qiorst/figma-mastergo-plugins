# Figma Plugin Release Guide

This document describes how to build and publish a Figma plugin from a specific plugin subdirectory in this repository.

## Release Scope

This repository may contain multiple plugins or platform-specific plugin implementations. A Figma release must package only the target Figma plugin directory, not the entire repository.

Current Figma plugin source directory:

```text
plugins/image-tuner/image-tuner-figma
```

The release artifact should contain only the runtime files from this directory.

## Plugin Directory Requirements

A Figma plugin package must include `manifest.json` at the package root. The entry files referenced by `manifest.json` must be located in the same package.

Current plugin directory structure:

```text
plugins/image-tuner/image-tuner-figma/
  manifest.json
  code.js
  ui.html
  icon.svg
  README.md
  ai-proxy.js
```

File responsibilities:

- `manifest.json`: Figma plugin manifest
- `code.js`: plugin main-thread entry
- `ui.html`: plugin UI entry
- `icon.svg`: plugin icon
- `README.md`: plugin usage documentation
- `ai-proxy.js`: optional local AI proxy script

Current manifest:

```json
{
  "name": "Image Tuner",
  "id": "image-tuner-figma",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"]
}
```

## Build the Release Artifact

Run the following commands from the repository root:

```powershell
$src = "plugins\image-tuner\image-tuner-figma"
$dist = "dist\image-tuner-figma"
$zip = "dist\image-tuner-figma.zip"

Remove-Item -Recurse -Force $dist -ErrorAction SilentlyContinue
Remove-Item -Force $zip -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Force $dist | Out-Null
Copy-Item "$src\*" $dist -Recurse

Compress-Archive -Path "$dist\*" -DestinationPath $zip -Force
```

Expected output:

```text
dist/image-tuner-figma.zip
```

## Artifact Structure

The zip file must expose the plugin files at the archive root:

```text
manifest.json
code.js
ui.html
icon.svg
README.md
ai-proxy.js
```

Do not package the full repository:

```text
figma-mastergo-plugins/
  plugins/
    image-tuner/
      image-tuner-figma/
        manifest.json
```

Avoid adding an extra top-level plugin folder inside the zip:

```text
image-tuner-figma/
  manifest.json
  code.js
  ui.html
```

The recommended structure is that `manifest.json` is visible immediately after extracting the zip.

## Local Verification

Before publishing, import the built plugin in Figma Desktop:

```text
Plugins -> Development -> Import plugin from manifest...
```

Select:

```text
dist/image-tuner-figma/manifest.json
```

Recommended verification checklist:

- The plugin loads successfully in Figma Desktop.
- The plugin UI opens correctly.
- Core plugin workflows complete successfully.
- `manifest.json` references valid `main` and `ui` files.
- The release zip contains only the target plugin files.

## GitHub Release

Recommended tag format:

```text
image-tuner-v1.1.1
```

Recommended release title:

```text
Image Tuner v1.1.1
```

Release asset:

```text
dist/image-tuner-figma.zip
```

Release notes template:

```md
## Image Tuner v1.1.1

This release contains the Figma build of Image Tuner.

### Source Directory

`plugins/image-tuner/image-tuner-figma`

### Release Asset

`image-tuner-figma.zip`

### Included Files

- `manifest.json`
- `code.js`
- `ui.html`
- `icon.svg`
- `README.md`
- `ai-proxy.js`

### Installation

Extract the zip file, then import the plugin in Figma Desktop:

`Plugins -> Development -> Import plugin from manifest...`

Select the extracted `manifest.json` file.
```

## Notes

- Package only the target plugin directory for each release.
- Keep `manifest.json` at the package root.
- Ensure all files referenced by `manifest.json` exist in the package.
- Update `manifest.json` whenever entry file names change.
- `ai-proxy.js` is a local proxy script. If the plugin is distributed externally, document its purpose, runtime requirements, and setup steps clearly.
- Complete local validation in Figma Desktop before submitting to Figma Community.