import { useEffect, useState } from "react";

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;

/* ---------- Compact Dial ---------- */
function Dial({ value, min, max, label, unit, color, disabled }) {
  const radius = 36;
  const stroke = 6;
  const size = 96;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, min), max);
  const offset =
    circumference -
    ((clamped - min) / (max - min)) * circumference;

  return (
    <div className="flex flex-col items-center w-1/3">
      <svg width={size} height={size}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={disabled ? "#9ca3af" : color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        <text
          x="50%"
          y="50%"
          dy="0.35em"
          textAnchor="middle"
          className="text-sm font-bold fill-gray-800"
        >
          {value.toFixed(1)}
        </text>
      </svg>
      <div className="text-[11px] font-semibold leading-tight text-center">
        {label} ({unit})
      </div>
    </div>
  );
}

/* ---------- App ---------- */
export default function App() {
  const [devices, setDevices] = useState({});

  useEffect(() => {
    fetch("/api/latest")
      .then((r) => r.json())
      .then((data) => {
        const map = {};
        data.forEach((d) => (map[d.device_id] = d));
        setDevices(map);
      });
  }, []);

  useEffect(() => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws`);

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "initial") {
        const map = {};
        msg.data.forEach((d) => (map[d.device_id] = d));
        setDevices(map);
      } else {
        setDevices((p) => ({ ...p, [msg.device_id]: msg }));
      }
    };

    return () => ws.close();
  }, []);

  const list = Object.values(devices);

  const isOffline = (ts) =>
    Date.now() - new Date(ts).getTime() > OFFLINE_THRESHOLD_MS;

  return (
    <div className="h-screen bg-gray-100 p-4 flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-3">
        Environment Vitals
      </h1>

      <div
        className="grid gap-4 flex-1"
        style={{
          gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))`,
        }}
      >
        {list.map((d) => {
          const offline = isOffline(d.timestamp);
          const dt = new Date(d.timestamp);

          return (
            <div
              key={d.device_id}
              className={`rounded-xl border-2 shadow flex flex-col
                ${offline ? "bg-gray-200 border-red-500" : "bg-white border-green-500"}
              `}
            >
              {/* HEADER — FIXED HEIGHT */}
              <div className="h-12 px-3 flex items-center justify-between">
                <div className="font-bold text-sm truncate">
                  {d.room}
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded
                    ${offline ? "bg-red-600" : "bg-green-600"} text-white
                  `}
                >
                  {offline ? "OFFLINE" : "ONLINE"}
                </span>
              </div>

              {/* DIALS — FLEX, GUARANTEED FIT */}
              <div className="flex-1 flex items-center justify-center px-2">
                <div className="flex w-full justify-between">
                  <Dial
                    value={d.temperature}
                    min={0}
                    max={50}
                    label="Temp"
                    unit="°C"
                    color="#ef4444"
                    disabled={offline}
                  />
                  <Dial
                    value={d.humidity}
                    min={0}
                    max={100}
                    label="Humidity"
                    unit="%"
                    color="#3b82f6"
                    disabled={offline}
                  />
                  <Dial
                    value={d.pressure}
                    min={900}
                    max={1100}
                    label="Pressure"
                    unit="hPa"
                    color="#10b981"
                    disabled={offline}
                  />
                </div>
              </div>

              {/* FOOTER — FIXED HEIGHT */}
              <div className="h-11 text-center text-xs font-bold flex flex-col justify-center">
                <div>{dt.toLocaleDateString()}</div>
                <div>{dt.toLocaleTimeString()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
