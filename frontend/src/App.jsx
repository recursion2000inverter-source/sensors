import { useEffect, useState } from "react";

const POLL_INTERVAL = 120000; // 2 minutes
const OFFLINE_THRESHOLD = 3 * 60 * 1000; // 5 minutes

export default function App() {
  const [devices, setDevices] = useState([]);

  const fetchLatest = async () => {
    try {
      const res = await fetch("/api/latest");
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const isOnline = (timestamp) => {
    return Date.now() - new Date(timestamp).getTime() <= OFFLINE_THRESHOLD;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Sensor Monitoring Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {devices.map((d) => {
          const online = isOnline(d.timestamp);

          return (
            <div
              key={d.device_id}
              className="bg-white rounded-xl shadow-md p-5 border"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {d.room}
                </h2>
                <span
                  className={`flex items-center gap-2 text-sm font-medium ${
                    online ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      online ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {online ? "Online" : "Offline"}
                </span>
              </div>

              {/* Body */}
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Device ID:</span>{" "}
                  {d.device_id}
                </p>

                <p>
                  <span className="font-medium">Temperature:</span>{" "}
                  {d.temperature.toFixed(2)} °C
                </p>

                <p>
                  <span className="font-medium">Humidity:</span>{" "}
                  {d.humidity.toFixed(2)} %
                </p>

                <p>
                  <span className="font-medium">Pressure:</span>{" "}
                  {d.pressure.toFixed(2)} hPa
                </p>
              </div>

              {/* Footer */}
              <div className="mt-4 text-xs text-gray-500">
                Last seen:{" "}
                {new Date(d.timestamp).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
