import { useEffect, useState } from "react";

export default function App() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLatest = async () => {
    try {
      const res = await fetch("/api/latest");
      const data = await res.json();
      setDevices(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchLatest(); // initial load
    const interval = setInterval(fetchLatest, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading environment vitals...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Environment Vitals
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {devices.map((device) => (
          <DeviceCard key={device.device_id} {...device} />
        ))}
      </div>
    </div>
  );
}

/* ================== DEVICE CARD ================== */

function DeviceCard({
  device_id,
  room,
  temperature,
  humidity,
  pressure,
  timestamp,
  online
}) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-5 flex flex-col justify-between border border-gray-700">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{room}</h2>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${
            online
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {online ? "ONLINE" : "OFFLINE"}
        </span>
      </div>

      {/* Device ID */}
      <p className="text-xs text-gray-400 mb-3">
        Device ID: <span className="font-mono">{device_id}</span>
      </p>

      {/* Sensor Values */}
      <div className="space-y-2 text-sm">
        <p>
          🌡 Temperature:{" "}
          <span className="font-semibold">{temperature.toFixed(1)} °C</span>
        </p>
        <p>
          💧 Humidity:{" "}
          <span className="font-semibold">{humidity.toFixed(0)} %</span>
        </p>
        <p>
          🌬 Pressure:{" "}
          <span className="font-semibold">{pressure.toFixed(0)} hPa</span>
        </p>
      </div>

      {/* Timestamp */}
      <p className="text-xs text-gray-400 mt-4 font-bold">
        Last seen:{" "}
        {new Date(timestamp + "Z").toLocaleString("en-GB", {
          timeZone: "Africa/Lagos",
          hour12: false
        })}
      </p>
    </div>
  );
}
