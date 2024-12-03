let plannerData = {};
const SPREADSHEET_ID = '1K90XFVzRNvBbvOo8SfcdDo5KDHE9Tk9aMxP8XevhVZM'; // Your actual Google Sheets ID here
const API_KEY = 'AIzaSyCF2HZo60YJ9AXjWc79isscfwDgW2qzwmc'; // Your actual API key here
const CLIENT_ID = '786045326849-4524vek5urhk3lkdpml0kvqev2gboc1l.apps.googleusercontent.com'; // Your actual Client ID here
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let plannerData = {};

async function handleCredentialResponse(response) {
  try {
    const user = jwt_decode(response.credential);
    console.log("User Info:", user);

    // Initialize the Google API client
    await initializeGoogleAPI();

    // Load the weekly planner data
    await loadWeeklyPlanner();
  } catch (error) {
    console.error("Error during login or API initialization:", error);
  }
}

async function initializeGoogleAPI() {
  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', async () => {
      try {
        // Initialize the client
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
          clientId: CLIENT_ID,
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

    const weekRange = getCurrentWeekRange(); // Get the current week
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

// Helper functions for creating default planner, rendering UI, etc., remain unchanged

