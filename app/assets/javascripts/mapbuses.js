/*
* Draws using the map with id map_canvas in buses/index.html.erb
* This is the google API key, required to use their maps API
* google api:  AIzaSyAAQDOZpCb33qnlU5xcBmf_n8CQ4p_qg6s
*/

/*
 * Variables inserted by Rails in map/index.html.erb
 *
    var routes=<%=raw insert_routes %>;
    var routeColors=<%= raw insert_route_colors %>;
    var map;
    var busLocations;
*/
var markers = {};

/*
 * openinfo is used to make sure there's only one open info window at any given time
 * when opening a new window, if this isn't null, it will be closed and then reassinged
*/
var openinfo;
var routeKML = [];
var routePath=null;
var stopMarkers=[];

var activeRoute=null;
var filter_buses=false;

function drawRoutesKML() {
  routeKML[0] = new google.maps.KmlLayer('http://iancwill.com/1.kmz?new4plz',{preserveViewport: true});
  routeKML[0].setMap(map);
  routeKML[1] = new google.maps.KmlLayer('http://iancwill.com/2.kmz?new4plz',{preserveViewport: true});
  routeKML[1].setMap(map);
  routeKML[2] = new google.maps.KmlLayer('http://iancwill.com/3.kmz?new4plz',{preserveViewport: true});
  routeKML[2].setMap(map);
  routeKML[3] = new google.maps.KmlLayer('http://iancwill.com/4.kmz?new4plz',{preserveViewport: true});
  routeKML[3].setMap(map);
  show_debug("Loaded route KML...");

  for(var i=0; i<routeKML.length; i++){
    google.maps.event.addListener(routeKML[i], 'click', function(kmlEvent) {
      var routeid=kmlEvent.featureData.name;
      primeRoute(routeid);
    });
  }
}

function primeAndFocus(routeid)
{
  primeRoute(routeid);
  focusRoute();
}

// This is called from the KML layer callback for routes, and also from the 
// info window focus for a bus (the Focus button action, defined in buses/show.html.erb points here)
function primeRoute(routeid)
{
  activeRoute=routeid;
  $("#show_all").text("Show Only Route "+activeRoute);
  $("#show_all").unbind("click", showAll);
  $("#show_all").bind("click", focusRoute);
}

function focusRoute(){
      var routeid=activeRoute;
      if(activeRoute == null){
        return;
      }
      $.getScript("routes/busroute"+routeid+".json", drawRoute);
      filter_buses=true;
      hideRouteKML();
      filterBusMarkers();
      showStops();
      $("#show_all").text("Show All");
      $("#show_all").unbind("click", focusRoute);
      $("#show_all").bind("click", showAll);
}

function showAll(){
  activeRoute=null;
  filter_buses=false;
  updateBusMarkers();
  hideStops();
  showRouteKML();
  showFilterRoute();
  clearRoutePath();
}

function clearRoutePath()
{
  if(routePath != null)
  {
    for(var i=0; i<routePath.length; i++)
    {
      routePath[i].setMap(null);
    }
  }
}

function colorForRoute(route_id){
  color_key = route_id.replace(/[a-z].*/, '');
  color=routeColors[color_key]
  if(color == undefined){
    show_debug("Warning, route color for "+color_key+" not defined, generating random color...")
    color=get_random_color();
    routeColors[color_key]=color;
  }
  //KML uses BGR rather than RGB colors, so to get them to match
  // we flip it here (from BGR to RGB)...
  return color.substring(4,6)+color.substring(2,4)+color.substring(0,2);
}

function drawRoute() {
//load the given route and plot it....
  
  //Sometimes direction0 is null....
  clearRoutePath();
  routePath=[]
  if(RouteDetails.Direction0 != null)
  {
    routePath.push(drawShape(RouteDetails.Direction0.Shape));
  }
  if(RouteDetails.Direction1 != null)
  {
    routePath.push(drawShape(RouteDetails.Direction1.Shape));
  }
}

