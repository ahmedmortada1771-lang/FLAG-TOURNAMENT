import React, { useRef, useEffect, useState } from 'react';
import { Compass, Maximize2, Minimize2, Play, Pause, Zap, RotateCw, Globe, Sparkles } from 'lucide-react';

interface Props {
  className?: string;
  isCompact?: boolean;
}

// Polygon coordinates [lat, lon][] for Continents and Major Islands
const CONTINENT_POLYGONS: { name: string; color: string; fill: string; coords: [number, number][] }[] = [
  // --- CONTINENTS ---
  {
    name: 'North America',
    color: '#06b6d4', // Neon Cyan
    fill: 'rgba(6, 182, 212, 0.25)',
    coords: [
      [70, -165], [72, -125], [60, -135], [58, -140], [60, -165], [64, -175], [70, -165],
      [68, -135], [58, -130], [48, -125], [38, -123], [32, -117], [22, -106], [16, -95],
      [14, -92], [9, -79], [8, -78], [15, -88], [21, -87], [25, -97], [30, -84], [25, -80],
      [31, -81], [35, -75], [41, -70], [45, -63], [48, -53], [52, -56], [60, -64], [62, -77],
      [70, -85], [75, -95], [72, -120], [70, -165]
    ]
  },
  {
    name: 'South America',
    color: '#10b981', // Neon Emerald
    fill: 'rgba(16, 185, 129, 0.25)',
    coords: [
      [11, -73], [10, -62], [7, -57], [2, -50], [-4, -37], [-12, -37], [-23, -42], [-33, -52],
      [-40, -62], [-52, -68], [-55, -66], [-54, -71], [-45, -75], [-33, -72], [-18, -70],
      [-13, -76], [-5, -81], [1, -79], [7, -77], [11, -73]
    ]
  },
  {
    name: 'Europe',
    color: '#38bdf8', // Neon Sky
    fill: 'rgba(56, 189, 248, 0.25)',
    coords: [
      [36, -9], [43, -9], [44, -1], [48, -4], [50, 1], [53, 5], [55, 8], [57, 10],
      [63, 10], [70, 20], [71, 28], [68, 30], [60, 30], [55, 38], [50, 36], [45, 36],
      [42, 28], [40, 22], [37, 23], [36, 15], [38, 12], [44, 8], [43, 3], [36, -5], [36, -9]
    ]
  },
  {
    name: 'Africa',
    color: '#fbbf24', // Neon Gold/Amber
    fill: 'rgba(251, 191, 36, 0.25)',
    coords: [
      [35, -6], [37, 10], [33, 35], [28, 33], [22, 37], [12, 44], [11, 51], [2, 45],
      [-5, 39], [-11, 40], [-26, 33], [-34, 25], [-34, 18], [-22, 14], [-12, 13],
      [-5, 12], [5, 10], [4, 2], [5, -10], [12, -16], [21, -17], [28, -13], [35, -6]
    ]
  },
  {
    name: 'Asia',
    color: '#d946ef', // Neon Fuchsia
    fill: 'rgba(217, 70, 239, 0.25)',
    coords: [
      [70, 35], [72, 70], [76, 100], [70, 140], [60, 160], [60, 170], [55, 160],
      [45, 140], [38, 118], [22, 114], [22, 108], [15, 108], [10, 104], [1, 104],
      [8, 98], [16, 96], [20, 88], [10, 78], [8, 77], [23, 68], [25, 62], [15, 53],
      [12, 44], [28, 48], [30, 35], [40, 35], [42, 28], [55, 38], [60, 30], [70, 35]
    ]
  },
  {
    name: 'Australia',
    color: '#34d399', // Neon Mint
    fill: 'rgba(52, 211, 153, 0.25)',
    coords: [
      [-12, 131], [-14, 136], [-12, 142], [-18, 146], [-25, 153], [-37, 150], [-38, 140],
      [-35, 135], [-35, 117], [-22, 114], [-14, 126], [-12, 131]
    ]
  },
  {
    name: 'Greenland',
    color: '#a855f7', // Neon Purple
    fill: 'rgba(168, 85, 247, 0.25)',
    coords: [
      [80, -65], [82, -20], [75, -20], [68, -30], [60, -43], [65, -53], [76, -70], [80, -65]
    ]
  },

  // --- MAJOR ISLANDS ---
  {
    name: 'Madagascar',
    color: '#fbbf24',
    fill: 'rgba(251, 191, 36, 0.25)',
    coords: [[-12, 49], [-16, 44], [-25, 47], [-25, 44], [-15, 47], [-12, 49]]
  },
  // Japan Islands (Honshu, Hokkaido, Kyushu, Shikoku)
  {
    name: 'Japan (Honshu)',
    color: '#d946ef',
    fill: 'rgba(217, 70, 239, 0.25)',
    coords: [
      [41.5, 141.0], [40.0, 141.9], [38.3, 141.5], [37.0, 141.0], [36.0, 140.8],
      [35.0, 139.8], [34.6, 138.8], [34.6, 137.0], [34.2, 136.8], [33.6, 135.9],
      [34.5, 135.1], [34.2, 132.5], [34.0, 130.9], [34.8, 132.0], [35.5, 133.3],
      [35.6, 135.2], [36.9, 137.2], [37.5, 138.2], [39.0, 139.8], [40.8, 140.0], [41.5, 141.0]
    ]
  },
  {
    name: 'Japan (Hokkaido)',
    color: '#d946ef',
    fill: 'rgba(217, 70, 239, 0.25)',
    coords: [[45.5, 141.8], [44.3, 145.3], [43.0, 145.8], [42.0, 143.2], [41.7, 140.6], [43.2, 140.4], [45.5, 141.8]]
  },
  {
    name: 'Japan (Kyushu)',
    color: '#d946ef',
    fill: 'rgba(217, 70, 239, 0.25)',
    coords: [[33.9, 130.9], [33.2, 131.8], [31.0, 130.8], [31.5, 130.2], [33.5, 129.7], [33.9, 130.9]]
  },
  {
    name: 'Japan (Shikoku)',
    color: '#d946ef',
    fill: 'rgba(217, 70, 239, 0.25)',
    coords: [[34.4, 134.3], [33.8, 134.7], [33.2, 133.0], [33.5, 132.0], [34.2, 133.5], [34.4, 134.3]]
  },
  {
    name: 'Great Britain',
    color: '#38bdf8',
    fill: 'rgba(56, 189, 248, 0.25)',
    coords: [[58, -5], [56, -2], [51, 1], [50, -5], [54, -3], [58, -5]]
  },
  {
    name: 'Ireland',
    color: '#38bdf8',
    fill: 'rgba(56, 189, 248, 0.25)',
    coords: [[55, -8], [54, -6], [51, -10], [53, -10], [55, -8]]
  },
  {
    name: 'Iceland',
    color: '#38bdf8',
    fill: 'rgba(56, 189, 248, 0.25)',
    coords: [[66, -23], [64, -14], [63, -18], [65, -24], [66, -23]]
  },
  {
    name: 'New Zealand North',
    color: '#34d399',
    fill: 'rgba(52, 211, 153, 0.25)',
    coords: [[-35, 174], [-38, 178], [-41, 175], [-38, 174], [-35, 174]]
  },
  {
    name: 'New Zealand South',
    color: '#34d399',
    fill: 'rgba(52, 211, 153, 0.25)',
    coords: [[-41, 172], [-46, 167], [-46, 170], [-43, 173], [-41, 172]]
  },
  {
    name: 'Sumatra',
    color: '#d946ef',
    fill: 'rgba(217, 70, 239, 0.25)',
    coords: [[5, 95], [3, 98], [-6, 105], [-5, 102], [2, 96], [5, 95]]
  },
  {
    name: 'Borneo',
    color: '#d946ef',
    fill: 'rgba(217, 70, 239, 0.25)',
    coords: [[7, 117], [4, 119], [-1, 117], [-4, 111], [1, 110], [7, 117]]
  },
  {
    name: 'Java',
    color: '#d946ef',
    fill: 'rgba(217, 70, 239, 0.25)',
    coords: [[-6, 106], [-7, 114], [-8, 110], [-6, 106]]
  },
  {
    name: 'Sulawesi',
    color: '#d946ef',
    fill: 'rgba(217, 70, 239, 0.25)',
    coords: [[1, 121], [-5, 122], [-3, 120], [1, 125], [1, 121]]
  },
  {
    name: 'Papua New Guinea',
    color: '#34d399',
    fill: 'rgba(52, 211, 153, 0.25)',
    coords: [[-3, 131], [-9, 147], [-10, 150], [-7, 141], [-3, 131]]
  },
  {
    name: 'Philippines',
    color: '#d946ef',
    fill: 'rgba(217, 70, 239, 0.25)',
    coords: [[18, 120], [14, 121], [7, 125], [10, 124], [15, 120], [18, 120]]
  },
  {
    name: 'Sri Lanka',
    color: '#d946ef',
    fill: 'rgba(217, 70, 239, 0.25)',
    coords: [[10, 80], [7, 82], [6, 80], [9, 80]]
  },
  {
    name: 'Cuba',
    color: '#06b6d4',
    fill: 'rgba(6, 182, 212, 0.25)',
    coords: [[23, -82], [21, -76], [20, -75], [22, -84], [23, -82]]
  },
  {
    name: 'Hispaniola',
    color: '#06b6d4',
    fill: 'rgba(6, 182, 212, 0.25)',
    coords: [[20, -72], [18, -68], [18, -74], [20, -72]]
  },
  {
    name: 'Hawaii',
    color: '#06b6d4',
    fill: 'rgba(6, 182, 212, 0.25)',
    coords: [[22, -160], [19, -155], [20, -156], [22, -160]]
  },
  {
    name: 'Taiwan',
    color: '#d946ef',
    fill: 'rgba(217, 70, 239, 0.25)',
    coords: [[25, 121], [22, 121], [24, 120], [25, 121]]
  },
  {
    name: 'Tasmania',
    color: '#34d399',
    fill: 'rgba(52, 211, 153, 0.25)',
    coords: [[-40, 145], [-43, 148], [-43, 145], [-40, 145]]
  },
  {
    name: 'Newfoundland',
    color: '#06b6d4',
    fill: 'rgba(6, 182, 212, 0.25)',
    coords: [[51, -56], [47, -53], [47, -59], [51, -56]]
  }
];

