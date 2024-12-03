const SPREADSHEET_ID = '1K90XFVzRNvBbvOo8SfcdDo5KDHE9Tk9aMxP8XevhVZM'; // Your actual Google Sheets ID here
const API_KEY = 'AIzaSyCF2HZo60YJ9AXjWc79isscfwDgW2qzwmc'; // Your actual API key here
const CLIENT_ID = '786045326849-4524vek5urhk3lkdpml0kvqev2gboc1l.apps.googleusercontent.com'; // Your actual Client ID here
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let plannerData = {};
let tokenClient;
let gapiInitialized = false;
let gisInitialized = false;

// Initialize GAPI client
async function initializeGapiClient() {
  await gapi.load('client', async () => {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    });
    gapiInitialized = true;
    console.log('Google API client initialized.');
  });
}

// Initialize Google Identity Services
function initializeGISClient() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error) {
        console.error('Error during token acquisition:', response.error);
        return;
      }
      console.log('Access token acquired.');
      loadWeeklyPlanner(); // Load data after successful login
    },
  });
  gisInitialized = true;
  console.log('Google Identity Services client initialized.');
}

// Handle login button click
function handleLogin() {
  if (gapiInitialized && gisInitialized) {
    tokenClient.requestAccessToken();
  } else {
    console.error('Clients are not initialized.');
  }
}

// Load weekly planner data from Google Sheets
async function loadWeeklyPlanner() {
  try {
    if (!gapiInitialized) throw new Error('Google API client is not initialized.');
    if (!gisInitialized) throw new Error('Google Identity Services client is not initialized.');

    const weekRange = getCurrentWeekRange();
    const range = `'${weekRange}'!A1:E10`;

    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    plannerData = response.result.values || createEmptyPlanner();
    renderPlanner(weekRange);
  } catch (error) {
    console.error('Error loading data from Google Sheets:', error);
  }
}

// Create default empty planner
function createEmptyPlanner() {
  const emptyData = [];
  const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  for (const day of days) {
    emptyData.push([day, 'white', 'white', 'white', 'white']); // 4 slots
  }
  return emptyData;
}

// Render the planner in the UI
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

// Get the current week's range
function getCurrentWeekRange() {
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return `${startOfWeek.toLocaleDateString('it-IT', options)} - ${endOfWeek.toLocaleDateString('it-IT', options)}`;
}

// Initialize everything on window load
window.onload = async () => {
  // Initialize GAPI and GIS clients
  await initializeGapiClient();
  initializeGISClient();

  // Add login button handler
  document.getElementById('login-button').addEventListener('click', handleLogin);
};

