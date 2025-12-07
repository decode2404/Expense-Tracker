const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const dateInput = document.getElementById('date');
const filterCategory = document.getElementById('filter-category');
const resetBtn = document.getElementById('reset-btn');
const simpleChart = document.getElementById('simple-chart');
const currentMonthDisplay = document.getElementById('current-month-display');

const monthFilter = document.getElementById('month-filter');

// Set default date to today and default month to current month
const today = new Date();
dateInput.valueAsDate = today;
monthFilter.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

const localStorageKey = 'expense_transactions';

let transactions = localStorage.getItem(localStorageKey) !== null ? JSON.parse(localStorage.getItem(localStorageKey)) : [];

// Add transaction
function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a description and amount');
        return;
    }

    const transaction = {
        id: generateID(),
        text: text.value,
        amount: +amount.value,
        category: category.value,
        date: dateInput.value
    };

    transactions.push(transaction);

    addTransactionDOM(transaction);
    updateValues();
    updateLocalStorage();
    
    text.value = '';
    amount.value = '';
    // Reset date to today after adding? kept simple for now
}

// Generate random ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
    // Get sign
    const sign = transaction.amount < 0 ? '-' : '+';
    const itemClass = transaction.amount < 0 ? 'minus' : 'plus';

    const item = document.createElement('li');
    item.classList.add(itemClass);
    item.dataset.category = transaction.category; // For filtering

    // Format Amount
    const absAmount = Math.abs(transaction.amount).toFixed(2);
    
    // Format Date
    const dateObj = new Date(transaction.date);
    const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    item.innerHTML = `
        <div class="transaction-info">
            <strong>${transaction.text}</strong>
            <span class="date-text">${dateStr} <span class="category-badge">${transaction.category}</span></span>
        </div>
        <span>${sign}₹${absAmount}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
    `;

    list.appendChild(item);
}


// Update the balance, income and expense (Based on Month Filter)
function updateValues() {
    const selectedMonth = monthFilter.value; // YYYY-MM
    
    // Total Balance (All Time)
    const totalBalance = transactions.reduce((acc, item) => (acc += item.amount), 0).toFixed(2);

    // Filter transactions for specific month
    const monthlyTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
    const monthlyAmounts = monthlyTransactions.map(t => t.amount);

    const income = monthlyAmounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);

    const expense = (
        monthlyAmounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1
    ).toFixed(2);

    balance.innerText = `₹${totalBalance}`;
    money_plus.innerText = `+₹${income}`;
    money_minus.innerText = `-₹${expense}`;

    // Update List to show only monthly transactions (unless further filtered by category)
    renderList(monthlyTransactions);

    updateChart(income, expense);
}

// Render list of transactions
function renderList(itemsToRender) {
    list.innerHTML = '';
    // Apply Category Filter on top of Month Filter if needed
    const selectedCategory = filterCategory.value;
    
    let finalItems = itemsToRender;

    if (selectedCategory !== 'All') {
        finalItems = finalItems.filter(item => {
             if (selectedCategory === 'Income') return item.amount > 0;
             return item.category === selectedCategory;
        });
    }

    if (finalItems.length === 0) {
        list.innerHTML = '<li class="no-data">No transactions for this month/filter</li>';
    } else {
        finalItems.forEach(addTransactionDOM);
    }
}


// Remove transaction by ID
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    updateValues();
}

// Update local storage transactions
function updateLocalStorage() {
    localStorage.setItem(localStorageKey, JSON.stringify(transactions));
}

// Filter Transactions (Triggered by Category Change)
function filterTransactions() {
    updateValues(); // This re-triggers renderList with current month & category
}


// Reset All Data
function resetData() {
    if(confirm('Are you sure you want to clear all data?')) {
        transactions = [];
        updateLocalStorage();
        init();
    }
}

// Simple Chart Implementation (Pure JS/CSS)
function updateChart(income, expense) {
    // Determine max value for 100% height
    const maxVal = Math.max(parseFloat(income), parseFloat(expense)) || 1; // avoid divide by zero

    const incomeHeight = (parseFloat(income) / maxVal) * 100;
    const expenseHeight = (parseFloat(expense) / maxVal) * 100;

    // Clear chart
    simpleChart.innerHTML = '';
    
    if (transactions.length === 0) {
        simpleChart.innerHTML = '<div class="empty-chart-msg">Add expenses to see chart</div>';
        return;
    }

    // Create Income Bar
    const incBar = document.createElement('div');
    incBar.classList.add('chart-bar', 'income-bar');
    incBar.style.height = `${incomeHeight}%`;
    incBar.innerHTML = `<span class="bar-value">₹${income}</span><span class="bar-label">Income</span>`;
    
    // Create Expense Bar
    const expBar = document.createElement('div');
    expBar.classList.add('chart-bar', 'expense-bar');
    expBar.style.height = `${expenseHeight}%`;
    expBar.innerHTML = `<span class="bar-value">₹${expense}</span><span class="bar-label">Expense</span>`;

    simpleChart.appendChild(incBar);
    simpleChart.appendChild(expBar);
}

// Init app
function init() {
    updateValues();
}

init();

form.addEventListener('submit', addTransaction);
filterCategory.addEventListener('change', filterTransactions);
monthFilter.addEventListener('change', updateValues);
resetBtn.addEventListener('click', resetData);