// Pre-process continent coordinates to radians for maximum performance
const PROCESSED_CONTINENTS = CONTINENT_POLYGONS.map((c) => ({
  name: c.name,
  color: c.color,
  fill: c.fill,
  radCoords: c.coords.map(([lat, lon]) => [
    (lat * Math.PI) / 180,
    (lon * Math.PI) / 180
  ] as [number, number])
}));

// Capital Pins pre-converted to radians - Exactly 3 major capitals per continent (18 total)
const CAPITAL_PINS: { name: string; code: string; latRad: number; lonRad: number; color: string }[] = [
  // --- AFRICA (3) ---
  { name: 'Cairo', code: 'EG', latRad: (30.04 * Math.PI) / 180, lonRad: (31.23 * Math.PI) / 180, color: '#fbbf24' },
  { name: 'Nairobi', code: 'KE', latRad: (-1.29 * Math.PI) / 180, lonRad: (36.82 * Math.PI) / 180, color: '#fbbf24' },
  { name: 'Pretoria', code: 'ZA', latRad: (-25.74 * Math.PI) / 180, lonRad: (28.22 * Math.PI) / 180, color: '#fbbf24' },

  // --- ASIA (3) ---
  { name: 'Tokyo', code: 'JP', latRad: (35.68 * Math.PI) / 180, lonRad: (139.76 * Math.PI) / 180, color: '#d946ef' },
  { name: 'Beijing', code: 'CN', latRad: (39.90 * Math.PI) / 180, lonRad: (116.40 * Math.PI) / 180, color: '#d946ef' },
  { name: 'New Delhi', code: 'IN', latRad: (28.61 * Math.PI) / 180, lonRad: (77.21 * Math.PI) / 180, color: '#d946ef' },

  // --- EUROPE (3) ---
  { name: 'Paris', code: 'FR', latRad: (48.85 * Math.PI) / 180, lonRad: (2.35 * Math.PI) / 180, color: '#38bdf8' },
  { name: 'London', code: 'GB', latRad: (51.50 * Math.PI) / 180, lonRad: (-0.12 * Math.PI) / 180, color: '#38bdf8' },
  { name: 'Berlin', code: 'DE', latRad: (52.52 * Math.PI) / 180, lonRad: (13.40 * Math.PI) / 180, color: '#38bdf8' },

  // --- NORTH AMERICA (3) ---
  { name: 'Washington', code: 'US', latRad: (38.90 * Math.PI) / 180, lonRad: (-77.03 * Math.PI) / 180, color: '#06b6d4' },
  { name: 'Ottawa', code: 'CA', latRad: (45.42 * Math.PI) / 180, lonRad: (-75.69 * Math.PI) / 180, color: '#06b6d4' },
  { name: 'Mexico City', code: 'MX', latRad: (19.43 * Math.PI) / 180, lonRad: (-99.13 * Math.PI) / 180, color: '#06b6d4' },

  // --- SOUTH AMERICA (3) ---
  { name: 'Brasília', code: 'BR', latRad: (-15.79 * Math.PI) / 180, lonRad: (-47.88 * Math.PI) / 180, color: '#10b981' },
  { name: 'Buenos Aires', code: 'AR', latRad: (-34.60 * Math.PI) / 180, lonRad: (-58.38 * Math.PI) / 180, color: '#10b981' },
  { name: 'Bogotá', code: 'CO', latRad: (4.71 * Math.PI) / 180, lonRad: (-74.07 * Math.PI) / 180, color: '#10b981' },

  // --- AUSTRALIA & OCEANIA (3) ---
  { name: 'Canberra', code: 'AU', latRad: (-35.28 * Math.PI) / 180, lonRad: (149.13 * Math.PI) / 180, color: '#34d399' },
  { name: 'Wellington', code: 'NZ', latRad: (-41.29 * Math.PI) / 180, lonRad: (174.77 * Math.PI) / 180, color: '#34d399' },
  { name: 'Suva', code: 'FJ', latRad: (-18.14 * Math.PI) / 180, lonRad: (178.44 * Math.PI) / 180, color: '#34d399' }
];

