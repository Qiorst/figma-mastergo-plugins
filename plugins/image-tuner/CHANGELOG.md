# Changelog

## v1.1.0 - 2026-06-26

### Added

- Add Camera Raw style Light controls: Exposure, Contrast, Highlights, Shadows, Whites, Blacks.
- Add Color controls: Temperature, Tint, Vibrance, Saturation, Hue.
- Add Effects controls: Grain and Vignette.
- Add Chinese/English UI language toggle.
- Add realtime layer updates while dragging sliders.

### Changed

- Expand the saved parameter schema while preserving migration from old Brightness values to Exposure.
- Keep the Apply button as an immediate manual apply action alongside realtime updates.
- Use a debounce and queue so dragging sliders updates the layer without flooding MasterGo with writes.

### Fixed

- Cancel pending auto-apply work before restoring the original image with Reset.
- Preserve the non-destructive original-image baseline, external image source change detection, and Reset-to-original behavior.

## v1.0.0

- Select one MasterGo image layer.
- Preview the selected image in the plugin panel.
- Adjust brightness, contrast, saturation, and hue.
- Apply the adjusted image back to the selected layer.
- Preserve original image source for non-destructive reset.
- Reset restores the original image and clears adjustment parameters.
- Detect external image source changes and reset parameters automatically.
