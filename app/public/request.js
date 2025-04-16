/**
 * NOAArequest.js
 * 
 * This file gives NOAA the user's zipcode and the current month to request CLimate Data
 * We use data from 2019 to get an estimate of what the current months climate data looks like
 * Data includes: precipitation, temperature averages, and relative humidity
 * It then stores this data as an array on the browser
 */


//Current month is given as a number (0 - 11), so an array is used for month names
const monthList = ["January", "February", "March", "April", "May", "June", "July", 
    "August", "September", "October", "November", "December"];


//determine the current month, this will be used in the NOAA url                    
const d = new Date();
const month = d.getMonth();
let monthName = monthList[month];

//date.getMonth() returns 0 - 11 for the month, so add 1
//NOAA can't handle a 1-digit input for month, so we add on a 0 for 1-digit months
const currMonth = (month + 1).toString().padStart(2, '0');


/*
NOAA stores data differently depending on the month, so different months
require different offsets to ensure consistent and correct sequencing
(i.e precipitation data at the top, with temperature data at the bottom)
the offset determines what specific endpoints we want NOAA to return

offset 25: November (11)
offset 26: february, march, october, december (2, 3, 10, 12)
offset 27: jan, april, may, june, july, august, september (1, 4, 5, 6, 7, 8, 9)
*/
const offsetList = [27, 26, 26, 27, 27, 27, 27, 27, 27, 26, 25, 26];
const currOffset = offsetList[month];



//Use the IPGeolocation API to get user ip - returns data like coordinates and postal code
fetch("https://ipgeolocation.abstractapi.com/v1/?api_key=1deae9cf9cd74ef0b825b997814ef02d")
    .then(response => response.json())
    .then(data => {
    //Log the postal code
    console.log(data.postal_code);
    const zip = data.postal_code;

    //URL used make a reuest to NOAA - 
    //Includes paramaters like what dataset is used, zipcode, etc
    var noaaUrl = "https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GSOM&locationid=ZIP:" 
    + zip + "&startdate=2019-" + currMonth + "-01&enddate=2019-" + currMonth + "-01&limit=7&offset=" + currOffset;

    //Personal Token that is used to authenticate the request to the NOAA server
    var tokenFromNoaa = "zRJaCOXTyBqXhvrDQMFapLNnZiFBGoNe";

    //AJAX used to log requested NOAA data inside the browser
    $.ajax({
        url: noaaUrl,
        //Token passed as a header
        headers:{
            token: tokenFromNoaa
        },
        success: function(returnedData) {
            //log to console
            console.log(returnedData);
        }
    })

});
