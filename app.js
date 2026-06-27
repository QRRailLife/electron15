// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('❌ UNCAUGHT ERROR:', event.error);
  console.error(event.error.stack);
});

// Global async error handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ UNHANDLED PROMISE REJECTION:', event.reason);
});


// ==================== iPhone/PWA compatibility helpers ====================
// These helpers let the app run as a normal website/PWA without Electron or localhost.
window.QVAS_PWA_MODE = !(typeof window !== 'undefined' && typeof window.require !== 'undefined');

function qvasBasePath() {
  // GitHub Pages serves this repo under /electron15/.  Do not use ../ for root
  // folders, because that jumps out to https://qrraillife.github.io/ and causes 404s.
  if (window.QVAS_BASE_PATH) return window.QVAS_BASE_PATH;
  if (window.location.protocol === 'file:') return './';

  let path = window.location.pathname || '/';
  // If the page is /electron15/index.html, use /electron15/.
  if (!path.endsWith('/')) path = path.substring(0, path.lastIndexOf('/') + 1);
  if (!path) path = '/';
  window.QVAS_BASE_PATH = path;
  return path;
}

function qvasAssetUrl(assetPath) {
  if (!assetPath) return '';
  let raw = String(assetPath).replace(/\\/g, '/').trim();
  if (/^(https?:|blob:|data:)/i.test(raw)) return raw;

  let normalized = raw.replace(/^\/+/, '');
  normalized = normalized.replace(/^\.\//, '').replace(/^\.\.\//, '');
  normalized = normalized.replace(/^audio\//i, '');

  const encoded = normalized.split('/').map(part => encodeURIComponent(part)).join('/');
  return qvasBasePath() + encoded;
}

function qvasCreateInlineWindowTarget(name) {
  return {
    closed: false,
    postMessage(data) {
      try {
        const pid = document.getElementById('pid-display');
        const di = document.getElementById('di-display');
        const special = document.getElementById('special-message-display');
        if (data && typeof data === 'object') {
          if (data.type === 'RESET' || data.type === 'STOP') {
            if (special) special.textContent = '';
            return;
          }
          if (data.type === 'DI' && di) {
            di.textContent = data.text || data.message || '';
            return;
          }
          if (data.destination && pid) {
            pid.textContent = data.destination;
            return;
          }
          if ((data.text || data.message) && special) {
            special.textContent = data.text || data.message;
            return;
          }
        }
        if (typeof data === 'string') {
          if (special) special.textContent = data;
          console.log(`[${name}]`, data);
        }
      } catch (err) {
        console.warn(`[${name}] Inline message update failed:`, err);
      }
    }
  };
}

function qvasHandleLocalKey(key) {
  const normalized = String(key || '').toLowerCase();
  if (normalized === '3' || normalized === 'numpad3') {
    if (typeof doorsUnlock === 'function') doorsUnlock();
    return true;
  }
  if (normalized === '4' || normalized === 'numpad4') {
    if (typeof playArrivalAnnouncement === 'function') playArrivalAnnouncement();
    return true;
  }
  if (normalized === '6' || normalized === 'numpad6') {
    if (typeof doorsLock === 'function') doorsLock();
    return true;
  }
  return false;
}

// Run Code Parser - Queensland Rail Run Number Guide
const runCodeGuide = {
  firstChar: {
    '1': { type: '6-car SMU train', revenue: true },
    '2': { type: '6-car SMU train', revenue: false, empty: true },
    'A': { type: '6-car IMU train', revenue: false, empty: true },
    'B': { type: '3-car IMU train', revenue: false, empty: true },
    'C': { type: '3-car SMU train', revenue: false, empty: true },
    'D': { type: '6-Car NGR', revenue: true },
    'H': { type: 'Electric Hauled non-revenue train', revenue: false },
    'J': { type: '3-car SMU', revenue: true },
    'L': { type: 'Diesel Light Engine', revenue: false },
    'M': { type: 'Steam hauled train', revenue: true },
    'Q': { type: 'Electric Multiple Unit Tilt', revenue: true },
    'S': { type: 'Steam light engine/hauled empty carriages', revenue: false },
    'T': { type: '6-car IMU', revenue: true },
    'U': { type: '3-car IMU', revenue: true },
    'V': { type: 'Diesel Tilt', revenue: true }
  },
  secondChar: {
    '0': { route: 'Bowen Hills and Electric Train Depot via Main Lines', destinations: ['Bowen Hills', 'Electric Train Depot'] },
    '1': { route: 'Caboolture Line', destinations: ['Caboolture', 'Elimbah', 'Dakabin'] },
    '4': { route: 'Sunshine Coast Line', destinations: ['Gympie North', 'Yandina'] },
    '5': { route: 'Ipswich Line', destinations: ['Ipswich', 'Riverview'] },
    '6': { route: 'Rosewood Line', destinations: ['Thomas Street', 'Rosewood'] },
    '7': { route: 'Beenleigh Line', destinations: ['Beenleigh', 'Trinder Park'] },
    '8': { route: 'Cleveland Line', destinations: ['Lota', 'Cleveland'] },
    '9': { route: 'Roma Street - Electric Train Shed South', destinations: ['Roma Street', 'Electric Train Shed South'] },
    'A': { route: 'Shorncliffe Line', destinations: ['Shorncliffe', 'Bindha'] },
    'B': { route: 'Doomben Line', destinations: ['Doomben', 'Clayfield'] },
    'D': { route: 'Milton - Redbank', destinations: ['Redbank', 'Milton'] },
    'E': { route: 'Ferny Grove Line', destinations: ['Ferny Grove', 'Windsor'] },
    'F': { route: 'Brisbane Various', destinations: ['Roma Street', 'Central', 'Fortitude Valley'] },
    'G': { route: 'Gold Coast Line', destinations: ['Varsity Lakes', 'Ormeau'] },
    'H': { route: 'Buranda - Manly', destinations: ['Manly', 'Buranda'] },
    'K': { route: 'Springfield Line', destinations: ['Springfield Central', 'Richlands'] },
    'L': { route: 'Nambour Line', destinations: ['Nambour', 'Elimbah'] },
    'M': { route: 'Electric Train Flyover', destinations: ['Bowen Hills'] },
    'P': { route: 'Airport Line', destinations: ['Domestic Airport', 'International Airport'] },
    'Q': { route: 'Electric Train Shed South', destinations: ['Electric Train Shed South'] },
    'R': { route: 'Roma Street - Electric Train Shed South', destinations: ['Roma Street', 'Electric Train Shed South'] },
    'S': { route: 'Park Road Line', destinations: ['Park Road', 'South Brisbane'] },
    'U': { route: 'Wulkuraka NGR Maintenance', destinations: ['Wulkuraka'] },
    'V': { route: 'Dutton Park - Kuraby', destinations: ['Kuraby', 'Dutton Park'] },
    'W': { route: 'Albion - Northgate', destinations: ['Northgate', 'Albion'] },
    'X': { route: 'Exhibition', destinations: ['Exhibition'] },
    'Y': { route: 'Redcliffe Peninsula Line', destinations: ['Kippa-Ring', 'Virginia'] },
    'Z': { route: 'Exhibition', destinations: ['Exhibition'] }
  },
  thirdChar: {
    '0': { pattern: 'Standard running (all stations)', express: false },
    '1': { pattern: 'Standard running (all stations)', express: false },
    '2': { pattern: 'Standard running (all stations)', express: false },
    '3': { pattern: 'Standard running (all stations)', express: false },
    '4': { pattern: 'Standard running (all stations)', express: false },
    '5': { pattern: 'Standard running (all stations)', express: false },
    '6': { pattern: 'Standard running (all stations)', express: false },
    '7': { pattern: 'Standard running (all stations)', express: false },
    '8': { pattern: 'Standard running (all stations)', express: false },
    '9': { pattern: 'Standard running (all stations)', express: false },
    'T': { pattern: 'Express running (AM standardised)', express: true },
    'V': { pattern: 'Express running (AM standardised)', express: true },
    'X': { pattern: 'PM Express running', express: true },
    'Y': { pattern: 'PM Express running', express: true },
    'Z': { pattern: 'PM Express running', express: true },
    'M': { pattern: 'PM peak short-finishing', express: false, shortFinish: true },
    'N': { pattern: 'PM peak short-finishing', express: false, shortFinish: true }
  },
  fourthChar: {
    even: 'Service concludes in UP direction (towards city)',
    odd: 'Service concludes in DOWN direction (away from city)'
  }
};

// Global variable to store current trip info from GTFS
let currentGTFSTrip = null;

// Global variables for GTFS data access
let globalGTFSData = null;
let tripIdMap = {}; // Map trip_id to route_id for fast lookup

// ==================== STATION NAME NORMALIZATION ====================
// Normalize station names: "Beenleigh station, platform 2" -> "Beenleigh"
function normalizeStationName(fullName) {
  if (!fullName) return fullName;
  
  // Remove "station" and everything after it, including commas
  let normalized = fullName.replace(/\s+station.*$/i, '').trim();
  
  // Remove any trailing commas or platform info
  normalized = normalized.replace(/,.*$/, '').trim();
  
  return normalized;
}

// ==================== GTFS CSV PARSER ====================
// Parse CSV data and return array of objects
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle quoted fields that might contain commas
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx] || '';
    });
    rows.push(obj);
  }
  
  return rows;
}

// Load and parse SEQ_GTFS files
async function loadSEQGTFSFromFiles() {
  console.log('📂 Loading SEQ_GTFS files from server...');
  try {
    const results = {
      routes: {},
      trips: [],
      tripIdMap: {},
      stops: {},
      totalRoutes: 0,
      loadTime: new Date().toLocaleTimeString()
    };
    
    // List of GTFS files to load
    const files = ['routes.txt', 'stops.txt', 'trips.txt', 'stop_times.txt'];
    const fileData = {};
    
    for (const file of files) {
      console.log(`📄 Loading ${file}...`);
      
      // Try to fetch from local HTTP server first (most reliable)
      let response = await fetch(qvasAssetUrl(`SEQ_GTFS/${file}`));
      
      if (!response.ok) {
        // Fallback to relative path
        console.log(`   ⚠️ localhost:3000 failed, trying relative path...`);
        response = await fetch(qvasAssetUrl(`SEQ_GTFS/${file}`));
      }
      
      if (!response.ok) {
        // Try alternate path
        console.log(`   ⚠️ Relative path failed, trying ./`);
        response = await fetch(qvasAssetUrl(`SEQ_GTFS/${file}`));
      }
      
      if (!response.ok) {
        throw new Error(`${file} not found - status ${response.status}`);
      }
      
      const text = await response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error(`${file} is empty`);
      }
      
      fileData[file] = parseCSV(text);
      
      if (fileData[file].length === 0) {
        throw new Error(`${file} parsed but contains no data`);
      }
      
      console.log(`✅ Loaded ${fileData[file].length} rows from ${file}`);
    }
    
    // Process routes.txt
    fileData['routes.txt'].forEach(route => {
      results.routes[route.route_id] = {
        ...route,
        patterns: [] // Will be populated below
      };
    });
    
    // Process stops.txt
    fileData['stops.txt'].forEach(stop => {
      results.stops[stop.stop_id] = stop;
    });
    
    // Process trips.txt - build trip ID map
    fileData['trips.txt'].forEach(trip => {
      results.trips.push(trip);
      results.tripIdMap[trip.trip_id] = trip.route_id;
    });
    
    // Build patterns from stop_times.txt
    console.log('🔨 Building patterns from stop_times.txt...');
    const stopTimesByTrip = {};
    fileData['stop_times.txt'].forEach(stopTime => {
      if (!stopTimesByTrip[stopTime.trip_id]) {
        stopTimesByTrip[stopTime.trip_id] = [];
      }
      stopTimesByTrip[stopTime.trip_id].push(stopTime);
    });
    
    // For each trip, create a pattern (one pattern per unique stop sequence per trip)
    const patternsByRoute = {};
    
    Object.entries(stopTimesByTrip).forEach(([tripId, stopTimes]) => {
      // Find which route this trip belongs to
      const route_id = results.tripIdMap[tripId];
      if (!route_id) return;
      
      if (!patternsByRoute[route_id]) {
        patternsByRoute[route_id] = [];
      }
      
      // Sort stops by sequence
      stopTimes.sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));
      
      // Convert to pattern format
      const pattern = {
        trip_id: tripId,
        form_code: tripId.substring(tripId.lastIndexOf('-') + 1), // Extract form code from trip ID
        stops: stopTimes.map(st => {
          const stopInfo = results.stops[st.stop_id];
          return {
            id: st.stop_id,
            code: stopInfo ? stopInfo.stop_code : '',
            name: stopInfo ? stopInfo.stop_name : st.stop_id,
            stop_sequence: st.stop_sequence,
            arrival_time: st.arrival_time,
            departure_time: st.departure_time
          };
        })
      };
      
      // Add pattern if not duplicate
      const exists = patternsByRoute[route_id].some(p => 
        p.stops.length === pattern.stops.length &&
        p.stops.every((s, idx) => s.id === pattern.stops[idx].id)
      );
      
      if (!exists) {
        patternsByRoute[route_id].push(pattern);
      }
    });
    
    // Attach patterns to routes
    Object.entries(patternsByRoute).forEach(([routeId, patterns]) => {
      if (results.routes[routeId]) {
        results.routes[routeId].patterns = patterns;
      }
    });
    
    console.log(`✅ Built ${Object.keys(patternsByRoute).length} routes with patterns`);
    console.log(`✅ Built tripIdMap with ${Object.keys(results.tripIdMap).length} entries`);
    
    results.totalRoutes = Object.keys(results.routes).length;
    console.log(`📊 SEQ_GTFS Data Summary: ${results.totalRoutes} routes, ${Object.keys(results.stops).length} stops, ${results.trips.length} trips`);
    
    return results;
  } catch (error) {
    console.error('❌ Error loading SEQ_GTFS files:', error.message);
    console.error('   Stack:', error.stack);
    return null;
  }
}

// ==================== PERFORMANCE OPTIMIZATION ====================
// Cache for GTFS results to avoid repeated lookups
const gtfsCache = new Map();
const MAX_CACHE_SIZE = 50; // Only keep last 50 routes cached
let lastRouteEnterTime = 0; // For debouncing rapid route changes

// Function to add to cache with size limit (LRU-like behavior)
function setCacheWithLimit(key, value) {
  if (gtfsCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry when cache is full
    const firstKey = gtfsCache.keys().next().value;
    gtfsCache.delete(firstKey);
  }
  gtfsCache.set(key, value);
}

// Wrapper to add timeout to GTFS requests (2 second timeout)
async function searchRunInGTFSWithTimeout(runCode, timeoutMs = 2000) {
  // Check cache first
  if (gtfsCache.has(runCode)) {
    console.log(`✓ [CACHE HIT] GTFS data for ${runCode}`);
    return gtfsCache.get(runCode);
  }
  
  // Search in local stoppingPatterns instead of calling Flask
  try {
    const upperCode = runCode.toUpperCase();
    const stoppingPatterns = window.stoppingPatterns || {};
    
    // First try direct lookup in runCodeIndex
    if (runCodeIndex && runCodeIndex[upperCode]) {
      const data = runCodeIndex[upperCode];
      const result = {
        found: true,
        routeId: upperCode,
        tripId: upperCode,
        destination: data.route_long_name || 'Unknown',
        data: data
      };
      setCacheWithLimit(runCode, result);
      console.log(`✓ [GTFS] Found ${runCode} in route code index`);
      return result;
    }
    
    // Search trip ID map for matching run code
    // Trip IDs contain the run code, e.g., "34773333-QR 25_26-40890-DR26"
    // Try to use the tripIdMap from globalGTFSData if the global tripIdMap is empty
    let currentTripMap = tripIdMap;
    if (globalGTFSData && globalGTFSData.tripIdMap && Object.keys(currentTripMap).length === 0) {
      currentTripMap = globalGTFSData.tripIdMap;
      console.log(`📌 Using tripIdMap from globalGTFSData (${Object.keys(currentTripMap).length} entries)`);
    }
    
    if (currentTripMap && Object.keys(currentTripMap).length > 0) {
      console.log(`🔍 Searching ${Object.keys(currentTripMap).length} trip IDs for "${upperCode}"...`);
      for (const [tripId, routeId] of Object.entries(currentTripMap)) {
        if (tripId.includes(upperCode)) {
          console.log(`✓ [GTFS] Found ${runCode} in trip ID: ${tripId} => ${routeId}`);
          // Return the route data for this trip
          if (globalGTFSData && globalGTFSData.routes && globalGTFSData.routes[routeId]) {
            const data = globalGTFSData.routes[routeId];
            const result = {
              found: true,
              routeId: routeId,
              tripId: tripId,
              destination: data.route_long_name || 'Unknown',
              data: data
            };
            setCacheWithLimit(runCode, result);
            return result;
          }
        }
      }
      console.log(`⚠️  No matching trip ID found for "${upperCode}"`);
    } else {
      console.log(`⚠️  tripIdMap is empty! (${Object.keys(currentTripMap).length} entries)`);
    }
    
    // Try extracting route code (remove digits)
    const routeCodePrefix = upperCode.replace(/[0-9]/g, '').substring(0, 4);
    if (routeCodePrefix && routeCodePrefix.length >= 2 && runCodeIndex[routeCodePrefix]) {
      const data = runCodeIndex[routeCodePrefix];
      const result = {
        found: true,
        routeId: routeCodePrefix,
        tripId: routeCodePrefix,
        destination: data.route_long_name || 'Unknown',
        data: data
      };
      setCacheWithLimit(runCode, result);
      console.log(`✓ [GTFS] Found ${runCode} by prefix ${routeCodePrefix}`);
      return result;
    }
    
    // Then search stoppingPatterns with multiple strategies
    for (const [key, pattern] of Object.entries(stoppingPatterns)) {
      const keyUpper = key.toUpperCase();
      if (keyUpper === upperCode || 
          keyUpper.startsWith(upperCode) || 
          keyUpper.includes(upperCode)) {
        const result = {
          found: true,
          routeId: key,
          tripId: key,
          destination: pattern.route_long_name || 'Unknown',
          data: pattern
        };
        setCacheWithLimit(runCode, result);
        console.log(`✓ [GTFS] Found ${runCode} in stoppingPatterns as ${key}`);
        return result;
      }
    }
    
    console.log(`⏱️ [GTFS] Run code ${runCode} not found in local patterns`);
    return null;
  } catch (err) {
    console.debug('Error searching local GTFS:', err);
    return null;
  }
}

// Function to search for a run code in GTFS data (local version)
async function searchRunInGTFS(runCode) {
  try {
    const upperCode = runCode.toUpperCase();
    
    // Try direct lookup first (exact match in route codes)
    if (runCodeIndex && runCodeIndex[upperCode]) {
      console.log(`✅ Found run code ${runCode} in route code index`);
      const data = runCodeIndex[upperCode];
      currentGTFSTrip = data;
      return data;
    }
    
    // Search trip ID map for matching run code
    // Trip IDs contain the run code, e.g., "34773333-QR 25_26-40890-DR26"
    if (tripIdMap && Object.keys(tripIdMap).length > 0) {
      for (const [tripId, routeId] of Object.entries(tripIdMap)) {
        if (tripId.includes(upperCode)) {
          console.log(`✅ Found run code ${runCode} in trip ID: ${tripId} => ${routeId}`);
          // Return the route data for this trip
          if (globalGTFSData && globalGTFSData.routes && globalGTFSData.routes[routeId]) {
            const data = globalGTFSData.routes[routeId];
            currentGTFSTrip = data;
            return data;
          }
        }
      }
    }
    
    // Try extracting route code if input includes extra digits
    // e.g., "DR26" should extract "DR" to search index
    const routeCodePrefix = upperCode.replace(/[0-9]/g, '').substring(0, 4);
    if (routeCodePrefix && routeCodePrefix.length >= 2 && runCodeIndex[routeCodePrefix]) {
      console.log(`✅ Found run code ${runCode} by route prefix ${routeCodePrefix}`);
      const data = runCodeIndex[routeCodePrefix];
      currentGTFSTrip = data;
      return data;
    }
    
    // Search in stoppingPatterns - look for any key that contains the route pattern
    const stoppingPatterns = window.stoppingPatterns || {};
    for (const [key, pattern] of Object.entries(stoppingPatterns)) {
      const keyUpper = key.toUpperCase();
      // Try multiple match strategies
      if (keyUpper === upperCode || 
          keyUpper.startsWith(upperCode) || 
          keyUpper.includes(upperCode)) {
        console.log(`✅ Found run code ${runCode} in stoppingPatterns as ${key}`);
        currentGTFSTrip = pattern;
        return pattern;
      }
    }
    
    console.log(`❌ Run code ${runCode} not found in local patterns`);
    return null;
  } catch (err) {
    console.error('Error searching local GTFS:', err);
    return null;
  }
}

// Function to get stopping pattern from GTFS data
async function getStoppingPatternFromGTFS(tripId) {
  try {
    // tripId might be the trip ID from the map, e.g., "34773333-QR 25_26-40890-DR26"
    // or it might be a route ID like "BNFG-4483"
    
    // First check if it's a trip ID that maps to a route
    let routeId = null;
    if (tripIdMap && tripIdMap[tripId]) {
      routeId = tripIdMap[tripId];
    } else if (globalGTFSData && globalGTFSData.tripIdMap && globalGTFSData.tripIdMap[tripId]) {
      routeId = globalGTFSData.tripIdMap[tripId];
    } else if (globalGTFSData && globalGTFSData.routes && globalGTFSData.routes[tripId]) {
      // It's already a route ID
      routeId = tripId;
    }
    
    if (!routeId || !globalGTFSData || !globalGTFSData.routes) {
      console.log(`⚠️  No pattern found for trip ${tripId}`);
      return null;
    }
    
    const routeData = globalGTFSData.routes[routeId];
    if (!routeData || !routeData.patterns || routeData.patterns.length === 0) {
      console.log(`⚠️  No patterns in route ${routeId}`);
      return null;
    }
    
    // Extract form code from trip ID for matching
    // Trip ID format: "36278112-QR 25_26-41937-18S4" -> form_code = "18S4"
    const formCode = tripId.includes('-') ? tripId.substring(tripId.lastIndexOf('-') + 1) : null;
    
    // Find pattern matching both trip_id and form_code
    let mainPattern = null;
    if (formCode) {
      for (const pattern of routeData.patterns) {
        if (pattern.trip_id === tripId && pattern.form_code === formCode) {
          mainPattern = pattern;
          console.log(`✓ Found exact pattern match by trip_id="${tripId}" and form_code="${formCode}"`);
          break;
        }
      }
    }
    
    // Fallback: match by form_code only
    if (!mainPattern && formCode) {
      for (const pattern of routeData.patterns) {
        if (pattern.form_code === formCode) {
          mainPattern = pattern;
          console.log(`⚠️ Matched pattern by form_code="${formCode}" (trip_id mismatch)`);
          break;
        }
      }
    }
    
    // Final fallback: use first pattern
    if (!mainPattern) {
      mainPattern = routeData.patterns[0];
      console.log(`⚠️ Using first available pattern for trip ${tripId}`);
    }
    
    if (!mainPattern.stops || mainPattern.stops.length === 0) {
      console.log(`⚠️  No stops in pattern for ${routeId}`);
      return null;
    }
    
    const stoppingPattern = mainPattern.stops.map(station => {
      const normalizedName = normalizeStationName(station.name);
      return {
        name: normalizedName,
        stopId: station.id,
        code: station.code,
        platform: station.name.split('platform').pop().trim().replace(/[,\s]/g, ''),
        sequence: station.stop_sequence,
        announcements: {
          mindTheGap: {
            text: normalizedName,
            audio: ''
          }
        }
      };
    });
    
    console.log(`✅ Extracted ${stoppingPattern.length} stations from GTFS pattern for ${routeId}`);
    return stoppingPattern;
  } catch (err) {
    console.error('Error getting stopping pattern from GTFS:', err);
    return null;
  }
}

// Function to search gtfs-patterns.json by run number suffix
// Example: searchRoutesByRunNumber("18S4") finds all trip IDs ending with "18S4"
// Returns array of {routeId, tripId, destination, stoppingPattern, formCode} objects
// IMPORTANT: Matches patterns by FORM_CODE and TRIP_ID to ensure correct stopping pattern
async function searchRoutesByRunNumber(runNumber) {
  try {
    if (!runNumber || runNumber.length === 0) {
      console.warn('⚠️ Empty run number provided');
      return [];
    }

    const upperRunNumber = runNumber.toUpperCase();
    let currentTripMap = tripIdMap;
    
    // Use the tripIdMap from globalGTFSData if local tripIdMap is empty
    if (globalGTFSData && globalGTFSData.tripIdMap && Object.keys(currentTripMap).length === 0) {
      currentTripMap = globalGTFSData.tripIdMap;
      console.log(`📌 Using tripIdMap from globalGTFSData (${Object.keys(currentTripMap).length} entries)`);
    }
    
    if (!currentTripMap || Object.keys(currentTripMap).length === 0) {
      console.warn('⚠️ No trip ID map available');
      return [];
    }

    console.log(`🔍 Searching ${Object.keys(currentTripMap).length} trip IDs for run number "${upperRunNumber}"...`);
    
    const matches = [];
    
    // Search through tripIdMap for matching run numbers
    for (const [tripId, routeId] of Object.entries(currentTripMap)) {
      // Check if trip ID ends with the run number
      // Trip IDs are formatted like: "36278112-QR 25_26-41937-18S4"
      if (tripId.toUpperCase().endsWith(upperRunNumber)) {
        console.log(`✓ Found trip ID match: ${tripId} => ${routeId}`);
        
        // Get route data
        if (globalGTFSData && globalGTFSData.routes && globalGTFSData.routes[routeId]) {
          const routeData = globalGTFSData.routes[routeId];
          
          // Extract form_code from trip_id (last segment after the last dash)
          // e.g., "36278112-QR 25_26-41937-18S4" -> "18S4"
          const tripIdFormCode = tripId.substring(tripId.lastIndexOf('-') + 1);
          
          // Find the pattern that matches BOTH form_code and trip_id
          let matchedPattern = null;
          if (routeData.patterns && Array.isArray(routeData.patterns)) {
            for (const pattern of routeData.patterns) {
              // Pattern must match by form_code AND trip_id for exact correctness
              if (pattern.form_code === tripIdFormCode && pattern.trip_id === tripId) {
                matchedPattern = pattern;
                console.log(`✓ Matched pattern with form_code="${pattern.form_code}" and trip_id="${pattern.trip_id}"`);
                break;
              }
            }
            
            // Fallback: if no exact match found, try matching by form_code only
            if (!matchedPattern) {
              for (const pattern of routeData.patterns) {
                if (pattern.form_code === tripIdFormCode) {
                  matchedPattern = pattern;
                  console.log(`⚠️ Partial match by form_code="${pattern.form_code}" (trip_id mismatch)`);
                  break;
                }
              }
            }
          }
          
          // Build stopping pattern from matched pattern
          let stoppingPattern = [];
          if (matchedPattern) {
            if (matchedPattern.stops && Array.isArray(matchedPattern.stops)) {
              // Use stops array if available
              stoppingPattern = matchedPattern.stops.map(station => {
                const normalizedName = normalizeStationName(station.name);
                return {
                  name: normalizedName,
                  stopId: station.id,
                  code: station.code,
                  platform: station.name.split('platform').pop().trim().replace(/[,\s]/g, ''),
                  sequence: station.stop_sequence,
                  announcements: {
                    mindTheGap: {
                      text: normalizedName,
                      audio: ''
                    }
                  }
                };
              });
            } else if (matchedPattern.stopping_pattern && Array.isArray(matchedPattern.stopping_pattern)) {
              // Fallback: parse stopping_pattern strings in format "ROUTE|FORMCODE|STOPID|STATIONNAME"
              stoppingPattern = matchedPattern.stopping_pattern.map((patternStr, index) => {
                const parts = patternStr.split('|');
                const stationName = parts.length > 3 ? parts.slice(3).join('|') : '';
                const normalizedName = normalizeStationName(stationName);
                return {
                  name: normalizedName,
                  stopId: parts[2] || '',
                  code: parts[2] || '',
                  sequence: index + 1,
                  announcements: {
                    mindTheGap: {
                      text: normalizedName,
                      audio: ''
                    }
                  }
                };
              });
            }
          }
          
          matches.push({
            tripId: tripId,
            routeId: routeId,
            formCode: tripIdFormCode,
            destination: matchedPattern?.destination || routeData.route_long_name || 'Unknown',
            routeName: routeData.route_name || routeId,
            directionId: matchedPattern?.direction_id || '',
            stoppingPattern: stoppingPattern
          });
        }
      }
    }
    
    console.log(`✅ Found ${matches.length} routes for run number "${upperRunNumber}"`);
    return matches;
  } catch (error) {
    console.error('Error searching routes by run number:', error);
    return [];
  }
}

// Global index for fast run code lookup (populated when GTFS loads)

let runCodeIndex = {};

function parseRunCode(runCode) {
  if (!runCode || runCode.length !== 4) {
    return null;
  }
  
  const code = runCode.toUpperCase();
  
  // First, try to find the route using fast lookup index from GTFS data
  if (runCodeIndex && runCodeIndex[code]) {
    const gtfsRoute = runCodeIndex[code];
    const patterns = Array.isArray(gtfsRoute.patterns) ? gtfsRoute.patterns : [];
    
    if (patterns.length > 0) {
      // Find pattern that matches the run code (form_code)
      let mainPattern = null;
      
      // First try: find pattern with matching form_code
      for (const pattern of patterns) {
        if (pattern.form_code === code) {
          mainPattern = pattern;
          console.log(`✓ Found exact form_code match: ${code}`);
          break;
        }
      }
      
      // Fallback: if no exact form_code match, prefer main destination pattern
      if (!mainPattern) {
        mainPattern = patterns[0];
        const long_name = gtfsRoute.route_long_name || '';
        
        if (patterns.length > 1 && long_name.includes('-')) {
          const expectedDestination = long_name.split('-')[1].trim().toLowerCase();
          const matchedPattern = patterns.find(p => {
            const patternDest = (p.destination || '').toLowerCase();
            return patternDest.includes(expectedDestination);
          });
          if (matchedPattern) {
            mainPattern = matchedPattern;
          }
        }
        console.log(`⚠️ No exact form_code match for ${code}, using pattern with destination: ${mainPattern.destination}`);
      }
      
      // Use the new stops format (replaces old stations)
      const stops = mainPattern.stops || [];
      
      // Use destination from JSON (from trips.txt headsign)
      let destination = mainPattern.destination || 'Unknown';
      
      // Get stopping pattern - formatted as: <run_code>|<form_code>|<station_id>|<station_name>
      const stoppingPattern = mainPattern.stopping_pattern || [];
      const stoppingPatternDisplay = `${stops.length} stops`;
      
      // Determine direction and other info from run code structure
      const fourth = parseInt(code[3]);
      const direction = (fourth % 2 === 0) ? 'UP (towards city)' : 'DOWN (away from city)';
      
      console.log(`✅ Found GTFS route for ${code}: ${gtfsRoute.route_name || 'Route'} to ${destination}`);
      
      return {
        runCode: code,
        trainType: 'Train',
        isRevenue: true,
        isEmpty: false,
        route: gtfsRoute.route_name || code,
        destination: destination,
        allDestinations: stops.map(s => s.name),
        stoppingPattern: stoppingPatternDisplay,
        stoppingPatternArray: stoppingPattern,
        stoppingPatternDirect: stops, // Also include detailed stops
        isExpress: false,
        isShortFinish: false,
        direction: direction,
        description: `Service to ${destination}`,
        isGTFS: true
      };
    }
  }
  
  // For run codes that start with known route codes, try to match by route_short_name from GTFS
  // Extract the first two characters as potential route code
  const potentialRouteCode = code.substring(0, 2).toUpperCase();
  if (globalGTFSData && globalGTFSData.routes) {
    for (const [routeId, routeData] of Object.entries(globalGTFSData.routes)) {
      const routeShortName = routeData.route_name || routeId.split('-')[0];
      if (routeShortName.toUpperCase() === potentialRouteCode && routeData.patterns && routeData.patterns.length > 0) {
        // Find pattern with matching form_code first
        let mainPattern = null;
        
        for (const pattern of routeData.patterns) {
          if (pattern.form_code === code) {
            mainPattern = pattern;
            console.log(`✓ Found exact form_code match for ${code}`);
            break;
          }
        }
        
        // Fallback: use best destination pattern
        if (!mainPattern) {
          mainPattern = routeData.patterns[0];
          const long_name = routeData.route_long_name || '';
          
          if (routeData.patterns.length > 1 && long_name.includes('-')) {
            const expectedDestination = long_name.split('-')[1].trim().toLowerCase();
            const matchedPattern = routeData.patterns.find(p => {
              const patternDest = (p.destination || '').toLowerCase();
              return patternDest.includes(expectedDestination);
            });
            if (matchedPattern) {
              mainPattern = matchedPattern;
            }
          }
        }
        
        const stops = mainPattern.stops || [];
        
        // Use destination from JSON (from trips.txt headsign)
        let destination = mainPattern.destination || 'Unknown';
        
        const stoppingPattern = mainPattern.stopping_pattern || [];
        const stoppingPatternDisplay = `${stops.length} stops`;
        const fourth = parseInt(code[3]);
        const direction = (fourth % 2 === 0) ? 'UP (towards city)' : 'DOWN (away from city)';
        
        console.log(`✅ Found partial GTFS match for ${code}: ${routeShortName} to ${destination}`);
        
        runCodeIndex[code] = routeData; // Cache for next time
        
        return {
          runCode: code,
          trainType: 'Train',
          isRevenue: true,
          isEmpty: false,
          route: routeShortName,
          destination: destination,
          allDestinations: stops.map(s => s.name),
          stoppingPattern: stoppingPatternDisplay,
          stoppingPatternArray: stoppingPattern,
          stoppingPatternDirect: stops,
          isExpress: false,
          isShortFinish: false,
          direction: direction,
          description: `Service to ${destination}`,
          isGTFS: true
        };
      }
    }
  }
  
  // Only fall back to hardcoded runCodeGuide if absolutely necessary
  const first = code[0];
  const second = code[1];
  const third = code[2];
  const fourth = parseInt(code[3]);
  
  const trainInfo = runCodeGuide.firstChar[first];
  const routeInfo = runCodeGuide.secondChar[second];
  const patternInfo = runCodeGuide.thirdChar[third];
  const direction = (fourth % 2 === 0) ? 'UP (towards city)' : 'DOWN (away from city)';
  
  if (!trainInfo || !routeInfo || !patternInfo) {
    console.warn(`⚠️ Could not parse run code ${code} - missing info`);
    return null;
  }
  
  console.log(`⚠️ Using hardcoded fallback for ${code} (GTFS data not available)`);
  
  // Determine destination based on direction
  let destination;
  if (fourth % 2 === 0) {
    // Even = UP direction (towards city) - use first destination (typically city-bound)
    destination = routeInfo.destinations[0];
  } else {
    // Odd = DOWN direction (away from city) - use last destination (typically outbound)
    destination = routeInfo.destinations[routeInfo.destinations.length - 1];
  }
  
  return {
    runCode: code,
    trainType: trainInfo.type,
    isRevenue: trainInfo.revenue,
    isEmpty: trainInfo.empty || false,
    route: routeInfo.route,
    destination: destination,
    allDestinations: routeInfo.destinations,
    stoppingPattern: patternInfo.pattern,
    isExpress: patternInfo.express || false,
    isShortFinish: patternInfo.shortFinish || false,
    direction: direction,
    description: `${trainInfo.type} ${trainInfo.revenue ? 'revenue' : 'non-revenue'} service on ${routeInfo.route} to ${destination}`
  };
}


// ============================================================================
// IPHONE / SAFARI AUDIO UNLOCK
// iOS blocks audio until the user taps once. This keeps the normal QVAS look,
// but gives Safari permission to play announcement sounds after install.
// ============================================================================
let qvasAudioUnlocked = false;

function hideQvasAudioUnlockButton() {
  const btn = document.getElementById('qvas-audio-unlock');
  if (btn) btn.classList.add('hidden');
}

function showQvasAudioUnlockButton() {
  const btn = document.getElementById('qvas-audio-unlock');
  if (btn) btn.classList.remove('hidden');
}

function unlockQvasAudio() {
  qvasAudioUnlocked = true;
  window.qvasAudioUnlocked = true;
  hideQvasAudioUnlockButton();

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') ctx.resume().catch(() => null);
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  } catch (err) {
    console.warn('iPhone audio unlock warning:', err && err.message ? err.message : err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const unlockButton = document.getElementById('qvas-audio-unlock');
  if (unlockButton) {
    unlockButton.addEventListener('click', unlockQvasAudio, { passive: true });
    unlockButton.addEventListener('touchend', unlockQvasAudio, { passive: true });
  }

  // Any tap on the QVAS screen also unlocks audio, so you do not have to press a special button first.
  document.addEventListener('pointerdown', () => {
    if (!qvasAudioUnlocked) unlockQvasAudio();
  }, { once: true, passive: true });
});

// Global audio instance for tracking and stopping
let currentAudio = null;
let doorOverlayAudio = null; // Door opening beep that can play under the station + MTG announcement
let audioQueue = []; // Used for old sequential audio if needed
let selectedAudioDevice = localStorage.getItem('selectedAudioDevice') || ''; // Audio output device selection
let runInput = null; // Global reference to run number input field

// Announcement looping system
let currentAnnouncementType = null; // Track current announcement type (TNS, NAA, MTG, form, etc.)
let currentAnnouncementAudioPath = null; // Track audio path for looping
let currentAnnouncementDisplayText = null; // Track display text for looping
let announcementLoopTimer = null; // Timer ID for announcement loop
let isLoopingAnnouncement = false; // Flag to indicate if we're currently looping
let isPlayingArrivalAnnouncement = false; // Flag to track if we're playing an arrival announcement (NAA)
let shouldPlayExitButtons = false; // Flag to track if current train number starts with "D"
let ngrButtonMessageEnabled = false; // Flag to track NGR Button Message toggle state

// Function to stop any currently playing audio
function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    console.log('Audio stopped');
  }
  if (doorOverlayAudio) {
    doorOverlayAudio.pause();
    doorOverlayAudio.currentTime = 0;
    doorOverlayAudio = null;
    console.log('Door overlay beep stopped');
  }
  // Clear any queued audio sequence
  audioQueue = [];

  // Stop announcement looping if active
  if (announcementLoopTimer) {
    clearInterval(announcementLoopTimer);
    announcementLoopTimer = null;
    isLoopingAnnouncement = false;
    console.log('Announcement looping stopped');
  }
  // NOTE: We do NOT reset isPlayingArrivalAnnouncement here because playAudio() calls stopAudio()
  // at the start, and we need to preserve the flag for when the audio ends
  updateStopButtonColor(); // Update button color when audio is stopped
}

// Function to manually stop audio (used by stop button clicks)
function manualStopAudio() {
  stopAudio();
  isPlayingArrivalAnnouncement = false; // Only reset when manually stopped
  console.log('Audio manually stopped - reset flags');
}

