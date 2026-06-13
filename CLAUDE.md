# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A single-page PWA that shows wing foil conditions (wind speed, gusts, direction, precipitation) for three Houston/Galveston Bay spots: Texas City Dike, Quintana Beach, and El Jardim (EJ). Forecast data comes from the Open-Meteo GFS API (NOAA HRRR-derived, 3 km).

## Architecture

Everything lives in `index.html` — there is no build step, package manager, or test suite. Open the file directly in a browser or serve it statically to develop.

- **CONFIG**: `SPOTS` array defines the three locations (name, lat/lon, NOAA station link). `buildURL(spot)` constructs the Open-Meteo API request (hourly wind speed/gusts/direction/weather code/precipitation, daily sunrise/sunset, knots, `America/Chicago` timezone, 2-day forecast).
- **LOGIC**: `classify(speed, code, precip)` maps a forecast hour to a rating (Bad/Good/Excellent/Expert/Nuking) based on wind speed thresholds (12/14/25/30 kn), storm weather codes, and heavy precipitation. `dirName()` converts degrees to compass direction.
- **RENDER**: `render(json)` builds the Today/Tomorrow sections, filtering hourly data to the daylight window (30 min after sunrise to 30 min before sunset) and counting "rideable" hours.
- **LOAD**: `loadSpot(idx, force)` fetches and caches per-tab forecast data (`cache` array, one entry per spot), with offline/error fallback to last cached response. All three spots load in parallel on boot; switching tabs renders from cache if available. `visibilitychange` triggers a full refresh when the app is reopened.
- **PWA**: registers `./sw.js` as a service worker. `sw.js` caches the app shell (cache-first) and Open-Meteo/Marine/NOAA API responses (network-first, falling back to cached data marked `X-From-Cache`); a "Check for App Update" button in the footer unregisters the SW, clears caches, and reloads to fetch the latest version.

## Versioning

`APP_VERSION` (shown in the footer as "v...") is auto-stamped with the current timestamp (`YYYY.MM.DD.HHMM`) by the `.githooks/pre-commit` hook whenever `index.html` is part of a commit. This repo uses `core.hooksPath = .githooks` (set via `git config core.hooksPath .githooks`) — re-run that command after a fresh clone for the hook to take effect.

## Notes

- Wind speed thresholds and storm/precipitation rules in `classify()` are the core domain logic; any UI changes to ratings/legend should stay in sync with this function and the `.legend` pills in the `<style>` block.
