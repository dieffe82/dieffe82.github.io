const SPREADSHEET_ID = '1K90XFVzRNvBbvOo8SfcdDo5KDHE9Tk9aMxP8XevhVZM'; // Your actual Google Sheets ID here
const API_KEY = 'AIzaSyCF2HZo60YJ9AXjWc79isscfwDgW2qzwmc'; // Your actual API key here
const CLIENT_ID = '786045326849-4524vek5urhk3lkdpml0kvqev2gboc1l.apps.googleusercontent.com'; // Your actual Client ID here
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let plannerData = {};

// Initialize Google Sign-In
function handleCredentialResponse(response) {
  const user = jwt_decode(response.credential);
  console.log("User Info:", user);

  // Update the UI to show the planner after login
  document.getElementById('sign-in-container').style.display = 'none';
  document.getElementById('planner-container').style.display = 'block';

  // Initialize Google API client
  initializeGoogleAPI().then(loadWeeklyPlanner).catch((err) => {
    console.error("Initialization error:", err);
  });
}

async function initializeGoogleAPI() {
  return new Promise((resolve, reject) => {
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        });
        console.log("Google API client initialized successfully.");
        resolve();
      } catch (error) {
        console.error("Error initializing Google API client:", error);
        reject(error);
      }
    });
  });
}

async function loadWeeklyPlanner() {
  try {
    if (!gapi.client.sheets) {
      throw new Error("Google Sheets API client is not initialized.");
    }

    const weekRange = getCurrentWeekRange(); // Get the current week range
    const range = `'${weekRange}'!A1:E10`;

    // Fetch data from the Google Sheet
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    if (response.result && response.result.values) {
      plannerData = response.result.values;
    } else {
      plannerData = createEmptyPlanner();
    }

    renderPlanner(weekRange);
  } catch (error) {
    console.error("Error loading data from Google Sheets:", error);
  }
}

// Generate default empty planner
function createEmptyPlanner() {
  const emptyData = [];
  const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const slots = 4; // MATTINA, POMERIGGIO, SERA, NOTTE
  for (const day of days) {
    const row = new Array(slots).fill('white');
    emptyData.push([day, ...row]);
  }
  return emptyData;
}

// Render the weekly planner on the UI
function renderPlanner(weekRange) {
  const plannerContainer = document.getElementById('planner');
  plannerContainer.innerHTML = ''; // Clear existing content

  const title = document.createElement('h2');
  title.textContent = `Planner for ${weekRange}`;
  plannerContainer.appendChild(title);

  plannerData.forEach((row) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'planner-row';

    row.forEach((cell, index) => {
      const cellDiv = document.createElement('div');
      cellDiv.className = index === 0 ? 'planner-cell day' : 'planner-cell slot';
      cellDiv.style.backgroundColor = index === 0 ? '' : cell;
      cellDiv.textContent = index === 0 ? cell : '';
      rowDiv.appendChild(cellDiv);

      // Handle color changes
      if (index > 0) {
        cellDiv.addEventListener('click', () => {
          const colors = ['white', 'blue', 'orange', 'red'];
          const currentColor = cellDiv.style.backgroundColor;
          const nextColor = colors[(colors.indexOf(currentColor) + 1) % colors.length];
          cellDiv.style.backgroundColor = nextColor;
          plannerData[row[0]][index - 1] = nextColor;
        });
      }
    });

    plannerContainer.appendChild(rowDiv);
  });
}

// Get current week range
function getCurrentWeekRange() {
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return `${startOfWeek.toLocaleDateString('it-IT', options)} - ${endOfWeek.toLocaleDateString('it-IT', options)}`;
}

// Google Sign-In setup
window.onload = function () {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse,
  });
  google.accounts.id.renderButton(
    document.getElementById('sign-in-container'),
    { theme: 'outline', size: 'large' }
  );
};

