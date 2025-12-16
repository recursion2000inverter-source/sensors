import { useEffect, useState } from "react";
import axios from "axios";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const API_BASE = "http://192.168.0.193:8000";

export default function App() {
  const [sensors, setSensors] = useState([]);
  const [status, setStatus] = useState("offline");

  const loadData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/latest`);
      setSensors(res.data);
      setStatus("online");
    } catch {
      setStatus("offline");
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold">Room Sensor Dashboard</h1>
        <p className={`text-sm ${status === "online" ? "text-green-600" : "text-red-600"}`}>
          Server: {status}
        </p>
      </header>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {sensors.map((s) => (
          <div key={s.device_id} className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-xl font-semibold text-center mb-4">{s.room}</h2>

            <div className="flex justify-between">
              <Dial value={s.temperature} max={50} label="°C" color="#ef4444" />
              <Dial value={s.humidity} max={100} label="%" color="#3b82f6" />
              <Dial value={s.pressure} min={900} max={1100} label="hPa" color="#10b981" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dial({ value, min = 0, max, label, color }) {
  return (
    <div className="w-24">
      <CircularProgressbar
        value={value}
        minValue={min}
        maxValue={max}
        text={`${value.toFixed(1)}${label}`}
        styles={buildStyles({
          pathColor: color,
          textColor: "#111827",
          trailColor: "#e5e7eb",
          textSize: "14px",
        })}
      />
    </div>
  );
}
