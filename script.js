const SPREADSHEET_ID = '1K90XFVzRNvBbvOo8SfcdDo5KDHE9Tk9aMxP8XevhVZM'; // Your actual Google Sheets ID here
const API_KEY = 'AIzaSyCF2HZo60YJ9AXjWc79isscfwDgW2qzwmc'; // Your actual API key here
const CLIENT_ID = '786045326849-4524vek5urhk3lkdpml0kvqev2gboc1l.apps.googleusercontent.com'; // Your actual Client ID here
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let plannerData = [];
let tokenClient;
let gapiInitialized = false;
let gisInitialized = false;

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

function initializeGISClient() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: tokenCallback,
  });
  gisInitialized = true;
  console.log('Google Identity Services client initialized.');
}

function handleLogin() {
  if (gapiInitialized && gisInitialized) {
    tokenClient.requestAccessToken();
  } else {
    console.error('Clients are not initialized.');
  }
}

function tokenCallback(response) {
  if (response.error) {
    console.error('Error during token acquisition:', response.error);
    return;
  }

  console.log('Access token acquired.');

  // Update UI
  document.getElementById('sign-in-container').style.display = 'none';
  document.getElementById('planner-container').style.display = 'block';

  // Load the planner
  loadWeeklyPlanner();
}

async function loadWeeklyPlanner() {
  try {
    console.log('Loading planner...');
    const weekRange = getCurrentWeekRange();
    const range = `'${weekRange}'!A1:E10`;

    console.log(`Fetching data for range: ${range}`);

    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    console.log('Google Sheets response:', response);

    plannerData = response.result.values || createEmptyPlanner();
    renderPlanner(weekRange);
  } catch (error) {
    console.error('Error loading data from Google Sheets:', error);
  }
}

function createEmptyPlanner() {
  const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const emptyData = days.map(day => [day, 'white', 'white', 'white', 'white']);
  return emptyData;
}

function renderPlanner(weekRange) {
  const plannerContainer = document.getElementById('planner');
  plannerContainer.innerHTML = ''; // Clear existing content

  const title = document.createElement('h2');
  title.textContent = `Planner for ${weekRange}`;
  plannerContainer.appendChild(title);

  plannerData.forEach((row, rowIndex) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'planner-row';

    row.forEach((cell, cellIndex) => {
      const cellDiv = document.createElement('div');
      cellDiv.className = cellIndex === 0 ? 'planner-cell day' : 'planner-cell slot';
      cellDiv.style.backgroundColor = cellIndex === 0 ? '' : cell;
      cellDiv.textContent = cellIndex === 0 ? cell : '';
      rowDiv.appendChild(cellDiv);

      if (cellIndex > 0) {
        cellDiv.addEventListener('click', () => {
          const colors = ['white', 'blue', 'orange', 'red'];
          const currentColor = cellDiv.style.backgroundColor;
          const nextColor = colors[(colors.indexOf(currentColor) + 1) % colors.length];
          cellDiv.style.backgroundColor = nextColor;
          plannerData[rowIndex][cellIndex] = nextColor;
        });
      }
    });

    plannerContainer.appendChild(rowDiv);
  });
}

function getCurrentWeekRange() {
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return `${startOfWeek.toLocaleDateString('it-IT', options)} - ${endOfWeek.toLocaleDateString('it-IT', options)}`;
}

window.onload = async () => {
  await initializeGapiClient();
  initializeGISClient();

  document.getElementById('login-button').addEventListener('click', handleLogin);
};
