const fs = require('fs');
const { createCanvas } = (() => {
  try { return require('canvas'); } catch(e) { return {}; }
})();
// Fallback: write a minimal PNG manually
// 192x192 PNG with golden background and "UC" text - using a simple data URL approach
console.log('No canvas, will use base64-encoded PNG fallback');
