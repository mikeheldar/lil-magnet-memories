/**
 * USA holiday frame definitions — 2 varied styles per major holiday.
 * Schedules use MM-DD strings (year-agnostic); featured logic compares month/day only.
 */

const VIEWPORT_SIZE = 420;

const HOLIDAY_FRAMES = [
  // New Year's
  {
    id: 'holiday_newyear_gold_sparkle',
    name: "New Year's Gold Sparkle",
    holiday: 'newyear',
    tags: ['holiday', 'newyear'],
    schedule: { startDate: '12-20', endDate: '01-05', priority: 10 },
    draw: (img) => {
      img.fill('#0f172a');
      img.drawBorderGradient(['#fbbf24', '#fef3c7', '#f59e0b', '#78350f'], 0.2);
      img.drawStarScatter(['#fde68a', '#ffffff', '#fcd34d'], 0.2, 90);
      img.fillCenterPanel('#1e293b', 0.14);
    },
  },
  {
    id: 'holiday_newyear_silver_countdown',
    name: "New Year's Silver Countdown",
    holiday: 'newyear',
    tags: ['holiday', 'newyear'],
    schedule: { startDate: '12-20', endDate: '01-05', priority: 9 },
    draw: (img) => {
      img.fill('#111827');
      img.drawDiagonalStripes('#374151', '#9ca3af', 0.19, 18);
      img.drawDotBand(['#e5e7eb', '#f9fafb', '#d1d5db'], 0.17, 8, 28);
      img.drawCornerBlocks('#cbd5e1', 0.18, 0.03);
    },
  },

  // Valentine's Day
  {
    id: 'holiday_valentines_pink_hearts',
    name: "Valentine's Pink Hearts",
    holiday: 'valentines',
    tags: ['holiday', 'valentines'],
    schedule: { startDate: '02-01', endDate: '02-14', priority: 10 },
    draw: (img) => {
      img.fill('#831843');
      img.drawBorderGradient(['#fbcfe8', '#f472b6', '#db2777'], 0.2);
      img.drawHeartScatter('#fda4af', 0.19, 42);
      img.fillCenterPanel('#9d174d', 0.14);
    },
  },
  {
    id: 'holiday_valentines_red_roses',
    name: "Valentine's Red Roses",
    holiday: 'valentines',
    tags: ['holiday', 'valentines'],
    schedule: { startDate: '02-01', endDate: '02-14', priority: 9 },
    draw: (img) => {
      img.fill('#450a0a');
      img.drawCornerBlocks('#ef4444', 0.2, 0.04);
      img.drawDotBand(['#fecaca', '#f87171', '#991b1b'], 0.16, 7, 30);
      img.drawHeartScatter('#fb7185', 0.17, 28);
    },
  },

  // St. Patrick's Day
  {
    id: 'holiday_stpatricks_shamrock',
    name: "St. Patrick's Shamrock",
    holiday: 'stpatricks',
    tags: ['holiday', 'stpatricks'],
    schedule: { startDate: '03-10', endDate: '03-17', priority: 10 },
    draw: (img) => {
      img.fill('#14532d');
      img.drawBorderGradient(['#86efac', '#22c55e', '#15803d'], 0.2);
      img.drawDotBand(['#bbf7d0', '#4ade80', '#166534'], 0.17, 9, 32);
      img.drawLeafScatter(['#22c55e', '#fde047'], 0.18, 55);
    },
  },
  {
    id: 'holiday_stpatricks_gold_clover',
    name: "St. Patrick's Gold Clover",
    holiday: 'stpatricks',
    tags: ['holiday', 'stpatricks'],
    schedule: { startDate: '03-10', endDate: '03-17', priority: 9 },
    draw: (img) => {
      img.fill('#052e16');
      img.drawDiagonalStripes('#166534', '#ca8a04', 0.18, 22);
      img.drawCornerBlocks('#eab308', 0.16, 0.05);
      img.fillRing(600, 600, 480, 560, '#16a34a');
    },
  },

  // Easter (approximate window — covers late March through mid April)
  {
    id: 'holiday_easter_pastel_eggs',
    name: 'Easter Pastel Eggs',
    holiday: 'easter',
    tags: ['holiday', 'easter'],
    schedule: { startDate: '03-20', endDate: '04-25', priority: 10 },
    draw: (img) => {
      img.fill('#fdf4ff');
      img.drawBorderGradient(['#ddd6fe', '#fbcfe8', '#bfdbfe', '#bbf7d0'], 0.2);
      img.drawDotBand(['#f0abfc', '#93c5fd', '#fde68a', '#86efac'], 0.17, 12, 36);
      img.fillCenterPanel('#faf5ff', 0.13);
    },
  },
  {
    id: 'holiday_easter_spring_bloom',
    name: 'Easter Spring Bloom',
    holiday: 'easter',
    tags: ['holiday', 'easter'],
    schedule: { startDate: '03-20', endDate: '04-25', priority: 9 },
    draw: (img) => {
      img.fill('#ecfccb');
      img.drawCornerBlocks('#a855f7', 0.17, 0.04);
      img.drawLeafScatter(['#eab308', '#ec4899', '#38bdf8'], 0.19, 60);
      img.drawBorderGradient(['#fef08a', '#f9a8d4', '#c4b5fd'], 0.16);
    },
  },

  // Memorial Day
  {
    id: 'holiday_memorial_stars_stripes',
    name: 'Memorial Day Stars & Stripes',
    holiday: 'memorial',
    tags: ['holiday', 'memorial', 'patriotic'],
    schedule: { startDate: '05-20', endDate: '05-31', priority: 10 },
    draw: (img) => {
      img.fill('#1e3a8a');
      img.drawDiagonalStripes('#dc2626', '#ffffff', 0.19, 26);
      img.drawStarScatter(['#ffffff', '#93c5fd', '#fecaca'], 0.18, 70);
    },
  },
  {
    id: 'holiday_memorial_honor_ribbon',
    name: 'Memorial Day Honor Ribbon',
    holiday: 'memorial',
    tags: ['holiday', 'memorial', 'patriotic'],
    schedule: { startDate: '05-20', endDate: '05-31', priority: 9 },
    draw: (img) => {
      img.fill('#0f172a');
      img.drawBorderGradient(['#1d4ed8', '#ffffff', '#b91c1c'], 0.21);
      img.drawCornerBlocks('#ef4444', 0.15, 0.04);
      img.fillRing(600, 600, 500, 570, '#1e40af');
    },
  },

  // Independence Day
  {
    id: 'holiday_july4_fireworks',
    name: 'July 4th Fireworks',
    holiday: 'july4',
    tags: ['holiday', 'july4', 'patriotic'],
    schedule: { startDate: '06-25', endDate: '07-07', priority: 10 },
    draw: (img) => {
      img.fill('#0c1844');
      img.drawStarScatter(['#ef4444', '#ffffff', '#3b82f6', '#fde047'], 0.2, 100);
      img.drawBorderGradient(['#1d4ed8', '#ffffff', '#dc2626'], 0.17);
    },
  },
  {
    id: 'holiday_july4_liberty_stars',
    name: 'July 4th Liberty Stars',
    holiday: 'july4',
    tags: ['holiday', 'july4', 'patriotic'],
    schedule: { startDate: '06-25', endDate: '07-07', priority: 9 },
    draw: (img) => {
      img.fill('#172554');
      img.drawDiagonalStripes('#2563eb', '#ffffff', 0.18, 20);
      img.drawCornerBlocks('#dc2626', 0.19, 0.03);
      img.drawDotBand(['#ffffff', '#60a5fa', '#f87171'], 0.16, 6, 26);
    },
  },

  // Labor Day
  {
    id: 'holiday_labor_autumn_tools',
    name: 'Labor Day Autumn Tools',
    holiday: 'labor',
    tags: ['holiday', 'labor'],
    schedule: { startDate: '08-25', endDate: '09-07', priority: 10 },
    draw: (img) => {
      img.fill('#78350f');
      img.drawBorderGradient(['#fdba74', '#f97316', '#9a3412'], 0.2);
      img.drawDiagonalStripes('#fed7aa', '#ea580c', 0.17, 28);
      img.drawCornerBlocks('#fbbf24', 0.16, 0.04);
    },
  },
  {
    id: 'holiday_labor_end_of_summer',
    name: 'Labor Day End of Summer',
    holiday: 'labor',
    tags: ['holiday', 'labor'],
    schedule: { startDate: '08-25', endDate: '09-07', priority: 9 },
    draw: (img) => {
      img.fill('#0ea5e9');
      img.drawLeafScatter(['#f59e0b', '#ef4444', '#fde047'], 0.19, 50);
      img.drawBorderGradient(['#fef08a', '#fb923c', '#0284c7'], 0.18);
      img.fillCenterPanel('#0369a1', 0.14);
    },
  },

  // Halloween
  {
    id: 'holiday_halloween_pumpkins',
    name: 'Halloween Pumpkins',
    holiday: 'halloween',
    tags: ['holiday', 'halloween'],
    schedule: { startDate: '10-15', endDate: '10-31', priority: 10 },
    draw: (img) => {
      img.fill('#1f1020');
      img.drawBorderGradient(['#f97316', '#7c2d12', '#451a03'], 0.2);
      img.drawDotBand(['#fb923c', '#22c55e', '#000000'], 0.17, 10, 34);
      img.drawCornerBlocks('#ea580c', 0.17, 0.04);
    },
  },
  {
    id: 'holiday_halloween_spooky_night',
    name: 'Halloween Spooky Night',
    holiday: 'halloween',
    tags: ['holiday', 'halloween'],
    schedule: { startDate: '10-15', endDate: '10-31', priority: 9 },
    draw: (img) => {
      img.fill('#2e1065');
      img.drawStarScatter(['#a855f7', '#ffffff', '#4ade80'], 0.19, 65);
      img.drawDiagonalStripes('#581c87', '#111827', 0.18, 24);
      img.fillRing(600, 600, 490, 565, '#7e22ce');
    },
  },

  // Thanksgiving
  {
    id: 'holiday_thanksgiving_harvest',
    name: 'Thanksgiving Harvest',
    holiday: 'thanksgiving',
    tags: ['holiday', 'thanksgiving'],
    schedule: { startDate: '11-15', endDate: '11-30', priority: 10 },
    draw: (img) => {
      img.fill('#7c2d12');
      img.drawLeafScatter(['#ea580c', '#ca8a04', '#854d0e', '#166534'], 0.2, 75);
      img.drawBorderGradient(['#fdba74', '#d97706', '#92400e'], 0.19);
    },
  },
  {
    id: 'holiday_thanksgiving_autumn_wreath',
    name: 'Thanksgiving Autumn Wreath',
    holiday: 'thanksgiving',
    tags: ['holiday', 'thanksgiving'],
    schedule: { startDate: '11-15', endDate: '11-30', priority: 9 },
    draw: (img) => {
      img.fill('#422006');
      img.drawCornerBlocks('#b45309', 0.18, 0.04);
      img.drawDotBand(['#fbbf24', '#ef4444', '#15803d'], 0.16, 8, 30);
      img.fillRing(600, 600, 470, 560, '#92400e');
    },
  },

  // Christmas
  {
    id: 'holiday_christmas_holly',
    name: 'Christmas Holly',
    holiday: 'christmas',
    tags: ['holiday', 'christmas'],
    schedule: { startDate: '12-01', endDate: '12-26', priority: 10 },
    draw: (img) => {
      img.fill('#14532d');
      img.drawBorderGradient(['#166534', '#dc2626', '#fef08a', '#166534'], 0.2);
      img.drawDotBand(['#ef4444', '#22c55e', '#fde047'], 0.17, 7, 28);
      img.drawCornerBlocks('#b91c1c', 0.15, 0.04);
    },
  },
  {
    id: 'holiday_christmas_snowflakes',
    name: 'Christmas Snowflakes',
    holiday: 'christmas',
    tags: ['holiday', 'christmas'],
    schedule: { startDate: '12-01', endDate: '12-26', priority: 9 },
    draw: (img) => {
      img.fill('#0c4a6e');
      img.drawStarScatter(['#ffffff', '#bae6fd', '#e0f2fe'], 0.2, 85);
      img.drawBorderGradient(['#38bdf8', '#ffffff', '#0284c7'], 0.18);
      img.fillCenterPanel('#075985', 0.14);
    },
  },
];

function buildBuilderRecipe(cutout = { x: 0.15, y: 0.15, width: 0.7, height: 0.7 }) {
  return {
    stencil: { scale: 1, x: 0, y: 0 },
    cutout,
    textLayers: [],
    viewportSize: VIEWPORT_SIZE,
    sourceImagePath: null,
  };
}

module.exports = {
  HOLIDAY_FRAMES,
  VIEWPORT_SIZE,
  buildBuilderRecipe,
};
