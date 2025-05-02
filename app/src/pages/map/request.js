/**
 * request.js
 * 
 * This file gives NOAA the user's zipcode or coordinates and the current month to request Climate Data.
 * We use data from past years to estimate what the current month's climate data looks like.
 * Data includes: precipitation, temperature averages, and relative humidity.
 * It then stores this data as an array on the browser.
 */

const monthList = ["January", "February", "March", "April", "May", "June", "July", 
    "August", "September", "October", "November", "December"];

const d = new Date();
const month = d.getMonth();
const monthName = monthList[month];
const currMonth = (month + 1).toString().padStart(2, '0');

const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

//In case of leap year
if ((d.getFullYear() % 4 === 0 && d.getFullYear() % 100 !== 0) || (d.getFullYear() % 400 === 0)) {
    monthDays[1] = 29;
}

function formatDate(date) {
    const year = date.getFullYear();
    // getMonth() is zero-indexed, so add 1
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}


const tokenFromNoaa = "zRJaCOXTyBqXhvrDQMFapLNnZiFBGoNe";
const zipKey = "2db231e368124778ae3517c281ea41aa";

// Get zip code from IP
async function getZipCode() {
    try {
        const response = await fetch("https://ipgeolocation.abstractapi.com/v1/?api_key=" + zipKey);
        const data = await response.json();
        return data.postal_code || "26505"; 
    } catch (error) {
        console.error("Error fetching ZIP code:", error);
        return "26505"; //if nothing else works use motown 
    }
}

