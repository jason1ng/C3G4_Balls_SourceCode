/**
 * AQI Calculator Utility
 * Calculates estimated AQI at a given location using inverse distance weighting
 */

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Find the nearest N stations to a given point
 * @param {Array} stations - Array of station objects with coordinates and AQI values
 * @param {number} targetLat - Target latitude
 * @param {number} targetLon - Target longitude
 * @param {number} maxStations - Maximum number of stations to return (default: 3)
 * @param {number} maxDistance - Maximum distance in meters to consider (default: 50000 = 50km)
 * @returns {Array} Array of station objects with added 'distance' property, sorted by distance
 */
export function findNearestStations(stations, targetLat, targetLon, maxStations = 3, maxDistance = 50000) {
    if (!stations || stations.length === 0) {
        return [];
    }

    // Calculate distance for each station and filter by maxDistance
    const stationsWithDistance = stations
        .map(station => {
            if (!station.coordinates || station.coordinates.length !== 2) {
                return null;
            }

            const [stationLat, stationLon] = station.coordinates;
            const distance = calculateDistance(targetLat, targetLon, stationLat, stationLon);

            if (distance > maxDistance) {
                return null;
            }

            return {
                ...station,
                distance: distance
            };
        })
        .filter(station => station !== null && station.value !== null && !isNaN(station.value))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxStations);

    return stationsWithDistance;
}

/**
 * Calculate estimated AQI at a given location using inverse distance weighting
 * Formula: Estimated AQI = (AQI1/distance1^p + AQI2/distance2^p + AQI3/distance3^p) / 
 *                          (1/distance1^p + 1/distance2^p + 1/distance3^p)
 * 
 * @param {number} targetLat - Target latitude
 * @param {number} targetLon - Target longitude
 * @param {Array} stations - Array of station objects with coordinates and AQI values
 * @param {Object} options - Configuration options
 * @param {number} options.power - Power parameter for inverse distance weighting (default: 2)
 * @param {number} options.maxStations - Maximum number of stations to use (default: 3)
 * @param {number} options.maxDistance - Maximum distance in meters to consider (default: 50000 = 50km)
 * @param {number} options.minStations - Minimum number of stations required (default: 1)
 * @returns {Object} Object containing estimated AQI and metadata
 */
export function calculateEstimatedAQI(targetLat, targetLon, stations, options = {}) {
    const {
        power = 2,           // Inverse distance squared weighting
        maxStations = 3,     // Use up to 3 nearest stations
        maxDistance = 50000, // 50km maximum distance
        minStations = 1      // Require at least 1 station
    } = options;

    // Find nearest stations
    const nearestStations = findNearestStations(
        stations,
        targetLat,
        targetLon,
        maxStations,
        maxDistance
    );

    // Check if we have enough stations
    if (nearestStations.length < minStations) {
        return {
            estimatedAQI: null,
            confidence: 0,
            stationsUsed: nearestStations.length,
            stations: nearestStations,
            error: `Insufficient stations found. Required: ${minStations}, Found: ${nearestStations.length}`
        };
    }

    // Calculate weighted AQI using inverse distance weighting
    let weightedSum = 0;
    let weightSum = 0;

    nearestStations.forEach(station => {
        const distance = station.distance;

        // Avoid division by zero for stations at the exact same location
        const adjustedDistance = Math.max(distance, 1); // Minimum 1 meter

        // Calculate weight: 1 / distance^p
        const weight = 1 / Math.pow(adjustedDistance, power);

        // Add to weighted sum: AQI * weight
        weightedSum += station.value * weight;

        // Add to weight sum
        weightSum += weight;
    });

    // Calculate estimated AQI
    const estimatedAQI = weightSum > 0 ? weightedSum / weightSum : null;

    // Calculate confidence based on number of stations and distances
    const avgDistance = nearestStations.reduce((sum, s) => sum + s.distance, 0) / nearestStations.length;
    const distanceScore = Math.max(0, 1 - (avgDistance / maxDistance)); // Closer = higher score
    const stationCountScore = Math.min(1, nearestStations.length / maxStations); // More stations = higher score
    const confidence = (distanceScore * 0.6 + stationCountScore * 0.4) * 100; // Weighted confidence

    return {
        estimatedAQI: estimatedAQI !== null ? Math.round(estimatedAQI * 10) / 10 : null, // Round to 1 decimal
        confidence: Math.round(confidence * 10) / 10,
        stationsUsed: nearestStations.length,
        stations: nearestStations.map(s => ({
            id: s.id,
            location: s.location,
            aqi: s.value,
            distance: Math.round(s.distance),
            coordinates: s.coordinates
        })),
        targetLocation: [targetLat, targetLon]
    };
}

