import { useEffect, useState } from "react";

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;

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
      <h1 className="text-3xl font-bold text-center mb-4">
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
              className={`rounded-xl border-2 shadow-md flex flex-col
                ${offline ? "bg-gray-200 border-red-500" : "bg-white border-green-500"}
              `}
            >
              {/* HEADER */}
              <div className="h-12 px-4 flex items-center justify-between">
                <div className="font-bold text-sm truncate">
                  {d.room}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full
                      ${offline ? "bg-red-600" : "bg-green-600"}
                    `}
                  />
                  <span
                    className={`text-xs font-bold
                      ${offline ? "text-red-700" : "text-green-700"}
                    `}
                  >
                    {offline ? "OFFLINE" : "ONLINE"}
                  </span>
                </div>
              </div>

              {/* METRICS */}
              <div className="flex-1 px-6 py-4 flex flex-col justify-center gap-4">
                <Metric
                  label="Temperature"
                  value={`${d.temperature.toFixed(1)} °C`}
                  color="text-red-600"
                />
                <Metric
                  label="Humidity"
                  value={`${d.humidity.toFixed(1)} %`}
                  color="text-blue-600"
                />
                <Metric
                  label="Pressure"
                  value={`${d.pressure.toFixed(1)} hPa`}
                  color="text-emerald-600"
                />
              </div>

              {/* FOOTER */}
              <div className="h-12 text-center text-xs font-bold flex flex-col justify-center border-t">
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

/* ---------- Metric Row ---------- */
function Metric({ label, value, color }) {
  return (
    <div className="flex items-baseline justify-between">
      <div className="text-sm font-medium text-gray-600">
        {label}
      </div>
      <div className={`text-xl font-bold ${color}`}>
        {value}
      </div>
    </div>
  );
}
