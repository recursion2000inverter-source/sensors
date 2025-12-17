import { useEffect, useState } from "react";

const API_BASE = "";

export default function App() {
  const [online, setOnline] = useState(false);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Health check
    fetch(`${API_BASE}/health`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => setOnline(true))
      .catch(() => setOnline(false));

    // Latest sensor data
    fetch(`${API_BASE}/api/latest`)
      .then(res => res.json())
      .then(data => setLatest(data.data))
      .catch(() => setError("Cannot fetch sensor data."));
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Room Sensor Dashboard</h1>

      <p>
        Server:{" "}
        <strong style={{ color: online ? "green" : "red" }}>
          {online ? "Online" : "Offline"}
        </strong>
      </p>

      {!online && (
        <p style={{ color: "red" }}>
          Cannot fetch sensor data. Check your backend server.
        </p>
      )}

      {latest && (
        <pre>{JSON.stringify(latest, null, 2)}</pre>
      )}

      {!latest && online && <p>No sensor data received yet.</p>}
    </div>
  );
}
