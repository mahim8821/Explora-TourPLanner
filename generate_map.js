const fs = require('fs');

// ── Load data ────────────────────────────────────────────────────────────────
const geojson = JSON.parse(
  fs.readFileSync('./node_modules/bangladesh-geojson/src/data/bangladesh.geojson', 'utf8')
);
const districtRef = JSON.parse(
  fs.readFileSync('./node_modules/bangladesh-geojson/src/data/bd-districts.json', 'utf8')
);

// ── Build bn_name lookup ─────────────────────────────────────────────────────
const bnNameMap = {};
districtRef.districts.forEach(d => { bnNameMap[d.name] = d.bn_name; });

// ── Find actual bounding box from coordinates ────────────────────────────────
let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;

function measureCoords(arr) {
  if (typeof arr[0] === 'number') {
    if (arr[0] < minLng) minLng = arr[0];
    if (arr[0] > maxLng) maxLng = arr[0];
    if (arr[1] < minLat) minLat = arr[1];
    if (arr[1] > maxLat) maxLat = arr[1];
  } else {
    arr.forEach(measureCoords);
  }
}
geojson.features.forEach(f => measureCoords(f.geometry.coordinates));

console.log(`Bounds: lng [${minLng.toFixed(4)}, ${maxLng.toFixed(4)}], lat [${minLat.toFixed(4)}, ${maxLat.toFixed(4)}]`);

// ── Projection: equirectangular with padding ─────────────────────────────────
const SVG_W = 400;
const SVG_H = 500;
const PAD = 8;

// Compute uniform scale (preserve aspect ratio)
const lngSpan = maxLng - minLng;
const latSpan = maxLat - minLat;
const scaleX = (SVG_W - 2 * PAD) / lngSpan;
const scaleY = (SVG_H - 2 * PAD) / latSpan;
const scale = Math.min(scaleX, scaleY);

// Center the map
const projW = lngSpan * scale;
const projH = latSpan * scale;
const offsetX = PAD + (SVG_W - 2 * PAD - projW) / 2;
const offsetY = PAD + (SVG_H - 2 * PAD - projH) / 2;

function project(lng, lat) {
  const x = offsetX + (lng - minLng) * scale;
  const y = offsetY + projH - (lat - minLat) * scale;
  return [x.toFixed(2), y.toFixed(2)];
}

// ── Convert geometry ring to SVG path string ─────────────────────────────────
function ringToPath(ring) {
  // Simplify: skip points that are too close to previous (reduces file size)
  const THRESHOLD = 0.3; // pixels
  let lastX = null, lastY = null;
  const parts = [];
  ring.forEach((coord, i) => {
    const [x, y] = project(coord[0], coord[1]);
    const px = parseFloat(x), py = parseFloat(y);
    if (i === 0) {
      parts.push(`M${x},${y}`);
      lastX = px; lastY = py;
    } else {
      const dist = Math.sqrt((px - lastX) ** 2 + (py - lastY) ** 2);
      if (dist >= THRESHOLD || i === ring.length - 1) {
        parts.push(`L${x},${y}`);
        lastX = px; lastY = py;
      }
    }
  });
  parts.push('Z');
  return parts.join('');
}

function geomToPath(geom) {
  if (geom.type === 'Polygon') {
    return geom.coordinates.map(ringToPath).join('');
  } else if (geom.type === 'MultiPolygon') {
    return geom.coordinates.flatMap(poly => poly.map(ringToPath)).join('');
  }
  return '';
}

// ── Group upazila geometries by district name ────────────────────────────────
const districtPathMap = {};
geojson.features.forEach(feature => {
  const name = feature.properties.district_name;
  if (!name) return;
  if (!districtPathMap[name]) districtPathMap[name] = '';
  districtPathMap[name] += geomToPath(feature.geometry);
});

const districtNames = Object.keys(districtPathMap).sort();
console.log(`Districts found: ${districtNames.length}`);
console.log(districtNames.join(', '));

// ── Generate TSX component ───────────────────────────────────────────────────
const pathEntries = districtNames.map(name => {
  const safeName = name.replace(/'/g, "\\'").replace(/"/g, '\\"');
  const bnName = (bnNameMap[name] || '').replace(/'/g, "\\'");
  return { name: safeName, bnName, path: districtPathMap[name] };
});

let tsx = `import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

export interface BangladeshMapProps {
  width?: number;
  height?: number;
  selectedDistricts?: string[];
  onDistrictPress?: (district: string) => void;
  fillColor?: string;
  selectedColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

// Pre-computed SVG paths for all 64 Bangladesh districts
// Projection: equirectangular, viewBox "0 0 ${SVG_W} ${SVG_H}"
const DISTRICT_PATHS: { name: string; bn: string; d: string }[] = [
${pathEntries.map(e => `  { name: "${e.name}", bn: "${e.bnName}", d: "${e.path}" }`).join(',\n')}
];

export default function BangladeshMap({
  width = ${SVG_W},
  height = ${SVG_H},
  selectedDistricts = [],
  onDistrictPress,
  fillColor = '#D8D8D8',
  selectedColor = '#2E7D32',
  strokeColor = '#FFFFFF',
  strokeWidth = 0.6,
}: BangladeshMapProps) {
  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox="0 0 ${SVG_W} ${SVG_H}">
        <G>
          {DISTRICT_PATHS.map(district => {
            const isSelected = selectedDistricts.includes(district.name);
            return (
              <Path
                key={district.name}
                d={district.d}
                fill={isSelected ? selectedColor : fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                onPress={() => onDistrictPress && onDistrictPress(district.name)}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
`;

fs.writeFileSync('src/components/BangladeshMap.tsx', tsx);
console.log(`✅ Generated BangladeshMap.tsx — ${districtNames.length} districts`);
console.log(`   File size: ${(tsx.length / 1024).toFixed(1)} KB`);