function drawShape(shape){
  var routeCoordinates=[];
  for (var i=0; i<shape.length; i++)
  {
    routeCoordinates[i] = new google.maps.LatLng(shape[i].Lat, shape[i].Lon);
  }
  color = colorForRoute(RouteDetails.RouteID);
  var rp = new google.maps.Polyline({
    path: routeCoordinates,
    strokeColor: '#'+color,
    strokeOpacity: 0.9,
    strokeWeight: 6
  });
  rp.setMap(map);
  return rp;
}

function filterBusMarkers()
{
  if(buses == null){
    return;
  }
  showFilterRoute();
  for(var i=0; i<buses.length; i++){
    bus=buses[i];
    if(markers[bus.busid] != null){
      if(shouldHide(bus))
      {
        markers[bus.busid].setMap(null);
      }
    }
  }

}

function showFilterRoute()
{
  if(activeRoute == null)
  {
    $("#menu_status_area").text("Showing all routes");
  }else{
    $("#menu_status_area").text("Showing route "+activeRoute);
  }
}

function shouldHide(bus){
  return (filter_buses && activeRoute != null) && (bus.wmataid != activeRoute);
}

function hideRouteKML()
{
  for(var i=0; i<routeKML.length; i++){
    routeKML[i].setMap(null);  
  }
}


function showRouteKML()
{
  for(var i=0; i<routeKML.length; i++){
    routeKML[i].setMap(map);
  }
}

function updateBusMarkers(){
  if(buses == null || buses.length == 0)
  {
    return
  }
  for(var i=0; i<buses.length; i++)
  {
    //buses
    bus=buses[i];
    
    if(bus != null){      
      busTime=parseISO8601(bus.last_update);
      if(isAncient(busTime) || shouldHide(bus)){
        //remove bus
        if(markers[bus.busid] != null){
          markers[bus.busid].setMap(null);
        }
      }else{
        drawBus(bus);
      }
    }
  }

  var myDate = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
  show_debug("Showing "+buses.length+" buses at "+myDate);
}

function showStops(){
  if(activeRoute == null)
  {
    return;
  }
  show_debug("Polling stops...");
  pollStops(activeRoute);
}

function hideStops(){
  for(var i=0; i<stopMarkers.length; i++){
    stopMarkers[i].setMap(null);
  }
  stopMarkers=[];
}

function updateStopMarkers(stops){
  show_debug("Got some stops to draw...");
  for (var i=0; i<stops.length; i++)
  {
      //stops
      stop = stops[i];
      var marker = drawStop(stop);
      setStopInfoWindow(marker, stops[i]);
      stopMarkers.push(marker);
  }
  show_debug("Showing "+stops.length+" stops");
}

function makePinMarker(pinColor)
{
  return new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
    new google.maps.Size(21, 34),
    new google.maps.Point(0,0),
    new google.maps.Point(10, 34));
}

/*
 * We don't have to keep track of as much with stops, since they don't move.  We just draw them when a route
 * has focus, and hide them when it doesn't
 */
function drawStop(stop){
  col = colorForRoute(activeRoute);
  var myLatlng = new google.maps.LatLng(stop.lat, stop.lon);

  var marker = new google.maps.Marker({
     position: myLatlng,
     map: map,
     title:stop.name+": ("+stop.stopid+")",
     icon: makePinMarker(col),
     title:stop.name,
     optimized: false // http://stackoverflow.com/questions/8721327/effects-and-animations-with-google-maps-markers/8722970#8722970
  });
  marker.setMap(map);
  return marker;
}

function setStopInfoWindow(marker, stop){
  google.maps.event.addListener(marker, 'click', function() {
    pollPath("/stops/"+stop.id+"?minimal=true", http_nonsense_wrapper(function(responseText){    
      if(openinfo != null){
        openinfo.close();
      }
      var infowindow = new google.maps.InfoWindow({ content: responseText });
      infowindow.open(map,marker);
      openinfo=infowindow;

      //When the info window start, also start polling for the next bus to arrive...

      updatePrediction(stop.id);
      //setInterval(function(){updatePrediction(stop.stopid);}, 5000);
      }));
  }); 
}

