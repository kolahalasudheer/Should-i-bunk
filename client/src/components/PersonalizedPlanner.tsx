import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_THRESHOLD = 75;

export default function PersonalizedPlanner() {
  const [inputs, setInputs] = useState({
    totalConducted: "",
    attended: "",
    remaining: "",
    threshold: DEFAULT_THRESHOLD.toString(),
    customAttend: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow digits or empty string
    if (/^\d*$/.test(value)) {
      setInputs(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setLoading(true);
    setError(null);
    setResult(null);
    // Parse values as numbers, treat empty as 0
    const totalConducted = Number(inputs.totalConducted) || 0;
    const attended = Number(inputs.attended) || 0;
    const remaining = Number(inputs.remaining) || 0;
    const threshold = Number(inputs.threshold) || DEFAULT_THRESHOLD;
    const currentAttendance = totalConducted > 0 ? (attended / totalConducted) * 100 : 0;
    try {
      const res = await fetch("/api/attendance-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentAttendance,
          totalConducted,
          attended,
          remaining,
          threshold,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "API error");
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Remove quick action handler and buttons, restore previous logic

  // Custom scenario (client-side, since it's trivial math)
  const customScenario = (() => {
    const attended = Number(inputs.attended) || 0;
    const totalConducted = Number(inputs.totalConducted) || 0;
    const remaining = Number(inputs.remaining) || 0;
    const customAttend = Number(inputs.customAttend) || 0;
    if (customAttend > remaining) return null;
    const attendedFinal = attended + customAttend;
    const conductedFinal = totalConducted + remaining;
    const percent = conductedFinal > 0 ? (attendedFinal / conductedFinal) * 100 : 0;
    return {
      attend: customAttend,
      bunk: remaining - customAttend,
      predicted: percent,
    };
  })();

  // Calculate current attendance for display
  const totalConducted = Number(inputs.totalConducted) || 0;
  const attended = Number(inputs.attended) || 0;
  const currentAttendance = totalConducted > 0 ? (attended / totalConducted) * 100 : 0;

  return (
    <Card className="border-none shadow-lg bg-card text-card-foreground">
      <CardContent className="p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Attendance Planner</h2>
          <p className="text-muted-foreground mb-6">Plan your attendance and stay above the threshold</p>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium">Total Classes Conducted</label>
              <input
                type="text"
                inputMode="numeric"
                name="totalConducted"
                min={0}
                value={inputs.totalConducted}
                onChange={handleChange}
                className="input input-bordered border border-gray-300 rounded-lg shadow-sm w-full focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                required
                autoComplete="off"
                placeholder="e.g. 60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Classes Attended</label>
              <input
                type="text"
                inputMode="numeric"
                name="attended"
                min={0}
                max={inputs.totalConducted}
                value={inputs.attended}
                onChange={handleChange}
                className="input input-bordered border border-gray-300 rounded-lg shadow-sm w-full focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                required
                autoComplete="off"
                placeholder="e.g. 45"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Remaining Classes</label>
              <input
                type="text"
                inputMode="numeric"
                name="remaining"
                min={0}
                value={inputs.remaining}
                onChange={handleChange}
                className="input input-bordered border border-gray-300 rounded-lg shadow-sm w-full focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                required
                autoComplete="off"
                placeholder="e.g. 20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Threshold (%)</label>
              <input
                type="text"
                inputMode="numeric"
                name="threshold"
                min={0}
                max={100}
                value={inputs.threshold}
                onChange={handleChange}
                className="input input-bordered border border-gray-300 rounded-lg shadow-sm w-full focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                autoComplete="off"
                placeholder="e.g. 75"
              />
            </div>
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">
              <b>Current Attendance:</b> {currentAttendance.toFixed(2)}%
            </div>
            <button type="submit" className="btn btn-primary mt-2">Calculate</button>
          </form>
          {loading && <div className="mb-4">Calculating...</div>}
          {error && <div className="mb-4 text-red-600">{error}</div>}
          {submitted && result && (
            <>
              <div className="mb-4 p-4 rounded bg-gray-100 dark:bg-gray-800 flex items-center gap-2">
                <span className="text-2xl">{result.icon}</span>
                <span className="font-medium">{result.recommendation}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded bg-green-50 dark:bg-green-900/20">
                  <b>🧮 If you attend all remaining:</b><br />
                  <span className="text-lg font-bold">{result.maxPossible.toFixed(2)}%</span>
                </div>
                <div className="p-3 rounded bg-red-50 dark:bg-red-900/20">
                  <b>🛑 If you bunk all remaining:</b><br />
                  <span className="text-lg font-bold">{result.minPossible.toFixed(2)}%</span>
                </div>
              </div>
              {/* Custom Scenario - small box */}
              <div className="mb-4 flex justify-center">
                <div className="bg-gray-50 dark:bg-gray-800 border border-black dark:border-black rounded-lg px-4 py-3 flex flex-col items-center w-auto min-w-[220px]">
                  <label className="block text-sm font-semibold mb-2 text-center">
                    Enter the number of classes you plan to attend to check your final attendance score:
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    min={0}
                    max={inputs.remaining}
                    name="customAttend"
                    value={inputs.customAttend}
                    onChange={handleChange}
                    className="input input-bordered border border-gray-300 rounded-lg shadow-sm w-20 text-center font-bold text-lg mb-1 focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    autoComplete="off"
                    placeholder="e.g. 10"
                  />
                  {customScenario && (
                    <div className="text-sm mt-1 text-center">
                      If you attend <b>{customScenario.attend}</b> and bunk <b>{customScenario.bunk}</b> of the remaining <b>{inputs.remaining}</b> classes, your final attendance will be <b>{customScenario.predicted.toFixed(2)}%</b>.
                    </div>
                  )}
                </div>
              </div>
              {/* Summary above the table */}
              <div className="mb-2 text-base font-semibold">
                To reach <span className="text-primary">{inputs.threshold}%</span> attendance, you must attend at least <span className="text-primary">{result.mustAttend}</span> out of the next <span className="text-primary">{inputs.remaining}</span> classes.
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full border rounded-lg">
                  <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <tr>
                      <th className="px-3 py-2">Attend</th>
                      <th className="px-3 py-2">Bunk</th>
                      <th className="px-3 py-2">Predicted Attendance (%)</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.table.map((row: any, idx: number) => {
                      let status = "Unsafe";
                      let icon = "❌";
                      let rowColor = "bg-red-100 dark:bg-red-900/10";
                      if (row.predicted >= (Number(inputs.threshold) || DEFAULT_THRESHOLD)) {
                        status = "Safe";
                        icon = "✅";
                        rowColor = "bg-green-100 dark:bg-green-900/10";
                      } else if (row.predicted >= (Number(inputs.threshold) || DEFAULT_THRESHOLD) - 1) {
                        status = "Borderline";
                        icon = "⚠️";
                        rowColor = "bg-yellow-100 dark:bg-yellow-900/10";
                      }
                      return (
                        <tr key={idx} className={rowColor + " text-center"}>
                          <td className="px-3 py-1 font-medium">{row.attend}</td>
                          <td className="px-3 py-1 font-medium">{row.bunk}</td>
                          <td className="px-3 py-1">{row.predicted.toFixed(2)}</td>
                          <td className="px-3 py-1 text-lg">{icon} <span className="text-xs">{status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Legend for icons/colors */}
              <div className="mt-2 text-sm flex flex-wrap gap-4 items-center">
                <span className="inline-flex items-center"><span className="text-lg">✅</span> Safe (Above threshold)</span>
                <span className="inline-flex items-center"><span className="text-lg">⚠️</span> Borderline (Within 1% of threshold)</span>
                <span className="inline-flex items-center"><span className="text-lg">❌</span> Unsafe (Below threshold)</span>
              </div>
            </>
          )}
        </CardContent>
    </Card>
  );
} 