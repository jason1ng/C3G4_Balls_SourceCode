/**
 * AQI Calculator Component
 * React component that calculates and displays estimated AQI at a given location
 */

import React, { useState } from 'react';
import { calculateEstimatedAQI, calculateRouteAverageAQI } from '../utils/aqiCalculator';
import { getAQIColor } from '../services/aqicnService';

/**
 * Component to calculate and display estimated AQI at a specific location
 * @param {Object} props
 * @param {number} props.latitude - Target latitude
 * @param {number} props.longitude - Target longitude
 * @param {Array} props.stations - Array of air quality stations
 * @param {Object} props.options - Calculation options (power, maxStations, maxDistance)
 */
export function AQICalculatorDisplay({ latitude, longitude, stations = [], options = {} }) {
    const [result, setResult] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleCalculate = () => {
        if (!latitude || !longitude || !stations || stations.length === 0) {
            alert('Please provide valid coordinates and station data');
            return;
        }

        setIsCalculating(true);

        try {
            const calculation = calculateEstimatedAQI(latitude, longitude, stations, options);
            setResult(calculation);
        } catch (error) {
            console.error('Error calculating AQI:', error);
            setResult({
                estimatedAQI: null,
                error: error.message
            });
        } finally {
            setIsCalculating(false);
        }
    };

    // Auto-calculate when props change
    React.useEffect(() => {
        if (latitude && longitude && stations && stations.length > 0) {
            handleCalculate();
        }
    }, [latitude, longitude, stations.length]);

    if (!result) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <button
                    onClick={handleCalculate}
                    disabled={isCalculating || !latitude || !longitude || !stations || stations.length === 0}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#0C2B4E',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold'
                    }}
                >
                    {isCalculating ? 'Calculating...' : 'Calculate Estimated AQI'}
                </button>
            </div>
        );
    }

    const aqiColor = result.estimatedAQI ? getAQIColor(result.estimatedAQI) : '#999';

    return (
        <div style={{
            padding: '20px',
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            margin: '10px 0'
        }}>
            {result.error ? (
                <div style={{ color: '#d32f2f', textAlign: 'center' }}>
                    <strong>Error:</strong> {result.error}
                </div>
            ) : (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: aqiColor,
                            marginBottom: '5px'
                        }}>
                            {result.estimatedAQI !== null ? result.estimatedAQI.toFixed(1) : 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            Estimated AQI
                        </div>
                        <div style={{
                            fontSize: '0.8rem',
                            color: '#888',
                            marginTop: '10px',
                            padding: '8px',
                            background: '#f5f5f5',
                            borderRadius: '6px'
                        }}>
                            Confidence: {result.confidence.toFixed(1)}%<br />
                            Stations Used: {result.stationsUsed}
                        </div>
                    </div>

                    {result.stations && result.stations.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: '#333' }}>
                                Nearest Stations:
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {result.stations.map((station, index) => (
                                    <div
                                        key={station.id || index}
                                        style={{
                                            padding: '10px',
                                            background: '#f9f9f9',
                                            borderRadius: '6px',
                                            border: '1px solid #e0e0e0'
                                        }}
                                    >
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
                                            {station.location || `Station ${index + 1}`}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>AQI: <strong style={{ color: getAQIColor(station.aqi) }}>{station.aqi}</strong></span>
                                            <span>Distance: {(station.distance / 1000).toFixed(2)} km</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/**
 * Component to calculate average AQI along a route
 * @param {Object} props
 * @param {Array} props.routePoints - Array of [lat, lon] coordinates
 * @param {Array} props.stations - Array of air quality stations
 * @param {Object} props.options - Calculation options
 */
export function RouteAQICalculator({ routePoints = [], stations = [], options = {} }) {
    const [result, setResult] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleCalculate = () => {
        if (!routePoints || routePoints.length === 0 || !stations || stations.length === 0) {
            alert('Please provide valid route points and station data');
            return;
        }

        setIsCalculating(true);

        try {
            const calculation = calculateRouteAverageAQI(routePoints, stations, options);
            setResult(calculation);
        } catch (error) {
            console.error('Error calculating route AQI:', error);
            setResult({
                averageAQI: null,
                error: error.message
            });
        } finally {
            setIsCalculating(false);
        }
    };

    React.useEffect(() => {
        if (routePoints && routePoints.length > 0 && stations && stations.length > 0) {
            handleCalculate();
        }
    }, [routePoints.length, stations.length]);

    if (!result) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <button
                    onClick={handleCalculate}
                    disabled={isCalculating || !routePoints || routePoints.length === 0 || !stations || stations.length === 0}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#0C2B4E',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold'
                    }}
                >
                    {isCalculating ? 'Calculating...' : 'Calculate Route AQI'}
                </button>
            </div>
        );
    }

    const avgColor = result.averageAQI ? getAQIColor(result.averageAQI) : '#999';

    return (
        <div style={{
            padding: '20px',
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            margin: '10px 0'
        }}>
            {result.error ? (
                <div style={{ color: '#d32f2f', textAlign: 'center' }}>
                    <strong>Error:</strong> {result.error}
                </div>
            ) : (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>
                            Route Average AQI
                        </div>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: avgColor,
                            marginBottom: '10px'
                        }}>
                            {result.averageAQI !== null ? result.averageAQI.toFixed(1) : 'N/A'}
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-around',
                            fontSize: '0.85rem',
                            color: '#666'
                        }}>
                            <div>
                                <div style={{ fontWeight: 'bold', color: getAQIColor(result.minAQI) }}>
                                    Min: {result.minAQI !== null ? result.minAQI.toFixed(1) : 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', color: getAQIColor(result.maxAQI) }}>
                                    Max: {result.maxAQI !== null ? result.maxAQI.toFixed(1) : 'N/A'}
                                </div>
                            </div>
                        </div>
                        <div style={{
                            fontSize: '0.8rem',
                            color: '#888',
                            marginTop: '10px',
                            padding: '8px',
                            background: '#f5f5f5',
                            borderRadius: '6px'
                        }}>
                            Coverage: {result.coverage}% ({result.validPoints}/{result.totalPoints} points)
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default AQICalculatorDisplay;