/**
 * Calculate estimated AQI for multiple points (e.g., along a route)
 * @param {Array} points - Array of [lat, lon] coordinates
 * @param {Array} stations - Array of station objects
 * @param {Object} options - Same options as calculateEstimatedAQI
 * @returns {Array} Array of estimated AQI results for each point
 */
export function calculateEstimatedAQIForRoute(points, stations, options = {}) {
    if (!points || points.length === 0) {
        return [];
    }

    return points.map((point, index) => {
        const [lat, lon] = point;
        return {
            pointIndex: index,
            ...calculateEstimatedAQI(lat, lon, stations, options)
        };
    });
}

/**
 * Calculate average AQI along a route
 * @param {Array} points - Array of [lat, lon] coordinates
 * @param {Array} stations - Array of station objects
 * @param {Object} options - Same options as calculateEstimatedAQI
 * @returns {Object} Average AQI and statistics for the route
 */
export function calculateRouteAverageAQI(points, stations, options = {}) {
    const routeAQIs = calculateEstimatedAQIForRoute(points, stations, options);

    const validAQIs = routeAQIs
        .map(r => r.estimatedAQI)
        .filter(aqi => aqi !== null && !isNaN(aqi));

    if (validAQIs.length === 0) {
        return {
            averageAQI: null,
            minAQI: null,
            maxAQI: null,
            validPoints: 0,
            totalPoints: points.length,
            error: 'No valid AQI estimates found for route'
        };
    }

    const averageAQI = validAQIs.reduce((sum, aqi) => sum + aqi, 0) / validAQIs.length;
    const minAQI = Math.min(...validAQIs);
    const maxAQI = Math.max(...validAQIs);

    return {
        averageAQI: Math.round(averageAQI * 10) / 10,
        minAQI: Math.round(minAQI * 10) / 10,
        maxAQI: Math.round(maxAQI * 10) / 10,
        validPoints: validAQIs.length,
        totalPoints: points.length,
        coverage: Math.round((validAQIs.length / points.length) * 100)
    };
}

/**
 * Sample points along a route at regular intervals (e.g., every 1km)
 * @param {Array} routeCoordinates - Array of [lat, lon] coordinates representing the route
 * @param {number} intervalMeters - Interval in meters (default: 1000 = 1km)
 * @returns {Array} Array of [lat, lon] coordinates sampled along the route
 */
export function sampleRoutePoints(routeCoordinates, intervalMeters = 1000) {
    if (!routeCoordinates || routeCoordinates.length < 2) {
        return [];
    }

    const sampledPoints = [];
    let accumulatedDistance = 0;
    let lastPoint = routeCoordinates[0];

    // Always include the first point
    sampledPoints.push([lastPoint[0], lastPoint[1]]);

    for (let i = 1; i < routeCoordinates.length; i++) {
        const currentPoint = routeCoordinates[i];
        const segmentDistance = calculateDistance(
            lastPoint[0], lastPoint[1],
            currentPoint[0], currentPoint[1]
        );

        accumulatedDistance += segmentDistance;

        // If we've accumulated enough distance, sample points along this segment
        while (accumulatedDistance >= intervalMeters) {
            // Calculate how far along the segment to place the sample point
            const distanceToSample = intervalMeters - (accumulatedDistance - segmentDistance);
            const fraction = distanceToSample / segmentDistance;

            // Interpolate between lastPoint and currentPoint
            const lat = lastPoint[0] + (currentPoint[0] - lastPoint[0]) * fraction;
            const lon = lastPoint[1] + (currentPoint[1] - lastPoint[1]) * fraction;

            sampledPoints.push([lat, lon]);
            accumulatedDistance -= intervalMeters;
        }

        lastPoint = currentPoint;
    }

    // Always include the last point
    const lastCoord = routeCoordinates[routeCoordinates.length - 1];
    if (sampledPoints.length === 0 ||
        sampledPoints[sampledPoints.length - 1][0] !== lastCoord[0] ||
        sampledPoints[sampledPoints.length - 1][1] !== lastCoord[1]) {
        sampledPoints.push([lastCoord[0], lastCoord[1]]);
    }

    return sampledPoints;
}

