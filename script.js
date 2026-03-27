// ✅ If login page → stop dashboard logic
if (window.location.pathname.includes("login.html")) {
  console.log("Login page detected");
}
let editId = null;
let monthlyChart;
// DOM Elements
const backupBtn = document.getElementById("backupBtn");
const restoreBtn = document.getElementById("restoreBtn");
const restoreFile = document.getElementById("restoreFile");
const titleInput = document.getElementById("title");
const categorySelect = document.getElementById("Category");
const budgetInput = document.getElementById("budgetInput");
const setBudgetBtn = document.getElementById("setBudget");
const budgetStatus = document.getElementById("budgetStatus");
const themeToggle = document.getElementById("themeToggle");
const exportButton = document.getElementById("exportCSV");
const sortExpenses = document.getElementById("sortExpenses");
const searchInput = document.getElementById("searchExpense");
const filterCategory = document.getElementById("filterCategory");
const expenseForm = document.getElementById("expenseForm");
const expenseTable = document.getElementById("expenseTable");
const totalExpenseText = document.querySelector("section p");

titleInput.addEventListener("input", () => {
  const suggestion = suggestCategory(titleInput.value);

  categorySelect.value = suggestion;
});
setBudgetBtn.addEventListener("click", () => {
  const budget = Number(budgetInput.value);

  if (!budget) {
    showToast("⚠ Enter a valid budget");
    return;
  }

  localStorage.setItem("monthlyBudget", budget);

  updateBudgetStatus();
});
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const isDark = document.body.classList.contains("dark-mode");

  // Save theme in LocalStorage
  localStorage.setItem("theme", isDark ? "dark" : "light");

  themeToggle.textContent = isDark ? "☀ Light Mode" : "🌙 Dark Mode";
});
// State
let expenses = [];

async function fetchExpenses() {
  try {
    const res = await fetch("http://localhost:8081/api/expenses", {
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      }
    });

    if (!res.ok) throw new Error("Unauthorized");

    expenses = await res.json();

    renderExpenses();
    updateSummary();
    updateWeeklyStats();
    updateStatistics();
    renderChart();
    renderTrendChart();
    renderMonthlyChart();
    generateAIInsight();
    updateBudgetStatus();
    predictMonthlyExpense();

  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {

   if (window.location.pathname.includes("index.html")) {
    fetchExpenses();
  }

  // Load saved theme
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀ Light Mode";
  }
});
/// add expense
expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const expense = {
    title: titleInput.value,
    amount: Number(document.getElementById("amount").value),
    category: categorySelect.value,
    date: document.getElementById("date").value,
  };

  const token = localStorage.getItem("token");

  console.log("Sending:", expense);

  if (editId) {
    await fetch(`http://localhost:8081/api/expenses/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(expense),
    });

    showToast("✏ Expense Updated");
    editId = null;

  } else {
    await fetch("http://localhost:8081/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(expense),
    });

    showToast("✅ Expense Added");
  }

  await fetchExpenses();
  expenseForm.reset();
});

// Render Expenses
function renderExpenses() {
  expenseTable.innerHTML = "";

  // Get search and filter values
  const searchText = searchInput.value.toLowerCase();
  const selectedCategory = filterCategory.value;

  // Apply filter logic
  const filteredExpenses = expenses.filter((exp) => {
    const matchTitle = (exp.title || "").toLowerCase().includes(searchText);

   const matchCategory =
  selectedCategory === "All" ||
  (exp.category || "").toLowerCase() === selectedCategory.toLowerCase();

    return matchTitle && matchCategory;
  });

  if (sortExpenses.value === "amountHigh") {
    filteredExpenses.sort((a, b) => b.amount - a.amount);
  }

  if (sortExpenses.value === "amountLow") {
    filteredExpenses.sort((a, b) => a.amount - b.amount);
  }

  if (sortExpenses.value === "dateNew") {
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  if (sortExpenses.value === "dateOld") {
    filteredExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // Show message if no expenses exist
  if (filteredExpenses.length === 0) {
    expenseTable.innerHTML = `
      <tr>
        <td colspan="6">No expenses found</td>
      </tr>
    `;
    return;
  }

  // Render filtered expenses
  filteredExpenses.forEach((expense) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${expense.id.toString().slice(-4)}</td>
      <td>${expense.title}</td>
      <td>${formatCurrency(expense.amount)}</td>
      <td>${expense.category}</td>
      <td>${expense.date}</td>
      <td>
        <button onclick="editExpense(${expense.id})">Edit</button>
        <button onclick="deleteExpense(${expense.id})">Delete</button>
      </td>
    `;

    expenseTable.appendChild(row);
  });
}
function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
}

// Delete Expense
async function deleteExpense(id) {
  const confirmDelete = confirm("Delete this expense?");
  if (!confirmDelete) return;

  await fetch(`http://localhost:8081/api/expenses/${id}`, {
    method: "DELETE",
  });

  await fetchExpenses();
  showToast("❌ Expense Deleted");
}