function updateStopButtonColor() {
  // Determine if audio is currently playing
  const isPlaying = currentAudio && !currentAudio.paused && currentAudio.currentTime > 0;
  
  // Get all stop buttons
  const stopButtons = [
    document.getElementById('stop-btn'),
    document.getElementById('startup-stop-btn'),
    document.getElementById('station-stop-btn'),
    document.getElementById('normal-stop-btn'),
    document.getElementById('special-stop-btn'),
    document.getElementById('cctv-stop-btn')
  ];
  
  // Update color for all stop buttons
  stopButtons.forEach(btn => {
    if (btn) {
      if (isPlaying) {
        btn.classList.add('footer-btn-green');
        btn.classList.remove('footer-btn-grey');
      } else {
        btn.classList.remove('footer-btn-green');
        btn.classList.add('footer-btn-grey');
      }
    }
  });
}

// Start announcement looping - repeats current announcement until next one is triggered
function startAnnouncementLoop(audioPath, displayText, announcementType) {
  // Store the announcement details for looping
  currentAnnouncementAudioPath = audioPath;
  currentAnnouncementDisplayText = displayText;
  currentAnnouncementType = announcementType;
  
  // Stop any existing loop
  if (announcementLoopTimer) {
    clearInterval(announcementLoopTimer);
  }
  
  // Flag that we're looping
  isLoopingAnnouncement = true;
  
  console.log(`🔄 Starting announcement loop for: ${announcementType} - will repeat until next announcement`);
  
  // Wait for current audio to finish, then replay
  const checkAndReplay = () => {
    if (!currentAudio || currentAudio.paused || currentAudio.ended) {
      // Audio finished, replay if still looping
      if (isLoopingAnnouncement && currentAnnouncementAudioPath) {
        console.log(`🔄 Replaying announcement: ${currentAnnouncementType}`);
        playAudio(currentAnnouncementAudioPath);
      }
    }
  };
  
  // Check every 500ms if audio has finished
  announcementLoopTimer = setInterval(checkAndReplay, 500);
}


// Door sound files for Key 3 (open beep) and Key 6 (doors closing)
// Put your real MP3 files in: QR_PIDS_AudioFiles/Door Sounds/
const doorSoundPaths = {
  ngrOpen: 'QR_PIDS_AudioFiles/Door Sounds/NGR opening beep.MP3',
  oldOpen: 'QR_PIDS_AudioFiles/Door Sounds/Older opening beep.MP3',
  ngrClose: 'QR_PIDS_AudioFiles/Door Sounds/NGR doors closing.mp3',
  oldClose: 'QR_PIDS_AudioFiles/Door Sounds/Older doors closing.mp3'
};

function isNgrTrainSelected() {
  // Manual NGR toggle OR run number beginning with D = NGR
  if (ngrButtonMessageEnabled === true || shouldPlayExitButtons === true) {
    return true;
  }

  if (runInput && runInput.value && runInput.value.trim().toUpperCase().startsWith('D')) {
    return true;
  }

  return false;
}

function getDoorSoundPath(action) {
  const ngr = isNgrTrainSelected();

  if (action === 'open') {
    return ngr ? doorSoundPaths.ngrOpen : doorSoundPaths.oldOpen;
  }

  if (action === 'close') {
    return ngr ? doorSoundPaths.ngrClose : doorSoundPaths.oldClose;
  }

  return null;
}


function makeAudioUrl(audioPath) {
  const normalizedPath = audioPath.replace(/\\/g, '/');

  if (audioFileCache[audioPath]) {
    return audioFileCache[audioPath];
  }

  if (typeof window !== 'undefined' && typeof window.require !== 'undefined') {
    return qvasAssetUrl(normalizedPath);
  }

  return qvasAssetUrl(normalizedPath);
}

// Plays the door opening beep at the same time as the station + Mind The Gap announcement.
// This is for Key 3: CCTV + opening beep underneath/overlapping the MTG audio.
function playDoorBeepUnderAnnouncement(beepPath, announcementPath) {
  stopAudio();

  if (beepPath) {
    try {
      doorOverlayAudio = new Audio(makeAudioUrl(beepPath));
      doorOverlayAudio.volume = (window.vasVolume !== undefined) ? window.vasVolume : 0.5;

      if (selectedAudioDevice && typeof doorOverlayAudio.setSinkId === 'function') {
        doorOverlayAudio.setSinkId(selectedAudioDevice).catch((err) => {
          console.warn('   ⚠️ Failed to set door beep audio sink:', err.message);
        });
      }

      doorOverlayAudio.addEventListener('ended', () => {
        doorOverlayAudio = null;
      });

      doorOverlayAudio.play().catch((err) => {
        console.error('   ✗ Door opening beep playback failed:', err.message);
      });
    } catch (err) {
      console.error('   ✗ Could not play door opening beep:', err.message);
    }
  }

  if (announcementPath) {
    // Tiny delay keeps the beep starting first, then the station name + MTG talks over it.
    setTimeout(() => {
      playAudioInternal(announcementPath, null);
    }, 120);
  }
}

function playQueuedAudio() {
  if (!audioQueue.length) return;
  const nextAudioPath = audioQueue.shift();
  playAudioInternal(nextAudioPath, null);
}

function playAudioSequence(paths) {
  stopAudio();
  audioQueue = paths.filter(Boolean);
  playQueuedAudio();
}

// Audio playing function for Electron with proper file:// URL handling
function playAudio(audioPath) {
  // Stop any currently playing audio first
  stopAudio();
  
  if (!audioPath) {
    console.log('No audio path provided');
    return;
  }
  
  // Determine fallback path for Form announcements
  let fallbackPath = null;
  if (audioPath.includes('/Form/')) {
    // Extract station name from Form path: Form/{FormCode}/{StationName}/{RouteLongName}.mp3
    const formPathMatch = audioPath.match(/\/Form\/[^\/]+\/([^\/]+)\/[^\/]+\.mp3$/);
    if (formPathMatch) {
      const stationName = formPathMatch[1];
      // Fallback to standard mind the gap
      fallbackPath = `QR_PIDS_AudioFiles/mind the gap/${stationName} MTG.mp3`;
    }
  }
  
  playAudioInternal(audioPath, fallbackPath);
}

function playAudioInternal(audioPath, fallbackPath) {
  if (!audioPath) return;
  
  console.log(`🎵 Playing audio: ${audioPath}`);
  
  // Broadcast audio to remote devices
  if (typeof updateAppState === 'function') {
    updateAppState({ audioPath: audioPath });
  }
  
  try {
    let fileUrl = audioPath;
    let isElectron = false;
    let usingCache = false;
    
    // Check if file is already preloaded in cache
    if (audioFileCache[audioPath]) {
      fileUrl = audioFileCache[audioPath];
      usingCache = true;
      console.log(`   ✓ [CACHED] Using preloaded blob URL (instant playback)`);
    } else {
      console.log(`   ⚠️  Not in cache, fetching on demand...`);
      
      // ALWAYS use HTTP server endpoint for audio files
      // This avoids file:// URL issues with spaces and special characters
      // The local server (http://localhost:3000) is already running
      const normalizedPath = audioPath.replace(/\\/g, '/');
      
      // Check if running in Electron
      if (typeof window !== 'undefined' && typeof window.require !== 'undefined') {
        try {
          // In Electron: use HTTP server endpoint (localhost:3000)
          // This works around file:// URL encoding issues
          fileUrl = qvasAssetUrl(normalizedPath);
          isElectron = true;
          console.log('   [Electron/PWA] Using relative audio path, no local server needed');
        } catch (e) {
          console.log('   Electron detection failed, trying browser mode');
          // Fallback to browser path
          fileUrl = qvasAssetUrl(normalizedPath);
        }
      } else {
        // Browser mode: use relative path
        fileUrl = qvasAssetUrl(normalizedPath);
        console.log('   [Browser/PWA] Using relative audio path');
      }
    }
    
    const audio = new Audio(fileUrl);
    currentAudio = audio; // Track the audio instance
    // Use cabin volume from Fn settings, default to 50%
    audio.volume = (window.vasVolume !== undefined) ? window.vasVolume : 0.5;
    
    // Set audio output device if one is selected
    if (selectedAudioDevice && typeof audio.setSinkId === 'function') {
      audio.setSinkId(selectedAudioDevice).then(() => {
        console.log('   ✓ Audio routed to device:', selectedAudioDevice);
      }).catch((err) => {
        console.warn('   ⚠️ Failed to set audio sink:', err.message);
      });
    } else if (selectedAudioDevice) {
      console.log('   ℹ️ Browser does not support setSinkId API, using default device');
    }
    
    // Flag to track if we've already tried fallback
    audio.fallbackAttempted = false;
    
    // Add comprehensive event listeners for debugging
    audio.addEventListener('loadstart', () => {
      if (usingCache) {
        console.log('   ✓ Audio loading from cache');
      } else {
        console.log('   ✓ Audio loading from HTTP');
      }
    });
    audio.addEventListener('loadeddata', () => console.log('   ✓ Audio data loaded'));
    audio.addEventListener('canplay', () => console.log('   ✓ Audio ready to play'));
    audio.addEventListener('playing', () => {
      console.log('   ✓ Audio is playing');
      updateStopButtonColor();
    });
    audio.addEventListener('ended', () => {
      console.log('   ✓ Audio finished');
      console.log(`   DEBUG: isPlayingArrivalAnnouncement=${isPlayingArrivalAnnouncement}, ngrButtonMessageEnabled=${ngrButtonMessageEnabled}`);
      updateStopButtonColor();

      // If a sequence is queued, play the next sound (example: beep -> MTG).
      if (audioQueue.length > 0) {
        console.log(`   ▶ Playing next queued audio item (${audioQueue.length} left after this)`);
        playQueuedAudio();
        return;
      }
      
      // If we just finished playing an arrival announcement and ngrButtonMessageEnabled is set, play exit buttons sound
      if (isPlayingArrivalAnnouncement && ngrButtonMessageEnabled) {
        isPlayingArrivalAnnouncement = false;
        
        console.log(`   🎵 Playing exit buttons sound immediately`);
        // Play exit buttons sound immediately when arrival audio ends
        playAudioInternal('QR_PIDS_AudioFiles/Special Messages/exit buttons.MP3', null);
      } else {
        isPlayingArrivalAnnouncement = false;
        if (!isPlayingArrivalAnnouncement || !ngrButtonMessageEnabled) {
          console.log(`   ℹ️ Not playing exit buttons - isPlayingArrivalAnnouncement: ${isPlayingArrivalAnnouncement}, ngrButtonMessageEnabled: ${ngrButtonMessageEnabled}`);
        }
      }
    });
    audio.addEventListener('error', (e) => {
      console.error('   ✗ Audio error:', {
        error: e.error,
        message: e.message,
        type: e.type,
        src: audio.src,
        networkState: audio.networkState,
        readyState: audio.readyState
      });
      
      // Try fallback if available and not already tried
      if (fallbackPath && !audio.fallbackAttempted) {
        audio.fallbackAttempted = true;
        console.log(`   ➜ Attempting fallback: ${fallbackPath}`);
        playAudioInternal(fallbackPath, null);
      } else if (audioPath.includes('/TNS_Special/') && !audio.fallbackAttempted) {
        // Auto-fallback: TNS_Special file not found, try standard folder
        audio.fallbackAttempted = true;
        const match = audioPath.match(/([^/\\]+\.mp3)$/);
        
        if (match) {
          const filename = match[1]; // e.g., "TNS_Central.mp3" or "Walloon MTG.mp3" or "Walloon.mp3"
          
          if (filename.includes('TNS_')) {
            // TNS file fallback
            const tnsPath = `QR_PIDS_AudioFiles/TNS/${filename}`;
            console.log(`   ➜ TNS_Special not found, falling back to TNS: ${tnsPath}`);
            playAudioInternal(tnsPath, null);
          } else if (filename.toLowerCase().includes(' mtg')) {
            // MTG file fallback
            const mtgPath = `QR_PIDS_AudioFiles/mind the gap/${filename}`;
            console.log(`   ➜ TNS_Special MTG not found, falling back to MTG: ${mtgPath}`);
            playAudioInternal(mtgPath, null);
          } else {
            // NAA file fallback (just station name)
            const naaPath = `QR_PIDS_AudioFiles/now arriving at/NAA ${filename}`;
            console.log(`   ➜ TNS_Special NAA not found, falling back to NAA: ${naaPath}`);
            playAudioInternal(naaPath, null);
          }
        }
      } else {
        // File not found - provide suggestions
        console.warn(`\n   📁 === FILE NOT FOUND HELP ===`);
        console.warn(`   Requested file: ${audioPath}`);
        console.warn(`   Expected location: QR_PIDS_AudioFiles/`);
        
        // Provide helpful suggestions based on the type of file
        if (audioPath.includes('/TNS/')) {
          console.warn(`\n   💡 This looks like a TNS (Next Station) file.`);
          console.warn(`   📂 Check if the file exists at:`);
          console.warn(`      • QR_PIDS_AudioFiles/TNS_Special/{FormCode}/{DestinationStation} station/TNS_{StationName}.mp3`);
          console.warn(`      • QR_PIDS_AudioFiles/TNS/TNS_{StationName}.mp3 (auto-fallback)`);
          console.warn(`\n   ℹ️  If TNS_Special file not found, system automatically tries standard TNS folder.`);
          console.warn(`   To fix: Add the file to either TNS_Special or TNS folder.`);
          console.warn(`   Example: TNS_Special/FGBR/Boggo Road station/TNS_Central.mp3`);
          console.warn(`   Example: TNS/TNS_Central.mp3`);
        } else if (audioPath.includes('/Form/')) {
          console.warn(`\n   💡 This looks like a Form announcement file.`);
          console.warn(`   📂 Check if the file exists at:`);
          console.warn(`      • QR_PIDS_AudioFiles/Form/{FormCode}/{CurrentStation}/{DestinationStation} station.mp3`);
          console.warn(`\n   To fix: Ensure Form files use the route DESTINATION (last station).`);
          console.warn(`   Example: Form/FGBR/Roma Street/Boggo Road station.mp3`);
        } else if (audioPath.includes('/mind the gap/')) {
          console.warn(`\n   💡 This looks like a Mind The Gap (MTG) file.`);
          console.warn(`   📂 Check if the file exists at:`);
          console.warn(`      • QR_PIDS_AudioFiles/mind the gap/{StationName} MTG.mp3`);
        }
        console.warn(`   ===========================\n`);
      }
      
      // Check if file exists (Electron only)
      if (typeof require !== 'undefined') {
        try {
          const fs = require('fs');
          const path = require('path');
          const absolutePath = path.resolve(audioPath);
          if (fs.existsSync(absolutePath)) {
            console.log('   ✓ File exists:', absolutePath);
          } else {
            console.error('   ✗ File does not exist:', absolutePath);
          }
        } catch (e) {
          // Not in Electron
        }
      }
    });
    
    console.log('   Attempting to play:', audio.src);
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('   ✓ Audio play succeeded');
          updateStopButtonColor();
        })
        .catch(error => {
          // Try fallback if available and not already tried
          if (fallbackPath && !audio.fallbackAttempted) {
            audio.fallbackAttempted = true;
            console.log(`   ➜ Play failed, attempting fallback: ${fallbackPath}`);
            playAudioInternal(fallbackPath, null);
          } else {
            console.error('   ✗ Audio play promise failed:', error);
            if (error && (error.name === 'NotAllowedError' || String(error.message || '').toLowerCase().includes('user'))) {
              showQvasAudioUnlockButton();
              console.warn('   iPhone/Safari blocked audio. Tap the screen once, then try the announcement again.');
            }
            // Show user-friendly error
            console.error(`   Audio playback failed: ${error.message}`);
          }
        });
    }
    
  } catch (error) {
    console.error('   ✗ Audio creation failed:', error);
    console.error(`   Audio creation failed: ${error.message}`);
  }
}
// ============================================================================
// ANNOUNCEMENT SYSTEM - Advanced Route-Specific Announcement Scanning
// ============================================================================

// Current route form code (e.g., FGBR for Ferny Grove - Boggo Road)
let currentRouteFormCode = null;
let currentRouteLongName = null; // Full route name (e.g., "Ferny Grove to Boggo Road")
let currentDestinationStation = null; // Last station on the route (e.g., "Boggo Road")
let currentStation = null; // Current/previous station (for Form message generation)
let currentStations = []; // Current list of stations for the route
let routeAnnouncementCache = {}; // Cache of available announcements per route
let audioFileCache = {}; // Cache of pre-loaded audio files (filepath -> object URL or blob)
let announcementScanInterval = null; // Interval for periodic scanning
let pendingAnnouncementPath = null; // Announcement to play when doors unlock

// Route to form code mapping (maps run code to route short code)
const routeFormCodeMap = {
  '1S24': 'FGBR',  // Ferny Grove - Boggo Road
  '1S28': 'FGBGPR', // Ferny Grove - Boggo Road - Park Road
  '1E35': 'BRFG',   // Brisbane - Ferny Grove
  '1E37': 'BRFG',   // Brisbane - Ferny Grove  
  'D840': 'RWBR',   // Rosewood - Bowen Hills/Brisbane
  // Add more mappings as needed
};

// Function to get form code for a route
function getFormCodeForRoute(runCode) {
  return routeFormCodeMap[runCode] || null;
}

// Function to extract form code from GTFS routeId (e.g., "FGBR-4483" -> "FGBR")
function extractFormCodeFromGTFS(routeId) {
  if (!routeId) return null;
  const parts = routeId.split('-');
  return parts[0] || null;
}

// Function to build route long name from first and last station
function buildRouteLongName(stations) {
  if (stations && stations.length >= 2) {
    const first = stations[0].name;
    const last = stations[stations.length - 1].name;
    return `${first} to ${last}`;
  }
  return null;
}

// Function to load all route-specific announcements (MTG, NAA, TNS)
async function loadRouteAnnouncements(formCode, longName) {
  if (!formCode || !longName) {
    console.log('! No form code or long name for route-specific announcements');
    return {};
  }
  
  const cacheKey = `${formCode}/${longName}`;
  console.log(`\n📂 === SCANNING ROUTE ANNOUNCEMENTS ===`);
  console.log(`   Form Code: ${formCode}`);
  console.log(`   Route Name: ${longName}`);
  console.log(`   Looking in: TNS_Special/${formCode}/${longName}/`);
  
  try {
    // Extract destination name from "Ferny Grove - Brisbane City" -> "Ferny Grove"
    const destinationName = longName.includes(' - ') ? longName.split(' - ')[0].trim() : longName;
    const apiUrl = null; // Disabled in iPhone/PWA mode - route announcements load from local files
    console.log(`   API URL: ${apiUrl}`);
    console.log(`   Fetching...`);
    if (!apiUrl) return [];
    const response = await fetch(apiUrl);
    console.log(`   ✓ Response received`);
    
    if (response.ok) {
      const data = await response.json();
      routeAnnouncementCache[cacheKey] = data.announcements || {};
      const announcements = routeAnnouncementCache[cacheKey];
      const fileCount = Object.keys(announcements).length;
      
      console.log(`✓ Successfully scanned route folder`);
      console.log(`   Total files found: ${fileCount}`);
      
      if (fileCount > 0) {
        // Group by type for display
        const mtgFiles = Object.keys(announcements).filter(k => k.startsWith('MTG_'));
        const naaFiles = Object.keys(announcements).filter(k => k.startsWith('NAA_'));
        const tnsFiles = Object.keys(announcements).filter(k => k.startsWith('TNS_'));
        
        console.log(`   ├─ MTG (Mind the Gap): ${mtgFiles.length}`);
        mtgFiles.forEach(f => console.log(`   │  • ${f}`));
        console.log(`   ├─ NAA (Now Arriving): ${naaFiles.length}`);
        naaFiles.forEach(f => console.log(`   │  • ${f}`));
        console.log(`   └─ TNS (Next Station): ${tnsFiles.length}`);
        tnsFiles.forEach(f => console.log(`      • ${f}`));
      }
      
      return announcements;
    } else {
      console.log(`✗ Route folder not found (HTTP ${response.status})`);
      
      // Try to get error details from response
      try {
        const errorData = await response.json();
        if (errorData.debug) {
          console.log(`   Debug - Path checked: ${errorData.debug.searched_path}`);
          console.log(`   Debug - Path exists: ${errorData.debug.path_exists}`);
        }
      } catch (parseError) {
        // Ignore parse errors, just log what we know
      }
      
      console.log(`   This is normal if route-specific files haven't been created yet`);
      routeAnnouncementCache[cacheKey] = {};
      return {};
    }
  } catch (error) {
    console.error(`✗ Error scanning route announcements:`);
    console.error(`   ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    routeAnnouncementCache[cacheKey] = {};
    return {};
  }
}

// Function to set up periodic scanning (every 5 minutes)
async function startAnnouncementScanning(formCode, longName) {
  console.log(`\n🚀 === STARTING ANNOUNCEMENT SCANNING ===`);
  console.log(`   Form Code: ${formCode}`);
  console.log(`   Route Name: ${longName}`);
  console.log(`   Function: startAnnouncementScanning() called\n`);
  
  // Clear existing interval
  if (announcementScanInterval) {
    console.log(`   Clearing previous scan interval`);
    clearInterval(announcementScanInterval);
  }
  
  // Clear old cached audio files to free memory
  audioFileCache = {};
  console.log(`   Cleared audio cache`);
  
  // Scan immediately and preload files
  await loadRouteAnnouncements(formCode, longName);
  await preloadAnnouncementFiles();
  
  // Scan every 5 minutes (300000 ms) and refresh preload
  announcementScanInterval = setInterval(async () => {
    console.log(`🔄 Refreshing route announcements for ${formCode}/${longName}`);
    await loadRouteAnnouncements(formCode, longName);
    await preloadAnnouncementFiles();
  }, 300000); // 5 minutes
}

// Function to generate announcement audio paths with route-specific priority
function isFirstStation(station) {
  // Helper function to check if a station is the first station in the route
  try {
    if (!station || typeof currentStations === 'undefined' || !currentStations || currentStations.length === 0) {
      return false;
    }
    return station === currentStations[0];
  } catch (e) {
    // If currentStations is not accessible, assume it's not the first station
    return false;
  }
}

function getAnnouncementAudioPath(stationName, type) {
  // Uses global currentStation and currentRouteFormCode for Form messages
  // currentStation: the station we're at (for Form path generation)
  // currentRouteFormCode: the form code of the current route (for Form path)
  // currentDestinationStation: the destination of the current route (for Form filename)
  
  if (!stationName) return '';
  
  let normalizedName = stationName.trim();
  const cacheKey = `${currentRouteFormCode}/${currentRouteLongName}`;
  const routeAnnouncements = routeAnnouncementCache[cacheKey] || {};
  
  if (type === 'mindTheGap') {
    // Priority 1: Check for route-specific MTG in TNS_Special folder
    if (currentRouteFormCode && currentDestinationStation) {
      // MTG format: "{StationName} MTG" (no underscore, station name first then MTG)
      const mtgLabel = `${normalizedName} MTG`;
      
      // Destination folder format: "{DestinationStation} station"
      let destinationFolder = currentDestinationStation;
      if (!destinationFolder.toLowerCase().includes('station')) {
        destinationFolder = `${destinationFolder} station`;
      }
      
      const tnsSpecialPath = `QR_PIDS_AudioFiles/TNS_Special/${currentRouteFormCode}/${destinationFolder}/${mtgLabel}.mp3`;
      console.log(`   Checking TNS_Special for MTG: ${tnsSpecialPath}`);
      return tnsSpecialPath;
    }
    // Fallback: Check for route-specific MTG in routeAnnouncements
    if (routeAnnouncements[`MTG_${normalizedName}`]) {
      return routeAnnouncements[`MTG_${normalizedName}`];
    }
    // Otherwise use standard path
    return `QR_PIDS_AudioFiles/mind the gap/${normalizedName} MTG.mp3`;
    
  } else if (type === 'arrival' || type === 'nowArrivingAt') {
    // Priority 1: Check for route-specific NAA in TNS_Special folder
    if (currentRouteFormCode && currentDestinationStation) {
      // NAA format: "{StationName}" (no prefix, no suffix - just station name)
      const naaLabel = normalizedName;
      
      // Destination folder format: "{DestinationStation} station"
      let destinationFolder = currentDestinationStation;
      if (!destinationFolder.toLowerCase().includes('station')) {
        destinationFolder = `${destinationFolder} station`;
      }
      
      const tnsSpecialPath = `QR_PIDS_AudioFiles/TNS_Special/${currentRouteFormCode}/${destinationFolder}/${naaLabel}.mp3`;
      console.log(`   Checking TNS_Special for NAA: ${tnsSpecialPath}`);
      return tnsSpecialPath;
    }
    // Fallback: Check for route-specific NAA in routeAnnouncements
    if (routeAnnouncements[`NAA_${normalizedName}`]) {
      return routeAnnouncements[`NAA_${normalizedName}`];
    }
    // Otherwise use standard path
    return `QR_PIDS_AudioFiles/now arriving at/NAA ${normalizedName}.mp3`;
    
  } else if (type === 'form') {
    // Form path: directly generate without checking TNS_Special first
    // Format: QR_PIDS_AudioFiles/Form/{RouteShortName}/{CurrentStation}/{DestinationStation} station.mp3
    if (!currentStation || !currentRouteFormCode || !currentDestinationStation) {
      console.log(`   ⚠️  Form path missing globals: station="${currentStation}", form="${currentRouteFormCode}", dest="${currentDestinationStation}"`);
      // Fallback to TNS
      return `QR_PIDS_AudioFiles/TNS/TNS_${normalizedName}.mp3`;
    }
    
    let destinationLabel = currentDestinationStation;
    if (!destinationLabel.toLowerCase().includes('station')) {
      destinationLabel = `${destinationLabel} station`;
    }
    console.log(`   ✓ [FORM] Using Form announcement: current="${currentStation}", destination="${destinationLabel}"`);
    const formPath = `QR_PIDS_AudioFiles/Form/${currentRouteFormCode}/${currentStation}/${destinationLabel}.mp3`;
    return formPath;
    
  } else if (type === 'next' || type === 'nextStation') {
    // Priority 1: Check for route-specific TNS_Special (organized by FormCode and Destination Station)
    // Path: TNS_Special/{FormCode}/{DestinationStation} station/TNS_{StationName}.mp3
    if (currentRouteFormCode && currentDestinationStation) {
      // Next station label with "TNS_" prefix
      let nextStationLabel = normalizedName;
      if (!nextStationLabel.toLowerCase().startsWith('tns_')) {
        nextStationLabel = `TNS_${nextStationLabel}`;
      }
      
      // Destination folder format: "{DestinationStation} station"
      let destinationFolder = currentDestinationStation;
      if (!destinationFolder.toLowerCase().includes('station')) {
        destinationFolder = `${destinationFolder} station`;
      }
      
      const tnsSpecialPath = `QR_PIDS_AudioFiles/TNS_Special/${currentRouteFormCode}/${destinationFolder}/${nextStationLabel}.mp3`;
      console.log(`   Checking TNS_Special: ${tnsSpecialPath}`);
      console.log(`   [TNS_SPECIAL] Using path for all stations on route`);
      return tnsSpecialPath;
    }
    
    // Priority 2: Try Form path if we have current station and destination
    if (currentStation && currentRouteFormCode && currentDestinationStation) {
      // Form path uses the DESTINATION station (last station), not the next station
      // Format: QR_PIDS_AudioFiles/Form/{RouteShortName}/{CurrentStation}/{DestinationStation}.mp3
      let destinationLabel = currentDestinationStation;
      // Add "station" suffix if not already present
      if (!destinationLabel.toLowerCase().includes('station')) {
        destinationLabel = `${destinationLabel} station`;
      }
      console.log(`   ✓ [FORM] Using Form announcement: current="${currentStation}", destination="${destinationLabel}"`);
      const formPath = `QR_PIDS_AudioFiles/Form/${currentRouteFormCode}/${currentStation}/${destinationLabel}.mp3`;
      return formPath;
    }
    
    // Priority 3: Use standard TNS path (fallback)
    console.log(`   ◇ [TNS] Trying standard TNS path for: ${normalizedName}`);
    return `QR_PIDS_AudioFiles/TNS/TNS_${normalizedName}.mp3`;
  }
  
  return '';
}

// Function to preload all announcement audio files for current route (route-specific + fallbacks)
async function preloadAnnouncementFiles() {
  const cacheKey = `${currentRouteFormCode}/${currentRouteLongName}`;
  const routeAnnouncements = routeAnnouncementCache[cacheKey] || {};
  const filesToPreload = {};
  
  // Count files by type for summary
  let routeSpecificCount = { mtg: 0, naa: 0, tns: 0 };
  let formMtgCount = 0;
  let fallbackCount = { mtg: 0, naa: 0, tns: 0 };
  
  // 1. Add route-specific announcements (MTG, NAA, TNS from TNS_Special folder)
  for (const [key, path] of Object.entries(routeAnnouncements)) {
    filesToPreload[key] = path;
    if (key.startsWith('MTG_')) routeSpecificCount.mtg++;
    else if (key.startsWith('NAA_')) routeSpecificCount.naa++;
    else if (key.startsWith('TNS_')) routeSpecificCount.tns++;
  }
  
  // 2. Extract unique station names from route-specific announcements
  // This ensures we preload Form and Fallback files for all stations with route-specific files
  const stationNames = new Set();
  
  for (const key of Object.keys(routeAnnouncements)) {
    // Extract station name from keys like "MTG_Boggo Road", "NAA_Boggo Road", "TNS_Boggo Road"
    const match = key.match(/^(?:MTG|NAA|TNS)_(.+)$/);
    if (match) {
      stationNames.add(match[1].trim());
    }
  }
  
  // If no stations found in route announcements, try using currentStations as fallback
  let stationsToProcess = Array.from(stationNames);
  if (stationsToProcess.length === 0 && currentStations && currentStations.length > 0) {
    stationsToProcess = currentStations.map(s => s.name.trim());
  }
  
  // 3. Add Fallback announcements for all identified stations
  if (stationsToProcess.length > 0) {
    stationsToProcess.forEach(stationName => {
      // Fallback MTG (mind the gap)
      const mtgPath = `QR_PIDS_AudioFiles/mind the gap/${stationName} MTG.mp3`;
      if (!filesToPreload[`FALLBACK_MTG_${stationName}`]) {
        filesToPreload[`FALLBACK_MTG_${stationName}`] = mtgPath;
        fallbackCount.mtg++;
      }
      
      // Fallback NAA (now arriving at) - only if route-specific NAA not already added
      if (!routeAnnouncements[`NAA_${stationName}`]) {
        const naaPath = `QR_PIDS_AudioFiles/now arriving at/NAA ${stationName}.mp3`;
        if (!filesToPreload[`FALLBACK_NAA_${stationName}`]) {
          filesToPreload[`FALLBACK_NAA_${stationName}`] = naaPath;
          fallbackCount.naa++;
        }
      }
      
      // Fallback TNS (next station) - only if route-specific TNS not already added
      if (!routeAnnouncements[`TNS_${stationName}`]) {
        const tnsPath = `QR_PIDS_AudioFiles/TNS/${stationName} TNS.mp3`;
        if (!filesToPreload[`FALLBACK_TNS_${stationName}`]) {
          filesToPreload[`FALLBACK_TNS_${stationName}`] = tnsPath;
          fallbackCount.tns++;
        }
      }
    });
  }
  
  const totalFiles = Object.keys(filesToPreload).length;
  if (totalFiles === 0) {
    console.log('\n📥 === PRELOAD AUDIO FILES ===');
    console.log('! No announcements found to preload');
    console.log('   (This is normal if route folder doesn\'t exist yet)');
    return;
  }
  
  console.log(`\n📥 === PRELOAD AUDIO FILES ===`);
  console.log(`Route: ${currentRouteFormCode}/${currentRouteLongName}`);
  console.log(`Stations: ${currentStations ? currentStations.length : 0}`);
  console.log(`Total files to load: ${totalFiles}`);
  console.log(`\n📋 Breakdown:`);
  console.log(`  🔹 Route-Specific Announcements (TNS_Special folder):`);
  console.log(`     • MTG (Mind the Gap): ${routeSpecificCount.mtg}`);
  console.log(`     • NAA (Now Arriving): ${routeSpecificCount.naa}`);
  console.log(`     • TNS (Next Station):  ${routeSpecificCount.tns}`);
  console.log(`     Total route-specific: ${routeSpecificCount.mtg + routeSpecificCount.naa + routeSpecificCount.tns}`);
  console.log(`  🔹 Form Announcements (QR_PIDS_AudioFiles/Form):`);
  console.log(`     • MTG (Mind the Gap): ${formMtgCount}`);
  console.log(`  🔹 Fallback Announcements:`);
  console.log(`     • MTG (Mind the Gap): ${fallbackCount.mtg}`);
  console.log(`     • NAA (Now Arriving): ${fallbackCount.naa}`);
  console.log(`     • TNS (Next Station):  ${fallbackCount.tns}`);
  console.log(`     Total fallback: ${fallbackCount.mtg + fallbackCount.naa + fallbackCount.tns}`);
  
  let successCount = 0;
  let failCount = 0;
  let cachedCount = 0;
  let fileIndex = 1;
  
  for (const [announcementKey, audioPath] of Object.entries(filesToPreload)) {
    try {
      // Check if already cached
      if (audioFileCache[audioPath]) {
        cachedCount++;
        continue;  // Skip logging for cached files to reduce clutter
      }
      
      // Detect if running in Electron
      let isElectron = false;
      let fileUrl = audioPath;
      
      if (typeof window !== 'undefined' && typeof window.require !== 'undefined') {
        try {
          const path = window.require('path');
          const absolutePath = path.resolve(audioPath);
          fileUrl = `file://${absolutePath.replace(/\\/g, '/')}`;
          isElectron = true;
          // In Electron, just verify the file exists by creating an Audio object
          const testAudio = new Audio(fileUrl);
          audioFileCache[audioPath] = fileUrl;
          console.log(`   ✓ [Electron] Cached: ${announcementKey}`);
          successCount++;
          continue;
        } catch (e) {
          // Continue to browser mode
        }
      }
      
      // Browser mode: fetch and cache as blob URL
      if (!isElectron) {
        const normalizedPath = audioPath.replace(/\\/g, '/');
        const apiUrl = `/audio/${encodeURI(normalizedPath)}`;
        
        try {
          if (!apiUrl) return [];
    const response = await fetch(apiUrl);
          
          if (response.ok) {
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            audioFileCache[audioPath] = objectUrl;
            console.log(`   ✓ [Browser] Cached: ${announcementKey} (${blob.size} bytes)`);
            successCount++;
          } else {
            console.log(`   ✗ [Browser] Failed: ${announcementKey} (HTTP ${response.status})`);
            failCount++;
          }
        } catch (fetchError) {
          console.log(`   ✗ [Browser] Error: ${announcementKey} - ${fetchError.message}`);
          failCount++;
        }
      }
    } catch (error) {
      console.log(`   ✗ Exception: ${announcementKey} - ${error.message}`);
      failCount++;
    }
    fileIndex++;
  }
  
  console.log(`\n📥 === PRELOAD COMPLETE ===`);
  console.log(`✓ Successfully loaded: ${successCount}`);
  console.log(`! Already cached: ${cachedCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Total ready to play: ${successCount + cachedCount}/${totalFiles}`);
  console.log(`\n✅ All announcements preloaded and ready for playback:`);
  console.log(`   • ${routeSpecificCount.mtg + routeSpecificCount.naa + routeSpecificCount.tns} Route-specific (MTG/NAA/TNS)`);
  console.log(`   • ${formMtgCount} Form Mind the Gap`);
  console.log(`   • ${fallbackCount.mtg + fallbackCount.naa + fallbackCount.tns} Fallback (MTG/NAA/TNS)`);
  console.log(`Cache contains ${Object.keys(audioFileCache).length} entries\n`);
}

