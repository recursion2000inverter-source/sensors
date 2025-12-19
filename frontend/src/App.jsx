import { useEffect, useState } from "react";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export default function App() {
  const [devices, setDevices] = useState([]);

  const fetchLatest = async () => {
    try {
      const res = await fetch("/api/latest");
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      console.error("Failed to fetch latest devices", err);
    }
  };

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, 120000); // poll every 2 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Environment Vitals
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {devices.map((device) => (
          <DeviceCard key={device.device_id} device={device} />
        ))}
      </div>
    </div>
  );
}

function DeviceCard({ device }) {
  const lastSeenUTC = new Date(device.timestamp); // backend sends UTC
  const now = new Date();

  // Determine online status based on UTC timestamp
  const online = now.getTime() - lastSeenUTC.getTime() <= ONLINE_THRESHOLD_MS;

  // Display timestamp in local timezone correctly
  const localTime = lastSeenUTC.toLocaleString("en-GB", {
    hour12: false,
    timeZoneName: "short",
  });

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold">{device.room}</h2>
        <span
          className={`text-xs px-2 py-1 rounded-full font-bold ${
            online ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {online ? "ONLINE" : "OFFLINE"}
        </span>
      </div>

      {/* Device ID */}
      <p className="text-xs text-gray-400 mb-2">
        Device ID: <span className="font-mono">{device.device_id}</span>
      </p>

      {/* Sensor data */}
      <div className="text-sm space-y-1">
        <p>🌡 Temp: <b>{device.temperature.toFixed(1)} °C</b></p>
        <p>💧 Humidity: <b>{device.humidity.toFixed(0)} %</b></p>
        <p>🌬 Pressure: <b>{device.pressure.toFixed(0)} hPa</b></p>
      </div>

      {/* Last seen */}
      <p className="text-xs text-gray-400 mt-4 font-bold">
        Last seen: {localTime}
      </p>
    </div>
  );
}
