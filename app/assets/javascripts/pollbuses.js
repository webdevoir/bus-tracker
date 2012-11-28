
var request = false;

try {
 request = new XMLHttpRequest();
} catch (trymicrosoft) {
 try {
   request = new ActiveXObject("Msxml2.XMLHTTP");
 } catch (othermicrosoft) {
   try {
     request = new ActiveXObject("Microsoft.XMLHTTP");
   } catch (failed) {
     request = false;
   }  
 }
}

if (!request)
 alert("Error initializing XMLHttpRequest!");

function poll(){
    show_debug('polling...');
    var url = "/buses.json"
    request.onreadystatechange = newBusPositions
    request.open("GET", url, true);
    request.send(null);
    show_debug('sent request..');
}

function pollStops(){
    //stops
    var url = "/stops.json"
    request.onreadystatechange = newStopPositions
    request.open("GET", url, true);
    request.send(null);
}

function newpositions()
{
    show_debug("received response, state "+request.readyState);
    if (request.readyState == 4) {
        if(request.status == 200){
            var positionsJSON = jQuery.parseJSON(request.responseText);
            //updateMarkeres is defined in mapbuses.js
            show_debug("updating markers... ");
            updateMarkers(positionsJSON);
            show_debug("(done)");
        }else{
            //alert("HTTP status: "+request.status);
        }
        show_debug("resetting timeout... ");
        setTimeout(poll, 10000);
    }
}

function newStopPositions()
{   
    if (request.readyState == 4) {
        if(request.status == 200){
            var positionsJSON = jQuery.parseJSON(request.responseText);
            //updateMarkeres is defined in mapBuses.js
            updateStopMarkers(positionsJSON);
        }else{
            //alert("HTTP status: "+request.status);
        }
        setTimeout(pollStops, 10000);
    }
}