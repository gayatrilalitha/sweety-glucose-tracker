
import { useEffect, useState } from "react";
import api from "../services/api";

function ReportCards({ refresh }) {
  const getToday = () => {
    const today = new Date();

    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
  };

  const today = getToday();

  const [date, setDate] = useState(today);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Format YYYY-MM-DD as 15 Oct 2026 without timezone conversion
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-").map(Number);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    return `${day} ${months[month - 1]} ${year}`;
  };

  const getDateRanges = () => {
    const [year, month, day] = date.split("-").map(Number);

    const selected = new Date(year, month - 1, day);
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;

    // Previous month
    const previousMonthDate = new Date(year, month - 2, 1);
    const previousYear = previousMonthDate.getFullYear();
    const previousMonth = previousMonthDate.getMonth() + 1;

    const previousStart =
      `${previousYear}-${String(previousMonth).padStart(2, "0")}-01`;

    const previousEndDate = new Date(year, month - 1, 0);

    const previousEnd =
      `${previousYear}-${String(previousMonth).padStart(2, "0")}-${String(
        previousEndDate.getDate()
      ).padStart(2, "0")}`;

    return {
      daily: formatDate(date),
      monthToDate: `${formatDate(firstDay)} – ${formatDate(date)}`,
      previousMonth: `${formatDate(previousStart)} – ${formatDate(previousEnd)}`,
    };
  };

  const dateRanges = getDateRanges();

  useEffect(() => {
    if (!date) return;

    let cancelled = false;

    const fetchReports = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/reports?date=${encodeURIComponent(date)}`
        );

        if (!cancelled) {
          setReports(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Unable to load reports"
          );
          setReports(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchReports();

    return () => {
      cancelled = true;
    };
  }, [date, refresh]);

  const ReportCard = ({ title, range, report }) => {
    const count = Number(report?.count ?? 0);
    const hasReadings = count > 0;

    return (
      <div className="report-card">
        <h3>{title}</h3>

        <p className="report-date-range">{range}</p>

        {hasReadings ? (
          <>
            <p>Maximum: {report.max} mg/dL</p>
            <p>Minimum: {report.min} mg/dL</p>
            <p>Average: {report.average} mg/dL</p>
            <p>Total Readings: {count}</p>
          </>
        ) : (
          <div className="report-empty">
            <p>No readings available for this period.</p>
            <span>Total Readings: 0</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="reports-section">
      <h2>Glucose Reports</h2>

      <div className="report-date-selector">
        <label htmlFor="report-date">Select Report Date:</label>

        <input
          id="report-date"
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading && <p>Loading reports...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && reports && (
        <>
          <div className="report-grid">
            <ReportCard
              title="Daily Report"
              range={dateRanges.daily}
              report={reports.daily}
            />

            <ReportCard
              title="Month-to-Date Report"
              range={dateRanges.monthToDate}
              report={reports.month_to_date}
            />

            <ReportCard
              title="Previous Month Report"
              range={dateRanges.previousMonth}
              report={reports.previous_month}
            />
          </div>

          <h3>Daily Reading Details</h3>

          {reports.daily?.readings?.length > 0 ? (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time Slot</th>
                    <th>Glucose Value</th>
                  </tr>
                </thead>

                <tbody>
                  {reports.daily.readings.map((reading) => (
                    <tr key={reading.id}>
                      <td>{String(reading.reading_date).slice(0, 10)}</td>
                      <td>{reading.time_slot}</td>
                      <td>{reading.value} mg/dL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No readings found for this date.</p>
          )}
        </>
      )}
    </div>
  );
}

export default ReportCards;