function updatePrediction(stop_id){
  url="stops/"+stop_id+"/prediction.json"
  pollPath(url, http_nonsense_wrapper(newStopPrediction));
}

/*
* {"Predictions"=>[{"DirectionNum"=>"1", "DirectionText"=>"West to Tenleytown Station", "Minutes"=>98, "RouteID"=>"96", "VehicleID"=>"6501"}], "StopName"=>"..."
*/
function newStopPrediction(content_text){
  var prediction = jQuery.parseJSON(content_text);
  var html="<dl>";
  for(var i=0; i<prediction.Predictions.length; i++){
    p=prediction.Predictions[i];
    html = html + "<dt>"+p.RouteID+" "+p.DirectionText+"</dt>";
    html = html + "<dd>"+p.Minutes+" minutes</dd>"
  }
  html = html + "</dl>"
  $("#bubble_stop_prediction").html(html);
}


function drawBus(bus){
 //Update marker position if it already exists...
 if(markers[bus.busid] != null){
    updateExistingMarker(bus);
  }else{
    //Or create a new marker if it doesnt
    makeNewMarker(bus);
  }//end else
}

function makeMarker(bus){
  var color = colorForRoute(bus.wmataid);
  return {
    path: "m 36.004385,152.26493 c -2.372905,-2.3729 -2.889238,-4.05576 -2.889238,-9.41678 l 0,-6.52753 -5.35017,0 -5.350171,0 0.402743,-32.07591 C 23.215064,72.585086 26.501134,36.37695 29.748786,27.871678 33.729491,17.446613 54.710249,10.172314 81.376135,9.9718121 109.08881,9.76344 131.48745,17.119171 135.63344,27.789956 c 0.57805,1.487766 2.37867,13.536445 4.00138,26.774841 2.41222,19.679533 2.95037,29.318364 2.95037,52.845133 l 0,28.77532 -5.00266,0.36196 -5.00267,0.36196 -0.35182,6.72813 c -0.29678,5.67563 -0.84629,7.1171 -3.51271,9.21451 -2.29289,1.80358 -4.13573,2.2985 -6.71077,1.80226 -5.38976,-1.03865 -7.66971,-4.60282 -7.66971,-11.98982 l 0,-6.34363 -31.781617,0 -31.781627,0 0,6.97715 c 0,6.13552 -0.374121,7.27143 -3.101485,9.41678 -4.114256,3.23627 -8.134806,3.08132 -11.665736,-0.44962 z M 129.9779,77.595812 c 1.42346,-1.423471 -3.0704,-34.870506 -5.27603,-39.268544 -0.95432,-1.902898 -4.17259,-2.05992 -42.219187,-2.05992 l -41.186123,0 -1.074588,2.826379 c -0.591023,1.554507 -1.923732,9.36749 -2.961578,17.362184 -1.037845,7.994693 -2.130727,15.689306 -2.428627,17.099138 -1.189282,5.628347 -0.557184,5.69833 48.362006,5.354427 25.185817,-0.177057 46.238677,-0.768206 46.784127,-1.313664 z m -22.21335,-50.28263 c 2.02464,-0.776929 2.60169,-5.155261 0.68482,-5.196046 -20.950667,-0.445759 -51.255533,0.194558 -52.16314,1.102165 -0.785001,0.785002 -0.675218,1.78227 0.329459,2.992832 1.267174,1.526851 5.305458,1.815534 25.396852,1.815534 13.139552,0 24.727949,-0.321518 25.752009,-0.714485 z",
    fillColor: "#"+color,
    fillOpacity: getIconOpacity(bus),
    scale: 0.2,
    strokeColor: "#"+color,
    strokeWeight: 2
  };
}