//get climate data for specific trail coordinates
export async function getTrailClimateData(trailFeature) {
    try {
        if (!trailFeature || !trailFeature.geometry || !trailFeature.geometry.coordinates) {
            console.log("No valid trail feature provided");
            return getClimateData(); //fall back to user location
        }
        
        //extracts coordinates using geomtry (thank you stack overflow)
        const coordinates = trailFeature.geometry.coordinates;
        
        let lat, lng;
        
        if (trailFeature.geometry.type === "MultiLineString") {
            if (coordinates.length > 0 && coordinates[0].length > 0) {
                [lng, lat] = coordinates[0][0];
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
        
        console.log("Trail coordinates:", lat, lng);
        
        const data = await getMonthlyAverageWeather(lat, lng);
        
        // Add trail name to the data
        const trailName = trailFeature.properties?.trailName || 
                          trailFeature.properties?.Name || 
                          "Selected Trail";
        
        return {
            ...data,
            trailName: trailName
        };
    } catch (error) {
        console.error("Error in getTrailClimateData:", error);
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

// Get climate data based on user location (no coordinates provided)
//Used as fallback in case of error
export async function getClimateData() {
    const zip = await getZipCode();
    return getClimateDataByZip(zip);
}

// Use approximate weather data based on latitude/longitude
async function getMonthlyAverageWeather(lat, lng) {
    try {
        //Generate weather data based on location and month
        //This is a simplified model - in a real app, you might use a more sophisticated weather API
        
        //Latitude affects temperature (higher latitude = cooler)
        const baseTempC = 25 - Math.abs(lat - 30) * 0.5;
        
        //Month affects temperature (seasonal variation)
        const monthFactor = Math.cos((month - 6) * Math.PI / 6);
        const tempAdjustment = 10 * monthFactor;
        
        //calculate temp values
        const avgTemp = (baseTempC + tempAdjustment).toFixed(2);
        const minTemp = (baseTempC + tempAdjustment - 5 - Math.random() * 3).toFixed(2);
        const maxTemp = (baseTempC + tempAdjustment + 5 + Math.random() * 3).toFixed(2);
        
        // Precipitation varies by month and location
        let precip = (2 + Math.sin(month * Math.PI / 6) * 2 + Math.random() * 2).toFixed(2);
        if (month >= 5 && month <= 8) precip = (parseFloat(precip) * 1.5).toFixed(2); // More rain in summer
        
        // Humidity is related to precipitation and temperature so do math for it
        const humidity = (50 + parseFloat(precip) * 5 - (baseTempC - 20)).toFixed(2);
        console.log("Current month for synthetic data: " + month);
        
        return {
            precipitation: precip,
            humidity: humidity,
            temperature: {
                average: ((avgTemp < 0 ? -avgTemp : avgTemp) * 1.8 +32),
                max: ((maxTemp < 0 ? -maxTemp : maxTemp) * 1.8 +32),
                min: ((minTemp < 0 ? -minTemp : minTemp) * 1.8 +32)
            },
            month: monthName,
            status: "Monthly average data"
        };
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


//gets by zip code for NOAA 
async function getClimateDataByZip(zip) {
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

            //checks for valid results
            if (!results || results.length === 0) {
                console.warn("No data returned for URL:", url);
                continue;
            }

            //check if the current zip code has all the data required if not then idk what to do
            if (results.length !== 5) {
                console.warn("Incomplete data for ZIP, trying fallback...");

                for (let j = startDate; j < endDate; j++) {
                    const fallbackUrl = `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GSOM&locationid=ZIP:26505&datatypeid=TAVG,TMIN,TMAX,PRCP,RHAV&startdate=${j}-${currMonth}-01&enddate=${j}-${currMonth}-01`;
                    const fallbackResults = await fetchNoaaData(fallbackUrl);
                    
                    // nsure fallbackResults is iterable
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

                break; // break out of the loop after fallback
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

            console.log("URL:", url);
        }

        //ensure theres some sort of data if u cant fetch so app doesnt crash again!
        if (dataCount === 0) {
            console.warn("No climate data found, returning synthetic values");
            return {
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
        }

        const days = monthDays[month];
        
        //datacount instead of weird hardcoded stuff
        const avgPrcp = (prcpTOT / (dataCount * days)).toFixed(2);
        const avgRhav = (rhavTOT / dataCount).toFixed(2);
        const avgTemp = (TempTOT / dataCount).toFixed(2);

        console.log("Avg PRCP:", avgPrcp);
        console.log("Avg RHAV:", avgRhav);
        console.log("Avg TEMP:", avgTemp);
        console.log("MAX TEMP:", TempMAX);
        console.log("MIN TEMP:", TempMIN);

        //return as a data object
        return {
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
    } catch (error) {
        console.error("Error in getClimateData:", error);
        // fallback incase an issue occurs so app wont crash lol
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



async function getCountyFIPScode(lat, lng) {
    try {
        const url = `https://geo.fcc.gov/api/census/block/find?format=json&latitude=${lat}&longitude=${lng}`;
        const response = await fetch(url);
        console.log(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.County || !data.County.FIPS) {
            throw new Error("Missing county FIPS data in response");
        }

        return data.County.FIPS;
    } catch (error) {
        console.error("Error fetching FIPs code:", error);
        return "54061"; // fallback: Morgantown WV county FIPS
    }
}


//gets by zip code for NOAA 
async function getClimateDataByCounty(FIPS, latitude, longitude) {
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

    console.log("Yesterday:", formattedYesterday);
    console.log("Ten days before yesterday:", formattedTenDaysBefore);

    const syntheticFeature = {
        geometry: {
            type: "LineString",
            coordinates: [[latitude, longitude]]
        }
    };
    // Get synthetic weather data
    const syntheticData = await getTrailClimateData(syntheticFeature);

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
            if (results && Array.isArray(results) && results.length >= 1 && elapsedTime < 20000) {
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

        if (dataCount === 0 || results.length === 0 || results === null || elapsedTime > 20000) {
            console.warn(dataCount === 0 || results.length === 0 ? 
                "No climate data found, generating synthetic values" : 
                `Request took too long (${elapsedTime}ms), using synthetic data instead`);
                
            // Create a simple synthetic feature with default coordinates
            // We'll use coordinates for Morgantown, WV as a fallback
                
            return {
                precipitation: syntheticData.precipitation.toFixed(2),
                temperature: {
                    avg: syntheticData.temperature.average.toFixed(2),
                    max: syntheticData.temperature.max.toFixed(2),
                    min: syntheticData.temperature.min.toFixed(2)
                },
                windSpeed: (Math.random() * (8 - 3) + 3).toFixed(2), 
                month: monthName,
                status: elapsedTime > 20000 ? 
                    "Using synthetic weather model - request timeout" : 
                    "Using synthetic weather model - no actual data available"
            };
        }

        
        //datacount instead of weird hardcoded stuff
        const avgPrcp = (25.4 * (prcpTOT / prcpCount)).toFixed(2);
        const avgWind = (awndTOT / awndCount).toFixed(2);
        const avgTemp = (TempTOT / TempCount).toFixed(2);

        console.log("p "+prcpCount);
        console.log("a "+awndCount);

        console.log("Avg PRCP:", avgPrcp);
        console.log("Avg TEMP:", avgTemp);
        console.log("MAX TEMP:", TempMAX);
        console.log("MIN TEMP:", TempMIN);
        console.log("Avg Wind Speed:", avgWind);

        //return as a data object
        return {
            precipitation: prcpCount > 0 ? avgPrcp : syntheticData.precipitation.toFixed(2),
            temperature: {
                avg: (TempCount > 0 ? avgTemp : syntheticData.temperature.average.toFixed(2)),
                max: (TempCount > 0 ? TempMAX : syntheticData.temperature.max.toFixed(2)),
                min: (TempCount > 0 ? TempMIN : syntheticData.temperature.min.toFixed(2))
            },
            windSpeed: (awndCount > 0 ? avgWind : (Math.random() * (8 - 3) + 3).toFixed(2)),
            month: monthName,
            status: ""
        };

    } catch (error) {
        console.error("Error in getClimateData:", error);
        // fallback incase an issue occurs so app wont crash lol
        return {
            precipitation: 0.0, //syntheticData.precipitation.toFixed(2),
            temperature: {
                avg: 50.0, //syntheticData.temperature.average.toFixed(2),
                max: 0, //syntheticData.temperature.max.toFixed(2),
                min: 80//syntheticData.temperature.min.toFixed(2)
            },
            windSpeed: 30, //(Math.random() * (8 - 3) + 3).toFixed(2), 
            month: monthName,
            status: "Using synthetic weather model - no actual data available"
        };
    }
}

// New function to get trail climate data using county FIPS code
export async function getTrailClimateDataByCounty(trailFeature) {
    const syntheticFeature = {
        geometry: {
            type: "LineString",
            coordinates: [[-79.9559, 39.6295]] // Default Morgantown coordinates
        }
    };
        // Get synthetic weather data
    const syntheticData = await getTrailClimateData(syntheticFeature);
    
    try {
        if (!trailFeature || !trailFeature.geometry || !trailFeature.geometry.coordinates) {
            console.log("No valid trail feature provided");
            return getClimateData(); // Fall back to user location
        }
        
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
                console.log("Invalid MultiLineString coordinates");
                return getClimateData();
            }
        } else if (trailFeature.geometry.type === "LineString") {
            if (coordinates.length > 0) {
                // For LineString, get center point
                const midIndex = Math.floor(coordinates.length / 2);
                [lng, lat] = coordinates[midIndex];
            } else {
                console.log("Invalid LineString coordinates");
                return getClimateData();
            }
        } else {
            console.log("Unsupported geometry type:", trailFeature.geometry.type);
            return getClimateData();
        }
        
        console.log("Trail coordinates for FIPS lookup:", lat, lng);
        
        // Get the county FIPS code for the trail coordinates
        const fipsCode = await getCountyFIPScode(lat, lng);
        console.log("County FIPS code for trail:", fipsCode);
        
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
            windSpeed: countyData.windSpeed || "5.40" ,
            humidity: (((50 + parseFloat(countyData.precipitation || 0) * 2) / 2) + 
                ((countyData.temperature?.avg || countyData.temperature?.average || 50) / 2)).toFixed(2)
        };
    } catch (error) {
        console.error("Error in getTrailClimateDataByCounty:", error);
        return {
            precipitation: (Math.random() * (7 - 1) + 3).toFixed(2),
            humidity: (Math.random() * (70 - 40) + 40).toFixed(2),
            temperature: {
                average: (Math.random() * (70 - 55) + 55).toFixed(2),
                max: (Math.random() * (85 - 70) + 70).toFixed(2),
                min: (Math.random() * (55 - 40) + 40).toFixed(2)
            },
            windSpeed: (Math.random() * (8 - 3) + 3).toFixed(2),
            month: monthName,
            status: "Error loading trail data",
            trailName: "Selected Trail"
        };
    }
}


async function fetchNoaaData(url) {
    try {
        // Create a promise that rejects after 20 seconds
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Request timed out after 20 seconds'));
            }, 20000);
        });

        // Race the fetch against the timeout
        const response = await Promise.race([
            fetch(url, {
                method: "GET",
                headers: {
                    token: tokenFromNoaa
                }
            }),
            timeoutPromise
        ]);

        if (!response.ok) {
            console.error(`NOAA API error: ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Error fetching NOAA data:", error.message || error);
        return null;
    }
}