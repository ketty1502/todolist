// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDrNw2oNzXPf1RSnn-ZqERaPbNfbgJU8Gs",
    authDomain: "todo-57c88.firebaseapp.com",
    databaseURL: "https://todo-57c88-default-rtdb.firebaseio.com",
    projectId: "todo-57c88",
    storageBucket: "todo-57c88.firebasestorage.app",
    messagingSenderId: "913583139529",
    appId: "1:913583139529:web:9ceec9653fed4bb797bb18"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  
  let currentUser = null;
  let currentDate = new Date().toISOString().split("T")[0];
  document.getElementById("date-picker").value = currentDate;
  
  function signup() {
    const username = getUsername();
    const password = getPassword();
    if (!username || !password) return alert("Fill both fields!");
    db.ref("users/" + username).once("value", (snapshot) => {
      if (snapshot.exists()) return alert("Username already exists.");
      db.ref("users/" + username).set({ password });
      localStorage.setItem("user", username);
      currentUser = username;
      showSetupScreen();
    });
  }
  
  function login() {
    const username = getUsername();
    const password = getPassword();
    if (!username || !password) return alert("Fill both fields!");
    db.ref("users/" + username).once("value", (snapshot) => {
      if (!snapshot.exists()) return alert("User not found.");
      if (snapshot.val().password !== password) return alert("Wrong password.");
      currentUser = username;
      localStorage.setItem("user", username);
      db.ref(`daily/${currentUser}`).once("value", (snap) => {
        if (snap.exists()) {
          showDashboard();
        } else {
          showSetupScreen();
        }
      });
    });
  }
  
  function getUsername() {
    return document.getElementById("username").value.trim();
  }
  
  function getPassword() {
    return document.getElementById("password").value;
  }
  
  function showSetupScreen() {
    document.getElementById("auth-container").classList.add("hidden");
    document.getElementById("setup-container").classList.remove("hidden");
    document.getElementById("todo-container").classList.add("hidden");
  }
  
  function showDashboard() {
    document.getElementById("auth-container").classList.add("hidden");
    document.getElementById("setup-container").classList.add("hidden");
    document.getElementById("todo-container").classList.remove("hidden");
    document.getElementById("welcome").innerText = "Welcome, " + currentUser;
    loadTasks();
  }
  
  function editDailyTasks() {
    document.getElementById("todo-container").classList.add("hidden");
    document.getElementById("setup-container").classList.remove("hidden");
  
    db.ref(`daily/${currentUser}`).once("value", (snap) => {
      const list = document.getElementById("daily-task-list");
      list.innerHTML = "";
      snap.val()?.forEach((task) => {
        const div = document.createElement("div");
        div.className = "task-item";
        div.innerHTML = `
          <input type="checkbox" checked>
          <span>${task}</span>
        `;
        list.appendChild(div);
      });
    });
  }
  
  function addDailyTask() {
    const input = document.getElementById("daily-task-input");
    const text = input.value.trim();
    if (!text) return;
    const div = document.createElement("div");
    div.className = "task-item";
    div.innerHTML = `<input type="checkbox" checked><span>${text}</span>`;
    document.getElementById("daily-task-list").appendChild(div);
    input.value = "";
  }
  
  function saveDailyTasks() {
    const tasks = Array.from(document.querySelectorAll("#daily-task-list input[type='checkbox']"))
      .filter((input) => input.checked)
      .map((input) => input.nextElementSibling.innerText.trim());
  
    if (tasks.length === 0) return alert("Add at least one daily task.");
    if (!confirm("Are you sure you want to update your daily tasks? This won't affect past days.")) return;
  
    db.ref(`daily/${currentUser}`).set(tasks);
    showDashboard();
  }
  
  function loadTasksByDate() {
    currentDate = document.getElementById("date-picker").value;
    loadTasks();
  }
  
  function loadTasks() {
    const list = document.getElementById("task-list");
    list.innerHTML = "";
    db.ref(`tasks/${currentUser}/${currentDate}`).once("value", (snap) => {
      if (!snap.exists()) {
        db.ref(`daily/${currentUser}`).once("value", (dsnap) => {
          const dailyTasks = dsnap.val();
          dailyTasks.forEach((task) => {
            db.ref(`tasks/${currentUser}/${currentDate}`).push({
              text: task,
              done: false
            });
          });
          showTasks();
        });
      } else {
        showTasks();
      }
    });
  }
  
  function showTasks() {
    db.ref(`daily/${currentUser}`).once("value", (dsnap) => {
      const dailySet = new Set(dsnap.val() || []);
      db.ref(`tasks/${currentUser}/${currentDate}`).once("value", (snap) => {
        const list = document.getElementById("task-list");
        list.innerHTML = "";
        snap.forEach((child) => {
          const task = child.val();
          const div = document.createElement("div");
          div.className = "task-item";
  
          const left = document.createElement("div");
          left.style.display = "flex";
          left.style.alignItems = "center";
          left.style.flexGrow = "1";
  
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = task.done;
          checkbox.onchange = () => {
            db.ref(`tasks/${currentUser}/${currentDate}/${child.key}`).update({
              done: checkbox.checked
            });
          };
  
          const span = document.createElement("span");
          span.innerText = task.text;
  
          const label = document.createElement("small");
          label.style.marginLeft = "8px";
          label.style.fontStyle = "italic";
          label.style.color = "gray";
          label.innerText = dailySet.has(task.text) ? "(Daily)" : "(Custom)";
  
          left.appendChild(checkbox);
          left.appendChild(span);
          left.appendChild(label);
  
          const delBtn = document.createElement("button");
          delBtn.innerHTML = "🗑️";
          delBtn.className = "delete-btn";
          delBtn.onclick = () => {
            if (confirm("Delete this task?")) {
              db.ref(`tasks/${currentUser}/${currentDate}/${child.key}`).remove();
              loadTasks();
            }
          };
  
          div.appendChild(left);
          div.appendChild(delBtn);
          list.appendChild(div);
        });
      });
    });
  }
  
  function addTask() {
    const input = document.getElementById("task-input");
    const text = input.value.trim();
    if (!text) return;
    db.ref(`tasks/${currentUser}/${currentDate}`).push({
      text,
      done: false
    });
    input.value = "";
    loadTasks();
  }
  
  function toggleTheme() {
    document.body.classList.toggle("light");
    document.body.classList.toggle("dark");
  
    const toggleBtn = document.getElementById("theme-toggle");
    if (document.body.classList.contains("light")) {
      toggleBtn.style.background = "#222";
      toggleBtn.style.color = "#fff";
    } else {
      toggleBtn.style.background = "aliceblue";
      toggleBtn.style.color = "#000";
    }
  }
  
  window.addEventListener("DOMContentLoaded", () => {
    const savedUser = localStorage.getItem("user");
    const hasFormValues = document.getElementById("username").value ||
                          document.getElementById("password").value;
  
    if (savedUser && !hasFormValues) {
      currentUser = savedUser;
      db.ref(`daily/${currentUser}`).once("value", (snap) => {
        if (snap.exists()) {
          showDashboard();
        } else {
          showSetupScreen();
        }
      });
    }
  });
  
