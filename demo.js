// TSP Demo Application
class TSPDemo {
    constructor() {
        this.map = null;
        this.locations = [];
        this.markers = [];
        this.routeLayer = null;
        this.isOptimizing = false;
        
        this.init();
    }

    init() {
        this.initMap();
        this.bindEvents();
        this.setupExamples();
    }

    initMap() {
        // Initialize Leaflet map
        this.map = L.map('map').setView([40.7128, -74.0060], 10); // NYC default

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add click listener for adding locations
        this.map.on('click', (e) => {
            this.addLocationFromCoords(e.latlng.lat, e.latlng.lng);
        });
    }

    bindEvents() {
        // Add location button
        document.getElementById('add-location').addEventListener('click', () => {
            this.addLocationFromInput();
        });

        // Enter key in input
        document.getElementById('location-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addLocationFromInput();
            }
        });

        // Optimize route button
        document.getElementById('optimize-route').addEventListener('click', () => {
            this.optimizeRoute();
        });

        // Clear all button
        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearAll();
        });

        // Export and share buttons
        document.getElementById('export-route').addEventListener('click', () => {
            this.exportRoute();
        });

        document.getElementById('share-route').addEventListener('click', () => {
            this.shareRoute();
        });

        // Example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.loadExample(e.target.dataset.example);
            });
        });
    }

    setupExamples() {
        this.examples = {
            cities: [
                { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
                { name: 'Philadelphia, PA', lat: 39.9526, lng: -75.1652 },
                { name: 'Washington, DC', lat: 38.9072, lng: -77.0369 },
                { name: 'Baltimore, MD', lat: 39.2904, lng: -76.6122 },
                { name: 'Boston, MA', lat: 42.3601, lng: -71.0589 }
            ],
            landmarks: [
                { name: 'Statue of Liberty', lat: 40.6892, lng: -74.0445 },
                { name: 'Empire State Building', lat: 40.7484, lng: -73.9857 },
                { name: 'Central Park', lat: 40.7829, lng: -73.9654 },
                { name: 'Brooklyn Bridge', lat: 40.7061, lng: -73.9969 },
                { name: 'Times Square', lat: 40.7580, lng: -73.9855 }
            ],
            europe: [
                { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
                { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
                { name: 'Amsterdam, Netherlands', lat: 52.3676, lng: 4.9041 },
                { name: 'Berlin, Germany', lat: 52.5200, lng: 13.4050 },
                { name: 'Rome, Italy', lat: 41.9028, lng: 12.4964 }
            ]
        };
    }

    async addLocationFromInput() {
        const input = document.getElementById('location-input');
        const address = input.value.trim();
        
        if (!address) return;

        try {
            // Simulate geocoding (in real app, use actual geocoding service)
            const coords = await this.geocodeAddress(address);
            this.addLocation(address, coords.lat, coords.lng);
            input.value = '';
        } catch (error) {
            this.showNotification('Could not find location. Please try a different address.', 'error');
        }
    }

    addLocationFromCoords(lat, lng) {
        const name = `Location ${this.locations.length + 1}`;
        this.addLocation(name, lat, lng);
    }

    addLocation(name, lat, lng) {
        if (this.locations.length >= 10) {
            this.showNotification('Demo limited to 10 locations', 'warning');
            return;
        }

        const location = { name, lat, lng, id: Date.now() };
        this.locations.push(location);

        this.addMarker(location);
        this.updateLocationList();
        this.updateControls();
    }

    addMarker(location) {
        const isStart = this.markers.length === 0;
        const markerClass = isStart ? 'start-marker' : 'waypoint-marker';
        
        const marker = L.marker([location.lat, location.lng], {
            title: location.name
        }).addTo(this.map);

        marker.bindPopup(`
            <div class="marker-popup">
                <h4>${location.name}</h4>
                <button onclick="tspDemo.removeLocation(${location.id})" class="remove-btn">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        `);

        this.markers.push({ marker, location });
    }

    removeLocation(id) {
        const index = this.locations.findIndex(loc => loc.id === id);
        if (index === -1) return;

        // Remove from arrays
        this.locations.splice(index, 1);
        const markerObj = this.markers.splice(index, 1)[0];
        
        // Remove from map
        this.map.removeLayer(markerObj.marker);
        
        this.updateLocationList();
        this.updateControls();
        
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
            this.routeLayer = null;
            this.hideResults();
        }
    }

    updateLocationList() {
        const listContainer = document.getElementById('location-list');
        
        if (this.locations.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-marked-alt"></i>
                    <p>No locations added yet. Start by adding your first destination above.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = this.locations.map((location, index) => `
            <div class="location-item" data-id="${location.id}">
                <div class="location-info">
                    <div class="location-number">${index + 1}</div>
                    <div class="location-details">
                        <span class="location-name">${location.name}</span>
                        <span class="location-coords">${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</span>
                    </div>
                </div>
                <button onclick="tspDemo.removeLocation(${location.id})" class="remove-location-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    updateControls() {
        const optimizeBtn = document.getElementById('optimize-route');
        optimizeBtn.disabled = this.locations.length < 2;
    }

    async optimizeRoute() {
        if (this.locations.length < 2) return;
        
        this.isOptimizing = true;
        this.showLoading();
        
        try {
            // Simulate optimization process
            const result = await this.runOptimization();
            this.displayRoute(result);
            this.showResults(result);
        } catch (error) {
            this.showNotification('Optimization failed. Please try again.', 'error');
        } finally {
            this.isOptimizing = false;
            this.hideLoading();
        }
    }

    async runOptimization() {
        // Simulate API call with delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const algorithm = document.getElementById('algorithm-select').value;
        
        // Simple nearest neighbor algorithm for demo
        const optimizedOrder = this.nearestNeighborTSP();
        const totalDistance = this.calculateTotalDistance(optimizedOrder);
        const originalDistance = this.calculateTotalDistance([...Array(this.locations.length).keys()]);
        
        return {
            order: optimizedOrder,
            totalDistance,
            originalDistance,
            algorithm,
            estimatedTime: Math.round(totalDistance / 50 * 60) // Rough estimate
        };
    }

    nearestNeighborTSP() {
        if (this.locations.length <= 1) return [0];
        
        const unvisited = new Set([...Array(this.locations.length).keys()].slice(1));
        const route = [0]; // Start with first location
        let current = 0;
        
        while (unvisited.size > 0) {
            let nearest = null;
            let nearestDistance = Infinity;
            
            for (const city of unvisited) {
                const distance = this.getDistance(current, city);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearest = city;
                }
            }
            
            route.push(nearest);
            unvisited.delete(nearest);
            current = nearest;
        }
        
        return route;
    }

    getDistance(i, j) {
        const loc1 = this.locations[i];
        const loc2 = this.locations[j];
        
        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
        const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    calculateTotalDistance(order) {
        let total = 0;
        for (let i = 0; i < order.length - 1; i++) {
            total += this.getDistance(order[i], order[i + 1]);
        }
        // Add return to start
        if (order.length > 1) {
            total += this.getDistance(order[order.length - 1], order[0]);
        }
        return total;
    }

    displayRoute(result) {
        // Remove existing route
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }
        
        // Create route coordinates
        const routeCoords = result.order.map(i => [this.locations[i].lat, this.locations[i].lng]);
        routeCoords.push([this.locations[result.order[0]].lat, this.locations[result.order[0]].lng]); // Return to start
        
        // Add route to map
        this.routeLayer = L.polyline(routeCoords, {
            color: '#007AFF',
            weight: 4,
            opacity: 0.8
        }).addTo(this.map);
        
        // Fit map to show all points
        const group = new L.featureGroup([this.routeLayer, ...this.markers.map(m => m.marker)]);
        this.map.fitBounds(group.getBounds().pad(0.1));
    }

    showResults(result) {
        const panel = document.getElementById('results-panel');
        const improvement = ((result.originalDistance - result.totalDistance) / result.originalDistance * 100);
        
        document.getElementById('total-distance').textContent = `${result.totalDistance.toFixed(1)} km`;
        document.getElementById('estimated-time').textContent = `${result.estimatedTime} minutes`;
        document.getElementById('improvement').textContent = `${improvement.toFixed(1)}% better`;
        
        panel.style.display = 'block';
    }

    hideResults() {
        document.getElementById('results-panel').style.display = 'none';
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    clearAll() {
        // Remove all markers
        this.markers.forEach(markerObj => {
            this.map.removeLayer(markerObj.marker);
        });
        
        // Remove route
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
            this.routeLayer = null;
        }
        
        // Clear arrays
        this.locations = [];
        this.markers = [];
        
        // Update UI
        this.updateLocationList();
        this.updateControls();
        this.hideResults();
    }

    loadExample(exampleName) {
        this.clearAll();
        
        const locations = this.examples[exampleName];
        if (!locations) return;
        
        locations.forEach(loc => {
            this.addLocation(loc.name, loc.lat, loc.lng);
        });
        
        // Fit map to show all locations
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers.map(m => m.marker));
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    async geocodeAddress(address) {
        // Simulate geocoding - in real app, use actual service
        const mockResults = {
            'new york': { lat: 40.7128, lng: -74.0060 },
            'london': { lat: 51.5074, lng: -0.1278 },
            'paris': { lat: 48.8566, lng: 2.3522 },
            'tokyo': { lat: 35.6762, lng: 139.6503 },
            'sydney': { lat: -33.8688, lng: 151.2093 }
        };
        
        const key = address.toLowerCase();
        for (const [city, coords] of Object.entries(mockResults)) {
            if (key.includes(city)) {
                return coords;
            }
        }
        
        // Random location for demo
        return {
            lat: 40.7128 + (Math.random() - 0.5) * 0.1,
            lng: -74.0060 + (Math.random() - 0.5) * 0.1
        };
    }

    exportRoute() {
        if (!this.locations.length) {
            this.showNotification('No route to export', 'warning');
            return;
        }
        
        const data = {
            locations: this.locations,
            timestamp: new Date().toISOString(),
            algorithm: document.getElementById('algorithm-select').value
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tsp-route-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Route exported successfully!', 'success');
    }

    shareRoute() {
        if (!this.locations.length) {
            this.showNotification('No route to share', 'warning');
            return;
        }
        
        const url = window.location.href + '?locations=' + btoa(JSON.stringify(this.locations));
        
        if (navigator.share) {
            navigator.share({
                title: 'TSP(ML) Optimized Route',
                text: 'Check out this optimized route created with TSP(ML)',
                url: url
            });
        } else {
            navigator.clipboard.writeText(url).then(() => {
                this.showNotification('Route URL copied to clipboard!', 'success');
            });
        }
    }

    showNotification(message, type = 'info') {
        // Use the global notification system
        if (window.TSPApp && window.TSPApp.showNotification) {
            window.TSPApp.showNotification(message, type);
        }
    }
}

// Initialize demo when page loads
let tspDemo;
document.addEventListener('DOMContentLoaded', () => {
    tspDemo = new TSPDemo();
});
