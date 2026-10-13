// Mirrors BROADCAST in frontend/src/config/funnel.js; only the fields the emails need.
export const broadcast = () => ({
  title: process.env.BROADCAST_TITLE || 'Real Estate vs Digital Estate',
  durationSec: Number(process.env.BROADCAST_DURATION_MIN || 75) * 60,
  whitepaperUrl: process.env.WHITEPAPER_URL || encodeURI('/Whitepaper on Compute - Coco by Hibarri.pdf'),
});
