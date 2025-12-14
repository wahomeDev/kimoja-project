// ================= STORAGE =================
const STORAGE_KEY = "kimoja_elite_data";

// ================= WORKERS =================
const workers = [
  "Ngoronyo", "Sherif", "Scorpion", "Achievers", "Mwea"
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
    attendance: workers.map(() => false)
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

  let header = "<tr><th>Truck</th>";
  workers.forEach(w => header += `<th>${w}</th>`);
  header += "</tr>";
  table.innerHTML += header;

  trucks.forEach((t, i) => {
    let row = `<tr><td>${t.plate}<br>Ksh ${t.amount}</td>`;

    t.attendance.forEach((a, j) => {
      row += `<td>
        <input type="checkbox"
          ${a ? "checked" : ""}
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
  trucks[truckIndex].attendance[workerIndex] =
    !trucks[truckIndex].attendance[workerIndex];

  saveData();
  calculateTotals();
}

// ================= TOTALS =================
function calculateTotals() {
  let totals = workers.map(() => 0);

  trucks.forEach(t => {
    const present = t.attendance.filter(a => a).length;
    if (present === 0) return;

    const share = t.amount / present;
    t.attendance.forEach((a, i) => {
      if (a) totals[i] += share;
    });
  });

  document.getElementById("totalsOutput").innerHTML =
    workers.map((w, i) => `${w}: Ksh ${totals[i].toFixed(2)}`).join("<br>");
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
