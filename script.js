const map = L.map('map').setView([3.1390, 101.6869], 11);  // KL

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);