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
  const plate = document.getElementById("plate").value;
  const amount = Number(document.getElementById("amount").value);

  if (!plate || !amount) {
    alert("Fill all fields");
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

    t.attendance.forEach((a, j) => {
      row += `<td>
        <input type="checkbox"
          ${a.present ? "checked" : ""}
          onchange="toggle(${i},${j})">
      </td>`;
    });

    row += "</tr>";
    table.innerHTML += row;
  });

  calculateTotals();
}


// ================= TOGGLE =================
function toggle(truckIndex, workerIndex) {
  const record = trucks[truckIndex].attendance[workerIndex];
record.present = !record.present;
saveData();
calculateTotals();


  saveData();
  calculateTotals();
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

// Initial render
renderTable();
// INITIAL LOAD
renderTable();
calculateTotals();

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

  localStorage.setItem(
    "kimoja_payment_history",
    JSON.stringify(paymentHistory)
  );

  resetCycle();
}

