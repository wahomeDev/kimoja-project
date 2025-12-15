const workers = ["Ngoronyo","Sherif","Scorpion","Achievers","Mwea"];
let trucks = JSON.parse(localStorage.getItem("trucks")) || [];
let paymentHistory = JSON.parse(localStorage.getItem("history")) || [];
let dailyChart=null, cumulativeChart=null;
let currentFilters = { from:null, to:null, worker:null };

// ---------------- FILTERS ----------------
function populateFilterWorker() {
  const select = document.getElementById("filterWorker");
  select.innerHTML = `<option value="">All</option>` + workers.map(w=>`<option value="${w}">${w}</option>`).join("");
}

function applyFilters() {
  currentFilters.from = document.getElementById("filterFrom").value||null;
  currentFilters.to = document.getElementById("filterTo").value||null;
  currentFilters.worker = document.getElementById("filterWorker").value||null;
  render();
}

function resetFilters() {
  currentFilters={from:null,to:null,worker:null};
  document.getElementById("filterFrom").value="";
  document.getElementById("filterTo").value="";
  document.getElementById("filterWorker").value="";
  render();
}

// ---------------- ADD TRUCK ----------------
function addTruck(){
  const plate = document.getElementById("plate").value.trim();
  const amount = Number(document.getElementById("amount").value);
  if(!plate||!amount) return alert("Fill all fields");
  trucks.push({ plate, amount, attendance: workers.map(()=>({present:true})) });
  document.getElementById("plate").value="";
  document.getElementById("amount").value="";
  save(); render();
}

// ---------------- TABLE ----------------
function renderTable() {
  const table = document.getElementById("workTable");
  const totals = calculateDailyTotals();
  const { max, min, avg } = getEarningRanges(totals);

  let html = `<tr><th>Truck</th>${workers.map(w => `<th>${w}</th>`).join("")}</tr>`;

  trucks.forEach((t, ti) => {
    html += `<tr><td>${t.plate}<br>Ksh ${t.amount}</td>`;
    t.attendance.forEach((a, wi) => {
      const worker = workers[wi];
      let highlightClass = "";
      if (!a.present) highlightClass = "zero-attendance";
      else if (totals[worker] === max) highlightClass = "top-earner";
      else if (totals[worker] >= avg) highlightClass = "mid-earner";
      else highlightClass = "low-earner";

      html += `
        <td class="${highlightClass}">
          <input type="checkbox" ${a.present ? "checked" : ""} onchange="toggle(${ti},${wi})">
        </td>`;
    });
    html += "</tr>";
  });

  // Add average row
  html += `<tr><td><strong>Average</strong></td>`;
  workers.forEach(w => html += `<td><strong>Ksh ${totals[w].toFixed(2)}</strong></td>`);
  html += "</tr>";

  table.innerHTML = html;
}


// ---------------- TOGGLE ----------------
function toggle(ti,wi){ trucks[ti].attendance[wi].present=!trucks[ti].attendance[wi].present; save(); render(); }

// ---------------- TOTALS ----------------
function calculateDailyTotals(){
  const totals = Object.fromEntries(workers.map(w=>[w,0]));
  trucks.forEach(t=>{
    let attendance = t.attendance.map((a,i)=>({present:a.present,worker:workers[i]}));
    if(currentFilters.worker) attendance = attendance.filter(a=>a.worker===currentFilters.worker);
    const present = attendance.filter(a=>a.present);
    if(!present.length) return;
    const share = t.amount / present.length;
    present.forEach(a=>totals[a.worker]+=share);
  });
  return totals;
}

function calculateCumulativeTotals(){
  const totals = Object.fromEntries(workers.map(w=>[w,0]));
  paymentHistory.forEach(cycle=>{
    cycle.totals.forEach(([name,amount])=>{
      if(currentFilters.worker && name!==currentFilters.worker) return;
      totals[name]+=amount;
    });
  });
  return totals;
}

function renderTotals(){
  const totals=calculateDailyTotals();
  document.getElementById("totalsOutput").innerHTML=Object.entries(totals).map(([w,v])=>`<p>${w}: <strong>Ksh ${v.toFixed(2)}</strong></p>`).join("");
  renderCharts();
}

// ---------------- CHARTS ----------------
function renderCharts(){
  renderDailyChart(); renderCumulativeChart();
}

