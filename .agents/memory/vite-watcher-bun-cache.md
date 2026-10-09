---
name: Vite watcher and Bun cache
description: Prevent Vite from traversing Replit's project-local Bun cache during development.
---

When Bun's package cache is inside the project root, exclude cache and imported support directories from Vite's development file watcher. Recursive traversal of the package cache can exhaust file descriptors and stop the preview with `EMFILE`.

**Why:** The imported workspace's `.cache/.bun/install/cache` contained a very large dependency tree, and the first preview startup failed while scanning it.

**How to apply:** For Bun-backed Replit imports, check for project-local package caches and ignore them, along with other generated support folders, in the Vite server watcher.
