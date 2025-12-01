document.getElementById("calc-form").addEventListener("submit", function (e) {
    e.preventDefault();
    runSimulation();
});

// Generate normal distribution random number
function randNormal(mean = 0, stddev = 1) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + stddev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

let distributionChart = null;

function runSimulation() {

    const start = parseFloat(document.getElementById('startingBalance').value);
    const wd = parseFloat(document.getElementById('withdrawalAmount').value);
    const exp = parseFloat(document.getElementById('expectedReturn').value) / 100;
    const vol = parseFloat(document.getElementById('volatility').value) / 100;
    const yrs = parseInt(document.getElementById('years').value);
    const sims = parseInt(document.getElementById('scenarios').value);

    let ruins = 0;
    let terminals = [];

    // Run Monte Carlo
    for (let s = 0; s < sims; s++) {
        let balance = start;

        for (let y = 0; y < yrs; y++) {
            balance -= wd;

            if (balance <= 0) {
                ruins++;
                balance = 0;
                break;
            }

            const yearlyReturn = randNormal(exp, vol);
            balance *= (1 + yearlyReturn);
        }

        terminals.push(balance);
    }

    terminals.sort((a, b) => a - b);

    const p10 = terminals[Math.floor(0.10 * sims)];
    const p25 = terminals[Math.floor(0.25 * sims)];
    const p50 = terminals[Math.floor(0.50 * sims)];
    const p75 = terminals[Math.floor(0.75 * sims)];
    const p90 = terminals[Math.floor(0.90 * sims)];

    document.getElementById("probability").innerHTML = `
        <b>Probability of Ruin:</b> ${(ruins / sims * 100).toFixed(2)}%<br>
        <b>10th percentile Terminal Balance:</b> $${p10.toLocaleString()}<br>
        <b>25th percentile Terminal Balance:</b> $${p25.toLocaleString()}<br>
        <b>Median:</b> $${p50.toLocaleString()}<br>
        <b>75th percentile Terminal Balance:</b> $${p75.toLocaleString()}<br>
        <b>90th percentile Terminal Balance:</b> $${p90.toLocaleString()}
    `;

    // Build histogram
    const bins = 20;
    const max = Math.max(...terminals);
    const min = 0;
    const binWidth = (max - min) / bins;

    const binCounts = Array(bins).fill(0);

    terminals.forEach(val => {
        let idx = Math.floor(val / binWidth);
        if (idx >= bins) idx = bins - 1;
        binCounts[idx]++;
    });

    const labels = Array.from({ length: bins }, (_, i) =>
        `$${Math.round(i * binWidth).toLocaleString()} – $${Math.round((i + 1) * binWidth).toLocaleString()}`
    );

    const ctx = document.getElementById("distributionChart").getContext("2d");

    if (distributionChart) {
        distributionChart.destroy();
    }

    distributionChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Frequency",
                data: binCounts
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