// Map of run codes to stopping patterns (station lists)
// Each run code maps to an array of station objects: { name }
const stoppingPatterns = {
  // T6X1 - BOWEN HILLS TO ROSEWOOD (6-car IMU, PM EXPRESS - Rosewood Line, Down Direction)
  "D840": [
    { name: "Bowen Hills", announcements: { arrival: { text: "Arriving at Bowen Hills", audio: "" }, mindTheGap: { text: "Bowen Hills... This is a Rosewood train, running express from Milton to Darra stopping only at Indooroopilly...", audio: "audio/RosewoodEXP/Bowen_Hills.MP3" } } },
{ name: "Fortitude Valley", announcements: { arrival: { text: "Arriving at Fortitude Valley", audio: "" }, next: { text: "This is a Rosewood train, running express from Milton to Darra stopping only at Indooroopilly... The next station is Fortitude Valley...", audio: "audio/RosewoodEXP/next_Fortitude_Valley.MP3" }, mindTheGap: { text: "Fortitude Valley", audio: "audio/RosewoodEXP/Fortitude_Valley.mp3"  } } },
{ name: "Central", announcements: { arrival: { text: "Arriving at Central", audio: "" }, next: { text: "This is a Rosewood train, running express from Milton to Darra stopping only at Indooroopilly... The next station is Central...  Customers for the Cleveland, Beenleigh, or Gold Coast lines, please change trains at Central...", audio: "audio/RosewoodEXP/next_Central.MP3" }, mindTheGap: { text: "Central... Customers for the Cleveland, Beenleigh, or Gold Coast lines, please change trains here...", audio: "audio/RosewoodEXP/Central.MP3" } } },
{ name: "Roma Street", announcements: { arrival: { text: "Arriving at Roma Street", audio: "" }, next: { text: "This is a Rosewood train, running express from Milton to Darra stopping only at Indooroopilly... The next station is Roma Street... Customers for long-distance services, please change trains at Roma Street...", audio: "audio/RosewoodEXP/next_Roma_Street.MP3" }, mindTheGap: { text: "Roma Street... Customers for long-distance services, please change trains here...", audio: "audio/RosewoodEXP/Roma_Street.MP3" } } },
{ name: "South Brisbane", announcements: { arrival: { text: "Arriving at Milton", audio: "" }, next: { text: "This is a Rosewood train, running express from Milton to Darra stopping only at Indooroopilly... The next station is Milton...", audio: "audio/RosewoodEXP/next_Milton.MP3" }, mindTheGap: { text: "Milton... This train now runs express to Darra, stopping only at Indooroopilly...", audio: "audio/RosewoodEXP/Milton.MP3"  } } },
{ name: "Indooroopilly", announcements: { arrival: { text: "Arriving at Indooroopilly", audio: "" }, next: { text: "This is a Rosewood train, running express to Darra, stopping only at Indooroopilly... The next station is Indooroopilly...", audio: "audio/RosewoodEXP/next_Indooroopilly.MP3" }, mindTheGap: { text: "Indooroopilly... This train now runs express to Darra...", audio: "audio/RosewoodEXP/Indooroopilly.MP3"  } } },
    { name: "Darra", announcements: { arrival: { text: "Arriving at Darra", audio: "" }, next: { text: "The next station is Darra... Customers for the Springfield line, please change trains at Darra...", audio: "audio/RosewoodEXP/next_Darra.MP3" }, mindTheGap: { text: "Darra...Customers for the Springfield line, please change trains here...", audio: "audio/RosewoodEXP/Darra.MP3" } } },
    { name: "Wacol", announcements: { arrival: { text: "Arriving at Wacol", audio: "" }, next: { text: "The next station is Wacol...", audio: "audio/RosewoodEXP/next_Wacol.MP3" }, mindTheGap: { text: "Wacol", audio: "audio/RosewoodEXP/Wacol.MP3" } } },
    { name: "Gailes", announcements: { arrival: { text: "Arriving at Gailes", audio: "" }, next: { text: "The next station is Gailes. ", audio: "audio/RosewoodEXP/next_Gailes.MP3" }, mindTheGap: { text: "Gailes ", audio: "audio/RosewoodEXP/Gailes.MP3" } } },
    { name: "Goodna", announcements: { arrival: { text: "Arriving at Goodna", audio: "" }, next: { text: "The next station is Goodna. ", audio: "audio/RosewoodEXP/next_Goodna.MP3" }, mindTheGap: { text: "Goodna ", audio: "audio/RosewoodEXP/Goodna.MP3" } } },
    { name: "Redbank", announcements: { arrival: { text: "Arriving at Redbank", audio: "" }, next: { text: "The next station is Redbank. ", audio: "audio/RosewoodEXP/next_Redbank.MP3" }, mindTheGap: { text: "Redbank ", audio: "audio/RosewoodEXP/Redbank.MP3" } } },
    { name: "Riverview", announcements: { arrival: { text: "Arriving at Riverview", audio: "" }, next: { text: "The next station is Riverview. ", audio: "audio/RosewoodEXP/next_Riverview.MP3" }, mindTheGap: { text: "Riverview ", audio: "audio/RosewoodEXP/Riverview.MP3" } } },
    { name: "Dinmore", announcements: { arrival: { text: "Arriving at Dinmore", audio: "" }, next: { text: "The next station is Dinmore. ", audio: "audio/RosewoodEXP/next_Dinmore.MP3" }, mindTheGap: { text: "Dinmore... ", audio: "audio/RosewoodEXP/Dinmore.MP3" } } },
    { name: "Ebbw Vale", announcements: { arrival: { text: "Arriving at Ebbw Vale", audio: "" }, next: { text: "The next station is Ebbw Vale. ", audio: "audio/RosewoodEXP/next_Ebbw_Vale.MP3" }, mindTheGap: { text: "Ebbw Vale ", audio: "audio/RosewoodEXP/Ebbw_Vale.MP3" } } },
    { name: "Bundamba", announcements: { arrival: { text: "Arriving at Bundamba", audio: "" }, next: { text: "The next station is Bundamba. ", audio: "audio/RosewoodEXP/next_Bundamba.MP3" }, mindTheGap: { text: "Bundamba ", audio: "audio/RosewoodEXP/Bundamba.MP3" } } },
    { name: "Booval", announcements: { arrival: { text: "Arriving at Booval", audio: "" }, next: { text: "The next station is Booval. ", audio: "audio/RosewoodEXP/next_Booval.MP3" }, mindTheGap: { text: "Booval. ", audio: "audio/RosewoodEXP/Booval.mp3" } } },
    { name: "East Ipswich", announcements: { arrival: { text: "Arriving at East Ipswich", audio: "" }, next: { text: "The next station is East Ipswich. ", audio: "audio/RosewoodEXP/next_East_Ipswich.MP3" }, mindTheGap: { text: "East Ipswich ", audio: "audio/RosewoodEXP/East_Ipswich.MP3" } } },
    { name: "Ipswich", announcements: { arrival: { text: "Arriving at Ipswich", audio: "" }, next: { text: "The next station is Ipswich. ", audio: "audio/RosewoodEXP/next_Ipswich.MP3" }, mindTheGap: { text: "Ipswich", audio: "audio/RosewoodEXP/Ipswich.MP3" } } },
    { name: "Thomas Street", announcements: { arrival: { text: "Arriving at Thomas Street", audio: "" }, next: { text: "The next station is Thomas Street. ", audio: "audio/RosewoodEXP/next_Thomas_Street.MP3" }, mindTheGap: { text: "Thomas Street... ", audio: "audio/RosewoodEXP/Thomas Street.MP3" } } },
    { name: "Wulkuraka", announcements: { arrival: { text: "Arriving at Wulkuraka", audio: "" }, next: { text: "The next station is Wulkuraka. ", audio: "audio/RosewoodEXP/next_Wulkuraka.MP3" }, mindTheGap: { text: "Wulkuraka", audio: "audio/RosewoodEXP/Wulkuraka.MP3" } } },
    { name: "Karrabin", announcements: { arrival: { text: "Arriving at Karrabin", audio: "" }, next: { text: "The next station is Karrabin. ", audio: "audio/RosewoodEXP/next_Karrabin.MP3" }, mindTheGap: { text: "Karrabi", audio: "audio/RosewoodEXP/Karrabin.MP3" } } },
    { name: "Walloon", announcements: { arrival: { text: "Arriving at Walloon", audio: "" }, next: { text: "The next station is Walloon. ", audio: "audio/RosewoodEXP/next_Walloon.MP3" }, mindTheGap: { text: "Walloon", audio: "audio/RosewoodEXP/Walloon.MP3" } } },
   { name: "Thagoona", announcements: { arrival: { text: "Arriving at Thagoona", audio: "" }, next: { text: "The next station is Thagoona. ", audio: "audio/RosewoodEXP/next_Thagoona.MP3" }, mindTheGap: { text: "Thagoona", audio: "audio/RosewoodEXP/Thagoona.MP3" } } },
  { name: "Rosewood", announcements: { arrival: { text: "Arriving at Rosewood, terminal station", audio: "" }, next: { text: "The next station is Rosewood... This train terminates at Rosewood... All customers please exit the train on arrival at Rosewood... Queensland Rail would like to remind customers to take all personal possesions when you leave the train, for security reasons, please do not leave personal possesions unattended...", audio: "audio/RosewoodEXP/next_Rosewood.MP3" }, mindTheGap: { text: "Rosewood station... This train terminates here... All customers please exit the train...", audio: "audio/RosewoodEXP/Rosewood.MP3" } } }
  ],

  // D6X1 - BOWEN HILLS TO ROSEWOOD (6-car SMU train, PM EXPRESS - Rosewood Line, Down Direction)
  "D6X2": [
     { name: "Bowen Hills", announcements: { mindTheGap: { text: "Bowen Hills... This is a Brisbane City and Rosewood train, running express from Milton to Darra stopping only at Indooroopilly...", audio: "audio/RosewoodEXP/Bowen_Hills.MP3" } } },
{ name: "Fortitude Valley", announcements: { next: { text: "This is a Brisbane City and Rosewood train, running express from Milton to Darra stopping only at Indooroopilly... The next station is Fortitude Valley...", audio: "audio/RosewoodEXP/next_Fortitude_Valley.MP3" }, mindTheGap: { text: "Fortitude Valley", audio: "audio/RosewoodEXP/Fortitude_Valley.mp3"  } } },
{ name: "Central", announcements: { next: { text: "This is a Rosewood train, running express from Milton to Darra stopping only at Indooroopilly... The next station is Central...  Customers for the Cleveland, Beenleigh, or Gold Coast lines, please change trains at Central...", audio: "audio/RosewoodEXP/next_Central.MP3" }, mindTheGap: { text: "Central... Customers for the Cleveland, Beenleigh, or Gold Coast lines, please change trains here...", audio: "audio/RosewoodEXP/Central.MP3" } } },
{ name: "Roma Street", announcements: { next: { text: "This is a Rosewood train, running express from Milton to Darra stopping only at Indooroopilly... The next station is Roma Street... Customers for long-distance services, please change trains at Roma Street...", audio: "audio/RosewoodEXP/next_Roma_Street.MP3" }, mindTheGap: { text: "Roma Street... Customers for long-distance services, please change trains here...", audio: "audio/RosewoodEXP/Roma_Street.MP3" } } },
{ name: "Milton", announcements: { next: { text: "This is a Rosewood train, running express from Milton to Darra stopping only at Indooroopilly... The next station is Milton...", audio: "audio/RosewoodEXP/next_Milton.MP3" }, mindTheGap: { text: "Milton... This train now runs express to Darra, stopping only at Indooroopilly...", audio: "audio/RosewoodEXP/Milton.MP3"  } } },
{ name: "Indooroopilly", announcements: { next: { text: "This is a Rosewood train, running express to Darra, stopping only at Indooroopilly... The next station is Indooroopilly...", audio: "audio/RosewoodEXP/next_Indooroopilly.MP3" }, mindTheGap: { text: "Indooroopilly... This train now runs express to Darra...", audio: "audio/RosewoodEXP/Indooroopilly.MP3"  } } },
    { name: "Darra", announcements: { next: { text: "The next station is Darra... Customers for the Springfield line, please change trains at Darra...", audio: "audio/RosewoodEXP/next_Darra.MP3" }, mindTheGap: { text: "Darra...Customers for the Springfield line, please change trains here...", audio: "audio/RosewoodEXP/Darra.MP3" } } },
    { name: "Wacol", announcements: { next: { text: "The next station is Wacol...", audio: "audio/RosewoodEXP/next_Wacol.MP3" }, mindTheGap: { text: "Wacol", audio: "audio/RosewoodEXP/Wacol.MP3" } } },
    { name: "Gailes", announcements: { next: { text: "The next station is Gailes. ", audio: "audio/RosewoodEXP/next_Gailes.MP3" }, mindTheGap: { text: "Gailes ", audio: "audio/RosewoodEXP/Gailes.MP3" } } },
    { name: "Goodna", announcements: { next: { text: "The next station is Goodna. ", audio: "audio/RosewoodEXP/next_Goodna.MP3" }, mindTheGap: { text: "Goodna ", audio: "audio/RosewoodEXP/Goodna.MP3" } } },
    { name: "Redbank", announcements: { next: { text: "The next station is Redbank. ", audio: "audio/RosewoodEXP/next_Redbank.MP3" }, mindTheGap: { text: "Redbank ", audio: "audio/RosewoodEXP/Redbank.MP3" } } },
    { name: "Riverview", announcements: { next: { text: "The next station is Riverview. ", audio: "audio/RosewoodEXP/next_Riverview.MP3" }, mindTheGap: { text: "Riverview ", audio: "audio/RosewoodEXP/Riverview.MP3" } } },
    { name: "Dinmore", announcements: { next: { text: "The next station is Dinmore. ", audio: "audio/RosewoodEXP/next_Dinmore.MP3" }, mindTheGap: { text: "Dinmore... ", audio: "audio/RosewoodEXP/Dinmore.MP3" } } },
    { name: "Ebbw Vale", announcements: { next: { text: "The next station is Ebbw Vale. ", audio: "audio/RosewoodEXP/next_Ebbw_Vale.MP3" }, mindTheGap: { text: "Ebbw Vale ", audio: "audio/RosewoodEXP/Ebbw_Vale.MP3" } } },
    { name: "Bundamba", announcements: { next: { text: "The next station is Bundamba. ", audio: "audio/RosewoodEXP/next_Bundamba.MP3" }, mindTheGap: { text: "Bundamba ", audio: "audio/RosewoodEXP/Bundamba.MP3" } } },
    { name: "Booval", announcements: { next: { text: "The next station is Booval. ", audio: "audio/RosewoodEXP/next_Booval.MP3" }, mindTheGap: { text: "Booval. ", audio: "audio/RosewoodEXP/Booval.mp3" } } },
    { name: "East Ipswich", announcements: { next: { text: "The next station is East Ipswich. ", audio: "audio/RosewoodEXP/next_East_Ipswich.MP3" }, mindTheGap: { text: "East Ipswich ", audio: "audio/RosewoodEXP/East_Ipswich.MP3" } } },
    { name: "Ipswich", announcements: { next: { text: "The next station is Ipswich. ", audio: "audio/RosewoodEXP/next_Ipswich.MP3" }, mindTheGap: { text: "Ipswich", audio: "audio/RosewoodEXP/Ipswich.MP3" } } },
    { name: "Thomas Street", announcements: { next: { text: "The next station is Thomas Street. ", audio: "audio/RosewoodEXP/next_Thomas_Street.MP3" }, mindTheGap: { text: "Thomas Street... ", audio: "audio/RosewoodEXP/Thomas Street.MP3" } } },
    { name: "Wulkuraka", announcements: { next: { text: "The next station is Wulkuraka. ", audio: "audio/RosewoodEXP/next_Wulkuraka.MP3" }, mindTheGap: { text: "Wulkuraka", audio: "audio/RosewoodEXP/Wulkuraka.MP3" } } },
    { name: "Karrabin", announcements: { next: { text: "The next station is Karrabin. ", audio: "audio/RosewoodEXP/next_Karrabin.MP3" }, mindTheGap: { text: "Karrabi", audio: "audio/RosewoodEXP/Karrabin.MP3" } } },
    { name: "Walloon", announcements: { next: { text: "The next station is Walloon. ", audio: "audio/RosewoodEXP/next_Walloon.MP3" }, mindTheGap: { text: "Walloon", audio: "audio/RosewoodEXP/Walloon.MP3" } } },
    { name: "Thagoona", announcements: { next: { text: "The next station is Thagoona. ", audio: "audio/RosewoodEXP/next_Thagoona.MP3" }, mindTheGap: { text: "Thagoona", audio: "audio/RosewoodEXP/Thagoona.MP3" } } },
    { name: "Rosewood", announcements: { next: { text: "The next station is Rosewood... This train terminates at Rosewood... All customers please exit the train on arrival at Rosewood... Queensland Rail would like to remind customers to take all personal possesions when you leave the train, for security reasons, please do not leave personal possesions unattended...", audio: "audio/RosewoodEXP/next_Rosewood.MP3" }, mindTheGap: { text: "Rosewood station... This train terminates here... All customers please exit the train...", audio: "audio/RosewoodEXP/Rosewood.MP3" } } }
  ],

  // D8X2 - BOWEN HILLS TO CLEVELAND (6-car NGR, PM EXPRESS - Cleveland Line, Down Direction)
  "1E35": [
    { name: "Park Road", announcements: { mindTheGap: { text: "Park Road... This is a Ferny Grove train, stopping all stations...", audio: "audio/BRFG/(Route Start) Park Road.mp3" } } },
{ name: "South Bank", announcements: { next: { text: "This is a Brisbane City and Ferny Grove train, stopping all stations... The next station is South Bank", audio: "audio/BRFG/TNS South Bank.MP3" }, mindTheGap: { text: "South Bank", audio: "audio/BRFG/South Bank.mp3"  } } },
{ name: "South Brisbane", announcements: { next: { text: "This is a Brisbane City and Ferny Grove train, stopping all stations... The next station is South Brisbane...", audio: "audio/BRFG/TNS South Brisbane.MP3" }, mindTheGap: { text: "South Brisbane", audio: "audio/BRFG/South Brisbane.MP3" } } },
{ name: "Roma Street", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Roma Street...  Customers for the Ipswich, or Springfield lines, please change trains at Roma Street...", audio: "audio/BRFG/TNS Roma Street.mp3" }, mindTheGap: { text: "Roma Street", audio: "audio/BRFG/Roma Street.mp3" } } },
{ name: "Central", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Central...Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains at Central...", audio: "audio/BRFG/TNS Central.MP3" }, mindTheGap: { text: "Central... Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains here...", audio: "audio/BRFG/Central.MP3"  } } },
{ name: "Fortitude Valley", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Fortitude Valley...", audio: "audio/BRFG/TNS Fortitude Valley.mp3" }, mindTheGap: { text: "Fortitude Valley", audio: "audio/BRFG/Fortitude Valley.MP3"  } } },
    { name: "Bowen Hills", announcements: { next: { text: "The next station is Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains at Bowen Hills...", audio: "audio/BRFG/TNS Bowen Hills.MP3" }, mindTheGap: { text: "Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains here...", audio: "audio/BRFG/Bowen Hills.MP3" } } },
    { name: "Windsor", announcements: { next: { text: "The next station is Windsor...", audio: "audio/BRFG/TNS Windsor.MP3" }, mindTheGap: { text: "Windsor", audio: "audio/BRFG/Windsor.MP3" } } },
    { name: "Wilston", announcements: { next: { text: "The next station is Wilston. ", audio: "audio/BRFG/TNS Wilston.mp3" }, mindTheGap: { text: "Wilston", audio: "audio/BRFG/Wilston.MP3" } } },
    { name: "Newmarket", announcements: { next: { text: "The next station is Newmarket. ", audio: "audio/BRFG/TNS Newmarket.mp3" }, mindTheGap: { text: "Newmarket", audio: "audio/BRFG/Newmarket.MP3" } } },
    { name: "Alderley", announcements: { next: { text: "The next station is Alderley...", audio: "audio/BRFG/TNS Aldereley.mp3" }, mindTheGap: { text: "Alderley", audio: "audio/BRFG/Aldereley.mp3" } } },
    { name: "Enoggera", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Enoggera...", audio: "audio/BRFG/TNS Enoggera.MP3" }, mindTheGap: { text: "Enoggera ", audio: "audio/BRFG/TNS Gaythorne.MP3" } } },
    { name: "Gaythorne", announcements: { next: { text: "The next station is Gaythrone...", audio: "audio/BRFG/TNS Gaythorne.mp3" }, mindTheGap: { text: "Gaythorne", audio: "audio/BRFG/Lota.MP3" } } },
    { name: "Mitchelton", announcements: { next: { text: "The next station is Mitchelton... Queensland Rail would like to remind customers to take all personal possessions when you leave the train, for security reasons, please do not leave personal possessions unattended...", audio: "audio/BRFG/TNS Mitchelton.MP3" }, mindTheGap: { text: "Mitchelton", audio: "audio/BRFG/Thorneside.MP3" } } },
    { name: "Oxford Park", announcements: { next: { text: "The next station is Oxford Park...", audio: "audio/BRFG/TNS Oxford Park.MP3" }, mindTheGap: { text: "Oxford Park", audio: "audio/BRFG/Oxford Park.MP3" } } },
    { name: "Grovely", announcements: { next: { text: "The next station is Grovely...", audio: "audio/BRFG/TNS Grovely.MP3" }, mindTheGap: { text: "Grovely", audio: "audio/BRFG/Grovely.MP3" } } },
    { name: "Keperra", announcements: { next: { text: "The next station is Keperra... ", audio: "audio/BRFG/TNS Keperra.MP3" }, mindTheGap: { text: "Keperra", audio: "audio/BRFG/Keperra.mp3" } } },
    { name: "Ferny Grove", announcements: { next: { text: "The next station is Ferny Grove... This train terminates at Ferny Grove... All customers please exit the train on arrival at Ferny Grove... Queensland Rail would like to remind customers to take all personal possessions when you leave the train, for security reasons, please do not leave personal possesions unattended...", audio: "audio/BRFG/next_Cleveland.MP3" }, mindTheGap: { text: "Ferny Grove...This train terminates here...All customers please exit the train... ", audio: "audio/BRFG/Ferny Grove.MP3" } } },
  ],
  "1E37": [
    { name: "Roma Street", announcements: {mindTheGap: { text: "Roma Street... This is a Ferny Grove train, stopping all stations...", audio: "audio/BRFG/Roma Street.mp3" } } },
{ name: "Central", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Central...Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains at Central...", audio: "audio/BRFG/TNS Central.MP3" }, mindTheGap: { text: "Central... Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains here...", audio: "audio/BRFG/Central.MP3"  } } },
{ name: "Fortitude Valley", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Fortitude Valley...", audio: "audio/BRFG/TNS Fortitude Valley.mp3" }, mindTheGap: { text: "Fortitude Valley", audio: "audio/BRFG/Fortitude Valley.MP3"  } } },
    { name: "Bowen Hills", announcements: { next: { text: "The next station is Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains at Bowen Hills...", audio: "audio/BRFG/TNS Bowen Hills.MP3" }, mindTheGap: { text: "Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains here...", audio: "audio/BRFG/Bowen Hills.MP3" } } },
    { name: "Windsor", announcements: { next: { text: "The next station is Windsor...", audio: "audio/BRFG/TNS Windsor.MP3" }, mindTheGap: { text: "Windsor", audio: "audio/BRFG/Windsor.MP3" } } },
    { name: "Wilston", announcements: { next: { text: "The next station is Wilston. ", audio: "audio/BRFG/TNS Wilston.mp3" }, mindTheGap: { text: "Wilston", audio: "audio/BRFG/Wilston.MP3" } } },
    { name: "Newmarket", announcements: { next: { text: "The next station is Newmarket. ", audio: "audio/BRFG/TNS Newmarket.mp3" }, mindTheGap: { text: "Newmarket", audio: "audio/BRFG/Newmarket.MP3" } } },
    { name: "Alderley", announcements: { next: { text: "The next station is Alderley...", audio: "audio/BRFG/TNS Aldereley.mp3" }, mindTheGap: { text: "Alderley", audio: "audio/BRFG/Aldereley.mp3" } } },
    { name: "Enoggera", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Enoggera...", audio: "audio/BRFG/TNS Enoggera.MP3" }, mindTheGap: { text: "Enoggera ", audio: "audio/BRFG/TNS Gaythorne.MP3" } } },
    { name: "Gaythorne", announcements: { next: { text: "The next station is Gaythrone...", audio: "audio/BRFG/TNS Gaythorne.mp3" }, mindTheGap: { text: "Gaythorne", audio: "audio/BRFG/Lota.MP3" } } },
    { name: "Mitchelton", announcements: { next: { text: "The next station is Mitchelton... Queensland Rail would like to remind customers to take all personal possessions when you leave the train, for security reasons, please do not leave personal possessions unattended...", audio: "audio/BRFG/TNS Mitchelton.MP3" }, mindTheGap: { text: "Mitchelton", audio: "audio/BRFG/Thorneside.MP3" } } },
    { name: "Oxford Park", announcements: { next: { text: "The next station is Oxford Park...", audio: "audio/BRFG/TNS Oxford Park.MP3" }, mindTheGap: { text: "Oxford Park", audio: "audio/BRFG/Oxford Park.MP3" } } },
    { name: "Grovely", announcements: { next: { text: "The next station is Grovely...", audio: "audio/BRFG/TNS Grovely.MP3" }, mindTheGap: { text: "Grovely", audio: "audio/BRFG/Grovely.MP3" } } },
    { name: "Keperra", announcements: { next: { text: "The next station is Keperra... ", audio: "audio/BRFG/TNS Keperra.MP3" }, mindTheGap: { text: "Keperra", audio: "audio/BRFG/Keperra.mp3" } } },
    { name: "Ferny Grove", announcements: { next: { text: "The next station is Ferny Grove... This train terminates at Ferny Grove... All customers please exit the train on arrival at Ferny Grove... Queensland Rail would like to remind customers to take all personal possessions when you leave the train, for security reasons, please do not leave personal possesions unattended...", audio: "audio/BRFG/TNS Ferny Grove.MP3" }, mindTheGap: { text: "Ferny Grove...This train terminates here...All customers please exit the train... ", audio: "audio/BRFG/Ferny Grove.MP3" } } },
  ],

  // 1S28 - Unnamed Route
  "1S28": [
    { name: "Ferny Grove", announcements: { mindTheGap: { text: "Ferny Grove... This is a Boggo Road train, stopping all stations...", audio: "audio/FYGBGPR/PKR-53A.mp3" } } },
    { name: "Keperra", announcements: { mindTheGap: { text: "Keperra", audio: "audio/FYGPKR/Keperra.mp3" }, next: { text: "This is a Boggo Road train, stopping all stations... The next station is Keperra...", audio: "audio/FYGBGPR/PKR-54A.mp3" } } },
    { name: "Grovely", announcements: { mindTheGap: { text: "Grovely", audio: "audio/FYGPKR/Grovely.mp3" }, next: { text: "The next station is Grovely", audio: "audio/FYGPKR/TNS Grovely.mp3" } } },
    { name: "Oxford Park", announcements: { mindTheGap: { text: "Oxford Park", audio: "audio/FYGPKR/Oxford Park.mp3" }, next: { text: "The next station is Oxford Park...", audio: "audio/FYGPKR/TNS Oxford Park.mp3" } } },
    { name: "Mitchelton", announcements: { mindTheGap: { text: "Mitchelton", audio: "audio/FYGPKR/Mitchelton.mp3" }, next: { text: "The next station is Mitchelton... Queensland Rail would like to remind customers to take all personal possessions when you leave the train... For security reasons, please do not leave personal possessions unattended...", audio: "audio/FYGPKR/TNS Mitchelton.mp3" } } },
    { name: "Gaythorne", announcements: { mindTheGap: { text: "Gaythorne", audio: "audio/FYGPKR/Gaythorne.mp3" }, next: { text: "The next station is Gaythorne...", audio: "audio/FYGPKR/TNS Gaythorne.mp3" } } },
    { name: "Enoggera", announcements: { mindTheGap: { text: "Enoggera", audio: "audio/FYGPKR/Enoggera.mp3" }, next: { text: "The next station is Enoggera...", audio: "audio/FYGPKR/TNS Enoggera.mp3" } } },
    { name: "Alderley", announcements: { mindTheGap: { text: "Alderley", audio: "audio/FYGPKR/Aldereley.mp3" }, next: { text: "The next station is Alderley...", audio: "audio/BRFG/TNS Aldereley.mp3" } } },
    { name: "Newmarket", announcements: { mindTheGap: { text: "Newmarket", audio: "audio/FYGPKR/Newmarket.mp3" }, next: { text: "This is a Boggo Road train, stopping all stations... The next station is Newmarket", audio: "audio/FYGBGPR/PKR-55A.mp3" } } },
    { name: "Wilston", announcements: { mindTheGap: { text: "Wilston", audio: "audio/FYGPKR/Wilston.mp3" }, next: { text: "The next station is Wilston...", audio: "audio/BRFG/TNS Wilston.mp3" } } },
    { name: "Windsor", announcements: { mindTheGap: { text: "Windsor", audio: "audio/FYGPKR/Windsor.mp3" }, next: { text: "The next station is Windsor...", audio: "audio/BRFG/TNS Windsor.mp3" } } },
    { name: "Bowen Hills", announcements: { mindTheGap: { text: "Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shorncliffe, Redclife Peninsula, Doomben, or Airport lines, please change trains here...", audio: "audio/FYGPKR/Bowen Hills.mp3" }, next: { text: "The next station is Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shorncliffe, Redclife Peninsula, Doomben, or Airport lines, please change trains at Bowen Hills...", audio: "audio/FYGPKR/TNS Bowen Hills.mp3" } } },
    { name: "Fortitude Valley", announcements: { mindTheGap: { text: "Fortitude Valley", audio: "audio/FYGPKR/Fortitude Valley.mp3" }, next: { text: "The next station is Fortitude Valley... Queensland Rail would like to remind customers to take all personal possessions when you leave the train... For security reasons, please do not leave personal possessions unattended...", audio: "audio/FYGBGPR/APQR-14-08d.mp3" } } },
    { name: "Central", announcements: { mindTheGap: { text: "Central", audio: "audio/FYGPKR/RSTQR-01-03.mp3" }, next: { text: "This is a Boggo Road train, stopping all stations... The next station is Central... Customers for the Ipswich, Springfield, Beenleigh, or Gold Coast lines, please change trains at Central...", audio: "audio/FYGBGPR/PKR-26A.mp3" } } },
    { name: "Roma Street", announcements: { mindTheGap: { text: "Roma Street", audio: "audio/BRFG/Roma Street.mp3" }, next: { text: "This is a Boggo Road train, stopping all stations... The next station is Roma Street... Customers for long-distance services, please change trains at Roma Street...", audio: "audio/FYGBGPR/PKR-27A.mp3" } } },
    { name: "South Brisbane", announcements: { mindTheGap: { text: "South Brisbane", audio: "audio/FYGPKR/South Brisbane.mp3" }, next: { text: "The next station is South Brisbane...", audio: "audio/FYGBGPR/TNS South Brisbane.mp3" } } },
    { name: "South Bank", announcements: { mindTheGap: { text: "South Bank", audio: "audio/FYGPKR/South Bank.mp3" }, next: { text: "This is a Boggo Road train, stopping all stations... The next station is South Bank...", audio: "audio/FYGBGPR/PKR-28A.mp3" } } },
    { name: "Boggo Road", announcements: { mindTheGap: { text: "Boggo Road...mind the gap... This train terminates here...All customers please exit the train...", audio: "audio/FYGBGPR/PKR-16A.mp3" }, next: { text: "The next station is Boggo Road... This train terminates at Boggo Road... All customers please exit the train on arrival at Boggo Road... Queensland Rail would like to remind customers to take all personal possessions when you leave the train... For security reasons, please do not leave personal possessions unattended...", audio: "audio/FYGBGPR/PKR-14A.mp3" } } }
  ],


  // 1S24 - Unnamed Route
  "1S24": [
    { name: "Ferny Grove", announcements: { mindTheGap: { text: "Ferny Grove... This is a Park Road train, stopping all stations...", audio: "audio/FYGPKR/Ferny Grove.mp3" } } },
    { name: "Keperra", announcements: { mindTheGap: { text: "Keperra", audio: "audio/FYGPKR/Keperra.mp3" }, next: { text: "This is a Park Road train, stopping all stations... The next station is Keperra...", audio: "audio/FYGPKR/TNS Keperra.mp3" } } },
    { name: "Grovely", announcements: { mindTheGap: { text: "Grovely", audio: "audio/FYGPKR/Grovely.mp3" }, next: { text: "The next station is Grovely", audio: "audio/FYGPKR/TNS Grovely.mp3" } } },
    { name: "Oxford Park", announcements: { mindTheGap: { text: "Oxford Park", audio: "audio/FYGPKR/Oxford Park.mp3" }, next: { text: "The next station is Oxford Park...", audio: "audio/FYGPKR/TNS Oxford Park.mp3" } } },
    { name: "Mitchelton", announcements: { mindTheGap: { text: "Mitchelton", audio: "audio/FYGPKR/Mitchelton.mp3" }, next: { text: "The next station is Mitchelton... Queensland Rail would like to remind customers to take all personal possessions when you leave the train... For security reasons, please do not leave personal possessions unattended...", audio: "audio/FYGPKR/TNS Mitchelton.mp3" } } },
    { name: "Gaythorne", announcements: { mindTheGap: { text: "Gaythorne", audio: "audio/FYGPKR/Gaythorne.mp3" }, next: { text: "The next station is Gaythorne...", audio: "audio/FYGPKR/TNS Gaythorne.mp3" } } },
    { name: "Enoggera", announcements: { mindTheGap: { text: "Enoggera", audio: "audio/FYGPKR/Enoggera.mp3" }, next: { text: "The next station is Enoggera...", audio: "audio/FYGPKR/TNS Enoggera.mp3" } } },
    { name: "Alderley", announcements: { mindTheGap: { text: "Alderley", audio: "audio/FYGPKR/Aldereley.mp3" }, next: { text: "This is a Park Road train, stopping all staitons... The next station is Alderley...", audio: "audio/FYGPKR/TNS Alderley.mp3" } } },
    { name: "Newmarket", announcements: { mindTheGap: { text: "Newmarket", audio: "audio/FYGPKR/Newmarket.mp3" }, next: { text: "This is a Park Road train, stopping all stations... The next station is Newmarket", audio: "audio/FYGPKR/TNS Newmarket.mp3" } } },
    { name: "Wilston", announcements: { mindTheGap: { text: "Wilston", audio: "audio/FYGPKR/Wilston.mp3" }, next: { text: "The next station is Wilston...", audio: "audio/BRFG/TNS Wilston.mp3" } } },
    { name: "Windsor", announcements: { mindTheGap: { text: "Windsor", audio: "audio/FYGPKR/Windsor.mp3" }, next: { text: "The next station is Windsor...", audio: "audio/BRFG/TNS Windsor.mp3" } } },
    { name: "Bowen Hills", announcements: { mindTheGap: { text: "Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shorncliffe, Redclife Peninsula, Doomben, or Airport lines, please change trains here...", audio: "audio/FYGPKR/Bowen Hills.mp3" }, next: { text: "The next station is Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shorncliffe, Redclife Peninsula, Doomben, or Airport lines, please change trains at Bowen Hills...", audio: "audio/FYGPKR/TNS Bowen Hills.mp3" } } },
    { name: "Fortitude Valley", announcements: { mindTheGap: { text: "Fortitude Valley", audio: "audio/FYGPKR/Fortitude Valley.mp3" }, next: { text: "This is a Park Road train, stopping all stations... The next station is Fortitude Valley... Please remember to take all personal belongings when you leave the train... Queensland Rail would like to remind customers to take care while disembarking...", audio: "audio/FYGPKR/TNS Fortitude Valley.mp3" } } },
    { name: "Central", announcements: { mindTheGap: { text: "Central", audio: "audio/FYGPKR/RSTQR-01-03.mp3" }, next: { text: "This is a Park Road train, stopping all stations... The next station is Central... Customers for the Ipswich, Springfield, Beenleigh, or Gold Coast lines, please change trains at Central... Queensland Rail would like to remind customers to take care while disembarking...", audio: "audio/FYGPKR/Park Road train - (All stations) - TNS Central - [TCWD].mp3" } } },
    { name: "Roma Street", announcements: { mindTheGap: { text: "Roma Street", audio: "audio/BRFG/Roma Street.mp3" }, next: { text: "This is a Park Road train, stopping all stations... The next station is Roma Street... Customers for long-distance services, please change trains at Roma Street...", audio: "audio/FYGPKR/TNS Roma Street.mp3" } } },
    { name: "South Brisbane", announcements: { mindTheGap: { text: "South Brisbane", audio: "audio/FYGPKR/South Brisbane.mp3" }, next: { text: "This is a Park Road train, stopping all stations... The next station is South Brisbane...", audio: "audio/FYGPKR/TNS South Brisbane.mp3" } } },
    { name: "South Bank", announcements: { mindTheGap: { text: "South Bank", audio: "audio/FYGPKR/South Bank.mp3" }, next: { text: "This is a Park Road train, stopping all stations... The next station is South Bank...", audio: "audio/FYGPKR/TNS South Bank.mp3" } } },
    { name: "Park Road", announcements: { mindTheGap: { text: "Park Road... This train terminates here...All customers please exit the train...", audio: "audio/FYGPKR/Park Road.mp3" }, next: { text: "The next station is Park Road... This train terminates at Park Road... All customers please exit the train on arrival at Park Road... Queensland Rail would like to remind customers to take all personal possessions when you leave the train... For security reasons, please do not leave personal possessions unattended...", audio: "audio/FYGPKR/TNS Park Road.mp3" } } }
  ],

 // 1S18 - Unnamed Route
  "1S18": [
    { name: "Ferny Grove", announcements: { mindTheGap: { text: "Ferny Grove... This is a Boggo Road / Park Road train, stopping all stations...", audio: "audio/FYGBGPR/PKR-53.mp3" } } },
    { name: "Keperra", announcements: { mindTheGap: { text: "Keperra", audio: "audio/FYGPKR/Keperra.mp3" }, next: { text: "This is a Boggo Road / Park Road train, stopping all stations... The next station is Keperra...", audio: "audio/FYGBGPR/PKR-54.mp3" } } },
    { name: "Grovely", announcements: { mindTheGap: { text: "Grovely", audio: "audio/FYGPKR/Grovely.mp3" }, next: { text: "The next station is Grovely", audio: "audio/FYGPKR/TNS Grovely.mp3" } } },
    { name: "Oxford Park", announcements: { mindTheGap: { text: "Oxford Park", audio: "audio/FYGPKR/Oxford Park.mp3" }, next: { text: "The next station is Oxford Park...", audio: "audio/FYGPKR/TNS Oxford Park.mp3" } } },
    { name: "Mitchelton", announcements: { mindTheGap: { text: "Mitchelton", audio: "audio/FYGPKR/Mitchelton.mp3" }, next: { text: "The next station is Mitchelton... Queensland Rail would like to remind customers to take all personal possessions when you leave the train... For security reasons, please do not leave personal possessions unattended...", audio: "audio/FYGPKR/TNS Mitchelton.mp3" } } },
    { name: "Gaythorne", announcements: { mindTheGap: { text: "Gaythorne", audio: "audio/FYGPKR/Gaythorne.mp3" }, next: { text: "The next station is Gaythorne...", audio: "audio/FYGPKR/TNS Gaythorne.mp3" } } },
    { name: "Enoggera", announcements: { mindTheGap: { text: "Enoggera", audio: "audio/FYGPKR/Enoggera.mp3" }, next: { text: "The next station is Enoggera...", audio: "audio/FYGPKR/TNS Enoggera.mp3" } } },
    { name: "Alderley", announcements: { mindTheGap: { text: "Alderley", audio: "audio/FYGPKR/Aldereley.mp3" }, next: { text: "The next station is Alderley...", audio: "audio/BRFG/TNS Aldereley.mp3" } } },
    { name: "Newmarket", announcements: { mindTheGap: { text: "Newmarket", audio: "audio/FYGPKR/Newmarket.mp3" }, next: { text: "This is a Boggo Road / Park Road train, stopping all stations... The next station is Newmarket", audio: "audio/FYGBGPR/PKR-55.mp3" } } },
    { name: "Wilston", announcements: { mindTheGap: { text: "Wilston", audio: "audio/FYGPKR/Wilston.mp3" }, next: { text: "The next station is Wilston...", audio: "audio/BRFG/TNS Wilston.mp3" } } },
    { name: "Windsor", announcements: { mindTheGap: { text: "Windsor", audio: "audio/FYGPKR/Windsor.mp3" }, next: { text: "The next station is Windsor...", audio: "audio/BRFG/TNS Windsor.mp3" } } },
    { name: "Bowen Hills", announcements: { mindTheGap: { text: "Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shorncliffe, Redclife Peninsula, Doomben, or Airport lines, please change trains here...", audio: "audio/FYGPKR/Bowen Hills.mp3" }, next: { text: "The next station is Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shorncliffe, Redclife Peninsula, Doomben, or Airport lines, please change trains at Bowen Hills...", audio: "audio/FYGPKR/TNS Bowen Hills.mp3" } } },
    { name: "Fortitude Valley", announcements: { mindTheGap: { text: "Fortitude Valley", audio: "audio/FYGPKR/Fortitude Valley.mp3" }, next: { text: "The next station is Fortitude Valley...Queensland Rail would like to remind customers to take all personal possessions when you leave the train... For security reasons please do not leave personal possessions unattended...", audio: "audio/FYGBGPR/APQR-14-08d.mp3" } } },
    { name: "Central", announcements: { mindTheGap: { text: "Central", audio: "audio/FYGPKR/RSTQR-01-03.mp3" }, next: { text: "This is a Boggo Road / Park Road train, stopping all stations... The next station is Central... Customers for the Ipswich, Springfield, Beenleigh, or Gold Coast lines, please change trains at Central...", audio: "audio/FYGBGPR/PKR-26.mp3" } } },
    { name: "Roma Street", announcements: { mindTheGap: { text: "Roma Street", audio: "audio/BRFG/Roma Street.mp3" }, next: { text: "This is a Boggo Road / Park Road train, stopping all stations... The next station is Roma Street... Customers for long-distance services, please change trains at Roma Street...", audio: "audio/FYGBGPR/PKR-27.mp3" } } },
    { name: "South Brisbane", announcements: { mindTheGap: { text: "South Brisbane", audio: "audio/FYGPKR/South Brisbane.mp3" }, next: { text: "The next station is South Brisbane...", audio: "audio/FYGBGPR/TNS South Brisbane.mp3" } } },
    { name: "South Bank", announcements: { mindTheGap: { text: "South Bank", audio: "audio/FYGPKR/South Bank.mp3" }, next: { text: "This is a Boggo Road / Park Road train, stopping all stations... The next station is South Bank...", audio: "audio/FYGBGPR/PKR-28.mp3" } } },
    { name: "Boggo Road / Park Road", announcements: { mindTheGap: { text: "Boggo Road / Park Road...mind the gap... This train terminates here...All customers please exit the train...", audio: "audio/FYGBGPR/PKR-16.mp3" }, next: { text: "The next station is Boggo Road / Park Road... This train terminates at Boggo Road / Park Road... All customers please exit the train on arrival at Park Road... Queensland Rail would like to remind customers to take all personal possessions when you leave the train... For security reasons, please do not leave personal possessions unattended...", audio: "audio/FYGBGPR/PKR-14.mp3" } } }
  ],

// 1EE5 - Unnamed Route
  "1EE5": [
    { name: "Boggo Road", announcements: { mindTheGap: { text: "Boggo Road... This is a Ferny Grove train, stopping all stations...", audio: "audio/FYGBGPR/PKR-08A.mp3" } } },
{ name: "South Bank", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is South Bank", audio: "audio/BRFG/TNS South Bank.MP3" }, mindTheGap: { text: "South Bank", audio: "audio/BRFG/South Bank.mp3"  } } },
{ name: "South Brisbane", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is South Brisbane...", audio: "audio/BRFG/TNS South Brisbane.MP3" }, mindTheGap: { text: "South Brisbane", audio: "audio/FYGPKR/South Brisbane.mp3" } } },
{ name: "Roma Street", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Roma Street...  Customers for the Ipswich, or Springfield lines, please change trains at Roma Street...", audio: "audio/BRFG/TNS Roma Street.mp3" }, mindTheGap: { text: "Roma Street", audio: "audio/BRFG/Roma Street.mp3" } } },
{ name: "Central", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Central...Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains at Central...", audio: "audio/BRFG/TNS Central.MP3" }, mindTheGap: { text: "Central... Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains here...", audio: "audio/BRFG/Central.MP3"  } } },
{ name: "Fortitude Valley", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Fortitude Valley...", audio: "audio/BRFG/TNS Fortitude Valley.mp3" }, mindTheGap: { text: "Fortitude Valley", audio: "audio/BRFG/Fortitude Valley.MP3"  } } },
    { name: "Bowen Hills", announcements: { next: { text: "The next station is Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains at Bowen Hills...", audio: "audio/BRFG/TNS Bowen Hills.MP3" }, mindTheGap: { text: "Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains here...", audio: "audio/BRFG/Bowen Hills.MP3" } } },
    { name: "Windsor", announcements: { next: { text: "The next station is Windsor...", audio: "audio/BRFG/TNS Windsor.MP3" }, mindTheGap: { text: "Windsor", audio: "audio/BRFG/Windsor.MP3" } } },
    { name: "Wilston", announcements: { next: { text: "The next station is Wilston. ", audio: "audio/BRFG/TNS Wilston.mp3" }, mindTheGap: { text: "Wilston", audio: "audio/BRFG/Wilston.MP3" } } },
    { name: "Newmarket", announcements: { next: { text: "The next station is Newmarket. ", audio: "audio/BRFG/TNS Newmarket.mp3" }, mindTheGap: { text: "Newmarket", audio: "audio/BRFG/Newmarket.MP3" } } },
    { name: "Alderley", announcements: { next: { text: "The next station is Alderley...", audio: "audio/BRFG/TNS Aldereley.mp3" }, mindTheGap: { text: "Alderley", audio: "audio/BRFG/Aldereley.mp3" } } },
    { name: "Enoggera", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Enoggera...", audio: "audio/BRFG/TNS Enoggera.MP3" }, mindTheGap: { text: "Enoggera ", audio: "audio/BRFG/Enoggera.MP3" } } },
    { name: "Gaythorne", announcements: { next: { text: "The next station is Gaythrone...", audio: "audio/BRFG/TNS Gaythorne.mp3" }, mindTheGap: { text: "Gaythorne", audio: "audio/BRFG/Gaythorne.MP3" } } },
    { name: "Mitchelton", announcements: { next: { text: "The next station is Mitchelton... Queensland Rail would like to remind customers to take all personal possessions when you leave the train, for security reasons, please do not leave personal possessions unattended...", audio: "audio/BRFG/TNS Mitchelton.MP3" }, mindTheGap: { text: "Mitchelton", audio: "audio/BRFG/Mitchelton.MP3" } } },
    { name: "Oxford Park", announcements: { next: { text: "The next station is Oxford Park...", audio: "audio/BRFG/TNS Oxford Park.MP3" }, mindTheGap: { text: "Oxford Park", audio: "audio/BRFG/Oxford Park.MP3" } } },
    { name: "Grovely", announcements: { next: { text: "The next station is Grovely...", audio: "audio/BRFG/TNS Grovely.MP3" }, mindTheGap: { text: "Grovely", audio: "audio/BRFG/Grovely.MP3" } } },
    { name: "Keperra", announcements: { next: { text: "The next station is Keperra... ", audio: "audio/BRFG/TNS Keperra.MP3" }, mindTheGap: { text: "Keperra", audio: "audio/BRFG/Keperra.mp3" } } },
    { name: "Ferny Grove", announcements: { next: { text: "The next station is Ferny Grove... This train terminates at Ferny Grove... All customers please exit the train on arrival at Ferny Grove... Queensland Rail would like to remind customers to take all personal possessions when you leave the train, for security reasons, please do not leave personal possesions unattended...", audio: "audio/BRFG/TNS Ferny Grove.MP3" }, mindTheGap: { text: "Ferny Grove...This train terminates here...All customers please exit the train... ", audio: "audio/BRFG/Ferny Grove.MP3" } } },
  ],
 
 "1EE7": [
    { name: "Boggo Road / Park Road", announcements: { mindTheGap: { text: "Boggo Road / Park Road... This a Brisbane City and Ferny Grove train, stopping all stations...", audio: "audio/FYGBGPR/PKR-08.mp3" } } },
{ name: "South Bank", announcements: { next: { text: "This is a Brisbane City and Ferny Grove train, stopping all stations... The next station is South Bank", audio: "audio/BRFG/TNS South Bank.MP3" }, mindTheGap: { text: "South Bank", audio: "audio/BRFG/South Bank.mp3"  } } },
{ name: "South Brisbane", announcements: { next: { text: "This is a Brisbane City and Ferny Grove train, stopping all stations... The next station is South Brisbane...", audio: "audio/BRFG/TNS South Brisbane.MP3" }, mindTheGap: { text: "South Brisbane", audio: "audio/BRFG/South Brisbane.MP3" } } },
{ name: "Roma Street", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Roma Street...  Customers for the Ipswich, or Springfield lines, please change trains at Roma Street...", audio: "audio/BRFG/TNS Roma Street.mp3" }, mindTheGap: { text: "Roma Street", audio: "audio/BRFG/Roma Street.mp3" } } },
{ name: "Central", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Central...Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains at Central...", audio: "audio/BRFG/TNS Central.MP3" }, mindTheGap: { text: "Central... Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains here...", audio: "audio/BRFG/Central.MP3"  } } },
{ name: "Fortitude Valley", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Fortitude Valley...", audio: "audio/BRFG/TNS Fortitude Valley.mp3" }, mindTheGap: { text: "Fortitude Valley", audio: "audio/BRFG/Fortitude Valley.MP3"  } } },
    { name: "Bowen Hills", announcements: { next: { text: "The next station is Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains at Bowen Hills...", audio: "audio/BRFG/TNS Bowen Hills.MP3" }, mindTheGap: { text: "Bowen Hills... Customers for the Sunshine Coast, Caboolture, Shornecliffe, Redcliffe Peninsula, Doomben, or Airport lines, please change trains here...", audio: "audio/BRFG/Bowen Hills.MP3" } } },
    { name: "Windsor", announcements: { next: { text: "The next station is Windsor...", audio: "audio/BRFG/TNS Windsor.MP3" }, mindTheGap: { text: "Windsor", audio: "audio/BRFG/Windsor.MP3" } } },
    { name: "Wilston", announcements: { next: { text: "The next station is Wilston. ", audio: "audio/BRFG/TNS Wilston.mp3" }, mindTheGap: { text: "Wilston", audio: "audio/BRFG/Wilston.MP3" } } },
    { name: "Newmarket", announcements: { next: { text: "The next station is Newmarket. ", audio: "audio/BRFG/TNS Newmarket.mp3" }, mindTheGap: { text: "Newmarket", audio: "audio/BRFG/Newmarket.MP3" } } },
    { name: "Alderley", announcements: { next: { text: "The next station is Alderley...", audio: "audio/BRFG/TNS Aldereley.mp3" }, mindTheGap: { text: "Alderley", audio: "audio/BRFG/Aldereley.mp3" } } },
    { name: "Enoggera", announcements: { next: { text: "This is a Ferny Grove train, stopping all stations... The next station is Enoggera...", audio: "audio/BRFG/TNS Enoggera.MP3" }, mindTheGap: { text: "Enoggera ", audio: "audio/BRFG/TNS Gaythorne.MP3" } } },
    { name: "Gaythorne", announcements: { next: { text: "The next station is Gaythrone...", audio: "audio/BRFG/TNS Gaythorne.mp3" }, mindTheGap: { text: "Gaythorne", audio: "audio/BRFG/Lota.MP3" } } },
    { name: "Mitchelton", announcements: { next: { text: "The next station is Mitchelton... Queensland Rail would like to remind customers to take all personal possessions when you leave the train, for security reasons, please do not leave personal possessions unattended...", audio: "audio/BRFG/TNS Mitchelton.MP3" }, mindTheGap: { text: "Mitchelton", audio: "audio/BRFG/Thorneside.MP3" } } },
    { name: "Oxford Park", announcements: { next: { text: "The next station is Oxford Park...", audio: "audio/BRFG/TNS Oxford Park.MP3" }, mindTheGap: { text: "Oxford Park", audio: "audio/BRFG/Oxford Park.MP3" } } },
    { name: "Grovely", announcements: { next: { text: "The next station is Grovely...", audio: "audio/BRFG/TNS Grovely.MP3" }, mindTheGap: { text: "Grovely", audio: "audio/BRFG/Grovely.MP3" } } },
    { name: "Keperra", announcements: { next: { text: "The next station is Keperra... ", audio: "audio/BRFG/TNS Keperra.MP3" }, mindTheGap: { text: "Keperra", audio: "audio/BRFG/Keperra.mp3" } } },
    { name: "Ferny Grove", announcements: { next: { text: "The next station is Ferny Grove... This train terminates at Ferny Grove... All customers please exit the train on arrival at Ferny Grove... Queensland Rail would like to remind customers to take all personal possessions when you leave the train, for security reasons, please do not leave personal possesions unattended...", audio: "audio/BRFG/TNS Ferny Grove.MP3" }, mindTheGap: { text: "Ferny Grove...This train terminates here...All customers please exit the train... ", audio: "audio/BRFG/Ferny Grove.MP3" } } },
  ],

};

// Default fallback stations (if run code not found)
const defaultStations = [
  "Roma Street",
  "Central",
  "Fortitude Valley",
  "Bowen Hills",
  "Windsor",
  "Wilston",
  "Newmarket",
  "Alderley",
  "Enoggera",
  "Gaythorne",
  "Mitchelton",
  "Oxford Park"
];

function validateRunNumber(run) {
  // Must be 4 characters: 1st is [0-9A-Z], 2nd is [0-9A-Z], 3rd is [0-9A-Z], 4th is [0-9]
  const upperRun = run.toUpperCase();
  const pattern = /^[0-9A-Z]{3}[0-9]$/;
  const isValid = pattern.test(upperRun);
  
  console.log(`Validating run: "${run}" -> "${upperRun}"`);
  console.log(`Pattern test result:`, isValid);
  console.log(`Length: ${upperRun.length}, Expected: 4`);
  
  // Also allow our specific test patterns
  const knownPatterns = ['T6X1', 'D6X1', '16X1', 'J6X1', 'U6X1'];
  const isKnownPattern = knownPatterns.includes(upperRun);
  
  console.log(`Is known pattern:`, isKnownPattern);
  
  return isValid || isKnownPattern;
}

// ==================== GTFS Patterns Loading System ====================
// Load extracted GTFS patterns from JSON file for instant route availability
let gtfsPatterns = null;
const loadGTFSPatterns = async () => {
  try {
    console.log('🔄 Starting GTFS data load from prepared JSON patterns...');

    // iPhone/GitHub Pages cannot use the huge SEQ_GTFS/stop_times.txt file.
    // Load the smaller prepared JSON first instead.
    const jsonCandidates = [
      '2gtfs-patterns.json',
      'gtfs-patterns.json',
      'src/2gtfs-patterns.json',
      'src/gtfs-patterns.json'
    ];

    for (const candidate of jsonCandidates) {
      try {
        const url = qvasAssetUrl(candidate);
        console.log(`📄 Trying GTFS JSON: ${url}`);
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          console.log(`   ⚠️ ${url} failed with ${response.status}`);
          continue;
        }

        const gtfsData = await response.json();
        if (gtfsData && gtfsData.routes && gtfsData.tripIdMap) {
          gtfsData.loadTime = new Date().toLocaleTimeString();
          gtfsData.totalRoutes = gtfsData.totalRoutes || Object.keys(gtfsData.routes).length;
          console.log(`✅ Loaded GTFS JSON from ${url}`);
          console.log(`✅ Loaded ${gtfsData.totalRoutes} routes and ${Object.keys(gtfsData.tripIdMap).length} trip mappings`);
          return gtfsData;
        }
      } catch (jsonErr) {
        console.log(`   ⚠️ Could not load ${candidate}:`, jsonErr.message);
      }
    }

    console.log('⚠️ Prepared GTFS JSON not found, trying SEQ_GTFS CSV fallback...');
    const gtfsData = await loadSEQGTFSFromFiles();

    if (!gtfsData) {
      console.log('❌ Failed to load GTFS - using hardcoded patterns only');
      return null;
    }

    console.log(`✅ Successfully loaded GTFS data from SEQ_GTFS files`);
    console.log(`✅ Loaded ${gtfsData.totalRoutes} routes and ${Object.keys(gtfsData.tripIdMap).length} trip mappings`);
    console.log(`📊 Load completed at ${gtfsData.loadTime}`);

    return gtfsData;
  } catch (error) {
    console.error('❌ Error loading GTFS patterns:', error.message);
    return null;
  }
};

// Merge GTFS patterns with hardcoded stoppingPatterns
const mergeGTFSPatterns = (gtfsData) => {
  if (!gtfsData || !gtfsData.routes) return;
  
  let mergedCount = 0;
  for (const [routeId, routeData] of Object.entries(gtfsData.routes)) {
    // Skip if route already has hardcoded patterns (hardcoded takes precedence)
    if (stoppingPatterns[routeId]) {
      continue;
    }
    
    // For each pattern in the route, create a simplified station list
    const patterns = Array.isArray(routeData.patterns) ? routeData.patterns : [];
    if (patterns.length > 0) {
      // Use the first pattern as a representative
      const mainPattern = patterns[0];
      if (mainPattern.stops && Array.isArray(mainPattern.stops)) {
        // Convert GTFS stop format to stoppingPatterns format
        stoppingPatterns[routeId] = mainPattern.stops.map(station => {
          const normalizedName = normalizeStationName(station.name);
          return {
            name: normalizedName,
            code: station.code,
            announcements: {
              mindTheGap: {
                text: normalizedName,
                audio: ''
              }
            }
          };
        });
        mergedCount++;
      }
    }
  }
  
  console.log(`📦 Merged ${mergedCount} GTFS routes into stoppingPatterns`);
};

// ==================== Audio Preloading System ====================
const audioCache = new Map();
let totalAudioFiles = 0;
let loadedAudioFiles = 0;

async function preloadAllAudioFiles() {
  // Startup screens removed - keyboard is shown immediately on load
  // Audio files will load on-demand when needed
  console.log('ℹ️ Startup screens disabled - showing keyboard immediately');
}

// Start preloading when page loads
window.addEventListener('load', preloadAllAudioFiles);

document.addEventListener("DOMContentLoaded", function () {
  // ==================== LOAD PEAK RUNS ON STARTUP ====================
  let peakRunsArray = [];
  fetch(qvasAssetUrl('peakruns.json'))
    .then(response => response.json())
    .then(data => {
      peakRunsArray = data;
      console.log('📋 Peak runs loaded on startup:', peakRunsArray);
    })
    .catch(err => console.log('Could not load peakruns.json on startup:', err));
  
  try {
    console.log('✅ DOMContentLoaded fired - app.js initializing');
    
    runInput = document.getElementById("run-number");
    const setRunBtn = document.getElementById("set-run");
    const runError = document.getElementById("run-error");
    const runNumberDisplay = document.getElementById("run-number-display");
    const stationList = document.getElementById("station-list");
    const stationListContainer = document.getElementById("station-list-container");
    const dateDisplay = document.getElementById("date-display");
    const timeDisplay = document.getElementById("time-display");
    const pidDisplay = document.getElementById("pid-display");
    const diDisplay = document.getElementById("di-display");
  const doorCycleDisplay = document.getElementById("door-cycle-display");
  const systemReadyScreen = document.getElementById("system-ready-screen");
  const leftPanel = document.getElementById("left-panel");
  const initialFooter = document.getElementById("initial-footer");
  let currentStations = [];
  let selectedStation = null;
  let currentDestination = null;
  let displayWindow = qvasCreateInlineWindowTarget('AnnouncementDisplay');
  let destinationWindow = qvasCreateInlineWindowTarget('DestinationBoard');
  let doorsCycled = false; // Track if doors have been cycled (unlock then lock)
  let cctvOnDoorUnlockEnabled = true; // Toggle for CCTV on door unlock feature
  let cctvDisplayTimer = null; // Timer for CCTV display delay
  
  // Closest Station Feature
  let manualClosestStationMode = false; // Toggle for manual closest station selection
  let closestStationIndex = 0; // Index of current closest station (default first station)

  // Station Code Mapping
  const stationCodeMap = {
    'AJN': 'Airport Junction', 'EGJ': 'Eagle Junction', 'AIN': 'Albion', 'EIP': 'East Ipswich',
    'ADY': 'Alderley', 'EBV': 'Ebbw Vale', 'ATI': 'Altandi', 'EDL': 'Edens Landing',
    'ACO': 'Ascot', 'AHF': 'Auchenflower', 'EMH': 'Elimbah', 'EMY': 'Elimbah Yard',
    'BDS': 'Bald Hills', 'EGE': 'Ellen Grove', 'BQO': 'Banoon', 'EGG': 'Enoggera',
    'BDT': 'Brisbane Domestic Airport', 'EUD': 'Eudlo', 'BQY': 'Banyo', 'EUM': 'Eumundi',
    'BYY': 'Banyo Yard', 'EXH': 'Exhibition', 'BNH': 'Beenleigh', 'BNY': 'Beenleigh Yard',
    'BNT': 'Beenleigh Middle Road', 'FFI': 'Fairfield', 'BEB': 'Beerburrum', 'FYG': 'Ferny Grove',
    'BWH': 'Beerwah', 'BTI': 'Bethania', 'BRC': 'Fortitude Valley', 'BHA': 'Bindha',
    'BDE': 'Birkdale', 'BZL': 'Boondall', 'BOV': 'Booval', 'GAI': 'Gailes',
    'BHI': 'Bowen Hills', 'GAO': 'Gaythorne', 'BOX': 'Box Flat', 'GEB': 'Geebung',
    'BPR': 'Bray Park', 'BDX': 'Bundamba', 'GSS': 'Glass House Mtns', 'GDQ': 'Goodna',
    'BRD': 'Buranda', 'GVQ': 'Graceville', 'BPY': 'Burpengary', 'GOQ': 'Grovely',
    'GYN': 'Gympie North', 'CAB': 'Caboolture', 'CNQ': 'Cannon Hill', 'HLN': 'Helensvale',
    'CDE': 'Carseldine', 'HMM': 'Hemmant', 'BNC': 'Central', 'HDR': 'Hendra',
    'CMZ': 'Chelmer', 'HVW': 'Holmview', 'CPM': 'Clapham', 'CYF': 'Clayfield',
    'CVN': 'Cleveland', 'IDP': 'Indooroopilly', 'CXM': 'Coomera', 'BIT': 'International Terminal',
    'CEP': 'Coopers Plains', 'IPS': 'Ipswich', 'COZ': 'Cooran', 'IPW': 'Ipswich Workshops',
    'COO': 'Cooroy', 'CRO': 'Coorparoo', 'CQD': 'Corinda', 'KGR': 'Kallangur',
    'KRA': 'Karrabin', 'DKB': 'Dakabin', 'KEP': 'Keperra', 'DAR': 'Darra',
    'KGT': 'Kingston', 'DEG': 'Deagon', 'DIR': 'Dinmore', 'KPR': 'Kippa-Ring',
    'DBN': 'Doomben', 'KRY': 'Kuraby', 'DUP': 'Dutton Park', 'LSH': 'Landsborough',
    'RDK': 'Redbank', 'LWO': 'Lawnton', 'LDM': 'Lindum', 'LGL': 'Loganlea',
    'RHD': 'Richlands', 'LOT': 'Lota', 'RVV': 'Riverview', 'ROB': 'Robina',
    'RKE': 'Rocklea', 'MGH': 'Mango Hill', 'MGE': 'Mango Hill East', 'RST': 'Roma Street',
    'MNY': 'Manly', 'RSW': 'Rosewood', 'RWL': 'Rothwell', 'SLY': 'Salisbury',
    'MYD': 'Old Mayne Yard', 'SGE': 'Sandgate', 'YNY': 'Mayne Yard North', 'SHW': 'Sherwood',
    'MTZ': 'Milton', 'SHC': 'Shorncliffe', 'MHQ': 'Mitchelton', 'SBA': 'South Bank',
    'MOH': 'Mooloolah', 'SBE': 'South Brisbane', 'MQK': 'Moorooka', 'SFD': 'Springfield',
    'MYE': 'Morayfield', 'SFC': 'Springfield Central', 'MGS': 'Morningside', 'SPN': 'Strathpine',
    'MJE': 'Murarrie', 'SYK': 'Sunnybank', 'MRD': 'Murrumba Downs', 'SSN': 'Sunshine',
    'NBS': 'Nambour Yard', 'TIQ': 'Taringa', 'NRB': 'Narangba', 'TNY': 'Tennyson',
    'NRG': 'Nerang', 'TAO': 'Thagoona', 'NWM': 'Newmarket', 'THS': 'Thomas Street',
    'NPR': 'Norman Park', 'TNS': 'Thorneside', 'NBY': 'Normanby', 'TBU': 'Toombul',
    'NCW': 'Normanby Car Wash', 'TWG': 'Toowong', 'NBD': 'North Boondall', 'TRA': 'Traveston',
    'NTG': 'Northgate', 'TDP': 'Trinder Park', 'NUD': 'Nudgee', 'VYS': 'Varsity Lakes',
    'NND': 'Nundah', 'VGI': 'Virginia', 'ORM': 'Ormeau', 'WAC': 'Wacol',
    'ORO': 'Ormiston', 'WOQ': 'Walloon', 'OXP': 'Oxford Park', 'WPT': 'Wellington Point',
    'OXL': 'Oxley', 'PAL': 'Palmwoods', 'PKR': 'Park Road', 'PET': 'Petrie',
    'WLQ': 'Wilston', 'WID': 'Windsor', 'WOI': 'Woodridge'
  };

  // ==================== KEYBOARD POLLING FROM SERVER (FALLBACK) ====================
  let lastProcessedKeyTime = 0;
  let keyPollingInterval = null;
  
  function startKeyboardPolling() {
    // Poll server every 100ms for new key presses from Python listener
    keyPollingInterval = setInterval(async () => {
      try {
        if (window.QVAS_PWA_MODE) return;
        const response = await fetch('/api/state');
        const state = await response.json();
        
        if (state.lastKeyPress) {
          const keyTimestamp = state.lastKeyPress.timestamp || 0;
          
          // Only process if this is a new key press (not processed before)
          if (keyTimestamp > lastProcessedKeyTime) {
            lastProcessedKeyTime = keyTimestamp;
            const key = state.lastKeyPress.key;
            
            console.log(`⌨️ [POLLING] Received key press from server: ${key}`);
            
            // Process the key
            switch(key) {
              case '3':
              case 'numpad 3':
                console.log('🔓 [POLLING] Key 3 - Unlocking doors');
                doorsUnlock();
                break;
              case '4':
              case 'numpad 4':
                console.log('📢 [POLLING] Key 4 - Playing announcement');
                if (typeof playArrivalAnnouncement === 'function') {
                  playArrivalAnnouncement();
                }
                break;
              case '6':
              case 'numpad 6':
                console.log('🔒 [POLLING] Key 6 - Locking doors');
                doorsLock();
                break;
            }
          }
        }
      } catch (err) {
        // Silently fail - server might not be ready yet
      }
    }, 100); // Poll every 100ms
  }
  
  // In Electron this can poll the local server. In iPhone/PWA mode there is no server,
  // so use normal browser key/touch controls instead.
  if (!window.QVAS_PWA_MODE) {
    startKeyboardPolling();
  }
  document.addEventListener('keydown', function(event) {
    if (qvasHandleLocalKey(event.key) || qvasHandleLocalKey(event.code)) {
      event.preventDefault();
    }
  });

  // Initialize UI for keyboard-first mode (startup screens removed)
  {
    const initialFooter = document.getElementById('initial-footer');
    const startupFooter = document.getElementById('startup-footer');
    const headerTitle = document.getElementById('header-title');
    const headerRoute = document.getElementById('header-route');
    
    if (initialFooter) initialFooter.classList.add('hide');
    if (startupFooter) startupFooter.classList.remove('hide');
    if (headerTitle) headerTitle.classList.add('hide');
    if (headerRoute) headerRoute.classList.remove('hide');
    
    console.log('✅ UI initialized for keyboard-first mode');
  }

  // Play startup audio on desktop only. iPhone/Safari blocks automatic audio until a tap.
  if (!window.QVAS_PWA_MODE) {
    setTimeout(() => {
      console.log('🎵 Playing startup audio');
      playAudio('QR_PIDS_AudioFiles/StartUp.mp3');
    }, 500);
  }

  // Set date and time
  function updateDateTime() {
    const now = new Date();
    dateDisplay.textContent = now.toLocaleDateString('en-AU');
    timeDisplay.textContent = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // Load GTFS patterns for extended route support
  loadGTFSPatterns().then(gtfsData => {
    if (gtfsData) {
      globalGTFSData = gtfsData;
      
      // Store trip ID map for searching by run codes
      if (gtfsData.tripIdMap) {
        tripIdMap = gtfsData.tripIdMap;
        console.log(`✅ Loaded ${Object.keys(tripIdMap).length} trip ID mappings`);
      }
      
      // Build fast lookup index for run codes from routes
      // GTFS data uses route_id like "IPBR-4483" where "IPBR" is the route code
      if (gtfsData.routes) {
        for (const [routeId, routeData] of Object.entries(gtfsData.routes)) {
          // Extract the route code from routeId (e.g., "IPBR" from "IPBR-4483")
          const routeCode = routeId.split('-')[0].toUpperCase();
          runCodeIndex[routeCode] = routeData;
          
          // Also index the full routeId
          runCodeIndex[routeId.toUpperCase()] = routeData;
        }
      }
      console.log(`✅ Built fast lookup index for ${Object.keys(runCodeIndex).length} route codes`);
      
      mergeGTFSPatterns(gtfsData);
    }
  });

  // Handle run number input changes - show/hide manual button and change enter button color
  function updateRouteInputUI() {
    const isFull = runInput && runInput.value && runInput.value.trim().length === 4;
    const hasText = runInput && runInput.value && runInput.value.trim().length > 0;
    const manualBtn = document.getElementById('manual-btn');
    const enterBtn = document.getElementById('enter-btn');
    const backBtn = document.getElementById('back-btn');
    const ngrToggle = document.getElementById('ngr-button-message-toggle');
    
    console.log(`📝 updateRouteInputUI called - Value: "${runInput ? runInput.value : 'N/A'}" - isFull: ${isFull}`);
    
    // Check if train number starts with "D" when a full 4-character number is entered
    if (isFull && runInput) {
      const trainNumber = runInput.value.trim().toUpperCase();
      shouldPlayExitButtons = trainNumber.startsWith('D');
      ngrButtonMessageEnabled = trainNumber.startsWith('D');
      console.log(`✅ Train number "${trainNumber}" entered - shouldPlayExitButtons: ${shouldPlayExitButtons}, ngrButtonMessageEnabled: ${ngrButtonMessageEnabled}`);
      
      // Update the NGR toggle display
      if (ngrToggle) {
        if (ngrButtonMessageEnabled) {
          ngrToggle.textContent = 'ON';
          ngrToggle.classList.add('enabled');
          ngrToggle.classList.remove('disabled');
        } else {
          ngrToggle.textContent = 'OFF';
          ngrToggle.classList.remove('enabled');
          ngrToggle.classList.add('disabled');
        }
      }
    } else {
      shouldPlayExitButtons = false;
      ngrButtonMessageEnabled = false;
      if (ngrToggle) {
        ngrToggle.textContent = 'OFF';
        ngrToggle.classList.remove('enabled');
        ngrToggle.classList.add('disabled');
      }
    }
    
    if (isFull) {
      // Show manual button and make enter button green when fully occupied (4 characters)
      if (manualBtn) manualBtn.classList.remove('hidden');
      if (enterBtn) enterBtn.classList.add('footer-btn-green');
    } else {
      // Hide manual button and make enter button grey when not fully occupied
      if (manualBtn) manualBtn.classList.add('hidden');
      if (enterBtn) enterBtn.classList.remove('footer-btn-green');
    }
    
    // Back button: green when text exists, grey when empty
    if (backBtn) {
      if (hasText) {
        backBtn.classList.remove('footer-btn-grey');
        backBtn.classList.add('footer-btn-green');
      } else {
        backBtn.classList.remove('footer-btn-green');
        backBtn.classList.add('footer-btn-grey');
      }
    }
  }
  
  if (runInput) {
    console.log('✅ Attaching event listeners to runInput element');
    runInput.addEventListener('input', updateRouteInputUI);
    runInput.addEventListener('change', updateRouteInputUI);
    console.log('✅ Event listeners attached - input and change');
  } else {
    console.error('❌ runInput element not found!');
  }

  // Click on left panel (not buttons) to show keyboard
  if (leftPanel) {
    leftPanel.addEventListener('click', function(e) {
      // Check if click is on the system ready screen or its children
      let isSystemReadyClick = false;
      
      // Check if target is the system ready screen itself
      if (e.target === systemReadyScreen) {
        isSystemReadyClick = true;
      }
      // Check if target is a child of system ready screen (text elements)
      else if (systemReadyScreen && systemReadyScreen.contains(e.target)) {
        isSystemReadyClick = true;
      }
      // Check if target has the system-ready classes
      else if (e.target.classList && (e.target.classList.contains('system-ready-text') || 
          e.target.classList.contains('system-ready-subtext'))) {
        isSystemReadyClick = true;
      }
      
      // Only trigger for system ready screen clicks, not other buttons or areas
      if (isSystemReadyClick) {
        showKeyboardMode();
      }
    });
    
    // Also listen for touch events as backup on touchscreen devices
    if (systemReadyScreen) {
      systemReadyScreen.addEventListener('touchstart', function(e) {
        console.log('📱 [TOUCH] System ready screen tapped');
        showKeyboardMode();
      });
    }
  }
  
  function showKeyboardMode() {
    console.log('🎯 [showKeyboardMode] Called - hiding system ready and showing keyboard');
    
    // Hide system ready screen
    if (systemReadyScreen) {
      systemReadyScreen.classList.add('hide');
      console.log('✓ System ready screen hidden');
    }
    
    // Show keyboard - CRITICAL for visibility
    const touchKeyboard = document.getElementById('touch-keyboard');
    if (touchKeyboard) {
      touchKeyboard.classList.remove('hide');
      console.log('✓ Touch keyboard shown');
    } else {
      console.error('❌ Touch keyboard element not found!');
    }
    
    // Switch from initial footer to startup footer
    const initialFooter = document.getElementById('initial-footer');
    const startupFooter = document.getElementById('startup-footer');
    if (initialFooter) {
      initialFooter.classList.add('hide');
      console.log('✓ Initial footer hidden');
    }
    if (startupFooter) {
      startupFooter.classList.remove('hide');
      console.log('✓ Startup footer shown');
    }
    
    // Switch header to route display
    const headerTitle = document.getElementById('header-title');
    const headerRoute = document.getElementById('header-route');
    if (headerTitle) {
      headerTitle.classList.add('hide');
      console.log('✓ Header title hidden');
    }
    if (headerRoute) {
      headerRoute.classList.remove('hide');
      console.log('✓ Header route shown');
    }
    
    // Update helper bar if it exists
    const helperBar = document.getElementById('helper-bar');
    if (helperBar) {
      helperBar.textContent = '"Enter" to verify. "Back" to edit.';
      console.log('✓ Helper bar updated');
    }
    
    console.log('✅ [showKeyboardMode] Complete - keyboard should now be visible');
  }

  // Buttons will be accessed later via event listeners

  function renderStations(stations) {
    stationList.innerHTML = "";
    if (!stations || stations.length === 0) {
      stationListContainer.classList.remove('show');
      return;
    }
    stations.forEach((stationObj, index) => {
      const li = document.createElement("li");
      
      // Create station name span
      const nameSpan = document.createElement("span");
      // Normalize station name for display
      nameSpan.textContent = normalizeStationName(stationObj.name);
      li.appendChild(nameSpan);
      
      // Add skip tag if station is skipped
      if (stationObj.skipped) {
        const skipTag = document.createElement("span");
        skipTag.className = "skip-tag";
        skipTag.textContent = "(skipped)";
        li.appendChild(skipTag);
        li.classList.add("skipped");
      }
      
      li.addEventListener("click", function () {
        document.querySelectorAll("#station-list li").forEach((el) => el.classList.remove("selected"));
        li.classList.add("selected");
        selectedStation = stationObj;
        currentHighlightIndex = index;
        
        // Set the current station for TNS_Special path generation
        if (index > 0) {
          currentStation = currentStations[index - 1].name;
        } else {
          currentStation = currentStations[0].name;
        }
        
        // Update page when clicking an item
        currentStationPage = Math.floor(index / STATION_ITEMS_PER_PAGE);
        updateStationDisplayPage();
        updateSkipButton();
        
        // If doors are already unlocked and CCTV feature enabled, show CCTV
        const doorCycleState = doorCycleDisplay.textContent.trim();
        if (doorCycleState === 'Y' && cctvOnDoorUnlockEnabled) {
          const isNormalMode = !normalFooter.classList.contains('hide');
          const isCctvVisible = !cctvPanel.classList.contains('hide');
          if (isNormalMode && !isCctvVisible) {
            setTimeout(() => {
              showCctvPanel();
            }, 100);
          }
        }
        
        // When first station is selected, press the play button
        if (index === 0) {
          const playBtn = document.getElementById("play-btn");
          if (playBtn) {
            setTimeout(() => {
              playBtn.click();
            }, 100);
          }
        }
      });
      stationList.appendChild(li);
    });
    
    // Initialize pagination display
    currentStationPage = 0;
    updateStationDisplayPage();
    
    // Update closest station tag
    updateClosestStationTag();
  }

  // Initial render: hide station list
  renderStations([]);

  if (setRunBtn) setRunBtn.addEventListener("click", function () {
    const run = runInput.value.trim().toUpperCase();
    console.log('Setting run:', run, 'Length:', run.length);
    
    selectedStation = null;
    const isValid = validateRunNumber(run);
    console.log('Run validation result:', isValid);
    
    if (!isValid) {
      console.log('Run validation failed for:', run);
      runError.textContent = "Invalid run number. Format: 3 letters/numbers + 1 number (e.g. T6X1)";
      runNumberDisplay.textContent = "ROUTE NOT SET";
      currentStations = [];
      renderStations(currentStations);
      // Reset destination board
      if (destinationWindow && !destinationWindow.closed) {
        destinationWindow.postMessage({ type: 'RESET' }, '*');
      }
      return;
    }
    runError.textContent = "";
    console.log('Run validation passed, proceeding with:', run);
    
    // ==================== PEAK TIME RUN DETECTION ====================
    // Check if this run code is in peakruns.json (loaded on startup)
    console.log('🔍 Checking peakRunsArray:', peakRunsArray, 'against run:', run);
    if (peakRunsArray && peakRunsArray.includes(run)) {
      const secondChar = run.charAt(1); // Get second character for route code
      const routeInfo = runCodeGuide.secondChar[secondChar];
      const shortRouteCode = secondChar; // Short route code is the second character
      console.log(`\n🎯 PEAK TIME RUN DETECTED!`);
      console.log(`   Run Code: ${run}`);
      console.log(`   Short Route Code: ${shortRouteCode}`);
      if (routeInfo) {
        console.log(`   Route: ${routeInfo.route}`);
      }
    } else {
      console.log(`ℹ️ Run "${run}" is not in peak runs list`);
    }
    
    // Parse the run code to get route and destination info
    const runInfo = parseRunCode(run);
    console.log('Parsed run info:', runInfo);
    
    // If run code matches a stopping pattern, use it
    console.log('Checking stoppingPatterns for:', run);
    console.log('Available patterns:', Object.keys(stoppingPatterns));
    console.log('Pattern exists:', !!stoppingPatterns[run]);
    
    if (stoppingPatterns[run]) {
      currentStations = stoppingPatterns[run];
      const origin = currentStations[0].name;
      const dest = currentStations[currentStations.length-1].name;
      
      // Load route-specific announcements for this route (5-minute refresh)
      const formCode = getFormCodeForRoute(run);
      const routeLongName = buildRouteLongName(currentStations);
      console.log(`\nChecking if route has special announcements:`);
      console.log(`  formCode: ${formCode}`);
      console.log(`  routeLongName: ${routeLongName}`);
      if (formCode && routeLongName) {
        console.log(`  ✓ Calling startAnnouncementScanning()`);
        currentRouteFormCode = formCode;
        currentRouteLongName = routeLongName;
        startAnnouncementScanning(formCode, routeLongName).catch(err => console.log('Could not load route announcements:', err));
      } else {
        console.log(`  ✗ Missing form code or route name - skipping announcement scanning`);
      }
      
      // Display run info with parsed details
      if (runInfo) {
        runNumberDisplay.textContent = `${run} - ${runInfo.trainType} | ${origin} to ${dest} | ${runInfo.stoppingPattern}`;
      } else {
        runNumberDisplay.textContent = run + " - " + origin + " to " + dest;
      }
      
      // Open destination window if not already open or closed
      if (!destinationWindow || destinationWindow.closed) {
        destinationWindow = qvasCreateInlineWindowTarget('DestinationBoard');
      }
      // Send destination and stopping pattern
      setTimeout(() => {
        destinationWindow.postMessage({
          type: 'DEST_BOARD',
          payload: {
            destination: dest,
            stations: currentStations.map(s => s.name)
          }
        }, '*');
      }, 300);
    } else {
      // No stopping pattern defined, but we can still show route info from run code
      currentStations = [];
      if (runInfo) {
        runNumberDisplay.textContent = `${run} - ${runInfo.trainType} | ${runInfo.route} to ${runInfo.destination} | ${runInfo.stoppingPattern}`;
        
        // Open destination window and show parsed destination
        if (!destinationWindow || destinationWindow.closed) {
          destinationWindow = qvasCreateInlineWindowTarget('DestinationBoard');
        }
        setTimeout(() => {
          destinationWindow.postMessage({
            type: 'DEST_BOARD',
            payload: {
              destination: runInfo.destination,
              stations: []
            }
          }, '*');
        }, 300);
      } else {
        runNumberDisplay.textContent = run + " - Pattern Not Defined";
        // Reset destination board
        if (destinationWindow && !destinationWindow.closed) {
          destinationWindow.postMessage({ type: 'RESET' }, '*');
        }
      }
    }
    renderStations(currentStations);
  });

  // Enter button (HMI footer) - validates run and enters station selection mode
  const enterBtn = document.getElementById("enter-btn");
  const startupFooter = document.getElementById("startup-footer");
  const stationFooter = document.getElementById("station-footer");
  const normalFooter = document.getElementById("normal-footer");
  const modeTitle = document.getElementById("mode-title");
  const helperBar = document.getElementById("helper-bar");
  const stationMorePrev = document.getElementById("station-more-prev");
  const stationMoreNext = document.getElementById("station-more-next");
  
  let currentHighlightIndex = 0;
  
  // Station pagination settings
  const STATION_ITEMS_PER_PAGE = 10;
  let currentStationPage = 0;
  
  function updateStationDisplayPage() {
    // Hide all items first
    const items = document.querySelectorAll('#station-list li');
    items.forEach(item => item.classList.remove('visible'));
    
    // Calculate page range
    const startIndex = currentStationPage * STATION_ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + STATION_ITEMS_PER_PAGE, currentStations.length);
    
    // Show items for current page
    for (let i = startIndex; i < endIndex; i++) {
      items[i].classList.add('visible');
    }
    
    // Update -more- button visibility
    stationMorePrev.style.display = currentStationPage > 0 ? 'block' : 'none';
    stationMoreNext.style.display = endIndex < currentStations.length ? 'block' : 'none';
    
    // Update up/down button colors based on position
    const upBtn = document.getElementById("up-btn");
    const downBtn = document.getElementById("down-btn");
    
    if (upBtn) {
      if (currentHighlightIndex === 0) {
        upBtn.classList.add('footer-btn-grey');
        upBtn.classList.remove('footer-btn-green');
      } else {
        upBtn.classList.remove('footer-btn-grey');
        upBtn.classList.add('footer-btn-green');
      }
    }
    
    if (downBtn) {
      if (currentHighlightIndex >= currentStations.length - 1) {
        downBtn.classList.add('footer-btn-grey');
        downBtn.classList.remove('footer-btn-green');
      } else {
        downBtn.classList.remove('footer-btn-grey');
        downBtn.classList.add('footer-btn-green');
      }
    }
    
    // Highlight appropriate item on current page
    highlightStation(currentHighlightIndex);
  }
  
  function switchToStartupMode() {
    // Show system ready screen, hide keyboard
    if (systemReadyScreen) systemReadyScreen.classList.remove('hide');
    document.getElementById('touch-keyboard').classList.add('hide');
    
    // Hide all panels
    const fnPanel = document.getElementById('fn-panel');
    const manualPanel = document.getElementById('manual-panel');
    const mainPanel = document.querySelector('.main-panel');
    if (fnPanel) fnPanel.classList.add('hide');
    if (manualPanel) manualPanel.classList.add('hide');
    if (mainPanel) mainPanel.classList.remove('hide');
    
    // Hide all footers and show only initial footer
    const allFooters = document.querySelectorAll('.footer');
    allFooters.forEach(footer => {
      if (footer.id === 'initial-footer') {
        footer.classList.remove('hide');
      } else {
        footer.classList.add('hide');
      }
    });
    
    modeTitle.classList.add('hide');
    helperBar.textContent = '';
    stationListContainer.classList.remove('show');
    
    // Show CCTV button (it may have been hidden in station mode)
    const cctvBtn = document.getElementById('cctv-btn');
    if (cctvBtn) cctvBtn.classList.remove('station-select-hidden');
    
    // Hide manual button (user not entering route anymore)
    const manualBtn = document.getElementById('manual-btn');
    if (manualBtn) manualBtn.classList.add('hidden');
    
    // Hide skip button
    const skipBtnEl = document.getElementById('skip-btn');
    if (skipBtnEl) skipBtnEl.classList.add('hide');
  }
  
  function switchToStationSelectMode() {
    startupFooter.classList.add('hide');
    stationFooter.classList.remove('hide');
    normalFooter.classList.add('hide');
    modeTitle.classList.remove('hide');
    modeTitle.textContent = 'Select Start Station Mode';
    helperBar.textContent = 'Use Up/Down to navigate. Select to confirm start station.';
    document.getElementById('touch-keyboard').classList.add('hide');
    stationListContainer.classList.add('show');
    
    // Hide CCTV and Manual buttons in station select mode (preserves space)
    const cctvBtn = document.getElementById('cctv-btn');
    const manualBtn = document.getElementById('manual-btn');
    if (cctvBtn) cctvBtn.classList.add('station-select-hidden');
    if (manualBtn) manualBtn.classList.add('hidden');
    
    // Automatically highlight closest station (if stations exist)
    if (currentStations && currentStations.length > 0) {
      // Calculate which page the closest station is on
      currentStationPage = Math.floor(closestStationIndex / STATION_ITEMS_PER_PAGE);
      // Update the display page to show the closest station
      updateStationDisplayPage();
      // Set highlight index and highlight the station
      currentHighlightIndex = closestStationIndex;
      highlightStation(closestStationIndex);
    }
    
    // Update skip button visibility
    updateSkipButton();
  }
  
  function switchToNormalMode() {
    startupFooter.classList.add('hide');
    stationFooter.classList.add('hide');
    normalFooter.classList.remove('hide');
    modeTitle.classList.remove('hide');
    modeTitle.textContent = 'Normal Mode';
    helperBar.textContent = 'Use Up/Down to navigate. Play to announce.';
    document.getElementById('touch-keyboard').classList.add('hide');
    stationListContainer.classList.add('show');
    
    // Show CCTV button (it was hidden in station select mode)
    const cctvBtn = document.getElementById('cctv-btn');
    const manualBtn = document.getElementById('manual-btn');
    if (cctvBtn) cctvBtn.classList.remove('station-select-hidden');
    
    // Check if manual button should be shown (only if route input has 4 characters)
    if (manualBtn) {
      const isFull = runInput && runInput.value && runInput.value.trim().length === 4;
      if (isFull) {
        manualBtn.classList.remove('hidden');
      } else {
        manualBtn.classList.add('hidden');
      }
    }
    
    // Update skip button visibility
    updateSkipButton();
  }
  
  function highlightStation(index) {
    const items = document.querySelectorAll('#station-list li');
    items.forEach((el, i) => {
      if (i === index) {
        el.classList.add('selected');
        if (el.classList.contains('visible')) {
          el.scrollIntoView({ block: 'nearest' });
        }
      } else {
        el.classList.remove('selected');
      }
    });
    if (currentStations[index]) {
      selectedStation = currentStations[index];
      
      // Set the current station for TNS_Special path generation
      // currentStation is the PREVIOUS station (where announcer is)
      if (index > 0) {
        currentStation = currentStations[index - 1].name;
      } else {
        // For first station, set to first station itself
        currentStation = currentStations[0].name;
      }
      
      console.log(`🎯 Station highlighted: ${selectedStation.name}, CurrentStation set to: ${currentStation}`);
      
      // Update remote state
      if (typeof updateAppState === 'function') {
        updateAppState({ station: selectedStation.name });
      }
      // Update skip button state
      updateSkipButton();
      
      // NOTE: Announcement logic is now ONLY triggered by explicit user clicks in renderStations()
      // This highlightStation() function only handles visual highlighting and state updates
    }
  }

  // Global variables for manual announcement mode
  let manualAnnouncementHighlightIndex = 0;
  let manualAnnouncements = []; // Array of {station, type, text, audioPath}
  
  // Manual announcement pagination settings
  const MANUAL_ITEMS_PER_PAGE = 10;
  let currentManualPage = 0;
  const manualMorePrev = document.getElementById("manual-more-prev");
  const manualMoreNext = document.getElementById("manual-more-next");
  
  function updateManualDisplayPage() {
    // Hide all items first
    const items = document.querySelectorAll('#manual-list li');
    items.forEach(item => item.classList.remove('visible'));
    
    // Calculate page range
    const startIndex = currentManualPage * MANUAL_ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + MANUAL_ITEMS_PER_PAGE, manualAnnouncements.length);
    
    // Show items for current page
    for (let i = startIndex; i < endIndex; i++) {
      items[i].classList.add('visible');
    }
    
    // Update -more- button visibility
    if (manualMorePrev) manualMorePrev.style.display = currentManualPage > 0 ? 'block' : 'none';
    if (manualMoreNext) manualMoreNext.style.display = endIndex < manualAnnouncements.length ? 'block' : 'none';
    
    // Update up/down button colors based on position (when in manual mode)
    const manualListContainer = document.getElementById('manual-list-container');
    const isManualMode = !manualListContainer.classList.contains('hide');
    
    if (isManualMode) {
      const normalUpBtn = document.getElementById("normal-up-btn");
      const normalDownBtn = document.getElementById("normal-down-btn");
      
      if (normalUpBtn) {
        if (manualAnnouncementHighlightIndex === 0) {
          normalUpBtn.classList.add('footer-btn-grey');
          normalUpBtn.classList.remove('footer-btn-green');
        } else {
          normalUpBtn.classList.remove('footer-btn-grey');
          normalUpBtn.classList.add('footer-btn-green');
        }
      }
      
      if (normalDownBtn) {
        if (manualAnnouncementHighlightIndex >= manualAnnouncements.length - 1) {
          normalDownBtn.classList.add('footer-btn-grey');
          normalDownBtn.classList.remove('footer-btn-green');
        } else {
          normalDownBtn.classList.remove('footer-btn-grey');
          normalDownBtn.classList.add('footer-btn-green');
        }
      }
    }
    
    // Highlight appropriate item on current page
    highlightManualAnnouncement(manualAnnouncementHighlightIndex);
  }

  // Function to render manual announcement options
  function renderManualAnnouncements() {
    if (currentStations.length === 0) return;

    manualAnnouncements = [];
    const manualList = document.getElementById('manual-list');
    manualList.innerHTML = '';

    // For each station, add announcement options
    currentStations.forEach((station, index) => {
      const isFirstStation = (index === 0);
      
      // For first station, only add Form message via MTG slot
      // For other stations, add TNS, NAA, and MTG
      
      if (isFirstStation) {
        // At first station: only Form message for destination
        const firstStationName = currentStations[0].name;
        const destinationStation = currentStations[currentStations.length - 1].name;
        
        // Ensure currentStation is set for Form path generation
        currentStation = firstStationName;
        
        const formPath = getAnnouncementAudioPath(destinationStation, 'form');
        console.log(`📋 [MANUAL] First station Form: dest="${destinationStation}", path="${formPath}"`);
        
        manualAnnouncements.push({
          station: firstStationName,
          type: 'Form',
          text: `${firstStationName} station.`,
          audioPath: formPath,
          currentStation: firstStationName
        });
      } else {
        // Previous station (where we currently are)
        const previousStation = currentStations[index - 1].name;
        // Only use Form path if announcing from the first station (index 1)
        const useFormPath = (index === 1);
        
        // TNS: "The next station is Station Name"
        manualAnnouncements.push({
          station: station.name,
          type: 'TNS',
          text: `The next station is ${station.name}`,
          audioPath: getAnnouncementAudioPath(station.name, 'nextStation', useFormPath ? previousStation : null)
        });

        // NAA: "Arriving at Station Name"
        manualAnnouncements.push({
          station: station.name,
          type: 'NAA',
          text: `Arriving at ${station.name}`,
          audioPath: getAnnouncementAudioPath(station.name, 'arrival')
        });

        // MTG: "Station Name station." (mind the gap)
        manualAnnouncements.push({
          station: station.name,
          type: 'MTG',
          text: `${station.name} station.`,
          audioPath: getAnnouncementAudioPath(station.name, 'mindTheGap')
        });
      }
    });
    
    // Log the first announcement (should be Form for first station)
    if (manualAnnouncements.length > 0) {
      const firstAnnouncement = manualAnnouncements[0];
      console.log(`📋 [MANUAL MODE] First announcement (at First Station):`, {
        type: firstAnnouncement.type,
        text: firstAnnouncement.text,
        audioPath: firstAnnouncement.audioPath
      });
    }
    
    // Render list items
    manualAnnouncements.forEach((announcement, index) => {
      const li = document.createElement('li');
      li.className = 'station-list-item';
      li.textContent = announcement.text;
      li.dataset.index = index;
      manualList.appendChild(li);
    });

    // Initialize pagination display
    currentManualPage = 0;
    manualAnnouncementHighlightIndex = 0;
    updateManualDisplayPage();
  }

  // Function to highlight a manual announcement
  function highlightManualAnnouncement(index) {
    const items = document.querySelectorAll('#manual-list li');
    items.forEach((el, i) => {
      if (i === index) {
        el.classList.add('selected');
        if (el.classList.contains('visible')) {
          el.scrollIntoView({ block: 'nearest' });
        }
      } else {
        el.classList.remove('selected');
      }
    });
  }

  // Function to switch to manual announcement mode
  function switchToManualMode() {
    stationFooter.classList.add('hide');
    normalFooter.classList.remove('hide');
    modeTitle.textContent = 'Manual Mode';
    
    // Set currentStation to first station for Form message generation
    if (currentStations.length > 0) {
      currentStation = currentStations[0].name;
      console.log(`🎙️  Switched to manual mode, currentStation set to: ${currentStation}`);
    }
    
    const stationListContainer = document.getElementById('station-list-container');
    const manualListContainer = document.getElementById('manual-list-container');
    
    stationListContainer.classList.add('hide');
    manualListContainer.classList.remove('hide');
    
    // Change reset button text to Close
    const normalResetBtn = document.getElementById('normal-reset-btn');
    if (normalResetBtn) normalResetBtn.textContent = 'Close';
    
    renderManualAnnouncements();
  }

  // Function to switch from manual mode back to normal
  function switchFromManualMode() {
    modeTitle.textContent = 'Normal Mode';
    
    const stationListContainer = document.getElementById('station-list-container');
    const manualListContainer = document.getElementById('manual-list-container');
    
    stationListContainer.classList.remove('hide');
    manualListContainer.classList.add('hide');
    
    // Restore reset button text to Reset
    const normalResetBtn = document.getElementById('normal-reset-btn');
    if (normalResetBtn) normalResetBtn.textContent = 'Reset';
  }
  
  // ==================== Skip Station Functionality ====================
  const skipBtn = document.getElementById('skip-btn');
  
  function updateSkipButton() {
    const btn = document.getElementById('skip-btn');
    if (!btn) return;
    
    if (selectedStation) {
      btn.classList.remove('hide');
      if (selectedStation.skipped) {
        btn.textContent = 'UnSkip';
        btn.classList.add('side-btn-red');
        btn.classList.remove('side-btn-green');
      } else {
        btn.textContent = 'Skip';
        btn.classList.remove('side-btn-red');
        btn.classList.add('side-btn-green');
      }
    } else {
      btn.classList.add('hide');
    }
  }
  
  function toggleStationSkip() {
    if (!selectedStation) return;
    
    // Toggle skipped state
    selectedStation.skipped = !selectedStation.skipped;
    
    // Re-render stations to update visual
    renderStations(currentStations);
    
    // Re-highlight the current station
    highlightStation(currentHighlightIndex);
  }
  
  if (skipBtn) skipBtn.addEventListener('click', toggleStationSkip);
  
  // Update PID display based on announcement type
  function updatePIDDisplay(stationName, announcementType) {
    if (!pidDisplay) return;
    
    // Track the current announcement type for looping
    currentAnnouncementType = announcementType;
    
    switch(announcementType) {
      case 'nextStation':
      case 'TNS':
        pidDisplay.textContent = `The next station is ${stationName}`;
        break;
      case 'arrival':
      case 'NAA':
        pidDisplay.textContent = `Arriving at ${stationName}`;
        break;
      case 'mindTheGap':
      case 'MTG':
        pidDisplay.textContent = `${stationName} station`;
        break;
      case 'form':
        pidDisplay.textContent = `${stationName} station`;
        break;
      case 'special':
        pidDisplay.textContent = stationName;
        break;
      default:
        pidDisplay.textContent = stationName;
    }
  }
  
  function playMindTheGap() {
    if (!selectedStation) return;
    
    // Check if at first station - if so, play Form announcement instead
    const isAtFirstStation = (currentStations.length > 0 && selectedStation === currentStations[0]);
    
    if (isAtFirstStation) {
      // At first station: play Form announcement for destination
      const destinationStation = currentStations[currentStations.length - 1].name;
      
      selectedStation.currentMode = "form";
      updatePIDDisplay(destinationStation, 'form');
      
      let displayText = `${destinationStation} station`;
      let audioPath = getAnnouncementAudioPath(destinationStation, "form");
      
      console.log(`🎵 [MTG->FORM] At first station, playing Form announcement for: ${destinationStation}`);
      console.log(`   Audio path: ${audioPath}`);
      
      // Store for potential replay via Play button
      currentAnnouncementAudioPath = audioPath;
      currentAnnouncementDisplayText = displayText;
      currentAnnouncementType = 'form';
      
      // Open display window if not open
      if (!displayWindow || displayWindow.closed) {
        displayWindow = qvasCreateInlineWindowTarget('AnnouncementDisplay');
      }
      
      setTimeout(() => {
        displayWindow.postMessage(displayText, '*');
      }, 300);
      
      if (audioPath) {
        setTimeout(() => {
          playAudio(audioPath);
        }, 500);
      }
      return;
    }
    
    // Normal case: play Mind The Gap announcement
    selectedStation.currentMode = "mindTheGap";
    
    // Update PID display with announcement state
    updatePIDDisplay(selectedStation.name, 'MTG');
    
    // Generate Mind The Gap announcement dynamically
    let displayText = selectedStation.name + "... Please mind the gap between the train and the platform.";
    let audioPath = getAnnouncementAudioPath(selectedStation.name, "mindTheGap");
    
    console.log(`🎵 [MTG] Playing mind the gap for: ${selectedStation.name}`);
    console.log(`   Audio path: ${audioPath}`);
    
    // Store for potential replay via Play button
    currentAnnouncementAudioPath = audioPath;
    currentAnnouncementDisplayText = displayText;
    currentAnnouncementType = 'MTG';
    
    // Open display window if not open
    if (!displayWindow || displayWindow.closed) {
      displayWindow = qvasCreateInlineWindowTarget('AnnouncementDisplay');
    }
    
    setTimeout(() => {
      displayWindow.postMessage(displayText, '*');
    }, 300);
    
    if (audioPath) {
      setTimeout(() => {
        playAudio(audioPath);
      }, 500);
    }
  }

  function playNextStation() {
    if (!selectedStation) return;
    
    selectedStation.currentMode = "nextStation";
    
    // Update PID display with announcement state
    updatePIDDisplay(selectedStation.name, 'TNS');
    
    // Generate Next Station announcement dynamically
    let displayText = `The next station is ${selectedStation.name}`;
    
    // currentDestinationStation is already set by route entry
    // TNS_Special path: TNS_Special/{FormCode}/{DestinationStation}/{StationName} TNS.mp3
    
    // Get audio path for next station (uses global currentDestinationStation for TNS_Special paths)
    let audioPath = getAnnouncementAudioPath(selectedStation.name, 'nextStation');
    
    console.log(`🎵 [TNS] Playing next station: ${selectedStation.name}`);
    console.log(`   Destination station (for TNS_Special): ${currentDestinationStation}`);
    console.log(`   Form code: ${currentRouteFormCode}`);
    console.log(`   Looking for: TNS_Special/${currentRouteFormCode}/${currentDestinationStation} station/TNS_{StationName}.mp3`);
    console.log(`   Audio path: ${audioPath}`);
    
    // Store for potential replay via Play button
    currentAnnouncementAudioPath = audioPath;
    currentAnnouncementDisplayText = displayText;
    currentAnnouncementType = 'TNS';
    
    // Open display window if not open
    if (!displayWindow || displayWindow.closed) {
      displayWindow = qvasCreateInlineWindowTarget('AnnouncementDisplay');
    }
    
    setTimeout(() => {
      displayWindow.postMessage(displayText, '*');
    }, 300);
    
    if (audioPath) {
      setTimeout(() => {
        playAudio(audioPath);
      }, 500);
    }
  }
  if (enterBtn) enterBtn.addEventListener("click", async function () {
    const run = runInput.value.trim().toUpperCase();
    
    // Debounce: prevent processing multiple rapid clicks
    const now = Date.now();
    if (now - lastRouteEnterTime < 500) {
      console.log('⏱️ Route change debounced (too rapid)');
      return;
    }
    lastRouteEnterTime = now;
    
    console.log('🚀 Enter pressed, run:', run);
    
    selectedStation = null;
    currentHighlightIndex = 0;
    doorsCycled = false;
    const isValid = validateRunNumber(run);
    
    if (!isValid) {
      console.log('❌ Run validation failed for:', run);
      runError.textContent = "Invalid run number. Format: 3 letters/numbers + 1 number (e.g. T6X1)";
      currentStations = [];
      renderStations(currentStations);
      return;
    }
    runError.textContent = "";
    
    // Clear pending announcement on new route
    pendingAnnouncementPath = null;
    
    // ⚡ FAST PATH: Check hardcoded patterns first (instant, no network delay)
    if (stoppingPatterns[run]) {
      console.log('✓ [FAST PATH] Using hardcoded pattern for:', run);
      currentStations = stoppingPatterns[run];
      const origin = currentStations[0].name;
      const dest = currentStations[currentStations.length-1].name;
      
      // Display route immediately (NON-BLOCKING)
      runNumberDisplay.textContent = run.split('').join(' ');
      currentDestination = dest;
      currentDestinationStation = dest; // Update global for Form messages
      if (diDisplay) {
        diDisplay.textContent = dest;
      }
      
      // Auto-select special message matching this destination
      autoSelectSpecialMessageByDestination(dest);
      
      // Update remote state
      if (typeof updateAppState === 'function') {
        updateAppState({ 
          route: run, 
          station: origin,
          DI: dest,
          inputValue: run
        });
      }
      
      // Show stations immediately
      renderStations(currentStations);
      switchToStationSelectMode();
      // Don't auto-select first station - wait for user to click
      // highlightStation(0);
      
      // ⏳ Load announcements in BACKGROUND (non-blocking)
      const formCode = getFormCodeForRoute(run);
      const routeLongName = buildRouteLongName(currentStations);
      if (formCode && routeLongName) {
        currentRouteFormCode = formCode;
        currentRouteLongName = routeLongName;
        console.log(`🔄 Loading announcements in background...`);
        // Don't await - let it load while user navigates
        startAnnouncementScanning(formCode, routeLongName).catch(err => console.log('BG: Announcement load failed:', err));
      }
      
      // 🌐 Try GTFS in BACKGROUND with timeout (won't block UI or delay hardcoded return)
      searchRunInGTFSWithTimeout(run, 2000)
        .then(gtfsRun => {
          if (!gtfsRun || !gtfsRun.found) {
            console.log(`ℹ️ GTFS: Run ${run} not found or request timed out`);
            return;
          }
          console.log(`✓ [BG] GTFS found data, fetching pattern...`);
          return getStoppingPatternFromGTFS(gtfsRun.tripId).then(stoppingPattern => {
            if (stoppingPattern && stoppingPattern.length > 0) {
              console.log(`  → GTFS has ${stoppingPattern.length} stations (enrichment available if needed)`);
            }
          });
        })
        .catch(err => console.log('BG: Optional GTFS enhancement failed:', err));
      
      return; // ✅ Exit early - already processed via fast path
    }
    
    // ⏳ SLOW PATH: No hardcoded pattern, search GTFS (only if hardcoded doesn't exist)
    console.log('⏳ [SLOW PATH] No hardcoded pattern, searching GTFS with 3s timeout...');
    const gtfsRun = await searchRunInGTFSWithTimeout(run, 3000);
    
    if (gtfsRun && gtfsRun.found) {
      console.log('✓ Found run in GTFS');
      const stoppingPattern = await getStoppingPatternFromGTFS(gtfsRun.tripId);
      
      if (stoppingPattern && stoppingPattern.length > 0) {
        currentStations = stoppingPattern.map(stop => ({
          name: stop.name,
          stopId: stop.stopId,
          announcements: stop.announcements,
          arrivalTime: stop.arrivalTime,
          currentMode: "next"
        }));
        
        const origin = currentStations[0].name;
        const dest = currentStations[currentStations.length-1].name;
        
        // Load announcements
        const formCode = extractFormCodeFromGTFS(gtfsRun.routeId);
        const routeLongName = gtfsRun.destination || buildRouteLongName(currentStations);
        if (formCode && routeLongName) {
          currentRouteFormCode = formCode;
          currentRouteLongName = routeLongName;
          startAnnouncementScanning(formCode, routeLongName).catch(err => console.log('Could not load announcements:', err));
        }
        
        runNumberDisplay.textContent = run.split('').join(' ');
        currentDestination = dest;
        currentDestinationStation = dest; // Update global for Form messages
        if (diDisplay) {
          diDisplay.textContent = dest;
        }
        
        // Auto-select special message matching this destination
        autoSelectSpecialMessageByDestination(dest);
        
        if (typeof updateAppState === 'function') {
          updateAppState({ 
            route: run, 
            station: origin,
            DI: dest,
            inputValue: run
          });
        }
        
        renderStations(currentStations);
        switchToStationSelectMode();
        // Don't auto-select first station - wait for user to click
        // highlightStation(0);
        return;
      }
    }
    
    // ❌ No pattern found anywhere
    currentStations = [];
    runError.textContent = "Pattern not found for this run code (try GTFS data or add to database).";
  });
  
  // Up button - move selection up
  const upBtn = document.getElementById("up-btn");
  if (upBtn) upBtn.addEventListener("click", function() {
    if (currentStations.length === 0) return;
    
    currentHighlightIndex = Math.max(0, currentHighlightIndex - 1);
    
    // Auto-switch page when moving up from first item on current page to previous page
    const newPage = Math.floor(currentHighlightIndex / STATION_ITEMS_PER_PAGE);
    if (newPage < currentStationPage) {
      currentStationPage = newPage;
    }
    
    // Update page based on new index
    currentStationPage = Math.floor(currentHighlightIndex / STATION_ITEMS_PER_PAGE);
    updateStationDisplayPage();
  });
  
  // Down button - move selection down
  const downBtn = document.getElementById("down-btn");
  if (downBtn) downBtn.addEventListener("click", function() {
    if (currentStations.length === 0) return;
    
    const maxPages = Math.ceil(currentStations.length / STATION_ITEMS_PER_PAGE);
    const lastItemOnPage = (currentStationPage + 1) * STATION_ITEMS_PER_PAGE - 1;
    
    // Check if we're at the last item on current page and there are more pages
    if (currentHighlightIndex >= lastItemOnPage && currentHighlightIndex < currentStations.length - 1) {
      // Auto-switch to next page
      currentStationPage++;
      currentHighlightIndex = currentStationPage * STATION_ITEMS_PER_PAGE;
    } else {
      // Normal increment within current page
      currentHighlightIndex = Math.min(currentStations.length - 1, currentHighlightIndex + 1);
      currentStationPage = Math.floor(currentHighlightIndex / STATION_ITEMS_PER_PAGE);
    }
    
    updateStationDisplayPage();
  });
  
  // Previous page button
  if (stationMorePrev) stationMorePrev.addEventListener('click', () => {
    if (currentStationPage > 0) {
      currentStationPage--;
      // Set index to last item of previous page
      currentHighlightIndex = (currentStationPage + 1) * STATION_ITEMS_PER_PAGE - 1;
      updateStationDisplayPage();
    }
  });
  
  // Next page button
  if (stationMoreNext) stationMoreNext.addEventListener('click', () => {
    const maxPages = Math.ceil(currentStations.length / STATION_ITEMS_PER_PAGE);
    if (currentStationPage < maxPages - 1) {
      currentStationPage++;
      // Set index to first item of next page
      currentHighlightIndex = currentStationPage * STATION_ITEMS_PER_PAGE;
      updateStationDisplayPage();
    }
  });
  
  // Select button - confirm start station, play mind the gap only if doors unlocked
  const selectBtn = document.getElementById("select-btn");
  if (selectBtn) selectBtn.addEventListener("click", function() {
    if (!selectedStation) {
      runError.textContent = "Select a station first.";
      return;
    }
    runError.textContent = "";
    
    // Check current door cycle state
    const doorCycleState = doorCycleDisplay.textContent.trim();
    
    // If doors are unlocked (Y), play mind the gap then switch to CCTV after 3 seconds
    if (doorCycleState === 'Y') {
      // Switch to normal mode first (this updates the display and sets up normal mode)
      switchToNormalMode();
      
      // Play mind the gap immediately
      playMindTheGap();
      
      // Then switch to CCTV after 3 seconds
      helperBar.textContent = 'Switching to CCTV...';
      previousFooter = 'station'; // Set this so we return to station mode when exiting CCTV
      setTimeout(() => {
        showCctvPanel();
      }, 3000); // 3 second delay before showing CCTV
      return;
    }
    
    // Normal flow (doors locked): Switch to normal mode
    switchToNormalMode();
    helperBar.textContent = 'Ready for door cycle.';
  });
  
  // Normal mode Up button
  const normalUpBtn = document.getElementById("normal-up-btn");
  if (normalUpBtn) normalUpBtn.addEventListener("click", function() {
    // Check if we're in manual mode
    const manualListContainer = document.getElementById('manual-list-container');
    const isManualMode = !manualListContainer.classList.contains('hide');
    
    if (isManualMode) {
      // Navigate manual announcements
      if (manualAnnouncements.length === 0) return;
      manualAnnouncementHighlightIndex = Math.max(0, manualAnnouncementHighlightIndex - 1);
      // Update current page based on index
      currentManualPage = Math.floor(manualAnnouncementHighlightIndex / MANUAL_ITEMS_PER_PAGE);
      updateManualDisplayPage();
    } else {
      // Navigate stations
      if (currentStations.length === 0) return;
      currentHighlightIndex = Math.max(0, currentHighlightIndex - 1);
      highlightStation(currentHighlightIndex);
    }
  });
  
  // Normal mode Down button
  const normalDownBtn = document.getElementById("normal-down-btn");
  if (normalDownBtn) normalDownBtn.addEventListener("click", function() {
    // Check if we're in manual mode
    const manualListContainer = document.getElementById('manual-list-container');
    const isManualMode = !manualListContainer.classList.contains('hide');
    
    if (isManualMode) {
      // Navigate manual announcements
      if (manualAnnouncements.length === 0) return;
      manualAnnouncementHighlightIndex = Math.min(manualAnnouncements.length - 1, manualAnnouncementHighlightIndex + 1);
      // Update current page based on index
      currentManualPage = Math.floor(manualAnnouncementHighlightIndex / MANUAL_ITEMS_PER_PAGE);
      updateManualDisplayPage();
    } else {
      // Navigate stations
      if (currentStations.length === 0) return;
      currentHighlightIndex = Math.min(currentStations.length - 1, currentHighlightIndex + 1);
      highlightStation(currentHighlightIndex);
    }
  });

  // Manual -more- prev button (previous page of announcements)
  if (manualMorePrev) manualMorePrev.addEventListener("click", function() {
    if (currentManualPage > 0) {
      currentManualPage--;
      // Set highlight index to last item of new page
      const startIndex = currentManualPage * MANUAL_ITEMS_PER_PAGE;
      manualAnnouncementHighlightIndex = Math.min(startIndex + MANUAL_ITEMS_PER_PAGE - 1, manualAnnouncements.length - 1);
      updateManualDisplayPage();
    }
  });

  // Manual -more- next button (next page of announcements)
  if (manualMoreNext) manualMoreNext.addEventListener("click", function() {
    const totalPages = Math.ceil(manualAnnouncements.length / MANUAL_ITEMS_PER_PAGE);
    if (currentManualPage < totalPages - 1) {
      currentManualPage++;
      // Set highlight index to first item of new page
      const startIndex = currentManualPage * MANUAL_ITEMS_PER_PAGE;
      manualAnnouncementHighlightIndex = startIndex;
      updateManualDisplayPage();
    }
  });

  // Manual button event listener
  const manualBtn = document.getElementById("manual-btn");
  if (manualBtn) manualBtn.addEventListener("click", function() {
    const manualListContainer = document.getElementById('manual-list-container');
    const isManualMode = !manualListContainer.classList.contains('hide');
    
    if (isManualMode) {
      // Switch back to normal mode
      switchFromManualMode();
    } else {
      // Switch to manual mode
      switchToManualMode();
    }
  });

  // Function to play announcement for highlighted station based on current announcement state
  function playHighlightedStationAnnouncement() {
    if (!selectedStation) {
      runError.textContent = "Select a station first.";
      return false;
    }
    
    const announcementType = currentAnnouncementType;
    let displayText = '';
    let audioPath = null;
    
    console.log(`🎵 [PLAY HIGHLIGHTED] Playing ${announcementType} for highlighted station: ${selectedStation.name}`);
    
    switch (announcementType) {
      case 'TNS':
        // The Next Station announcement
        displayText = `The next station is ${selectedStation.name}`;
        audioPath = getAnnouncementAudioPath(selectedStation.name, 'nextStation');
        console.log(`   TNS announcement for: ${selectedStation.name}, path: ${audioPath}`);
        break;
      
      case 'MTG':
        // Mind The Gap announcement
        displayText = selectedStation.name + "... Please mind the gap between the train and the platform.";
        audioPath = getAnnouncementAudioPath(selectedStation.name, "mindTheGap");
        console.log(`   MTG announcement for: ${selectedStation.name}, path: ${audioPath}`);
        break;
      
      case 'form':
        // Form announcement
        displayText = `${selectedStation.name} station`;
        audioPath = getAnnouncementAudioPath(selectedStation.name, "form");
        console.log(`   Form announcement for: ${selectedStation.name}, path: ${audioPath}`);
        break;
      
      default:
        // Default to TNS if no current announcement state
        displayText = `The next station is ${selectedStation.name}`;
        audioPath = getAnnouncementAudioPath(selectedStation.name, 'nextStation');
        console.log(`   Defaulting to TNS for: ${selectedStation.name}, path: ${audioPath}`);
    }
    
    // Open display window if not already open or closed
    if (!displayWindow || displayWindow.closed) {
      displayWindow = qvasCreateInlineWindowTarget('AnnouncementDisplay');
    }
    
    // Send text to display window
    setTimeout(() => {
      displayWindow.postMessage(displayText, '*');
    }, 300);
    
    // Play audio if available
    if (audioPath) {
      setTimeout(() => {
        playAudio(audioPath);
      }, 500);
    }
    
    return true;
  }

  // Play button event: play announcements with audio
  const playBtn = document.getElementById("play-btn");
  if (playBtn) playBtn.addEventListener("click", function () {
    // Check if we're in manual mode
    const manualListContainer = document.getElementById('manual-list-container');
    const isManualMode = !manualListContainer.classList.contains('hide');
    
    if (isManualMode) {
      // Play selected manual announcement
      if (manualAnnouncements.length === 0) return;
      
      const announcement = manualAnnouncements[manualAnnouncementHighlightIndex];
      if (!announcement) return;
      
      // Always update PID display in manual mode when playing announcement
      updatePIDDisplay(announcement.station, announcement.type);
      
      // Open display window if not already open or closed
      if (!displayWindow || displayWindow.closed) {
        displayWindow = qvasCreateInlineWindowTarget('AnnouncementDisplay');
      }
      
      // Send text to display window
      setTimeout(() => {
        displayWindow.postMessage(announcement.text, '*');
      }, 300);
      
      // Play audio if available
      if (announcement.audioPath) {
        setTimeout(() => {
          playAudio(announcement.audioPath);
        }, 500);
      }
      return;
    }

    // Normal mode - play announcement for highlighted station
    const run = runInput.value.trim().toUpperCase();
    if (!validateRunNumber(run)) {
      runError.textContent = "Enter a valid run number first.";
      return;
    }
    if (!selectedStation) {
      runError.textContent = "Select a station to display.";
      return;
    }
    runError.textContent = "";

    // Play announcement for the highlighted station itself
    const displayText = selectedStation.name;
    const audioPath = getAnnouncementAudioPath(selectedStation.name, "next", selectedStation.name);
    console.log(`🎵 [PLAY BUTTON] Playing announcement for highlighted station: ${selectedStation.name}`);
    console.log(`🎵 [PLAY BUTTON] Audio path: "${audioPath}"`);

    // Open display window if not already open or closed
    if (!displayWindow || displayWindow.closed) {
      displayWindow = qvasCreateInlineWindowTarget('AnnouncementDisplay');
    }

    // Send text to display window
    setTimeout(() => {
      displayWindow.postMessage(displayText, '*');
    }, 300);
    
    // Play audio
    if (audioPath) {
      setTimeout(() => {
        playAudio(audioPath);
      }, 500);
    }
  });

  // Stop button event: stop scrolling in display window and stop audio
  const stopBtn = document.getElementById("stop-btn");
  if (stopBtn) stopBtn.addEventListener("click", function () {
    // Stop any playing audio
    manualStopAudio();
    
    // Clear display window
    if (displayWindow && !displayWindow.closed) {
      displayWindow.postMessage({ type: 'STOP' }, '*');
    }
  });
  
  // Station footer stop button
  const stationStopBtn = document.getElementById("station-stop-btn");
  if (stationStopBtn) stationStopBtn.addEventListener("click", function () {
    manualStopAudio();
    if (displayWindow && !displayWindow.closed) {
      displayWindow.postMessage({ type: 'STOP' }, '*');
    }
  });
  
  // Normal footer stop button
  const normalStopBtn = document.getElementById("normal-stop-btn");
  if (normalStopBtn) normalStopBtn.addEventListener("click", function () {
    manualStopAudio();
    if (displayWindow && !displayWindow.closed) {
      displayWindow.postMessage({ type: 'STOP' }, '*');
    }
  });
  
  // Startup footer stop button
  const startupStopBtn = document.getElementById("startup-stop-btn");
  if (startupStopBtn) startupStopBtn.addEventListener("click", function () {
    manualStopAudio();
    if (displayWindow && !displayWindow.closed) {
      displayWindow.postMessage({ type: 'STOP' }, '*');
    }
  });

  // Next button event: cycle through announcement types
  const nextBtn = document.getElementById("next-btn");
  if (nextBtn) nextBtn.addEventListener("click", function() {
    if (!selectedStation) {
      runError.textContent = "Select a station first.";
      return;
    }
    
    // Initialize current mode if not set
    if (!selectedStation.currentMode) {
      selectedStation.currentMode = "next";
    }
    
    // Cycle through modes: next -> mindTheGap -> next
    switch (selectedStation.currentMode) {
      case "next":
        selectedStation.currentMode = "mindTheGap";
        break;
      case "mindTheGap":
        selectedStation.currentMode = "next";
        break;
      default:
        selectedStation.currentMode = "next";
    }
    
    // Automatically play the new announcement
    playBtn.click();
  });

  function doorsUnlock() {
    // Send IPC message to sync HMI-O door state
    try {
      const { ipcRenderer } = require('electron');
      ipcRenderer.send('door-unlock');
    } catch (e) {
      // Running in browser context, no IPC available
    }
    
    // Update door cycle indicator (always, regardless of station selection)
    if (doorCycleDisplay) doorCycleDisplay.textContent = 'Y';
    
    // Play pending announcement if doors were locked and a station was selected
    if (pendingAnnouncementPath) {
      console.log(`🔓 Doors unlocked - playing pending announcement: ${pendingAnnouncementPath}`);
      setTimeout(() => {
        console.log(`🔓 [AUDIO] About to play: ${pendingAnnouncementPath}`);
        playAudio(pendingAnnouncementPath);
        pendingAnnouncementPath = null; // Clear after playing
      }, 300);
    } else {
      console.log(`🔓 Doors unlocked - no pending announcement queued`);
    }
    
    // Update remote state
    if (typeof updateAppState === 'function') {
      updateAppState({ doorCycle: 'Y' });
    }
    
    // Clear any existing timers
    if (cctvDisplayTimer) clearTimeout(cctvDisplayTimer);
    
    // Only switch to CCTV if feature is enabled, in normal mode and not already in CCTV
    const isNormalMode = !normalFooter.classList.contains('hide');
    const isCctvVisible = !cctvPanel.classList.contains('hide');
    if (cctvOnDoorUnlockEnabled && isNormalMode && !isCctvVisible && selectedStation) {
      // Show CCTV panel immediately (handles loading overlays with random delays)
      showCctvPanel();
    }
    
    // If waiting for door cycle to play mind the gap, play it now
    // But NOT if we're in Select Start Station Mode
    const isStationSelectMode = !stationFooter.classList.contains('hide');
    if (waitingForDoorCycleToPlayMindTheGap && selectedStation && !isStationSelectMode) {
      waitingForDoorCycleToPlayMindTheGap = false;
      playMindTheGap();
      return;
    }
    
    // If no station selected, just update indicator and return silently
    if (!selectedStation) {
      return;
    }
    
    // Don't play announcement if in Select Start Station Mode
    if (isStationSelectMode) {
      return;
    }
    runError.textContent = "";
    
    // Clear any existing timers when unlocking doors
    clearProgressTimers();
    
    // Check if at first station - if so, play Form announcement instead of MTG
    const isAtFirstStation = (currentStations.length > 0 && selectedStation === currentStations[0]);
    
    if (isAtFirstStation) {
      // At first station: play Form announcement for destination
      const destinationStation = currentStations[currentStations.length - 1].name;
      
      selectedStation.currentMode = "form";
      updatePIDDisplay(destinationStation, 'form');
      
      let displayText = `${destinationStation} station`;
      let audioPath = getAnnouncementAudioPath(destinationStation, "form");
      
      console.log(`🚪 [DOOR UNLOCK AT FIRST STATION] Playing Form for: ${destinationStation}`);
      console.log(`   Audio path: ${audioPath}`);
      
      // Store for potential replay via Play button
      currentAnnouncementAudioPath = audioPath;
      currentAnnouncementDisplayText = displayText;
      currentAnnouncementType = 'form';
      
      // Open display window if not already open or closed
      if (!displayWindow || displayWindow.closed) {
        displayWindow = qvasCreateInlineWindowTarget('AnnouncementDisplay');
      }
      
      // Send text to display window
      setTimeout(() => {
        displayWindow.postMessage(displayText, '*');
      }, 300);
      
      // Play audio if available
      if (audioPath) {
        setTimeout(() => {
          playAudio(audioPath);
        }, 500);
      }
      return;
    }
    
    // Normal case: play Mind The Gap announcement
    selectedStation.currentMode = "mindTheGap";
    
    // Update PID display with Mind The Gap announcement state
    updatePIDDisplay(selectedStation.name, 'MTG');
    
    // Generate Mind The Gap announcement dynamically
    let displayText = selectedStation.name + "... Please mind the gap between the train and the platform.";
    let audioPath = getAnnouncementAudioPath(selectedStation.name, "mindTheGap");
    
    console.log(`🚪 [DOOR UNLOCK] Playing MTG for: ${selectedStation.name}`);
    console.log(`   Audio path: ${audioPath}`);

    // Store for potential replay via Play button
    currentAnnouncementAudioPath = audioPath;
    currentAnnouncementDisplayText = displayText;
    currentAnnouncementType = 'MTG';

    // Open display window if not already open or closed
    if (!displayWindow || displayWindow.closed) {
      displayWindow = qvasCreateInlineWindowTarget('AnnouncementDisplay');
    }

    // Send text to display window
    setTimeout(() => {
      displayWindow.postMessage(displayText, '*');
    }, 300);
    
    // Key 3: play the opening beep at the same time as the station + Mind The Gap announcement
    if (audioPath) {
      setTimeout(() => {
        playDoorBeepUnderAnnouncement(getDoorSoundPath('open'), audioPath);
      }, 500); // Small delay to ensure display window is ready
    }
  }

  // Doors Unlock button event (if button exists)
  const doorsBtn = document.getElementById("doors-btn");
  if (doorsBtn) doorsBtn.addEventListener("click", doorsUnlock);

  // Timers for door cycle sequence
  let doorCycleSequenceTimer1 = null; // 10 second wait timer
  let doorCycleSequenceTimer2 = null; // 20 second wait timer
  let doorLockInProgress = false; // Flag to prevent overlapping timer setups
  
  // Helper function to clear all door cycle timers
  function clearDoorCycleTimers() {
    if (doorCycleSequenceTimer1) {
      clearTimeout(doorCycleSequenceTimer1);
      doorCycleSequenceTimer1 = null;
    }
    if (doorCycleSequenceTimer2) {
      clearTimeout(doorCycleSequenceTimer2);
      doorCycleSequenceTimer2 = null;
    }
    doorLockInProgress = false; // Reset lock flag when clearing
  }

  // Global variables for automatic progression
  let stationProgressTimer = null;
  let announcementTimer = null;
  let waitingForDoorCycleToPlayMindTheGap = false;

  // Function to clear all timers
  function clearProgressTimers() {
    if (stationProgressTimer) {
      clearTimeout(stationProgressTimer);
      stationProgressTimer = null;
    }
    if (announcementTimer) {
      clearTimeout(announcementTimer);
      announcementTimer = null;
    }
  }

  // Function to select next station automatically (skipping skipped stations)
  function selectNextStation() {
    if (!currentStations.length || !selectedStation) return;

    const currentIndex = currentStations.findIndex(station => station === selectedStation);
    if (currentIndex >= 0 && currentIndex < currentStations.length - 1) {
      // Find next non-skipped station
      let nextIndex = currentIndex + 1;
      while (nextIndex < currentStations.length && currentStations[nextIndex].skipped) {
        nextIndex++;
      }

      if (nextIndex < currentStations.length) {
        const nextStation = currentStations[nextIndex];
        selectedStation = nextStation;
        selectedStation.currentMode = "next";
        currentHighlightIndex = nextIndex;

        // Update UI to show selected station
        document.querySelectorAll("#station-list li").forEach((el) => el.classList.remove("selected"));
        const stationElements = document.querySelectorAll("#station-list li");
        if (stationElements[nextIndex]) {
          stationElements[nextIndex].classList.add("selected");
        }

        // Update skip button
        updateSkipButton();

        // Update closest station in auto-adapt mode (door timer progression)
        if (!manualClosestStationMode) {
          closestStationIndex = nextIndex;
          updateClosestStationTag();
        }
      }
    }
  }

  // Function to play next station announcement automatically
  function playNextAnnouncement() {
    if (selectedStation && selectedStation.currentMode === "next") {
      playBtn.click();
    }
  }
  
  function doorsLock() {
    // Send IPC message to sync HMI-O door state
    try {
      const { ipcRenderer } = require('electron');
      ipcRenderer.send('door-lock');
    } catch (e) {
      // Running in browser context, no IPC available
    }
    
    // Update door cycle indicator (always, regardless of station selection)
    if (doorCycleDisplay) doorCycleDisplay.textContent = 'N';

    // Key 6: play the correct doors closing announcement (NGR or older train)
    playAudio(getDoorSoundPath('close'));
    
    // Clear PID indicator and announcement state
    if (pidDisplay) pidDisplay.textContent = '-';
    currentAnnouncementAudioPath = null;
    currentAnnouncementDisplayText = null;
    currentAnnouncementType = null;
    
    // Update remote state
    if (typeof updateAppState === 'function') {
      updateAppState({ doorCycle: 'N' });
    }
    
    // Clear any existing timers
    if (cctvDisplayTimer) clearTimeout(cctvDisplayTimer);
    
    // If CCTV panel is currently visible, exit it with 5 second delay
    const isCctvVisible = !cctvPanel.classList.contains('hide');
    if (isCctvVisible && selectedStation) {
      cctvDisplayTimer = setTimeout(() => {
        // Hide CCTV panel
        cctvPanel.classList.add('hide');
        
        // Show header and header row 2
        const header = document.querySelector('.header');
        const headerRow2 = document.querySelector('.header-row-2');
        if (header) header.classList.remove('hide');
        if (headerRow2) headerRow2.classList.remove('hide');
        
        // Reset loading overlays for next time
        for (let i = 1; i <= 4; i++) {
          const loading = document.getElementById(`camera-loading-${i}`);
          if (loading) loading.classList.remove('hidden');
        }
        
        // Show main panel and normal footer
        mainPanel.classList.remove('hide');
        normalFooter.classList.remove('hide');
        helperBar.textContent = 'Use Up/Down to navigate. Play to announce.';
      }, 5000); // 5 second delay before hiding CCTV
    }
    
    // Mark doors as cycled (unlock->lock complete)
    doorsCycled = true;
    
    // If no station selected, just update the indicator and return
    if (!selectedStation) {
      return;
    }
    
    // Clear display window
    if (displayWindow && !displayWindow.closed) {
      displayWindow.postMessage({ type: 'RESET' }, '*');
    }
    
    // Clear any existing timers
    clearProgressTimers();
    
    // Set timer to select next station after 10 seconds
    stationProgressTimer = setTimeout(() => {
      selectNextStation();
      
      // Set timer to play next station announcement after 30 seconds total
      announcementTimer = setTimeout(() => {
        playNextAnnouncement();
      }, 20000); // 20 more seconds (10 + 20 = 30 total)
    }, 10000); // 10 seconds
  }

  // Doors Lock button event (if button exists)
  const doorsLockBtn = document.getElementById("doors-lock-btn");
  if (doorsLockBtn) doorsLockBtn.addEventListener("click", doorsLock);

  // Common reset function
  function resetAll() {
    // Clear any door cycle sequence timers
    clearDoorCycleTimers();
    
    // Reset door cycle state
    doorsCycled = false;
    
    // Reset UI state
    runInput.value = '';
    runNumberDisplay.textContent = '_ _ _ _';
    runError.textContent = '';
    selectedStation = null;
    currentDestination = null;
    currentDestinationStation = null; // Reset global
    currentStation = null;
    currentStations = [];
    currentHighlightIndex = 0;
    renderStations(currentStations);
    
    // Reset PID and DI displays
    if (pidDisplay) pidDisplay.textContent = '-';
    if (diDisplay) diDisplay.textContent = '-';
    
    // Switch back to startup mode
    switchToStartupMode();
    
    // Reset display window
    if (displayWindow && !displayWindow.closed) {
      displayWindow.postMessage({ type: 'RESET' }, '*');
    }
    // Reset destination board
    if (destinationWindow && !destinationWindow.closed) {
      destinationWindow.postMessage({ type: 'RESET' }, '*');
    }
  }

  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) resetBtn.addEventListener("click", function(e) {
    // Check if we're in station code entry mode
    if (!stationCodeModeContainer.classList.contains('hide')) {
      // Close station code mode instead of resetting
      e.preventDefault();
      e.stopPropagation();
      closeStationCodeKeyboard();
      return;
    } else {
      // Check if we're in manual mode
      const manualListContainer = document.getElementById('manual-list-container');
      const isManualMode = !manualListContainer.classList.contains('hide');
      if (isManualMode) {
        // Close manual mode instead of resetting
        e.preventDefault();
        e.stopPropagation();
        switchFromManualMode();
        return;
      } else {
        // Normal reset behavior
        resetAll();
      }
    }
  });
  
  const stationResetBtn = document.getElementById("station-reset-btn");
  if (stationResetBtn) stationResetBtn.addEventListener("click", function(e) {
    // Check if we're in station code entry mode
    if (!stationCodeModeContainer.classList.contains('hide')) {
      // Close station code mode instead of resetting
      e.preventDefault();
      e.stopPropagation();
      closeStationCodeKeyboard();
      return;
    } else {
      // Check if we're in manual mode
      const manualListContainer = document.getElementById('manual-list-container');
      const isManualMode = !manualListContainer.classList.contains('hide');
      if (isManualMode) {
        // Close manual mode instead of resetting
        e.preventDefault();
        e.stopPropagation();
        switchFromManualMode();
        return;
      } else {
        // Normal reset behavior
        resetAll();
      }
    }
  });
  
  const normalResetBtn = document.getElementById("normal-reset-btn");
  if (normalResetBtn) normalResetBtn.addEventListener("click", function(e) {
    // Check if we're in station code entry mode
    if (!stationCodeModeContainer.classList.contains('hide')) {
      // Close station code mode instead of resetting
      e.preventDefault();
      e.stopPropagation();
      closeStationCodeKeyboard();
      return;
    } else {
      // Check if we're in manual mode
      const manualListContainer = document.getElementById('manual-list-container');
      const isManualMode = !manualListContainer.classList.contains('hide');
      if (isManualMode) {
        // Close manual mode instead of resetting
        e.preventDefault();
        e.stopPropagation();
        switchFromManualMode();
        return;
      } else {
        // Normal reset behavior
        resetAll();
      }
    }
  });

  // Service Selection Button
  const servSelBtn = document.getElementById("serv-sel-btn");
  const servicePanel = document.getElementById("service-selection-panel");
  const serviceList = document.getElementById("service-list");
  const serviceCloseBtn = document.getElementById("service-selection-close");
  const serviceSearchInput = document.getElementById("service-search-input");
  
  let allServices = []; // Store all available services
  
  function populateServiceList(searchTerm = '') {
    document.getElementById("service-list").innerHTML = ''; // Clear existing list
    
    // Get all unique routes from GTFS data
    if (!globalGTFSData || !globalGTFSData.routes) {
      const li = document.createElement('li');
      li.style.cssText = 'padding: 15px; text-align: center; color: #888; background: #111;';
      li.textContent = 'No services available';
      document.getElementById("service-list").appendChild(li);
      return;
    }
    
    const routesByCode = {};
    
    // Group routes by their short name (route code) and get origin/destination info
    for (const [routeId, routeData] of Object.entries(globalGTFSData.routes)) {
      const routeCode = routeData.route_name || routeId.split('-')[0];
      const fullRouteId = routeId;
      
      if (!routesByCode[routeCode]) {
        routesByCode[routeCode] = {
          code: routeCode,
          fullId: fullRouteId,
          origin: '',
          destination: '',
          variants: []
        };
      }
      
      // Get origins and destinations from patterns
      if (routeData.patterns && Array.isArray(routeData.patterns)) {
        routeData.patterns.forEach((pattern, idx) => {
          if (pattern.stops && pattern.stops.length > 0) {
            const orig = pattern.stops[0].name;
            const dest = pattern.destination || pattern.stops[pattern.stops.length - 1].name;
            
            if (idx === 0) {
              routesByCode[routeCode].origin = orig;
              routesByCode[routeCode].destination = dest;
            }
            
            routesByCode[routeCode].variants.push({
              destination: dest,
              origin: orig
            });
          }
        });
      }
    }
    
    // Convert to array and filter by search term
    const servicesList = Object.values(routesByCode)
      .sort((a, b) => a.code.localeCompare(b.code))
      .filter(service => {
        const searchLower = searchTerm.toLowerCase();
        const searchText = `${service.code} ${service.origin} ${service.destination}`.toLowerCase();
        return searchText.includes(searchLower);
      });
    
    // Render filtered list
    if (servicesList.length === 0) {
      const li = document.createElement('li');
      li.style.cssText = 'padding: 15px; text-align: center; color: #888; background: #111;';
      li.textContent = 'No matching services';
      document.getElementById("service-list").appendChild(li);
      return;
    }
    
    servicesList.forEach((service, idx) => {
      const li = document.createElement('li');
      
      // Format: "FGBN - Ferny Grove - Beenleigh"
      const displayText = `${service.code} - ${service.origin} - ${service.destination}`;
      
      li.textContent = displayText;
      li.title = `Route: ${service.code}\nOrigin: ${service.origin}\nDestination: ${service.destination}`;
      
      li.addEventListener('click', () => {
        // Select this service's route code
        runInput.value = service.code + '1'; // Default to first digit
        closeServicePanel();
        console.log(`✅ Service selected: ${service.code}`);
      });
      
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          runInput.value = service.code + '1';
          closeServicePanel();
        }
      });
      
      document.getElementById("service-list").appendChild(li);
    });
  }
  
  // Electron global keyboard shortcuts (only in Electron environment)
  if (typeof require !== 'undefined') {
    try {
      const { ipcRenderer } = require('electron');
      
      console.log('🎯 [RENDERER] Setting up global key listener...');
      
      // Listen for global keyboard events from main process
      ipcRenderer.on('global-key', (event, key) => {
        console.log(`🔑 [RENDERER] Global key pressed: ${key}`);
        
        switch(key) {
          case '3':
            console.log('🔓 [RENDERER] Triggering doorsUnlock()');
            doorsUnlock(); // Unlock doors
            break;
          case '4':
            console.log('📢 [RENDERER] Triggering playArrivalAnnouncement()');
            if (typeof playArrivalAnnouncement === 'function') {
              playArrivalAnnouncement();
            }
            break;
          case '6':
            console.log('🔒 [RENDERER] Triggering doorsLock()');
            doorsLock(); // Trigger door lock
            break;
          case '7':
            console.log('📣 [RENDERER] Triggering playNextStation()');
            if (typeof playNextStation === 'function') {
              playNextStation();
            }
            break;
          default:
            console.log(`⚠️ [RENDERER] Unmapped key: ${key}`);
        }
      });
      
      console.log('✅ [RENDERER] Global key listener ready');
    } catch (e) {
      console.error('❌ [RENDERER] Error setting up keyboard listener:', e);
      console.log('Not running in Electron environment');
    }
  } else {
    console.log('⚠️ [RENDERER] require is not available - Electron not detected');
  }

  // Local keyboard shortcuts (for when app is focused)
  // Function to play arrival announcement
  function playArrivalAnnouncement() {
    console.log('🔊 Playing arrival announcement for selected station');
    
    if (!selectedStation) {
      console.log('✗ No station selected');
      return;
    }
    
    // Disable arrival announcements for the first station
    if (isFirstStation(selectedStation)) {
      console.log(`⚠️  Skipping arrival announcement - ${selectedStation.name} is the first station`);
      return;
    }
    
    // Update PID display with arrival state
    updatePIDDisplay(selectedStation.name, 'NAA');
    
    const displayText = `Now arriving at ${selectedStation.name}`;
    const audioPath = getAnnouncementAudioPath(selectedStation.name, "arrival");
    
    console.log(`  Station: ${selectedStation.name}`);
    console.log(`  Audio path: ${audioPath}`);
    
    // Store for potential replay via Play button
    currentAnnouncementAudioPath = audioPath;
    currentAnnouncementDisplayText = displayText;
    currentAnnouncementType = 'NAA';
    isPlayingArrivalAnnouncement = true; // Set flag to indicate we're playing an arrival announcement
    console.log(`  ✅ isPlayingArrivalAnnouncement set to TRUE - shouldPlayExitButtons=${shouldPlayExitButtons}`);
    
    // Open display window if not already open or closed
    if (!displayWindow || displayWindow.closed) {
      displayWindow = qvasCreateInlineWindowTarget('AnnouncementDisplay');
    }

    // Send text to display window with proper DI format
    setTimeout(() => {
      displayWindow.postMessage({
        type: 'DI',
        destination: displayText,
        customText: '',
        useCustomText: false,
        scroller: false,
        persistent: true
      }, '*');
    }, 300);
    
    // Play audio if available
    if (audioPath) {
      setTimeout(() => {
        playAudio(audioPath);
      }, 500);
    }
  }

  // Global keyboard listener disabled - using Python keyboard_listener.py instead
  // This prevents duplicate key presses when both Electron and Python listeners are active
  /*
  document.addEventListener('keydown', function(event) {
    // Send ALL key presses to Flask backend for HMI-C remote interface
    const keyInfo = {
      key: event.key,
      keyCode: event.keyCode,
      code: event.code,
      timestamp: Date.now()
    };
    
    console.log(`🔑 Global Keyboard Listener: Key pressed: ${event.key} (keyCode: ${event.keyCode})`);
    
    // POST key press to Flask backend
    fetch('http://localhost:5000/api/key-press', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(keyInfo)
    })
    .then(response => {
      if (response.ok) {
        console.log(`📤 Key sent to Flask backend:`, keyInfo);
      } else {
        console.warn(`⚠️ Flask backend returned error:`, response.status);
      }
    })
    .catch(err => {
      console.error(`❌ Failed to send key to Flask:`, err);
    });
    
    // Prevent default for all keys to ensure only remote processing
    event.preventDefault();
  });
  */

  // iPhone/touch replacements for the old physical keys 3, 4, 6 and 7.
  function qvasTriggerActionKey(key) {
    const normalized = String(key || '').toLowerCase().replace('numpad ', '');
    console.log(`📱 Touch/global action triggered: ${normalized}`);

    switch (normalized) {
      case '3':
        if (typeof doorsUnlock === 'function') doorsUnlock();
        break;
      case '4':
        if (typeof playArrivalAnnouncement === 'function') playArrivalAnnouncement();
        break;
      case '6':
        if (typeof doorsLock === 'function') doorsLock();
        break;
      case '7':
        if (typeof playNextStation === 'function') playNextStation();
        break;
    }
  }

  window.qvasTriggerActionKey = qvasTriggerActionKey;

  function wireIphoneActionButton(id, key) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const run = (event) => {
      event.preventDefault();
      event.stopPropagation();
      qvasTriggerActionKey(key);
    };
    btn.addEventListener('click', run);
    btn.addEventListener('touchstart', run, { passive: false });
  }

  wireIphoneActionButton('iphone-action-3', '3');
  wireIphoneActionButton('iphone-action-4', '4');
  wireIphoneActionButton('iphone-action-6', '6');
  wireIphoneActionButton('iphone-action-7', '7');

  // Keep the same keys working on laptop while testing.
  document.addEventListener('keydown', (event) => {
    const key = event.key && event.key.toLowerCase();
    if (['3', '4', '6', '7'].includes(key)) {
      event.preventDefault();
      qvasTriggerActionKey(key);
    }
  });

  // Day Selector Toggle Functionality
  const dayButtons = document.querySelectorAll('.day-btn');
  const mfBtn = document.getElementById('mf-btn');
  const satBtn = document.getElementById('sat-btn');
  const sunBtn = document.getElementById('sun-btn');
  const holidayBtn = document.getElementById('holiday-btn');
  
  // Auto-select day based on current date
  function selectCurrentDay() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1-5 = Mon-Fri, 6 = Saturday
    
    // Clear all selections first
    dayButtons.forEach(btn => btn.classList.remove('selected'));
    
    // Select appropriate button based on day
    if (dayOfWeek === 0) {
      // Sunday
      if (sunBtn) sunBtn.classList.add('selected');
    } else if (dayOfWeek === 6) {
      // Saturday
      if (satBtn) satBtn.classList.add('selected');
    } else {
      // Monday - Friday
      if (mfBtn) mfBtn.classList.add('selected');
    }
  }
  
  // Select current day on load
  selectCurrentDay();
  
  dayButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove selected class from all day buttons
      dayButtons.forEach(btn => btn.classList.remove('selected'));
      // Add selected class to clicked button
      this.classList.add('selected');
      // Update route preview with new day
      if (typeof updateRouteDisplay === 'function') {
        updateRouteDisplay();
      }
    });
  });

  // Touch Keyboard Functionality
  const runNumberInput = document.getElementById('run-number');
  // Only select keyboard buttons from the MAIN touch keyboard, not from station code keyboard
  const keyboardButtons = document.querySelectorAll('#touch-keyboard.touch-keyboard .key-btn');
  const routeDisplay = document.getElementById('run-number-display');
  const routePreview = document.getElementById('route-preview');
  const backBtn = document.getElementById('back-btn');
  
  // Official Queensland Rail station codes
  const stationAbbreviations = {
    // A
    'Airport Junction': 'AJN',
    'Albion': 'AIN',
    'Alderley': 'ADY',
    'Altandi': 'ATI',
    'Allocations Roster': 'ALR',
    'Ascot': 'ACO',
    'Auchenflower': 'AHF',
    // B
    'Bald Hills': 'BDS',
    'Banoon': 'BOO',
    'Banyo': 'BQY',
    'Banyo Yard': 'BYY',
    'Beenleigh': 'BNH',
    'Beenleigh Yard': 'BNY',
    'Beenleigh Middle Road': 'BNT',
    'Beerburrum': 'BEB',
    'Beerwah': 'BWH',
    'Bethania': 'BTI',
    'Bindha': 'BHA',
    'Birkdale': 'BDE',
    'Boondall': 'BZL',
    'Booval': 'BOV',
    'Bowen Hills': 'BHI',
    'Box Flat': 'BOX',
    'Bray Park': 'BPR',
    'Bundamba': 'BDX',
    'Buranda': 'BRD',
    'Burpengary': 'BPY',
    // C
    'Caboolture': 'CAB',
    'Caboolture Yard': 'CAY',
    'Campbell Street': 'CAM',
    'Cannon Hill': 'CNQ',
    'Carseldine': 'CDE',
    'Central': 'BNC',
    'Chelmer': 'CMZ',
    'Clapham': 'CPM',
    'Clayfield': 'CYF',
    'Cleveland': 'CVN',
    'Coomera': 'CXM',
    'Coopers Plains': 'CEP',
    'Cooran': 'COZ',
    'Cooroy': 'COO',
    'Coorparoo': 'CRO',
    'Corinda': 'CQD',
    // D
    'Dakabin': 'DKB',
    'Darra': 'DAR',
    'Deagon': 'DEG',
    'Dinmore': 'DIR',
    'Domestic Terminal': 'BDT',
    'Domestic Airport': 'BDT',
    'Doomben': 'DBN',
    'Dutton Park': 'DUP',
    // E
    'Eagle Junction': 'EGJ',
    'East Ipswich': 'EIP',
    'Ebbw Vale': 'EBV',
    'Edens Landing': 'EDL',
    'Mayne Complex - Balloon': 'ETB',
    'Mayne Complex - Fly Over': 'ETF',
    'Mayne Complex - South': 'ETS',
    'Elimbah': 'EMH',
    'Elimbah Yard': 'EMY',
    'Ellen Grove': 'EGE',
    'Enoggera': 'EGG',
    'Eudlo': 'EUD',
    'Eumundi': 'EUM',
    'Exhibition': 'EXH',
    // F
    'Fairfield': 'FFI',
    'Ferny Grove': 'FYG',
    "Fisherman's Island": 'FIS',
    'Fortitude Valley': 'BRC',
    'Fruitgrove': 'FTG',
    // G
    'Gailes': 'GAI',
    'Gaythorne': 'GAO',
    'Geebung': 'GEB',
    'Glanmire': 'GMR',
    'Glass House Mtns': 'GSS',
    'Glass House Mountains': 'GSS',
    'Goodna': 'GDQ',
    'Graceville': 'GVQ',
    'Grovely': 'GOQ',
    'Gympie North': 'GYN',
    'Gympie North Yard': 'GYY',
    // H
    'Helensvale': 'HLN',
    'Hemmant': 'HMM',
    'Hendra': 'HDR',
    'Holmview': 'HVW',
    // I
    'Indooroopilly': 'IDP',
    'International Terminal': 'BIT',
    'International Airport': 'BIT',
    'Ipswich': 'IPS',
    'Ipswich Yard': 'IPY',
    'Ipswich Workshops': 'IPW',
    // K
    'Kallangur': 'KGR',
    'Karrabin': 'KRA',
    'Keperra': 'KEP',
    'Kingston': 'KGT',
    'Kippa-Ring Yard': 'KPY',
    'Kippa-Ring': 'KPR',
    'Kuraby': 'KRY',
    // L
    'Landsborough': 'LSH',
    'Lawnton': 'LWO',
    'Lindum': 'LDM',
    'Loganlea': 'LGL',
    'Lota': 'LOT',
    'Lytton Junction': 'LJN',
    // M
    'Mango Hill': 'MGH',
    'Mango Hill East': 'MGE',
    'Manly': 'MNY',
    'Maryborough': 'MBJ',
    'Mayne': 'MNE',
    'Mayne Junction': 'MYJ',
    'Mayne Complex - Diesel Locomotive Prov Shed': 'DLP',
    'Electric Train Depot': 'ETD',
    'Old Mayne Yard': 'MYD',
    'Milton': 'MTZ',
    'Mitchelton': 'MHQ',
    'Moolabin': 'MBN',
    'Mooloolah': 'MOH',
    'Moorooka': 'MQK',
    'Morayfield': 'MYE',
    'Morningside': 'MGS',
    'Murarrie': 'MJE',
    'Murrumba Downs': 'MRD',
    // N
    'Nambour': 'NBR',
    'Nambour Yard': 'NBS',
    'Narangba': 'NRB',
    'Nerang': 'NRG',
    'Newmarket': 'NWM',
    'Norman Park': 'NPR',
    'Normanby': 'NBY',
    'Normanby Car Wash': 'NCW',
    'North Boondall': 'NBD',
    'Northgate': 'NTG',
    'Nudgee': 'NUD',
    'Nundah': 'NND',
    // O
    'Ormeau': 'ORM',
    'Ormiston': 'ORO',
    'Oxford Park': 'OXP',
    'Oxley': 'OXL',
    // P
    'Palmwoods': 'PAL',
    'Park Road': 'PKR',
    'Petrie': 'PET',
    'Petrie Yard': 'PEY',
    'Pinkenba': 'PNK',
    'Pomona': 'PMQ',
    // R
    'Redbank': 'RDK',
    'Redbank Workshops': 'RKW',
    'Redbank Yard': 'RDY',
    'Richlands': 'RHD',
    'Riverview': 'RVV',
    'Robina': 'ROB',
    'Robina Yard': 'ROY',
    'Rocklea': 'RKE',
    'Rocklea Siding': 'RKY',
    'Roma Street': 'RST',
    'Rosewood': 'RSW',
    'Rothwell': 'RWL',
    'Runcorn': 'RUC',
    // S
    'Salisbury': 'SLY',
    'Sandgate': 'SGE',
    'Sherwood': 'SHW',
    'Shorncliffe': 'SHC',
    'Shorncliffe Dead End': 'SHT',
    'South Bank': 'SBA',
    'South Brisbane': 'SBE',
    'Springfield': 'SFD',
    'Springfield Central': 'SFC',
    'Strathpine': 'SPN',
    'Sunnybank': 'SYK',
    'Sunrise': 'SSE',
    'Sunshine': 'SSN',
    // T
    'Taringa': 'TIQ',
    'Tennyson': 'TNY',
    'Thagoona': 'TAO',
    'Thomas Street': 'THS',
    'Thorneside': 'TNS',
    'Toombul': 'TBU',
    'Toowong': 'TWG',
    'Traveston': 'TRA',
    'Trinder Park': 'TDP',
    // V
    'Varsity Lakes': 'VYS',
    'Varsity Lakes Dead End': 'VYT',
    'Virginia': 'VGI',
    // W
    'Wacol': 'WAC',
    'Walloon': 'WOQ',
    'Wellington Point': 'WPT',
    'Wilston': 'WLQ',
    'Windsor': 'WID',
    'Woodridge': 'WOI',
    'Wooloowin': 'WWI',
    'Woombye': 'WOB',
    'Woombye Yard': 'WOY',
    'Woondum': 'WOO',
    'Wulkuraka': 'WUL',
    'Wulkuraka Yard': 'WUY',
    'Wynnum': 'WNM',
    'Wynnum Central': 'WNC',
    'Wynnum North': 'WYH',
    // Y
    'Yandina': 'YAN',
    'Yeerongpilly': 'YLY',
    'Yeronga': 'YRG',
    // Z
    'Zillmere': 'ZLL'
  };
  
  function getStationAbbrev(stationName) {
    return stationAbbreviations[stationName] || stationName.substring(0, 3).toUpperCase();
  }

  // ==================== Express Route Patterns ====================
  // Add express patterns here. Format: 'RUN_CODE': 'pattern description'
  // Pattern format examples:
  //   'EXP MLT-INR' = Express from Milton to Indooroopilly
  //   'EXP MLT-INR,INR-DAR' = Express Milton-Indooroopilly, then Express Indooroopilly-Darra
  //   'EXP MGS-MNY' = Express from Morningside to Manly
  // 
  // You can also use line names as fallback patterns
  const expressPatterns = {
    // Rosewood Line
    'D6X2': 'EXP MLT-INR-DAR',  // Express Milton to Indooroopilly, then express to Darra
    '1E35': '(ALL STATIONS)',  // Express Milton to Indooroopilly, then express to Darra
    // Cleveland Line
    'D8X2': 'EXP MGS-MNY',  // Express Morningside to Manly
    
    // Add more routes here...
    // 'XXXX': 'EXP XXX-XXX',
  };
  
  // Fallback patterns by line (used if specific run code not found)
  const lineExpressPatterns = {
    'Rosewood': 'EXP MLT-DAR',
    'Cleveland': 'EXP MGS-MNY',
    'Ferny Grove': 'EXP',
    'Caboolture': 'EXP',
    'Sunshine Coast': 'EXP',
    'Gold Coast': 'EXP',
    'Beenleigh': 'EXP',
    'Springfield': 'EXP',
    'Airport': 'EXP',
    'Doomben': 'EXP',
    'Shorncliffe': 'EXP',
    'Redcliffe': 'EXP',
  };

  function updateRouteDisplay() {
    const value = runNumberInput.value;
    if (value.length === 0) {
      routeDisplay.textContent = '_ _ _ _';
      if (routePreview) routePreview.textContent = '';
    } else {
      // Show entered characters with underscores for remaining slots
      const chars = value.split('');
      const display = [];
      for (let i = 0; i < 4; i++) {
        display.push(chars[i] || '_');
      }
      routeDisplay.textContent = display.join(' ');
      
      // Show preview if we have a valid 4-character run code
      if (value.length === 4 && routePreview) {
        const runInfo = parseRunCode(value);
        if (runInfo) {
          // Get selected day type
          const selectedDayBtn = document.querySelector('.day-btn.selected');
          let dayCode = 'M-F';
          if (selectedDayBtn) {
            if (selectedDayBtn.id === 'sat-btn') dayCode = 'SAT';
            else if (selectedDayBtn.id === 'sun-btn') dayCode = 'SUN';
            else if (selectedDayBtn.id === 'holiday-btn') dayCode = 'PH';
          }
          
          const runCode = value.toUpperCase();
          let firstStationCode = 'N/A';
          let lastStationCode = 'N/A';
          
          // Get first and last station codes from GTFS route data using fast lookup
          if (runCodeIndex && runCodeIndex[runCode]) {
            const routeData = runCodeIndex[runCode];
            const patterns = Array.isArray(routeData.patterns) ? routeData.patterns : [];
            if (patterns.length > 0) {
              const mainPattern = patterns[0];
              if (mainPattern.stops && Array.isArray(mainPattern.stops)) {
                const firstStation = mainPattern.stops[0];
                const lastStation = mainPattern.stops[mainPattern.stops.length - 1];
                firstStationCode = getStationAbbrev(firstStation.name);
                lastStationCode = getStationAbbrev(lastStation.name);
              }
            }
          }
          
          // Build pattern description
          let patternDesc;
          if (runInfo.isExpress) {
            // Check for specific run code pattern first
            if (expressPatterns[runCode]) {
              patternDesc = expressPatterns[runCode];
            } else if (lineExpressPatterns[runInfo.line]) {
              // Fall back to line-based pattern
              patternDesc = lineExpressPatterns[runInfo.line];
            } else {
              patternDesc = 'EXP';
            }
          } else {
            patternDesc = 'ALL STOPS';
          }
          
          // Format: M-F-BHI-RSW (EXP)
          routePreview.textContent = `${dayCode}-${firstStationCode}-${lastStationCode} (${patternDesc})`;
        } else {
          routePreview.textContent = '';
        }
      } else if (routePreview) {
        routePreview.textContent = '';
      }
    }
  }

  // Back button acts as backspace
  if (backBtn) {
    backBtn.addEventListener('click', function(event) {
      event.preventDefault();
      const currentValue = runNumberInput.value;
      runNumberInput.value = currentValue.slice(0, -1);
      
      // Update remote state
      if (typeof updateAppState === 'function') {
        updateAppState({ inputValue: runNumberInput.value });
      }
      
      updateRouteDisplay();
      
      // Update manual button and enter button color based on input
      updateRouteInputUI();
      
      // Clear any previous errors when deleting
      const errorDiv = document.getElementById('run-error');
      if (errorDiv) {
        errorDiv.textContent = '';
      }
    });
  }

  keyboardButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      const key = this.getAttribute('data-key');
      const currentValue = runNumberInput.value;

      if (key === 'BACKSPACE') {
        runNumberInput.value = currentValue.slice(0, -1);
      } else if (key === 'CLEAR') {
        runNumberInput.value = '';
      } else if (key && currentValue.length < 4) {
        runNumberInput.value = currentValue + key;
      }

      // Update remote state
      if (typeof updateAppState === 'function') {
        updateAppState({ inputValue: runNumberInput.value });
      }

      // Update the route display in header
      updateRouteDisplay();
      
      // Update manual button and enter button color based on input
      updateRouteInputUI();

      // Clear any previous errors when typing
      const errorDiv = document.getElementById('run-error');
      if (errorDiv) {
        errorDiv.textContent = '';
      }
      
      console.log('Key pressed:', key, 'Current value:', runNumberInput.value);
    });
  });

  // Allow the input to be clicked to show it's active, but prevent typing
  runNumberInput.addEventListener('keydown', function(event) {
    // Prevent all keyboard input on this field - only HMI-C global listener processes keys
    event.preventDefault();
    console.log(`⌨️ Input field key press blocked - relying on global keyboard listener only`);
  });

  // ==================== Fn Settings Panel ====================
  const fnBtn = document.getElementById('fn-btn');
  const fnPanel = document.getElementById('fn-panel');
  const fnFooter = document.getElementById('fn-footer');
  const fnExitBtn = document.getElementById('fn-exit-btn');
  const mainRightPanel = document.getElementById('main-right-panel');
  const fnRightPanel = document.getElementById('fn-right-panel');
  const mainPanel = document.querySelector('.main-panel');
  
  // Track which footer was active before Fn
  let previousFooter = null;
  
  // Volume values
  let brightnessValue = 100;
  let handsetValue = 50;
  let cabinVolume = 50;
  
  const trackHeight = 280; // matches CSS
  const handleHeight = 40; // matches CSS
  
  // ==================== Audio Output Device Selection ====================
  // Function to enumerate and update audio devices
  async function updateAudioDeviceList() {
    const select = document.getElementById('audio-device-select');
    if (!select) return;
    
    try {
      // Request permission to access audio devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter for audio output devices
      const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');
      
      console.log('🔊 Available audio output devices:', audioOutputDevices);
      
      // Clear existing options except the default
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      // Add discovered devices
      audioOutputDevices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Audio Output Device ${index + 1}`;
        select.appendChild(option);
      });
      
      // Restore previously selected device
      if (selectedAudioDevice && select.querySelector(`option[value="${selectedAudioDevice}"]`)) {
        select.value = selectedAudioDevice;
        console.log('✓ Restored audio device:', selectedAudioDevice);
      } else {
        select.value = '';
        console.log('ℹ️ Using default audio device');
      }
    } catch (err) {
      console.warn('⚠️ Failed to enumerate audio devices:', err);
    }
  }
  
  function updateSlider(type, value) {
    // Snap to 5% notches
    value = Math.round(value / 5) * 5;
    value = Math.max(0, Math.min(100, value));
    const handleEl = document.getElementById(`${type}-handle`);
    const valueEl = document.getElementById(`${type}-value`);
    
    // Position handle based on value (0-100%)
    if (handleEl) {
      const position = (value / 100) * (trackHeight - handleHeight);
      handleEl.style.bottom = position + 'px';
    }
    if (valueEl) valueEl.textContent = value + '%';
    
    return value;
  }
  
  // Drag functionality for sliders
  function setupSliderDrag(type, getValue, setValue) {
    const handleEl = document.getElementById(`${type}-handle`);
    const trackEl = handleEl ? handleEl.parentElement : null;
    
    if (!handleEl || !trackEl) return;
    
    let isDragging = false;
    
    function onDragStart(e) {
      isDragging = true;
      e.preventDefault();
      document.body.style.cursor = 'grabbing';
    }
    
    function onDragMove(e) {
      if (!isDragging) return;
      
      const rect = trackEl.getBoundingClientRect();
      let clientY = e.clientY || (e.touches && e.touches[0].clientY);
      
      // Calculate position from bottom of track
      const positionFromBottom = rect.bottom - clientY;
      const clampedPosition = Math.max(0, Math.min(trackHeight - handleHeight, positionFromBottom - handleHeight / 2));
      
      // Convert position to value (0-100), snap to 5% notches
      const rawValue = (clampedPosition / (trackHeight - handleHeight)) * 100;
      const newValue = Math.round(rawValue / 5) * 5;
      setValue(newValue);
    }
    
    function onDragEnd() {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
      }
    }
    
    // Mouse events
    handleEl.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    
    // Touch events
    handleEl.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  }
  
  // Setup drag for each slider
  setupSliderDrag('brightness', 
    () => brightnessValue, 
    (v) => { 
      brightnessValue = updateSlider('brightness', v);
      applyBrightnessFilter(brightnessValue);
    }
  );
  
  setupSliderDrag('handset', 
    () => handsetValue, 
    (v) => { handsetValue = updateSlider('handset', v); }
  );
  
  setupSliderDrag('cabin', 
    () => cabinVolume, 
    (v) => { 
      cabinVolume = updateSlider('cabin', v); 
      window.vasVolume = cabinVolume / 100;
      // Update currently playing audio volume in real-time
      if (currentAudio) {
        currentAudio.volume = window.vasVolume;
      }
      console.log('Cabin volume set to:', window.vasVolume);
    }
  );

  // Function to apply brightness filter
  function applyBrightnessFilter(value) {
    const filterValue = value / 100;
    if (document.body) {
      document.body.style.filter = `brightness(${filterValue})`;
    }
  }

  function showFnPanel() {
    // Hide main panel, show Fn panel
    mainPanel.classList.add('hide');
    fnPanel.classList.remove('hide');
    
    // Track and hide current footer, show Fn footer
    if (!initialFooter.classList.contains('hide')) {
      previousFooter = 'initial';
    } else if (!startupFooter.classList.contains('hide')) {
      previousFooter = 'startup';
    } else if (!stationFooter.classList.contains('hide')) {
      previousFooter = 'station';
    } else if (!normalFooter.classList.contains('hide')) {
      previousFooter = 'normal';
    }
    
    if (initialFooter) initialFooter.classList.add('hide');
    startupFooter.classList.add('hide');
    stationFooter.classList.add('hide');
    normalFooter.classList.add('hide');
    fnFooter.classList.remove('hide');
    
    helperBar.textContent = 'Adjust settings using footer buttons.';
  }
  
  function hideFnPanel() {
    // Hide Fn panel, show main panel
    fnPanel.classList.add('hide');
    mainPanel.classList.remove('hide');
    
    // Restore previous footer
    fnFooter.classList.add('hide');
    
    if (previousFooter === 'initial') {
      switchToStartupMode();
    } else if (previousFooter === 'startup') {
      // Go back to keyboard screen
      if (systemReadyScreen) systemReadyScreen.classList.add('hide');
      const touchKeyboard = document.getElementById('touch-keyboard');
      if (touchKeyboard) touchKeyboard.classList.remove('hide');
      startupFooter.classList.remove('hide');
      const headerTitle = document.getElementById('header-title');
      const headerRoute = document.getElementById('header-route');
      if (headerTitle) headerTitle.classList.add('hide');
      if (headerRoute) headerRoute.classList.remove('hide');
      helperBar.textContent = '"Enter" to verify. "Back" to edit.';
    } else if (previousFooter === 'station') {
      switchToStationSelectMode();
    } else if (previousFooter === 'normal') {
      switchToNormalMode();
    } else {
      switchToStartupMode();
    }
  }
  
  if (fnBtn) fnBtn.addEventListener('click', showFnPanel);
  if (fnExitBtn) fnExitBtn.addEventListener('click', hideFnPanel);
  
  // Fn panel button handlers
  const brightnessDownBtn = document.getElementById('brightness-down-btn');
  const brightnessUpBtn = document.getElementById('brightness-up-btn');
  const audioDeviceBtn = document.getElementById('audio-device-btn');
  const cabinUpBtn = document.getElementById('cabin-up-btn');
  const cabinDownBtn = document.getElementById('cabin-down-btn');
  const fnSlidersPanel = document.querySelector('.fn-sliders');
  const fnAudioDevicePanel = document.getElementById('fn-audio-device-panel');
  
  // Initialize global volume
  window.vasVolume = cabinVolume / 100;
  
  // Initialize slider visuals on page load
  updateSlider('brightness', brightnessValue);
  updateSlider('handset', handsetValue);
  updateSlider('cabin', cabinVolume);
  console.log('Brightness value on init:', brightnessValue);
  applyBrightnessFilter(brightnessValue);

  if (brightnessDownBtn) brightnessDownBtn.addEventListener('click', () => {
    brightnessValue = updateSlider('brightness', brightnessValue - 5);
    applyBrightnessFilter(brightnessValue);
  });
  
  if (brightnessUpBtn) brightnessUpBtn.addEventListener('click', () => {
    brightnessValue = updateSlider('brightness', brightnessValue + 5);
    applyBrightnessFilter(brightnessValue);
  });
  
  if (audioDeviceBtn) audioDeviceBtn.addEventListener('click', () => {
    // Toggle between sliders and audio device panel
    if (fnSlidersPanel && fnAudioDevicePanel) {
      const fnClosestStationPanel = document.querySelector('.fn-closest-station-panel');
      const systemSettingsShown = fnAudioDevicePanel.classList.contains('hide') === false;
      
      fnSlidersPanel.classList.toggle('hide');
      fnAudioDevicePanel.classList.toggle('hide');
      
      // Toggle button color: red when System Settings shown, green when back to Fn menu
      audioDeviceBtn.classList.toggle('footer-btn-green');
      audioDeviceBtn.classList.toggle('footer-btn-red');
      
      // Show closest station panel only when System Settings is shown
      if (fnClosestStationPanel) {
        if (systemSettingsShown) {
          // System Settings is currently shown, so hide it when toggling
          fnClosestStationPanel.classList.add('hide');
        } else {
          // System Settings is about to be shown, so show closest station panel
          fnClosestStationPanel.classList.remove('hide');
        }
      }
      console.log('Audio device panel toggled');
    }
  });
  
  if (cabinUpBtn) cabinUpBtn.addEventListener('click', () => {
    cabinVolume = updateSlider('cabin', cabinVolume + 5);
    window.vasVolume = cabinVolume / 100;
    console.log('Cabin volume set to:', window.vasVolume);
  });
  
  if (cabinDownBtn) cabinDownBtn.addEventListener('click', () => {
    cabinVolume = updateSlider('cabin', cabinVolume - 5);
    window.vasVolume = cabinVolume / 100;
    console.log('Cabin volume set to:', window.vasVolume);
  });

  // ==================== Audio Output Device Selection ====================
  // Setup audio device selector
  const audioDeviceSelect = document.getElementById('audio-device-select');
  
  if (audioDeviceSelect) {
    // Initialize device list
    updateAudioDeviceList();
    
    // Listen for device changes and update the dropdown
    navigator.mediaDevices.addEventListener('devicechange', () => {
      console.log('🔊 Audio devices changed, updating list...');
      updateAudioDeviceList();
    });
    
    // Handle device selection
    audioDeviceSelect.addEventListener('change', (e) => {
      selectedAudioDevice = e.target.value;
      localStorage.setItem('selectedAudioDevice', selectedAudioDevice);
      console.log('🔊 Audio device selected:', selectedAudioDevice || 'default');
    });
  }

  // Setup CCTV auto-view toggle
  const cctvAutoToggle = document.getElementById('cctv-auto-toggle');
  if (cctvAutoToggle) {
    // Restore saved state
    const savedCctvState = localStorage.getItem('cctvOnDoorUnlockEnabled');
    if (savedCctvState !== null) {
      cctvOnDoorUnlockEnabled = savedCctvState === 'true';
    }
    
    // Update button text
    cctvAutoToggle.textContent = cctvOnDoorUnlockEnabled ? 'ON' : 'OFF';
    cctvAutoToggle.classList.toggle('fn-toggle-btn-green', cctvOnDoorUnlockEnabled);
    cctvAutoToggle.classList.toggle('fn-toggle-btn-grey', !cctvOnDoorUnlockEnabled);
    
    // Toggle on click
    cctvAutoToggle.addEventListener('click', () => {
      cctvOnDoorUnlockEnabled = !cctvOnDoorUnlockEnabled;
      localStorage.setItem('cctvOnDoorUnlockEnabled', cctvOnDoorUnlockEnabled);
      cctvAutoToggle.textContent = cctvOnDoorUnlockEnabled ? 'ON' : 'OFF';
      cctvAutoToggle.classList.toggle('fn-toggle-btn-green', cctvOnDoorUnlockEnabled);
      cctvAutoToggle.classList.toggle('fn-toggle-btn-grey', !cctvOnDoorUnlockEnabled);
      console.log('🎥 CCTV auto-view on door unlock:', cctvOnDoorUnlockEnabled ? 'ENABLED' : 'DISABLED');
    });
  }


  // ==================== Status and Versions Panel ====================
  const statusPanel = document.getElementById('status-panel');
  const statusFooter = document.getElementById('status-footer');
  const statusFooterLabel = document.getElementById('status-footer-label');
  const statusExitBtn = document.getElementById('status-exit-btn');
  
  // Status button in Fn panel
  const fnStatusBtn = document.getElementById('fn-status-btn');
  const fnStatusBtn2 = document.getElementById('fn-status-btn-2');
  
  // Status panel side buttons
  const statusStatusBtn = document.getElementById('status-status-btn');
  const statusPeiBtn = document.getElementById('status-pei-btn');
  const statusIoBtn = document.getElementById('status-io-btn');
  const statusFnBtn = document.getElementById('status-fn-btn');
  
  function showStatusPanel() {
    // Hide Fn panel and main panel
    fnPanel.classList.add('hide');
    mainPanel.classList.add('hide');
    
    // Show status panel
    statusPanel.classList.remove('hide');
    
    // Hide all footers and show status footer
    startupFooter.classList.add('hide');
    stationFooter.classList.add('hide');
    normalFooter.classList.add('hide');
    fnFooter.classList.add('hide');
    statusFooter.classList.remove('hide');
    statusFooterLabel.classList.remove('hide');
    
    helperBar.textContent = '';
  }
  
  function hideStatusPanel() {
    // Hide status panel
    statusPanel.classList.add('hide');
    statusFooter.classList.add('hide');
    statusFooterLabel.classList.add('hide');
    
    // Return to Fn panel
    fnPanel.classList.remove('hide');
    fnFooter.classList.remove('hide');
    
    helperBar.textContent = 'Adjust settings using footer buttons.';
  }
  
  // Wire up Status buttons
  if (fnStatusBtn) fnStatusBtn.addEventListener('click', showStatusPanel);
  if (fnStatusBtn2) fnStatusBtn2.addEventListener('click', showStatusPanel);
  if (statusExitBtn) statusExitBtn.addEventListener('click', hideStatusPanel);
  if (statusFnBtn) statusFnBtn.addEventListener('click', hideStatusPanel);
  
  // Fn I/O button - black screen for 10 seconds then System Ready
  const fnIoBtn = document.getElementById('fn-io-btn');
  const fnIoBtn2 = document.getElementById('fn-io-btn-2');
  let ioTestInProgress = false; // Flag to prevent multiple I/O tests
  
  function handleFnIoButton() {
    // Prevent overlapping I/O tests
    if (ioTestInProgress) {
      console.log('⚠️ I/O test already in progress - ignoring click');
      return;
    }
    
    ioTestInProgress = true;
    console.log('🎬 I/O Button Pressed - Starting test');
    
    // Hide Fn panel
    if (fnPanel) fnPanel.classList.add('hide');
    if (mainPanel) mainPanel.classList.remove('hide');
    if (fnFooter) fnFooter.classList.add('hide');
    if (normalFooter) normalFooter.classList.add('hide');
    if (stationFooter) stationFooter.classList.add('hide');
    if (startupFooter) startupFooter.classList.add('hide');
    
    // Create a video overlay
    let videoOverlay = document.getElementById('fn-io-video-overlay');
    if (!videoOverlay) {
      videoOverlay = document.createElement('div');
      videoOverlay.id = 'fn-io-video-overlay';
      videoOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: black;
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0;
        padding: 0;
      `;
      
      // Create video element
      const video = document.createElement('video');
      const videoUrl = '/audio/QR_PIDS_AudioFiles/qvas.mp4';
      console.log('🎬 Video source URL:', videoUrl);
      
      // Use source element for better compatibility
      const source = document.createElement('source');
      source.src = videoUrl;
      source.type = 'video/mp4;codecs="avc1.42E01E"';
      video.appendChild(source);
      
      // Add fallback source
      const source2 = document.createElement('source');
      source2.src = videoUrl;
      source2.type = 'video/mp4';
      video.appendChild(source2);
      
      video.style.cssText = `
        max-width: 100vw;
        max-height: 100vh;
        width: auto;
        height: auto;
        background: black;
      `;
      video.autoplay = true;
      video.muted = true;
      video.controls = false;
      
      // Add load and error handlers for debugging
      video.addEventListener('loadstart', () => {
        console.log('🎬 Video: loadstart event');
      });
      video.addEventListener('loadedmetadata', () => {
        console.log('🎬 Video: loadedmetadata - duration:', video.duration);
      });
      video.addEventListener('canplay', () => {
        console.log('🎬 Video: canplay - ready to play');
      });
      video.addEventListener('playing', () => {
        console.log('🎬 Video: now playing');
      });
      video.addEventListener('error', (e) => {
        console.error('🎬 Video Error:', e);
        console.error('🎬 Video MediaError code:', video.error?.code, 'message:', video.error?.message);
        console.error('🎬 Video readyState:', video.readyState);
        console.error('🎬 Network state:', video.networkState);
        // Try to fetch the video directly to check if it exists
        fetch(videoUrl).then(r => {
          console.log('🎬 Fetch response: status', r.status, 'type', r.headers.get('content-type'));
        }).catch(err => console.error('🎬 Fetch error:', err));
        
        // Show fallback message
        console.log('🎬 Video playback failed - showing black screen as fallback');
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = `
          color: #666;
          font-size: 14px;
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
        `;
        errorMsg.textContent = 'Video codec not supported - showing test screen';
        videoOverlay.appendChild(errorMsg);
      });
      
      videoOverlay.appendChild(video);
      document.body.appendChild(videoOverlay);
      console.log('🎬 Video element created and appended to body');
    } else {
      console.log('🎬 Reusing existing video overlay');
      videoOverlay.style.display = 'flex';
      const video = videoOverlay.querySelector('video');
      if (video) {
        video.currentTime = 0;
        video.play().catch(err => console.error('🎬 Play error:', err));
      }
    }
    
    console.log('🎬 I/O test started - video overlay showing (auto-refresh in 15 seconds)');
    
    // After 15 seconds, refresh the page
    setTimeout(() => {
      console.log('✓ I/O test completed - refreshing page');
      location.reload();
    }, 15000);
  }
  
  if (fnIoBtn) fnIoBtn.addEventListener('click', handleFnIoButton);
  if (fnIoBtn2) fnIoBtn2.addEventListener('click', handleFnIoButton);
  
  // I/O button - go back to screensaver/system ready mode
  if (statusIoBtn) statusIoBtn.addEventListener('click', function() {
    // Hide status panel
    statusPanel.classList.add('hide');
    statusFooter.classList.add('hide');
    statusFooterLabel.classList.add('hide');
    
    // Reset everything and go to system ready screen
    runNumberInput.value = '';
    updateRouteDisplay();
    
    // Reset PID and DI displays
    if (pidDisplay) pidDisplay.textContent = '-';
    if (diDisplay) diDisplay.textContent = '-';
    
    // Reset door cycle state
    doorsCycled = false;
    if (doorCycleDisplay) doorCycleDisplay.textContent = 'N';
    
    // Clear any door cycle sequence timers
    if (doorCycleSequenceTimer1) {
      clearTimeout(doorCycleSequenceTimer1);
      doorCycleSequenceTimer1 = null;
    }
    if (doorCycleSequenceTimer2) {
      clearTimeout(doorCycleSequenceTimer2);
      doorCycleSequenceTimer2 = null;
    }
    
    // Reset selected station
    selectedStation = null;
    currentStations = [];
    currentHighlightIndex = 0;
    
    // Show main panel with system ready screen
    mainPanel.classList.remove('hide');
    switchToStartupMode();
    
    // Switch header back to title
    const headerTitle = document.getElementById('header-title');
    const headerRoute = document.getElementById('header-route');
    if (headerTitle) headerTitle.classList.remove('hide');
    if (headerRoute) headerRoute.classList.add('hide');
    
    // Reset display window
    if (displayWindow && !displayWindow.closed) {
      displayWindow.postMessage({ type: 'RESET' }, '*');
    }
    // Reset destination board
    if (destinationWindow && !destinationWindow.closed) {
      destinationWindow.postMessage({ type: 'RESET' }, '*');
    }
  });

  // ==================== PEI Panel ====================
  const peiPanel = document.getElementById('pei-panel');
  const peiFooter = document.getElementById('pei-footer');
  const peiExitBtn = document.getElementById('pei-exit-btn');
  
  // PEI buttons from various panels
  const peiBtn = document.getElementById('pei-btn');
  const fnPeiBtn = document.getElementById('fn-pei-btn');
  const fnPeiBtn2 = document.getElementById('fn-pei-btn-2');
  const peiPeiBtn = document.getElementById('pei-pei-btn');
  const peiFnBtn = document.getElementById('pei-fn-btn');
  
  // Track where we came from for PEI
  let peiPreviousPanel = null;
  
  function showPeiPanel(fromPanel) {
    peiPreviousPanel = fromPanel || 'main';
    
    // Track current footer before hiding (only when coming from main)
    if (fromPanel === 'main') {
      if (!initialFooter.classList.contains('hide')) {
        previousFooter = 'initial';
      } else if (!startupFooter.classList.contains('hide')) {
        previousFooter = 'startup';
      } else if (!stationFooter.classList.contains('hide')) {
        previousFooter = 'station';
      } else if (!normalFooter.classList.contains('hide')) {
        previousFooter = 'normal';
      }
    }
    
    // Hide all panels
    mainPanel.classList.add('hide');
    fnPanel.classList.add('hide');
    statusPanel.classList.add('hide');
    
    // Show PEI panel
    peiPanel.classList.remove('hide');
    
    // Hide all footers and show PEI footer
    if (initialFooter) initialFooter.classList.add('hide');
    startupFooter.classList.add('hide');
    stationFooter.classList.add('hide');
    normalFooter.classList.add('hide');
    fnFooter.classList.add('hide');
    statusFooter.classList.add('hide');
    statusFooterLabel.classList.add('hide');
    peiFooter.classList.remove('hide');
    
    helperBar.textContent = '';
  }
  
  function hidePeiPanel() {
    // Hide PEI panel
    peiPanel.classList.add('hide');
    peiFooter.classList.add('hide');
    
    // Return to previous panel
    if (peiPreviousPanel === 'fn') {
      fnPanel.classList.remove('hide');
      fnFooter.classList.remove('hide');
      helperBar.textContent = 'Adjust settings using footer buttons.';
    } else if (peiPreviousPanel === 'status') {
      statusPanel.classList.remove('hide');
      statusFooter.classList.remove('hide');
      statusFooterLabel.classList.remove('hide');
    } else {
      // Return to main panel
      mainPanel.classList.remove('hide');
      if (previousFooter === 'initial') {
        switchToStartupMode();
      } else if (previousFooter === 'startup') {
        // Go back to keyboard screen
        if (systemReadyScreen) systemReadyScreen.classList.add('hide');
        const touchKeyboard = document.getElementById('touch-keyboard');
        if (touchKeyboard) touchKeyboard.classList.remove('hide');
        startupFooter.classList.remove('hide');
        const headerTitle = document.getElementById('header-title');
        const headerRoute = document.getElementById('header-route');
        if (headerTitle) headerTitle.classList.add('hide');
        if (headerRoute) headerRoute.classList.remove('hide');
        helperBar.textContent = '"Enter" to verify. "Back" to edit.';
      } else if (previousFooter === 'station') {
        switchToStationSelectMode();
      } else if (previousFooter === 'normal') {
        switchToNormalMode();
      } else {
        switchToStartupMode();
      }
    }
  }
  
  // Wire up PEI buttons
  if (peiBtn) peiBtn.addEventListener('click', () => showPeiPanel('main'));
  if (fnPeiBtn) fnPeiBtn.addEventListener('click', () => showPeiPanel('fn'));
  if (fnPeiBtn2) fnPeiBtn2.addEventListener('click', () => showPeiPanel('fn'));
  if (statusPeiBtn) statusPeiBtn.addEventListener('click', () => showPeiPanel('status'));
  if (peiExitBtn) peiExitBtn.addEventListener('click', hidePeiPanel);
  if (peiFnBtn) peiFnBtn.addEventListener('click', () => {
    peiPanel.classList.add('hide');
    peiFooter.classList.add('hide');
    showFnPanel();
  });

  // ==================== CCTV Panel ====================
  const cctvPanel = document.getElementById('cctv-panel');
  const cctvBtn = document.getElementById('cctv-btn');
  const cctvExitBtn = document.getElementById('cctv-exit-btn');
  
  function showCctvPanel() {
    // Track current footer before hiding
    if (!initialFooter.classList.contains('hide')) {
      previousFooter = 'initial';
    } else if (!startupFooter.classList.contains('hide')) {
      previousFooter = 'startup';
    } else if (!stationFooter.classList.contains('hide')) {
      previousFooter = 'station';
    } else if (!normalFooter.classList.contains('hide')) {
      previousFooter = 'normal';
    }
    
    // Hide all panels
    mainPanel.classList.add('hide');
    fnPanel.classList.add('hide');
    statusPanel.classList.add('hide');
    peiPanel.classList.add('hide');
    
    // Show CCTV panel
    cctvPanel.classList.remove('hide');
    
    // Hide header and header row 2 on CCTV page
    const header = document.querySelector('.header');
    const headerRow2 = document.querySelector('.header-row-2');
    if (header) header.classList.add('hide');
    if (headerRow2) headerRow2.classList.add('hide');
    
    // Hide all footers
    if (initialFooter) initialFooter.classList.add('hide');
    startupFooter.classList.add('hide');
    stationFooter.classList.add('hide');
    normalFooter.classList.add('hide');
    fnFooter.classList.add('hide');
    statusFooter.classList.add('hide');
    statusFooterLabel.classList.add('hide');
    peiFooter.classList.add('hide');
    
    helperBar.textContent = '';
    
    // Load cameras with random delays (0-1 second)
    for (let i = 1; i <= 4; i++) {
      const loading = document.getElementById(`camera-loading-${i}`);
      const image = document.getElementById(`camera-image-${i}`);
      
      if (loading && image) {
        // Make CCTV images work from GitHub Pages (/electron15/), localhost, and iPhone/PWA hosting.
        const cctvRootPath = qvasAssetUrl(`CCTV/${i}.JPG`);
        if (!image.dataset.qvasCctvFallbackReady) {
          image.dataset.qvasCctvFallbackReady = '1';
          image.addEventListener('error', () => {
            const current = image.getAttribute('src') || '';
            const fallback = current.includes('.JPG') ? qvasAssetUrl(`CCTV/${i}.jpg`) : qvasAssetUrl(`CCTV/${i}.JPG`);
            if (current !== fallback) image.setAttribute('src', fallback);
          });
        }
        image.setAttribute('src', cctvRootPath);

        // Show loading overlay
        loading.classList.remove('hidden');
        
        // Random delay between 0-1000ms
        const delay = Math.random() * 1000;
        
        setTimeout(() => {
          // Hide loading overlay
          loading.classList.add('hidden');
        }, delay);
      }
    }
  }
  
  function hideCctvPanel() {
    // Hide CCTV panel
    cctvPanel.classList.add('hide');
    
    // Show header and header row 2 when exiting CCTV
    const header = document.querySelector('.header');
    const headerRow2 = document.querySelector('.header-row-2');
    if (header) header.classList.remove('hide');
    if (headerRow2) headerRow2.classList.remove('hide');
    
    // Reset loading overlays for next time
    for (let i = 1; i <= 4; i++) {
      const loading = document.getElementById(`camera-loading-${i}`);
      if (loading) loading.classList.remove('hidden');
    }
    
    // Return to main panel
    mainPanel.classList.remove('hide');
    if (previousFooter === 'initial') {
      switchToStartupMode();
    } else if (previousFooter === 'startup') {
      // Go back to keyboard screen
      if (systemReadyScreen) systemReadyScreen.classList.add('hide');
      const touchKeyboard = document.getElementById('touch-keyboard');
      if (touchKeyboard) touchKeyboard.classList.remove('hide');
      startupFooter.classList.remove('hide');
      const headerTitle = document.getElementById('header-title');
      const headerRoute = document.getElementById('header-route');
      if (headerTitle) headerTitle.classList.add('hide');
      if (headerRoute) headerRoute.classList.remove('hide');
      helperBar.textContent = '"Enter" to verify. "Back" to edit.';
    } else if (previousFooter === 'station') {
      switchToStationSelectMode();
    } else if (previousFooter === 'normal') {
      switchToNormalMode();
    } else {
      switchToStartupMode();
    }
  }
  
  // Wire up CCTV buttons
  if (cctvBtn) cctvBtn.addEventListener('click', showCctvPanel);
  if (cctvExitBtn) cctvExitBtn.addEventListener('click', hideCctvPanel);

  // ==================== Closest Station Feature ====================
  
  function updateClosestStationTag() {
    // Remove all existing closest station tags
    document.querySelectorAll('.closest-station-tag').forEach(tag => tag.remove());
    
    // Add tag to current closest station
    const stationItems = document.querySelectorAll('#station-list li');
    if (stationItems[closestStationIndex]) {
      const tag = document.createElement('span');
      tag.className = 'closest-station-tag';
      tag.textContent = 'Closest Station';
      stationItems[closestStationIndex].appendChild(tag);
    }
  }
  
  function updateClosestStationFromTimers() {
    // Automatically update closest station based on currently selected/upcoming station
    // In auto-adapt mode (manual mode OFF), the closest station is the one being approached
    if (!manualClosestStationMode && selectedStation && currentStations.length > 0) {
      // Find the index of the selected station in the current stations array
      const stationIndex = currentStations.findIndex(s => s.name === selectedStation.name);
      if (stationIndex >= 0) {
        closestStationIndex = stationIndex;
        updateClosestStationTag();
      }
    }
  }
  
  function setClosestStation(index) {
    // Manually set the closest station (only in manual mode)
    if (manualClosestStationMode && index >= 0 && index < currentStations.length) {
      closestStationIndex = index;
      updateClosestStationTag();
    }
  }
  
  // Toggle button for manual closest station selection
  const closestStationToggle = document.getElementById('closest-station-toggle');
  const stationCodeOpenBtn = document.getElementById('station-code-open-btn');
  if (closestStationToggle) {
    closestStationToggle.addEventListener('click', function() {
      manualClosestStationMode = !manualClosestStationMode;
      
      if (manualClosestStationMode) {
        closestStationToggle.textContent = 'ON';
        closestStationToggle.classList.add('enabled');
        closestStationToggle.classList.remove('disabled');
        // Show the Select Station button when manual mode is ON
        if (stationCodeOpenBtn) stationCodeOpenBtn.style.display = 'block';
      } else {
        closestStationToggle.textContent = 'OFF';
        closestStationToggle.classList.remove('enabled');
        closestStationToggle.classList.add('disabled');
        // Hide the Select Station button when manual mode is OFF
        if (stationCodeOpenBtn) stationCodeOpenBtn.style.display = 'none';
        // Auto-update from timers when manual mode is off
        updateClosestStationFromTimers();
      }
      
      updateClosestStationTag();
    });
  }

  // NGR Button Message Toggle
  const ngrButtonMessageToggle = document.getElementById('ngr-button-message-toggle');
  if (ngrButtonMessageToggle) {
    ngrButtonMessageToggle.addEventListener('click', function() {
      ngrButtonMessageEnabled = !ngrButtonMessageEnabled;
      
      if (ngrButtonMessageEnabled) {
        ngrButtonMessageToggle.textContent = 'ON';
        ngrButtonMessageToggle.classList.add('enabled');
        ngrButtonMessageToggle.classList.remove('disabled');
        console.log('✅ NGR Button Message enabled');
      } else {
        ngrButtonMessageToggle.textContent = 'OFF';
        ngrButtonMessageToggle.classList.remove('enabled');
        ngrButtonMessageToggle.classList.add('disabled');
        console.log('❌ NGR Button Message disabled');
      }
    });
  }

  // Station Code Keyboard Handler
  const stationCodeModeContainer = document.getElementById('station-code-mode-container');
  const stationCodeDisplay = document.getElementById('station-code-display');
  const headerStation = document.getElementById('header-station');
  let stationCodeBuffer = '';
  let previousVisibleFooterId = null; // Track which footer was visible before entering station code mode

  // Open station code keyboard
  if (stationCodeOpenBtn) {
    stationCodeOpenBtn.addEventListener('click', function() {
      stationCodeBuffer = '';
      stationCodeDisplay.textContent = '_ _ _';
      updateStationEnterButtonState();
      
      // Close Fn panel if it's open
      const fnPanel = document.getElementById('fn-panel');
      const mainPanel = document.getElementById('main-panel');
      if (fnPanel && !fnPanel.classList.contains('hide')) {
        hideFnPanel();
      }
      
      // Make sure main panel is visible
      if (mainPanel) mainPanel.classList.remove('hide');
      
      // Hide other panels in main area
      document.getElementById('touch-keyboard').classList.add('hide');
      document.getElementById('run-error').classList.add('hide');
      document.getElementById('mode-title').classList.add('hide');
      document.getElementById('station-list-container').classList.add('hide');
      document.getElementById('manual-list-container').classList.add('hide');
      
      // Hide route header, show station header
      document.getElementById('header-route').classList.add('hide');
      headerStation.classList.remove('hide');
      
      // Show station code mode
      stationCodeModeContainer.classList.remove('hide');
      
      // Store which footer was visible and hide all footers
      const startupFooter = document.getElementById('startup-footer');
      const stationFooter = document.getElementById('station-footer');
      const normalFooter = document.getElementById('normal-footer');
      const fnFooter = document.getElementById('fn-footer');
      
      if (startupFooter && !startupFooter.classList.contains('hide')) {
        previousVisibleFooterId = 'startup-footer';
      } else if (stationFooter && !stationFooter.classList.contains('hide')) {
        previousVisibleFooterId = 'station-footer';
      } else if (normalFooter && !normalFooter.classList.contains('hide')) {
        previousVisibleFooterId = 'normal-footer';
      } else if (fnFooter && !fnFooter.classList.contains('hide')) {
        previousVisibleFooterId = 'fn-footer';
      } else {
        previousVisibleFooterId = 'station-footer'; // Default to station footer
      }
      
      // Hide all footers
      if (startupFooter) startupFooter.classList.add('hide');
      if (stationFooter) stationFooter.classList.add('hide');
      if (normalFooter) normalFooter.classList.add('hide');
      if (fnFooter) fnFooter.classList.add('hide');
      
      // Show startup footer for station code mode and change reset button to Close
      if (startupFooter) startupFooter.classList.remove('hide');
      const resetBtn = document.getElementById('reset-btn');
      if (resetBtn) resetBtn.textContent = 'Close';
    });
  }

  // Close station code keyboard and return to normal mode
  function closeStationCodeKeyboard() {
    stationCodeModeContainer.classList.add('hide');
    stationCodeBuffer = '';
    stationCodeDisplay.textContent = '_ _ _';
    updateStationEnterButtonState();
    
    // Hide station header, show route header if needed
    headerStation.classList.add('hide');
    
    // Return to normal mode - show station list
    document.getElementById('touch-keyboard').classList.add('hide');
    document.getElementById('mode-title').classList.remove('hide');
    document.getElementById('station-list-container').classList.remove('hide');
    
    // Hide startup footer and restore the previous footer
    const startupFooter = document.getElementById('startup-footer');
    if (startupFooter) startupFooter.classList.add('hide');
    
    if (previousVisibleFooterId) {
      const previousFooter = document.getElementById(previousVisibleFooterId);
      if (previousFooter) previousFooter.classList.remove('hide');
    }
    
    // Restore reset button text to Reset
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.textContent = 'Reset';
    const stationResetBtn = document.getElementById('station-reset-btn');
    if (stationResetBtn) stationResetBtn.textContent = 'Reset';
    const normalResetBtn = document.getElementById('normal-reset-btn');
    if (normalResetBtn) normalResetBtn.textContent = 'Reset';
  }

  // Handle station code key presses
  const stationCodeKeys = stationCodeModeContainer.querySelectorAll('#station-code-keyboard .key-btn');
  stationCodeKeys.forEach(btn => {
    btn.addEventListener('click', function() {
      const key = this.dataset.key;
      if (key && stationCodeBuffer.length < 3) {
        stationCodeBuffer += key.toUpperCase();
        // Update display with spaces between characters
        stationCodeDisplay.textContent = stationCodeBuffer.split('').join(' ');
        updateStationEnterButtonState();

        // Auto-submit when 3 letters entered
        if (stationCodeBuffer.length === 3) {
          submitStationCode();
        }
      }
    });
  });

  // Submit station code and update closest station
  function submitStationCode() {
    const code = stationCodeBuffer.toUpperCase();
    
    // Find station matching the code
    if (stationCodeMap[code]) {
      const stationName = stationCodeMap[code];
      
      // Only process if we have a route loaded
      if (currentStations && currentStations.length > 0) {
        // Find the index in currentStations
        const stationIndex = currentStations.findIndex(s => s.name === stationName);
        
        if (stationIndex >= 0) {
          // Station is on the route - highlight it
          setClosestStation(stationIndex);
          closeStationCodeKeyboard();
        }
        // Otherwise, station not on route - silently do nothing
      }
      // If no route loaded, silently do nothing
      
      // Clear the buffer for next entry
      stationCodeBuffer = '';
      stationCodeDisplay.textContent = '_ _ _';
    } else {
      // Invalid station code - silently do nothing
      stationCodeBuffer = '';
      stationCodeDisplay.textContent = '_ _ _';
    }
  }

  // Update Enter button state based on station code input
  function updateStationEnterButtonState() {
    const enterBtn = document.getElementById('enter-btn');
    if (enterBtn) {
      if (stationCodeBuffer.length === 3) {
        enterBtn.classList.add('active');
      } else {
        enterBtn.classList.remove('active');
      }
    }
  }

  // Intercept startup footer buttons when in station code mode
  const startupBackBtn = document.getElementById('back-btn');
  const startupEnterBtn = document.getElementById('enter-btn');
  
  if (startupBackBtn) {
    startupBackBtn.addEventListener('click', function(e) {
      if (!stationCodeModeContainer.classList.contains('hide')) {
        // Backspace: delete last character
        if (stationCodeBuffer.length > 0) {
          stationCodeBuffer = stationCodeBuffer.slice(0, -1);
          stationCodeDisplay.textContent = stationCodeBuffer.length > 0 ? stationCodeBuffer.split('').join(' ') : '_ _ _';
          updateStationEnterButtonState();
        }
      }
    }, true); // Use capture phase to intercept before other handlers
  }

  if (startupEnterBtn) {
    startupEnterBtn.addEventListener('click', function(e) {
      if (!stationCodeModeContainer.classList.contains('hide')) {
        // Only process if we have 3 characters
        if (stationCodeBuffer.length === 3) {
          submitStationCode();
          closeStationCodeKeyboard();
        }
      }
    }, true); // Use capture phase
  }

  // ==================== Special Messages Panel ====================
  const specialPanel = document.getElementById('special-panel');
  const specialFooter = document.getElementById('special-footer');
  const specialItems = document.querySelectorAll('.special-item');
  const specialMorePrev = document.getElementById('special-more-prev');
  const specialMoreNext = document.getElementById('special-more-next');
  
  // Special button elements
  const specialBtn = document.getElementById('special-btn');
  const stationSpecialBtn = document.getElementById('station-special-btn');
  const normalSpecialBtn = document.getElementById('normal-special-btn');
  const startupSpecialBtn = document.getElementById('startup-special-btn');
  const specialUpBtn = document.getElementById('special-up-btn');
  const specialDownBtn = document.getElementById('special-down-btn');
  const specialPlayBtn = document.getElementById('special-play-btn');
  const specialStopBtn = document.getElementById('special-stop-btn');
  const specialResetBtn = document.getElementById('special-reset-btn');
  const specialSkipBtn = document.getElementById('special-skip-btn');
  const specialPeiBtn = document.getElementById('special-pei-btn');
  const specialCctvBtn = document.getElementById('special-cctv-btn');
  const specialFnBtn = document.getElementById('special-fn-btn');
  
  // Pagination settings
  const SPECIAL_ITEMS_PER_PAGE = 10;
  let currentSpecialIndex = 0;
  let currentSpecialPage = 0;
  
  // Global arrays for special messages (will be loaded from JSON)
  let specialMessages = [];
  let specialAudioFiles = {};
  let specialDisplayText = {};
  
  // Destination aliases/mappings for auto-select matching
  const destinationAliases = {
    'Domestic Airport': 'Brisbane Airport',
    'International Airport': 'Brisbane Airport'
  };
  
  // Function to auto-select special message based on current destination
  function autoSelectSpecialMessageByDestination(destination) {
    if (!destination || specialMessages.length === 0) return false;
    
    // Normalize destination (remove "station" suffix for matching)
    let destName = destination.replace(/\s+station$/i, '').trim();
    
    // Apply aliases if destination matches a known alias
    if (destinationAliases[destName]) {
      destName = destinationAliases[destName];
      console.log(`[Auto-Select] Alias applied: "${destination}" -> "${destName}"`);
    }
    
    console.log(`[Auto-Select] Looking for special message matching: "${destName}"`);
    
    // Search through special messages to find a match
    for (let i = 0; i < specialMessages.length; i++) {
      const messageKey = specialMessages[i];
      const label = specialDisplayText[messageKey] || '';
      
      // Extract destination from label (e.g., "EDI ~ Ipswich" -> "Ipswich")
      let labelDestination = '';
      if (label.includes('~')) {
        labelDestination = label.split('~')[1].trim();
      } else {
        labelDestination = label;
      }
      
      // Compare normalized names
      if (labelDestination.toLowerCase() === destName.toLowerCase()) {
        currentSpecialIndex = i;
        currentSpecialPage = Math.floor(currentSpecialIndex / SPECIAL_ITEMS_PER_PAGE);
        console.log(`✓ [Auto-Select] Found matching special message at index ${i}: "${label}"`);
        highlightSpecialItem(currentSpecialIndex);
        updateSpecialDisplayPage();
        
        // Only send destination to display window if this is an EDI message (either "EDI ~" or "EDI -" format)
        if (label.includes('EDI')) {
          // Send destination to display window
          if (!displayWindow || displayWindow.closed) {
            displayWindow = qvasCreateInlineWindowTarget('AnnouncementDisplay');
          }
          
          setTimeout(() => {
            // Get destination settings (scroller, customText, useCustomText)
            const destSettings = getDestinationSettings(labelDestination) || {};
            
            const diData = {
              type: 'DI',
              destination: labelDestination,
              scroller: destSettings.scroller || false,
              customText: destSettings.customText || '',
              useCustomText: destSettings.useCustomText || false,
              persistent: true  // Keep display until system reset
            };
            
            if (displayWindow && !displayWindow.closed) {
              try {
                displayWindow.postMessage(diData, '*');
                console.log('✓ [Auto-Select] Sent destination to display window:', labelDestination);
              } catch (err) {
                console.error('Error sending to display:', err);
              }
            }
          }, 300);
        } else {
          console.log('⚠️ [Auto-Select] Non-EDI message matched - skipping destination display');
        }
        
        return true;
      }
    }
    
    console.log(`[Auto-Select] No matching special message found for "${destName}"`);
    return false;
  }
  
  // State flag to prevent panel from closing while special message is playing
  let isPlayingSpecial = false;
  let specialMessagesLoaded = false;
  
  // Destinations data
  let destinationsData = [];
  
  // Load destinations from destinations.json
  async function loadDestinations() {
    try {
      let response;
      try {
        response = await fetch(qvasAssetUrl('destinations.json'), { cache: 'no-store' });
      } catch (err) {
        response = await fetch(qvasAssetUrl('src/destinations.json'), { cache: 'no-store' });
      }
      
      if (response.ok) {
        const data = await response.json();
        destinationsData = data.destinations || [];
        console.log(`✓ Loaded ${destinationsData.length} destinations from JSON`);
        return true;
      } else {
        console.log('Could not load destinations.json');
        return false;
      }
    } catch (err) {
      console.log('Error loading destinations.json:', err);
      return false;
    }
  }
  
  // Get destination settings by name
  function getDestinationSettings(destName) {
    if (!destName || !destinationsData.length) return null;
    
    const dest = destinationsData.find(d => d.name.toLowerCase() === destName.toLowerCase());
    return dest || null;
  }
  
  // Load special messages from JSON file
  async function loadSpecialMessages() {
    try {
      // Try multiple path formats for Electron compatibility
      let response;
      try {
        response = await fetch(qvasAssetUrl('special-messages.json'), { cache: 'no-store' });
      } catch (err) {
        response = await fetch(qvasAssetUrl('src/special-messages.json'), { cache: 'no-store' });
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ Loaded ${data.specialMessages.length} special messages from JSON`);
        
        // Build arrays and objects from JSON data
        specialMessages = data.specialMessages.map(msg => msg.id);
        
        specialAudioFiles = {};
        specialDisplayText = {};
        
        data.specialMessages.forEach(msg => {
          specialAudioFiles[msg.id] = msg.audioPath;
          specialDisplayText[msg.id] = msg.label;
        });
        
        specialMessagesLoaded = true;
        console.log('✓ Special messages ready for use');
        return true;
      } else {
        // Fallback: populate from HTML items (silent fail - this is normal)
        populateSpecialMessagesFromHTML();
        return false;
      }
    } catch (err) {
      // Fallback: populate from HTML items (silent fail - this is normal)
      populateSpecialMessagesFromHTML();
      return false;
    }
  }
  
  // Fallback function to populate special messages from HTML
  function populateSpecialMessagesFromHTML() {
    specialMessages = [];
    specialAudioFiles = {};
    specialDisplayText = {};
    
    specialItems.forEach(item => {
      const messageId = item.dataset.message;
      if (messageId) {
        specialMessages.push(messageId);
        specialDisplayText[messageId] = item.textContent;
      }
    });
    
    console.log('✓ Populated special messages from HTML items');
  }
  
  // Load special messages and destinations on startup
  (async () => {
    await loadDestinations();
    await loadSpecialMessages();
    await loadEmergencyMessages();
  })();
  
  
  function playSpecialMessage() {
    const messageKey = specialMessages[currentSpecialIndex];
    const audioPath = specialAudioFiles[messageKey];
    const displayLabel = specialDisplayText[messageKey];
    
    console.log('=== SPECIAL MESSAGE PLAY ===');
    console.log('Playing special message:', messageKey, 'Label:', displayLabel, 'Path:', audioPath);
    
    // Set flag to prevent panel from closing while playing
    isPlayingSpecial = true;
    
    // Only update destination DISPLAY if this is an EDI message (either "EDI ~" or "EDI -" format)
    // DO NOT change currentDestinationStation - it must remain the actual route destination
    // to ensure route announcements use the correct TNS_Special paths
    if (displayLabel && displayLabel.includes('EDI')) {
      // Extract destination from label
      let destination = '';
      if (displayLabel.includes('~')) {
        // Format: "EDI ~ Ipswich" -> extract "Ipswich"
        destination = displayLabel.split('~')[1].trim();
      } else {
        destination = displayLabel.trim();
      }
      
      console.log('✓ EDI message detected - Display destination:', destination);
      console.log('✓ Route destination (currentDestinationStation) UNCHANGED:', currentDestinationStation);
      
      // Update main DI display only (visual only, doesn't affect audio paths)
      if (diDisplay) {
        diDisplay.textContent = destination;
        console.log('✓ Updated main DI display to:', destination);
      }
      
      // Update remote state - DISPLAY ONLY, not affecting route audio paths
      if (typeof updateAppState === 'function') {
        updateAppState({
          DI: destination
        });
      }
      
      // Open display window if not open
      if (!displayWindow || displayWindow.closed) {
        displayWindow = qvasCreateInlineWindowTarget('AnnouncementDisplay');
      }
      
      // Send destination from special message label to display window
      setTimeout(() => {
        // Get destination settings (scroller, customText, useCustomText)
        const destSettings = getDestinationSettings(destination) || {};
        
        console.log('DEBUG playSpecialMessage:', {
          displayLabel,
          destination,
          destSettings,
          displayWindowExists: !!displayWindow,
          displayWindowClosed: displayWindow ? displayWindow.closed : 'n/a'
        });
        
        // Send DI data object to display
        const diData = {
          type: 'DI',
          destination: destination,
          scroller: destSettings.scroller || false,
          customText: destSettings.customText || '',
          useCustomText: destSettings.useCustomText || false,
          persistent: true  // Keep display until system reset
        };
        
        console.log('Sending to display:', diData);
        
        if (displayWindow && !displayWindow.closed) {
          try {
            displayWindow.postMessage(diData, '*');
            console.log('✓ Message sent to display window');
          } catch (err) {
            console.error('Error sending message to display:', err);
          }
        } else {
          console.warn('Display window not ready');
        }
      }, 300);
    } else {
      console.log('⚠️ Non-EDI message - skipping destination update');
    }
    
    // Play audio
    if (audioPath) {
      setTimeout(() => {
        try {
          playAudio(audioPath);
          
          // Clear flag when audio ends
          if (currentAudio) {
            const originalOnended = currentAudio.onended;
            currentAudio.onended = function() {
              if (originalOnended) originalOnended.call(this);
              isPlayingSpecial = false;
              console.log('✓ Special message playback finished, panel can now close');
            };
          }
        } catch (err) {
          console.error('Error calling playAudio:', err);
          isPlayingSpecial = false;
        }
      }, 500);
    }
  }
  
  function updateSpecialDisplayPage() {
    // If specialMessages is empty, use HTML items directly
    if (specialMessages.length === 0) {
      specialMessages = [];
      specialItems.forEach(item => {
        const messageId = item.dataset.message;
        if (messageId) {
          specialMessages.push(messageId);
        }
      });
    }
    
    // Hide all items first
    specialItems.forEach(item => item.classList.remove('visible'));
    
    // Calculate page range
    const startIndex = currentSpecialPage * SPECIAL_ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + SPECIAL_ITEMS_PER_PAGE, specialMessages.length);
    
    // Show items for current page
    for (let i = startIndex; i < endIndex; i++) {
      if (specialItems[i]) {
        specialItems[i].classList.add('visible');
      }
    }
    
    // Update -more- button visibility
    specialMorePrev.style.display = currentSpecialPage > 0 ? 'block' : 'none';
    specialMoreNext.style.display = endIndex < specialMessages.length ? 'block' : 'none';
    
    // Update up/down button colors based on position (special messages mode)
    if (specialUpBtn) {
      if (currentSpecialIndex === 0) {
        specialUpBtn.classList.add('footer-btn-grey');
        specialUpBtn.classList.remove('footer-btn-green');
      } else {
        specialUpBtn.classList.remove('footer-btn-grey');
        specialUpBtn.classList.add('footer-btn-green');
      }
    }
    
    if (specialDownBtn) {
      if (currentSpecialIndex >= specialMessages.length - 1) {
        specialDownBtn.classList.add('footer-btn-grey');
        specialDownBtn.classList.remove('footer-btn-green');
      } else {
        specialDownBtn.classList.remove('footer-btn-grey');
        specialDownBtn.classList.add('footer-btn-green');
      }
    }
    
    // Highlight appropriate item on current page
    highlightSpecialItem(currentSpecialIndex);
  }
  
  function highlightSpecialItem(index) {
    specialItems.forEach((item, i) => {
      item.classList.toggle('selected', i === index);
    });
  }
  
  function showSpecialPanel() {
    // Track current footer before hiding
    if (!initialFooter.classList.contains('hide')) {
      previousFooter = 'initial';
    } else if (!startupFooter.classList.contains('hide')) {
      previousFooter = 'startup';
    } else if (!stationFooter.classList.contains('hide')) {
      previousFooter = 'station';
    } else if (!normalFooter.classList.contains('hide')) {
      previousFooter = 'normal';
    }
    
    // Hide all panels
    mainPanel.classList.add('hide');
    fnPanel.classList.add('hide');
    statusPanel.classList.add('hide');
    peiPanel.classList.add('hide');
    cctvPanel.classList.add('hide');
    
    // Show special panel
    specialPanel.classList.remove('hide');
    
    // Hide all footers and show special footer
    if (initialFooter) initialFooter.classList.add('hide');
    startupFooter.classList.add('hide');
    stationFooter.classList.add('hide');
    normalFooter.classList.add('hide');
    fnFooter.classList.add('hide');
    statusFooter.classList.add('hide');
    statusFooterLabel.classList.add('hide');
    peiFooter.classList.add('hide');
    specialFooter.classList.remove('hide');
    
    // Reset selection to first page
    currentSpecialIndex = 0;
    currentSpecialPage = 0;
    updateSpecialDisplayPage();
    
    helperBar.textContent = 'Select special message to play.';
  }
  
  function hideSpecialPanel() {
    // Prevent closing while special message is still playing
    if (isPlayingSpecial) {
      console.warn('⚠️ Special message is still playing - panel will not close');
      return;
    }
    
    // Hide special panel
    specialPanel.classList.add('hide');
    specialFooter.classList.add('hide');
    
    // Return to main panel
    mainPanel.classList.remove('hide');
    if (previousFooter === 'initial') {
      switchToStartupMode();
    } else if (previousFooter === 'startup') {
      // Go back to keyboard screen
      if (systemReadyScreen) systemReadyScreen.classList.add('hide');
      const touchKeyboard = document.getElementById('touch-keyboard');
      if (touchKeyboard) touchKeyboard.classList.remove('hide');
      startupFooter.classList.remove('hide');
      const headerTitle = document.getElementById('header-title');
      const headerRoute = document.getElementById('header-route');
      if (headerTitle) headerTitle.classList.add('hide');
      if (headerRoute) headerRoute.classList.remove('hide');
      helperBar.textContent = '"Enter" to verify. "Back" to edit.';
    } else if (previousFooter === 'station') {
      switchToStationSelectMode();
    } else if (previousFooter === 'normal') {
      switchToNormalMode();
    } else {
      switchToStartupMode();
    }
  }
  
  // ==================== EMERGENCY MESSAGES SYSTEM ====================
  
  // Emergency messages state
  let emergencyMessages = [];
  let emergencyAudioFiles = {};
  let emergencyDisplayText = {};
  let currentEmergencyIndex = 0;
  let currentEmergencyPage = 0;
  let emergencyConfirmationPending = false;  // True when Play button should say "Confirm"
  let emergencyMessagesLoaded = false;
  
  const EMERGENCY_ITEMS_PER_PAGE = 10;
  let emergencyItems = [];
  
  // Load emergency messages from JSON file
  async function loadEmergencyMessages() {
    try {
      let response;
      try {
        response = await fetch(qvasAssetUrl('emergency-messages.json'), { cache: 'no-store' });
      } catch (err) {
        response = await fetch(qvasAssetUrl('src/emergency-messages.json'), { cache: 'no-store' });
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ Loaded ${data.emergencyMessages.length} emergency messages from JSON`);
        
        // Build arrays and objects from JSON data
        emergencyMessages = data.emergencyMessages.map(msg => msg.id);
        
        emergencyAudioFiles = {};
        emergencyDisplayText = {};
        
        data.emergencyMessages.forEach(msg => {
          emergencyAudioFiles[msg.id] = msg.audioPath;
          emergencyDisplayText[msg.id] = msg.label;
        });
        
        emergencyMessagesLoaded = true;
        console.log('✓ Emergency messages ready for use');
        return true;
      } else {
        console.log('Could not load emergency-messages.json');
        return false;
      }
    } catch (err) {
      console.log('Error loading emergency-messages.json:', err);
      return false;
    }
  }
  
  function renderEmergencyMessages() {
    const emergencyList = document.querySelector('.emergency-list');
    if (!emergencyList) return;
    
    emergencyList.innerHTML = '';
    emergencyItems = [];
    
    emergencyMessages.forEach((messageId, index) => {
      const div = document.createElement('div');
      div.className = 'emergency-item' + (index === 0 ? ' selected' : '');
      div.dataset.message = messageId;
      div.textContent = emergencyDisplayText[messageId] || messageId;
      
      emergencyList.appendChild(div);
      emergencyItems.push(div);
      
      // Click to select
      div.addEventListener('click', () => {
        currentEmergencyIndex = index;
        currentEmergencyPage = Math.floor(currentEmergencyIndex / EMERGENCY_ITEMS_PER_PAGE);
        updateEmergencyDisplayPage();
        emergencyConfirmationPending = false;  // Reset confirmation state
        updateEmergencyPlayButtonText();
      });
    });
  }
  
  function updateEmergencyDisplayPage() {
    if (emergencyItems.length === 0) {
      renderEmergencyMessages();
    }
    
    emergencyItems.forEach(item => item.classList.remove('visible'));
    
    const startIndex = currentEmergencyPage * EMERGENCY_ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + EMERGENCY_ITEMS_PER_PAGE, emergencyMessages.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      if (emergencyItems[i]) {
        emergencyItems[i].classList.add('visible');
      }
    }
    
    const emergencyMorePrev = document.getElementById('emergency-more-prev');
    const emergencyMoreNext = document.getElementById('emergency-more-next');
    const emergencyUpBtn = document.getElementById('emergency-up-btn');
    const emergencyDownBtn = document.getElementById('emergency-down-btn');
    
    if (emergencyMorePrev) emergencyMorePrev.style.display = currentEmergencyPage > 0 ? 'block' : 'none';
    if (emergencyMoreNext) emergencyMoreNext.style.display = endIndex < emergencyMessages.length ? 'block' : 'none';
    
    // Update up/down button colors
    if (emergencyUpBtn) {
      if (currentEmergencyIndex === 0) {
        emergencyUpBtn.classList.add('footer-btn-grey');
        emergencyUpBtn.classList.remove('footer-btn-green');
      } else {
        emergencyUpBtn.classList.remove('footer-btn-grey');
        emergencyUpBtn.classList.add('footer-btn-green');
      }
    }
    
    if (emergencyDownBtn) {
      if (currentEmergencyIndex >= emergencyMessages.length - 1) {
        emergencyDownBtn.classList.add('footer-btn-grey');
        emergencyDownBtn.classList.remove('footer-btn-green');
      } else {
        emergencyDownBtn.classList.remove('footer-btn-grey');
        emergencyDownBtn.classList.add('footer-btn-green');
      }
    }
    
    highlightEmergencyItem(currentEmergencyIndex);
  }
  
  function highlightEmergencyItem(index) {
    emergencyItems.forEach((item, i) => {
      item.classList.toggle('selected', i === index);
    });
  }
  
  function updateEmergencyPlayButtonText() {
    const emergencyPlayBtn = document.getElementById('emergency-play-btn');
    if (emergencyPlayBtn) {
      emergencyPlayBtn.textContent = emergencyConfirmationPending ? 'Confirm' : 'Select';
    }
  }
  
  function playEmergencyMessage() {
    if (emergencyConfirmationPending) {
      // User confirmed - play the message
      const messageKey = emergencyMessages[currentEmergencyIndex];
      const audioPath = emergencyAudioFiles[messageKey];
      const displayLabel = emergencyDisplayText[messageKey];
      
      console.log('▶️ Playing emergency message:', messageKey, 'Label:', displayLabel);
      
      isPlayingSpecial = true;
      emergencyConfirmationPending = false;
      updateEmergencyPlayButtonText();
      
      // Update PID display
      updatePIDDisplay(displayLabel, 'special');
      
      if (audioPath) {
        setTimeout(() => {
          try {
            playAudio(audioPath);
            
            if (currentAudio) {
              const originalOnended = currentAudio.onended;
              currentAudio.onended = function() {
                if (originalOnended) originalOnended.call(this);
                isPlayingSpecial = false;
                console.log('✓ Emergency message playback finished');
              };
            }
          } catch (err) {
            console.error('Error playing emergency audio:', err);
            isPlayingSpecial = false;
          }
        }, 500);
      }
    } else {
      // User selected message - show confirmation
      const messageKey = emergencyMessages[currentEmergencyIndex];
      const displayLabel = emergencyDisplayText[messageKey];
      console.log('⚠️ Emergency message selected for confirmation:', displayLabel);
      emergencyConfirmationPending = true;
      updateEmergencyPlayButtonText();
    }
  }
  
  function showEmergencyPanel() {
    // Track current footer
    if (!initialFooter.classList.contains('hide')) {
      previousFooter = 'initial';
    } else if (!startupFooter.classList.contains('hide')) {
      previousFooter = 'startup';
    } else if (!stationFooter.classList.contains('hide')) {
      previousFooter = 'station';
    } else if (!normalFooter.classList.contains('hide')) {
      previousFooter = 'normal';
    }
    
    // Hide all panels
    mainPanel.classList.add('hide');
    specialPanel.classList.add('hide');
    fnPanel.classList.add('hide');
    statusPanel.classList.add('hide');
    peiPanel.classList.add('hide');
    cctvPanel.classList.add('hide');
    
    // Show emergency panel
    const emergencyPanel = document.getElementById('emergency-panel');
    if (emergencyPanel) {
      emergencyPanel.classList.remove('hide');
    }
    
    // Hide all footers and show emergency footer
    if (initialFooter) initialFooter.classList.add('hide');
    startupFooter.classList.add('hide');
    stationFooter.classList.add('hide');
    normalFooter.classList.add('hide');
    specialFooter.classList.add('hide');
    fnFooter.classList.add('hide');
    statusFooter.classList.add('hide');
    statusFooterLabel.classList.add('hide');
    peiFooter.classList.add('hide');
    
    const emergencyFooter = document.getElementById('emergency-footer');
    if (emergencyFooter) {
      emergencyFooter.classList.remove('hide');
    }
    
    // Reset state
    currentEmergencyIndex = 0;
    currentEmergencyPage = 0;
    emergencyConfirmationPending = false;
    
    // Ensure messages are loaded and rendered
    if (!emergencyMessagesLoaded || emergencyItems.length === 0) {
      renderEmergencyMessages();
    }
    
    updateEmergencyDisplayPage();
    updateEmergencyPlayButtonText();
    
    helperBar.textContent = 'Select emergency message. Press Select to confirm before playing.';
  }
  
  function hideEmergencyPanel() {
    if (isPlayingSpecial) {
      console.warn('⚠️ Emergency message is still playing - panel will not close');
      return;
    }
    
    const emergencyPanel = document.getElementById('emergency-panel');
    if (emergencyPanel) {
      emergencyPanel.classList.add('hide');
    }
    
    const emergencyFooter = document.getElementById('emergency-footer');
    if (emergencyFooter) {
      emergencyFooter.classList.add('hide');
    }
    
    // Return to main panel
    mainPanel.classList.remove('hide');
    if (previousFooter === 'initial') {
      switchToStartupMode();
    } else if (previousFooter === 'startup') {
      if (systemReadyScreen) systemReadyScreen.classList.add('hide');
      const touchKeyboard = document.getElementById('touch-keyboard');
      if (touchKeyboard) touchKeyboard.classList.remove('hide');
      startupFooter.classList.remove('hide');
      const headerTitle = document.getElementById('header-title');
      const headerRoute = document.getElementById('header-route');
      if (headerTitle) headerTitle.classList.add('hide');
      if (headerRoute) headerRoute.classList.remove('hide');
      helperBar.textContent = '"Enter" to verify. "Back" to edit.';
    } else if (previousFooter === 'station') {
      switchToStationSelectMode();
    } else if (previousFooter === 'normal') {
      switchToNormalMode();
    } else {
      switchToStartupMode();
    }
  }
  
  // Wire up Special button to show special panel
  if (specialBtn) specialBtn.addEventListener('click', showSpecialPanel);
  if (stationSpecialBtn) stationSpecialBtn.addEventListener('click', showSpecialPanel);
  if (normalSpecialBtn) normalSpecialBtn.addEventListener('click', showSpecialPanel);
  if (startupSpecialBtn) startupSpecialBtn.addEventListener('click', showSpecialPanel);
  
  // Emergency button in special footer switches to emergency panel
  const specialEmergencyBtn = document.getElementById('special-emergency-btn');
  if (specialEmergencyBtn) {
    specialEmergencyBtn.addEventListener('click', () => {
      hideSpecialPanel();
      showEmergencyPanel();
    });
  }
  
  // Wire up emergency message button
  const emergencyPlayBtn = document.getElementById('emergency-play-btn');
  if (emergencyPlayBtn) {
    emergencyPlayBtn.addEventListener('click', playEmergencyMessage);
  }
  
  // Emergency panel navigation
  const emergencyUpBtn = document.getElementById('emergency-up-btn');
  const emergencyDownBtn = document.getElementById('emergency-down-btn');
  const emergencyMorePrev = document.getElementById('emergency-more-prev');
  const emergencyMoreNext = document.getElementById('emergency-more-next');
  const emergencySkipBtn = document.getElementById('emergency-skip-btn');
  const emergencyResetBtn = document.getElementById('emergency-reset-btn');
  
  if (emergencyUpBtn) {
    emergencyUpBtn.addEventListener('click', () => {
      currentEmergencyIndex--;
      if (currentEmergencyIndex < 0) currentEmergencyIndex = emergencyMessages.length - 1;
      currentEmergencyPage = Math.floor(currentEmergencyIndex / EMERGENCY_ITEMS_PER_PAGE);
      emergencyConfirmationPending = false;
      updateEmergencyPlayButtonText();
      updateEmergencyDisplayPage();
    });
  }
  
  if (emergencyDownBtn) {
    emergencyDownBtn.addEventListener('click', () => {
      currentEmergencyIndex++;
      if (currentEmergencyIndex >= emergencyMessages.length) currentEmergencyIndex = 0;
      currentEmergencyPage = Math.floor(currentEmergencyIndex / EMERGENCY_ITEMS_PER_PAGE);
      emergencyConfirmationPending = false;
      updateEmergencyPlayButtonText();
      updateEmergencyDisplayPage();
    });
  }
  
  if (emergencyMorePrev) {
    emergencyMorePrev.addEventListener('click', () => {
      if (currentEmergencyPage > 0) {
        currentEmergencyPage--;
        currentEmergencyIndex = (currentEmergencyPage + 1) * EMERGENCY_ITEMS_PER_PAGE - 1;
        updateEmergencyDisplayPage();
      }
    });
  }
  
  if (emergencyMoreNext) {
    emergencyMoreNext.addEventListener('click', () => {
      const maxPages = Math.ceil(emergencyMessages.length / EMERGENCY_ITEMS_PER_PAGE);
      if (currentEmergencyPage < maxPages - 1) {
        currentEmergencyPage++;
        currentEmergencyIndex = currentEmergencyPage * EMERGENCY_ITEMS_PER_PAGE;
        updateEmergencyDisplayPage();
      }
    });
  }
  
  if (emergencySkipBtn) {
    emergencySkipBtn.addEventListener('click', () => {
      isPlayingSpecial = false;
      hideEmergencyPanel();
    });
  }
  
  if (emergencyResetBtn) {
    emergencyResetBtn.addEventListener('click', () => {
      isPlayingSpecial = false;
      hideEmergencyPanel();
    });
  }
  
  // Navigation
  if (specialUpBtn) specialUpBtn.addEventListener('click', () => {
    currentSpecialIndex--;
    if (currentSpecialIndex < 0) currentSpecialIndex = specialMessages.length - 1;
    
    // Update page based on new index
    currentSpecialPage = Math.floor(currentSpecialIndex / SPECIAL_ITEMS_PER_PAGE);
    updateSpecialDisplayPage();
  });
  
  if (specialDownBtn) specialDownBtn.addEventListener('click', () => {
    currentSpecialIndex++;
    if (currentSpecialIndex >= specialMessages.length) currentSpecialIndex = 0;
    
    // Update page based on new index
    currentSpecialPage = Math.floor(currentSpecialIndex / SPECIAL_ITEMS_PER_PAGE);
    updateSpecialDisplayPage();
  });
  
  // Previous page button
  if (specialMorePrev) specialMorePrev.addEventListener('click', () => {
    if (currentSpecialPage > 0) {
      currentSpecialPage--;
      // Set index to last item of previous page
      currentSpecialIndex = (currentSpecialPage + 1) * SPECIAL_ITEMS_PER_PAGE - 1;
      updateSpecialDisplayPage();
    }
  });
  
  // Next page button
  if (specialMoreNext) specialMoreNext.addEventListener('click', () => {
    const maxPages = Math.ceil(specialMessages.length / SPECIAL_ITEMS_PER_PAGE);
    if (currentSpecialPage < maxPages - 1) {
      currentSpecialPage++;
      // Set index to first item of next page
      currentSpecialIndex = currentSpecialPage * SPECIAL_ITEMS_PER_PAGE;
      updateSpecialDisplayPage();
    }
  });
  
  // Click on items to select
  specialItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      currentSpecialIndex = index;
      // Ensure we're on the right page
      currentSpecialPage = Math.floor(currentSpecialIndex / SPECIAL_ITEMS_PER_PAGE);
      updateSpecialDisplayPage();
    });
  });
  
  // Play button plays the selected special message
  if (specialPlayBtn) specialPlayBtn.addEventListener('click', playSpecialMessage);
  
  // Stop button stops audio and clears display
  if (specialStopBtn) specialStopBtn.addEventListener('click', () => {
    manualStopAudio();
    isPlayingSpecial = false;  // Allow panel to close after stopping
  });
  
  // Skip/Reset returns to previous screen - allows exit without stopping audio
  if (specialSkipBtn) specialSkipBtn.addEventListener('click', () => {
    // Allow exit without stopping audio
    isPlayingSpecial = false;
    hideSpecialPanel();
  });
  if (specialResetBtn) specialResetBtn.addEventListener('click', () => {
    // Allow exit without stopping audio
    isPlayingSpecial = false;
    hideSpecialPanel();
  });
  
  // Side panel buttons
  if (specialPeiBtn) specialPeiBtn.addEventListener('click', () => {
    specialPanel.classList.add('hide');
    specialFooter.classList.add('hide');
    showPeiPanel('main');
  });
  
  if (specialCctvBtn) specialCctvBtn.addEventListener('click', () => {
    specialPanel.classList.add('hide');
    specialFooter.classList.add('hide');
    showCctvPanel();
  });
  
  if (specialFnBtn) specialFnBtn.addEventListener('click', () => {
    specialPanel.classList.add('hide');
    specialFooter.classList.add('hide');
    showFnPanel();
  });

  // Emergency panel side buttons
  const emergencyPeiBtn = document.getElementById('emergency-pei-btn');
  const emergencyCctvBtn = document.getElementById('emergency-cctv-btn');
  const emergencyFnBtn = document.getElementById('emergency-fn-btn');
  
  if (emergencyPeiBtn) emergencyPeiBtn.addEventListener('click', () => {
    const emergencyPanel = document.getElementById('emergency-panel');
    const emergencyFooter = document.getElementById('emergency-footer');
    if (emergencyPanel) emergencyPanel.classList.add('hide');
    if (emergencyFooter) emergencyFooter.classList.add('hide');
    showPeiPanel('main');
  });
  
  if (emergencyCctvBtn) emergencyCctvBtn.addEventListener('click', () => {
    const emergencyPanel = document.getElementById('emergency-panel');
    const emergencyFooter = document.getElementById('emergency-footer');
    if (emergencyPanel) emergencyPanel.classList.add('hide');
    if (emergencyFooter) emergencyFooter.classList.add('hide');
    showCctvPanel();
  });
  
  if (emergencyFnBtn) emergencyFnBtn.addEventListener('click', () => {
    const emergencyPanel = document.getElementById('emergency-panel');
    const emergencyFooter = document.getElementById('emergency-footer');
    if (emergencyPanel) emergencyPanel.classList.add('hide');
    if (emergencyFooter) emergencyFooter.classList.add('hide');
    showFnPanel();
  });

  // ==================== Reset Function ====================
  
  function performReset() {
    // Reset the application state
    runNumberInput.value = '';
    updateRouteDisplay();
    
    // Reset PID and DI displays
    if (pidDisplay) pidDisplay.textContent = '-';
    if (diDisplay) diDisplay.textContent = '-';
    
    // Reset door cycle state
    doorsCycled = false;
    if (doorCycleDisplay) doorCycleDisplay.textContent = 'N';
    
    // Clear any door cycle sequence timers
    if (doorCycleSequenceTimer1) {
      clearTimeout(doorCycleSequenceTimer1);
      doorCycleSequenceTimer1 = null;
    }
    if (doorCycleSequenceTimer2) {
      clearTimeout(doorCycleSequenceTimer2);
      doorCycleSequenceTimer2 = null;
    }
    
    // Reset selected station
    selectedStation = null;
    currentStations = [];
    currentHighlightIndex = 0;
    
    // Hide station list and mode title
    const stationListContainer = document.getElementById('station-list-container');
    const modeTitle = document.getElementById('mode-title');
    if (stationListContainer) stationListContainer.classList.remove('show');
    if (modeTitle) modeTitle.classList.add('hide');
    
    // Clear day selection
    const dayButtons = document.querySelectorAll('.day-btn');
    dayButtons.forEach(btn => btn.classList.remove('selected'));
    
    // Go to keyboard screen
    if (systemReadyScreen) systemReadyScreen.classList.add('hide');
    const touchKeyboard = document.getElementById('touch-keyboard');
    if (touchKeyboard) touchKeyboard.classList.remove('hide');
    
    // Hide all footers except startup
    if (initialFooter) initialFooter.classList.add('hide');
    stationFooter.classList.add('hide');
    normalFooter.classList.add('hide');
    startupFooter.classList.remove('hide');
    
    // Switch header to route display
    const headerTitle = document.getElementById('header-title');
    const headerRoute = document.getElementById('header-route');
    if (headerTitle) headerTitle.classList.add('hide');
    if (headerRoute) headerRoute.classList.remove('hide');
    
    helperBar.textContent = '"Enter" to verify. "Back" to edit.';
    
    // Reset display window
    if (displayWindow && !displayWindow.closed) {
      displayWindow.postMessage({ type: 'RESET' }, '*');
    }
    // Reset destination board
    if (destinationWindow && !destinationWindow.closed) {
      destinationWindow.postMessage({ type: 'RESET' }, '*');
    }
  }
  
  // Wire up reset buttons - go directly to keyboard screen
  if (resetBtn) resetBtn.addEventListener('click', performReset);
  if (stationResetBtn) stationResetBtn.addEventListener('click', performReset);
  if (normalResetBtn) normalResetBtn.addEventListener('click', performReset);

  // Initialize stop button colors (grey by default)
  updateStopButtonColor();
  } catch (error) {
    console.error('❌ CRITICAL ERROR during initialization:', error);
    console.error(error.stack);
    alert(`App initialization error: ${error.message}`);
  }
});

