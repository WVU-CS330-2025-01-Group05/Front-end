/**
 * request.js
 * 
 * This file gives NOAA the user's zipcode or coordinates and the current month to request Climate Data.
 * We use data from past years to estimate what the current month's climate data looks like.
 * Data includes: precipitation, temperature averages, and relative humidity.
 * It then stores this data as an array on the browser.
 */
const tokenFromNoaa = "zRJaCOXTyBqXhvrDQMFapLNnZiFBGoNe";
const zipKey = "2db231e368124778ae3517c281ea41aa";

// Track in-flight requests to prevent duplicates
const pendingRequests = {};
const cachedData = {};

const monthList = ["January", "February", "March", "April", "May", "June", "July", 
    "August", "September", "October", "November", "December"];

const d = new Date();
const month = d.getMonth();
const monthName = monthList[month];
const currMonth = (month + 1).toString().padStart(2, '0');

const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// In case of leap year
if ((d.getFullYear() % 4 === 0 && d.getFullYear() % 100 !== 0) || (d.getFullYear() % 400 === 0)) {
    monthDays[1] = 29;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Create a unique key for caching requests
function createCacheKey(type, params) {
    return `${type}_${JSON.stringify(params)}`;
}

// Check if data is in cache and still valid (less than 1 hour old)
function getValidCachedData(cacheKey) {
    if (cachedData[cacheKey]) {
        const now = new Date();
        const cachedTime = new Date(cachedData[cacheKey].timestamp);
        const ageInMs = now - cachedTime;
        const oneHourMs = 60 * 60 * 1000;
        
        if (ageInMs < oneHourMs) {
            console.log(`Using cached data for ${cacheKey}`);
            return cachedData[cacheKey].data;
        }
    }
    return null;
}

// Store data in cache with timestamp
function cacheData(cacheKey, data) {
    cachedData[cacheKey] = {
        data: data,
        timestamp: new Date().toISOString()
    };
}



export function generateSyntheticWeatherData(feature, index = 0) {
    let lat = 39.6295; 
    let lng = -79.9559; 
    
    try {
        if (feature.geometry) {
            if (feature.geometry.type === "MultiLineString") {
                if (feature.geometry.coordinates[0]?.length > 0) {
                    // Get center point for more representative location
                    const line = feature.geometry.coordinates[0];
                    const midIndex = Math.floor(line.length / 2);
                    [lng, lat] = line[midIndex];
                }
            } else if (feature.geometry.type === "LineString") {
                if (feature.geometry.coordinates.length > 0) {
                    const midIndex = Math.floor(feature.geometry.coordinates.length / 2);
                    [lng, lat] = feature.geometry.coordinates[midIndex];
                }
            }
        }
    } catch (error) {
        console.warn("Error extracting coordinates, using defaults:", error);
    }
    
    // Get current date info for seasonal variation
    const today = new Date();
    const month = today.getMonth();
    const monthList = ["January", "February", "March", "April", "May", "June", "July", 
        "August", "September", "October", "November", "December"];
    const monthName = monthList[month];
    
    // Add proper variation with a deterministic seed based on trail location, ID, and date
    const trailId = feature.properties?.trail_id || index;
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Include location data in the seed calculation
    const locationFactor = (lng) / 40;
    const baseSeed = trailId + dayOfYear + locationFactor;
    
    // Improved random function that produces different values for different properties
    const getRandomValue = (min, max, offset = 0) => {
        const seedWithOffset = baseSeed + offset;
        const x = Math.sin(seedWithOffset * 12345) * 10000;
        const rand = x - Math.floor(x); // value between 0-1
        return min + rand * (max - min);
    };
    
    try {
        const baseC = 58 - Math.abs(lng);
        const baseTempC = baseC < 0 ? -baseC : baseC;
        
        // Month affects temperature (seasonal variation)
        const monthFactor = Math.cos((month - 6) * Math.PI / 6);
        const tempAdjustment = 10 * monthFactor;
        
        // Calculate temp values with different offsets for variation
        const avgTemp = (baseTempC + tempAdjustment);
        const minTemp = (baseTempC + tempAdjustment - (10 - getRandomValue(0, 3, 1)));
        const maxTemp = (baseTempC + tempAdjustment + (5 + getRandomValue(0, 3, 2)));
        
        // Precipitation varies by month and location - use a different offset
        let precip = (2 + Math.sin(month * Math.PI / 6) * 2 + getRandomValue(0, 2, 3));
        if (month >= 5 && month <= 8) precip = (precip * 1.5); // More rain in summer
        
        // Humidity is related to precipitation and temperature - use another offset
        const humidity = (40 + precip - (2 * (12.8 - avgTemp)) + getRandomValue(-5, 5, 4));
        
        // Wind speed calculation with its own offset
        const baseWind = 8 - monthFactor * 2; // More wind in winter
        const windSpeed = baseWind + getRandomValue(-3, 5, 5);
        
        // Ensure min and max temperatures are properly ordered
        const maxy = maxTemp < 0 ? -maxTemp : maxTemp;
        const miny = minTemp < 0 ? -minTemp : minTemp;
        const finalMinTemp = Math.min(miny, maxy);
        const finalMaxTemp = Math.max(miny, maxy);
        
        // Convert temps to Fahrenheit and format all values
        return {
            precipitation: precip.toFixed(2),
            humidity: humidity.toFixed(2),
            temperature: {
                average: ((avgTemp < 0 ? -avgTemp : avgTemp) * 1.8 + 32).toFixed(2),
                max: ((finalMaxTemp < 0 ? -finalMaxTemp : finalMaxTemp) * 1.8 + 32).toFixed(2),
                min: ((finalMinTemp < 0 ? -finalMinTemp : finalMinTemp) * 1.8 + 32).toFixed(2)
            },
            windSpeed: windSpeed.toFixed(2),
            month: monthName,
            status: "Monthly average data",
            trailName: feature.properties?.Name || `Trail ${index + 1}`,
            isSynthetic: true,
        };
    } catch (error) {
        console.error("Error generating weather data:", error);
        return {
            precipitation: "0.00",
            humidity: "50.00",
            temperature: {
                average: "70.00",
                max: "85.00",
                min: "55.00"
            },
            windSpeed: "7.46",
            month: monthName,
            status: "Error loading data - using defaults",
            trailName: feature.properties?.Name || `Trail ${index + 1}`,
            isSynthetic: true
        };
    }
}

// Get zip code from IP with caching
async function getZipCode() {
    const cacheKey = createCacheKey('zipcode', {});
    const cachedZip = getValidCachedData(cacheKey);
    
    if (cachedZip) return cachedZip;
    
    try {
        const response = await fetch("https://ipgeolocation.abstractapi.com/v1/?api_key=" + zipKey);
        const data = await response.json();
        const zip = data.postal_code || "26505";
        cacheData(cacheKey, zip);
        return zip;
    } catch (error) {
        console.error("Error fetching ZIP code:", error);
        return "26505"; // If nothing else works use Morgantown 
    }
}

// Get climate data for specific trail coordinates with deduplication
export async function getTrailClimateData(trailFeature) {
    if (!trailFeature || !trailFeature.geometry) {
        console.log("No valid trail feature provided");
        return getClimateData(); // Fall back to user location
    }
    
    // Create a cache key based on coordinates
    let coordinateKey;
    try {
        if (trailFeature.geometry.type === "MultiLineString" && trailFeature.geometry.coordinates[0]?.length > 0) {
            coordinateKey = trailFeature.geometry.coordinates[0][0].join(',');
        } else if (trailFeature.geometry.type === "LineString" && trailFeature.geometry.coordinates.length > 0) {
            coordinateKey = trailFeature.geometry.coordinates[0].join(',');
        } else {
            throw new Error("Cannot extract coordinates");
        }
    } catch (error) {
        console.log("Error extracting coordinates:", error);
        return getClimateData();
    }
    
    const cacheKey = createCacheKey('trailClimate', { coordinates: coordinateKey });
    
    // Check for cached data
    const cachedTrailData = getValidCachedData(cacheKey);
    if (cachedTrailData) return cachedTrailData;
    
    // Check for pending request
    if (pendingRequests[cacheKey]) {
        console.log("Request already in progress for this trail, waiting...");
        return pendingRequests[cacheKey];
    }
    
    try {
        // Extract coordinates using geometry
        const coordinates = trailFeature.geometry.coordinates;
        
        let lat, lng;
        
        if (trailFeature.geometry.type === "MultiLineString") {
            if (coordinates.length > 0 && coordinates[0].length > 0) {
                [lng, lat] = coordinates[0][1];
            } else {
                console.log("Invalid MultiLineString coordinates");
                return getClimateData();
            }
        } else if (trailFeature.geometry.type === "LineString") {
            if (coordinates.length > 0) {
                [lng, lat] = coordinates[0];
            } else {
                console.log("Invalid LineString coordinates");
                return getClimateData();
            }
        } else {
            console.log("Unsupported geometry type:", trailFeature.geometry.type);
            return getClimateData();
        }
        
        // Create promise for this request
        pendingRequests[cacheKey] = getMonthlyAverageWeather(lat, lng);
        
        // Await the result
        const data = await pendingRequests[cacheKey];
        
        // Add trail name to the data
        const trailName = trailFeature.properties?.trailName || 
                          trailFeature.properties?.Name || 
                          "Selected Trail";
        
        const result = {
            ...data,
            trailName: trailName
        };
        
        // Cache the result
        cacheData(cacheKey, result);
        
        // Clear pending request
        delete pendingRequests[cacheKey];
        
        return result;
    } catch (error) {
        console.error("Error in getTrailClimateData:", error);
        // Clear pending request on error
        delete pendingRequests[cacheKey];
        
        return {
            precipitation: "0.00",
            humidity: "50.00",
            temperature: {
                average: "70.00",
                max: 85,
                min: 55
            },
            month: monthName,
            status: "Error loading trail data",
            trailName: "Selected Trail"
        };
    }
}

// Get climate data based on user location with caching
export async function getClimateData() {
    const cacheKey = createCacheKey('climateData', {});
    const cachedData = getValidCachedData(cacheKey);
    
    if (cachedData) return cachedData;
    
    const zip = await getZipCode();
    const result = await getClimateDataByZip(zip);
    
    cacheData(cacheKey, result);
    return result;
}

// Use approximate weather data based on latitude/longitude
async function getMonthlyAverageWeather(lat, lng) {
    const cacheKey = createCacheKey('weatherAvg', { lat, lng });
    const cachedData = getValidCachedData(cacheKey);
    
    if (cachedData) return cachedData;
    
    try {
        const baseTempC = 25 - Math.abs(lat - 30) * 0.5;
        
        // Month affects temperature (seasonal variation)
        const monthFactor = Math.cos((month - 6) * Math.PI / 6);
        const tempAdjustment = 10 * monthFactor;
        
        // Calculate temp values
        const avgTemp = (baseTempC + tempAdjustment).toFixed(2);
        const minTemp = (baseTempC + tempAdjustment - 5 - Math.random() * 3).toFixed(2);
        const maxTemp = (baseTempC + tempAdjustment + 5 + Math.random() * 3).toFixed(2);
        
        // Precipitation varies by month and location
        let precip = (2 + Math.sin(month * Math.PI / 6) * 2 + Math.random() * 2).toFixed(2);
        if (month >= 5 && month <= 8) precip = (parseFloat(precip) * 1.5).toFixed(2); // More rain in summer
        
        // Humidity is related to precipitation and temperature
        const humidity = (50 + parseFloat(precip) * 5 - (baseTempC - 20)).toFixed(2);
        
        const result = {
            precipitation: precip,
            humidity: humidity,
            temperature: {
                average: ((avgTemp < 0 ? -avgTemp : avgTemp) * 1.8 + 32),
                max: ((maxTemp < 0 ? -maxTemp : maxTemp) * 1.8 + 32),
                min: ((minTemp < 0 ? -minTemp : minTemp) * 1.8 + 32)
            },
            month: monthName,
            status: "Monthly average data"
        };
        
        cacheData(cacheKey, result);
        return result;
    } catch (error) {
        console.error("Error generating weather data:", error);
        return {
            precipitation: "0.00",
            humidity: "50.00",
            temperature: {
                average: "70.00",
                max: 85,
                min: 55
            },
            month: monthName,
            status: "Error loading data - using defaults"
        };
    }
}

// Gets by zip code for NOAA with improved caching (used only in case of complete error)
async function getClimateDataByZip(zip) {
    const cacheKey = createCacheKey('zipClimate', { zip });
    const cachedData = getValidCachedData(cacheKey);
    
    if (cachedData) return cachedData;
    
    try {
        console.log("Using ZIP:", zip);

        const startDate = 2022;
        const endDate = 2025;

        let TempTOT = 0;
        let TempMIN = 100;
        let TempMAX = 0;
        let rhavTOT = 0;
        let prcpTOT = 0;
        let dataCount = 0;

        for (let i = startDate; i < endDate; i++) {
            const url = `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GSOM&locationid=ZIP:${zip}&datatypeid=TAVG,TMIN,TMAX,PRCP,RHAV&startdate=${i}-${currMonth}-01&enddate=${i}-${currMonth}-01`;

            const results = await fetchNoaaData(url);

            // Checks for valid results
            if (!results || results.length === 0) {
                console.warn("No data returned for URL:", url);
                continue;
            }

            // Check if the current zip code has all the data required
            if (results.length !== 5) {
                console.warn("Incomplete data for ZIP, trying fallback...");

                for (let j = startDate; j < endDate; j++) {
                    const fallbackUrl = `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GSOM&locationid=ZIP:26505&datatypeid=TAVG,TMIN,TMAX,PRCP,RHAV&startdate=${j}-${currMonth}-01&enddate=${j}-${currMonth}-01`;
                    const fallbackResults = await fetchNoaaData(fallbackUrl);
                    
                    // Ensure fallbackResults is iterable
                    if (fallbackResults && Array.isArray(fallbackResults)) {
                        for (const entry of fallbackResults) {
                            switch (entry.datatype) {
                                case "PRCP":
                                    prcpTOT += entry.value;
                                    break;
                                case "RHAV":
                                    rhavTOT += entry.value;
                                    break;
                                case "TAVG":
                                    TempTOT += entry.value;
                                    break;
                                case "TMAX":
                                    if (entry.value > TempMAX) TempMAX = entry.value;
                                    break;
                                case "TMIN":
                                    if (entry.value < TempMIN) TempMIN = entry.value;
                                    break;
                            }
                        }
                        dataCount++;
                    }
                }

                break; // Break out of the loop after fallback
            }

            // Safer data parsing based on datatype
            for (const entry of results) {
                switch (entry.datatype) {
                    case "PRCP":
                        prcpTOT += entry.value;
                        break;
                    case "RHAV":
                        rhavTOT += entry.value;
                        break;
                    case "TAVG":
                        TempTOT += entry.value;
                        break;
                    case "TMAX":
                        if (entry.value > TempMAX) TempMAX = entry.value;
                        break;
                    case "TMIN":
                        if (entry.value < TempMIN) TempMIN = entry.value;
                        break;
                }
            }
            dataCount++;
        }

        // Ensure there's some sort of data
        if (dataCount === 0) {
            console.warn("No climate data found, returning synthetic values");
            const syntheticData = {
                precipitation: "0.00",
                humidity: "50.00",
                temperature: {
                    average: "70.00",
                    max: 85,
                    min: 55
                },
                month: monthName,
                status: "No data available - using defaults"
            };
            
            cacheData(cacheKey, syntheticData);
            return syntheticData;
        }

        const days = monthDays[month];
        
        // Datacount instead of weird hardcoded stuff
        const avgPrcp = (prcpTOT / (dataCount * days)).toFixed(2);
        const avgRhav = (rhavTOT / dataCount).toFixed(2);
        const avgTemp = (TempTOT / dataCount).toFixed(2);

        console.log("Avg PRCP:", avgPrcp);
        console.log("Avg RHAV:", avgRhav);
        console.log("Avg TEMP:", avgTemp);
        console.log("MAX TEMP:", TempMAX);
        console.log("MIN TEMP:", TempMIN);

        // Return as a data object
        const result = {
            precipitation: avgPrcp,
            humidity: avgRhav,
            temperature: {
                average: avgTemp,
                max: TempMAX,
                min: TempMIN
            },
            month: monthName,
            status: ""
        };
        
        cacheData(cacheKey, result);
        return result;
    } catch (error) {
        console.error("Error in getClimateData:", error);
        // Fallback in case an issue occurs so app won't crash
        const fallback = {
            precipitation: "0.00",
            humidity: "50.00",
            temperature: {
                average: "70.00",
                max: 85,
                min: 55
            },
            month: monthName,
            status: "Error loading data - using defaults"
        };
        
        cacheData(cacheKey, fallback);
        return fallback;
    }
}

// Get county FIPS code with caching
async function getCountyFIPScode(lat, lng) {
    const cacheKey = createCacheKey('fips', { lat, lng });
    const cachedData = getValidCachedData(cacheKey);
    
    if (cachedData) return cachedData;
    
    try {
        const url = `https://geo.fcc.gov/api/census/block/find?format=json&latitude=${lat}&longitude=${lng}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.County || !data.County.FIPS) {
            throw new Error("Missing county FIPS data in response");
        }

        const fips = data.County.FIPS;
        cacheData(cacheKey, fips);
        return fips;
    } catch (error) {
        console.error("Error fetching FIPs code:", error);
        return "54061"; // Fallback: Morgantown WV county FIPS
    }
}

// Gets climate data by county with timeout
async function getClimateDataByCounty(FIPS, latitude, longitude) {
    const cacheKey = createCacheKey('countyClimate', { FIPS });
    const cachedData = getValidCachedData(cacheKey);
    
    if (cachedData) return cachedData;
    
    // Start the timer at the beginning of the function
    const startTime = Date.now();
    
    console.log("Using FIPS code: " + FIPS);
    const today = new Date();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 3);

    const tenDaysBefore = new Date(today);
    tenDaysBefore.setDate(today.getDate() - 6);

    const formattedYesterday = formatDate(yesterday);
    const formattedTenDaysBefore = formatDate(tenDaysBefore);

    // Get synthetic weather data for fallback
    const syntheticFeature = {
        geometry: {
            type: "LineString",
            coordinates: [[latitude, longitude]] 
        }
    };
    
    // Generate synthetic data as fallback
    const syntheticData = generateSyntheticWeatherData(syntheticFeature);

    try {
        let TempMIN = 100;
        let TempMAX = 0;
        let TempTOT = 0;
        let TempCount = 0;
        let prcpTOT = 0;
        let prcpCount = 0;
        let awndTOT = 0;
        let awndCount = 0;
        let dataCount = 0;

        const url = `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&locationid=FIPS:${FIPS}&datatypeid=TMAX,TMIN,PRCP,AWND&units=standard&startdate=${formattedTenDaysBefore}&enddate=${formattedYesterday}&limit=100`;
        console.log(url);
        const results = await fetchNoaaData(url);
        const elapsedTime = Date.now() - startTime;
        
        if (results && Array.isArray(results) && results.length >= 1 && elapsedTime < 15000) {
            for (const entry of results) {
                switch (entry.datatype) {
                    case "PRCP":
                        prcpTOT += entry.value;
                        prcpCount++;
                        break;
                    case "TMAX":
                        TempTOT += entry.value;
                        TempCount++;
                        if (entry.value > TempMAX) TempMAX = entry.value;
                        break;
                    case "TMIN":
                        TempTOT += entry.value;
                        TempCount++;
                        if (entry.value < TempMIN) TempMIN = entry.value;
                        break;
                    case "AWND":
                        awndTOT += entry.value;
                        awndCount++;
                }
                dataCount++;
            }
        }

        if (dataCount === 0 || results?.length === 0 || elapsedTime > 15000) {
            console.warn(dataCount === 0 || results?.length === 0 ? 
                "No climate data found, using synthetic values" : 
                `Request took too long (${elapsedTime}ms), using synthetic data instead`);
                
            const fallback = {
                precipitation: syntheticData.precipitation,
                temperature: {
                    avg: syntheticData.temperature.average,
                    max: syntheticData.temperature.max,
                    min: syntheticData.temperature.min
                },
                windSpeed: syntheticData.windSpeed,
                humidity: syntheticData.humidity,
                month: monthName,
                status: elapsedTime > 15000 ? 
                    "Using synthetic weather model - request timeout" : 
                    "Using synthetic weather model - no actual data available"
            };
            
            cacheData(cacheKey, fallback);
            return fallback;
        }

        // Data count instead of weird hardcoded stuff
        const avgPrcp = (25.4 * (prcpTOT / prcpCount)).toFixed(2);
        const avgWind = (awndTOT / awndCount).toFixed(2);
        const avgTemp = (TempTOT / TempCount).toFixed(2);

        console.log("precipitation count:", prcpCount);
        console.log("wind count:", awndCount);
        console.log("Avg PRCP:", avgPrcp);
        console.log("Avg TEMP:", avgTemp);
        console.log("MAX TEMP:", TempMAX);
        console.log("MIN TEMP:", TempMIN);
        console.log("Avg Wind Speed:", avgWind);

        // Return as a data object
        const result = {
            precipitation: prcpCount > 0 ? avgPrcp : syntheticData.precipitation,
            temperature: {
                avg: (TempCount > 0 ? avgTemp : syntheticData.temperature.average),
                max: (TempCount > 0 ? TempMAX : syntheticData.temperature.max),
                min: (TempCount > 0 ? TempMIN : syntheticData.temperature.min)
            },
            windSpeed: (awndCount > 0 ? avgWind : syntheticData.windSpeed),
            humidity: TempCount > 0 ? 
                (50 + parseFloat(avgPrcp) * 3 - ((avgTemp - 65) / 3)).toFixed(2) : 
                syntheticData.humidity,
            month: monthName,
            status: ""
        };
        
        cacheData(cacheKey, result);
        return result;
    } catch (error) {
        console.error("Error in getClimateData:", error);
        // Fallback in case an issue occurs
        const fallback = {
            precipitation: syntheticData.precipitation,
            temperature: {
                avg: syntheticData.temperature.average,
                max: syntheticData.temperature.max,
                min: syntheticData.temperature.min
            },
            windSpeed: syntheticData.windSpeed,
            humidity: syntheticData.humidity,
            month: monthName,
            status: "Using synthetic weather model - error retrieving data"
        };
        
        cacheData(cacheKey, fallback);
        return fallback;
    }
}

// Get trail climate data using county FIPS code with caching
export async function getTrailClimateDataByCounty(trailFeature) {
    if (!trailFeature || !trailFeature.geometry) {
        console.log("No valid trail feature provided");
        return getClimateData();
    }
    
    // Create a cache key based on feature ID or coordinates
    const featureIdentifier = trailFeature.properties?.trail_id || 
                            trailFeature.properties?.Name || 
                            JSON.stringify(trailFeature.geometry.coordinates[0]);
    
    const cacheKey = createCacheKey('trailCountyClimate', { feature: featureIdentifier });
    
    // Check cache first
    const cachedData = getValidCachedData(cacheKey);
    if (cachedData) return cachedData;
    
    // Check for pending request
    if (pendingRequests[cacheKey]) {
        console.log("Request already in progress for this trail, waiting...");
        return pendingRequests[cacheKey];
    }
    
    // Generate synthetic data as fallback
    const syntheticData = generateSyntheticWeatherData(trailFeature);
    
    try {
        // Create a promise for this request
        const requestPromise = (async () => {
            // Extract coordinates from the trail geometry
            const coordinates = trailFeature.geometry.coordinates;
            
            let lat, lng;
            
            if (trailFeature.geometry.type === "MultiLineString") {
                if (coordinates.length > 0 && coordinates[0].length > 0) {
                    // For MultiLineString, get center point for a better representation
                    const line = coordinates[0];
                    const midIndex = Math.floor(line.length / 2);
                    [lng, lat] = line[midIndex];
                } else {
                    throw new Error("Invalid MultiLineString coordinates");
                }
            } else if (trailFeature.geometry.type === "LineString") {
                if (coordinates.length > 0) {
                    // For LineString, get center point
                    const midIndex = Math.floor(coordinates.length / 2);
                    [lng, lat] = coordinates[midIndex];
                } else {
                    throw new Error("Invalid LineString coordinates");
                }
            } else {
                throw new Error("Unsupported geometry type: " + trailFeature.geometry.type);
            }
            
            // Get the county FIPS code for the trail coordinates
            const fipsCode = await getCountyFIPScode(lat, lng);
            
            // Get climate data by county
            const countyData = await getClimateDataByCounty(fipsCode, lat, lng);
            
            // Add trail name to the data
            const trailName = trailFeature.properties?.trailName || 
                            trailFeature.properties?.Name || 
                            "Selected Trail";
            
            // Format data to match what the UI expects
            return {
                precipitation: countyData.precipitation || "0.00",
                temperature: {
                    average: countyData.temperature?.avg || countyData.temperature?.average || "65.00",
                    max: countyData.temperature?.max || 85,
                    min: countyData.temperature?.min || 55
                },
                month: countyData.month || monthName,
                status: countyData.status || "",
                trailName: trailName,
                windSpeed: countyData.windSpeed || "5.40",
                humidity: countyData.humidity || "50.00"
            };
        })();
        
        pendingRequests[cacheKey] = requestPromise;
        
        const result = await requestPromise;
        
        cacheData(cacheKey, result);
        
        // Remove from pending requests
        delete pendingRequests[cacheKey];
        
        return result;
    } catch (error) {
        console.error("Error in getTrailClimateDataByCounty:", error);
        
        // Remove from pending requests on error
        delete pendingRequests[cacheKey];
        
        const fallback = {
            precipitation: syntheticData.precipitation,
            humidity: syntheticData.humidity,
            temperature: {
                average: syntheticData.temperature.average,
                max: syntheticData.temperature.max,
                min: syntheticData.temperature.min
            },
            windSpeed: syntheticData.windSpeed,
            month: monthName,
            status: "Error loading trail data",
            trailName: trailFeature.properties?.Name || "Selected Trail"
        };
        
        cacheData(cacheKey, fallback);
        return fallback;
    }
}

// Fetch NOAA data with timeout and abort control
let abortControllers = {};

async function fetchNoaaData(url) {
    const requestKey = url;
    
    if (abortControllers[requestKey]) {
        abortControllers[requestKey].abort();
    }
    
    abortControllers[requestKey] = new AbortController();
    const signal = abortControllers[requestKey].signal;
    
    try {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                if (abortControllers[requestKey]) {
                    abortControllers[requestKey].abort();
                }
                reject(new Error('Request timed out after 20 seconds'));
            }, 15000);
        });

        const response = await Promise.race([
            fetch(url, {
                method: "GET",
                headers: {
                    token: tokenFromNoaa
                },
                signal: signal
            }),
            timeoutPromise
        ]);

        // Clean up
        delete abortControllers[requestKey];

        if (!response.ok) {
            console.error(`NOAA API error: ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        delete abortControllers[requestKey];
        
        console.error("Error fetching NOAA data:", error.message || error);
        return null;
    }
}