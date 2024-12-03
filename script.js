let plannerData = {};
const SPREADSHEET_ID = '1K90XFVzRNvBbvOo8SfcdDo5KDHE9Tk9aMxP8XevhVZM';
const API_KEY = 'AIzaSyCF2HZo60YJ9AXjWc79isscfwDgW2qzwmc';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

async function handleCredentialResponse(response) {
  try {
    const user = jwt_decode(response.credential);
    console.log("User Info:", user);

    // Initialize Google Sheets API after login
    await initializeSheetsAPI();

    // Load the current week's planner
    const currentWeekRange = getCurrentWeekRange();
    await loadWeeklyPlanner(currentWeekRange);
  } catch (error) {
    console.error("Error during login or initialization:", error);
  }
}

// Initialize Google Sheets API
async function initializeSheetsAPI() {
  try {
    await gapi.load('client');
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    console.log('Google Sheets API Initialized');
  } catch (error) {
    console.error("Error initializing Google Sheets API:", error);
  }
}

// Load weekly planner data for the given week
async function loadWeeklyPlanner(weekRange) {
  try {
    const range = `'${weekRange}'!A1:E10`;
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    plannerData = response.result.values || createEmptyPlanner();
    renderPlanner(weekRange);
  } catch (error) {
    console.warn("No data for this week, initializing empty planner:", error);
    plannerData = createEmptyPlanner();
    renderPlanner(weekRange);
  }
}

// Create an empty planner with default "white" values
function createEmptyPlanner() {
  const days = 7; // 7 days a week
  const slots = 4; // Mattina, Pomeriggio, Sera, Notte
  return Array.from({ length: days }, () => Array(slots).fill('white'));
}

// Save updated planner data back to Google Sheets
async function saveWeeklyPlanner(weekRange) {
  const range = `'${weekRange}'!A1:E10`;
  const body = {
    values: plannerData,
  };

  try {
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      resource: body,
    });
    console.log('Planner saved successfully.');
  } catch (error) {
    console.error("Error saving planner:", error);
  }
}

// Render the planner UI
function renderPlanner(weekRange) {
  const planner = document.getElementById('planner');
  planner.innerHTML = ''; // Clear previous content

  const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  days.forEach((day, i) => {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';

    const dayHeader = document.createElement('h3');
    dayHeader.textContent = day;

    dayDiv.appendChild(dayHeader);

    const timeSlots = ['Mattina', 'Pomeriggio', 'Sera', 'Notte'];
    timeSlots.forEach((slot, j) => {
      const slotDiv = document.createElement('div');
      slotDiv.className = 'slot';
      slotDiv.textContent = slot;

      // Set initial color
      slotDiv.style.backgroundColor = plannerData[i]?.[j] || 'white';

      slotDiv.addEventListener('click', () => {
        const colors = ['white', 'blue', 'orange', 'red'];
        const currentColor = slotDiv.style.backgroundColor;
        const nextColor = colors[(colors.indexOf(currentColor) + 1) % colors.length];

        slotDiv.style.backgroundColor = nextColor;
        if (!plannerData[i]) plannerData[i] = [];
        plannerData[i][j] = nextColor;

        saveWeeklyPlanner(weekRange);
      });

      dayDiv.appendChild(slotDiv);
    });

    planner.appendChild(dayDiv);
  });

  document.getElementById('week-display').textContent = `Settimana ${weekRange}`;
}

// Get the current week's range (e.g., "2-8 dicembre 2024")
function getCurrentWeekRange() {
  const today = new Date();
  const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Start of the week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6); // End of the week

  const options = { day: '2-digit', month: 'long' };
  return `${monday.toLocaleDateString('it-IT', options)} - ${sunday.toLocaleDateString('it-IT', options)}`;
}

// Navigation buttons for changing weeks
document.getElementById('prev-week').addEventListener('click', () => {
  changeWeek(-1);
});
document.getElementById('next-week').addEventListener('click', () => {
  changeWeek(1);
});

function changeWeek(offset) {
  const currentWeek = getCurrentWeekRange();
  const monday = new Date(currentWeek.split(' ')[0]);
  monday.setDate(monday.getDate() + offset * 7);

  const newWeekRange = `${monday.toLocaleDateString('it-IT')} - ${new Date(monday.setDate(monday.getDate() + 6)).toLocaleDateString('it-IT')}`;
  loadWeeklyPlanner(newWeekRange);
}