const AXIAL_TILT = (23.5 * Math.PI) / 180;
const COS_TILT = Math.cos(AXIAL_TILT);
const SIN_TILT = Math.sin(AXIAL_TILT);

export const InteractiveGlobe: React.FC<Props> = ({ className = '', isCompact = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Rotation state
  const rotXRef = useRef<number>(0.3); // Pitch
  const rotYRef = useRef<number>(1.2); // Yaw
  const velXRef = useRef<number>(0);
  const velYRef = useRef<number>(0.006);

  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [spinSpeed, setSpinSpeed] = useState<'normal' | 'fast'>('normal');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const radius = Math.min(width, height) * (isCompact ? 0.36 : 0.38);
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Physics momentum
      if (!isDraggingRef.current) {
        if (isAutoSpinning) {
          const targetVel = spinSpeed === 'fast' ? 0.022 : 0.006;
          velYRef.current = velYRef.current * 0.95 + targetVel * 0.05;
        } else {
          velYRef.current *= 0.92;
        }
        velXRef.current *= 0.92;

        rotYRef.current += velYRef.current;
        rotXRef.current += velXRef.current;

        // Clamp pitch
        rotXRef.current = Math.max(-1.1, Math.min(1.1, rotXRef.current));
      }

      const rx = rotXRef.current;
      const ry = rotYRef.current;

      const cosRx = Math.cos(rx);
      const sinRx = Math.sin(rx);
      const cosRy = Math.cos(ry);
      const sinRy = Math.sin(ry);

      // Fast 3D Projection
      const projectRad = (latRad: number, lonRad: number) => {
        const cosLat = Math.cos(latRad);
        let x = cosLat * Math.sin(lonRad);
        let y = Math.sin(latRad);
        let z = cosLat * Math.cos(lonRad);

        // Axial tilt
        const y0 = y * COS_TILT - x * SIN_TILT;
        const x0 = y * SIN_TILT + x * COS_TILT;
        y = y0;
        x = x0;

        // Pitch
        const y1 = y * cosRx - z * sinRx;
        const z1 = y * sinRx + z * cosRx;

        // Yaw
        const x2 = x * cosRy + z1 * sinRy;
        const z2 = -x * sinRy + z1 * cosRy;

        return {
          px: cx + x2 * radius,
          py: cy - y1 * radius,
          pz: z2 // > 0 is facing camera
        };
      };

      const now = Date.now() * 0.002;

      // 1. Neon Cyberpunk Outer Glow Aura
      const auraGrad = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius * 1.35);
      auraGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      auraGrad.addColorStop(0.5, 'rgba(217, 70, 239, 0.15)');
      auraGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 2. Dark CyberVoid Sphere Base
      const sphereGrad = ctx.createRadialGradient(
        cx - radius * 0.3,
        cy - radius * 0.3,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      sphereGrad.addColorStop(0, '#0284c7'); // Electric cyan core accent
      sphereGrad.addColorStop(0.3, '#0369a1');
      sphereGrad.addColorStop(0.7, '#0f172a'); // Dark slate
      sphereGrad.addColorStop(1, '#020617'); // Dark void horizon

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Neon Cyber Grid Lines (Equator & Meridian Mesh)
      ctx.lineWidth = 1;

      // Latitude circles
      for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
        const latRad = (latDeg * Math.PI) / 180;
        ctx.strokeStyle = latDeg === 0 ? 'rgba(217, 70, 239, 0.6)' : 'rgba(6, 182, 212, 0.2)';
        ctx.beginPath();
        let first = true;
        for (let lonDeg = 0; lonDeg <= 360; lonDeg += 12) {
          const pt = projectRad(latRad, (lonDeg * Math.PI) / 180);
          if (pt.pz > -0.05) {
            if (first) {
              ctx.moveTo(pt.px, pt.py);
              first = false;
            } else {
              ctx.lineTo(pt.px, pt.py);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      // Longitude meridians
      for (let lonDeg = 0; lonDeg < 360; lonDeg += 45) {
        const lonRad = (lonDeg * Math.PI) / 180;
        ctx.strokeStyle = lonDeg === 0 ? 'rgba(6, 182, 212, 0.6)' : 'rgba(6, 182, 212, 0.2)';
        ctx.beginPath();
        let first = true;
        for (let latDeg = -90; latDeg <= 90; latDeg += 12) {
          const pt = projectRad((latDeg * Math.PI) / 180, lonRad);
          if (pt.pz > -0.05) {
            if (first) {
              ctx.moveTo(pt.px, pt.py);
              first = false;
            } else {
              ctx.lineTo(pt.px, pt.py);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      // 4. Render Neon Holographic Continents & Islands
      PROCESSED_CONTINENTS.forEach((continent) => {
        const projected = continent.radCoords.map(([latRad, lonRad]) => projectRad(latRad, lonRad));
        const visibleCount = projected.filter((p) => p.pz > 0).length;

        if (visibleCount > 1) {
          ctx.beginPath();
          let started = false;
          projected.forEach((pt) => {
            if (pt.pz > -0.1) {
              if (!started) {
                ctx.moveTo(pt.px, pt.py);
                started = true;
              } else {
                ctx.lineTo(pt.px, pt.py);
              }
            }
          });
          ctx.closePath();

          // Neon Land Fill
          ctx.fillStyle = continent.fill;
          ctx.fill();

          // Vibrant Neon Coastline Border
          ctx.strokeStyle = continent.color;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Neon Node Dots at Vertices
          projected.forEach((pt) => {
            if (pt.pz > 0.1) {
              ctx.fillStyle = continent.color;
              ctx.beginPath();
              ctx.arc(pt.px, pt.py, 1.8 * pt.pz, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        }
      });

      // 5. Neon Limb Horizon Edge Ring
      const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius);
      rimGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      rimGrad.addColorStop(0.85, 'rgba(6, 182, 212, 0.2)');
      rimGrad.addColorStop(1, 'rgba(217, 70, 239, 0.7)');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 6. Capital Flag Pins with Neon Pulsing Beacons
      CAPITAL_PINS.forEach((pin) => {
        const pt = projectRad(pin.latRad, pin.lonRad);
        if (pt.pz > 0.08) {
          const pulse = (Math.sin(now * 3 + pin.latRad) + 1) / 2;
          const rSize = 3 + pulse * 4;

          // Pulsing Beacon
          ctx.strokeStyle = pin.color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, rSize * 2, 0, Math.PI * 2);
          ctx.stroke();

          // Pin Core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = pin.color;
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Floating Badge Tag
          if (!isCompact) {
            const tagX = pt.px + 8;
            const tagY = pt.py - 6;

            ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
            ctx.strokeStyle = pin.color;
            ctx.lineWidth = 1;

            const text = `${pin.code} • ${pin.name}`;
            ctx.font = 'bold 9px monospace';
            const textWidth = ctx.measureText(text).width;

            ctx.beginPath();
            ctx.roundRect(tagX - 4, tagY - 10, textWidth + 8, 14, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.fillText(text, tagX, tagY);
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isAutoSpinning, spinSpeed, isCompact]);

  // Pointer Handlers for 360 Drag
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    velYRef.current = dx * 0.004;
    velXRef.current = dy * 0.004;

    rotYRef.current += dx * 0.007;
    rotXRef.current += dy * 0.007;
    rotXRef.current = Math.max(-1.1, Math.min(1.1, rotXRef.current));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  return (
    <div
      className={`relative rounded-3xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-2xl p-4 flex flex-col items-center justify-between shadow-2xl overflow-hidden group ${
        isFullscreen ? 'fixed inset-4 z-50 bg-slate-950/98 border-cyan-500/50' : className
      }`}
    >
      {/* Background neon glow flares */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-fuchsia-500/15 blur-3xl rounded-full pointer-events-none" />

      {/* Header Bar */}
      <div className="w-full flex items-center justify-between z-10 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Globe className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono flex items-center gap-1.5">
              <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
                3D NEON HOLOGLOBE
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </h3>
            <p className="text-[10px] text-slate-400">Cyber Grid Mesh • Touch & Drag to Rotate</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Turbo Speed Toggle */}
          <button
            onClick={() => setSpinSpeed((s) => (s === 'normal' ? 'fast' : 'normal'))}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-all ${
              spinSpeed === 'fast'
                ? 'bg-amber-950 border-amber-500/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-cyan-300'
            }`}
            title="Toggle Spin Speed"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{spinSpeed === 'fast' ? 'Turbo' : '1x'}</span>
          </button>

          {/* Auto-spin toggle */}
          <button
            onClick={() => setIsAutoSpinning((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              isAutoSpinning
                ? 'bg-cyan-950 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
            title={isAutoSpinning ? 'Pause Auto-Spin' : 'Start Auto-Spin'}
          >
            {isAutoSpinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen view */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white transition-all"
            title="Fullscreen Globe"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Interactive 3D Canvas */}
      <div className="relative w-full flex-1 flex items-center justify-center min-h-[230px] cursor-grab active:cursor-grabbing touch-none select-none">
        <canvas
          ref={canvasRef}
          width={isFullscreen ? 560 : 340}
          height={isFullscreen ? 560 : 270}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full max-w-[360px] h-auto object-contain transition-transform active:scale-105 drop-shadow-[0_0_25px_rgba(6,182,212,0.35)]"
        />

        {/* Drag Hint overlay pill */}
        <div className="absolute bottom-1 bg-slate-950/85 border border-cyan-500/30 px-3.5 py-1 rounded-full text-[10px] font-mono text-cyan-300/90 backdrop-blur-md pointer-events-none flex items-center gap-1.5 shadow-lg shadow-cyan-500/10">
          <RotateCw className="w-3 h-3 animate-spin text-cyan-400" />
          <span>DRAG OR SWIPE TO ROTATE GLOBE</span>
        </div>
      </div>
    </div>
  );
};