// ==================== CONSOLE HELPER FUNCTIONS ====================
// Expose search functions globally for console access

// Helper function to display search results in the console
window.findRoutesByRunNumber = async function(runNumber) {
  console.log(`\n🔍 Searching for routes with run number: "${runNumber}"\n`);
  const results = await searchRoutesByRunNumber(runNumber);
  
  if (results.length === 0) {
    console.log(`❌ No routes found for run number "${runNumber}"`);
    return [];
  }
  
  console.log(`✅ Found ${results.length} route(s):\n`);
  results.forEach((route, index) => {
    console.log(`\n━━━ Route ${index + 1} ━━━`);
    console.log(`Trip ID: ${route.tripId}`);
    console.log(`Form Code: ${route.formCode}`);
    console.log(`Route ID: ${route.routeId}`);
    console.log(`Route Name: ${route.routeName}`);
    console.log(`Destination: ${route.destination}`);
    console.log(`Direction: ${route.directionId}`);
    console.log(`Stations: ${route.stoppingPattern.length}`);
    
    if (route.stoppingPattern.length > 0) {
      console.log(`Stopping Pattern:`);
      route.stoppingPattern.forEach((station, i) => {
        const platform = station.platform ? ` [Platform ${station.platform}]` : '';
        console.log(`  ${i + 1}. ${station.name} (${station.code})${platform}`);
      });
    }
  });
  
  return results;
};

