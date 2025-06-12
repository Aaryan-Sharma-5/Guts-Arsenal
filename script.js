// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const CONFIG = {
  databaseURL: "https://shopapp-ad3be-default-rtdb.asia-southeast1.firebasedatabase.app/"
}

const STATE = {
  items: {}
}

// Initialize Firebase
const app = initializeApp(CONFIG);
const database = getDatabase(app);
const itemsRef = ref(database, "shoppingList");

// DOM Elements
const elements = {
  inputField: document.getElementById('inputField'),
  addButton: document.getElementById('addButton'),
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal'),
  searchField: document.getElementById('searchField'),
  sortBtn: document.getElementById('sortBtn'),
  exportBtn: document.getElementById('exportBtn'),
  clearAllBtn: document.getElementById('clearAllBtn')
};

// Initialize the app
function init() {
  if (elements.inputField && elements.addButton && elements.cartItems) {
    setupEventListeners();
    onValue(itemsRef, handleDataUpdate);
  } else {
    console.error("Required DOM elements not found");
  }
}

// Set up event listeners
function setupEventListeners() {
  elements.addButton.addEventListener('click', handleAddItem);
  elements.inputField.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleAddItem();
  });

  elements.sortBtn.addEventListener('click', handleSortItems);
  elements.exportBtn.addEventListener('click', handleExport);
  elements.clearAllBtn.addEventListener('click', handleClearAll);
  elements.searchField.addEventListener('input', handleSearch);
}

// Handle data updates from Firebase
function handleDataUpdate(snapshot) {
  if (snapshot.exists()) {
    STATE.items = snapshot.val();
    renderItems();
    updateStats();
  } else {
    STATE.items = {};
    elements.cartItems.innerHTML = '';
    updateStats();
  }
}

// Add new item to Firebase
function handleAddItem() {
  const name = elements.inputField.value.trim();
  if (!name) {
    elements.inputField.focus();
    return;
  }

  // Add item to Firebase
  push(itemsRef, {
    name: name,
  })
    .then(() => {
      clearInputFields();
      elements.inputField.focus();
    })
    .catch(error => {
      console.error("Error adding item:", error);
      alert(`Failed to add item: ${error.message}`);
    });
}

// Remove item from Firebase
function removeItem(id) {
  const itemRef = ref(database, `shoppingList/${id}`);
  const itemElement = document.querySelector(`[data-id="${id}"]`);
  
  if (itemElement) {
    itemElement.classList.add('removing');
    
    setTimeout(() => {
      remove(itemRef)
        .catch(error => {
          console.error("Error removing item:", error);
          itemElement.classList.remove('removing');
        });
    }, 300);
  } else {
    remove(itemRef)
      .catch(error => console.error("Error removing item:", error));
  }
}

// Clear all items
function handleClearAll() {
  if (confirm('Are you sure you want to clear your entire arsenal?')) {
    set(itemsRef, null)
      .catch(error => console.error("Error clearing all items:", error));
  }
}

// Sort items alphabetically
function handleSortItems() {
  const sortedItems = Object.entries(STATE.items)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name))
    .reduce((obj, [, value], index) => {
      obj[`sorted_${index}`] = value;
      return obj;
    }, {});

  set(itemsRef, sortedItems)
    .catch(error => console.error("Error sorting items:", error));
}

// Handle search functionality
function handleSearch() {
  const query = elements.searchField.value.toLowerCase();
  renderItems(query);
}

// Export items to a text file
function handleExport() {
  const itemsArray = Object.values(STATE.items);

  if (itemsArray.length === 0) {
    alert("Your arsenal is empty. Nothing to export.");
    return;
  }

  const exportData = itemsArray
    .map(item => item.name)
    .join('\n');

  const blob = new Blob([
    `Berserker's Arsenal\n` +
    `==================\n` +
    `Exported: ${new Date().toLocaleString()}\n\n` +
    exportData
  ], { type: 'text/plain' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'berserker-arsenal.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// Render items based on current state and search query
function renderItems(searchQuery = '') {
  elements.cartItems.innerHTML = '';

  if (!STATE.items || Object.keys(STATE.items).length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'Your arsenal is empty... Add some items to begin your quest.';
    elements.cartItems.appendChild(emptyMessage);
    return;
  }

  const itemsToRender = searchQuery
    ? Object.entries(STATE.items).filter(([, item]) =>
      item.name.toLowerCase().includes(searchQuery))
    : Object.entries(STATE.items);

  itemsToRender.forEach(([id, item]) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.dataset.id = id;

    // Item HTML 
    li.innerHTML = `
        <div class="item-content">
          <div class="item-name">${item.name}</div>
        </div>
        <div class="item-actions">
          <button class="item-btn delete-btn" aria-label="Remove item">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeItem(id);
    });

    elements.cartItems.appendChild(li);
  });
}

// Update stats
function updateStats() {
  const itemCount = STATE.items ? Object.keys(STATE.items).length : 0;
  if (elements.cartTotal) {
    elements.cartTotal.textContent = itemCount;
  }
}

// Clear input fields after adding item
function clearInputFields() {
  if (elements.inputField) {
    elements.inputField.value = '';
  }
}

// Define global functions accessible from HTML
window.removeItem = removeItem;

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);