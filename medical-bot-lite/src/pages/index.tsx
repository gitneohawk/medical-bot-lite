import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");

  const handleSend = async () => {
    const res = await fetch(
      "https://<あなたの Functions の URL>/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history: [] }),
      }
    );
    const data = await res.json();
    setReply(data.reply);
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Medical Bot</h1>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSend}>送信</button>
      <div style={{ marginTop: "1rem" }}>{reply}</div>
    </main>
  );
}