// Alternative: search by partial run number (substring match)
window.findRoutesByPartialRunNumber = async function(partialRunNumber) {
  console.log(`\n🔍 Searching for routes containing run number: "${partialRunNumber}"\n`);
  
  let currentTripMap = tripIdMap;
  if (globalGTFSData && globalGTFSData.tripIdMap && Object.keys(currentTripMap).length === 0) {
    currentTripMap = globalGTFSData.tripIdMap;
  }
  
  if (!currentTripMap || Object.keys(currentTripMap).length === 0) {
    console.warn('⚠️ No trip ID map available');
    return [];
  }
  
  const upperPartial = partialRunNumber.toUpperCase();
  const matches = [];
  
  for (const [tripId, routeId] of Object.entries(currentTripMap)) {
    if (tripId.toUpperCase().includes(upperPartial)) {
      if (globalGTFSData && globalGTFSData.routes && globalGTFSData.routes[routeId]) {
        const routeData = globalGTFSData.routes[routeId];
        
        // Extract form code from trip id
        const formCode = tripId.substring(tripId.lastIndexOf('-') + 1);
        
        // Find matching pattern
        let matchedPattern = null;
        if (routeData.patterns && Array.isArray(routeData.patterns)) {
          for (const pattern of routeData.patterns) {
            if (pattern.form_code === formCode && pattern.trip_id === tripId) {
              matchedPattern = pattern;
              break;
            }
          }
        }
        
        let stoppingPattern = null;
        if (matchedPattern && matchedPattern.stops && Array.isArray(matchedPattern.stops)) {
          stoppingPattern = matchedPattern.stops.map(station => ({
            name: normalizeStationName(station.name),
            code: station.code
          }));
        }
        
        matches.push({
          tripId: tripId,
          formCode: formCode,
          routeId: routeId,
          destination: routeData.route_long_name || 'Unknown',
          routeName: routeData.route_name || routeId,
          stoppingPattern: stoppingPattern || []
        });
      }
    }
  }
  
  if (matches.length === 0) {
    console.log(`❌ No routes found containing "${partialRunNumber}"`);
    return [];
  }
  
  console.log(`✅ Found ${matches.length} route(s):\n`);
  matches.forEach((route, index) => {
    console.log(`\n━━━ Route ${index + 1} ━━━`);
    console.log(`Trip ID: ${route.tripId}`);
    console.log(`Form Code: ${route.formCode}`);
    console.log(`Route ID: ${route.routeId}`);
    console.log(`Route Name: ${route.routeName}`);
    console.log(`Destination: ${route.destination}`);
    console.log(`Stations: ${route.stoppingPattern.length}`);
    
    if (route.stoppingPattern.length > 0) {
      console.log(`Stopping Pattern (first 5):`);
      route.stoppingPattern.slice(0, 5).forEach((station, i) => {
        console.log(`  ${i + 1}. ${station.name} (${station.code})`);
      });
      if (route.stoppingPattern.length > 5) {
        console.log(`  ... and ${route.stoppingPattern.length - 5} more`);
      }
    }
  });
  
  return matches;
};

