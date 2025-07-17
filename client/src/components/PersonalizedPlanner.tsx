import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Calendar, CheckCircle, AlertTriangle, Percent, Download, CalendarPlus, Award } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [showInfo, setShowInfo] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [inputErrors, setInputErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  // Track previous attendance for Comeback Kid
  const [prevAttendance, setPrevAttendance] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow digits or empty string
    if (/^\d*$/.test(value)) {
      setInputs(prev => ({ ...prev, [name]: value }));
      setShowInfo(false);
      // Validation
      let error = "";
      if (name === "totalConducted" && value && Number(value) < 0) error = "Must be 0 or more.";
      if (name === "attended" && value && Number(value) > Number(inputs.totalConducted)) error = "Cannot exceed total conducted.";
      if (name === "remaining" && value && Number(value) < 0) error = "Must be 0 or more.";
      if (name === "threshold" && value && (Number(value) < 0 || Number(value) > 100)) error = "Must be 0-100.";
      setInputErrors(prev => ({ ...prev, [name]: error }));
    }
  };
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setShowInfo(false);
    setActiveInput(e.target.name);
  };
  const handleInputBlur = () => setActiveInput(null);

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
      // --- Badge logic ---
      const badgesToAward: { type: string; label: string; description: string }[] = [];
      // 1. Threshold Achiever
      if (currentAttendance < threshold && data.maxPossible >= threshold && data.table.some((row: any) => row.predicted >= threshold)) {
        badgesToAward.push({
          type: "threshold_achiever",
          label: "Threshold Achiever",
          description: `You planned to cross your attendance threshold of ${threshold}%!`,
        });
      }
      // 2. Attendance Star
      if (data.maxPossible >= 90) {
        badgesToAward.push({
          type: "attendance_star",
          label: "Attendance Star",
          description: "Your predicted attendance is 90% or higher!",
        });
      }
      // 3. Comeback Kid
      if (prevAttendance !== null && prevAttendance < threshold && data.maxPossible >= threshold) {
        badgesToAward.push({
          type: "comeback_kid",
          label: "Comeback Kid",
          description: "You planned a comeback from below to above the threshold!",
        });
      }
      // 4. Perfect Planner
      if (data.mustAttend === data.table.length - 1 && data.maxPossible >= threshold) {
        badgesToAward.push({
          type: "perfect_planner",
          label: "Perfect Planner",
          description: "You planned to attend all remaining classes!",
        });
      }
      // Award badges
      for (const badge of badgesToAward) {
        try {
          await apiRequest("POST", "/api/user-badges", { badgeType: badge.type });
          toast({
            title: `🏅 ${badge.label} Badge Earned!`,
            description: badge.description,
          });
        } catch (err) {
          // Ignore errors if badge already exists
        }
      }
      setPrevAttendance(currentAttendance);
      // --- End badge logic ---
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

  // PDF download handler
  const handleDownloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Attendance Prediction Sheet", 14, 16);
    doc.setFontSize(12);
    doc.text(`Threshold: ${inputs.threshold}%`, 14, 26);
    doc.text(`Must Attend: ${result.mustAttend} / ${inputs.remaining} classes`, 14, 34);
    doc.text(`Current Attendance: ${currentAttendance.toFixed(2)}%`, 14, 42);
    doc.text(`Recommendation: ${result.recommendation}`, 14, 50);
    // Table
    autoTable(doc, {
      startY: 58,
      head: [["If you attend", "If you bunk", "Predicted (%)", "Status"]],
      body: result.table.map((row: any) => {
        let status = "Unsafe";
        if (row.predicted >= (Number(inputs.threshold) || DEFAULT_THRESHOLD)) status = "Safe";
        else if (row.predicted >= (Number(inputs.threshold) || DEFAULT_THRESHOLD) - 2) status = "Borderline";
        return [row.attend, row.bunk, row.predicted.toFixed(2), status];
      }),
    });
    doc.save("attendance-prediction.pdf");
  };

  // Calendar integration handler
  const handleAddToCalendar = () => {
    if (!result) return;
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + Number(inputs.remaining || 0));
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatDate = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T090000Z`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:Attend at least ${result.mustAttend} of the next ${inputs.remaining} classes`,
      `DESCRIPTION:To stay above ${inputs.threshold}% attendance, you must attend at least ${result.mustAttend} out of the next ${inputs.remaining} classes.`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance-reminder.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Unique and actionable summary message logic
  const getSummaryMessage = () => {
    const threshold = Number(inputs.threshold) || DEFAULT_THRESHOLD;
    const mustAttend = result?.mustAttend ?? 0;
    const remaining = Number(inputs.remaining) || 0;
    const current = currentAttendance;
    const maxPossible = result?.maxPossible ?? 0;
    const minPossible = result?.minPossible ?? 0;
    // Impossible to reach threshold
    if (mustAttend > remaining) {
      return (
        <span className="text-red-700 dark:text-red-300 font-semibold">
          ⚠️ Even if you attend all remaining classes, your maximum possible attendance is <b>{maxPossible.toFixed(2)}%</b>.<br />
          It is not possible to reach {threshold}% attendance. Please consult your academic advisor.
        </span>
      );
    }
    // Far above threshold (safe to bunk some)
    const safeToBunk = (() => {
      let safe = 0;
      for (let i = 0; i <= remaining; i++) {
        const predicted = ((Number(inputs.attended) + (remaining - i)) / (Number(inputs.totalConducted) + remaining)) * 100;
        if (predicted >= threshold) safe = i;
        else break;
      }
      return safe;
    })();
    if (current > threshold + 2 && safeToBunk > 0) {
      return (
        <span className="text-green-700 dark:text-green-300 font-semibold">
          🎉 You have a comfortable margin!<br />
          You can safely bunk up to <b>{safeToBunk}</b> more class{safeToBunk > 1 ? 'es' : ''} and still stay above {threshold}% attendance.<br />
          <span className="font-normal text-xs text-gray-600">If you bunk all, your attendance will drop to <b>{minPossible.toFixed(2)}%</b>.</span>
        </span>
      );
    }
    // Just above threshold (within 2%)
    if (current >= threshold && current <= threshold + 2) {
      return (
        <span className="text-yellow-700 dark:text-yellow-300 font-semibold">
          You’re just above the threshold.<br />
          Missing more than <b>{safeToBunk}</b> class{safeToBunk !== 1 ? 'es' : ''} will put you at risk of falling below {threshold}%.
        </span>
      );
    }
    // Exactly at threshold
    if (Math.abs(current - threshold) < 0.01) {
      return (
        <span className="text-yellow-700 dark:text-yellow-300 font-semibold">
          You are exactly at the threshold.<br />
          Any missed class will put you below {threshold}%. Attend as many as possible to stay safe.
        </span>
      );
    }
    // Below threshold, but possible
    if (current < threshold) {
      return (
        <span className="text-red-700 dark:text-red-300 font-semibold">
          You are <b>{(threshold - current).toFixed(2)}%</b> below the threshold.<br />
          Attend at least <b>{mustAttend}</b> consecutive class{mustAttend !== 1 ? 'es' : ''} to reach {threshold}% attendance.<br />
          <span className="font-normal text-xs text-gray-600">If you attend all, your max possible attendance is <b>{maxPossible.toFixed(2)}%</b>. If you bunk all, it will be <b>{minPossible.toFixed(2)}%</b>.</span>
        </span>
      );
    }
    // Already above threshold, no remaining
    if (current >= threshold && remaining === 0) {
      return (
        <span className="text-green-700 dark:text-green-300 font-semibold">
          🎉 You have already met your attendance requirement!<br />
          <span className="font-normal">Current attendance: <b>{current.toFixed(2)}%</b> (Threshold: <b>{threshold}%</b>)</span>
        </span>
      );
    }
    // Fallback
    return (
      <span>
        To stay above <b>{threshold}%</b>, avoid missing more than <b>{safeToBunk}</b> class{safeToBunk !== 1 ? 'es' : ''}.
      </span>
    );
  };

  return (
    <Card className="border-none shadow-lg bg-card text-card-foreground">
      <CardContent className="p-4 sm:p-8">
          <div className="flex items-center gap-2 mb-2 relative">
            <h2 className="text-2xl sm:text-3xl font-bold">Attendance Planner</h2>
            <button
              type="button"
              aria-label="How it works"
              className="ml-2 flex items-center gap-1 px-2 py-0.5 border border-blue-300 dark:border-blue-700 rounded-full text-xs font-medium bg-white dark:bg-blue-950 text-blue-700 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/40 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={() => setShowInfo((v) => !v)}
            >
              <Info className="w-4 h-4" />
              How it works
            </button>
            {showInfo && (
              <div className="absolute left-1/2 top-full z-20 mt-2 w-80 -translate-x-1/2">
                <div className="relative">
                  <div className="absolute left-1/2 -top-2 w-4 h-4 -translate-x-1/2">
                    <div className="w-4 h-4 bg-blue-50 dark:bg-blue-900/80 border-l border-t border-blue-200 dark:border-blue-800 rotate-45"></div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/80 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 shadow-xl text-sm animate-fade-in-down">
                    <div className="font-semibold mb-1 text-blue-800 dark:text-blue-100">How this feature works</div>
                    <ol className="list-decimal pl-5 mb-2 space-y-0.5">
                      <li>Enter <b>total classes conducted</b>, <b>attended</b>, and <b>remaining</b> classes.</li>
                      <li>Set your <b>attendance threshold</b> (default: 75%).</li>
                      <li>Click <b>Calculate</b> to see how many more classes you need to attend.</li>
                    </ol>
                    <div className="font-semibold mb-1">Example</div>
                    <div className="mb-1 flex flex-wrap gap-1">
                      <span className="inline-block bg-blue-100 dark:bg-blue-900/40 rounded px-2 py-0.5">Total: 60</span>
                      <span className="inline-block bg-blue-100 dark:bg-blue-900/40 rounded px-2 py-0.5">Attended: 45</span>
                      <span className="inline-block bg-blue-100 dark:bg-blue-900/40 rounded px-2 py-0.5">Remaining: 20</span>
                      <span className="inline-block bg-blue-100 dark:bg-blue-900/40 rounded px-2 py-0.5">Threshold: 75%</span>
                    </div>
                    <div>
                      <b>Result:</b> The planner tells you how many of the next 20 classes you must attend to stay above 75% attendance.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="text-muted-foreground mb-6">Plan your attendance and stay above the threshold</p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium">Total Classes Conducted</label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  inputMode="numeric"
                  name="totalConducted"
                  min={0}
                  value={inputs.totalConducted}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className={`input input-bordered border ${inputErrors.totalConducted ? 'border-red-500' : activeInput === 'totalConducted' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'} pl-8 rounded-lg shadow-sm w-full focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-base py-2`}
                  required
                  autoComplete="off"
                  placeholder="e.g. 60"
                  aria-label="Total Classes Conducted"
                />
              </div>
              {inputErrors.totalConducted && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{inputErrors.totalConducted}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Classes Attended</label>
              <div className="relative">
                <CheckCircle className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  inputMode="numeric"
                  name="attended"
                  min={0}
                  max={inputs.totalConducted}
                  value={inputs.attended}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className={`input input-bordered border ${inputErrors.attended ? 'border-red-500' : activeInput === 'attended' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'} pl-8 rounded-lg shadow-sm w-full focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-base py-2`}
                  required
                  autoComplete="off"
                  placeholder="e.g. 45"
                  aria-label="Classes Attended"
                />
              </div>
              {inputErrors.attended && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{inputErrors.attended}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Remaining Classes</label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  inputMode="numeric"
                  name="remaining"
                  min={0}
                  value={inputs.remaining}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className={`input input-bordered border ${inputErrors.remaining ? 'border-red-500' : activeInput === 'remaining' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'} pl-8 rounded-lg shadow-sm w-full focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-base py-2`}
                  required
                  autoComplete="off"
                  placeholder="e.g. 20"
                  aria-label="Remaining Classes"
                />
              </div>
              {inputErrors.remaining && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{inputErrors.remaining}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Threshold (%)</label>
              <div className="relative">
                <Percent className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  inputMode="numeric"
                  name="threshold"
                  min={0}
                  max={100}
                  value={inputs.threshold}
                  onChange={handleChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className={`input input-bordered border ${inputErrors.threshold ? 'border-red-500' : activeInput === 'threshold' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'} pl-8 rounded-lg shadow-sm w-full focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-base py-2`}
                  autoComplete="off"
                  placeholder="e.g. 75"
                  aria-label="Threshold (%)"
                />
              </div>
              {inputErrors.threshold && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{inputErrors.threshold}</div>}
            </div>
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">
              <b>Current Attendance:</b> {currentAttendance.toFixed(2)}%
            </div>
            <button
              type="submit"
              className="btn btn-primary mt-2 transition-transform duration-150 active:scale-95 hover:shadow-lg focus:ring-2 focus:ring-primary/40 w-full py-3 text-base"
            >
              Calculate
            </button>
          </form>
          {loading && (
            <div className="mb-4 flex items-center gap-2 text-blue-600 animate-fade-in-up">
              <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Calculating...
            </div>
          )}
          {error && <div className="mb-4 text-red-600 animate-fade-in-down">{error}</div>}
          {submitted && result && (
            <>
              <div className="mb-4 p-3 sm:p-4 rounded-xl shadow bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 dark:from-gray-900 dark:via-green-950 dark:to-purple-900 border border-primary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between animate-fade-in-down text-center sm:text-left gap-2">
                <div className="flex-1 text-base">
                  <span className="text-lg font-semibold mr-1">Summary</span>
                  {getSummaryMessage()}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center">
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1 px-3 py-2 rounded bg-primary text-white hover:bg-primary/90 transition text-xs sm:text-sm shadow focus:outline-none focus:ring-2 focus:ring-primary/40 mt-2 sm:mt-0"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleAddToCalendar}
                    className="flex items-center gap-1 px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition text-xs sm:text-sm shadow focus:outline-none focus:ring-2 focus:ring-green-400 mt-2 sm:mt-0 ml-0 sm:ml-2"
                  >
                    <CalendarPlus className="w-4 h-4" /> Add to Calendar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
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
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className={`input input-bordered border ${inputErrors.customAttend ? 'border-red-500' : activeInput === 'customAttend' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'} pl-8 rounded-lg shadow-sm w-20 text-center font-bold text-lg mb-1 focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-base py-2`}
                    autoComplete="off"
                    placeholder="e.g. 10"
                    aria-label="Custom Attendance"
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
              <div className="overflow-x-auto rounded-lg border mt-2">
                <table className="min-w-[340px] w-full border-none rounded-lg text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <tr>
                      <th className="px-2 py-2">If you attend</th>
                      <th className="px-2 py-2">If you bunk</th>
                      <th className="px-2 py-2">Predicted (%)</th>
                      <th className="px-2 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.table.map((row: any, idx: number) => {
                      let status = "Unsafe";
                      let icon = "❌";
                      let rowColor = "bg-red-100 dark:bg-red-900/10";
                      let badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-200 animate-fade-in-up"><span>❌</span> Unsafe</span>;
                      if (row.predicted >= (Number(inputs.threshold) || DEFAULT_THRESHOLD)) {
                        status = "Safe";
                        icon = "✅";
                        rowColor = "bg-green-100 dark:bg-green-900/10";
                        badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-200 animate-fade-in-up"><span>✅</span> Safe</span>;
                      } else if (row.predicted >= (Number(inputs.threshold) || DEFAULT_THRESHOLD) - 2) {
                        status = "Borderline";
                        icon = "⚠️";
                        rowColor = "bg-yellow-100 dark:bg-yellow-900/10";
                        badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-200 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 animate-fade-in-up"><span>⚠️</span> Borderline</span>;
                      }
                      return (
                        <tr key={idx} className={rowColor + " text-center animate-fade-in-up"}>
                          <td className="px-3 py-1 font-medium">{row.attend}</td>
                          <td className="px-3 py-1 font-medium">{row.bunk}</td>
                          <td className="px-3 py-1">{row.predicted.toFixed(2)}</td>
                          <td className="px-3 py-1 text-lg">{badge}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Legend for icons/colors */}
              <div className="mt-2 text-sm flex flex-wrap gap-4 items-center">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-200"><span>✅</span> Safe</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-200 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"><span>⚠️</span> Borderline</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-200"><span>❌</span> Unsafe</span>
              </div>
              {/* Motivational Tip */}
              <div className="mt-4 text-center text-sm text-blue-700 dark:text-blue-200 animate-fade-in-up">
                <span role="img" aria-label="lightbulb">💡</span> Tip: Consistent attendance keeps you stress-free and on track for success!
              </div>
            </>
          )}
        </CardContent>
    </Card>
  );
} 