function renderDailyChart() {
  const totals = calculateDailyTotals();
  const { max, min, avg } = getEarningRanges(totals);
  const ctx = document.getElementById("dailyChart").getContext("2d");

  if (dailyChart) dailyChart.destroy();

  // Determine bar colors
  const colors = Object.values(totals).map(val => {
    if (val === max) return '#4CAF50';          // top
    else if (val >= avg) return '#FFEB3B';     // mid
    else return '#F44336';                      // low
  });

  dailyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(totals),
      datasets: [{
        label: 'Daily Earnings',
        data: Object.values(totals),
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}


function renderCumulativeChart() {
  const totals = calculateCumulativeTotals();
  const { max, min, avg } = getEarningRanges(totals);
  const ctx = document.getElementById("cumulativeChart").getContext("2d");

  if (cumulativeChart) cumulativeChart.destroy();

  const colors = Object.values(totals).map(val => {
    if (val === max) return '#4CAF50';
    else if (val >= avg) return '#FFEB3B';
    else return '#F44336';
  });

  cumulativeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(totals),
      datasets: [{
        label: 'Cumulative Earnings',
        data: Object.values(totals),
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}


// ---------------- PAYMENT HISTORY ----------------
function closePayCycle(){
  if(!trucks.length){ alert("No data to close"); return; }
  const dailyTotals=calculateDailyTotals();
  paymentHistory.push({date:new Date().toLocaleDateString(),totals:Object.entries(dailyTotals)});
  save();
  trucks=[];
  render();
}

function renderHistory(){
  const el=document.getElementById("paymentHistoryContainer");
  let filteredHistory = paymentHistory;
  if(currentFilters.from||currentFilters.to){
    filteredHistory = filteredHistory.filter(c=>{
      const d=new Date(c.date);
      if(currentFilters.from && d<new Date(currentFilters.from)) return false;
      if(currentFilters.to && d>new Date(currentFilters.to)) return false;
      return true;
    });
  }
  if(!filteredHistory.length){ el.innerHTML="<p>No payment history yet.</p>"; return; }
  el.innerHTML=filteredHistory.slice().reverse().map(c=>`<div class="history-card"><strong>${c.date}</strong>${c.totals.map(t=>`<p>${t[0]}: Ksh ${t[1].toFixed(2)}</p>`).join("")}</div>`).join("");
}

function toggleHistory(){ const el=document.getElementById("paymentHistoryContainer"); el.style.display=el.style.display==="none"?"block":"none"; }

// ---------------- PAYSLIP ----------------
function populateWorkerSelect(){
  const select=document.getElementById("workerSelect");
  select.innerHTML = workers.map(w=>`<option value="${w}">${w}</option>`).join("");
}

function generatePayslip(){
  const worker=document.getElementById("workerSelect").value;
  const from=document.getElementById("fromDate").value;
  const to=document.getElementById("toDate").value;
  const output=document.getElementById("payslipOutput"); output.innerHTML="";
  if(!worker) return;
  let total=0, rows=[];
  paymentHistory.forEach(cycle=>{
    const d=new Date(cycle.date);
    if((from && d<new Date(from))||(to && d>new Date(to))) return;
    cycle.totals.forEach(([name,amount])=>{ if(name===worker){ total+=amount; rows.push(`<tr><td>${cycle.date}</td><td>Ksh ${amount.toFixed(2)}</td></tr>`); }});
  });
  if(!rows.length){ output.innerHTML="<p>No records found.</p>"; return; }
  output.innerHTML=`<h3>Payslip: ${worker}</h3><table><tr><th>Date</th><th>Amount</th></tr>${rows.join("")}<tr><th>Total</th><th>Ksh ${total.toFixed(2)}</th></tr></table>`;
}

function exportPayslipCSV(){
  const worker=document.getElementById("workerSelect").value; if(!worker) return;
  let csv="Date,Worker,Amount\n";
  paymentHistory.forEach(cycle=>{ cycle.totals.forEach(([name,amount])=>{ if(name===worker) csv+=`${cycle.date},${name},${amount.toFixed(2)}\n`; }); });
  const blob=new Blob([csv],{type:"text/csv"}); const link=document.createElement("a");
  link.href=URL.createObjectURL(blob); link.download=`${worker}_payslip.csv`; link.click();
}

function downloadPayslipPDF(){
  const {jsPDF}=window.jspdf; const doc=new jsPDF();
  const worker=document.getElementById("workerSelect").value; if(!worker) return alert("Select a worker first");
  let y=20,total=0;
  doc.setFontSize(16); doc.text("KIMOJA – ELITE GROUP",20,y); y+=10;
  doc.setFontSize(12); doc.text(`Payslip for: ${worker}`,20,y); y+=10;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`,20,y); y+=10; doc.line(20,y,190,y); y+=10;
  doc.text("Date",20,y); doc.text("Amount (Ksh)",120,y); y+=8;
  paymentHistory.forEach(cycle=>{ cycle.totals.forEach(([name,amount])=>{ if(name===worker){ doc.text(cycle.date,20,y); doc.text(amount.toFixed(2),120,y); total+=amount; y+=8; }}); });
  y+=10; doc.line(20,y,190,y); y+=10; doc.setFontSize(14); doc.text(`TOTAL: Ksh ${total.toFixed(2)}`,20,y);
  doc.save(`${worker}_Payslip.pdf`);
}

// ---------------- MONEY WISDOM ----------------
function showRandomTip(){
  const tips=["Save a portion of earnings daily","Track expenses regularly","Avoid high-interest debt","Invest in knowledge","Keep emergency fund ready"];
  const tip=tips[Math.floor(Math.random()*tips.length)];
  document.getElementById("financeTip").innerText=tip;
}

// ---------------- SAVE & RENDER ----------------
function save(){ localStorage.setItem("trucks",JSON.stringify(trucks)); localStorage.setItem("history",JSON.stringify(paymentHistory)); }
function render(){ renderTable(); renderTotals(); renderHistory(); populateWorkerSelect(); populateFilterWorker(); showRandomTip(); }
render();
function getEarningRanges(totals) {
  const values = Object.values(totals);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a,b)=>a+b,0)/values.length;
  return { max, min, avg };
}
