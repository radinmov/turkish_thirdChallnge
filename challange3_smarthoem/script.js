
const devices = [];

let userSettings = {
    maxEnergy: 2000,
    peakHours: "18:00-22:00"
};

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
        usageTime: usageTimeInput ? usageTimeInput * 60 * 1000 : null,
        startTime: null,
        timer: null
    });

    renderDevices();
    document.getElementById("device-name").value = "";
    document.getElementById("device-power").value = "";
    document.getElementById("usage-time").value = "";
}

function renderDevices() {
    const deviceList = document.getElementById("device-list");
    deviceList.innerHTML = "";

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

function toggleDevice(index) {
    const currentDevice = devices[index];

    if (!currentDevice.isOn) {
        const newTotalEnergy = devices.reduce((sum, device) => 
            sum + (device.isOn ? device.power : 0), 0
        ) + currentDevice.power;

        if (newTotalEnergy > userSettings.maxEnergy) {
            Swal.fire({
                icon: 'error',
                title: 'You hit the limit!',
                text: 'The total energy consumption exceeds the limit! You cant turn on this device.',
              });
            return;
        }

        devices[index].isOn = true;
        devices[index].startTime = Date.now();

        if (devices[index].usageTime) {
            devices[index].timer = setTimeout(() => {
                Swal.fire({
                    title: `Time is up for ${devices[index].name}.`,
                    text: "We must to close the device.",
                    icon: "info"
                });
                devices[index].isOn = false;
                renderDevices();
            }, devices[index].usageTime);
        }
    } else {
        clearTimeout(devices[index].timer);
        devices[index].isOn = false;
    }

    renderDevices();
}

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

function updateTotalEnergy() {
    const totalEnergy = devices.reduce((sum, device) => sum + (device.isOn ? device.power : 0), 0);
    document.getElementById("total-energy").textContent = totalEnergy;
    updateChart();
}

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

setInterval(updateUsageTime, 1000);
renderDevices();
