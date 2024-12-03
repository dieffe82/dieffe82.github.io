const API_KEY = 'AIzaSyCF2HZo60YJ9AXjWc79isscfwDgW2qzwmc'; // Your actual API key here
const CLIENT_ID = '786045326849-4524vek5urhk3lkdpml0kvqev2gboc1l.apps.googleusercontent.com'; // Your actual Client ID here
const SPREADSHEET_ID = "1K90XFVzRNvBbvOo8SfcdDo5KDHE9Tk9aMxP8XevhVZM";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

let currentWeekStart = new Date();
currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1);

function formatWeekRange(date) {
    const options = { day: "numeric", month: "long", year: "numeric" };
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("it-IT", options)} - ${end.toLocaleDateString("it-IT", options)}`;
}

async function createSheetIfNotExists(sheetName) {
    try {
        const response = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID
        });

        const sheets = response.result.sheets.map(sheet => sheet.properties.title);

        if (!sheets.includes(sheetName)) {
            console.log(`Creating sheet: ${sheetName}`);
            await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                resource: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: sheetName
                                }
                            }
                        }
                    ]
                }
            });
            console.log(`Sheet "${sheetName}" created successfully.`);
        }
    } catch (error) {
        console.error("Error checking or creating sheet:", error);
    }
}

async function initializeSheet(sheetName) {
    const defaultValues = [
        ["Lunedì", "Mattina", "Pomeriggio", "Sera", "Notte"],
        ["Martedì", "", "", "", ""],
        ["Mercoledì", "", "", "", ""],
        ["Giovedì", "", "", "", ""],
        ["Venerdì", "", "", "", ""],
        ["Sabato", "", "", "", ""],
        ["Domenica", "", "", "", ""]
    ];

    try {
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${sheetName}'!A1:E8`,
            valueInputOption: "RAW",
            resource: {
                values: defaultValues
            }
        });
        console.log(`Sheet "${sheetName}" initialized.`);
    } catch (error) {
        console.error("Error initializing sheet:", error);
    }
}

async function loadWeeklyPlanner() {
    const sheetName = formatWeekRange(currentWeekStart);

    try {
        await createSheetIfNotExists(sheetName);
        await initializeSheet(sheetName);

        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${sheetName}'!A1:E8`
        });

        const data = response.result.values || [];
        updatePlannerUI(data);
    } catch (error) {
        console.error("Error loading weekly planner:", error);
    }
}

function updatePlannerUI(data) {
    const plannerContainer = document.getElementById("planner");
    plannerContainer.innerHTML = "";

    data.forEach((row, rowIndex) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "row";
        row.forEach((cell, colIndex) => {
            const cellDiv = document.createElement("div");
            cellDiv.className = "cell";
            cellDiv.textContent = cell;
            cellDiv.dataset.row = rowIndex;
            cellDiv.dataset.col = colIndex;

            if (colIndex > 0) {
                cellDiv.addEventListener("click", () => handleCellClick(cellDiv));
            }

            rowDiv.appendChild(cellDiv);
        });
        plannerContainer.appendChild(rowDiv);
    });
}

function handleCellClick(cellDiv) {
    const colors = ["white", "blue", "orange", "red"];
    const currentColor = cellDiv.style.backgroundColor || "white";
    const nextColor = colors[(colors.indexOf(currentColor) + 1) % colors.length];
    cellDiv.style.backgroundColor = nextColor;

    saveWeeklyPlanner();
}

async function saveWeeklyPlanner() {
    const sheetName = formatWeekRange(currentWeekStart);
    const plannerContainer = document.getElementById("planner");
    const rows = Array.from(plannerContainer.getElementsByClassName("row"));

    const data = rows.map(row => {
        const cells = Array.from(row.getElementsByClassName("cell"));
        return cells.map(cell => cell.textContent);
    });

    try {
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${sheetName}'!A1:E8`,
            valueInputOption: "RAW",
            resource: {
                values: data
            }
        });
        console.log("Weekly planner saved successfully.");
    } catch (error) {
        console.error("Error saving weekly planner:", error);
    }
}

function setupAuth() {
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"),
        { theme: "outline", size: "large" }
    );
}

function handleCredentialResponse(response) {
    gapi.load("client", async () => {
        try {
            await gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"]
            });
            console.log("Google API client initialized successfully.");
            document.getElementById("googleSignInButton").style.display = "none";
            await loadWeeklyPlanner();
        } catch (error) {
            console.error("Error initializing Google API client:", error);
        }
    });
}

window.onload = setupAuth;
