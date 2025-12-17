import { useEffect, useState } from "react";
import { checkHealth, fetchLatest } from "./api";

export default function App() {
  const [online, setOnline] = useState(false);
  const [sensors, setSensors] = useState([]);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      await checkHealth();
      setOnline(true);

      const res = await fetchLatest();
      setSensors(res.data);
      setError("");
    } catch (err) {
      setOnline(false);
      setError("Cannot fetch sensor data. Check your backend server.");
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  const grouped = sensors.reduce((acc, s) => {
    acc[s.room] = acc[s.room] || [];
    acc[s.room].push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-4">Room Sensor Dashboard</h1>

      <div className="mb-6">
        <span
          className={`px-3 py-1 rounded text-white ${
            online ? "bg-green-600" : "bg-red-600"
          }`}
        >
          Server: {online ? "Online" : "Offline"}
        </span>
      </div>

      {!online && (
        <p className="text-red-600 font-medium">{error}</p>
      )}

      {online && sensors.length === 0 && (
        <p className="text-gray-600">No sensor data received yet.</p>
      )}

      {Object.entries(grouped).map(([room, devices]) => (
        <div key={room} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{room}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((d) => (
              <div
                key={d.device_id}
                className="bg-white rounded shadow p-4"
              >
                <p className="font-semibold">Device ID: {d.device_id}</p>
                <p>Temperature: {d.temperature} °C</p>
                <p>Humidity: {d.humidity} %</p>
                <p>Pressure: {d.pressure} hPa</p>
                <p className="text-sm text-gray-500 mt-2">
                  Last updated:{" "}
                  {new Date(d.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
