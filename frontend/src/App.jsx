import { useEffect, useState } from "react";
import { checkServerHealth, fetchLatestData } from "./services/api";

export default function App() {
  const [serverOnline, setServerOnline] = useState(false);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------
  // Server health check
  // ----------------------------------------
  const checkServer = async () => {
    try {
      await checkServerHealth();
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    }
  };

  // ----------------------------------------
  // Fetch latest sensor data
  // ----------------------------------------
  const loadSensors = async () => {
    try {
      const res = await fetchLatestData();
      setSensors(res.data || []);
    } catch {
      setSensors([]);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // Auto refresh every 2 minutes
  // ----------------------------------------
  useEffect(() => {
    checkServer();
    loadSensors();

    const interval = setInterval(() => {
      checkServer();
      loadSensors();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  // ----------------------------------------
  // UI
  // ----------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Room Sensor Dashboard
          </h1>

          <span
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              serverOnline
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            Server: {serverOnline ? "Online" : "Offline"}
          </span>
        </header>

        {loading && (
          <p className="text-gray-500">Loading sensor data…</p>
        )}

        {!loading && sensors.length === 0 && (
          <p className="text-gray-500">
            No sensor data received yet.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensors.map((sensor) => (
            <div
              key={sensor.device_id}
              className="bg-white rounded-xl shadow p-5"
            >
              <h2 className="text-lg font-semibold mb-2">
                {sensor.room}
              </h2>

              <p className="text-sm text-gray-500 mb-4">
                Device ID: {sensor.device_id}
              </p>

              <div className="space-y-2">
                <div>🌡 Temperature: <strong>{sensor.temperature} °C</strong></div>
                <div>💧 Humidity: <strong>{sensor.humidity} %</strong></div>
                <div>⏱ Pressure: <strong>{sensor.pressure} hPa</strong></div>
              </div>

              <p className="mt-4 text-xs text-gray-400">
                Updated: {new Date(sensor.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