// Edit Expense
function editExpense(id) {
  const expense = expenses.find((exp) => exp.id === id);

  document.getElementById("title").value = expense.title;
  document.getElementById("amount").value = expense.amount;
  document.getElementById("category").value = expense.category;
  document.getElementById("date").value = expense.date;
  editId = id;
}

// Update Summary
function updateSummary() {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  document.getElementById("totalExpense").textContent = formatCurrency(total);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTotal = expenses
    .filter((exp) => {
      const date = new Date(exp.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  document.getElementById("monthlyExpense").textContent =
    formatCurrency(monthlyTotal);

  document.getElementById("transactionCount").textContent = expenses.length;
}
function updateWeeklyStats() {
  const now = new Date();

  const last7Days = expenses.filter(exp => {
    const date = new Date(exp.date);
    const diff = (now - date) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  const total = last7Days.reduce((sum, exp) => sum + exp.amount, 0);

  document.getElementById("weeklyExpense").textContent =
    "Weekly: ₹" + total;

  // Trend (last 7 days vs previous 7 days)
  const prev7Days = expenses.filter(exp => {
    const date = new Date(exp.date);
    const diff = (now - date) / (1000 * 60 * 60 * 24);
    return diff > 7 && diff <= 14;
  });

  const prevTotal = prev7Days.reduce((sum, exp) => sum + exp.amount, 0);

  const trend = total - prevTotal;

  document.getElementById("trend").textContent =
    trend > 0 ? "📈 Increasing" : "📉 Decreasing";
}
let chart;

function renderChart() {
  const categories = {};

  expenses.forEach((exp) => {
    if (categories[exp.category]) {
      categories[exp.category] += exp.amount;
    } else {
      categories[exp.category] = exp.amount;
    }
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);

  const ctx = document.getElementById("expenseChart").getContext("2d");

  if (chart) {
    chart.destroy();
  }

 chart = new Chart(ctx, {
  type: "pie",
  data: {
    labels: labels,
    datasets: [
      {
        label: "Expenses by Category",
        data: data,
        backgroundColor: [
          "#667eea",
          "#764ba2",
          "#ff6384",
          "#36a2eb",
          "#ffcd56",
        ],
        borderWidth: 1,
      },
    ],
  },
  options: {
    responsive: true,              // ✅ makes it fit all screens
    maintainAspectRatio: false,    // ✅ prevents overflow
    plugins: {
      legend: {
        position: "bottom",        // ✅ better layout
        labels: {
          color: "#ffffff",        // for dark mode
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.label + ": ₹" + context.raw;
          }
        }
      }
    }
  }
});
}
let trendChart;
function renderTrendChart() {
  const dataByDate = {};

  expenses.forEach((exp) => {
    dataByDate[exp.date] =
      (dataByDate[exp.date] || 0) + exp.amount;
  });

  // ✅ SORT BY DATE (IMPORTANT)
  const sortedDates = Object.keys(dataByDate).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  const labels = sortedDates;
  const data = sortedDates.map(date => dataByDate[date]);

  const ctx = document.getElementById("trendChart").getContext("2d");

  if (trendChart) {
    trendChart.destroy();
  }

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Daily Spending",
          data: data,
          borderColor: "#36a2eb",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function updateStatistics() {
  if (expenses.length === 0) {
    document.getElementById("highestExpense").textContent =
      "Highest Expense: ₹0";
    document.getElementById("lowestExpense").textContent = "Lowest Expense: ₹0";
    document.getElementById("averageExpense").textContent =
      "Average Expense: ₹0";
    document.getElementById("totalTransactions").textContent =
      "Total Transactions: 0";
    return;
  }

  const amounts = expenses.map((exp) => exp.amount);

  const highest = Math.max(...amounts);
  const lowest = Math.min(...amounts);
  const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;

  document.getElementById("highestExpense").textContent =
    `Highest Expense: ₹${highest}`;

  document.getElementById("lowestExpense").textContent =
    `Lowest Expense: ₹${lowest}`;

  document.getElementById("averageExpense").textContent =
    `Average Expense: ₹${average.toFixed(2)}`;

  document.getElementById("totalTransactions").textContent =
    `Total Transactions: ${expenses.length}`;
}
function renderMonthlyChart() {
  const monthlyData = {};

  expenses.forEach((exp) => {
    const date = new Date(exp.date);
    const month = date.toLocaleString("default", { month: "short" });

    monthlyData[month] = (monthlyData[month] || 0) + exp.amount;
  });

  const labels = Object.keys(monthlyData);
  const data = Object.values(monthlyData);

  const ctx = document.getElementById("monthlyChart").getContext("2d");

  if (monthlyChart) {
    monthlyChart.destroy();
  }

  monthlyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Monthly Spending",
          data: data,
          backgroundColor: "#667eea",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function generateAIInsight() {
  const aiBox = document.getElementById("aiInsight");

  if (expenses.length === 0) {
    aiBox.innerHTML = "<p>No data available</p>";
    return;
  }

  let insight = "";

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] =
      (categoryTotals[exp.category] || 0) + exp.amount;
  });

  let maxCat = "";
  let maxVal = 0;

  for (let cat in categoryTotals) {
    if (categoryTotals[cat] > maxVal) {
      maxVal = categoryTotals[cat];
      maxCat = cat;
    }
  }

  const percent = ((maxVal / total) * 100).toFixed(1);

  insight += `💡 You spend ${percent}% on ${maxCat}.<br>`;

  // Weekend vs weekday
  let weekend = 0, weekday = 0;

  expenses.forEach(exp => {
    const day = new Date(exp.date).getDay();
    if (day === 0 || day === 6) weekend += exp.amount;
    else weekday += exp.amount;
  });

  if (weekend > weekday) {
    insight += "📊 You spend more on weekends.<br>";
  }

  aiBox.innerHTML = insight;
}
function exportToCSV() {
  if (expenses.length === 0) {
    alert("No expenses to export");
    return;
  }

  let csvContent = "ID,Title,Amount,Category,Date\n";

  expenses.forEach((exp) => {
    csvContent += `${exp.id},${exp.title},${exp.amount},${exp.category},${exp.date}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = "expense_report.csv";

  a.click();

  URL.revokeObjectURL(url);
}

function updateBudgetStatus() {
  const budget = Number(localStorage.getItem("monthlyBudget"));

  if (!budget) {
    budgetStatus.textContent = "Budget not set";
    return;
  }

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (total > budget) {
    budgetStatus.textContent = `⚠ Budget exceeded! Spent ₹${total} / Budget ₹${budget}`;

    showToast("🚨 Budget exceeded!");
  } else if (total > budget * 0.8) {
    budgetStatus.textContent = `⚠ Warning: Near budget limit. ₹${total} / ₹${budget}`;
  } else {
    budgetStatus.textContent = `Budget OK: ₹${total} / ₹${budget}`;
  }
}
function showToast(message) {
  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");

  toast.classList.add("toast");

  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
function suggestCategory(title) {
  const text = title.toLowerCase();

  if (
    text.includes("pizza") ||
    text.includes("food") ||
    text.includes("restaurant") ||
    text.includes("vegetable")
  ) {
    return "Food";
  }

  if (
    text.includes("bus") ||
    text.includes("uber") ||
    text.includes("taxi") ||
    text.includes("train")
  ) {
    return "Transport";
  }

  if (
    text.includes("movie") ||
    text.includes("netflix") ||
    text.includes("game")
  ) {
    return "Entertainment";
  }

  if (
    text.includes("shirt") ||
    text.includes("amazon") ||
    text.includes("shopping")
  ) {
    return "Shopping";
  }

  return "Others";
}
function predictMonthlyExpense() {
  const predictionText = document.getElementById("predictionText");

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyExpenses = expenses.filter((exp) => {
    const date = new Date(exp.date);

    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  });

  if (monthlyExpenses.length === 0) {
    predictionText.textContent = "Not enough data for prediction";
    return;
  }

  const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const today = new Date().getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const dailyAverage = totalSpent / today;

  const predictedTotal = Math.round(dailyAverage * daysInMonth);

  predictionText.textContent = `Based on your current spending, you may spend ₹${predictedTotal} this month.`;
}
function backupData() {
  const data = JSON.stringify(expenses);

  const blob = new Blob([data], { type: "application/json" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = "expense_backup.json";

  a.click();

  URL.revokeObjectURL(url);
}
function restoreData() {
  const file = restoreFile.files[0];

  if (!file) {
    showToast("⚠ Select a backup file first");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function (e) {
    const data = JSON.parse(e.target.result);

    for (let exp of data) {
    await fetch("http://localhost:8081/api/expenses", {
    method: "GET",
    headers: {
        "Authorization": "Bearer " + localStorage.getItem("token"),
        "Content-Type": "application/json"
    }
})
    }

    await fetchExpenses();
    showToast("✅ Data restored successfully");
  };

  reader.readAsText(file);
}
backupBtn.addEventListener("click", backupData);
restoreBtn.addEventListener("click", restoreData);
searchInput.addEventListener("input", renderExpenses);
filterCategory.addEventListener("change", renderExpenses);
sortExpenses.addEventListener("change", renderExpenses);
exportButton.addEventListener("click", exportToCSV);
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }
  });
});

document.querySelectorAll("section, .card, .chart-card").forEach(el => {
  el.classList.add("hidden");
  observer.observe(el);
});
async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const loader = document.getElementById("loader");

    loader.style.display = "block";
    loader.innerText = "Logging in...";

    try {
        const res = await fetch("http://localhost:8081/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        console.log("STATUS:", res.status); // 🔍 DEBUG

        if (!res.ok) {
            loader.innerText = "Login Failed ❌";
            return; // 🔥 HARD STOP
        }

        const token = await res.text();

        localStorage.setItem("token", token);

        loader.innerText = "Success ✅";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 800);

    } catch (error) {
        loader.innerText = "Server Error ❌";
        console.error(error);
    }
}
function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}
fetch("http://localhost:8081/api/expenses", {
    headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
    }
})
