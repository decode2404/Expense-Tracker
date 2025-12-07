# Expense-Tracker
# 💰 Expense Tracker Application

## 📌 Project Overview
The **Expense Tracker Application** is a web-based financial management tool designed to help users efficiently track their income and expenses. It performs real-time financial calculations, categorizes transactions, and stores data locally in the browser, simulating real-world business logic without requiring a backend.

---

## 🎯 Key Features
- Add income and expense transactions  
- Record transaction details including:
  - Amount  
  - Category  
  - Date  
  - Description  
- Automatic calculation of:
  - Total income  
  - Total expenses  
  - Current balance  
- Category-wise transaction display  
- Monthly expense summary  
- Delete individual transactions  
- Persistent data storage using **LocalStorage**  
- Responsive and professional UI design  

---

## 🧠 How It Works
- Users enter transaction details using a form  
- Each transaction is stored as an **object inside an array**  
- JavaScript dynamically updates:
  - The transaction list  
  - Balance calculations (income, expense, balance)  
- All data is saved using **LocalStorage**, ensuring persistence across page reloads  
- Deleting a transaction instantly updates the UI and calculations  

---

## 🛠️ Technologies Used
- **HTML5** – Form structure and layout  
- **CSS3** – Styling, layout, and responsive design  
- **JavaScript (ES6+)** – Business logic, calculations, and UI updates  
- **LocalStorage** – Client-side data persistence  

---

## 🚀 JavaScript Concepts Demonstrated
- Arrays and objects  
- Array methods:
  - `map()`
  - `filter()`
  - `reduce()`
- DOM manipulation  
- Event listeners  
- Form validation  
- LocalStorage CRUD operations  
- Dynamic UI rendering  

---

## ✅ Why This Project Stands Out
The Expense Tracker simulates real-world financial workflows and demonstrates how JavaScript can be used to manage application state, perform calculations, and persist user data entirely on the client side without a backend.

---

## 📂 Project Structure
```txt
expense-tracker/
│── index.html
│── style.css
│── script.js

User authentication with backend integration
