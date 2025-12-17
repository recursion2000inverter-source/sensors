import React, { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import dayjs from "dayjs";

export default function App() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch latest sensor data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/latest");
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        const json = await res.json();
        setData(json);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Cannot fetch sensor data. Check your backend server.");
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center mt-20 text-xl">Loading...</div>;
  if (error) return <div className="text-center mt-20 text-red-600">{error}</div>;

  // Generate dial cards for each room
  const rooms = Object.keys(data);

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Room Sensor Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {rooms.map((room) => {
          const roomData = data[room];
          return (
            <div key={room} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4">{room}</h2>
              <div className="w-32 h-32 mb-4">
                <CircularProgressbar
                  value={roomData.temperature}
                  maxValue={50}
                  text={`${roomData.temperature}°C`}
                  styles={buildStyles({
                    textColor: "#e53e3e",
                    pathColor: "#f56565",
                    trailColor: "#fbd5d5",
                  })}
                />
              </div>
              <div className="w-32 h-32 mb-4">
                <CircularProgressbar
                  value={roomData.humidity}
                  maxValue={100}
                  text={`${roomData.humidity}%`}
                  styles={buildStyles({
                    textColor: "#3182ce",
                    pathColor: "#63b3ed",
                    trailColor: "#bee3f8",
                  })}
                />
              </div>
              <div className="w-32 h-32 mb-4">
                <CircularProgressbar
                  value={roomData.pressure}
                  maxValue={1100}
                  text={`${roomData.pressure} hPa`}
                  styles={buildStyles({
                    textColor: "#38a169",
                    pathColor: "#68d391",
                    trailColor: "#c6f6d5",
                  })}
                />
              </div>
              <div className="text-gray-600 mt-2">
                Last updated: {dayjs(roomData.timestamp).format("YYYY-MM-DD HH:mm:ss")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
