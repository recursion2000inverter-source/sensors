import { useState, useEffect } from "react";
import axios from "axios";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import 'react-circular-progressbar/dist/styles.css';

const API_BASE = "/api"; // Relative path to FastAPI backend

function App() {
  const [devices, setDevices] = useState([]);
  const [serverOnline, setServerOnline] = useState(false);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/latest`);
      if (res.status === 200) {
        setDevices(res.data.sort((a, b) => a.room.localeCompare(b.room)));
        setServerOnline(true);
      }
    } catch (error) {
      console.error("Cannot fetch sensor data", error);
      setServerOnline(false);
      setDevices([]);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000); // refresh every 2 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4">Room Sensor Dashboard</h1>
      <p className="mb-4">
        Server: <span className={serverOnline ? "text-green-600" : "text-red-600"}>
          {serverOnline ? "Online" : "Offline"}
        </span>
      </p>

      {devices.length === 0 && (
        <p>No sensor data received yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((d) => (
          <div key={d.device_id} className="bg-white shadow rounded p-4">
            <h2 className="text-xl font-semibold mb-2">{d.room}</h2>
            <div className="flex justify-around items-center">
              <div className="w-24 h-24">
                <CircularProgressbar
                  value={d.temperature}
                  maxValue={50}
                  text={`${d.temperature}°C`}
                  styles={buildStyles({ pathColor: "#f87171", textColor: "#111" })}
                />
              </div>
              <div className="w-24 h-24">
                <CircularProgressbar
                  value={d.humidity}
                  maxValue={100}
                  text={`${d.humidity}%`}
                  styles={buildStyles({ pathColor: "#3b82f6", textColor: "#111" })}
                />
              </div>
              <div className="w-24 h-24">
                <CircularProgressbar
                  value={d.pressure}
                  maxValue={1200} // approximate hPa range
                  text={`${d.pressure} hPa`}
                  styles={buildStyles({ pathColor: "#10b981", textColor: "#111" })}
                />
              </div>
            </div>
            <p className="mt-2 text-gray-500 text-sm">
              Last updated: {new Date(d.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
