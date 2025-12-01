document.getElementById("calc-form").addEventListener("submit", function (e) {
    e.preventDefault();
    runSimulation();
});


// Create UI dynamically inside #app
const app = document.getElementById("app");

// Build HTML
app.innerHTML = `
<div>
  <label>Starting Balance ($): </label><input type="number" id="startBalance" value="1000000"><br>
  <label>Annual Withdrawal ($): </label><input type="number" id="withdrawal" value="40000"><br>
  <label>Expected Annual Return (%): </label><input type="number" id="expReturn" value="6"><br>
  <label>Volatility (%): </label><input type="number" id="volatility" value="12"><br>
  <label>Years in Retirement: </label><input type="number" id="years" value="30"><br>
  <label>Scenarios: </label><input type="number" id="scenarios" value="5000"><br>
  <button id="runSim">Run Simulations</button>
</div>
<div id="results" style="margin-top:20px;"></div>
<canvas id="histChart" width="800" height="400" style="margin-top:20px;"></canvas>
`;

// Helper function to generate normally distributed random numbers
function randNormal(mean = 0, stddev = 1) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stddev + mean;
}

// Monte Carlo simulation
function runSimulation() {
    const start = parseFloat(document.getElementById('startBalance').value);
    const wd = parseFloat(document.getElementById('withdrawal').value);
    const exp = parseFloat(document.getElementById('expReturn').value)/100;
    const vol = parseFloat(document.getElementById('volatility').value)/100;
    const yrs = parseInt(document.getElementById('years').value);
    const sims = parseInt(document.getElementById('scenarios').value);

    let ruins = 0;
    let terminals = [];

    for(let s=0; s<sims; s++) {
        let balance = start;
        for(let y=0; y<yrs; y++) {
            balance -= wd;
            if(balance <= 0) {
                balance = 0;
                ruins++;
                break;
            }
            const yearlyReturn = randNormal(exp, vol);
            balance *= (1 + yearlyReturn);
        }
        terminals.push(balance);
    }

    // sort terminals
    terminals.sort((a,b)=>a-b);
    const p10 = terminals[Math.floor(0.1 * sims)];
    const p25 = terminals[Math.floor(0.25 * sims)];
    const p50 = terminals[Math.floor(0.5 * sims)];
    const p75 = terminals[Math.floor(0.75 * sims)];
    const p90 = terminals[Math.floor(0.9 * sims)];

    // display results
    document.getElementById('results').innerHTML = `
        <h3>Results</h3>
        <p><b>Probability of Ruin:</b> ${(ruins/sims*100).toFixed(2)}%</p>
        <p><b>10th percentile Terminal Balance:</b> $${p10.toLocaleString()}</p>
        <p><b>25th percentile Terminal Balance:</b> $${p25.toLocaleString()}</p>
        <p><b>Median (50th percentile) Terminal Balance:</b> $${p50.toLocaleString()}</p>
        <p><b>75th percentile Terminal Balance:</b> $${p75.toLocaleString()}</p>
        <p><b>90th percentile Terminal Balance:</b> $${p90.toLocaleString()}</p>
    `;

    // histogram data
    const bins = 20;
    const min = 0;
    const max = Math.max(...terminals);
    const binWidth = (max - min)/bins;
    const binCounts = Array(bins).fill(0);

    terminals.forEach(t => {
        let idx = Math.floor(t/binWidth);
        if(idx >= bins) idx = bins-1;
        binCounts[idx]++;
    });

    const labels = Array.from({length:bins}, (_,i) => `$${Math.round(min + i*binWidth).toLocaleString()} - $${Math.round(min + (i+1)*binWidth).toLocaleString()}`);

    // render chart
    const ctx = document.getElementById('histChart').getContext('2d');
    if(window.histChartInstance) window.hi
