import { useEffect, useState } from "react";

export default function App() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [online, setOnline] = useState(true);

  async function loadData() {
    try {
      const res = await fetch("/api/latest");
      if (!res.ok) throw new Error("Backend error");
      const json = await res.json();
      setData(json);
      setOnline(true);
    } catch {
      setOnline(false);
      setError("Cannot fetch sensor data");
    }
  }

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 5000);
    return () => clearInterval(id);
  }, []);

  const rooms = {};
  data.forEach(d => {
    const room = d.room || "Unknown";
    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(d);
  });

  return (
    <div style={styles.page}>
      <h1>Room Sensor Dashboard</h1>

      <p>
        Server:{" "}
        <strong style={{ color: online ? "green" : "red" }}>
          {online ? "Online" : "Offline"}
        </strong>
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {Object.keys(rooms).length === 0 && (
        <p>No sensor data received yet.</p>
      )}

      {Object.entries(rooms).map(([room, sensors]) => (
        <div key={room} style={styles.room}>
          <h2>{room}</h2>

          {sensors.map(sensor => (
            <div key={sensor.device_id} style={styles.card}>
              <strong>Device:</strong> {sensor.device_id}<br />
              🌡 Temperature: {sensor.temperature} °C<br />
              💧 Humidity: {sensor.humidity} %<br />
              🧭 Pressure: {sensor.pressure} hPa<br />
              <small>
                Last updated:{" "}
                {sensor.last_updated
                  ? new Date(sensor.last_updated).toLocaleString()
                  : "—"}
              </small>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    background: "#f5f5f5",
    minHeight: "100vh"
  },
  room: {
    marginBottom: "30px"
  },
  card: {
    background: "white",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  }
};