function updateExistingMarker(bus){
  var myLatlng = new google.maps.LatLng(bus.lat, bus.lon);
  if(markers[bus.busid].getMap() == null){
    markers[bus.busid].setMap(map);
  }
  if(!markers[bus.busid].getPosition().equals(myLatlng)){
      markers[bus.busid].setPosition(myLatlng);
      markers[bus.busid].setAnimation(google.maps.Animation.BOUNCE);
      //Turn off the bouncing in 3 seconds...
      setTimeout(function(){
        var myMarker = markers[bus.busid];
        updateIconOpacity(bus.busid);
        myMarker.setAnimation(null);
      }, 3000);
    }else{      
      updateIconOpacity(bus);
    }
}

function getIconOpacity(bus)
{
  var busTime=parseISO8601(bus.last_update);
  var stale = staleness(busTime);
  return (1.0-stale);
}

function updateIconOpacity(bus)
{
  //Adjust transparency based on staleness
  //All bus markers are made in the makeMarker function
  //and have path, fillColor, fillOpacity, strokeColor, strokeWeight attributes
  //Fill opacity ranges from 0 (totally transparent) to 1 (fully opaque)
  //
  //We'll map the range [.1, .9] on the scale of staleness -- 10 minutes to 0 minutes
  if(bus == null){ return; }
  if(markers[bus.busid] == null){ return; }
  var marker = markers[bus.busid];
  if(marker == null){ return; }
  var icn = marker.getIcon();
  icn.fillOpacity = getIconOpacity(bus);
  marker.setIcon(icn);
}

function makeNewMarker(bus){
  var myLatlng = new google.maps.LatLng(bus.lat, bus.lon);
  var pinImage=makeMarker(bus);
  var marker = new google.maps.Marker({
     position: myLatlng,
     map: map,
     title:bus.wmataid+": "+bus.headsign+" ("+bus.busid+")",
     icon: pinImage,
     title:bus.headsign,
     optimized: false // http://stackoverflow.com/questions/8721327/effects-and-animations-with-google-maps-markers/8722970#8722970
  });
  markers[bus.busid] = marker;
  marker.setMap(map);
  
  google.maps.event.addListener(marker, 'click', function() {
    var busid = bus.id;
    pollPath("/buses/"+busid+"?minimal=true", http_nonsense_wrapper(function(content_text){
      if(openinfo != null){
        openinfo.close();
      }
      var infowindow = new google.maps.InfoWindow({ content: content_text });
      infowindow.open(map,marker);
      openinfo=infowindow;
    }));
  }); 
}

function initialize() {
  show_debug("initializing...");
  navigator.geolocation.getCurrentPosition(showPosition,showError);

// //We'd like this to be toggleable, it's too much with everything else
// //    var trafficLayer = new google.maps.TrafficLayer();
// //    trafficLayer.setMap(map);
}

function showPosition(position)
{ 
  lat = position.coords.latitude;
  lon = position.coords.longitude;
  // var latlon=position.coords.latitude+","+position.coords.longitude;
  // var img_url="http://maps.googleapis.com/maps/api/staticmap?center="
  // +latlon+"&zoom=14&size=400x300&sensor=false";
  // document.getElementById("map_canvas").innerHTML="<img src='"+img_url+"'>";

  

  var mapOptions = {
    center: new google.maps.LatLng(lat, lon),
    zoom: 14,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"),
      mapOptions);
  var transitLayer = new google.maps.TransitLayer();
  transitLayer.setMap(map);

  //Starts a ````cycle of polling for bus positions
  drawRoutesKML();
  // setInterval(pollBuses, 15000);
  // setInterval(pollStops, 15000);

  
}

function startPollingBuses(){
  clearInterval(pollStops);
  setInterval(pollBuses, 5000);
}

function startPollingStops(){
  clearInterval(pollBuses);
  setInterval(pollStops, 15000);
}


function showError(error)
  {
    lat = 38.89;
    lon = -77.03; 
  } 
window.onload = initialize;




 