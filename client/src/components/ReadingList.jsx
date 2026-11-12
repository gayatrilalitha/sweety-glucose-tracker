
import React, { useEffect, useState } from "react";
import api from "../services/api";

function ReadingList({ refresh }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const limit = 5;

  const [editForm, setEditForm] = useState({
    reading_date: "",
    time_slot: "Morning",
    value: "",
  });

  const fetchReadings = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/readings?page=${page}&limit=${limit}`
      );

      setReadings(response.data.readings || []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.totalPages || 0);
    } catch (error) {
      console.error("Error fetching readings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [refresh, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reading?")) {
      return;
    }

    try {
      await api.delete(`/readings/${id}`);

      // Move back if the current page becomes empty
      if (readings.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchReadings();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete reading");
    }
  };

  const handleEdit = (reading) => {
    setEditingId(reading.id);

    setEditForm({
      reading_date: String(reading.reading_date).slice(0, 10),
      time_slot: reading.time_slot,
      value: reading.value,
    });
  };

  const handleUpdate = async (id) => {
    try {
      await api.put(`/readings/${id}`, {
        ...editForm,
        value: Number(editForm.value),
      });

      setEditingId(null);
      fetchReadings();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to update reading");
    }
  };

  if (loading) return <p>Loading readings...</p>;

  return (
    <div className="reading-list">
      <div className="reading-list-header">
        <div>
          <h2>Your Glucose Readings</h2>
          <p>Track and manage your daily glucose levels.</p>
        </div>

        <span className="reading-count">
          {total} Total Readings
        </span>
      </div>

      {readings.length === 0 ? (
        <p>No readings available. Add your first reading!</p>
      ) : (
        <>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Value (mg/dL)</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {readings.map((reading) => (
                  <tr key={reading.id}>
                    {editingId === reading.id ? (
                      <>
                        <td>
                          <input
                            type="date"
                            value={editForm.reading_date}
                            max={new Date().toLocaleDateString("en-CA")}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                reading_date: e.target.value,
                              })
                            }
                          />
                        </td>

                        <td>
                          <select
                            value={editForm.time_slot}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                time_slot: e.target.value,
                              })
                            }
                          >
                            <option>Morning</option>
                            <option>After breakfast</option>
                            <option>After lunch</option>
                            <option>After dinner</option>
                          </select>
                        </td>

                        <td>
                          <input
                            type="number"
                            min="40"
                            max="600"
                            step="1"
                            value={editForm.value}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                value: e.target.value,
                              })
                            }
                          />
                        </td>

                        <td>
                          <button onClick={() => handleUpdate(reading.id)}>
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          {String(reading.reading_date).slice(0, 10)}
                        </td>
                        <td>{reading.time_slot}</td>
                        <td>{reading.value}</td>
                        <td>
                          <button onClick={() => handleEdit(reading)}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(reading.id)}>
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span>
              Showing {(page - 1) * limit + 1}–
              {Math.min(page * limit, total)} of {total}
            </span>

            <div className="pagination-buttons">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={page === pageNumber ? "active" : ""}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ReadingList;
