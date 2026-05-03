



import { useState, useEffect } from "react";
import "./RealTimeClock.css";

/* ─── Design tokens ────────────────────────────────────── */
const THEME = {
  hourHand:      "#222222",
  minuteHand:    "#222222",
  secondHand:    "#e84545",
  counterweight: "#c03030",
  tick:          "#bbbbbb",
  tickMain:      "#444444",
  number:        "#555555",
  glow:          "#e84545",
};

/* ─── SVG constants ────────────────────────────────────── */
const SIZE = 52;
const R    = 23;
const CX   = SIZE / 2;
const CY   = SIZE / 2;

/* Burchak bo'yicha koordinata hisoblash */
function polar(angleDeg, r, cx = CX, cy = CY) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/* ─── Tick marks ───────────────────────────────────────── */
function Ticks() {
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const isMain = i % 5 === 0;
    const inner  = isMain ? R * 0.80 : R * 0.90;
    const outer  = R * 0.98;
    const p1 = polar(i * 6, inner);
    const p2 = polar(i * 6, outer);
    ticks.push(
      <line
        key={i}
        x1={p1.x} y1={p1.y}
        x2={p2.x} y2={p2.y}
        stroke={isMain ? THEME.tickMain : THEME.tick}
        strokeWidth={isMain ? 1.2 : 0.5}
        strokeLinecap="round"
      />
    );
  }
  return <g>{ticks}</g>;
}

/* ─── Soat/daqiqa qo'li ────────────────────────────────── */
function Hand({ angleDeg, length, width, color, hasShoulder }) {
  const tip    = polar(angleDeg, length);
  const base   = polar(angleDeg + 180, hasShoulder ? 5 : 3);
  const w2     = width / 2;
  const left1  = polar(angleDeg + 90, w2, CX, CY);
  const right1 = polar(angleDeg - 90, w2, CX, CY);
  const left2  = polar(angleDeg + 90, w2 * 0.3, base.x, base.y);
  const right2 = polar(angleDeg - 90, w2 * 0.3, base.x, base.y);
  const tipL   = polar(angleDeg + 90, w2 * 0.1, tip.x, tip.y);
  const tipR   = polar(angleDeg - 90, w2 * 0.1, tip.x, tip.y);

  const d = [
    `M ${left2.x} ${left2.y}`,
    `L ${left1.x} ${left1.y}`,
    `L ${tipL.x}  ${tipL.y}`,
    `L ${tip.x}   ${tip.y}`,
    `L ${tipR.x}  ${tipR.y}`,
    `L ${right1.x} ${right1.y}`,
    `L ${right2.x} ${right2.y}`,
    `L ${base.x}   ${base.y}`,
    "Z",
  ].join(" ");

  return (
    <path d={d} fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth="0.3" />
  );
}

/* ─── Soniya qo'li ─────────────────────────────────────── */
function SecondHand({ angleDeg }) {
  const tip    = polar(angleDeg, R * 0.88);
  const weight = polar(angleDeg + 180, 6);
  return (
    <g>
      <line
        x1={CX} y1={CY}
        x2={tip.x} y2={tip.y}
        stroke={THEME.secondHand}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <line
        x1={CX} y1={CY}
        x2={weight.x} y2={weight.y}
        stroke={THEME.counterweight}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}

/* ─── Asosiy komponent ─────────────────────────────────── */
export default function RealTimeClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = time.getHours() % 12;
  const m = time.getMinutes();
  const s = time.getSeconds();

  const hourDeg   = h * 30 + m * 0.5 + s * (0.5 / 60);
  const minuteDeg = m * 6  + s * 0.1;
  const secondDeg = s * 6;

  const timeStr = time.toLocaleTimeString("uz-UZ", { hour12: false });

  return (
    <span
      className="rtc-clock"
      title={timeStr}
      aria-label={`Soat: ${timeStr}`}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="rtc-svg"
      >
        <defs>
          {/* Oq soat yuzi gradienti */}
          <radialGradient id="faceGrad" cx="38%" cy="32%" r="70%">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ececec" />
          </radialGradient>

          {/* Shisha aksikamali */}
          <radialGradient id="crystal" cx="28%" cy="22%" r="55%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Chekkalarning ichki soyasi */}
          <radialGradient id="innerShadow" cx="50%" cy="50%" r="50%">
            <stop offset="78%"  stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </radialGradient>
        </defs>

        {/* Soat yuzi */}
        <circle cx={CX} cy={CY} r={R} fill="url(#faceGrad)" />

        {/* Rim (chegara) */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="#cccccc"
          strokeWidth="1.2"
        />

        {/* Chiziqlar */}
        <Ticks />

        {/* Soat qo'li */}
        <Hand
          angleDeg={hourDeg}
          length={R * 0.55}
          width={2.4}
          color={THEME.hourHand}
          hasShoulder
        />

        {/* Daqiqa qo'li */}
        <Hand
          angleDeg={minuteDeg}
          length={R * 0.82}
          width={1.6}
          color={THEME.minuteHand}
          hasShoulder={false}
        />

        {/* Soniya qo'li */}
        <SecondHand angleDeg={secondDeg} />

        {/* Ichki soya */}
        <circle cx={CX} cy={CY} r={R} fill="url(#innerShadow)" />

        {/* Shisha aksikamali */}
        <circle cx={CX} cy={CY} r={R} fill="url(#crystal)" />

        {/* Markaz tugmasi */}
        <circle cx={CX} cy={CY} r={1.6} fill="#444" />
        <circle cx={CX} cy={CY} r={0.9} fill={THEME.secondHand} />
      </svg>
    </span>
  );
}