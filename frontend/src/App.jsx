import React, { useEffect, useState } from "react";
import axios from "axios";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const API_BASE = "https://sensors-n1ny.onrender.com/api"; // FastAPI backend

function App() {
  const [serverOnline, setServerOnline] = useState(false);
  const [sensors, setSensors] = useState([]);

  // Check backend health
  const fetchHealth = async () => {
    try {
      const res = await axios.get(`${API_BASE}/health`);
      setServerOnline(res.data.status === "online");
    } catch {
      setServerOnline(false);
    }
  };

  // Get latest sensor data
  const fetchLatest = async () => {
    try {
      const res = await axios.get(`${API_BASE}/latest`);
      const sorted = res.data.sort((a, b) => a.room.localeCompare(b.room));
      setSensors(sorted);
    } catch (err) {
      console.log("Error fetching latest data:", err);
      setSensors([]);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchLatest();

    const interval = setInterval(() => {
      fetchHealth();
      fetchLatest();
    }, 120000); // refresh every 2 min

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Room Sensor Dashboard</h1>
        <p>
          Server:{" "}
          <span
            className={serverOnline ? "text-green-600" : "text-red-600 font-bold"}
          >
            {serverOnline ? "Online" : "Offline"}
          </span>
        </p>
      </header>

      {!serverOnline && (
        <p className="text-red-500 mb-4">
          Cannot fetch sensor data. Check your backend server.
        </p>
      )}

      {sensors.length === 0 && serverOnline && (
        <p className="text-gray-600">No sensor data received yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
        {sensors.map((sensor) => (
          <div key={sensor.device_id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">{sensor.room}</h2>
              <span className="text-xs text-gray-500">
                {sensor.timestamp
                  ? new Date(sensor.timestamp).toLocaleString()
                  : ""}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <CircularProgressbar
                  value={sensor.temperature}
                  maxValue={50}
                  text={`${sensor.temperature}°C`}
                  styles={buildStyles({ pathColor: "#f87171", textColor: "#f87171" })}
                />
                <span className="mt-2 text-sm">Temp</span>
              </div>

              <div className="flex flex-col items-center">
                <CircularProgressbar
                  value={sensor.humidity}
                  maxValue={100}
                  text={`${sensor.humidity}%`}
                  styles={buildStyles({ pathColor: "#3b82f6", textColor: "#3b82f6" })}
                />
                <span className="mt-2 text-sm">Humidity</span>
              </div>

              <div className="flex flex-col items-center">
                <CircularProgressbar
                  value={sensor.pressure}
                  maxValue={1100}
                  text={`${sensor.pressure} hPa`}
                  styles={buildStyles({ pathColor: "#34d399", textColor: "#34d399" })}
                />
                <span className="mt-2 text-sm">Pressure</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