// Helper to view GTFS data status
window.checkGTFSData = function() {
  console.log('\n📊 GTFS DATA STATUS:\n');
  console.log(`globalGTFSData loaded: ${globalGTFSData ? '✅ Yes' : '❌ No'}`);
  
  if (globalGTFSData) {
    console.log(`Total routes: ${globalGTFSData.totalRoutes || 'Unknown'}`);
    console.log(`Trip ID mappings: ${Object.keys(globalGTFSData.tripIdMap || {}).length}`);
    
    if (globalGTFSData.routes) {
      console.log(`Routes data: ${Object.keys(globalGTFSData.routes).length} routes`);
      
      // Show sample of routes
      const sampleRoutes = Object.entries(globalGTFSData.routes).slice(0, 3);
      console.log(`Sample routes with pattern counts:`);
      sampleRoutes.forEach(([routeId, routeData]) => {
        const patternCount = routeData.patterns ? routeData.patterns.length : 0;
        console.log(`  ${routeId}: ${patternCount} patterns`);
      });
    }
  }
  
  console.log(`\nTrip ID map (local): ${Object.keys(tripIdMap).length} entries`);
  console.log(`Run code index: ${Object.keys(runCodeIndex).length} entries`);
};

console.log(`✅ Route search helpers loaded! Use these commands:`);
console.log(`  • findRoutesByRunNumber("18S4")        - Find routes by exact run number (FORM_CODE + TRIP_ID matching)`);
console.log(`  • findRoutesByPartialRunNumber("18S")   - Find routes by partial run number`);
console.log(`  • checkGTFSData()                        - Check GTFS data status`);