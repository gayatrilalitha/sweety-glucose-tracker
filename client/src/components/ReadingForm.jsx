
import React, { useState } from "react";
import api from "../services/api";

const getLocalDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function ReadingForm({ onReadingAdded }) {
  const [form, setForm] = useState({
    reading_date: getLocalDate(),
    time_slot: "Morning",
    value: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.post("/readings", {
        ...form,
        value: Number(form.value),
      });

      setMessage("Reading added successfully!");
      setForm({
        reading_date: new Date().toISOString().split("T")[0],
        time_slot: "Morning",
        value: "",
      });

      onReadingAdded();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to add reading"
      );
    }
  };

  return (
    <div className="reading-form">
      <h2>Add Glucose Reading</h2>

      <form onSubmit={handleSubmit}>
        <label>Date</label>
        <input
          type="date"
          name="reading_date"
          value={form.reading_date}
          max={new Date().toISOString().split("T")[0]}
          onChange={handleChange}
          required
        />

        <label>Time Slot</label>
        <select
          name="time_slot"
          value={form.time_slot}
          onChange={handleChange}
        >
          <option>Morning</option>
          <option>After breakfast</option>
          <option>After lunch</option>
          <option>After dinner</option>
        </select>

        <label>Glucose Value (mg/dL)</label>
        <input
          type="number"
          name="value"
          min="40"
          max="600"
          step="1"
          value={form.value}
          onChange={handleChange}
          placeholder="Enter glucose value"
          required
        />

        <button type="submit">Save Reading</button>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default ReadingForm;
