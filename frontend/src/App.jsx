import React, { useState, useEffect } from "react";

export default function App() {
  const [devices, setDevices] = useState([]);

  const fetchLatestData = async () => {
    try {
      const res = await fetch("/api/latest");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.error("Error fetching latest data:", err);
    }
  };

  useEffect(() => {
    fetchLatestData(); // initial fetch
    const interval = setInterval(fetchLatestData, 2 * 60 * 1000); // every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Environment Vitals</h1>
      {devices.length === 0 && (
        <p className="text-center text-gray-500">No sensor data available.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {devices.map((device) => (
          <div
            key={device.device_id}
            className="bg-white rounded-lg shadow p-4 flex flex-col justify-between h-full"
          >
            <div className="mb-2">
              <h2 className="text-xl font-semibold">{device.room}</h2>
              <p className="text-gray-500 text-sm font-bold">
                Last seen: {formatTimestamp(device.timestamp)}
              </p>
            </div>
            <div className="space-y-1">
              <p>
                <span className="font-bold">Temperature:</span>{" "}
                {device.temperature.toFixed(2)} °C
              </p>
              <p>
                <span className="font-bold">Humidity:</span>{" "}
                {device.humidity.toFixed(2)} %
              </p>
              <p>
                <span className="font-bold">Pressure:</span>{" "}
                {device.pressure.toFixed(2)} hPa
              </p>
            </div>
            <div className="mt-4 flex items-center">
              <span
                className={`w-3 h-3 rounded-full mr-2 ${
                  device.online ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
              <span className="text-sm font-medium">
                {device.online ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
