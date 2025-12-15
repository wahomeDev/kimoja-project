// ================= WORKERS =================
const workers = ["Ngoronyo", "Sherif", "Scorpion", "Achievers", "Mwea"];


function populateWorkerSelect() {
  const select = document.getElementById("workerSelect");
  if (!select) return;

  select.innerHTML = workers
    .map(w => `<option value="${w}">${w}</option>`)
    .join("");
}


// ================= STORAGE =================
let trucks = JSON.parse(localStorage.getItem("trucks")) || [];
let paymentHistory = JSON.parse(localStorage.getItem("history")) || [];

let dailyChart = null;
let cumulativeChart = null;

// ================= ADD TRUCK =================
function addTruck() {
  const plate = document.getElementById("plate").value.trim();
  const amount = Number(document.getElementById("amount").value);

  if (!plate || !amount) return alert("Fill all fields");

  trucks.push({
    plate,
    amount,
    attendance: workers.map(() => ({ present: true }))
  });

  document.getElementById("plate").value = "";
  document.getElementById("amount").value = "";

  save();
  render();
}

// ================= TABLE =================
function renderTable() {
  const table = document.getElementById("workTable");
  let html = `<tr><th>Truck</th>${workers.map(w => `<th>${w}</th>`).join("")}</tr>`;

  trucks.forEach((t, ti) => {
    html += `<tr><td>${t.plate}<br>Ksh ${t.amount}</td>`;
    t.attendance.forEach((a, wi) => {
      html += `
        <td class="${a.present ? "" : "zero-attendance"}">
          <input type="checkbox"
            ${a.present ? "checked" : ""}
            onchange="toggle(${ti},${wi})">
        </td>`;
    });
    html += "</tr>";
  });

  table.innerHTML = html;
}

// ================= TOGGLE =================
function toggle(ti, wi) {
  trucks[ti].attendance[wi].present = !trucks[ti].attendance[wi].present;
  save();
  render();
}

// ================= TOTALS =================
function calculateDailyTotals() {
  const totals = Object.fromEntries(workers.map(w => [w, 0]));

  trucks.forEach(t => {
    const present = t.attendance.filter(a => a.present);
    if (!present.length) return;

    const share = t.amount / present.length;
    t.attendance.forEach((a, i) => {
      if (a.present) totals[workers[i]] += share;
    });
  });

  return totals;
}

function calculateCumulativeTotals() {
  const totals = Object.fromEntries(workers.map(w => [w, 0]));
  paymentHistory.forEach(cycle => {
    cycle.totals.forEach(([name, amount]) => {
      totals[name] += amount;
    });
  });
  return totals;
}

// ================= TOTALS UI =================
function renderTotals() {
  const totals = calculateDailyTotals();
  document.getElementById("totalsOutput").innerHTML =
    Object.entries(totals)
      .map(([w, v]) => `<p>${w}: <strong>Ksh ${v.toFixed(2)}</strong></p>`)
      .join("");

  renderCharts();
}

// ================= CHARTS =================
function renderCharts() {
  renderDailyChart();
  renderCumulativeChart();
}

function renderDailyChart() {
  const totals = calculateDailyTotals();
  const ctx = document.getElementById("dailyChart").getContext("2d");

  if (dailyChart) dailyChart.destroy();

  dailyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(totals),
      datasets: [{
        label: "Daily Earnings",
        data: Object.values(totals)
      }]
    }
  });
}

function renderCumulativeChart() {
  const totals = calculateCumulativeTotals();
  const ctx = document.getElementById("cumulativeChart").getContext("2d");

  if (cumulativeChart) cumulativeChart.destroy();

  cumulativeChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(totals),
      datasets: [{
        label: "Cumulative Earnings",
        data: Object.values(totals)
      }]
    }
  });
}

// ================= PAYMENT HISTORY =================
function closePayCycle() {
  const dailyTotals = calculateDailyTotals();

  paymentHistory.push({
    date: new Date().toLocaleDateString(),
    totals: Object.entries(dailyTotals)
  });

  trucks = [];
  save();
  render();
}

function renderHistory() {
  const el = document.getElementById("paymentHistoryContainer");

  if (!paymentHistory.length) {
    el.innerHTML = "<p>No payment history yet.</p>";
    return;
  }

  el.innerHTML = paymentHistory
    .slice()
    .reverse()
    .map(c => `
      <div class="history-card">
        <strong>${c.date}</strong>
        ${c.totals.map(t => `<p>${t[0]}: Ksh ${t[1].toFixed(2)}</p>`).join("")}
      </div>
    `)
    .join("");
}

function toggleHistory() {
  const el = document.getElementById("paymentHistoryContainer");
  el.style.display = el.style.display === "none" ? "block" : "none";
}

// ================= SAVE & INIT =================
function save() {
  localStorage.setItem("trucks", JSON.stringify(trucks));
  localStorage.setItem("history", JSON.stringify(paymentHistory));
}

// ================= PAYSLIPS =================
function generatePayslip() {
  const worker = document.getElementById("workerSelect").value;
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const output = document.getElementById("payslipOutput");

  output.innerHTML = "";
  if (!worker) return;

  let total = 0;
  let rows = [];

  paymentHistory.forEach(cycle => {
    const d = new Date(cycle.date);
    if ((from && d < new Date(from)) || (to && d > new Date(to))) return;

    cycle.totals.forEach(([name, amount]) => {
      if (name === worker) {
        total += amount;
        rows.push(`<tr><td>${cycle.date}</td><td>Ksh ${amount.toFixed(2)}</td></tr>`);
      }
    });
  });

  if (!rows.length) {
    output.innerHTML = "<p>No records found.</p>";
    return;
  }

  output.innerHTML = `
    <h3>Payslip: ${worker}</h3>
    <table>
      <tr><th>Date</th><th>Amount</th></tr>
      ${rows.join("")}
      <tr><th>Total</th><th>Ksh ${total.toFixed(2)}</th></tr>
    </table>
  `;
}

function exportPayslipCSV() {
  const worker = document.getElementById("workerSelect").value;
  if (!worker) return;

  let csv = "Date,Worker,Amount\n";

  paymentHistory.forEach(cycle => {
    cycle.totals.forEach(([name, amount]) => {
      if (name === worker) {
        csv += `${cycle.date},${name},${amount.toFixed(2)}\n`;
      }
    });
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${worker}_payslip.csv`;
  link.click();
}

function render() {
  renderTable();
  renderTotals();
  renderHistory();
  populateWorkerSelect();
}

render();
