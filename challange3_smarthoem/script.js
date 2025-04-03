const devices = [];

let userSettings = {
    maxEnergy: 2000,
    peakHours: "18:00-22:00" // Example peak hours
};

// Display real-time local time
function displayLocalTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById("local-time-display").textContent = `Local Time: ${timeString}`;
}

// Show welcome alert if user has not disabled it
function showWelcomeAlert() {
    if (!localStorage.getItem("hideWelcomeAlert")) {
        Swal.fire({
            title: "Welcome to Smart Home AIO!",
            html: `
                <p>Manage your devices and monitor energy consumption efficiently.</p>
                <p>Set energy limits and track real-time usage.</p>
                <input type="checkbox" id="hide-alert"> <label for="hide-alert">Don't show this again</label>
            `,
            icon: "info",
            confirmButtonText: "OK",
            didClose: () => {
                if (document.getElementById("hide-alert").checked) {
                    localStorage.setItem("hideWelcomeAlert", "true");
                }
            }
        });
    }
}

// Adding a new device to the list
function addDevice() {
    const deviceName = document.getElementById("device-name").value.trim();
    const devicePower = parseInt(document.getElementById("device-power").value.trim()) || 0;
    const usageTimeInput = parseInt(document.getElementById("usage-time").value.trim()) || null;

    if (!deviceName || devicePower <= 0) {
        Swal.fire("Please enter all details: device name and valid power usage.");
        return;
    }

    devices.push({
        name: deviceName,
        power: devicePower,
        isOn: false,
        usageTime: usageTimeInput ? usageTimeInput * 60 * 1000 : null, // Convert minutes to milliseconds
        startTime: null,
        timer: null
    });

    renderDevices();

    // Clear input fields after adding the device
    document.getElementById("device-name").value = "";
    document.getElementById("device-power").value = "";
    document.getElementById("usage-time").value = "";
}

// Render devices in the UI
function renderDevices() {
    const deviceList = document.getElementById("device-list");
    deviceList.innerHTML = "";

    // Sort devices: First by "isOn" status (ON devices first), then by power usage (highest to lowest)
    devices.sort((a, b) => {
        if (b.isOn !== a.isOn) {
            return b.isOn - a.isOn; // ON devices come first
        }
        return b.power - a.power; // Higher power devices come first
    });

    devices.forEach((device, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${device.name}</td>
            <td>${device.isOn ? "On" : "Off"}</td>
            <td>${device.isOn ? device.power : 0} W</td>
            <td>
                <button class="${device.isOn ? "off-btn" : "on-btn"}" onclick="toggleDevice(${index})">
                    ${device.isOn ? "Power Off" : "Power On"}
                </button>
            </td>
        `;
        deviceList.appendChild(row);
    });

    updateTotalEnergy();
}

// Toggle device ON/OFF
function toggleDevice(index) {
    const currentDevice = devices[index];

    if (!currentDevice.isOn) {
        // Calculate new total energy if the device is turned on
        const newTotalEnergy = devices.reduce((sum, device) => 
            sum + (device.isOn ? device.power : 0), 0
        ) + currentDevice.power;

        if (newTotalEnergy > userSettings.maxEnergy) {
            Swal.fire({
                icon: 'error',
                title: 'You hit the limit!',
                text: 'The total energy consumption exceeds the limit! You can\'t turn on this device.',
            });
            return;
        }

        devices[index].isOn = true;
        devices[index].startTime = Date.now();

        // Automatically turn off after the specified usage time
        if (devices[index].usageTime) {
            devices[index].timer = setTimeout(() => {
                Swal.fire({
                    title: `Time is up for ${devices[index].name}.`,
                    text: "We must turn off the device.",
                    icon: "info"
                });
                devices[index].isOn = false;
                renderDevices();
            }, devices[index].usageTime);
        }
    } else {
        clearTimeout(devices[index].timer); // Cancel the auto-off timer
        devices[index].isOn = false;
    }

    renderDevices();
}

// Energy usage chart
const ctx = document.getElementById("energyChart").getContext("2d");
const energyChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: ["0s"],
        datasets: [{
            label: "Energy Usage (W)",
            data: [0],
            borderColor: "blue",
            backgroundColor: "rgba(0, 0, 255, 0.2)",
            fill: true
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true }
        }
    }
});

// Update energy usage chart
function updateChart() {
    const totalEnergy = devices.reduce((sum, device) => sum + (device.isOn ? device.power : 0), 0);
    const time = `${energyChart.data.labels.length}s`;

    energyChart.data.labels.push(time);
    energyChart.data.datasets[0].data.push(totalEnergy);

    if (energyChart.data.labels.length > 10) {
        energyChart.data.labels.shift();
        energyChart.data.datasets[0].data.shift();
    }

    energyChart.update();
}

// Update total energy consumption display
function updateTotalEnergy() {
    const totalEnergy = devices.reduce((sum, device) => sum + (device.isOn ? device.power : 0), 0);
    document.getElementById("total-energy").textContent = totalEnergy;
    updateChart();
}

// Save user settings
function saveSettings() {
    const maxEnergyInput = parseInt(document.getElementById("max-energy").value.trim()) || userSettings.maxEnergy;
    const peakHoursInput = document.getElementById("peak-hours").value.trim() || userSettings.peakHours;

    userSettings.maxEnergy = maxEnergyInput;
    userSettings.peakHours = peakHoursInput;

    Swal.fire({
        title: "Success!",
        text: "Settings saved successfully.",
        icon: "success",
        confirmButtonText: "OK"
    });
}

// Update device usage time
function updateUsageTime() {
    const usageList = document.getElementById("usage-time-list");
    usageList.innerHTML = "";

    devices.forEach(device => {
        if (device.isOn) {
            const elapsedTime = Math.floor((Date.now() - device.startTime) / 1000);
            const listItem = document.createElement("li");
            listItem.textContent = `${device.name}: ${elapsedTime} seconds`;
            usageList.appendChild(listItem);
        }
    });
}

// Run functions on page load
window.onload = function () {
    showWelcomeAlert();
    displayLocalTime();
};

// Update local time every second
setInterval(displayLocalTime, 1000);
setInterval(updateUsageTime, 1000);
renderDevices();
