const planner = document.getElementById("planner");
const weekTitle = document.getElementById("week-title");
const prevWeek = document.getElementById("prev-week");
const nextWeek = document.getElementById("next-week");

let currentDate = new Date(); // Start with today's date

// Helper to format dates (e.g., "2nd", "3rd")
const formatDay = (day) => {
    if (day > 3 && day < 21) return `${day}th`;
    switch (day % 10) {
        case 1: return `${day}st`;
        case 2: return `${day}nd`;
        case 3: return `${day}rd`;
        default: return `${day}th`;
    }
};

// Helper to get the start and end of the current week
const getWeekRange = (date) => {
    const monday = new Date(date);
    monday.setDate(date.getDate() - date.getDay() + 1); // Adjust to Monday
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6); // Adjust to Sunday

    return {
        start: monday,
        end: sunday,
    };
};

// Format the week title (e.g., "2nd to 8th December")
const formatWeekTitle = ({ start, end }) => {
    const options = { month: "long" }; // Format to get month name
    return `${formatDay(start.getDate())} to ${formatDay(end.getDate())} ${start.toLocaleDateString("en-US", options)}`;
};

// Load planner for the current week
const loadPlanner = () => {
    // Clear the planner content
    planner.innerHTML = "";

    // Get the week range for the current date
    const weekRange = getWeekRange(currentDate);

    // Update the week title
    weekTitle.textContent = formatWeekTitle(weekRange);

    // Fetch saved data from localStorage or initialize an empty object
    const savedData = JSON.parse(localStorage.getItem(getStorageKey(weekRange))) || {};

    // Define days of the week
    const days = [
        "Lunedì", "Martedì", "Mercoledì", "Giovedì",
        "Venerdì", "Sabato", "Domenica"
    ];

    // Create planner content dynamically
    days.forEach((day, index) => {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");

        // Add day header
        const dayHeader = document.createElement("h2");
        dayHeader.textContent = day;
        dayDiv.appendChild(dayHeader);

        // Add time boxes for the day
        ["MATTINA", "POMERIGGIO", "SERA", "NOTTE"].forEach((time) => {
            const timeBox = document.createElement("div");
            timeBox.classList.add("time-box");
            timeBox.textContent = time;

            // Apply saved color if it exists
            const savedColor = savedData[`${day}-${time}`];
            if (savedColor) {
                timeBox.classList.add(savedColor);
            }

            // Handle click event to cycle colors
            timeBox.addEventListener("click", () => {
                // Define color sequence
                const colors = ["white", "blue", "orange", "red"];
                const currentColor = colors.find((color) => timeBox.classList.contains(color)) || "white";
                const nextColor = colors[(colors.indexOf(currentColor) + 1) % colors.length];

                // Update classes
                timeBox.className = "time-box"; // Reset to base class
                if (nextColor !== "white") {
                    timeBox.classList.add(nextColor);
                }

                // Save the new color in localStorage
                const updatedData = JSON.parse(localStorage.getItem(getStorageKey(weekRange))) || {};
                updatedData[`${day}-${time}`] = nextColor !== "white" ? nextColor : null;
                localStorage.setItem(getStorageKey(weekRange), JSON.stringify(updatedData));
            });

            dayDiv.appendChild(timeBox);
        });

        planner.appendChild(dayDiv);
    });
};

// Helper to get localStorage key for the current week
const getStorageKey = (weekRange) => `planner-${weekRange.start.toISOString().split("T")[0]}-${weekRange.end.toISOString().split("T")[0]}`;

// Handle week navigation
prevWeek.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 7); // Move back one week
    loadPlanner();
});

nextWeek.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 7); // Move forward one week
    loadPlanner();
});

// Initial load of the planner
loadPlanner();

