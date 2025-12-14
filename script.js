// ================= STORAGE =================
let paymentHistory = JSON.parse(
  localStorage.getItem("kimoja_payment_history")
) || [];

const STORAGE_KEY = "kimoja_elite_data";

// ================= WORKERS =================
const workers = [
  { id: "ngoronyo", name: "Ngoronyo", phone: "", total: 0 },
  { id: "sherif", name: "Sherif", phone: "", total: 0 },
  { id: "scorpion", name: "Scorpion", phone: "", total: 0 },
  { id: "achievers", name: "Achievers", phone: "", total: 0 },
  { id: "mwea", name: "Mwea", phone: "", total: 0 }
];

// ================= DATA =================
let trucks = [];

// Load saved data
const savedData = localStorage.getItem(STORAGE_KEY);
if (savedData) {
  trucks = JSON.parse(savedData);
}

// ================= SAVE =================
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trucks));
}

// ================= ADD TRUCK =================
function addTruck() {
  const plate = document.getElementById("plate").value.trim();
  const amount = Number(document.getElementById("amount").value);

  // Input validation
  if (!plate) {
    alert("Truck plate cannot be empty!");
    return;
  }
  if (!amount || amount <= 0) {
    alert("Truck amount must be greater than 0!");
    return;
  }

  const truck = {
    plate,
    amount,
    attendance: workers.map(w => ({
      workerId: w.id,
      present: false
    }))
  };

  trucks.push(truck);
  saveData();
  renderTable();

  document.getElementById("plate").value = "";
  document.getElementById("amount").value = "";
}

// ================= TABLE =================
function renderTable() {
  const table = document.getElementById("workTable");
  table.innerHTML = "";

  // Header
  let header = "<tr><th>Truck</th>";
  workers.forEach(w => header += `<th>${w.name}</th>`);
  header += "</tr>";
  table.innerHTML += header;

  // Rows
  trucks.forEach((t, i) => {
    let row = `<tr><td>${t.plate}<br>Ksh ${t.amount}</td>`;

    // Attendance cells with zero-attendance highlight
    t.attendance.forEach((a, j) => {
      const highlightClass = a.present ? "" : "zero-attendance";
      row += `<td class="${highlightClass}">
        <input type="checkbox"
          ${a.present ? "checked" : ""}
          onchange="toggle(${i},${j})">
      </td>`;
    });

    row += "</tr>";
    table.innerHTML += row;
  });

  calculateTotals();
  renderChart(); // update chart whenever table changes
}

// ================= TOGGLE =================
function toggle(truckIndex, workerIndex) {
  const record = trucks[truckIndex].attendance[workerIndex];
  record.present = !record.present;
  saveData();
  calculateTotals();
  renderChart(); // update chart whenever checkbox changes
}

// ================= TOTALS =================
function calculateTotals() {
  workers.forEach(w => w.total = 0);

  trucks.forEach(truck => {
    const presentWorkers = truck.attendance.filter(a => a.present);
    if (presentWorkers.length === 0) return;

    const share = truck.amount / presentWorkers.length;

    presentWorkers.forEach(p => {
      const worker = workers.find(w => w.id === p.workerId);
      if (worker) worker.total += share;
    });
  });

  document.getElementById("totalsOutput").innerHTML =
    workers.map(w => `${w.name}: Ksh ${w.total.toFixed(2)}`).join("<br>");
}

// ================= RESET =================
function resetCycle() {
  if (!confirm("Reset after payment?")) return;

  trucks = [];
  localStorage.removeItem(STORAGE_KEY);
  renderTable();
}

// ================= PAYMENT HISTORY =================
function renderPaymentHistory() {
  const container = document.getElementById("paymentHistoryContainer");
  container.innerHTML = "";

  if (!paymentHistory || paymentHistory.length === 0) {
    container.innerHTML = "<p>No payment history yet.</p>";
    return;
  }

  // Calculate cumulative totals
  const cumulativeTotals = {};
  workers.forEach(w => cumulativeTotals[w.name] = 0);
  paymentHistory.forEach(cycle => {
    cycle.workers.forEach(w => {
      cumulativeTotals[w.name] += w.amount;
    });
  });

  // Display cumulative totals at top
  const aggregateDiv = document.createElement("div");
  aggregateDiv.innerHTML = `<h3>Cumulative Totals</h3>` +
    Object.entries(cumulativeTotals)
      .map(([name, amount]) => `<p>${name}: Ksh ${amount.toFixed(2)}</p>`)
      .join("");
  container.appendChild(aggregateDiv);

  // Render history cards (newest first)
  const sortedHistory = [...paymentHistory].reverse();
  sortedHistory.forEach(cycle => {
    const card = document.createElement("div");
    card.classList.add("history-card");

    card.innerHTML = `<h3>${cycle.cycle} - ${cycle.date}</h3>`;

    const list = document.createElement("ul");
    cycle.workers.forEach(w => {
      const li = document.createElement("li");
      li.textContent = `${w.name}: Ksh ${w.amount.toFixed(2)}`;
      list.appendChild(li);
    });

    card.appendChild(list);
    container.appendChild(card);
  });
}

// ================= CLOSE PAY CYCLE =================
function closePayCycle(cycleName) {
  const snapshot = {
    cycle: cycleName,
    date: new Date().toLocaleDateString(),
    workers: workers.map(w => ({
      id: w.id,
      name: w.name,
      amount: w.total
    }))
  };

  paymentHistory.push(snapshot);
  localStorage.setItem("kimoja_payment_history", JSON.stringify(paymentHistory));

  resetCycle();
  renderPaymentHistory();
  renderChart(); // update chart after closing pay cycle
}

// ================= TOGGLE HISTORY =================
function toggleHistory() {
  const container = document.getElementById("paymentHistoryContainer");
  container.style.display = container.style.display === "none" ? "block" : "none";
}

// ================= DYNAMIC CHART =================
let earningsChart; // global variable for chart

function renderChart() {
  const ctx = document.getElementById("earningsChart").getContext("2d");

  const labels = workers.map(w => w.name);
  const data = workers.map(w => w.total);

  if (earningsChart) {
    earningsChart.data.datasets[0].data = data;
    earningsChart.update();
  } else {
    earningsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Current Earnings (Ksh)',
          data: data,
          backgroundColor: '#4CAF50'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Worker Earnings' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}

// ================= INITIAL LOAD =================
renderTable();
calculateTotals();
renderPaymentHistory();
renderChart();

