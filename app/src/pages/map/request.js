/**
 * request.js
 * 
 * This file gives NOAA the user's zipcode and the current month to request Climate Data.
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
const zip = await getZipCode();

//In case of leap year
if ((d.getFullYear() % 4 === 0 && d.getFullYear() % 100 !== 0) || (d.getFullYear() % 400 === 0)) {
    monthDays[1] = 29;
}

const tokenFromNoaa = "zRJaCOXTyBqXhvrDQMFapLNnZiFBGoNe";
const zipKey = "1deae9cf9cd74ef0b825b997814ef02d";

async function getZipCode() {
    try {
        const response = await fetch("https://ipgeolocation.abstractapi.com/v1/?api_key=" + zipKey);
        const data = await response.json();
        return data.postal_code;
    } catch (error) {
        console.error("Error fetching ZIP code:", error);
        return "26505"; // Default to Morgantown ZIP
    }
}

async function fetchNoaaData(url) {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                token: tokenFromNoaa
            }
        });

        if (!response.ok) {
            console.error(`NOAA API error: ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Error fetching NOAA data:", error);
        return [];
    }
}

export async function getClimateData() {
    try {
        //const zip = await getZipCode();
        console.log("Using ZIP:", zip);

        const startDate = 2020;
        const endDate = 2024;

        let TempTOT = 0;
        let TempMIN = 100;
        let TempMAX = 0;
        let rhavTOT = 0;
        let prcpTOT = 0;
        let dataCount = 0;

        for (let i = startDate; i < endDate; i++) {
            const url = `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GSOM&locationid=ZIP:${zip}&datatypeid=TAVG,TMIN,TMAX,PRCP,RHAV&startdate=${i}-${currMonth}-01&enddate=${i}-${currMonth}-01`;

            const results = await fetchNoaaData(url);

            // Check if we have any valid results
            if (!results || results.length === 0) {
                console.warn("No data returned for URL:", url);
                continue;
            }

            //check if the current zip code has all the data required,
            //if not, we fallback to Morgantown (26505) data
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

                break; // Stop the loop after fallback
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

        // Ensure we have at least some data
        if (dataCount === 0) {
            console.warn("No climate data found, returning default values");
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
        
        // Use dataCount instead of hardcoded 5
        const avgPrcp = (prcpTOT / (dataCount * days)).toFixed(2);
        const avgRhav = (rhavTOT / dataCount).toFixed(2);
        const avgTemp = (TempTOT / dataCount).toFixed(2);

        console.log("Avg PRCP:", avgPrcp);
        console.log("Avg RHAV:", avgRhav);
        console.log("Avg TEMP:", avgTemp);
        console.log("MAX TEMP:", TempMAX);
        console.log("MIN TEMP:", TempMIN);

        // Return the climate data object
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
        // Return default values in case of error
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