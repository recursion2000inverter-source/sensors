import React, { useEffect, useState } from "react";
import dayjs from "dayjs";

// Dial component with full circle
const Dial = ({ label, value, max, color }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const angle = Math.min(value / max, 1);
  const dashLength = circumference * angle;

  return (
    <div className="flex flex-col items-center m-2">
      <svg width="100" height="100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dashLength} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text
          x="50"
          y="55"
          textAnchor="middle"
          fontSize="16"
          fontWeight="bold"
          fill="#111"
        >
          {value}
        </text>
      </svg>
      <div className="text-center mt-1 font-semibold">{label}</div>
    </div>
  );
};

const App = () => {
  const [devices, setDevices] = useState([]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/latest");
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      } else {
        setDevices([]);
      }
    } catch (err) {
      console.error(err);
      setDevices([]);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (devices.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-xl">
        <h1 className="text-3xl font-bold mb-4">Environment Vitals</h1>
        No sensor data available.
      </div>
    );
  }

  return (
    <div className="h-screen p-4 flex flex-col justify-start">
      <h1 className="text-4xl font-bold text-center mb-6">Environment Vitals</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 overflow-auto">
        {devices.map((device) => (
          <div
            key={device.device_id}
            className="bg-white rounded-xl shadow p-4 flex flex-col items-center"
          >
            <div className="font-bold text-lg mb-2">{device.room}</div>
            <div className="flex flex-row">
              <Dial label="Temp (°C)" value={device.temperature} max={50} color="#ef4444" />
              <Dial label="Humidity (%)" value={device.humidity} max={100} color="#3b82f6" />
              <Dial label="Pressure (hPa)" value={device.pressure} max={1100} color="#10b981" />
            </div>
            <div className="mt-2 text-sm text-gray-700 font-bold">
              {dayjs(device.timestamp).format("YYYY-MM-DD HH:mm:ss")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
