const workers = [
  "Ngoronyo", "Sherif", "Scorpion", "Achievers", "Mwea"
];

let trucks = [];

function addTruck() {
  const plate = document.getElementById("plate").value;
  const amount = Number(document.getElementById("amount").value);

  if (!plate || !amount) return alert("Fill all fields");

  const truck = {
    plate,
    amount,
    attendance: workers.map(() => false)
  };

  trucks.push(truck);
  renderTable();
}

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
          onchange="toggle(${i},${j})">
      </td>`;
    });
    row += "</tr>";
    table.innerHTML += row;
  });

  calculateTotals();
}

function toggle(truckIndex, workerIndex) {
  trucks[truckIndex].attendance[workerIndex] =
    !trucks[truckIndex].attendance[workerIndex];
  calculateTotals();
}

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

function resetCycle() {
  if (!confirm("Reset after payment?")) return;
  trucks = [];
  renderTable();
}
