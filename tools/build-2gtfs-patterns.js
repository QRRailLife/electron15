#!/usr/bin/env node
/*
  QVAS iPhone GTFS converter
  Reads normal GTFS files from SEQ_GTFS and creates a smaller 2gtfs-patterns.json
  that GitHub Pages/iPhone can use without stop_times.txt.
*/

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = process.cwd();
const GTFS_DIR = path.join(ROOT, 'SEQ_GTFS');
const OUTPUT = path.join(ROOT, '2gtfs-patterns.json');

function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(v => v.trim());
}

async function readCSVMap(fileName, keyField) {
  const filePath = path.join(GTFS_DIR, fileName);
  if (!fs.existsSync(filePath)) throw new Error(`Missing ${filePath}`);

  const map = new Map();
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  let headers = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (!headers) {
      headers = parseCSVLine(line);
      continue;
    }
    const vals = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => row[h] = vals[i] || '');
    map.set(row[keyField], row);
  }
  return map;
}

async function readTrips() {
  const tripsPath = path.join(GTFS_DIR, 'trips.txt');
  if (!fs.existsSync(tripsPath)) throw new Error(`Missing ${tripsPath}`);

  const tripIdMap = {};
  const trips = new Map();
  const routeTripCounts = new Map();

  const rl = readline.createInterface({
    input: fs.createReadStream(tripsPath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  let headers = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (!headers) {
      headers = parseCSVLine(line);
      continue;
    }
    const vals = parseCSVLine(line);
    const trip = {};
    headers.forEach((h, i) => trip[h] = vals[i] || '');
    if (!trip.trip_id || !trip.route_id) continue;
    trips.set(trip.trip_id, trip);
    tripIdMap[trip.trip_id] = trip.route_id;
    routeTripCounts.set(trip.route_id, (routeTripCounts.get(trip.route_id) || 0) + 1);
  }

  return { trips, tripIdMap, routeTripCounts };
}

function formCodeFromTripId(tripId) {
  const i = tripId.lastIndexOf('-');
  return i >= 0 ? tripId.slice(i + 1).trim() : tripId.trim();
}

function runPrefixFromRoute(routeId) {
  return String(routeId || '').split('-')[0].toUpperCase();
}

async function main() {
  console.log('🚆 QVAS iPhone GTFS converter');
  console.log(`📁 Reading: ${GTFS_DIR}`);

  for (const name of ['routes.txt', 'stops.txt', 'trips.txt', 'stop_times.txt']) {
    const p = path.join(GTFS_DIR, name);
    if (!fs.existsSync(p)) throw new Error(`Missing SEQ_GTFS/${name}`);
  }

  console.log('📄 Loading routes.txt...');
  const routesMap = await readCSVMap('routes.txt', 'route_id');

  console.log('📄 Loading stops.txt...');
  const stopsMap = await readCSVMap('stops.txt', 'stop_id');

  console.log('📄 Loading trips.txt...');
  const { trips, tripIdMap, routeTripCounts } = await readTrips();

  const results = {
    generated: new Date().toISOString(),
    version: '2.0-qvas-iphone',
    totalRoutes: routesMap.size,
    tripIdMap,
    runCodeMap: {},
    routes: {}
  };

  for (const [routeId, route] of routesMap.entries()) {
    results.routes[routeId] = {
      route_id: routeId,
      route_name: route.route_short_name || runPrefixFromRoute(routeId),
      route_short_name: route.route_short_name || '',
      route_long_name: route.route_long_name || '',
      route_desc: route.route_desc || '',
      patterns: []
    };
  }

  console.log('📄 Streaming stop_times.txt. This can take a few minutes...');

  const stopTimesPath = path.join(GTFS_DIR, 'stop_times.txt');
  const rl = readline.createInterface({
    input: fs.createReadStream(stopTimesPath, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  let headers = null;
  const currentTripStops = [];
  let currentTripId = null;
  let rowCount = 0;
  let patternCount = 0;
  const seenPatternKeysByRoute = new Map();

  function flushTrip() {
    if (!currentTripId || currentTripStops.length === 0) return;
    const trip = trips.get(currentTripId);
    if (!trip) return;

    const routeId = trip.route_id;
    const routeData = results.routes[routeId];
    if (!routeData) return;

    currentTripStops.sort((a, b) => Number(a.stop_sequence || 0) - Number(b.stop_sequence || 0));
    const stopIds = currentTripStops.map(st => st.stop_id).filter(Boolean);
    if (stopIds.length === 0) return;

    const formCode = formCodeFromTripId(currentTripId);
    const runPrefix = runPrefixFromRoute(routeId);
    const runCode = `${runPrefix}${formCode}`.toUpperCase();
    const dedupeKey = stopIds.join('>') + `|${trip.direction_id || ''}|${trip.trip_headsign || ''}`;

    if (!seenPatternKeysByRoute.has(routeId)) seenPatternKeysByRoute.set(routeId, new Set());
    const seen = seenPatternKeysByRoute.get(routeId);

    const stops = currentTripStops.map(st => {
      const info = stopsMap.get(st.stop_id) || {};
      return {
        id: st.stop_id,
        code: info.stop_code || '',
        name: info.stop_name || st.stop_id,
        stop_sequence: st.stop_sequence || '',
        arrival_time: st.arrival_time || '',
        departure_time: st.departure_time || ''
      };
    });

    const stopping_pattern = stops.map(s => `${runPrefix}|${formCode}|${s.code || s.id}|${s.name}`);

    const pattern = {
      destination: trip.trip_headsign || '',
      direction_id: trip.direction_id || '',
      form_code: formCode,
      run_code: runCode,
      trip_id: currentTripId,
      stops,
      stopping_pattern
    };

    // Keep exact trip/form mappings so every run code can be found.
    routeData.patterns.push(pattern);
    results.runCodeMap[runCode] = { routeId, tripId: currentTripId, formCode };
    patternCount++;

    // Also keep a compact unique-pattern marker for future use.
    seen.add(dedupeKey);
  }

  for await (const line of rl) {
    if (!line.trim()) continue;
    if (!headers) {
      headers = parseCSVLine(line);
      continue;
    }
    const vals = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => row[h] = vals[i] || '');

    if (currentTripId !== null && row.trip_id !== currentTripId) {
      flushTrip();
      currentTripStops.length = 0;
    }
    currentTripId = row.trip_id;
    currentTripStops.push(row);

    rowCount++;
    if (rowCount % 500000 === 0) console.log(`   processed ${rowCount.toLocaleString()} stop_times rows...`);
  }
  flushTrip();

  // Remove routes with no patterns to keep JSON smaller.
  for (const routeId of Object.keys(results.routes)) {
    if (!results.routes[routeId].patterns || results.routes[routeId].patterns.length === 0) {
      delete results.routes[routeId];
    }
  }
  results.totalRoutes = Object.keys(results.routes).length;
  results.stats = {
    trips: trips.size,
    stopTimesRows: rowCount,
    patterns: patternCount,
    routesWithPatterns: results.totalRoutes,
    runCodes: Object.keys(results.runCodeMap).length
  };

  console.log('💾 Writing 2gtfs-patterns.json...');
  fs.writeFileSync(OUTPUT, JSON.stringify(results));
  const mb = fs.statSync(OUTPUT).size / 1024 / 1024;
  console.log(`✅ Done: ${OUTPUT}`);
  console.log(`📦 Size: ${mb.toFixed(2)} MB`);
  console.log(`🚆 Routes: ${results.totalRoutes}`);
  console.log(`🔢 Run codes: ${Object.keys(results.runCodeMap).length}`);
  console.log('Now commit and push 2gtfs-patterns.json to GitHub. Do NOT upload stop_times.txt.');
}

main().catch(err => {
  console.error('❌ Converter failed:', err.message);
  process.exit(1);
});
