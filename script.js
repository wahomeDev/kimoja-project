// ================= STORAGE =================
let paymentHistory = JSON.parse(localStorage.getItem("kimoja_payment_history")) || [];
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
let currentSort = { key: "name", asc: true };
let filterWorkerId = "";
let searchTruckPlate = "";

// Load saved data
const savedData = localStorage.getItem(STORAGE_KEY);
if (savedData) trucks = JSON.parse(savedData);

// ================= SAVE =================
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trucks));
}

// ================= ADD TRUCK =================
function addTruck() {
  const plate = document.getElementById("plate").value.trim();
  const amount = Number(document.getElementById("amount").value);

  if (!plate || !amount) { alert("Fill all fields"); return; }

  const truck = {
    plate,
    amount,
    attendance: workers.map(w => ({ workerId: w.id, present: false }))
  };

  trucks.push(truck);
  saveData();
  applyFiltersAndRender();
  document.getElementById("plate").value = "";
  document.getElementById("amount").value = "";
}

// ================= FILTER & SEARCH =================
function setFilter(workerId) {
  filterWorkerId = workerId;
  applyFiltersAndRender();
}

function setSearch(plate) {
  searchTruckPlate = plate.toLowerCase();
  applyFiltersAndRender();
}

function applyFiltersAndRender() {
  let filteredTrucks = [...trucks];

  if (filterWorkerId) {
    filteredTrucks = filteredTrucks.filter(truck =>
      truck.attendance.some(a => a.workerId === filterWorkerId && a.present)
    );
  }

  if (searchTruckPlate) {
    filteredTrucks = filteredTrucks.filter(truck =>
      truck.plate.toLowerCase().includes(searchTruckPlate)
    );
  }

  renderTable(filteredTrucks);
  calculateTotals();
  renderEarningsChart();
}

// ================= TABLE =================
function renderTable(displayTrucks = trucks) {
  const table = document.getElementById("workTable");
  table.innerHTML = "";

  // Header with sortable totals
  let header = "<tr><th>Truck</th>";
  workers.forEach((w, idx) => {
    header += `<th onclick="sortWorkers('${w.id}')">${w.name}</th>`;
  });
  header += "</tr>";
  table.innerHTML += header;

  // Rows
  displayTrucks.forEach((t, i) => {
    let row = `<tr><td>${t.plate}<br>Ksh ${t.amount}</td>`;
    t.attendance.forEach((a, j) => {
      const highlightClass = a.present ? "" : "zero-attendance";
      const worker = workers[j];

      row += `<td class="${highlightClass}">
        <div class="tooltip">
          <input type="checkbox" ${a.present ? "checked" : ""} onchange="toggle(${i},${j})">
          <span class="tooltiptext">${worker.name} total: Ksh ${worker.total.toFixed(2)}</span>
        </div>
      </td>`;
    });
    row += "</tr>";
    table.innerHTML += row;
  });
}

// ================= TOGGLE =================
function toggle(truckIndex, workerIndex) {
  const record = trucks[truckIndex].attendance[workerIndex];
  record.present = !record.present;
  saveData();
  applyFiltersAndRender();
}

// ================= TOTALS =================
function calculateTotals() {
  workers.forEach(w => w.total = 0);

  trucks.forEach(truck => {
    const presentWorkers = truck.attendance.filter(a => a.present);
    if (!presentWorkers.length) return;

    const share = truck.amount / presentWorkers.length;
    presentWorkers.forEach(p => {
      const worker = workers.find(w => w.id === p.workerId);
      if (worker) worker.total += share;
    });
  });

  document.getElementById("totalsOutput").innerHTML =
    workers.map(w => `${w.name}: Ksh ${w.total.toFixed(2)}`).join("<br>");
}

// ================= SORT WORKERS =================
function sortWorkers(workerId) {
  const worker = workers.find(w => w.id === workerId);
  if (!worker) return;

  currentSort.asc = currentSort.key === workerId ? !currentSort.asc : true;
  currentSort.key = workerId;

  workers.sort((a, b) => {
    if (a.id === workerId && b.id === workerId) return 0;
    if (currentSort.key === "name") {
      return currentSort.asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else {
      return currentSort.asc ? a.total - b.total : b.total - a.total;
    }
  });

  applyFiltersAndRender();
}

// ================= RESET =================
function resetCycle() {
  if (!confirm("Reset after payment?")) return;
  trucks = [];
  localStorage.removeItem(STORAGE_KEY);
  applyFiltersAndRender();
}

// ================= PAYMENT HISTORY =================
function renderPaymentHistory() {
  const container = document.getElementById("paymentHistoryContainer");
  container.innerHTML = "";

  if (!paymentHistory.length) {
    container.innerHTML = "<p>No payment history yet.</p>";
    return;
  }

  // Cumulative totals
  const cumulativeTotals = {};
  workers.forEach(w => cumulativeTotals[w.name] = 0);
  paymentHistory.forEach(cycle => {
    cycle.workers.forEach(w => { cumulativeTotals[w.name] += w.amount; });
  });

  const aggregateDiv = document.createElement("div");
  aggregateDiv.innerHTML = `<h3>Cumulative Totals</h3>` +
    Object.entries(cumulativeTotals).map(([n, a]) => `<p>${n}: Ksh ${a.toFixed(2)}</p>`).join("");
  container.appendChild(aggregateDiv);

  // History cards
  [...paymentHistory].reverse().forEach(cycle => {
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
    workers: workers.map(w => ({ id: w.id, name: w.name, amount: w.total }))
  };
  paymentHistory.push(snapshot);
  localStorage.setItem("kimoja_payment_history", JSON.stringify(paymentHistory));
  resetCycle();
  renderPaymentHistory();
}

// ================= TOGGLE HISTORY =================
function toggleHistory() {
  const container = document.getElementById("paymentHistoryContainer");
  container.style.display = container.style.display === "none" ? "block" : "none";
}

// ================= DAILY EARNINGS CHART =================
function renderEarningsChart() {
  const ctx = document.getElementById('earningsChart').getContext('2d');
  const labels = workers.map(w => w.name);
  const data = workers.map(w => w.total);

  if (window.earningsChartInstance) window.earningsChartInstance.destroy();

  window.earningsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Worker Earnings',
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Worker Earnings' } }, scales: { y: { beginAtZero: true } } }
  });
}

// ================= FINANCE TIPS =================
const financeTips = [
  "Save at least 10% of your earnings every week.",
  "Track your daily expenses to avoid overspending.",
  "Invest in skills that increase your earning potential.",
  "Separate personal and business finances.",
  "Review your payment history weekly to spot patterns."
];

function showFinanceTip() {
  const tip = financeTips[Math.floor(Math.random() * financeTips.length)];
  document.getElementById('financeTip').textContent = tip;
}

// ================= INITIAL LOAD =================
applyFiltersAndRender();
renderPaymentHistory();
renderEarningsChart();
showFinanceTip();
