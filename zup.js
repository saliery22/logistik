
// global variables
var map, marker,unitslist = [],allunits = [],rest_units = [],marshruts = [],zup = [], unitMarkers = [], markerByUnit = {},tile_layer, layers = {},marshrutMarkers = [],unitsID = {},Vibranaya_zona;
var areUnitsLoaded = false;
var marshrutID=99;
var cklikkk=0;
var markerstart =0;
var markerend =0;
var rux=0;
var agregat=0;
let zvit1=0;
let zvit2=0;
let zvit3=0;
let zvit4=0;
let RES_ID=26227;// 20030 "11_ККЗ"  26227 "KKZ_Gluhiv"



// for refreshing
var currentPos = null, currentUnit = null;

var isUIActive = true;


var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds

var from111 = new Date().toJSON().slice(0,11) + '05:00';
var from222 = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -8);





$('#fromtime1').val(from111);
$('#fromtime2').val(from222);
$('#log_time_inp').val(new Date().toJSON().slice(0,10));




// Unit markers constructor
function getUnitMarker(unit) {
  // check for already created marker
  var marker = markerByUnit[unit.getId()];
  if (marker) return marker;
    
  var unitPos = unit.getPosition();
  var imsaze = 22;
  if (!unitPos) return null;
    
  if(unit.getName().indexOf('Нива')>0 || unit.getName().indexOf('Duster')>0 ||unit.getName().indexOf('Газель')>0 || unit.getName().indexOf('Лада')>0 || unit.getName().indexOf('Lanos')>0 || unit.getName().indexOf('Дастер')>0 || unit.getName().indexOf('Stepway')>0 || unit.getName().indexOf('ВАЗ')>0 || unit.getName().indexOf('ФОРД')>0 || unit.getName().indexOf('Toyota')>0 || unit.getName().indexOf('Рено')>0 || unit.getName().indexOf('TOYOTA')>0 || unit.getName().indexOf('Skoda')>0|| unit.getName().indexOf('ЗАЗ ')>0){imsaze = 18;}
  if(unit.getName().indexOf('JD')>0 || unit.getName().indexOf(' CL ')>0|| unit.getName().indexOf(' МТЗ ')>0|| unit.getName().indexOf('CASE')>0 || unit.getName().indexOf(' NH ')>0){imsaze = 24;} 

  marker = L.marker([unitPos.y, unitPos.x], {
    clickable: true,
    draggable: true,
    icon: L.icon({
      iconUrl: unit.getIconUrl(imsaze),
      iconAnchor: [imsaze/2, imsaze/2] // set icon center
    })
  });
  marker.bindPopup('<center><font size="1">' + unit.getName()+'<br />' +wialon.util.DateTime.formatTime(unitPos.t));
  marker.bindTooltip(unit.getName(),{opacity:0.8});
  marker.on('click', function(e) {
  
    // select unit in UI
    $('#units').val(unit.getId());
      
     var pos = e.latlng;
      
    // map.setView([pos.lat, pos.lng],14);
      
     var unitId = unit.getId();

     $("#lis0").chosen().val(unit.getId());
     
    $("#lis0").trigger("chosen:updated");
    if ($('#option').is(':hidden')) {}else{ 
      jurnal(0,unit);
    }
   navigator.clipboard.writeText(unit.getName());        
   
     show_track();
     show_gr();

  });

  // save marker for access from filtering by distance
 
  markerByUnit[unit.getId()] = marker;
  allunits.push(unit);
  unitsID[unit.getName()] = unit.getId();
  return marker;
}



// Print message to log
function msg(text) { $('#log').prepend(text + '<br/>'); }




function init() { // Execute after login succeed
  // get instance of current Session
  var session = wialon.core.Session.getInstance();
  // specify what kind of data should be returned
  var flags = wialon.item.Item.dataFlag.base | wialon.item.Unit.dataFlag.lastPosition;
  var res_flags = wialon.item.Item.dataFlag.base | wialon.item.Resource.dataFlag.reports | wialon.item.Resource.dataFlag.zones| wialon.item.Resource.dataFlag.zoneGroups;
 
	var remote= wialon.core.Remote.getInstance();
  remote.remoteCall('render/set_locale',{"tzOffset":7200,"language":'ru',"formatDate":'%Y-%m-%E %H:%M:%S'});
  wialon.util.Gis.geocodingParams.flags =1490747392;//{flags: "1255211008", city_radius: "10", dist_from_unit: "5", txt_dist: "km from"};
	session.loadLibrary("resourceZones"); // load Geofences Library 
  session.loadLibrary("resourceReports"); // load Reports Library
  session.loadLibrary("resourceZoneGroups"); // load Reports Library

  // load Icon Library
  session.loadLibrary('itemIcon');
  
        
  session.updateDataFlags( // load items to current session
		[{type: 'type', data: 'avl_resource', flags:res_flags , mode: 0}, // 'avl_resource's specification
		 {type: 'type', data: 'avl_unit', flags: flags, mode: 0}], // 'avl_unit's specification
	function (error) { // updateDataFlags callback     
        
      if (error) {
        // show error, if update data flags was failed
        msg(wialon.core.Errors.getErrorText(error));
      } else {
        areUnitsLoaded = true;
        msg('Техніка завнтажена - успішно');
        var res = session.getItem(RES_ID);
        var templ = res.getReports(); // get reports templates for resource
	      for(var i in templ){
		    if (templ[i].ct != "avl_unit") continue; // skip non-unit report templates
		    // add report template to select list
		     //console.log(templ[i].id +"     "+ templ[i].n+ + '\n' );
         if(templ[i].n=="яx001") {zvit1=templ[i].id; msg('звіт зливи      1/4 завінтажено');}
         if(templ[i].n=="яx002") {zvit2=templ[i].id; msg('звіт трасування 2/4 завінтажено');}
         if(templ[i].n=="яx003") {zvit3=templ[i].id; msg('звіт зупинки    3/4 завінтажено');}
         if(templ[i].n=="яx004") {zvit4=templ[i].id; msg('звіт підсумок   4/4 завінтажено');}
	      }
        // add received data to the UI, setup UI events
        initUIData();
      }
    }
  );
}




// will be called after updateDataFlags success
let geozonepoint = [];
let geozonepointTurf = [];
let geozones = [];
let geozonesgrup = [];
let IDzonacord=[];
let lgeozoneee;
let marshrut_leyer_0;
function initUIData() {
  var session = wialon.core.Session.getInstance();
  var resource = wialon.core.Session.getInstance().getItem(20030); //26227 - Gluhiv 20030 "11_ККЗ"
    let gzgroop = resource.getZonesGroups();
  resource.getZonesData(null, function(code, geofences) {
    var cord=[];
      for (let i = 0; i < geofences.length; i++) {
        cord=[];
         var zone = geofences[i];
         if(zone.n[2]=='к' || zone.n[3]=='к') continue;
         var zonegr="";
           for (var key in gzgroop) {
            if(gzgroop[key].n[0]!='*' && gzgroop[key].n[0]!='#'){
           gzgroop[key].zns.forEach(function(item, arr) {
           if(item==zone.id){zonegr=gzgroop[key].n;return;}
           });
            }
           }
         var color = "#" + wialon.util.String.sprintf("%08x", zone.c).substr(2);
           for (let ii = 0; ii < zone.p.length; ii++) {
            cord.push([zone.p[ii].y , zone.p[ii].x]);

           }
           IDzonacord[zone.id]=cord;
           
           var geozona =  L.polygon([cord], {color: '#FF00FF', stroke: true,weight: 1, opacity: 0.5, fillOpacity: 0.4, fillColor: color});
          // geozona.bindPopup(zone.n);
           geozona.bindTooltip(zone.n +'<br />' +zonegr,{opacity:0.8,sticky:true});
           geozona.zone = zone;
           geozones.push(geozona);   

           geozona.on('click', function(e) {
          
           
           
           
           geozonepoint.length =0;
           geozonepointTurf.length =0;
           Vibranaya_zona = this.zone;
           $('#hidezone').click(function() { map.removeLayer(e.target);});
           clearGEO();
           if ($('#option').is(':hidden')==false) {
             let point = e.target._latlngs[0];
             let ramka=[];
              for (let i = 0; i < point.length; i++) {
              let lat =point[i].lat;
              let lng =point[i].lng;
              ramka.push([lat, lng]);
              if(i == point.length-1 && ramka[0]!=ramka[i])ramka.push(ramka[0]); 
              }
              let polilane = L.polyline(ramka, {color: 'blue'}).addTo(map);
              geo_layer.push(polilane);

              $('#inftb').empty();
              var color1 = e.target.options.fillColor
              var namee = this.zone.n;
              var kol=0;
              var plo=0;
              var kol2=0;
              var plo2=0;
              resource.getZonesData(null,0x11, function(code, geofences) {
              for (let i = 0; i < geofences.length; i++) {
                 var zonee = geofences[i];
                 var color2 = "#" + wialon.util.String.sprintf("%08x", zonee.c).substr(2);
                 if(color1==color2){
                  plo+=zonee.ar;
                  kol++;
                  if(namee.split('-')[0]==zonee.n.split('-')[0]){plo2+=zonee.ar; kol2++;}
                }
                 if(zonee.id==Vibranaya_zona.id){
                   let rovs = zonee.d.split("||");
                   let last = rovs.length-20;
                   if(last<1)last=1;
                   for (let ii = last; ii < rovs.length; ii++) {
                   let cels = rovs[ii].split("|");
                   
                   }
                 }
                
              }
              //$('#infoGEO').append("Назва    "+e.target._popup._content+"<br> Засіяно в регіоні  "+namee+" - "+kol2+"шт   "+(plo2/10000).toFixed(2)+"га <br> Всього  "+kol+"шт  "+(plo/10000).toFixed(2)+"га");
             
           $("#inftb").append("<tr><td BGCOLOR = "+ color1 +" >&nbsp&nbsp&nbsp&nbsp&nbsp</td><td>"+namee.split('-')[0]+"</td><td>"+kol2+"шт</td><td>"+(plo2/10000).toFixed(2)+"га</td><td>всього</td><td>"+kol+"шт</td><td>"+(plo/10000).toFixed(2)+"га</td></tr>");
          });

             jurnal(1,Vibranaya_zona);
            }
           

             
              
               if ($('#zz10').is(':hidden')==false){
                $('#obrobka').empty();
                $('#obrobkatehnika').empty();
                $('#getary_pole').text(Vibranaya_zona.n)
                let point = e.target._latlngs[0];
                let ramka=[];
                for (let i = 0; i < point.length; i++) {
                let lat =point[i].lat;
                let lng =point[i].lng;
                geozonepoint.push({x:lat, y:lng}); 
                geozonepointTurf.push([lng,lat]);
                ramka.push([lat, lng]);
                if(i == point.length-1 && geozonepoint[0]!=geozonepoint[i]){
                  geozonepoint.push(geozonepoint[0]); 
                  geozonepointTurf.push(geozonepointTurf[0]);
                  ramka.push(ramka[0]);
                }
                }
                let polilane = L.polyline(ramka, {color: 'blue'}).addTo(map);
                geo_layer.push(polilane);
               }


        
          });

      }
  
      let lgeozone = L.layerGroup(geozones);
      layerControl.addOverlay(lgeozone, "Геозони");
   

      for (var key in gzgroop) {
        let point=[];
        if(gzgroop[key].n[0]!='*' && gzgroop[key].n[0]!='#'){
        gzgroop[key].zns.forEach(function(item1) { if(IDzonacord[item1]){IDzonacord[item1].forEach(function(item2) {point.push(turf.point([item2[1],item2[0]]));});}});
        let points = turf.featureCollection(point);
        let hull = turf.convex(points);
        let poly = L.geoJSON(hull,{fillOpacity: 0,weight:2}).bindTooltip(gzgroop[key].n);
        geozonesgrup.push(poly);
        }
      }

    
       let lgeozonee = L.layerGroup(geozonesgrup);
      layerControl.addOverlay(lgeozonee, "Регіони");
    


      load_jurnal(20233,'zony.txt',function (data) { 
        let log_zone=[];
        for(let i = 1; i<data.length; i++){
          let m=data[i].split('|');
          let y = parseFloat(m[0].split(',')[0]);
          let x = parseFloat(m[0].split(',')[1]);
          let r = parseFloat(m[1]);
          let poly = L.circle([y,x], {stroke: false, fillColor: '#0000FF', fillOpacity: 0.2,radius: r}).bindTooltip(""+m[2]+"",{permanent: true, opacity:0.7, direction: 'top'});
          log_zone.push(poly);
          stor.push([y,x,r,m[2]]);
          adresa.push(m[2]);
          }
          lgeozoneee = L.layerGroup(log_zone);
          layerControl.addOverlay(lgeozoneee, "Логістика");
    });


         marshrut_leyer_0 = L.layerGroup();
          layerControl.addOverlay(marshrut_leyer_0, "маршрути завира");


          update_logistik_data(vsi_marshruty);




  });


  





  var units = session.getItems('avl_unit');
   
  units.forEach(function(unit) {          
    var unitMarker = getUnitMarker(unit);
    if (unitMarker) unitMarker.addTo(map);
    
    // Add option
$('#lis0').append($('<option>').text(unit.getName()).val(unit.getId()));

//unit.addListener('changePosition', function(event) {
//  let id = unit.getId();
//  for (let i = 0; i < list_zavatajennya.length; i++){
//    if(list_zavatajennya[i]==id)break;
//    if(list_zavatajennya.length-1==i)list_zavatajennya.push(id);
//  }
// if(list_zavatajennya.length==0)list_zavatajennya.push(id); 
//});
  
  

var sdsa = unit.getPosition();
if (sdsa){
    unitslist.push(unit);
    unitMarkers.push(unitMarker) ;  
if (Date.parse($('#fromtime1').val())/1000 > unit.getPosition().t){rest_units.push(unit.getName());}
}

  });

  
  
$(".livesearch").chosen({search_contains : true});
 $('#lis0').on('change', function(evt, params) {
   onUnitSelected();
  });

 $('#men1').click(function() {
  if ($('#marrr').is(':hidden')) {
    $('#marrr').show();
    $('#map').css('width', '50%');
    this.style.background = '#b2f5b4';
    $('.leaflet-container').css('cursor','crosshair');
    var tableRow =document.querySelectorAll('#marshrut tr');
    var radddddd;
     for ( j = 1; j < tableRow.length; j++){
       raddddddd =  L.circle([parseFloat(tableRow[j].cells[2].textContent.split(',')[0]),parseFloat(tableRow[j].cells[2].textContent.split(',')[1])], {stroke: false,  fillColor: '#0000FF', fillOpacity: 0.2,radius: tableRow[j].cells[6].textContent}).addTo(map);
       marshrutMarkers.push(raddddddd);
       raddddddd =  L.circle([parseFloat(tableRow[j].cells[3].textContent.split(',')[0]),parseFloat(tableRow[j].cells[3].textContent.split(',')[1])], {stroke: false,  fillColor: '#f03', fillOpacity: 0.2,radius: tableRow[j].cells[7].textContent}).addTo(map);
       marshrutMarkers.push(raddddddd);
       var polyline = L.polyline([[parseFloat(tableRow[j].cells[2].textContent.split(',')[0]),parseFloat(tableRow[j].cells[2].textContent.split(',')[1])],[parseFloat(tableRow[j].cells[3].textContent.split(',')[0]),parseFloat(tableRow[j].cells[3].textContent.split(',')[1])]], {opacity: 0.3, color: '#0000FF'}).addTo(map);
       marshrutMarkers.push(polyline); 
     } 
     
  }else{
    $('#marrr').hide();
    $('#map').css('width', '100%');
    this.style.background = '#e9e9e9';
    $('.leaflet-container').css('cursor','');
    markerstart.setLatLng([0,0]); 
    markerend.setLatLng([0,0]);
    cklikkk=0;
    clearGarbage(marshrutMarkers);

  }
  $('#option').hide();
  $('#unit_info').hide();
  $('#zupinki').hide();
  $('#logistika').hide();
  $('#monitoring').hide();
  clearGEO();
  $('#men3').css({'background':'#e9e9e9'});
  $('#men4').css({'background':'#e9e9e9'});
  $('#men5').css({'background':'#e9e9e9'});
  $('#men6').css({'background':'#e9e9e9'});
  $('#men7').css({'background':'#e9e9e9'});
  clearGarbage(garbage);
  clearGarbage(garbagepoly);
  clearGarbage(marshrut_garbage);
  bufer=[];
  });
 $('#men3').click(function() { 
  if ($('#option').is(':hidden')) {
    $('#option').show();
    $('#map').css('width', '50%');
    this.style.background = '#b2f5b4';
    $('#men3').css({'box-shadow':'none'});
    $('.leaflet-container').css('cursor','');
    markerstart.setLatLng([0,0]); 
    markerend.setLatLng([0,0]);
    cklikkk=0;
  }else{
    $('#option').hide();
    $('#map').css('width', '100%');
    this.style.background = '#e9e9e9';
    $('#men3').css({'box-shadow':'none'});
  }
$('#marrr').hide();
$('#unit_info').hide();
$('#inftb').empty();
$('#zupinki').hide();
$('#logistika').hide();
$('#monitoring').hide();
clearGEO(); 
$('#men1').css({'background':'#e9e9e9'});
$('#men4').css({'background':'#e9e9e9'});
$('#men5').css({'background':'#e9e9e9'});
$('#men6').css({'background':'#e9e9e9'});
$('#men7').css({'background':'#e9e9e9'});
clearGarbage(garbage);
clearGarbage(garbagepoly);
clearGarbage(marshrut_garbage);
clearGarbage(marshrutMarkers);
$('#jurnal').hide();
$('#jurnal_upd').hide();
bufer=[];

});



 $('#men4').click(function() { 
    if ($('#unit_info').is(':hidden')) {
      $('#unit_info').show();
      $('#map').css('width', '65%');
      this.style.background = '#b2f5b4';
      $('.leaflet-container').css('cursor','');
      markerstart.setLatLng([0,0]); 
     markerend.setLatLng([0,0]);
    cklikkk=0; 
    }else{
     $('#unit_info').hide();
     $('#map').css('width', '100%');
     this.style.background = '#e9e9e9';
     $('.leaflet-container').css('cursor','');
    }
    $('#marrr').hide();
    $('#option').hide();
    $('#zupinki').hide();
    $('#logistika').hide();
    $('#monitoring').hide();
    clearGEO(); 
    $('#men3').css({'background':'#e9e9e9'});
    $('#men1').css({'background':'#e9e9e9'});
    $('#men5').css({'background':'#e9e9e9'});
    $('#men6').css({'background':'#e9e9e9'});
    $('#men7').css({'background':'#e9e9e9'});
    clearGarbage(garbage);
    clearGarbage(garbagepoly);
    clearGarbage(marshrut_garbage);
    clearGarbage(marshrutMarkers);
    bufer=[];
 });

 $('#men5').click(function() { 
  if ($('#zupinki').is(':hidden')) {
    $('#zupinki').show();
    $('#map').css('width', '80%');
    this.style.background = '#b2f5b4';
    $('.leaflet-container').css('cursor','');
    markerstart.setLatLng([0,0]); 
    markerend.setLatLng([0,0]);
    cklikkk=0;
  }else{
   $('#zupinki').hide();
   $('#map').css('width', '100%');
   this.style.background = '#e9e9e9';
  }
  $('#marrr').hide();
  $('#option').hide();
  $('#unit_info').hide();
  $('#logistika').hide();
  $('#monitoring').hide();
  clearGEO(); 
  $('#men3').css({'background':'#e9e9e9'});
  $('#men1').css({'background':'#e9e9e9'});
  $('#men4').css({'background':'#e9e9e9'});
  $('#men6').css({'background':'#e9e9e9'});
  $('#men7').css({'background':'#e9e9e9'});
  clearGarbage(garbage);
  clearGarbage(garbagepoly);
  clearGarbage(marshrut_garbage);
  clearGarbage(marshrutMarkers);
  bufer=[];
});

 $('#men6').click(function() { 
  if ($('#logistika').is(':hidden')) {
    $('#logistika').show();
    $('#map').css('width', '50%');
    this.style.background = '#b2f5b4';
      $('.leaflet-container').css('cursor','crosshair');
      markerstart.setLatLng([0,0]); 
      markerend.setLatLng([0,0]);
    cklikkk=0;
    $("#logistika_tb").empty();
  }else{
   $('#logistika').hide();
   $('#map').css('width', '100%');
   this.style.background = '#e9e9e9';
   $('.leaflet-container').css('cursor','');
  }
  $('#marrr').hide();
  $('#option').hide();
  $('#unit_info').hide();
  $('#zupinki').hide();
  $('#monitoring').hide();
  clearGEO(); 
  $('#men3').css({'background':'#e9e9e9'});
  $('#men1').css({'background':'#e9e9e9'});
  $('#men4').css({'background':'#e9e9e9'});
  $('#men5').css({'background':'#e9e9e9'});
  $('#men7').css({'background':'#e9e9e9'});
  clearGarbage(garbage);
  clearGarbage(garbagepoly);
  clearGarbage(marshrut_garbage);
  clearGarbage(marshrutMarkers);
  bufer=[];
});

 $('#men7').click(function() { 
  if ($('#monitoring').is(':hidden')) {
    $('#monitoring').show();
    $('#map').css('width', '65%');
    this.style.background = '#b2f5b4';
      $('.leaflet-container').css('cursor','');
      markerstart.setLatLng([0,0]); 
      markerend.setLatLng([0,0]);
    cklikkk=0;
  }else{
   $('#monitoring').hide();
   $('#map').css('width', '100%');
   this.style.background = '#e9e9e9';
  
  }
  $('#marrr').hide();
  $('#option').hide();
  $('#unit_info').hide();
  $('#zupinki').hide();
  $('#logistika').hide();
  clearGEO(); 
  $('#men3').css({'background':'#e9e9e9'});
  $('#men1').css({'background':'#e9e9e9'});
  $('#men4').css({'background':'#e9e9e9'});
  $('#men5').css({'background':'#e9e9e9'});
  $('#men6').css({'background':'#e9e9e9'});
  clearGarbage(garbage);
  clearGarbage(garbagepoly);
  clearGarbage(marshrut_garbage);
  clearGarbage(marshrutMarkers);

});

 $('#marrr').hide();
 $('#option').hide();
 $('#unit_info').hide();
 $('#zupinki').hide();
 $('#logistika').hide();
 $('#monitoring').hide();

// Unit choosed from <select>
  function onUnitSelected() {  
     
    var unitId = parseInt($("#lis0").chosen().val());
    var popupp = markerByUnit[unitId];
    
    if (unitId === 0) return;
            
    var unit = session.getItem(unitId);
       
    if (!unit) {
      msg('No such unit');
      return;
    }
    
    var unitPos = unit.getPosition();
    
    if (!unitPos) {
      msg('Unit haven\'t a position');
      return;
    }
    
   map.setView(popupp.getLatLng(), 15); 
   popupp.openPopup();
     navigator.clipboard.writeText(unit.getName());
     show_track ();     
     show_gr();
     if ($('#option').is(':hidden')) {}else{ 
      jurnal(0,unit);
    }
  }
  
  // find near unit
  $('#add').click(Marshrut); // by button
  $("#marshrut").on("click", ".close_btn", delete_track); //click, when need delete current track
  $("#marshrut").on("click", ".run_btn", load_marshrut); //click, when need delete current track
  $('#eeew').click(function() { UpdateGlobalData(0,zvit2,0);});
  
  $("#marshrut").on("click", ".marr", vibormarshruta);
  $("#zvit").on("click", ".mar_trak", track_marshruta);
  $("#obrobkatehnika").on("click", ".geo_trak", track_geomarshruta);
  $("#unit_table").on("click", ".fail_trak", track_TestNavigation);
  $("#monitoring_table").on("click", track_Monitoring);
  $("#unit_table").on("click", ".sliv_trak", track_Sliv);

  $('#prMot').click(function() { 
    $("#unit_table").empty();

    let html = Motogod($('#unit_prMot').val());
    $("#unit_table").append(html);
  });

 
  $("#prPos").on("click", rob_region);
  $("#sliv_det").on("click", zlivy);
  


  $('#goooo').click(fn_copy);
  $('#gooo1').click(fn_copy1);
  $('#gooo2').click(fn_load1);
  
  

  $('#v8').click(clear);
  $('#v18').click(clear2);
    $('#v1').click(chuse);
    $('#v2').click(chuse);
    $('#v3').click(chuse);
    $('#v4').click(chuse);
    $('#v5').click(chuse);
    $('#v6').click(chuse);
    $('#v9').click(chuse);
    $('#v12').click(chuse);
    $('#v13').click(chuse);
    $('#v14').click(chuse);
    
    $('#v15').click(Clrar_no_activ);

    $('#v21').click(chuse);
    $('#v22').click(chuse);
    $('#v23').click(chuse);
    $('#v24').click(chuse);
    $('#v25').click(chuse);
    $('#v26').click(chuse);
    $('#v27').click(chuse);
    $('#v28').click(chuse);
    $('#v29').click(chuse);
    $('#v30').click(chuse);
    
    
    $('#prDUT').click(function() { SendDataReportInCallback(0,0,'All',7,[],0,TestNavigation);});
    $('#prNV').click(function() {  SendDataReportInCallback(0,0,'аправка,Писаренко,Білоус,Штацький,Колотуша,Дробниця,ВМ4156ВС',7,[],0,TestNavigation)});
    $('#monitoring_bt').click(Monitoring2);
    $('#marsh_bt').click(marshrut_avto);
    $('#geo_serch').click(function() { Serch_GEO($('#geo_data').val());});



    $('#obrabotkaBT').click(function() {Naryady(Global_DATA,$('#tehnikaobr').val())});

    $("#gektaryBT").click(function() { 
      let tableRow =document.querySelectorAll('#obrobkatehnika tr');
      let texnika=[];
      for ( j = 0; j < tableRow.length; j++){
         if(tableRow[j].cells[5].children[0].checked){
          texnika.push(tableRow[j].cells[1].textContent);
         } 
         
      } 
      
      ObrabotkaPolya(texnika,$('#shirzahvata').val());
    });
    $("#per_zup").click(function() { 
      maska_zup=$('#unit_zup').val();
      min_zup=$('#min_zup').val();
      if ($("#alone_zup").is(":checked")) {alone=true;}else{alone=false}
      Cikle2();
    });
    $("#gruz_zup").click(function() { 
      maska_zup='Камаз,SCANIA,МАЗ';
      min_zup=$('#min_zup1').val();
      if ($("#alone_zup1").is(":checked")) {alone=true;}else{alone=false}
      Cikle2();
    });
    $("#benzovoz_zup").click(function() { 
      maska_zup='ВМ1613СР,ВМ1614СР,ВМ2893ЕН,ВМ3861ВО,ВМ3862ВО,ВМ4156ВС';
      min_zup=$('#min_zup2').val();
      if ($("#alone_zup2").is(":checked")) {alone=true;}else{alone=false}
      Cikle2();
    });
    $("#gaz_zup").click(function() { 
      maska_zup='ГАЗ';
      min_zup=$('#min_zup3').val();
      if ($("#alone_zup3").is(":checked")) {alone=true;}else{alone=false}
      Cikle2();
    });
    $("#moloko_zup").click(function() { 
      maska_zup='ВМ3204ЕВ,ВМ3372СТ,ВМ5913СІ';
      min_zup=$('#min_zup4').val();
      if ($("#alone_zup4").is(":checked")) {alone=true;}else{alone=false}
      Cikle2();
    });
    $("#pogr_zup").click(function() { 
      maska_zup='JCB,Manitou';
      min_zup=$('#min_zup5').val();
      if ($("#alone_zup5").is(":checked")) {alone=true;}else{alone=false}
      Cikle2();
    });
    $("#tr_zup").click(function() { 
      maska_zup='John,JD,CL,NH,CASE';
      min_zup=$('#min_zup6').val();
      if ($("#alone_zup6").is(":checked")) {alone=true;}else{alone=false}
      Cikle2();
    });
    $("#nm_zup").click(function() { 
      maska_zup='Найм,ФОП,ТОВ,Фоп';
      min_zup=$('#min_zup7').val();
      if ($("#alone_zup7").is(":checked")) {alone=true;}else{alone=false}
      Cikle2();
    });

    
    
   
    
}





var layerControl=0;
function initMap() {
  
  // create a map in the "map" div, set the view to a given place and zoom
  map = L.map('map', {
    // disable zooming, because we will use double-click to set up marker
    doubleClickZoom: false
  }).setView([51.62995, 33.64288], 9);
  
 //L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{ subdomains:['mt0','mt1','mt2','mt3']}).addTo(map);


  // add an OpenStreetMap tile layer


  var basemaps = {
    OSM:L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {}),

    'Google Hybrid':L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{ subdomains:['mt0','mt1','mt2','mt3'],layers: 'OSM-Overlay-WMS,TOPO-WMS'})

};


layerControl=L.control.layers(basemaps).addTo(map);

basemaps.OSM.addTo(map);
  
    markerstart = L.marker([0,0],{icon: L.icon({iconUrl: '555.png',iconSize:[30, 45],iconAnchor:[15, 45]})}).addTo(map);
    markerend = L.marker([0,0],{icon: L.icon({iconUrl: '444.png',iconSize:[30, 45],iconAnchor:[15, 45]})}).addTo(map);
    


  var dist1=10;
  var dist2=10;
  map.on('dblclick', function(e) {
    if (!isUIActive) return;   
    
      var pos = e.latlng;
      var raddddd;
      //$.get('https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=UA&lat='+pos.lat+'&lon='+pos.lng+'', function(data){ console.log(data); });
      //console.log(wialon.util.Gis.getLevelFlags(wialon.util.Gis.geocodingFlags.level_houses, wialon.util.Gis.geocodingFlags.level_streets, wialon.util.Gis.geocodingFlags.level_cities, wialon.util.Gis.geocodingFlags.level_cities, wialon.util.Gis.geocodingFlags.level_cities));
     
     //wialon.util.Gis.getLocations([{lat: pos.lat, lon: pos.lng}], function(code, data) {
     //   if (code) { msg(wialon.core.Errors.getErrorText(code)); return; } // exit if error code
     //   if (data) {let adr =data[0].split(', '); console.log(adr); console.log(adr[adr.length-1].replace(/[0-9]| km from |\.|\s/g, '')); }});

      // wialon.util.Gis.searchByString('Київ Чернігівська обл. Сумська обл.',0,1, function(code, data) {
       // if (code) { msg(wialon.core.Errors.getErrorText(code)); return; } // exit if error code
       // if (data) { console.log(data);
          //if (data[0]){map.setView([data[0].items[0].y, data[0].items[0].x], 13); }
        //}});


if (!$('#marrr').is(':hidden')) {
   cklikkk++;
   if (cklikkk==1){
   markerstart.setLatLng(pos);
   markerend.setLatLng([0,0]); 
   }
 if (cklikkk==2){
  dist1 =Math.round(wialon.util.Geometry.getDistance(pos.lat, pos.lng, markerstart.getLatLng().lat, markerstart.getLatLng().lng));
  if (dist1<50) {dist1=50;}
  raddddd =  L.circle(markerstart.getLatLng(), {stroke: false, fillColor: '#0000FF', fillOpacity: 0.2,radius: dist1}).addTo(map);
   marshrutMarkers.push(raddddd);
    }

  if (cklikkk==3){
    markerend.setLatLng(pos);
     
       } 
  if (cklikkk==4){
        cklikkk=0;
        
         dist2 =Math.round(wialon.util.Geometry.getDistance(pos.lat, pos.lng, markerend.getLatLng().lat, markerend.getLatLng().lng));
         if (dist2<50) {dist2=50;}
         raddddd =  L.circle(markerend.getLatLng(), { stroke: false, fillColor: '#f03', fillOpacity: 0.2,radius: dist2}).addTo(map);
        marshrutMarkers.push(raddddd);
    
      
      var polyline = L.polyline([markerstart.getLatLng(),markerend.getLatLng()], {opacity: 0.3, color: '#0000FF'}).addTo(map);
        marshrutMarkers.push(polyline);
        Marshrut(dist1,dist2);
         }
    } 
    
    
 
  });
  


 map.on('click', function(e) { 
 if($('#zz1').is(':visible') || $('#zz2').is(':visible') || $('#zz3').is(':visible')) { RemainsFuel(e); }
 if($('#log_marh_tb').is(':visible') ) { add_point(e); }
 if($('#adresy').is(':visible') ) { 
  let y = e.latlng.lat.toFixed(4);
  let x = e.latlng.lng.toFixed(4);
  $('#adresy_coord').val(y+','+x);
  let r =$('#adresy_radius').val();
   let l = L.circle([y,x], { stroke: true, fillColor: '#f03', fillOpacity: 0.2,radius: r}).addTo(map);
   zup_mark_data.push(l);
  }
 });

}


//let ps = prompt('');
//if(ps==55555){
// execute when DOM ready
eval(function(p,a,c,k,e,d){e=function(c){return c.toString(36)};if(!''.replace(/^/,String)){while(c--){d[c.toString(a)]=k[c]||c.toString(a)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('$(q).p(4(){o 5=\'n\';2.1.7.6().m("l://k.j.i.h",g,f);2.1.7.6().e(5,"",4(0){d(0){3(2.1.c.b(0));a}3(\'Зеднання з Глухів - успішно\');9();8()})});',27,27,'code|core|wialon|msg|function|TOKEN|getInstance|Session|init|initMap|return|getErrorText|Errors|if|loginToken|0x800|null|ua|com|ingps|local3|https|initSession|0999946a10477f4854a9e6f27fcbe8421701D33C6C93D27EBB0E1386089066AC57C869EC|var|ready|document'.split('|'),0,{}))
//  $('#option').hide();
//  $('#unit_info').hide();
//  $('#zupinki').hide();
//  $('#map').hide();
//}
//}else{
//  $('#marrr').hide();
//  $('#option').hide();
//  $('#unit_info').hide();
//  $('#zupinki').hide();
//  $('#map').hide();
//}



function show_track (time1,time2) {

	var unit_id =  $("#lis0").chosen().val(),
		sess = wialon.core.Session.getInstance(), // get instance of current Session	
		renderer = sess.getRenderer(),
		cur_day = new Date(),	
		unit = sess.getItem(unit_id), // get unit by id
		color = "ff0000"; // track color
    var to,from;
     if(time1 == undefined){
     to = Date.parse($('#fromtime2').val())/1000; // end of day in seconds
     from = Date.parse($('#fromtime1').val())/1000; // get begin time - beginning of day
    }else{
    to = Date.parse(time2)/1000;
    from = Date.parse(time1)/1000;
    }
         

		if (!unit) return; // exit if no unit

    
    
    
          	if (layers[0]==0)
	{
		// delete layer from renderer
		renderer.removeAllLayers(function(code) { 
			if (code) 
				msg(wialon.core.Errors.getErrorText(code)); // exit if error code
			else 
				msg("Track removed."); // else send message, then ok
		});
    layers[0]=1;
	}
    
    
    if(!layers[0]) layers[0]=1;
    if(layers[0]==1) color = "ff0000";
    if(layers[0]==2) color = "00ff00";
    if(layers[0]==3) color = "ff1493";
    if(layers[0]==4) color = "00bfff";
    layers[0]+=1;
    if(layers[0]>4) layers[0]=1;
   
    
    
    
    
      
		var pos = unit.getPosition(); // get unit position
		if(!pos) return; // exit if no position

    
  

    
    
		// callback is performed, when messages are ready and layer is formed
		callback =  qx.lang.Function.bind(function(code, layer) {
			if (code) { msg(wialon.core.Errors.getErrorText(code)); return; } // exit if error code
			
			if (layer) { 
                
				//var layer_bounds = layer.getBounds(); // fetch layer bounds
				//if (!layer_bounds || layer_bounds.length != 4 || (!layer_bounds[0] && !layer_bounds[1] && !layer_bounds[2] && !layer_bounds[3])) // check all bounds terms
				  //  return;
				
				// if map existence, then add tile-layer and marker on it
				if (map) {
                   
				   //prepare bounds object for map
				   // var bounds = new L.LatLngBounds(
					//L.latLng(layer_bounds[0],layer_bounds[1]),
					//L.latLng(layer_bounds[2],layer_bounds[3])
				   // );
				   // map.fitBounds(bounds); // get center and zoom
				    // create tile-layer and specify the tile template
					if (!tile_layer)
						tile_layer = L.tileLayer(sess.getBaseUrl() + "/adfurl" + renderer.getVersion() + "/avl_render/{x}_{y}_{z}/"+ sess.getId() +".png", {zoomReverse: true, zoomOffset: -1,zIndex: 3}).addTo(map);
					else 
						tile_layer.setUrl(sess.getBaseUrl() + "/adfurl" + renderer.getVersion() + "/avl_render/{x}_{y}_{z}/"+ sess.getId() +".png");
				    // push this layer in global container
				   
				   
				}
				
			}
	});
	// query params
	params = {
		"layerName": "route_unit_" + unit_id, // layer name
		"itemId": unit_id, // ID of unit which messages will be requested
		"timeFrom": from, //interval beginning
		"timeTo": to, // interval end
		"tripDetector": 0, //use trip detector: 0 - no, 1 - yes
		"trackColor": color, //track color in ARGB format (A - alpha channel or transparency level)
		"trackWidth": 2, // track line width in pixels
		"arrows": 1, //show course of movement arrows: 0 - no, 1 - yes
		"points": 1, // show points at places where messages were received: 0 - no, 1 - yes
		"pointColor": color, // points color
		"annotations": 0, //show annotations for points: 0 - no, 1 - yes
        "flags": 32
	};
	renderer.createMessagesLayer(params, callback);
}




function Marshrut(r1,r2){


   
    
   marshrutID+=1; 
   var idlist=marshrutID+99999;
   

   
   
	// create row-string with data
				var row = "<tr class='marr' id='" + marshrutID + "'>";   
				// print message with information about selected unit and its position
				row += "<td> <input type='text'></td>";
        row += "<td> <input type='text'></td>";
        row += " <td style='display: none;'>"+ markerstart.getLatLng().lat +","+ markerstart.getLatLng().lng+"</td>";
        row += " <td style='display: none;'>"+ markerend.getLatLng().lat +","+ markerend.getLatLng().lng+"</td>";
        row += "<td><div><select class='livesearch' id='"+idlist+"'style='width:200px;'> <option value=' '>Вся техніка</option></select></div></td>";
				row += "<td><select><option value='1'>1хв</option><option value='5'>5хв</option><option value='10'>10хв</option><option value='15'>15хв</option></select></td>";
        row += " <td style='display: none;'>"+r1+"</td>";
        row += " <td style='display: none;'>"+r2+"</td>";
        row += "<td><input type='checkbox' checked></td>"; 
        row += "<td class='run_btn'><button>Порахувати</button></td>";
				row += "<td class='close_btn'><button>Видалити</button></td></tr>";
				//add info in table
				$("#marshrut").append(row);
		

    $('#'+idlist+'').append($('<option>').text('Камази + Сканії').val('000'));
    $('#'+idlist+'').append($('<option>').text('Найм').val('111'));
    $('#'+idlist+'').append($('<option>').text('ГАЗи').val('ГАЗ'));
    $('#'+idlist+'').append($('<option>').text('Камази').val('Камаз'));
    $('#'+idlist+'').append($('<option>').text('Сканії').val('SCANIA'));
     $('#'+idlist+'').append($('<option>').text('МАЗи').val(' МАЗ'));
unitslist.forEach(function(unit) {          
    // Add option
 
    $('#'+idlist+'').append($('<option>').text(unit.getName()).val(unit.getName()));
  

  });




 $(".livesearch").chosen({search_contains : true});

}

function vibormarshruta(evt) {
  

	
  	//msg(row.cells[0].textContent);
 // msg(this.cells[4].textContent);
 // msg(this.cells[4].children[0].value);
  var y = parseFloat(this.cells[2].textContent.split(',')[0]);
  var x = parseFloat(this.cells[2].textContent.split(',')[1]);
  markerstart.setLatLng([y,x]); 

      y = parseFloat(this.cells[3].textContent.split(',')[0]);
      x = parseFloat(this.cells[3].textContent.split(',')[1]);
  markerend.setLatLng([y,x]); 

 [...document.querySelectorAll("#marshrut tr")].forEach(e => e.style.backgroundColor = '');
 this.style.backgroundColor = 'pink';
  
}
function delete_track (evt) {
	var row = evt.target.parentNode; // get row with data by target parentNode
  var row2 = row.parentNode; // get row with data by target parentNode
	row2.cells[2].textContent=0;
  row2.cells[3].textContent=0;
   [...document.querySelectorAll("#marshrut tr")].forEach(e => e.style.backgroundColor = '');
  $(row2).remove();
   markerstart.setLatLng([0,0]); 
   markerend.setLatLng([0,0]); 

   for(var iii=0; iii < marshrutMarkers.length; iii++){
    map.removeLayer(marshrutMarkers[iii]);
     if(iii == marshrutMarkers.length-1){marshrutMarkers=[];}
    }
  var tableRow =document.querySelectorAll('#marshrut tr');
  var radddddd;
  for ( j = 1; j < tableRow.length; j++){

    raddddddd =  L.circle([parseFloat(tableRow[j].cells[2].textContent.split(',')[0]),parseFloat(tableRow[j].cells[2].textContent.split(',')[1])], {stroke: false,  fillColor: '#0000FF', fillOpacity: 0.2,radius: tableRow[j].cells[6].textContent}).addTo(map);
    marshrutMarkers.push(raddddddd);
    raddddddd =  L.circle([parseFloat(tableRow[j].cells[3].textContent.split(',')[0]),parseFloat(tableRow[j].cells[3].textContent.split(',')[1])], {stroke: false,  fillColor: '#f03', fillOpacity: 0.2,radius: tableRow[j].cells[7].textContent}).addTo(map);
    marshrutMarkers.push(raddddddd);
    var polyline = L.polyline([[parseFloat(tableRow[j].cells[2].textContent.split(',')[0]),parseFloat(tableRow[j].cells[2].textContent.split(',')[1])],[parseFloat(tableRow[j].cells[3].textContent.split(',')[0]),parseFloat(tableRow[j].cells[3].textContent.split(',')[1])]], {opacity: 0.3, color: '0000FF'}).addTo(map);
    marshrutMarkers.push(polyline); 
  } 

}



var mr_tehnika,mr_name1,mr_name2,mr_interval,mr_radius1,mr_radius2,xy1,xy2,rov_index,chek;
$('#zvittt').hide();
function load_marshrut (evt) {
var row = evt.target.parentNode; // get row with data by target parentNode
var row2 = row.parentNode; // get row with data by target parentNode
var listid= $(row2.cells[4].children[0].children[0]).attr("id")
 mr_tehnika =$('#'+listid+'').chosen().val();
 mr_name1 = row2.cells[0].children[0].value;
 mr_name2 = row2.cells[1].children[0].value;
 mr_interval = row2.cells[5].children[0].value;
 mr_radius1 = row2.cells[6].textContent;
 mr_radius2 = row2.cells[7].textContent;
 xy1 = row2.cells[2].textContent;
 xy2 = row2.cells[3].textContent;
 rov_index = row2.rowIndex;
 chek=row2.cells[8].children[0].checked;
 $('#zvit').empty();
 $('#zvitt').empty();
 $('#zvittt').show();

Cikle3();
}


var icl3 =-1;
var idun3=0;
function Cikle3(){
  data_zup = [];


  for(let i = 0; i<Global_DATA.length; i++){
    let nametr = Global_DATA[i][0][1];
    let id = Global_DATA[i][0][0];

    if(mr_tehnika=='000'){
      if(nametr.indexOf('Камаз')>=0|| nametr.indexOf('SCANIA')>=0){   
       if(nametr.indexOf('Шкурат')<0 && nametr.indexOf('Білоус')<0 && nametr.indexOf('Штацький')<0 && nametr.indexOf('Дробниця')<0 && nametr.indexOf('Писаренко')<0 && nametr.indexOf('Колотуша')<0){ 
       } else{continue;}}else{continue;}
      }else{
        if(mr_tehnika=='111'){
         if(nametr.indexOf('Найм')>=0|| nametr.indexOf('найм')>=0|| nametr.indexOf('ТОВ')>=0|| nametr.indexOf('Фоп')>=0|| nametr.indexOf('ФОП')>=0){ 
         } else{continue;}
        }else{
       if(nametr.indexOf(mr_tehnika)>=0){ 
       }else{continue;}
       }
       }
    
       var start=0;
       var cord=0;
       var interval=0;
    for (let ii = 0; ii<Global_DATA[i].length-1; ii++){
      if(!Global_DATA[i][ii][3])continue;
      //if(!Global_DATA[i][ii][0])continue;
      if(!Global_DATA[i][ii][1])continue;


          if(start==0 && Global_DATA[i][ii][3][0]==0){start=Global_DATA[i][ii][1], cord=Global_DATA[i][ii][0];}
          if(start!=0 && Global_DATA[i][ii][3][0]!=0){
          interval = (Date.parse(Global_DATA[i][ii][1])/1000)-(Date.parse(start)/1000);
          if(cord==""){cord=Global_DATA[i][ii][0];}
          data_zup.push([cord,start,Global_DATA[i][ii][1],interval,nametr,id,Global_DATA[i][ii][6]]);
          start=0;
          }
          if(start!=0 && ii==Global_DATA[i].length-2){
            interval = (Date.parse(Global_DATA[i][ii][1])/1000)-(Date.parse(start)/1000);
            data_zup.push([cord,start,Global_DATA[i][ii][1],interval,nametr,id,Global_DATA[i][ii][6]]);
          start=0;
          }
          if(start==0 && Global_DATA[i][ii][3][0]!=0 && (Global_DATA[i][ii+1][4]-Global_DATA[i][ii][4])/1000>500){
            data_zup.push([Global_DATA[i][ii][0],Global_DATA[i][ii][1],Global_DATA[i][ii][1],500,nametr,id,Global_DATA[i][ii][6]]);
            data_zup.push([Global_DATA[i][ii+1][0],Global_DATA[i][ii+1][1],Global_DATA[i][ii+1][1],500,nametr,id,Global_DATA[i][ii+1][6]]);
          }

    }
  }


  poezdki();



//  icl3+=1;
//   if(icl3==0){msg('ЗАЧЕКАЙТЕ -завантаження');data_zup = [];}
//  $('button').prop("disabled", true);
 
//    if(icl3< unitslist.length){
  
//      idun3 = unitslist[icl3];
//      var name =idun3.getName();
   
//      if(mr_tehnika=='000'){
//      if(name.indexOf('Камаз')>=0|| name.indexOf('SCANIA')>=0){ 
          
//       if(name.indexOf('Шкурат')<0 && name.indexOf('Білоус')<0 && name.indexOf('Штацький')<0 && name.indexOf('Дробниця')<0 && name.indexOf('Писаренко')<0 && name.indexOf('Колотуша')<0){

//         executeReport3(idun3);
//       } else{Cikle3();}
      

//      }else{Cikle3();}
     
//      }else{
//       if(mr_tehnika=='111'){
//        if(name.indexOf('Найм')>=0|| name.indexOf('найм')>=0|| name.indexOf('ТОВ')>=0|| name.indexOf('Фоп')>=0|| name.indexOf('ФОП')>=0){ 
//         executeReport3(idun3);
//        } else{Cikle3();}
//       }else{
//      if(name.indexOf(mr_tehnika)>=0){ 
//           executeReport3(idun3);

//      }else{Cikle3();}
//      }
//      }
    
    
//     }else{
//     icl3=-1;

//     $('button').prop("disabled", false);
//     msg('ЗАВЕРШЕНО');
//      poezdki();
    
//     }
    

 }
// function executeReport3(id){ // execute selected report
//     // get data from corresponding fields
//   var id_res=RES_ID, id_templ=zvit2, id_unit=id.getId(), time=$("#interval").val(),idddd=id;
// 	if(!id_res){ msg("Select resource"); return;} // exit if no resource selected
// 	if(!id_templ){ msg("Select report template"); return;} // exit if no report template selected
// 	if(!id_unit){ msg("Select unit"); return;} // exit if no unit selected

// 	var sess = wialon.core.Session.getInstance(); // get instance of current Session
// 	var res = sess.getItem(id_res); // get resource by id
// 	var to = Date.parse($('#fromtime2').val())/1000; // get current server time (end time of report time interval)
//   var nam = sess.getItem(id_unit).getName();
// 	var from = Date.parse($('#fromtime1').val())/1000; // calculate start time of report
// 	// specify time interval object
// 	var interval = { "from": from, "to": to, "flags": wialon.item.MReport.intervalFlag.absolute };
// 	var template = res.getReport(id_templ); // get report template by id
// 	$("#exec_btn").prop("disabled", true); // disable button (to prevent multiclick while execute)

// 	res.execReport(template, id_unit, 0, interval, // execute selected report
// 		function(code, data) { // execReport template
// 			$("#exec_btn").prop("disabled", false); // enable button
// 			if(code){ msg(wialon.core.Errors.getErrorText(code)); Cikle3();return; } // exit if error code
// 			if(!data.getTables().length){ // exit if no tables obtained
// 			 Cikle3();return; }
// 			else showReportResult3(data,idddd); // show report result
// 	});
// }
// var data_zup = [];

// function showReportResult3(result,name){ // show result after report execute
// 	var tables = result.getTables(); // get report tables
// 	if (!tables)  {Cikle3(); return;} // exit if no tables

   
// 	for(var i=0; i < tables.length; i++){ // cycle on tables
// 		// html contains information about one table
// 		var html = [];
//     var start=0;
//     var cord=0;
//     var interval=0;
		
// 		 //data_unit = [[],[]];
		
		
// 		result.getTableRows(i, 0, tables[i].rows, // get Table rows
// 			qx.lang.Function.bind( function(html, code, rows) { // getTableRows callback
// 				if (code) {msg(wialon.core.Errors.getErrorText(code));  Cikle3(); return;} // exit if error code
// 				for(var j in rows) { // cycle on table rows
// 					if (typeof rows[j].c == "undefined") continue; // skip empty rows
					
//           if(start==0 && getTableValue(rows[j].c[2])=='0 км/ч'){start=getTableValue(rows[j].c[1]), cord=getTableValue(rows[j].c[0]);}
//           if(start!=0 && getTableValue(rows[j].c[2])!='0 км/ч'){
//           interval = (Date.parse(getTableValue(rows[j].c[1]))/1000)-(Date.parse(start)/1000);
//           //msg(cord+' '+start+' '+getTableValue(rows[j].c[1])+' '+interval+' '+name.getName()+' '+name.getId()); 
//           if(cord==""){cord=getTableValue(rows[j].c[0]);}
//           data_zup.push([cord,start,getTableValue(rows[j].c[1]),interval,name.getName(),name.getId(),getTableValue(rows[j].c[3])]);
//           start=0;
//           }
//           if(start!=0 && j==rows.length-1){
//           interval = (Date.parse(getTableValue(rows[j].c[1]))/1000)-(Date.parse(start)/1000);
//           data_zup.push([cord,start,getTableValue(rows[j].c[1]),interval,name.getName(),name.getId()]);
//           start=0;
//           }
          
//        // msg(name.getName());
         
// 				}
//          Cikle3();      				
// 			}, this, html)
// 		);
// 	}
   
// }
$('#zvitttt').hide();
var mar_zupinki=[];
function poezdki(){
var tableRow =document.querySelectorAll('#marshrut tr');
var name=0;
var id=0;
var start=0;
var stop=0;
var intervall1=0;
var intervall2=0;
var pereyezd=0;

let st1=0;
let st2=0;
let st3=0;


let zaizd='-----';
let viizd='-----';
let prostKKZ=0;
let prostPole=0;
let prostGruz=0;

var intj=0;
var intervall3=0;
mar_zupinki=[];
var y,x,yy,xx,dis,dis2;
for(var i=0; i < data_zup.length; i++){ 
if(i>0){
  if(data_zup[i][5]!=data_zup[i-1][5]){
  name=0;
  id=0;
  start=0;
  stop=0;
  intervall1=0;
  intervall2=0;
  intj=0;
  intervall3=0;
  pereyezd=0;
  
  if(prostKKZ>0){
    let m = Math.trunc(prostKKZ / 60) + '';
    let h = Math.trunc(m / 60) + '';
    m=(m % 60) + '';
    $("#zvitt").append("<tr><td nowrap>" + data_zup[i-1][4] + "</td><td nowrap>" + zaizd + "</td><td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + "</td><td nowrap>-----</td><td nowrap>розвантаження</td></tr>");
  }
  if(prostPole>0){
    let m = Math.trunc(prostPole / 60) + '';
    let h = Math.trunc(m / 60) + '';
    m=(m % 60) + '';
    $("#zvitt").append("<tr><td nowrap>" + data_zup[i-1][4] + "</td><td nowrap>" + zaizd + "</td><td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + "</td><td nowrap>-----</td><td nowrap>завантаження</td></tr>");
  }
  zaizd='-----';
  viizd='-----';
  prostKKZ=0;
  prostPole=0;
  prostGruz=0;

  $("#zvitt").append("<tr><td nowrap>-----</td><td nowrap>-----</td><td nowrap>поле</td><td nowrap>ККЗ</td><td nowrap>в дорозі</td></tr>");
  let html="<tr><td nowrap>-----</td><td nowrap>-----</td>";
  let m = Math.trunc(st2 / 60) + '';
  let h = Math.trunc(m / 60) + '';
  m=(m % 60) + '';
  html+="<td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + ":00</td>";
      m = Math.trunc(st1 / 60) + '';
      h = Math.trunc(m / 60) + '';
      m=(m % 60) + '';
  html+="<td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + ":00</td>";
      m = Math.trunc(st3 / 60) + '';
      h = Math.trunc(m / 60) + '';
      m=(m % 60) + '';
  html+="<td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + ":00</td></tr>";
  $("#zvitt").append(html);
   st1=0;
   st2=0;
   st3=0;
  }
}else{
  if(data_zup[i][5]!=data_zup[i+1][5]){  
    name=0;
    id=0;
    start=0;
    stop=0;
    intervall1=0;
    intervall2=0;
    intj=0;
    intervall3=0;
    pereyezd=0;
    
    if(prostKKZ>0){
      let m = Math.trunc(prostKKZ / 60) + '';
      let h = Math.trunc(m / 60) + '';
      m=(m % 60) + '';
      $("#zvitt").append("<tr><td nowrap>" + data_zup[i][4] + "</td><td nowrap>" + zaizd + "</td><td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + "</td><td nowrap>-----</td><td nowrap>розвантаження</td></tr>");
    }
    if(prostPole>0){
      let m = Math.trunc(prostPole / 60) + '';
      let h = Math.trunc(m / 60) + '';
      m=(m % 60) + '';
      $("#zvitt").append("<tr><td nowrap>" + data_zup[i][4] + "</td><td nowrap>" + zaizd + "</td><td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + "</td><td nowrap>-----</td><td nowrap>завантаження</td></tr>");
    }
    zaizd='-----';
    viizd='-----';
    prostKKZ=0;
    prostPole=0;
    prostGruz=0;
    
    $("#zvitt").append("<tr><td nowrap>-----</td><td nowrap>-----</td><td nowrap>поле</td><td nowrap>ККЗ</td><td nowrap>в дорозі</td></tr>");
    let html="<tr><td nowrap>-----</td><td nowrap>-----</td>";
    let m = Math.trunc(st2 / 60) + '';
    let h = Math.trunc(m / 60) + '';
    m=(m % 60) + '';
    html+="<td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + ":00</td>";
        m = Math.trunc(st1 / 60) + '';
        h = Math.trunc(m / 60) + '';
        m=(m % 60) + '';
    html+="<td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + ":00</td>";
        m = Math.trunc(st3 / 60) + '';
        h = Math.trunc(m / 60) + '';
        m=(m % 60) + '';
    html+="<td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + ":00</td></tr>";
    $("#zvitt").append(html);
     st1=0;
     st2=0;
     st3=0;
    }
    
}
if(i==data_zup.length-1){
  if(prostKKZ>0){
    let m = Math.trunc(prostKKZ / 60) + '';
    let h = Math.trunc(m / 60) + '';
    m=(m % 60) + '';
    $("#zvitt").append("<tr><td nowrap>" + data_zup[i][4] + "</td><td nowrap>" + zaizd + "</td><td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + "</td><td nowrap>-----</td><td nowrap>розвантаження</td></tr>");
  }
  if(prostPole>0){
    let m = Math.trunc(prostPole / 60) + '';
    let h = Math.trunc(m / 60) + '';
    m=(m % 60) + '';
    $("#zvitt").append("<tr><td nowrap>" + data_zup[i][4] + "</td><td nowrap>" + zaizd + "</td><td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + "</td><td nowrap>-----</td><td nowrap>завантаження</td></tr>");
  }
  zaizd='-----';
  viizd='-----';
  prostKKZ=0;
  prostPole=0;
  prostGruz=0;

  $("#zvitt").append("<tr><td nowrap>-----</td><td nowrap>-----</td><td nowrap>поле</td><td nowrap>ККЗ</td><td nowrap>в дорозі</td></tr>");
  let html="<tr><td nowrap>-----</td><td nowrap>-----</td>";
  let m = Math.trunc(st2 / 60) + '';
  let h = Math.trunc(m / 60) + '';
  m=(m % 60) + '';
  html+="<td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + ":00</td>";
      m = Math.trunc(st1 / 60) + '';
      h = Math.trunc(m / 60) + '';
      m=(m % 60) + '';
  html+="<td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + ":00</td>";
      m = Math.trunc(st3 / 60) + '';
      h = Math.trunc(m / 60) + '';
      m=(m % 60) + '';
  html+="<td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + ":00</td></tr>";
  $("#zvitt").append(html);
   st1=0;
   st2=0;
   st3=0;
}


if( data_zup[i][3]>30){
     y = parseFloat(data_zup[i][0].split(',')[0]);
     x = parseFloat(data_zup[i][0].split(',')[1]);

       yy = parseFloat(xy2.split(',')[0]);
       xx = parseFloat(xy2.split(',')[1]);
       dis = wialon.util.Geometry.getDistance(y, x, yy, xx);
      if(start != 0 && dis<=mr_radius2){
      intervall2+= data_zup[i][3];
      if(intervall2>mr_interval*60){
      if(stop==0){stop = data_zup[i][1];} 
       if(pereyezd==0){mar_zupinki.push([mr_name1,mr_name2,id,name,start,stop,data_zup[i][6]]);}else{mar_zupinki.push([mr_name1+' переїзд '+pereyezd,mr_name2,id,name,start,stop,data_zup[i][6]]);}
       name = 0;
       id= 0;
       start = 0;
       stop=0;
       intervall2=0;
       intervall3=0;
       pereyezd=0;
       }
      }else{intervall2=0; stop=0;}


     yy = parseFloat(xy1.split(',')[0]);
     xx = parseFloat(xy1.split(',')[1]);
     dis2 = wialon.util.Geometry.getDistance(y, x, yy, xx);
      if(dis2<=mr_radius1){
      intervall1+= data_zup[i][3];
       if(intervall1>mr_interval*60){
        name = data_zup[i][4];
        id= data_zup[i][5];
        start = data_zup[i][2];
        stop=0;
        pereyezd=0;
       }
      }else{ 
      intervall1=0;
      //===================================================================================     
             if(start!=0 && chek==true){
             for ( j = 1; j < tableRow.length; j++){
               yy = parseFloat(tableRow[j].cells[2].innerHTML.split(',')[0]);
               xx = parseFloat(tableRow[j].cells[2].innerHTML.split(',')[1]);
               dis = wialon.util.Geometry.getDistance(y, x, yy, xx);
               if(dis<=tableRow[j].cells[6].textContent &&  rov_index!=j){ 
                if(intj!=j){intj=j;intervall3=0;}
                intervall3+= data_zup[i][3];
                 if(intervall3>mr_interval*60){ intervall1=0; intervall2=0;intervall3=0;pereyezd=tableRow[j].cells[0].children[0].value;}
                 break;
                 }
               }
              }
  //=================================================================================  
      
      }
      
      if(dis<=mr_radius2){
        if(prostPole>0){
          let m = Math.trunc(prostPole / 60) + '';
          let h = Math.trunc(m / 60) + '';
          m=(m % 60) + '';
          $("#zvitt").append("<tr><td nowrap>" + data_zup[i][4] + "</td><td nowrap>" + zaizd + "</td><td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + "</td></td><td nowrap>" + viizd + "</td><td nowrap>завантаження</td></tr>");
          prostPole=0;
          zaizd=0;
          viizd=0;
        }
        if(zaizd==0)zaizd=data_zup[i][1];
        viizd=data_zup[i][2];
        prostKKZ+=data_zup[i][3];
        st1+=data_zup[i][3];
      }else{
        if(prostKKZ>0){
          let m = Math.trunc(prostKKZ / 60) + '';
          let h = Math.trunc(m / 60) + '';
          m=(m % 60) + '';
          if(zaizd=='-----'){
            $("#zvitt").append("<tr><td nowrap>" + data_zup[i][4] + "</td><td nowrap>" + zaizd + "</td><td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + "</td></td><td nowrap>" + viizd + "</td><td nowrap>початок зміни</td></tr>");
            }else{
            $("#zvitt").append("<tr><td nowrap>" + data_zup[i][4] + "</td><td nowrap>" + zaizd + "</td><td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + "</td></td><td nowrap>" + viizd + "</td><td nowrap>розвантаження</td></tr>");
            }
            prostKKZ=0;
          zaizd=0;
          viizd=0;
        }
        if(dis2<=mr_radius1){
          if(zaizd==0)zaizd=data_zup[i][1];
          viizd=data_zup[i][2];
          prostPole+=data_zup[i][3];
          st2+=data_zup[i][3];
        }else{
          if(prostPole>0){
            let m = Math.trunc(prostPole / 60) + '';
            let h = Math.trunc(m / 60) + '';
            m=(m % 60) + '';
            $("#zvitt").append("<tr><td nowrap>" + data_zup[i][4] + "</td><td nowrap>" + zaizd + "</td><td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + "</td></td><td nowrap>" + viizd + "</td><td nowrap>завантаження</td></tr>");
            prostPole=0;
            zaizd=0;
            viizd=0;
          }
          if( data_zup[i][3]>300){ 
            prostGruz=data_zup[i][3];
            let m = Math.trunc(prostGruz / 60) + '';
            let h = Math.trunc(m / 60) + '';
            m=(m % 60) + '';
            $("#zvitt").append("<tr><td nowrap>" + data_zup[i][4] + "</td><td nowrap>-----</td><td nowrap>" +h.padStart(2, 0) + ':' + m.padStart(2, 0) + "</td></td><td nowrap>-----</td><td nowrap>в дорозі</td></tr>");
            st3+=data_zup[i][3];
          }
        }
      }


}


}

if(mar_zupinki.length>0){Cikle5();}
}

var icl5 =-1;
var idun5=0;
var data_zvit = [];
function Cikle5(){
 icl5+=1;
  if(icl5==0){msg('ЗАЧЕКАЙТЕ -завантаження'); data_zvit = [];}
 $('button').prop("disabled", true);
   
   if(icl5< mar_zupinki.length){
  
          executeReport5();

    }else{
    icl5=-1;

    $('button').prop("disabled", false);
    msg('ЗАВЕРШЕНО');
   
    
    }
    

}
function executeReport5(){ // execute selected report
    // get data from corresponding fields
  var id_res=RES_ID, id_templ=zvit4, id_unit=mar_zupinki[icl5][2];
	if(!id_res){ msg("Select resource"); return;} // exit if no resource selected
	if(!id_templ){ msg("Select report template"); return;} // exit if no report template selected
	if(!id_unit){ msg("Select unit"); return;} // exit if no unit selected

	var sess = wialon.core.Session.getInstance(); // get instance of current Session
	var res = sess.getItem(id_res); // get resource by id
	var to = Date.parse(mar_zupinki[icl5][5])/1000; // get current server time (end time of report time interval)
  var nam = sess.getItem(id_unit).getName();
	var from = Date.parse(mar_zupinki[icl5][4])/1000; // calculate start time of report
	// specify time interval object
	var interval = { "from": from, "to": to, "flags": wialon.item.MReport.intervalFlag.absolute };
	var template = res.getReport(id_templ); // get report template by id
	$("#exec_btn").prop("disabled", true); // disable button (to prevent multiclick while execute)

	res.execReport(template, id_unit, 0, interval, // execute selected report
		function(code, data) { // execReport template
			$("#exec_btn").prop("disabled", false); // enable button
			if(code){ msg(wialon.core.Errors.getErrorText(code)); Cikle5();return; } // exit if error code
			if(!data.getTables().length){ // exit if no tables obtained
			 Cikle5();return; }
			else showReportResult5(data,id_unit); // show report result
	});
}


function showReportResult5(result,id){ // show result after report execute
	var tables = result.getTables(); // get report tables
	if (!tables)  {Cikle5(); return;} // exit if no tables

   
	for(var i=0; i < tables.length; i++){ // cycle on tables
		// html contains information about one table
		var html =  "<tr class='mar_trak' id='" + id + "'>";
		result.getTableRows(i, 0, tables[i].rows, // get Table rows
			qx.lang.Function.bind( function(html, code, rows) { // getTableRows callback
				if (code) {msg(wialon.core.Errors.getErrorText(code));  Cikle5(); return;} // exit if error code
				for(var j in rows) { // cycle on table rows
					if (typeof rows[j].c == "undefined") continue; // skip empty rows
     
       //msg(mar_zupinki[icl5][0]+' '+mar_zupinki[icl5][2]+' '+mar_zupinki[icl5][3]+' '+mar_zupinki[icl5][4]+' '+getTableValue(rows[j].c[0])+' '+getTableValue(rows[j].c[1])+' '+getTableValue(rows[j].c[2])+' '+getTableValue(rows[j].c[3])+' '+getTableValue(rows[j].c[4])+' '+getTableValue(rows[j].c[5]));
         html += "<td nowrap>" + mar_zupinki[icl5][3] + "</td>";
         html += "<td nowrap>" + mar_zupinki[icl5][0] + "</td>";
         html += "<td nowrap>" + mar_zupinki[icl5][1] + "</td>";
         html += "<td nowrap>" + mar_zupinki[icl5][4].split(' ')[0] + "</td>";
         html += "<td nowrap>" + getTableValue(rows[j].c[1]) + "</td>";
         html += "<td nowrap>" + getTableValue(rows[j].c[0]) + "</td>";
         html += "<td nowrap>" + getTableValue(rows[j].c[2]) + "</td>";
         html += "<td nowrap>" + getTableValue(rows[j].c[3]) + "</td>";
         html += "<td nowrap>" + mar_zupinki[icl5][6] + "</td>";
         html += "<td nowrap>" + getTableValue(rows[j].c[4]) + "</td>";
         html += "<td nowrap>" + getTableValue(rows[j].c[5]) + "</td>";
         html += "<td nowrap>" + mar_zupinki[icl5][4] + "</td>";
         html += "<td nowrap>" + mar_zupinki[icl5][5] + "</td>";
         
        
				}
        data_zvit.push([mar_zupinki[icl5][3],mar_zupinki[icl5][0],mar_zupinki[icl5][1],mar_zupinki[icl5][4].split(' ')[0],getTableValue(rows[j].c[1]),getTableValue(rows[j].c[0]),getTableValue(rows[j].c[2]),getTableValue(rows[j].c[3]),mar_zupinki[icl5][6],getTableValue(rows[j].c[4]),getTableValue(rows[j].c[5]),mar_zupinki[icl5][4],mar_zupinki[icl5][5]]);
      
        $("#zvit").append(html);
         Cikle5();      				
			}, this, html)
		);
	}
   
}


function track_marshruta(evt){
 [...document.querySelectorAll("#zvit tr")].forEach(e => e.style.backgroundColor = '');
 this.style.backgroundColor = 'pink';
 //msg(this.rowIndex);
 // msg(data_zvit[this.rowIndex-1][2]);
 // msg(this.id);
 $("#lis0").chosen().val(this.id);     
 $("#lis0").trigger("chosen:updated");
 show_track(data_zvit[this.rowIndex-1][11],data_zvit[this.rowIndex-1][12]);
  markerByUnit[this.id].openPopup();
}





//=================Data===================================================================================
Global_DATA=[];
function UpdateGlobalData(t2=0,idrep=zvit2,i=0){
    if(i==0){
     $('#eeew').prop("disabled", true);
     if($('#fromtime1').val()!=from111 || $('#fromtime2').val()!=from222){
       Global_DATA = [];
       from111=$('#fromtime1').val();
       from222=$('#fromtime2').val();
       t2=Date.parse($('#fromtime2').val())/1000;
      }else{ 
       from222 =(new Date(Date.now() - tzoffset)).toISOString().slice(0, -8);
       $('#fromtime2').val(from222);
       t2=Date.parse($('#fromtime2').val())/1000;
      }
    } 
    if(i < unitslist.length){
        $('#log').empty();
        let ld=unitslist.length-i;
        let pr=100-Math.round(ld*100/unitslist.length);
        let pr1="";
        let pr2="";
        for (let j=0; j<pr; j++){ pr1+="|";}
        for (let j=0; j<100-pr; j++){ pr2+=":";}
        msg("["+pr1+pr2+"] "+ld);
        CollectGlobalData(t2,idrep,i,unitslist[i]);
    } else {
      $('button').prop("disabled", false);
      $('#log').empty();
      msg('Завантажено  ---'+from222);
    }   
}

let list_zavatajennya=[];
function CollectGlobalData(t2,idrep,i,unit){ // execute selected report
  let id_res=RES_ID, id_unit = unit.getId(), ii=i;
  if(Global_DATA[ii]==undefined){Global_DATA.push([[id_unit,unit.getName(),Date.parse($('#fromtime1').val())/1000]])}
  let t1=Global_DATA[ii][0][2];
  if($('#uni_data').val()!="All"){
  let str =$('#uni_data').val().split(',');
  let ok=0;
  str.forEach((element) => {if(unit.getName().indexOf(element)>=0){ok=1}});
  if(ok==0){ii++; UpdateGlobalData(t2,idrep,ii);return;}
  }
  //if($("#gif").is(":checked")) {for (let iii=0; iii<list_zavatajennya.length; iii++){if(list_zavatajennya[iii]==id_unit){break;}if(list_zavatajennya[iii].length-1==iii){ii++; UpdateGlobalData(t2,idrep,ii);return;}}}
	if(!id_res){ msg("Select resource"); return;} // exit if no resource selected
	if(!idrep){ msg("Select report template"); return;} // exit if no report template selected
	if(!id_unit){ msg("Select unit"); return;} // exit if no unit selected
	var sess = wialon.core.Session.getInstance(); // get instance of current Session
	var res = sess.getItem(id_res); // get resource by id
	// specify time interval object
	var interval = { "from": t1, "to": t2, "flags": wialon.item.MReport.intervalFlag.absolute };
	var template = res.getReport(idrep); // get report template by id
  
	 res.execReport(template, id_unit, 0, interval, // execute selected report
		function(code, data) { // execReport template
			if(code){ msg(wialon.core.Errors.getErrorText(code));ii++; UpdateGlobalData(t2,idrep,ii);return; } // exit if error code
			if(!data.getTables().length){ii++; UpdateGlobalData(t2,idrep,ii); return; }
			else{
        let tables = data.getTables();
        let headers = tables[0].header;
        let it=0;
        let litry=0;
        let datt=0;
        for (let j=4; j<headers.length; j++) {if (headers[j].indexOf('Топливо')>=0 || headers[j].indexOf('Паливо')>=0){it=j;}}
        data.getTableRows(0, 0, tables[0].rows,function( code, rows) { 
          if (code) {msg(wialon.core.Errors.getErrorText(code)); ii++; UpdateGlobalData(t2,idrep,ii);return;} 
          for(let j in rows) { 
            if (typeof rows[j].c == "undefined") continue;
            //if (j>0 && getTableValue(rows[j].c[0]) == getTableValue(rows[j-1].c[0]) ) continue;
            litry=0;
            if (it>0) litry=getTableValue(rows[j].c[it]); 
            datt= Date.parse(getTableValue(rows[j].c[1]));
            Global_DATA[ii].push([getTableValue(rows[j].c[0]),getTableValue(rows[j].c[1]),litry,getTableValue(rows[j].c[2]),datt,getTableValue(rows[j].c[4]),getTableValue(rows[j].c[3])]);
            Global_DATA[ii][0][2]=datt/1000+1;
          }
          ii++;
          UpdateGlobalData(t2,idrep,ii);
        });
      }  
	});       
}




function getTableValue(data) { // calculate ceil value
	if (typeof data == "object")
		if (typeof data.t == "string") return data.t; else return "";
	else return data;
}


var slider = document.getElementById("myRange");
var output = document.getElementById("f");
output.innerHTML = from222; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
    var interval = Date.parse($('#fromtime1').val())+(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))/2000*this.value;
    position(interval);
}

document.addEventListener('keydown', function(event) {
	if(event.code == "KeyA"){
    let t=Date.parse($('#f').text())-3000;
    if(t<Date.parse($('#fromtime1').val()))t=Date.parse($('#fromtime1').val());
    slider.value=(t-Date.parse($('#fromtime1').val()))/(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))*2000;
    position(t);
  }
  if(event.code == "KeyD"){
    let t=Date.parse($('#f').text())+3000;
    if(t>Date.parse($('#fromtime2').val()))t=Date.parse($('#fromtime2').val());
    slider.value=(t-Date.parse($('#fromtime1').val()))/(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))*2000;
    position(t);
  }
});

function position(t)  {
  var interval = t;
  var id=0;
  var calk=true;
  var cur_day1111 = new Date(interval);
  var month2 = cur_day1111.getMonth()+1;   
  var from2222 = cur_day1111.getFullYear() + '-' + (month2 < 10 ? '0' : '') + month2 + '-' + cur_day1111.getDate()+ ' ' + cur_day1111.getHours()+ ':' + cur_day1111.getMinutes()+ ':' + cur_day1111.getSeconds();
  output.innerHTML = from2222;
  var x,y,markerrr;
    for(let ii = 0; ii<Global_DATA.length; ii++){
     if(Global_DATA[ii].length<5) continue;
     let ind=1;
     id=Global_DATA[ii][0][0];
     if(filtr==true){
      calk=false;
      for(let v = 0; v<filtr_data.length; v++){ 
        if(filtr_data[v]==id){
          calk=true;
          break;
        } 
      } 
     }
     if(calk==false) continue;

     markerrr = markerByUnit[id];
     if (markerrr){
      if(rux == 1){var opt = markerrr.options.opacity;if(opt>0.02)markerrr.setOpacity(opt*0.97);}
     for(let iii = Global_DATA[ii].length-1; iii>0; iii-=200){
      if(interval>Global_DATA[ii][iii][4]) {ind=iii;break;}
     }
     for(let i = ind; i<Global_DATA[ii].length; i++){
         if(interval<Global_DATA[ii][i][4]){
           if(Global_DATA[ii][i][0]=="")continue;
            y = parseFloat(Global_DATA[ii][i][0].split(',')[0]);
            x = parseFloat(Global_DATA[ii][i][0].split(',')[1]);
            markerrr.setLatLng([y, x]); 
            markerrr.bindPopup('<center><font size="1">'+Global_DATA[ii][0][1] +'<br />' +Global_DATA[ii][i][1]+ '<br />' +Global_DATA[ii][i][3]+ '<br />' +Global_DATA[ii][i][2]+'л'+ '<br />' +Global_DATA[ii][i][5]+ '<br />' +Global_DATA[ii][i][6]);
            if(rux == 1){if (Global_DATA[ii][i][3][0]!='0' ) {markerrr.setOpacity(1);}}
            if(agregat == 21){ if (Global_DATA[ii][i][5][0]=='Д' ) {markerrr.setOpacity(1);}else{markerrr.setOpacity(0);}}
            if(agregat == 22){ if (Global_DATA[ii][i][5][0]=='К' ) {markerrr.setOpacity(1);}else{markerrr.setOpacity(0);}}
            if(agregat == 23){ if (Global_DATA[ii][i][5][0]=='Б' ) {markerrr.setOpacity(1);}else{markerrr.setOpacity(0);}}
            if(agregat == 24){ if (Global_DATA[ii][i][5][0]=='Г' ) {markerrr.setOpacity(1);}else{markerrr.setOpacity(0);}}
            if(agregat == 25){ if (Global_DATA[ii][i][5][0]=='П' ) {markerrr.setOpacity(1);}else{markerrr.setOpacity(0);}}
            if(agregat == 26){ if (Global_DATA[ii][i][5][0]=='Р' ) {markerrr.setOpacity(1);}else{markerrr.setOpacity(0);}}
            //if(rux == 27){ if (Global_DATA[ii][i][5][0]=='О' ) {markerrr.setOpacity(1);}else{markerrr.setOpacity(0);}}
            if(agregat == 28){ if (Global_DATA[ii][i][5][0]=='С' ) {markerrr.setOpacity(1);}else{markerrr.setOpacity(0);}}
            if(agregat == 29){ if (Global_DATA[ii][i][5][0]=='Ж' ) {markerrr.setOpacity(1);}else{markerrr.setOpacity(0);}}
            if(agregat == 30){ if (Global_DATA[ii][i][5][0]!=null ) {markerrr.setOpacity(0);}}
            break;
          }
     }
    }
  }
}
    
var tik =0;
var sec =600;
var sec2=200;
setInterval(function() {
  sec2--;
  if (sec2 <= 0 ) {jurnal_online();sec2=1000;}
if($("#gif").is(":checked")) {
  //msg(sec/10);
   let t=Date.parse($('#f').text())+10000;
    tik=slider.value;
    sec++;
    tik++;
    slider.value=tik;
    if (tik >= 1999) {tik =1800;slider.value=tik; t = Date.parse($('#fromtime1').val())+(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))/2000*tik;}
    if (sec > 3000) {
    sec =0;
    UpdateGlobalData(0,zvit2,0);
    }
    if (sec == 1000 && $("#monitoring_gif").is(":checked")) {Monitoring2();}
    
    
    if(t>Date.parse($('#fromtime2').val()))t=Date.parse($('#fromtime2').val());
    slider.value=(t-Date.parse($('#fromtime1').val()))/(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))*2000;
    position(t);
  }
  }, 120);
 

    
    
var icl2 =-1;
var idun2=0;
let maska_zup='All';
let min_zup=60;
let alone = false;

function Cikle2(){
 icl2+=1;
 if(icl2==0)data_zup=[];
    let str = maska_zup.split(',');
    let unit= false;
    if (maska_zup=='All')unit= true;
      if(icl2 < unitslist.length){
        str.forEach((element) => {if(unitslist[icl2].getName().indexOf(element)>=0){unit = true;}});
        if(unit){
          msg(unitslist.length-icl2);
          idun2 = unitslist[icl2];
          executeReport2(idun2);
        }else{ Cikle2(); }
      } else {
        icl2=-1;
        $('button').prop("disabled", false);
        $('#log').empty();
        msg('Завантажено');
        zupinki();
      }   
}
function executeReport2(id){ // execute selected report
    // get data from corresponding fields
  var id_res=RES_ID, id_templ=zvit3, id_unit=id.getId(), time=$("#interval").val(),idddd=id;
	if(!id_res){ msg("Select resource"); return;} // exit if no resource selected
	if(!id_templ){ msg("Select report template"); return;} // exit if no report template selected
	if(!id_unit){ msg("Select unit"); return;} // exit if no unit selected

	var sess = wialon.core.Session.getInstance(); // get instance of current Session
	var res = sess.getItem(id_res); // get resource by id
	var to = Date.parse($('#fromtime2').val())/1000; // get current server time (end time of report time interval)
  var nam = sess.getItem(id_unit).getName();
	var from = Date.parse($('#fromtime1').val())/1000; // calculate start time of report
	// specify time interval object
	var interval = { "from": from, "to": to, "flags": wialon.item.MReport.intervalFlag.absolute };
	var template = res.getReport(id_templ); // get report template by id
	$("#exec_btn").prop("disabled", true); // disable button (to prevent multiclick while execute)

	res.execReport(template, id_unit, 0, interval, // execute selected report
		function(code, data) { // execReport template
			$("#exec_btn").prop("disabled", false); // enable button
			if(code){ msg(wialon.core.Errors.getErrorText(code)); Cikle2();return; } // exit if error code
			if(!data.getTables().length){ // exit if no tables obtained
			 Cikle2();return; }
			else showReportResult2(data,idddd); // show report result
	});
}
var data_zup = [];

function showReportResult2(result,name){ // show result after report execute
	var tables = result.getTables(); // get report tables
	if (!tables)  {Cikle2(); return;} // exit if no tables
   
		var html = [];
		
		 //data_unit = [[],[]];
		
		if(tables.length>1){
		result.getTableRows(1, 0, tables[1].rows, // get Table rows
			qx.lang.Function.bind( function(html, code, rows) { // getTableRows callback
				if (code) {msg(wialon.core.Errors.getErrorText(code)); return;} // exit if error code
				for(var j in rows) { // cycle on table rows
					if (typeof rows[j].c == "undefined") continue; // skip empty rows
					data_zup.push([getTableValue(rows[j].c[0]),getTableValue(rows[j].c[1]),getTableValue(rows[j].c[2]),getTableValue(rows[j].c[3]),name.getName(),name.getId(),getTableValue(rows[j].c[5]),getTableValue(rows[j].c[6])]);
        //msg(name.getName());
       
				} 	
        result.getTableRows(0, 0, tables[0].rows, // get Table rows
			  qx.lang.Function.bind( function(html, code, rows) { // getTableRows callback
				if (code) {msg(wialon.core.Errors.getErrorText(code));  Cikle2(); return;} // exit if error code
				for(var j in rows) { // cycle on table rows
					if (typeof rows[j].c == "undefined") continue; // skip empty rows
					data_zup.push([getTableValue(rows[j].c[0]),getTableValue(rows[j].c[1]),getTableValue(rows[j].c[2]),getTableValue(rows[j].c[3]),name.getName(),name.getId(),getTableValue(rows[j].c[5]),getTableValue(rows[j].c[6])]);
        //msg(name.getName());
         
				}
         Cikle2();    				
			}, this, html)
		);			
			}, this, html)
		);
} else{
result.getTableRows(0, 0, tables[0].rows, // get Table rows
			qx.lang.Function.bind( function(html, code, rows) { // getTableRows callback
				if (code) {msg(wialon.core.Errors.getErrorText(code));  Cikle2(); return;} // exit if error code
				for(var j in rows) { // cycle on table rows
					if (typeof rows[j].c == "undefined") continue; // skip empty rows
					data_zup.push([getTableValue(rows[j].c[0]),getTableValue(rows[j].c[1]),getTableValue(rows[j].c[2]),getTableValue(rows[j].c[3]),name.getName(),name.getId(),getTableValue(rows[j].c[5]),getTableValue(rows[j].c[6])]);
        //msg(name.getName());
         
				}
         Cikle2();    				
			}, this, html)
		);
}

}

var zup_mark_data=[];
var zup_hist=[];
function zupinki(){
 //for(var iii=0; iii < zup_mark_data.length; iii++){
// map.removeLayer(zup_mark_data[iii]);
 // if(iii == zup_mark_data.length-1){zup_mark_data=[];}
 //}

 for(var i=0; i < data_zup.length; i++){
 
  
if(data_zup[i][3].split(':').reverse().reduce((acc, n, iy) => acc + n * (60 ** iy), 0)<min_zup) continue;
       

 if(data_zup[i][0]){
    var y = parseFloat(data_zup[i][0].split(',')[0]);
    var x = parseFloat(data_zup[i][0].split(',')[1]);
    var mark=0;
    var gren=0;

    
    for(var ii=0; ii < zup_hist.length; ii++){
      if((data_zup[i][1]+data_zup[i][3])==zup_hist[ii]){gren=1;}
    }
    
   
     if(gren==1){
                mark = L.marker([y, x], {
                                  zIndexOffset:-1000,
                                  draggable: true,
                                  icon: L.icon({
                                  iconUrl: '222.png',
                                  iconSize:   [24, 24],
                                  iconAnchor: [12, 24] // set icon center
                                  })
                                  }).addTo(map);
                mark.bindPopup(data_zup[i][4]+'<br />'+data_zup[i][1]+'<br />'+data_zup[i][3]+'<br />'+data_zup[i][6]);
                zup_mark_data.push(mark);
                 mark.on('click', function(e) {
                   var cpdataa='';
                 cpdataa += e.target._popup._content.split('<br />')[0] + '\t' +e.target._popup._content.split('<br />')[1] + '\t' +e.target._popup._content.split('<br />')[2] + ' \t' + e.target._popup._content.split('<br />')[3];
  navigator.clipboard.writeText(cpdataa);  
  $("#lis0").chosen().val(unitsID[e.target._popup._content.split('<br />')[0]]); 
  $("#lis0").trigger("chosen:updated");
  layers[0]=0;

  var loo = (e.target._popup._content.split('<br />')[2]).split(':')[0]*3600000;
  var t1=  new Date(Date.parse(e.target._popup._content.split('<br />')[1])-3600000);
  var t2=  new Date(Date.parse(e.target._popup._content.split('<br />')[1])+3600000+loo);
  
   show_track(t1,t2);
   slider.value=(Date.parse(e.target._popup._content.split('<br />')[1])-Date.parse($('#fromtime1').val()))/(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))*2000;
   position(Date.parse(e.target._popup._content.split('<br />')[1]));
  
                   });
              }
     if(gren==0){
                mark = L.marker([y, x], {
                                  
                                  draggable: true,
                                  icon: L.icon({
                                  iconUrl: '111.png',
                                  iconSize:   [24, 24],
                                  iconAnchor: [12, 24] // set icon center
                                  })
                                  }).addTo(map);
                if(alone){if(tehnika_poruch(data_zup[i][4],y,x,Date.parse(data_zup[i][1]))){mark.setIcon(L.icon({iconUrl: '333.png',iconSize:[24, 24],iconAnchor: [12, 24]}));}}
                mark.bindPopup(data_zup[i][4]+'<br />'+data_zup[i][1]+'<br />'+data_zup[i][3]+'<br />'+data_zup[i][6]);
                zup_mark_data.push(mark);
                 mark.on('click', function(e) {
                   var cpdataa='';
                 cpdataa += e.target._popup._content.split('<br />')[0] + '\t' +e.target._popup._content.split('<br />')[1] + '\t' +e.target._popup._content.split('<br />')[2] + ' \t' + e.target._popup._content.split('<br />')[3];
  navigator.clipboard.writeText(cpdataa);  
  zup_hist.push(e.target._popup._content.split('<br />')[1]+e.target._popup._content.split('<br />')[2]);
  if(zup_hist.length>700){zup_hist.shift();}
  $("#lis0").chosen().val(unitsID[e.target._popup._content.split('<br />')[0]]); 
  $("#lis0").trigger("chosen:updated");
  layers[0]=0;
  var loo = (e.target._popup._content.split('<br />')[2]).split(':')[0]*3600000;
  var t1=  new Date(Date.parse(e.target._popup._content.split('<br />')[1])-3600000);
  var t2=  new Date(Date.parse(e.target._popup._content.split('<br />')[1])+3600000+loo);
 
   show_track(t1,t2);
    slider.value=(Date.parse(e.target._popup._content.split('<br />')[1])-Date.parse($('#fromtime1').val()))/(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))*2000;
   position(Date.parse(e.target._popup._content.split('<br />')[1]));
   e.target.setIcon(L.icon({iconUrl: '333.png',iconSize:   [24, 24],iconAnchor: [12, 24]}));
   localStorage.setItem('arhivzup', JSON.stringify(zup_hist)); 
                 });
              }
     
    
     
     
    }
   }
 }



 var svdata = JSON.parse(localStorage.getItem('arhivzup'));
 if(svdata)zup_hist=svdata;
  
  

 function fn_load2() {
  var svdata = JSON.parse(localStorage.getItem('arhivzup'));
  zup_hist=svdata;
  
 }
 
function clear(){  
 
 if(tile_layer) {map.removeLayer(tile_layer); tile_layer=null; layers[0]=0; }
}

function clear2(){  
 
  for(var iii=0; iii < zup_mark_data.length; iii++){
  map.removeLayer(zup_mark_data[iii]);
   if(iii == zup_mark_data.length-1){zup_mark_data=[];}
  }
  for(var iii=0; iii <  nav_mark_data.length; iii++){
   map.removeLayer( nav_mark_data[iii]);
    if(iii ==  nav_mark_data.length-1){ nav_mark_data=[];}
   }
 }
 function clearGEO(){  
   for(var i=0; i < geo_layer.length; i++){
  map.removeLayer(geo_layer[i]);
   if(i == geo_layer.length-1){geo_layer=[];}
  }

 }
 $( "#grupi_avto" ).on( "change", function() {
  chuse(0,this.value);
 });
 let filtr=false;
 let filtr_data=[];
function chuse(a,vibor) {
  var nmm,mm,idd;
  
  //  $('#v1').css({'background':'#e9e9e9'});
  //  $('#v2').css({'background':'#e9e9e9'});
  //  $('#v3').css({'background':'#e9e9e9'});
  //  $('#v4').css({'background':'#e9e9e9'});
  //  $('#v5').css({'background':'#e9e9e9'});
  //  $('#v6').css({'background':'#e9e9e9'});
  //  $('#v12').css({'background':'#e9e9e9'});
  //  $('#v13').css({'background':'#e9e9e9'});
  //  $('#v14').css({'background':'#e9e9e9'});
  //  $('#v21').css({'background':'#e9e9e9'});
  //  $('#v22').css({'background':'#e9e9e9'});
  //  $('#v23').css({'background':'#e9e9e9'});
  //  $('#v24').css({'background':'#e9e9e9'});
  //  $('#v25').css({'background':'#e9e9e9'});
  //  $('#v26').css({'background':'#e9e9e9'});
  //  $('#v27').css({'background':'#e9e9e9'});
  //  $('#v28').css({'background':'#e9e9e9'});
  //  $('#v29').css({'background':'#e9e9e9'});
  //  $('#v30').css({'background':'#e9e9e9'});

 
   if(!vibor){ vibor=this.id; }
   
   $("#"+vibor).css("background", '#b2f5b4');
  if (vibor=='v9'){
    if(rux==0){
      rux = 1;
      $('#v9').css("background", '#b2f5b4');
    }else{
      rux = 0;
      let t=Date.parse($('#f').text());
      position(t);
      $('#v9').css({'background':'#e9e9e9'});
    } 
    vibor=$("#grupi_avto option:selected").val();
  }else{
    agregat=0;
    filtr_data=[];
  }
  if (vibor=='v21'){agregat = 21; }
  if (vibor=='v22'){agregat = 22; }
  if (vibor=='v23'){agregat = 23; }
  if (vibor=='v24'){agregat = 24; }
  if (vibor=='v25'){agregat = 25; }
  if (vibor=='v26'){agregat = 26; }
  //if (vibor=='v27'){if(rux==0)rux = 27;}
  if (vibor=='v28'){agregat = 28; }
  if (vibor=='v29'){agregat = 29; }
  if (vibor=='v30'){agregat = 30; }
  
for(var i=0; i < allunits.length; i++){
nmm =allunits[i].getName();
idd =allunits[i].getId();
mm = markerByUnit[idd];
 mm.setOpacity(0);

     if (vibor=='v1'){
      mm.setOpacity(1);
      filtr=false; 
     }
     
     if (vibor=='v2'){
     if(nmm.indexOf('КАМАЗ')>=0|| nmm.indexOf('Камаз')>=0){ 
     mm.setOpacity(1);
     mm.setZIndexOffset(1000);
     filtr=true; 
     filtr_data.push(idd);
     }
     }  
     if (vibor=='v3'){
     if(nmm.indexOf(' МАЗ')>=0){ 
      mm.setOpacity(1);
      mm.setZIndexOffset(1000);
      filtr=true; 
      filtr_data.push(idd);
     }
     } 
     if (vibor=='v4'){
     if(nmm.indexOf('SCANIA')>=0){ 
       mm.setOpacity(1);
       mm.setZIndexOffset(1000);
       filtr=true; 
       filtr_data.push(idd);
     }
     }
     if (vibor=='v5'){
     if(nmm.indexOf('JCB')>=0|| nmm.indexOf('Manitou')>=0 || nmm.indexOf('Scorpion')>=0){ 
      mm.setOpacity(1);
      mm.setZIndexOffset(1000);
      filtr=true; 
      filtr_data.push(idd);
     }
     }
     if (vibor=='v6'){
     if(nmm.indexOf('ГАЗ')>=0){ 
      mm.setOpacity(1);
      mm.setZIndexOffset(1000);
      filtr=true; 
      filtr_data.push(idd);
     }
     }
     if (vibor=='v12'){
      if(nmm.indexOf('John')>=0 || nmm.indexOf('JD')>=0 || nmm.indexOf(' CL ')>=0|| nmm.indexOf(' МТЗ ')>0|| nmm.indexOf('CASE')>=0 || nmm.indexOf(' NH ')>=0){
       mm.setOpacity(1);
       mm.setZIndexOffset(1000);
       filtr=true; 
       filtr_data.push(idd);
      }
      }
     
    if (vibor=='v13'){
      if(nmm.indexOf('Нива')>=0 || nmm.indexOf('Газель')>=0 || nmm.indexOf('Лада')>=0 || nmm.indexOf('Lanos')>=0 || nmm.indexOf('Дастер')>=0 || nmm.indexOf('Stepway')>=0 || nmm.indexOf('ВАЗ')>=0 || nmm.indexOf('ФОРД')>=0 || nmm.indexOf('Toyota')>=0 || nmm.indexOf('Рено')>=0 || nmm.indexOf('TOYOTA')>=0 || nmm.indexOf('Skoda')>=0|| nmm.indexOf('ЗАЗ ')>=0){ 
       mm.setOpacity(1);
       mm.setZIndexOffset(1000);
       filtr=true; 
       filtr_data.push(idd);
      }
      }
      
        if (vibor=='v14'){
      if(nmm.indexOf('Найм')>=0 || nmm.indexOf('найм')>=0|| nmm.indexOf('Фоп')>=0|| nmm.indexOf('ФОП')>=0|| nmm.indexOf('ТОВ')>=0){ 
       mm.setOpacity(1);
       mm.setZIndexOffset(1000);
       filtr=true; 
       filtr_data.push(idd);
      }
      }
      if (vibor=='v15'){
        if(nmm.indexOf('ВМ0229АF')>=0 || nmm.indexOf('ВМ1280СТ')>=0|| nmm.indexOf('ВМ1640АТ')>=0|| nmm.indexOf('ВМ1641ВЕ')>=0|| nmm.indexOf('ВМ1953ВС')>=0|| nmm.indexOf('ВМ1988ВС')>=0
        || nmm.indexOf('ВМ2559ВК')>=0|| nmm.indexOf('ВМ3454ЕЕ')>=0|| nmm.indexOf('ВМ4110АА')>=0|| nmm.indexOf('ВМ4466АО')>=0|| nmm.indexOf('ВМ4524АА')>=0|| nmm.indexOf('ВМ4632АА')>=0
        || nmm.indexOf('ВМ5203ВВ')>=0|| nmm.indexOf('ВМ5326ВМ')>=0|| nmm.indexOf('ВМ5607Е')>=0|| nmm.indexOf('ВМ5629Е')>=0|| nmm.indexOf('ВМ5645Е')>=0|| nmm.indexOf('ВМ5647Е')>=0
        || nmm.indexOf('ВМ5887E')>=0|| nmm.indexOf('ВМ7393ВВ')>=0|| nmm.indexOf('ВМ7912Е')>=0|| nmm.indexOf('ВМ7913Е')>=0|| nmm.indexOf('ВМ7914')>=0|| nmm.indexOf('ВМ7915Е')>=0
        || nmm.indexOf('ВМ7916Е')>=0|| nmm.indexOf('ВМ7921Е')>=0|| nmm.indexOf('ВМ7922Е')>=0|| nmm.indexOf('ВМ7925Е')>=0|| nmm.indexOf('ВМ8607Е')>=0|| nmm.indexOf('ВМ8610ЕН')>=0
        || nmm.indexOf('ВМ8684ЕН')>=0|| nmm.indexOf('ВМ8692ЕН')>=0|| nmm.indexOf('ВМ8693ЕН')>=0|| nmm.indexOf('ВМ9595А')>=0|| nmm.indexOf('ВМ9708ВЕ')>=0|| nmm.indexOf('ВМ9987С')>=0){ 
         mm.setOpacity(1);
         mm.setZIndexOffset(1000);
         filtr=true; 
         filtr_data.push(idd);
        }
        }

     if (vibor=='v27'){
      if(nmm.indexOf('CASE 4430')>=0 || nmm.indexOf('R4045')>=0|| nmm.indexOf('612R')>=0){
       mm.setOpacity(1);
       mm.setZIndexOffset(1000);
       filtr=true; 
       filtr_data.push(idd);
      }
      }

     if (vibor=='v30'){
      if(nmm.indexOf('John')>=0 || nmm.indexOf('JD')>=0 || nmm.indexOf(' CL ')>=0|| nmm.indexOf('CASE')>=0 || nmm.indexOf(' NH ')>=0 ){
       mm.setOpacity(1);
       mm.setZIndexOffset(1000);
       filtr=true; 
       filtr_data.push(idd);
      }
      }

      if (vibor=='v21'||vibor=='v22'||vibor=='v23'||vibor=='v24'||vibor=='v25'||vibor=='v26'||vibor=='v28'||vibor=='v29'){
        if(nmm.indexOf('John')>=0 || nmm.indexOf('JD')>=0 || nmm.indexOf(' CL ')>=0|| nmm.indexOf('CASE')>=0 || nmm.indexOf(' NH ')>=0 ){
         mm.setOpacity(1);
         mm.setZIndexOffset(1000);
         filtr=true; 
         filtr_data.push(idd);
        }
        }


      if(rux==1){mm.setOpacity(0);} 
      
}
}


function Clrar_no_activ(){
for(var i=0; i < allunits.length; i++){
 if (Date.parse($('#fromtime2').val())/1000-432000> allunits[i].getPosition().t ){
 let mm = markerByUnit[allunits[i].getId()];
 mm.setOpacity(0);
 }
}
}



function fn_copy() {

  var cpdata='';
      for (var i = 0; i < data_zvit.length; i++) {
          cpdata += data_zvit[i][0] + '\t' +data_zvit[i][1] + '\t' +data_zvit[i][2] + ' \t' + data_zvit[i][3] + '\t' + data_zvit[i][4] + '\t' + data_zvit[i][5] +'\t' + data_zvit[i][6] + '\t' + data_zvit[i][7] +'\t' + data_zvit[i][8] +'\t' + data_zvit[i][9] +'\t' + data_zvit[i][10] +'\t' + data_zvit[i][11] +'\t' + data_zvit[i][12] +'\n'
         
      }
  
  navigator.clipboard.writeText(cpdata);
   
  
  msg("таблицю скопійовано в буфер обміну");
  }


  var data_marsh = [];
  function fn_copy1() {
    data_marsh = [];
    var tableRow =document.querySelectorAll('#marshrut tr');
    for ( j = 1; j < tableRow.length; j++){
        data_marsh.push([tableRow[j].cells[0].children[0].value,tableRow[j].cells[1].children[0].value,tableRow[j].cells[2].textContent,tableRow[j].cells[3].textContent,tableRow[j].cells[6].textContent,tableRow[j].cells[7].textContent]);
    } 
    localStorage.setItem('mars', JSON.stringify(data_marsh)); 
    }

    function fn_load1() {
      var svdata = JSON.parse(localStorage.getItem('mars'));
      if (svdata){
      $('#marshrut').empty();
      data_marsh=svdata;

      
        

        var row = "<thead>";   
        row += "<td>Місце завантаження</td>";
        row += "<td>Місце розвантаження</td>";
        row += "<td>Техніка</td>";
        row += "<td>мін зупинка</td>";
        row += " <td>враховувати <br> інші маршрути</td>";
        row += "<td>Розрахунок</td>";
        row += "<td>Видалення</td>";
        row += "</thead>"; 
        $("#marshrut").append(row);



      for (var i = 0; i < svdata.length; i++) {

        marshrutID+=1; 
        var idlist=marshrutID+99999;
       // create row-string with data
           row = "<tr class='marr' id='" + marshrutID + "'>";   
             // print message with information about selected unit and its position
             row += "<td> <input type='text' value='"+svdata[i][0]+"'></td>";
             row += "<td> <input type='text' value='"+svdata[i][1]+"'></td>";
             row += " <td style='display: none;'>"+ svdata[i][2] +"</td>";
             row += " <td style='display: none;'>"+ svdata[i][3] +"</td>";
             row += "<td><div><select class='livesearch' id='"+idlist+"'style='width:200px;'> <option value=' '>Вся техніка</option></select></div></td>";
             row += "<td><select><option value='1'>1хв</option><option value='5'>5хв</option><option value='10'>10хв</option><option value='15'>15хв</option></select></td>";
             row += " <td style='display: none;'>"+svdata[i][4]+"</td>";
             row += " <td style='display: none;'>"+svdata[i][5]+"</td>";
             row += "<td><input type='checkbox' checked></td>"; 
             row += "<td class='run_btn'><button>Порахувати</button></td>";
             row += "<td class='close_btn'><button>Видалити</button></td></tr>";
             //add info in table
             $("#marshrut").append(row);
         
     
         $('#'+idlist+'').append($('<option>').text('Камази + Сканії').val('000'));
         $('#'+idlist+'').append($('<option>').text('Найм').val('111'));
         $('#'+idlist+'').append($('<option>').text('ГАЗи').val('ГАЗ'));
         $('#'+idlist+'').append($('<option>').text('Камази').val('Камаз'));
         $('#'+idlist+'').append($('<option>').text('Сканії').val('SCANIA'));
          $('#'+idlist+'').append($('<option>').text('МАЗи').val(' МАЗ'));
          
     unitslist.forEach(function(unit) {          
         // Add option
      
         $('#'+idlist+'').append($('<option>').text(unit.getName()).val(unit.getName()));
       
     
       });
     
      $(".livesearch").chosen({search_contains : true});
     
          }
         }
         markerstart.setLatLng([0,0]); 
         markerend.setLatLng([0,0]);
         cklikkk=0;
         for(var iii=0; iii < marshrutMarkers.length; iii++){
          map.removeLayer(marshrutMarkers[iii]);
           if(iii == marshrutMarkers.length-1){marshrutMarkers=[];}
          }

 var tableRow =document.querySelectorAll('#marshrut tr');
var radddddd;
for ( j = 1; j < tableRow.length; j++){

  raddddddd =  L.circle([parseFloat(tableRow[j].cells[2].textContent.split(',')[0]),parseFloat(tableRow[j].cells[2].textContent.split(',')[1])], {stroke: false,  fillColor: '#0000FF', fillOpacity: 0.2,radius: tableRow[j].cells[6].textContent}).addTo(map);
  marshrutMarkers.push(raddddddd);
  raddddddd =  L.circle([parseFloat(tableRow[j].cells[3].textContent.split(',')[0]),parseFloat(tableRow[j].cells[3].textContent.split(',')[1])], {stroke: false,  fillColor: '#f03', fillOpacity: 0.2,radius: tableRow[j].cells[7].textContent}).addTo(map);
  marshrutMarkers.push(raddddddd);
  var polyline = L.polyline([[parseFloat(tableRow[j].cells[2].textContent.split(',')[0]),parseFloat(tableRow[j].cells[2].textContent.split(',')[1])],[parseFloat(tableRow[j].cells[3].textContent.split(',')[0]),parseFloat(tableRow[j].cells[3].textContent.split(',')[1])]], {opacity: 0.3, color: '#0000FF'}).addTo(map);
  marshrutMarkers.push(polyline); 
} 
      }


  $('#grafik').hide();
  $('#v11').click(menu10);
  function menu10() {
if ($('#grafik').is(':hidden')) {
  $('#grafik').show();
  $('#map').css('height', '470px');
  $('#marrr').css('height', '470px');
  $('#option').css('height', '470px');
  $('#unit_info').css('height', '470px');
  $('#zupinki').css('height', '470px');
  $('#logistika').css('height', '470px');
  $('#monitoring').css('height', '470px');
  this.style.background = '#b2f5b4';
  show_gr();
}else{
  $('#grafik').hide();
  $('#map').css('height', '750px');
  $('#marrr').css('height', '750px');
   $('#option').css('height', '750px');
  $('#unit_info').css('height', '750px');
  $('#zupinki').css('height', '750px');
  $('#logistika').css('height', '750px');
  $('#monitoring').css('height', '750px');
  this.style.background = '#e9e9e9';
}
    }
 
  
  function show_gr(a,b) {
    s1=a;
    s2=b;
    var unid =  parseInt($("#lis0").chosen().val());
        if ($('#grafik').is(':hidden')==false){
          $('#v11').css({'background':'#b2f5b4'});
          let data_graf = [];
          for(let i = 0; i<Global_DATA.length; i++){ 
            let idd = Global_DATA[i][0][0];
            if(idd==unid){
              for (let ii = 1; ii<Global_DATA[i].length-1; ii+=1){
                data_graf.push([Global_DATA[i][ii][0],Global_DATA[i][ii][1],Global_DATA[i][ii][2],Global_DATA[i][ii][3]]);
              } 
              break;
            }   
          }
          drawChart(data_graf);
    }
  }



  // Load the Visualization API and the corechart package.
  google.charts.load('current', {packages:['corechart', 'table', 'gauge', 'controls']});

  // Set a callback to run when the Google Visualization API is loaded.
  //google.charts.setOnLoadCallback(drawChart);

  // Callback that creates and populates a data table,
  // instantiates the pie chart, passes in the data and
  // draws it.
  var t1 = 0;
  var v1 = 0;
  let s1,s2;
  
function drawChart(data_graf) {
var dashboard = new google.visualization.Dashboard(
    document.getElementById('grafik'));

  let rangge=10800000;
  if(s1!=undefined && s2!=undefined)rangge=1080000;

var control = new google.visualization.ControlWrapper({
  'controlType': 'ChartRangeFilter',
  'containerId': 'chart2',
  'options': {
    // Filter by the date axis.
    'filterColumnIndex': 0,
    'ui': {
      'chartType': 'LineChart',
      'chartOptions': {
        'chartArea': {'height': '100%','width': '95%'},
        'hAxis': {
        'baselineColor': 'none',
         gridlines: {
        count: -1,
        units: {
          hours: {format: ['HH:mm', 'ha']},
        }
      },
     

        
        }
      },
      // Display a single series that shows the closing value of the stock.
      // Thus, this view has two columns: the date (axis) and the stock value (line series).
      'chartView': {
        'columns': [0, 3]
      },
      // 1 day in milliseconds = 24 * 60 * 60 * 1000 = 86,400,000
      'minRangeSize': 100000
    }
  },
  // Initial range: 2012-02-09 to 2012-03-20.
  'state': {'range': {'start': new Date(Date.parse(output.innerHTML)-rangge), 'end': new Date(Date.parse(output.innerHTML)+rangge)}}
});
var chart = new google.visualization.ChartWrapper({
  'chartType': 'AreaChart',
  'containerId': 'chart1',
  'options': {
  colors: ['red', 'red', 'green'],
  'tooltip':{'textStyle':{'fontName': "Arial", 'fontSize': 13 }},

    // Use the same chart area width as the control for axis alignment.
    'chartArea': {'height': '100%', 'width': '95%'},
    'hAxis': {'slantedText': false, format: 'none'},
   
     


    pointSize: 1,
    dataOpacity: 0.5,
     series: {
            0: { areaOpacity: 0.1, },
            1: { areaOpacity: 0.1, },
            2: { areaOpacity: 0.1, }
        },

  lineWidth: 2,

    'legend': {'position': 'none'}
  },
  // Convert the first column from 'date' to 'string'.

});





var a=[];
var data = new google.visualization.DataTable();
    data.addColumn('datetime', 'date');
     data.addColumn('number', 'speed');
    data.addColumn('number', 'coordinate');
    data.addColumn('number', 'stop');
    data.addColumn({'type': 'string', 'role': 'style'}); 
    data.addColumn({'type': 'string', 'role': 'tooltip'});
   
for (var i = 2; i < data_graf.length-1; i++) {
a[1]=null;
if (data_graf[i][3]=='0 км/ч'){ a[1]=parseFloat(data_graf[i][2]);}
a[2]=null;
a[3]=parseFloat(data_graf[i][2]);  
a[5]='стоїть\n'+data_graf[i][0]+'\n'+data_graf[i][1]+'\n'+data_graf[i][2];
if (data_graf[i-1][0]!=data_graf[i][0]){ 
 
a[5]='рухається\n'+data_graf[i][0]+'\n'+data_graf[i][1]+'\n'+data_graf[i][2];
}


var date = new Date(data_graf[i][1]);
a[0]=date;
a[4]=null;


if(s1!=undefined && s2!=undefined){
  if (Date.parse(data_graf[i][1])>=Date.parse(s1) && Date.parse(data_graf[i][1])<=Date.parse(s2)){ 
    a[4]='point { size: 4; shape-type: circle; fill-color: #FF0000; opacity: 1}';
    }
}



data.addRows([a]);
}






dashboard.bind(control, chart);
dashboard.draw(data);

google.visualization.events.addListener(chart, 'select', selectHandler);

// The selection handler.
// Loop through all items in the selection and concatenate
// a single message from all of them.
function selectHandler() {
var selection = dashboard.getSelection();


if (selection.length >0) {
var item = selection[0];
if(t1==0){
t1=data.getFormattedValue(item.row, 0);
v1=data.getFormattedValue(item.row, 3);

}else{

var time=new Date(Math.abs(new Date(t1)-new Date(data.getFormattedValue(item.row, 0)))).toISOString().substr(11, 8);
var val=Math.abs((parseFloat(v1.replace(",", ""))-parseFloat(data.getFormattedValue(item.row, 3).replace(",", ""))).toFixed(1));
var sred =(val*60*60/ Math.abs(new Date(t1)-new Date(data.getFormattedValue(item.row, 0)))*1000).toFixed(1);

alert("РІЗНИЦЯ МІЖ ДВОМА ТОЧКАМИ НА ГРАФІКУ"+"\n"+"Час:                                "+time+"\n"+"Літрів:                            "+val+"л"+"\n"+"Середня витрата:        "+sred+"л/год");
t1=0;
v1=0;
}

}

}

}



//=================zapros otchota===================================================================================

function SendDataReportInCallback(t1=0,t2=0,maska='All',idrep=7,data=[],i=0,calbek){
  $('button').prop("disabled", true);
  if (t1==0) t1=Date.parse($('#fromtime1').val())/1000;
  if (t2==0) t2=Date.parse($('#fromtime2').val())/1000;
  let str = maska.split(',');
  let unit= false;
  if (maska=='All')unit= true;
    if(i < unitslist.length){
      str.forEach((element) => {if(unitslist[i].getName().indexOf(element)>=0){unit = true;}});
      if(unit){
        msg(unitslist.length-i);
        CollectDataReport(t1,t2,maska,idrep,data,i,unitslist[i],calbek);
      }else{
        i++;
        SendDataReportInCallback(t1,t2,maska,idrep,data,i,calbek); 
      }
    } else {
      $('button').prop("disabled", false);
      $('#log').empty();
      msg('Завантажено');
      calbek(data);
    }   
}

function CollectDataReport(t1,t2,maska,idrep,olddata,i,unit,calbek){ // execute selected report
    // get data from corresponding fields
     //msg(unit.getName());
  let id_res=RES_ID, id_unit = unit.getId(), ii=i;
	if(!id_res){ msg("Select resource"); return;} // exit if no resource selected
	if(!idrep){ msg("Select report template"); return;} // exit if no report template selected
	if(!id_unit){ msg("Select unit"); return;} // exit if no unit selected
	var sess = wialon.core.Session.getInstance(); // get instance of current Session
	var res = sess.getItem(id_res); // get resource by id
	// specify time interval object
	var interval = { "from": t1, "to": t2, "flags": wialon.item.MReport.intervalFlag.absolute };
	var template = res.getReport(idrep); // get report template by id
  
	 res.execReport(template, id_unit, 0, interval, // execute selected report
		function(code, data) { // execReport template
			if(code){ msg(wialon.core.Errors.getErrorText(code));ii++; SendDataReportInCallback(t1,t2,maska,idrep,olddata,ii,calbek);return; } // exit if error code
			if(!data.getTables().length){ii++; SendDataReportInCallback(t1,t2,maska,idrep,olddata,ii,calbek); return; }
			else{
        let tables = data.getTables();
        let dataa=[];
        let headers = tables[0].header;
        dataa.push([unit.getId(),unit.getName(),headers]);
        //msg(tables[0].header);
        data.getTableRows(0, 0, tables[0].rows,function( code, rows) { 
          if (code) {msg(wialon.core.Errors.getErrorText(code)); ii++; SendDataReportInCallback(t1,t2,maska,idrep,olddata,ii,calbek);return;} 
          for(let j in rows) { 
            if (typeof rows[j].c == "undefined") continue;
            let row=[];
            for (let iii = 0; iii < rows[j].c.length; iii++) {
               row.push(getTableValue(rows[j].c[iii]));
            }
            dataa.push(row);
          }
          olddata.push(dataa);
          ii++;
          SendDataReportInCallback(t1,t2,maska,idrep,olddata,ii,calbek);
        });
      }  
	});
 
       
}

//=================Geomodul===================================================================================
 function track_geomarshruta(evt){
   [...document.querySelectorAll("#obrobkatehnika tr")].forEach(e => e.style.backgroundColor = '');
   this.style.backgroundColor = 'pink';
    $("#lis0").chosen().val(this.id);     
    $("#lis0").trigger("chosen:updated");
    layers[0]=0;
    show_track();
   // msg(this.classList);
     
 }
 let geo_layer =[];
 let geo_splines = [];
function Naryady(data=[],maska='JD'){
  if(data.length==0) return;
  let str = maska.split(',');
  geo_splines= [];
  $("#obrobkatehnika").empty();
  $('#obrobkatehnika').append("<th><td>ТЗ</td><td>оброблено га</td><td>пересічення га</td><td>чистий обробіток га</td><td>-</td></th>");
  geo_splines.lenght = 0;
   let texnika=[];
   for (let i = 0; i < data.length; i++) {
   let unit =false;
   str.forEach((element) => {if(data[i][0][1].indexOf(element)>=0){unit = true;}});
   if(unit==false)continue;
   let splines =[];
   let spline=[];
   let p_start=[];
   let p_end=[];
   let newspline=false;
   splines.push([data[i][0][0],data[i][0][1]]);
    for (let ii = 1; ii < data[i].length; ii++) {
     //if(parseInt(data[i][ii][2].match(/\d+/))==0) continue;
     if(data[i][ii][0]=="") continue;
     let lat  = parseFloat(data[i][ii][0].split(',')[0]);
     let lon  = parseFloat(data[i][ii][0].split(',')[1]);

     if(spline.length>0) {
       if(spline[spline.length-1][0]!=lon && spline[spline.length-1][1]!=lat) {
        //if(wialon.util.Geometry.getDistance(lat, lon, spline[spline.length-1][1],spline[spline.length-1][0])>5){
          if(wialon.util.Geometry.pointInShape(geozonepoint, 0, lat, lon)){
            spline.push([lon,lat]); 
            newspline=false;
          }else {
            newspline=true;
            p_end=[lon,lat];
          }
       //}
       }
      }else{
        if(wialon.util.Geometry.pointInShape(geozonepoint, 0, lat, lon)){
          spline.push([lon,lat]); 
          newspline=false;
        }else {
          newspline=true;
          p_start=[lon,lat];
        }
      }

      if(newspline==true || data[i].length-1 ==ii){
        if(spline.length>0) {
          if(spline.length>1){
            if(p_start.length>0)spline.unshift(p_start);
            if(p_end.length>0)spline.push(p_end);
            splines.push(spline);
          }
          //var linestring1 = turf.lineString(spline);
          //var polyline = L.geoJSON(linestring1).addTo(map);
          spline=[];
          p_start=[];
          p_end=[];
          newspline=false;
          if(texnika.indexOf(data[i][0][1])<0){
            texnika.push(data[i][0][1]);
            $('#obrobkatehnika').append("<tr class='geo_trak' id='" + data[i][0][0] + "'><td>&#128668</td><td>"+data[i][0][1]+"</td><td>0</td><td>0</td><td>0</td><td><input type='checkbox'></td></tr>");
           }
        }
      }
    }
    geo_splines.push(splines);
  } 
}


function ObrabotkaPolya(spisok=[],zaxvat=10){
  if(geo_splines.length==0) return;
  clearGEO();
  let tableRow =document.querySelectorAll('#obrobkatehnika tr');
    for ( j = 0; j < tableRow.length; j++){
    if(tableRow[j].cells[1].textContent=="ВСЬОГО"){tableRow[j].parentElement.removeChild(tableRow[j]);break;}
        tableRow[j].cells[0].style.backgroundColor = '#ffffff';
        tableRow[j].cells[2].textContent=0;
        tableRow[j].cells[3].textContent=0;
        tableRow[j].cells[4].textContent=0;
    } 
  let spline,p0,p1,p2,p3,p4,ang,ang1,ang2,traktor;
  let UnionPolis=[];
  
  for (let i = 0; i < geo_splines.length; i++) {
    if(spisok.indexOf(geo_splines[i][0][1])<0) continue;

    for (let ii = 1; ii < geo_splines[i].length; ii++) {
      if(geo_splines[i][ii].length<2){
        geo_splines[i].splice(ii,1);
        ii--;
        continue;
      }
    for (let iii = 1; iii < geo_splines[i][ii].length; iii++) {
      p1 = turf.point(geo_splines[i][ii][iii-1]);
      p2 = turf.point(geo_splines[i][ii][iii]);
      if(turf.distance(p1, p2, {units: 'meters'})<2){
        geo_splines[i][ii].splice(iii, 1);
        iii--;
        if(geo_splines[i][ii].length<2){
          geo_splines[i].splice(ii,1);
          ii--;
          break;
        }
      }
    } 
    }
  }


 for (let i = 0; i < geo_splines.length; i++) {
  let polis=[];
   if(spisok.indexOf(geo_splines[i][0][1])>=0){
   traktor = geo_splines[i][0][1]; 
   for (let ii = 1; ii < geo_splines[i].length; ii++) {
     spline = geo_splines[i][ii];
     p0 = turf.point(spline[0]);
     p2 = turf.point(spline[1]);
     ang =turf.bearing(p0, p2);
     ang1=ang-90;
     if(ang1<-180)ang1=360+ang1;
     ang2 = ang+90;
     if(ang2>180)ang2=ang2-360;
     p1 = turf.destination(p0, zaxvat*0.5,ang2, {units: 'meters'});
     p2 = turf.destination(p0, zaxvat*0.5,ang1, {units: 'meters'});
     

        for (let iii = 1; iii < spline.length; iii++) {
          //if(turf.distance(p0, turf.point(spline[ii]), {units: 'meters'})<zaxvat)continue;
          p0 = turf.point(spline[iii]);
            if(iii==spline.length-1){
                p3 = turf.destination(p0, zaxvat*0.5,ang1, {units: 'meters'});
                p4 = turf.destination(p0, zaxvat*0.5,ang2, {units: 'meters'});
            }else{ 
              let point1 = turf.point(spline[iii-1]);
              let point2 = p0;
              let point3 = turf.point(spline[iii+1]);
              ang =turf.bearing(point1, point3);
              ang1=ang-90;
              if(ang1<-180)ang1=360+ang1;
              ang2 = ang+90;
              if(ang2>180)ang2=ang2-360;

              p3 = turf.destination(p0, zaxvat*0.5,ang1, {units: 'meters'});
              p4 = turf.destination(p0, zaxvat*0.5,ang2, {units: 'meters'});

            }

          let p2p3=turf.distance(p2, p3, {units: 'meters'});
          let p1p4=turf.distance(p1, p4, {units: 'meters'});

          if(p2p3<1 || p1p4<1)continue;
          let linestring1 = turf.lineString([ turf.getCoord(p2), turf.getCoord(p3)]);
          let linestring2 = turf.lineString([ turf.getCoord(p1), turf.getCoord(p4)]);
          
          let poliXY = [[turf.getCoord(p1), turf.getCoord(p2), turf.getCoord(p3), turf.getCoord(p4),turf.getCoord(p1)]];
          if(turf.booleanIntersects(linestring1, linestring2)){poliXY = [[turf.getCoord(p1), turf.getCoord(p2), turf.getCoord(p4), turf.getCoord(p3),turf.getCoord(p1)]];}

          let polygon = turf.polygon(poliXY,{ name: traktor });
          let options = {precision: 6, coordinates: 2};
          let polygon2 = turf.truncate(polygon, options);

          
          
          //let result = turf.unkinkPolygon(polygon);
          //let polylinee = L.geoJSON(polygon).addTo(map);
          //geo_layer.push(polylinee); 
          p1=p4;
          p2=p3;
          
          polis.push(polygon2);
      }

  } 


      let turfPole =turf.polygon([geozonepointTurf]);
      let area = GetPoligonsArea(polis);
      let areaU =area;
      let areaI =0;
      let union =polis[0];
      if(polis.length>1){
        union =turf.union(turf.featureCollection(polis));
        areaU = (turf.area(union)/10000).toFixed(2);
      }

      union = turf.intersect(turf.featureCollection([union, turfPole]));
      areaI = (areaU -turf.area(union)/10000).toFixed(2);

      let color='#'+(Math.random() * 0x1000000 | 0x1000000).toString(16).slice(1);
      let polylinee = L.geoJSON(union,{ style: function (feature) { return {color: color, fillOpacity: 0.5, weight: 1};}}).addTo(map);
        geo_layer.push(polylinee); 

        if(union){
          if(union.geometry.type=="Polygon"){
            UnionPolis.push(union);
          }else{
            for ( j = 0; j < union.geometry.coordinates.length; j++){
              let unpol=turf.polygon(union.geometry.coordinates[j]);
              UnionPolis.push(unpol);
            }
          }
        }


      for ( j = 0; j < tableRow.length; j++){
        if(tableRow[j].cells[1].textContent==traktor){
          tableRow[j].cells[0].style.backgroundColor = color;
          tableRow[j].cells[2].textContent=(area-areaI).toFixed(2);
          tableRow[j].cells[3].textContent=(area-areaU-areaI).toFixed(2);
          tableRow[j].cells[4].textContent=(areaU-areaI).toFixed(2);
        }
      } 
    }
      if(i == geo_splines.length-1){
          let Aarea = GetPoligonsArea(UnionPolis);
          let AareaU = Aarea;
          if(UnionPolis.length>1){
            let Aunion =turf.union(turf.featureCollection(UnionPolis));
            AareaU = (turf.area(Aunion)/10000).toFixed(2);
          }

          $('#obrobkatehnika').append("<tr><td></td><td>ВСЬОГО</td><td>"+ Aarea +"</td><td>"+ (Aarea-AareaU).toFixed(2) +"</td><td>"+ AareaU +"</td><td><input type='checkbox'></td></tr>");

          let table_polya=document.getElementById('robota_polya_tb');
          let vibor_raboty = document.querySelector('#robota_polya_spisok');
          $("#robota_polya_help").hide();
          $('#polya_jurnal_text').val(vibor_raboty.value+" "+AareaU+" га");
          if(table_polya.rows.length>1){
            for(let i = 1; i<table_polya.rows.length; i++){
              if(table_polya.rows[i].cells[0].innerText==$('#getary_pole').text()){
                 table_polya.rows[i].cells[3].innerText= AareaU;
                 table_polya.rows[i].cells[2].innerText= vibor_raboty.value;
                 break;
              }
              if(i==table_polya.rows.length-1){
                $("#robota_polya_tb").append("<tr><td>"+$('#getary_pole').text()+"</td><td>-</td><td>"+vibor_raboty.value+"</td><td>"+AareaU+"</td></tr>");
              }
            }

          }else{
            $("#robota_polya_tb").append("<tr><th>ПОЛЕ</th><th>МОТОГОДИНИ</th><th>РОБОТА</th><th>ГЕКТАРИ</th></tr>");
            $("#robota_polya_tb").append("<tr><td>"+$('#getary_pole').text()+"</td><td>-</td><td>"+vibor_raboty.value+"</td><td>"+AareaU+"</td></tr>");
          }
      }
  }
 
}
function GetPoligonsArea(poligons=[]){
  let area=0;
  poligons.forEach(function(poligon) { area+=turf.area(poligon)/10000; });
  area= area.toFixed(2);
  return area;
}

$("#polya_jurnal").on("click", function (){
  
  let date=document.getElementById("polya_jurnal_time").valueAsNumber;
  let time=Date.now();
  let name=$('#getary_pole').text();
  let text=$('#polya_jurnal_text').val();
  let autor=autorization;
  if(date && name && name!='' && text!='' && autor!=''){ 
    write_jurnal(20233,'jurnal.txt','||'+date+'|'+name+'|'+text+'|'+autor+'|'+time,function () { 
      jurnal_update();
      $('#polya_jurnal_text').val("");
    });
  }
});

$('#robota_polya_BT').click(function (){
  $("#robota_polya_tb").empty();
  let polya_mot= {};
  let str =$('#tehnikaobr').val().split(',');
  for(let i = 0; i<Global_DATA.length; i++){ 
   let nametr = Global_DATA[i][0][1];
    for(let v = 0; v<str.length; v++){ 
      if(nametr.indexOf(str[v])<0)continue;
     for (let ii = 1; ii<Global_DATA[i].length-1; ii+=2){
      if(!Global_DATA[i][ii][3])continue;
      if(!Global_DATA[i][ii][0])continue;
      if(!Global_DATA[i][ii][4])continue;
      if(!Global_DATA[i][ii+1][4])continue;
      if(Global_DATA[i][ii][3][0]=='0')continue;
      let y0 = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
      let x0 = parseFloat(Global_DATA[i][ii][0].split(',')[1]);
      let nn = PointInField(y0,x0);
      if(nn[2]=="-"){
        if(polya_mot[nn]){
          let t = polya_mot[nn];
            t+=(Global_DATA[i][ii+1][4]-Global_DATA[i][ii][4])/1000;
             polya_mot[nn]=t;
        } else{polya_mot[nn]=(Global_DATA[i][ii+1][4]-Global_DATA[i][ii][4])/1000;}
       
      }
     }
    }
  }
  $("#robota_polya_help").hide();
  $("#robota_polya_tb").append("<tr><th>ПОЛЕ</th><th>МОТОГОДИНИ</th><th>РОБОТА</th><th>ГЕКТАРИ</th><th>X</th></tr>");
  for (let key in polya_mot) {
    if(polya_mot[key]>200){
      let m = Math.trunc(polya_mot[key] / 60) + '';
      let h = Math.trunc(m / 60) + '';
      m=(m % 60) + '';
      $("#robota_polya_tb").append("<tr><td align='left'>"+key+"</td><td>"+h.padStart(2, 0) + ":" + m.padStart(2, 0) + ":00</td><td>-----</td><td>-----</td><td>&#10060</td></tr>");
    }
  }
});




$("#robota_polya_tb").on("click", function (evt){
  let row = evt.target.parentNode;
  [...document.querySelectorAll("#robota_polya_tb tr")].forEach(e => e.style.backgroundColor = '');
  if(row.rowIndex>0){

     if (evt.target.cellIndex==4){
      row.cells[0].closest('tr').remove();
      return;
     }

    row.style.backgroundColor = 'pink';
    let name = row.cells[0].textContent;
     for (let i = 0; i<geozones.length; i++){
     if(geozones[i].zone.n == name){
      let y=geozones[i]._bounds._northEast.lat;
      let x=geozones[i]._bounds._northEast.lng;
      map.setView([y,x],14,{animate: false});
           geozonepoint.length =0;
           geozonepointTurf.length =0;
           clearGEO();
        $('#obrobka').empty();
        $('#obrobkatehnika').empty();
        $('#getary_pole').text(name);
        let point = geozones[i]._latlngs[0];
        let ramka=[];
        for (let i = 0; i < point.length; i++) {
          let lat =point[i].lat;
          let lng =point[i].lng;
          geozonepoint.push({x:lat, y:lng}); 
          geozonepointTurf.push([lng,lat]);
          ramka.push([lat, lng]);
          if(i == point.length-1 && geozonepoint[0]!=geozonepoint[i]){
            geozonepoint.push(geozonepoint[0]); 
            geozonepointTurf.push(geozonepointTurf[0]);
            ramka.push(ramka[0]);
          }
          }
        let polilane = L.polyline(ramka, {color: 'blue'}).addTo(map);
        geo_layer.push(polilane);
        break;
     }
     }
  }
});


//=================Proverka Navigacii i Datchikov ===================================================================================
function track_TestNavigation(evt){
  [...document.querySelectorAll("#unit_table tr")].forEach(e => e.style.backgroundColor = '');
  this.style.backgroundColor = 'pink';
   $("#lis0").chosen().val(this.id.split(',')[0]);
   $("#lis0").trigger("chosen:updated");
   layers[0]=0;
   show_track();
   markerByUnit[this.id.split(',')[0]].openPopup();
   map.setView([parseFloat(this.id.split(',')[1]), parseFloat(this.id.split(',')[2])+0.001],13,{animate: false}); 
  
}

var nav_mark_data=[];
function TestNavigation(data){
  if ($('#unit_info').is(':hidden')) {
      $('#unit_info').show();
      $('#map').css('width', '60%'); 
      $('#men4').css({'background':'#b2f5b4'});
    }
    $("#unit_table").empty();
    $('#marrr').hide();
    $('#option').hide();
    $('#zupinki').hide();
    $('#logistika').hide();
    $('#men3').css({'background':'#e9e9e9'});
    $('#men1').css({'background':'#e9e9e9'});
    
  let no_aktiv = [];
  let mark;
  for(var ii=0; ii < unitslist.length; ii++){
     if (Date.parse($('#fromtime1').val())/1000 > unitslist[ii].getPosition().t){ no_aktiv.push(unitslist[ii]); }
    if ($("#no_activ").is(":checked")) {
    if (Date.parse($('#fromtime2').val())/1000-432000> unitslist[ii].getPosition().t) continue;
    }
    if (Date.parse($('#fromtime2').val())/1000-3600> unitslist[ii].getPosition().t && unitslist[ii].getPosition().s>0){
        $("#unit_table").append("<tr class='fail_trak' id='"+unitslist[ii].getId()+"," + unitslist[ii].getPosition().y+","+unitslist[ii].getPosition().x+ "'><td align='left'>"+unitslist[ii].getName()+"</td><td>"+wialon.util.DateTime.formatTime(unitslist[ii].getPosition().t)+"</td><td>завис у русі</td></tr>");
          mark = L.marker([unitslist[ii].getPosition().y, unitslist[ii].getPosition().x], {icon: L.icon({iconUrl: '777.png', draggable: true, iconSize:   [24, 24],iconAnchor: [12, 24] })}).addTo(map);
          mark.bindPopup(unitslist[ii].getName() +'<br />'+wialon.util.DateTime.formatTime(unitslist[ii].getPosition().t)+'<br />'+unitslist[ii].getPosition().s+' км/год');
          nav_mark_data.push(mark);
          }
 
   
    
    }
   
  
  for (let i = 0; i < data.length; i++) {
    let pos=0;
    let nav=0;
    let row=0;
    let zapcarta=0;
    let namee = data[i][0][1];
   
    if(data[i][0][2].indexOf('Топливо')>=0 || data[i][0][2].indexOf('Паливо')>=0 || data[i][0][2].indexOf('ДРТ')>=0){}else continue;
    for (let ii = 1; ii < data[i].length; ii++) {
      if(namee.indexOf('Шкурат')>=0 || namee.indexOf('Білоус')>=0|| namee.indexOf('Колотуша')>=0|| namee.indexOf('Дробниця')>=0|| namee.indexOf('Писаренко')>=0|| namee.indexOf('Штацький')>=0|| namee.indexOf('ВМ4156ВС')>=0|| namee.indexOf('аправка')>=0){
         if(data[i][ii][4]  && zapcarta != data[i][ii][4]){
          zapcarta = data[i][ii][4];
          no_aktiv.forEach((element) => {if(element.getName().indexOf(zapcarta)>=0){
            if(element.getName().indexOf('Резерв')>=0 ||element.getName().indexOf('резерв')>=0||element.getName().indexOf('Знято')>=0||element.getName().indexOf('знято')>=0){
            }else{
              $("#unit_table").append("<tr class='fail_trak' id='"+element.getId()+","  + element.getPosition().y+","+element.getPosition().x+ "'><td align='left'>"+element.getName()+"</td><td>"+data[i][ii][1]+"</td><td>"+ namee +"</td><td>заправлявся - дані не передає</td></tr>");
              mark = L.marker([element.getPosition().y, element.getPosition().x], {icon: L.icon({iconUrl: '666.png',draggable: true,iconSize:   [24, 24],iconAnchor: [12, 24] })}).addTo(map);
              mark.bindPopup(element.getName() +'<br />'+wialon.util.DateTime.formatTime(element.getPosition().t));
              nav_mark_data.push(mark);
            }
          }});
         }
        }
        if(namee.indexOf('Резерв')>=0 ||namee.indexOf('резерв')>=0||namee.indexOf('Знято')>=0||namee.indexOf('знято')>=0)continue;
       if (data[i][ii-1][0])if (data[i][ii][0]!=data[i][ii-1][0])pos++;
       if (data[i][ii-1][5])if (data[i][ii][5]!=data[i][ii-1][5])pos-=7;
       if (pos<0)pos=0;
       if (pos>2500)continue;
       if (data[i][ii][0])nav++;
        row++;
      }
      if(pos>600) if(namee.indexOf('CASE')>=0 ||namee.indexOf('NH')>=0 ||namee.indexOf('John')>=0 ||namee.indexOf('JD')>=0 || namee.indexOf('CL')>=0|| namee.indexOf('МТЗ')>=0||namee.indexOf('JCB')>=0|| namee.indexOf('Manitou')>=0 || namee.indexOf('Scorpion')>=0|| namee.indexOf('Камаз')>=0|| namee.indexOf('МАЗ')>=0 || namee.indexOf('SCANIA')>=0)$("#unit_table").append("<tr><td align='left'>"+namee+"</td><td>перевірте ДРП</td></tr>");
      if(row-nav>row*0.5)$("#unit_table").append("<tr><td align='left'>"+namee+"</td><td>перевірте GPS</td></tr>");
    }
}

//===================================================================

function Monitoring(){

let rows = document.querySelectorAll('#monitoring_table tr');
 for(let i = 0; i<Global_DATA.length; i++){
  if(Global_DATA[i].length<200)continue;
 let points = 0; 
 let spd = 0; 
 let stoyanka = 0;
 let sttime=$('#min_zup_mon').val()*60;
 let coll = "#98FB98";
 let robota=0;
 let pereizd=0;
 let stroka=[];
 let nametr = Global_DATA[i][0][1];
 let id = Global_DATA[i][0][0];
 let str =$('#unit_monitoring').val().split(',');
 str.forEach((element) => {if(nametr.indexOf(element)>=0){
 pereizd=0;
 robota=0;
 stroka=[];
 
   
   for (let ii = 10; ii<Global_DATA[i].length-1; ii+=20){
   points = 0;
   spd=0;
   stoyanka=0;
   if(!Global_DATA[i][ii][0])continue;
   if(!Global_DATA[i][ii-1][0])continue;
   if(!Global_DATA[i][ii+1][0])continue;
   let y = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
   let x = parseFloat(Global_DATA[i][ii][0].split(',')[1]);

   let y2 = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
   let x2 = parseFloat(Global_DATA[i][ii][0].split(',')[1]);



   let p0 = turf.point([x,y]);
   let p1 = turf.point([parseFloat(Global_DATA[i][ii+1][0].split(',')[1]),parseFloat(Global_DATA[i][ii+1][0].split(',')[0])]);
   let p2 = turf.point([parseFloat(Global_DATA[i][ii-1][0].split(',')[1]),parseFloat(Global_DATA[i][ii-1][0].split(',')[0])]);
   let ang =turf.bearing(p1, p2);
   let ang1=ang-90;
   if(ang1<-180)ang1=360+ang1;
   let ang2 = ang+90;
   if(ang2>180)ang2=ang2-360;
   p1 = turf.destination(p0, 70,ang2, {units: 'meters'});
   p2 = turf.destination(p0, 70,ang1, {units: 'meters'});

   let coord1 = turf.getCoord(p1);
   let coord2 = turf.getCoord(p2);
   //let circle1 = L.circle([coord1[1], coord1[0]], { color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: 100}).addTo(map);
   //let circle2 = L.circle([coord2[1], coord2[0]], { color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: 100}).addTo(map);
  


       for (let iii = ii-250; iii<Global_DATA[i].length; iii++){
        if(iii<=0)iii=1;
        if(stoyanka>sttime && iii-ii<100){ stoyanka=-1; points=-1;spd=-1;pereizd=0;robota=0; break; }
       if(Global_DATA[i][iii][3][0]=='0'){ 
        stoyanka+=(Global_DATA[i][iii][4]-Global_DATA[i][iii-1][4])/1000;
        spd--;
        continue; 
      }
       if(iii-ii>250){break;}
       let yy = parseFloat(Global_DATA[i][iii][0].split(',')[0]);
       let xx = parseFloat(Global_DATA[i][iii][0].split(',')[1]);
       if(wialon.util.Geometry.getDistance(y,x,yy,xx)<3){spd--;continue;}
       stoyanka=0;
       spd++;
       if(wialon.util.Geometry.getDistance(coord1[1],coord1[0],yy,xx)<70){points++;}
       if(wialon.util.Geometry.getDistance(coord2[1],coord2[0],yy,xx)<70){points++;}
       }
       //let tooltipp = L.tooltip([y,x], {content: ""+points+"",permanent: true}).addTo(map);
      
    if(points<3 && spd>0){pereizd++; robota=0;}
    if(points>10){robota++;pereizd=0;}

      if(stoyanka==-1){
      if(stroka.length>0){
      if(stroka[stroka.length-1]!='сто'){
      stroka.push('сто');
      }
      }
      }

     if(pereizd==5){
      
     if(stroka.length>0){
     if(stroka[stroka.length-1]!='пер'){
     stroka.push('пер');
     }
     }else{
      stroka.push('пер');
     }
     }
     if(robota==2){
      
     if(stroka.length>0){
      let nn = 'роб <br>' + PointInField(y2,x2);
     if(stroka[stroka.length-1]!=nn){
     stroka.push(nn);
     if ($("#robviz_gif").is(":checked")) {
    let markerrr = L.marker([y2,x2]).addTo(map);
     markerrr.bindPopup(""+nametr+"");
     zup_mark_data.push(markerrr);
     }
     }
     }else{
      let nn = 'роб <br>' + PointInField(y2,x2);
      stroka.push(nn);
      if ($("#robviz_gif").is(":checked")) {
      let markerrr = L.marker([y2,x2]).addTo(map);
       markerrr.bindPopup(""+nametr+"");
       zup_mark_data.push(markerrr);
       }
     }
     }
    
 }
 
  if(stroka.length>0){
  
  
  let strr="";
 if(rows.length>0){
  for(let v = 0; v<rows.length; v++){
  if(rows[v].cells[0].textContent==nametr.split(' ')[0]+' '+nametr.split(' ')[1]+''+Global_DATA[i][Global_DATA[i].length-1][5].split(' ')[0]){
   let ind=stroka.length-(rows[v].cells.length-1);

   if(ind<=0){
   if(rows[v].cells[1].innerHTML!=stroka[stroka.length-1]){
   rows[v].cells[1].innerHTML=stroka[stroka.length-1];
   coll = "#98FB98";
    if(stroka[stroka.length-1]=="пер"){coll = "#FFFF00";}
    if(stroka[stroka.length-1]=="роб <br>невідомо"){coll = "#f8b1c0";}
    rows[v].cells[1].style.backgroundColor = coll;
   }
   }
   if(rows[v].cells[1].innerHTML!=stroka[rows[v].cells.length-2]){
    rows[v].cells[1].innerHTML=stroka[rows[v].cells.length-2];
    coll = "#98FB98";
     if(stroka[rows[v].cells.length-2]=="пер"){coll = "#FFFF00";}
     if(stroka[rows[v].cells.length-2]=="роб <br>невідомо"){coll = "#f8b1c0";}
     rows[v].cells[1].style.backgroundColor = coll;
    }

   for(let vv = ind-1; vv>=0; vv--){
    if(rows[v].cells[1].innerHTML!=stroka[stroka.length-1-vv]){
    rows[v].insertCell(1);
    rows[v].cells[1].innerHTML=stroka[stroka.length-1-vv];
    coll = "#98FB98";
    if(stroka[stroka.length-1-vv]=="пер"){coll = "#FFFF00";}
    if(stroka[stroka.length-1-vv]=="роб <br>невідомо"){coll = "#f8b1c0";}
    rows[v].cells[1].style.backgroundColor = coll;
    }  
   }
   break;
  }else{
    if(v==rows.length-1){ 
   for(let v = stroka.length-1; v>=0; v--){
     coll = "#98FB98";
     if(stroka[v]=="пер"){coll = "#FFFF00";}
     if(stroka[v]=="роб <br>невідомо"){coll = "#f8b1c0";}
     strr+= "<td bgcolor = '"+coll+"'>"+stroka[v]+"</td>";
     }
    $("#monitoring_table").append("<tr id="+id+"><td>"+nametr.split(' ')[0]+' '+nametr.split(' ')[1]+'<br>'+Global_DATA[i][Global_DATA[i].length-1][5].split(' ')[0]+"</td>"+strr+"</tr>");
       }
   }
  }
  }else{
  
  for(let v = stroka.length-1; v>=0; v--){
     coll = "#98FB98";
     if(stroka[v]=="пер"){coll = "#FFFF00";}
     if(stroka[v]=="роб <br>невідомо"){coll = "#f8b1c0";}
     strr+= "<td bgcolor = '"+coll+"'>"+stroka[v]+"</td>";
     }
    $("#monitoring_table").append("<tr id="+id+"><td>"+nametr.split(' ')[0]+' '+nametr.split(' ')[1]+'<br>'+Global_DATA[i][Global_DATA[i].length-1][5].split(' ')[0]+"</td>"+strr+"</tr>");
  }
 }
}});
}
$('#men7').css({'background':'#fffd7e'});
}
function PointInField(y,x){

  for (let i = 0; i < geozones.length; i++) {
    let zonee = geozones[i].zone;
    let name = zonee.n;
    let point = zonee.p;
    let ba=zonee.b;
    //console.log(point);
    if(name[0]=='2' || name[0]=='1' || name[0]=='5') continue;
    if(wialon.util.Geometry.pointInShape(point, 0, x, y,ba)){
      return name;
    }
 }
 return 'невідомо';

}


function track_Monitoring(evt){
  
   if(evt.target.cellIndex>0){ 
   if(evt.target.style.backgroundColor == 'transparent'){
   evt.target.style.backgroundColor = '#1E90FF';
   }else{
    evt.target.style.backgroundColor = 'transparent';
   }
   }else{
   [...document.querySelectorAll("td")].forEach(e => {
    if(e.cellIndex==0){e.style.backgroundColor = 'transparent';}
   });
   if(evt.target.style.backgroundColor == 'transparent')evt.target.style.backgroundColor = '#1E90FF';
   $("#lis0").chosen().val(evt.target.parentNode.id);
   $("#lis0").trigger("chosen:updated");
   layers[0]=0;
   show_track();
   let mar=markerByUnit[evt.target.parentNode.id];
   mar.openPopup();
   map.setView([mar.getLatLng().lat,mar.getLatLng().lng+0.02],14,{animate: false});
   }
     
 }
//====================zalishki palnogo================================
let bufer=[];
let garbage =[];
let garbagepoly =[];
let buferpoly=[];

function RemainsFuel(e){
//let cir = L.circle(e.latlng, {radius: 2000}).addTo(map);
 bufer.push(e.latlng);
 buferpoly.push({x:e.latlng.lat, y:e.latlng.lng}); 
 if(bufer.length>1){
 let line = L.polyline([bufer[bufer.length-2],bufer[bufer.length-1]], {opacity: 0.3, color: '#0000FF'}).addTo(map);
 garbage.push(line);

 if(wialon.util.Geometry.getDistance(bufer[0].lat, bufer[0].lng,bufer[bufer.length-1].lat, bufer[bufer.length-1].lng)<900){
 if(bufer.length>2){
  let color='#'+(Math.random() * 0x1000000 | 0x1000000).toString(16).slice(1);
  let polygon = L.polygon(bufer, {color: color}).addTo(map);
  garbagepoly.push(polygon);


  if ($('#zz1').is(':visible')) {
    $("#unit_table").append("<tr><td>&nbsp&nbsp&nbsp&nbsp&nbsp</td><td>-----------</td><td>--------</td><td>--------</td><td>---------</td></tr>");
    let str =$('#unit_palne').val().split(',');
    for(let i = 0; i<unitslist.length; i++){
      let namet = unitslist[i].getName();
      let id = unitslist[i].getId();
      let time = Date.parse($('#f').text());
      str.forEach((element) => {if(namet.indexOf(element)>=0){
        let markerr= markerByUnit[unitslist[i].getId()];
        if(markerr){
         let lat = markerr.getLatLng().lat;
         let lon = markerr.getLatLng().lng;
          if(wialon.util.Geometry.pointInShape(buferpoly, 0, lat, lon)){
            let agregat = markerr._popup._content.split('<br />')[4];
            if(agregat)agregat=agregat.split(' ')[0];
            if(!agregat){
              agregat="-----";
              if(namet.indexOf('JCB')>0|| namet.indexOf('Manitou')>0 || namet.indexOf('Scorpion')>0)agregat="погрузчик";
              if(namet.indexOf('CASE 4430')>0 || namet.indexOf('R4045')>0|| namet.indexOf('612R')>0)agregat="обприскувач";
            }
            let drp = markerr._popup._content.split('<br />')[3]; 
            if(!drp){
              for(let ii = 0; ii<Global_DATA.length; ii++){
                let idd = Global_DATA[ii][0][0];
                if(idd!=id)continue;
                for(let iii = 1; iii<Global_DATA[ii].length; iii++){
                   if(time>Global_DATA[ii][iii][4]){
                    drp =Global_DATA[ii][iii][2].split('.')[0];
                   }else break;
                }
              } 
            }else drp=drp.split('.')[0];
           

            let mesto = "-----";
            for(let i = 0; i<geozonesgrup.length; i++){ 
              let cord= geozonesgrup[i].toGeoJSON().features[0];
              let buferpoly2 =[];
              if(cord){
                
                cord.geometry.coordinates[0].forEach(function(item, arr) {
                  buferpoly2.push({x:item[1], y:item[0]}); 
                });
                if(wialon.util.Geometry.pointInShape(buferpoly2, 0, lat, lon)){
                  mesto=geozonesgrup[i]._tooltip._content;
                  break;
                }
              }
            }
            
            $("#unit_table").append("<tr class='fail_trak' id='"+unitslist[i].getId()+"," + lat+","+lon+ "'><td bgcolor ="+color+">&nbsp&nbsp&nbsp&nbsp&nbsp</td><td align='left'>"+namet+"</td><td>"+agregat+"</td><td>"+drp+"</td><td>"+mesto+"</td></tr>");

          }
        } 
      }});
        
    }
  }

    if ($('#zz2').is(':visible')) {
      $("#unit_table").append("<tr><td>&nbsp&nbsp&nbsp&nbsp&nbsp</td><td>ТЗ</td><td>вїзд</td><td>виїзд</td><td>простій/год</td></tr>");
    let str =$('#unit_geozup').val().split(',');
    let numm =0;
    for(let i = 0; i<Global_DATA.length; i++){
      let nametr = Global_DATA[i][0][1];
      let prostoy=0;
      let start=0;
      str.forEach((element) => {if(nametr.indexOf(element)>=0){
       prostoy=0;
       start=0;
       for (let ii = 0; ii<Global_DATA[i].length-1; ii++){
       if(!Global_DATA[i][ii][0])continue;
       if(!Global_DATA[i][ii][4])continue;
       if(!Global_DATA[i][ii+1][4])continue;
       if(!Global_DATA[i][ii][0])continue;
       let y = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
       let x = parseFloat(Global_DATA[i][ii][0].split(',')[1]);
        if(wialon.util.Geometry.pointInShape(buferpoly, 0, y, x)){
          if(start==0)start=Global_DATA[i][ii][1];
          if(Global_DATA[i][ii][3][0]==0){prostoy+=(Global_DATA[i][ii+1][4]-Global_DATA[i][ii][4])/1000;}
        }else{ 
          if(start!=0){
            let m = Math.trunc(prostoy / 60) + '';
            let h = Math.trunc(m / 60) + '';
            m=(m % 60) + '';
            numm++;
          $("#unit_table").append("<tr><td bgcolor ="+color+">&nbsp&nbsp"+numm+"&nbsp&nbsp</td><td align='left'>"+nametr+"</td><td>"+start+"</td><td>"+Global_DATA[i][ii][1]+"</td><td>"+h.padStart(2, 0) + ':' + m.padStart(2, 0) +"</td></tr>");
          prostoy=0;
          start=0;
        }
        
      }
      if(start!=0 && ii==Global_DATA[i].length-2){
        let m = Math.trunc(prostoy / 60) + '';
        let h = Math.trunc(m / 60) + '';
        m=(m % 60) + '';
        numm++;
      $("#unit_table").append("<tr><td bgcolor ="+color+">&nbsp&nbsp"+numm+"&nbsp&nbsp</td><td align='left'>"+nametr+"</td><td>"+start+"</td><td>не виїзджав</td><td>"+h.padStart(2, 0) + ':' + m.padStart(2, 0) +"</td></tr>");
      prostoy=0;
      start=0;
    }
       }
      }});
    }

  }

  if ($('#zz3').is(':visible')) { 
    
    let str =$('#unit_moto').val().split(',');
    let str2='';
    for(let i = 0; i<unitslist.length; i++){
      let namet = unitslist[i].getName();
      str.forEach((element) => {if(namet.indexOf(element)>=0){
        let markerr= markerByUnit[unitslist[i].getId()];
        if(markerr){
         let lat = markerr.getLatLng().lat;
         let lon = markerr.getLatLng().lng;
          if(wialon.util.Geometry.pointInShape(buferpoly, 0, lat, lon)){
            str2+=namet+',';
          }
        } 
      }});   
    }
       
      $("#unit_table").empty();
      if(str2=='') return;
      let html = Motogod(str2.slice(0, -1));
      $("#unit_table").append(html);
  }


 }

 clearGarbage(garbage);
 bufer=[];
 buferpoly=[];

 }else{ var tooltip = L.tooltip(bufer[0], {content: 'end'}).addTo(map);}
 }else{ 
  var tooltip = L.tooltip(e.latlng, {content: 'start'}).addTo(map);
  bufer=[];
  buferpoly=[];
  bufer.push(e.latlng);
  buferpoly.push({x:e.latlng.lat, y:e.latlng.lng}); 
}
}

//if(wialon.util.Geometry.pointInShape(geozonepoint, 0, lat, lon)){

function clearGarbage(garbage){
  for(var i=0; i < garbage.length; i++){
    map.removeLayer(garbage[i]);
     if(i == garbage.length-1){garbage.length=0;}
    }
}

let stan=[[51.55109167453309,33.34894127728944,373,'ККЗ'],
[51.4932345615444,33.40017453599349,460,'Буйвалове'],
[51.622424409240104,33.0929363543844,436,'Райгородок ферма'],
[51.745262906172094,33.7985328417313,179,'стан Слоут'],
[51.51692830745467,32.98792806762675,198,'стан Карильське'],
];
function Motogod(filtr){
let str =filtr.split(',');
let html0="<tr><td>ТЗ</td><td>робота год</td><td>робота км</td><td>робота л</td>";
if ($("#1_mot").is(":checked")) html0+="<td>переїзд год</td><td>переїзд км</td><td>переїзд л</td>"
if ($("#2_mot").is(":checked")) html0+="<td>робота в полі год</td><td>робота в полі км</td><td>робота в полі л</td>"
html0+="<td>простій год</td>";
if ($("#3_mot").is(":checked")) html0+="<td>простій на стані год</td><td>простій по за станом год</td>"
if ($("#4_mot").is(":checked")) html0+="<td>простій мот-год</td><td>простій літри</td><td>простій л/год</td>" 
html0+="</tr>";
for(let i = 0; i<Global_DATA.length; i++){
let nametr = Global_DATA[i][0][1];
let litry0=0;
let prostoy0=0;
let zupp0 =0;
let litry=0;
let prostoy=0;
let zupp=0;
let stoyanka=0;
let stoyanka_stan=0;
let stoyanka_pole=0;
let rob_km=0;
let rob_sec=0;
let rob_lit=0;
let pereysd_km=0;
let pereysd_sec=0;
let pereysd_lit=0;
let pole_km=0;
let pole_sec=0;
let pole_lit=0;

let pereysd_data0=[];
let pole_data0=[];

str.forEach((element) => {if(nametr.indexOf(element)>=0){
 litry0=0;
 prostoy0=0;
 zupp0=0;
 litry=0;
 prostoy=0;
 zupp=0;
 for (let ii = 1; ii<Global_DATA[i].length-7; ii++){


 if(!Global_DATA[i][ii][3])continue;
 if(!Global_DATA[i][ii+6][3])continue;
 if(!Global_DATA[i][ii][4])continue;
 if(!Global_DATA[i][ii+6][4])continue;
 if(!Global_DATA[i][ii][2])continue;
 if(!Global_DATA[i][ii+6][2])continue;
 
 
  if(Global_DATA[i][ii][3][0]==0 && Global_DATA[i][ii+6][3][0]==0){
    zupp0+=(Global_DATA[i][ii+6][4]-Global_DATA[i][ii][4])/1000;
 let ras =(Global_DATA[i][ii][2]-Global_DATA[i][ii+6][2])/((Global_DATA[i][ii+6][4]-Global_DATA[i][ii][4])/3600000);
  if(ras<15 && ras>1){
  litry0+=Global_DATA[i][ii][2]-Global_DATA[i][ii+6][2];
  prostoy0+=(Global_DATA[i][ii+6][4]-Global_DATA[i][ii][4])/1000;
  ii+=6;
  
  }else{
    if(prostoy0>600){litry+=litry0;prostoy+=prostoy0;}
    litry0=0;
    prostoy0=0;
    ii+=5;
  }
  }else{
    if(prostoy0>600){litry+=litry0;prostoy+=prostoy0;}
    litry0=0;
    prostoy0=0;
    zupp+=zupp0;
    zupp0=0;
    ii+=5;
  }
 
 }

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

let sy=0;
let sx=0;
let ssy=0;
let ssx=0;
let kmx=0;
let kmy=0;
let i0=0;

let rob=0;
let per=0;
let grafik=[];


for (let ii = 2; ii<Global_DATA[i].length-1; ii+=1){      
    if(ii<2)continue;
    if(ii>Global_DATA[i].length-2)continue;
    if(!Global_DATA[i][ii-1][0])continue;
    if(!Global_DATA[i][ii][0])continue;
    if(!Global_DATA[i][ii+1][0])continue;

    if(Global_DATA[i][ii][3][0]=='0'){ 
      stoyanka+=(Global_DATA[i][ii+1][4]-Global_DATA[i][ii][4])/1000;
    let yyy = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
    let xxx = parseFloat(Global_DATA[i][ii][0].split(',')[1]);
            for (let j = 0; j<stan.length; j++){
              if(wialon.util.Geometry.getDistance(yyy,xxx,stan[j][0],stan[j][1])<stan[j][2]){stoyanka_stan+=(Global_DATA[i][ii+1][4]-Global_DATA[i][ii][4])/1000;}
            }

    }
    
    

    let y0 = parseFloat(Global_DATA[i][ii-1][0].split(',')[0]);
    let x0 = parseFloat(Global_DATA[i][ii-1][0].split(',')[1]);
    let y1 = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
    let x1 = parseFloat(Global_DATA[i][ii][0].split(',')[1]);
    let y2 = parseFloat(Global_DATA[i][ii+1][0].split(',')[0]);
    let x2 = parseFloat(Global_DATA[i][ii+1][0].split(',')[1]);

    let point0 = turf.point([x0, y0]);
    let point1 = turf.point([x1, y1]);
    let point2 = turf.point([x2, y2]);
    let bearing0 = 0;
    let bearing1 = 0;
    if(wialon.util.Geometry.getDistance(y0,x0,y1,x1)>wialon.util.Geometry.getDistance(y1,x1,y2,x2)){
     bearing0 = turf.bearing(point0, point1);
     bearing1 = turf.bearing(point0, point2);
    }else{
     bearing0 = turf.bearing(point2, point1);
     bearing1 = turf.bearing(point2, point0);
    }
    
    if(Math.abs(bearing0-bearing1)<10 || Math.abs(bearing0-bearing1)>350){ 
      //L.polyline([[y0, x0],[y2, x2]], {color: 'red'}).addTo(map);
      if(sy==0){sy=y0;i0=ii-1;}
      if(sx==0)sx=x0; 

    }else{
      //L.polyline([[y0, x0],[y2, x2]], {color: 'red'}).addTo(map);
      if(sy!=0 && wialon.util.Geometry.getDistance(sy,sx,y1,x1)>50){
        if(ssy!=0 && wialon.util.Geometry.getDistance(ssy,ssx,y1,x1)<300){
          if(ii-i0>2)robota();
        }else{
          if(ii-i0<150){ 
            let l = i0+(ii-i0)/2;
            //let y100 = parseFloat(Global_DATA[i][l.toFixed()][0].split(',')[0]);
            //let x100 = parseFloat(Global_DATA[i][l.toFixed()][0].split(',')[1]);
            let y200 = parseFloat(((sy+y1)/2).toFixed(6));
            let x200 = parseFloat(((sx+x1)/2).toFixed(6));
           
            
            let point=0;
            for (let n = i0-200; n<ii+200; n++){
              if(n>2 && n<Global_DATA[i].length-1){
                if(n<i0 || n>ii){
                let y = parseFloat(Global_DATA[i][n][0].split(',')[0]);
                let x = parseFloat(Global_DATA[i][n][0].split(',')[1]);
                if(wialon.util.Geometry.getDistance(y200,x200,y,x)<150){point++;}
                }
              }  
            }
            //L.circle([y200, x200], { color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: 100}).bindPopup(""+point+"").addTo(map);

            if(point>5){
              if(ii-i0>10) robota();
            }else{
              if(ii-i0>10)pereyesd();
            }   
          }else{
            if(ii-i0>20)pereyesd();
          } 
        }
        ssy=sy;
        ssx=sx;
        
      }
      sy=0;
      sx=0;
      i0=0;
    }

    function robota(){
      kmx=0;
      kmy=0;
      if(rob==0){rob=i0;}
      if(per>0){
        //console.log(nametr,"pereyezd",Global_DATA[i][per][1],Global_DATA[i][i0][1])
        let zapravka=0;
        let t0=0;
        let z0=0;
        let z1=0;
        let l0=10000000;
        let l1=0;
        let n0=0;
        for (let j = per; j<i0; j++){
          let jy0 = parseFloat(Global_DATA[i][j][0].split(',')[0]);
          let jx0 = parseFloat(Global_DATA[i][j][0].split(',')[1]);
          let jy1 = parseFloat(Global_DATA[i][j+1][0].split(',')[0]);
          let jx1 = parseFloat(Global_DATA[i][j+1][0].split(',')[1]);
          let ttt=(Global_DATA[i][j+1][4]-Global_DATA[i][j][4])/1000;
          let km=wialon.util.Geometry.getDistance(jy0,jx0,jy1,jx1);
          let litry=parseFloat(Global_DATA[i][j][2]);
          if(Global_DATA[i][j][3][0]=='0'){ 
            n0++;
            if(t0==0)t0=Global_DATA[i][j][4]/1000;
            if(l1==0)l1=parseFloat(Global_DATA[i][j][2]);
            if(l0==10000000 && n0>5)l0=parseFloat(Global_DATA[i][j][2]);
            if(pereysd_data0.length>0){z0=litry-l0; z1=litry-l1;}
          }else{
            if(km)pereysd_km+=km;
            pereysd_sec+=ttt; 
            if(z0<50){z1=0;}
            if(Global_DATA[i][j][4]/1000-t0<150){z1=0;}
            zapravka+=z1;
            z0=0;
            z1=0;
            t0=0;
            l0=10000000;
            l1=0;
            n0=0;
            if(litry>0)pereysd_data0.push([litry-zapravka,Global_DATA[i][j][1]]);
          }
          //if(jy0 && jx0 && jy1 && jx1 )L.polyline([[jy0, jx0],[jy1, jx1]], {color: '#55ff33'}).addTo(map);
         } 
         let kz=0;
         let zapr=0;
         let kz2=0;
         let zapr2=0;
         for (let n = 1; n<11; n++){
          if(per-n>2){
            let lll = parseFloat(Global_DATA[i][per-n][2]);
            let lll0 = parseFloat(Global_DATA[i][per-n-1][2]);
            if(Global_DATA[i][per-n][3][0]=='0' && Global_DATA[i][per-n-1][3][0]=='0'){
              if(lll>lll0){kz+=lll-lll0;}else{
                if(kz>50)zapr=kz;
                if(lll>0)pereysd_data0.unshift([lll+zapr,Global_DATA[i][per-n][1]]);
              }
            }else{
              if(lll>0)pereysd_data0.unshift([lll+zapr,Global_DATA[i][per-n][1]]);
            }
          }
          if(i0+n<Global_DATA[i].length-2){
            let lll = parseFloat(Global_DATA[i][i0+n][2]);
            let lll0 = parseFloat(Global_DATA[i][i0+n+1][2]);
            if(Global_DATA[i][i0+n][3][0]=='0'&& Global_DATA[i][i0+n+1][3][0]=='0'){
              if(lll<lll0){kz2+=lll0-lll;}else{
                if(kz2>50)zapr2=kz2;
                if(lll>0)pereysd_data0.push([lll+zapr2-zapravka,Global_DATA[i][i0+n][1]]);
              }
            }else{
              if(lll>0)pereysd_data0.push([lll+zapr2-zapravka,Global_DATA[i][i0+n][1]]);
            }
          }
        }
         pereysd_lit+=linearRegression(pereysd_data0);
         pereysd_data0=[];
      }
      per=0;

    }
    function pereyesd(){
      if(kmx==0){kmx=sx;kmy=sy;}
      if(per==0){per=i0;}
      if(rob>0){
        //console.log(nametr,"robota",Global_DATA[i][rob][1],Global_DATA[i][i0][1])
        let zapravka=0;
        let t0=0;
        let z0=0;
        let z1=0;
        let l0=10000000;
        let l1=0;
        let n0=0;
        for (let j = rob; j<i0; j++){
          let jy0 = parseFloat(Global_DATA[i][j][0].split(',')[0]);
          let jx0 = parseFloat(Global_DATA[i][j][0].split(',')[1]);
          let jy1 = parseFloat(Global_DATA[i][j+1][0].split(',')[0]);
          let jx1 = parseFloat(Global_DATA[i][j+1][0].split(',')[1]);
          let ttt=(Global_DATA[i][j+1][4]-Global_DATA[i][j][4])/1000;
          let km=wialon.util.Geometry.getDistance(jy0,jx0,jy1,jx1);
          let litry=parseFloat(Global_DATA[i][j][2]);
          if(Global_DATA[i][j][3][0]=='0'){ 
            n0++;
            if(t0==0)t0=Global_DATA[i][j][4]/1000;
            if(l1==0)l1=parseFloat(Global_DATA[i][j][2]);
            if(l0==10000000 && n0>5)l0=parseFloat(Global_DATA[i][j][2]);
            if(pole_data0.length>0){z0=litry-l0; z1=litry-l1;}
          }else{
            if(km)pole_km+=km;
            pole_sec+=ttt; 
            if(z0<50){z1=0;}
            if(Global_DATA[i][j][4]/1000-t0<150){z1=0;}
            zapravka+=z1;
            z0=0;
            z1=0;
            t0=0;
            l0=10000000;
            l1=0;
            n0=0;
            if(litry>0)pole_data0.push([litry-zapravka,Global_DATA[i][j][1]]);
          }
          //if(jy0 && jx0 && jy1 && jx1)L.polyline([[jy0, jx0],[jy1, jx1]], {color: 'red'}).addTo(map);
         } 

         let kz=0;
         let zapr=0;
         let kz2=0;
         let zapr2=0;
         for (let n = 1; n<11; n++){
          if(rob-n>2){
            let lll = parseFloat(Global_DATA[i][rob-n][2]);
            let lll0 = parseFloat(Global_DATA[i][rob-n-1][2]);
            if(Global_DATA[i][rob-n][3][0]=='0' && Global_DATA[i][rob-n-1][3][0]=='0'){
              if(lll>lll0){kz+=lll-lll0;}else{
                if(kz>50)zapr=kz;
                if(lll>0)pole_data0.unshift([lll+zapr,Global_DATA[i][rob-n][1]]);
              }
            }else{
              if(lll>0)pole_data0.unshift([lll+zapr,Global_DATA[i][rob-n][1]]);
            }
          }
          if(i0+n<Global_DATA[i].length-2){
            let lll = parseFloat(Global_DATA[i][i0+n][2]);
            let lll0 = parseFloat(Global_DATA[i][i0+n+1][2]);
            if(Global_DATA[i][i0+n][3][0]=='0'&& Global_DATA[i][i0+n+1][3][0]=='0'){
              if(lll<lll0){kz2+=lll0-lll;}else{
                if(kz2>50)zapr2=kz2;
                if(lll>0)pole_data0.push([lll+zapr2-zapravka,Global_DATA[i][i0+n][1]]);
              }
            }else{
              if(lll>0)pole_data0.push([lll+zapr2-zapravka,Global_DATA[i][i0+n][1]]);
            }
          }
        }
         pole_lit+=linearRegression(pole_data0);
         pole_data0=[];
        }
      rob=0;
    }
}


if(prostoy0>600){litry+=litry0;prostoy+=prostoy0;}
zupp+=zupp0;

stoyanka_pole=stoyanka-stoyanka_stan;


if(rob>0){pereyesd();}
if(per>0){robota();}

 rob_km=pereysd_km+pole_km;
 rob_lit=pereysd_lit+pole_lit;;
 rob_sec=pereysd_sec+pole_sec;


 let html="<tr><td align='left' nowrap>"+nametr+"</td>";

  let m = Math.trunc(rob_sec / 60) + '';
  let h = Math.trunc(m / 60) + '';
 m=(m % 60) + '';
 html+="<td>"+h.padStart(2, 0) + ":" + m.padStart(2, 0) + ":00</td><td>"+(rob_km/1000).toFixed() +"</td><td>"+(rob_lit).toFixed(2) +"</td>";

  m = Math.trunc(pereysd_sec / 60) + '';
  h = Math.trunc(m / 60) + '';
m=(m % 60) + '';
if ($("#1_mot").is(":checked"))html+="<td>"+h.padStart(2, 0) + ":" + m.padStart(2, 0) + ":00</td><td>"+(pereysd_km/1000).toFixed() +"</td><td>"+(pereysd_lit).toFixed(2) +"</td>";

 m = Math.trunc(pole_sec / 60) + '';
 h = Math.trunc(m / 60) + '';
m=(m % 60) + '';
if ($("#2_mot").is(":checked"))html+="<td>"+h.padStart(2, 0) + ":" + m.padStart(2, 0) + ":00</td><td>"+(pole_km/1000).toFixed() +"</td><td>"+(pole_lit).toFixed(2) +"</td>";

  m = Math.trunc(stoyanka / 60) + '';
  h = Math.trunc(m / 60) + '';
 m=(m % 60) + '';
 html+="<td>"+h.padStart(2, 0) + ":" + m.padStart(2, 0) + ":00</td>";

 m = Math.trunc(stoyanka_stan / 60) + '';
  h = Math.trunc(m / 60) + '';
 m=(m % 60) + '';
 if ($("#3_mot").is(":checked"))html+="<td>"+h.padStart(2, 0) + ":" + m.padStart(2, 0) + ":00</td>";

 m = Math.trunc(stoyanka_pole / 60) + '';
 h = Math.trunc(m / 60) + '';
m=(m % 60) + '';
if ($("#3_mot").is(":checked"))html+="<td>"+h.padStart(2, 0) + ":" + m.padStart(2, 0) + ":00</td>";

  m = Math.trunc(prostoy / 60) + '';
  h = Math.trunc(m / 60) + '';
  m=(m % 60) + '';
  if ($("#4_mot").is(":checked")) html+="<td>"+h.padStart(2, 0) + ":" + m.padStart(2, 0) + ":00</td>";
 let lkm = (litry/prostoy*3600).toFixed(1);
 if ($("#4_mot").is(":checked"))html+="<td>"+ litry.toFixed(1) +"</td><td>"+ lkm +"</td></tr>";

 if(stoyanka>0)html0+=html;

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
}});
}

return html0;
}

function linearRegression(data){
  var a = 0;
  var b = 0;
  var k = 30;
  var result = 0;
  
  if(data.length<k*1.5)return result;
  for( var i=0; i<k; i++){
    a+=data[i][0];
    b+=data[data.length-1-i][0];
  }
  a=a/k;
  b=b/k;

  result = a-b;
  //console.log(a,data[0][1])
  //console.log(b,data[data.length-1][1])
  //console.log(result)
  return result;

}

function tehnika_poruch(name,y,x,time){ 
  for(let i = 0; i<Global_DATA.length; i++){
    if(name==Global_DATA[i][0][1]) continue;
    for (let ii = Global_DATA[i].length-1; ii>=0; ii--){
       if(time>Global_DATA[i][ii][4]){
        let yy = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
        let xx = parseFloat(Global_DATA[i][ii][0].split(',')[1]);
        if(wialon.util.Geometry.getDistance(y,x,yy,xx)<100){ return true; }else {break};
      }
    }
  }
  return false;
}

function rob_region(){
  $("#unit_table").empty();
let str =$('#unit_prPos').val().split(',');
let mesto="";
for(let i = 0; i<geozonesgrup.length; i++){ 
  mesto="";
  let cord= geozonesgrup[i].toGeoJSON().features[0];
  let buferpoly2 =[];
  if(cord){
    
    cord.geometry.coordinates[0].forEach(function(item, arr) {
      buferpoly2.push({x:item[1], y:item[0]}); 
    });

    for(let ii = 0; ii<Global_DATA.length; ii++){
      let nametr = Global_DATA[ii][0][1];
      if(Global_DATA[ii].length<100)  continue;
      str.forEach((element) => {if(nametr.indexOf(element)>=0){
        let lat = parseFloat(Global_DATA[ii][Global_DATA[ii].length-1][0].split(',')[0]);
        let lon = parseFloat(Global_DATA[ii][Global_DATA[ii].length-1][0].split(',')[1]);
        if(wialon.util.Geometry.pointInShape(buferpoly2, 0, lat, lon)){
         
          if(mesto==""){
            mesto=geozonesgrup[i]._tooltip._content;
            $("#unit_table").append("<tr><td  bgcolor='#A9BCF5'><b>"+mesto+"</b></td></tr>");
          }
          $("#unit_table").append("<tr class='fail_trak' id='"+Global_DATA[ii][0][0]+"," + lat+","+lon+ "'><td align='left'>"+nametr+"</td><td>"+Global_DATA[ii][Global_DATA[ii].length-1][5].split(' ')[0]+"</td><td>"+Global_DATA[ii][Global_DATA[ii].length-1][2]+"</td><td>"+Global_DATA[ii][Global_DATA[ii].length-1][6]+"</td></tr>");
         
        }
      }});
    } 
  }
}

 }


 function zlivy(){
  $("#unit_table").empty();
  $("#unit_table").append("<tr><td>ТЗ</td><td>Початок</td><td>Кінець</td><td>літри</td><td>тривалість</td></tr>");

  let min_sliv=$('#min_sliv').val();
  let t_pod=40;

  for(let i = 0; i<Global_DATA.length; i++){
    let nametr = Global_DATA[i][0][1];
    let id = Global_DATA[i][0][0];
    if(nametr=='ДРП ККЗ'|| nametr=='ДРП Райгородок'|| nametr=='Бензин ККЗ Ультразвук'|| nametr=='РЕЗЕРВУАР ККЗ новий') continue;
    let start=0;
    let finish=0;
    let interval0=0;
    let interval1=0;
    let zup1=0;
    let zup2=0;
    let litry=0;
    let litry0=0;
    let litry1=0;
    let litry_start=0;
 
    
    for (let ii = 0; ii<Global_DATA[i].length-1; ii++){
      if(!Global_DATA[i][ii][3])continue;
      if(!Global_DATA[i][ii+1][3])continue;
      if(!Global_DATA[i][ii][4])continue;
      if(!Global_DATA[i][ii+1][4])continue;
      if(!Global_DATA[i][ii][2])continue;
      if(!Global_DATA[i][ii+1][2])continue;
      if(Global_DATA[i][ii][3][0]==0){
        let rashod=(Global_DATA[i][ii][2]-Global_DATA[i][ii+1][2])/((Global_DATA[i][ii+1][4]-Global_DATA[i][ii][4])/3600000);
        if(rashod<40 && rashod>-25 && litry==0){
          zup1+=(Global_DATA[i][ii+1][4]-Global_DATA[i][ii][4])/1000; 
          if(litry0==0)litry0=Global_DATA[i][ii][2];
        }
        if(rashod>100){
          if(zup1>=t_pod){
            if(litry_start==0)litry_start=Global_DATA[i][ii][2];
            litry=litry_start-Global_DATA[i][ii+1][2];
            if(start==0)start=Global_DATA[i][ii][1];
            finish=Global_DATA[i][ii+1][1];
            if(interval0==0)interval0=Global_DATA[i][ii][4];
            interval1=Global_DATA[i][ii+1][4];
            zup2=0;
          }
          if(zup2>5){
            zup1=30;
            zup2=0;
          }
        }
        if(rashod<40 && rashod>-25 && litry>0){
          zup2+=(Global_DATA[i][ii+1][4]-Global_DATA[i][ii][4])/1000; 
          if(zup2>=t_pod){
            litry1=litry0-Global_DATA[i][ii][2];
            if(litry>min_sliv/2 && litry1>min_sliv){
              $("#unit_table").append("<tr class='sliv_trak' id='"+id+"," + parseFloat(Global_DATA[i][ii][0].split(',')[0])+","+parseFloat(Global_DATA[i][ii][0].split(',')[1])+ "'><td align='left'>"+nametr+"</td><td>"+start+"</td><td>"+finish+"</td><td>"+litry.toFixed(1)+"л </td><td>"+(interval1-interval0)/1000+" сек </td></tr>");
              zup1=0;
              zup2=0;
              litry=0;
              start=0;
              finish=0;
              interval0=0;
              interval1=0;
              litry0=0;
              litry1=0;
              litry_start=0;
            }else{
              zup1=30;
              zup2=0;
              litry=0;
              start=0;
              finish=0;
              interval0=0;
              interval1=0;
              litry0=0;
              litry1=0;
              litry_start=0;
            }
          }
        }
        if(rashod<-500){
          zup1=0;
          zup2=0;
          litry=0;
          start=0;
          finish=0;
          interval0=0;
          interval1=0;
          litry0=0;
          litry1=0;
          litry_start=0;
        }
        
      }else{
        zup1=0;
        zup2=0;
        litry=0;
        start=0;
        finish=0;
        interval0=0;
        interval1=0;
        litry0=0;
        litry_start=0;
      }

    }
  }
 }



   
   function track_Sliv(evt){
    [...document.querySelectorAll("#unit_table tr")].forEach(e => e.style.backgroundColor = '');
    this.style.backgroundColor = 'pink';
    let row = evt.target.parentNode; // get row with data by target parentNode
    let data=row.cells[1].textContent;
    let data2=row.cells[2].textContent;
    slider.value=(Date.parse(data)-Date.parse($('#fromtime1').val()))/(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))*2000;
     position(Date.parse(data));
     $("#lis0").chosen().val(this.id.split(',')[0]);
     $("#lis0").trigger("chosen:updated");
     markerByUnit[this.id.split(',')[0]].openPopup();
     
     if ($('#grafik').is(':hidden')) {
      $('#grafik').show();
      $('#map').css('height', '470px');
      $('#marrr').css('height', '470px');
      $('#option').css('height', '470px');
      $('#unit_info').css('height', '470px');
      $('#zupinki').css('height', '470px');
      $('#logistika').css('height', '470px');
      $('#monitoring').css('height', '470px');
    } 
     show_gr(data,data2);
     map.setView([parseFloat(this.id.split(',')[1]), parseFloat(this.id.split(',')[2])+0.001],13,{animate: false});
    
  }

let temp_stor=[
[51.552284,33.386545,4197,'Кролевець'],
[50.449201,30.522985,23152,'Київ'],
[51.677493,33.912505,3297,'Глухів'],
[51.412857,33.676051,1567,'Литвиновичі'],
[51.482583,33.558107,1332,'Локня'],
[51.761407,33.794152,2640,'Слоут'],
[51.5226,33.5764,1000,'Ярове'],
[51.6259,33.1059,2000,'Райгородок'],
[51.5423,33.6594,2000,'Ярославець'],
[51.4927,33.4165,1500,'Буйвалове'],
[51.4214,33.4826,1500,'Мутин'],
[51.4184,33.7521,1000,'Яцине'],
[51.5664,34.1129,3000,'Шалигине'],
];
async function marshrut_avto(){
  msg('Розпочато зівт маршрутів авто ЗАЧЕКАЙТЕ');
    $("#unit_table").empty();
    $("#unit_table").append("<tr><td>ТЗ</td><td>Початок</td><td>Кінець</td><td>Маршрут</td><td>Пробіг</td></tr>");
    let points = 0; 
    let stoyanka = 0;
    let sttime = 300;
    let km = 0;
    let start=0;
    let end=0;
    let html="";
    let kkk=0;
    
    let adres='';
    let adres0='';
     for(let i = 0; i<Global_DATA.length; i++){ 
      points = 0;
      stoyanka = 500;
      km = 0;
      start="";
      end="";
      html="";
      adres0='';
      kkk=0;
     let nametr = Global_DATA[i][0][1];
     let id = Global_DATA[i][0][0];
     let str =$('#unit_marsh').val().split(',');
     
      for(let v = 0; v<str.length; v++){ 
        if(nametr.indexOf(str[v])<0)continue;
      let markerr= markerByUnit[id];
      let lat = 0;
      let lon = 0;
      if(markerr){
        lat = markerr.getLatLng().lat;
        lon = markerr.getLatLng().lng;
      }
      
       for (let ii = 1; ii<Global_DATA[i].length-1; ii+=1){
   
       if(parseInt(Global_DATA[i][ii][3])<4){ 
        if((Global_DATA[i][ii][4]-Global_DATA[i][ii-1][4])/1000)stoyanka+=(Global_DATA[i][ii][4]-Global_DATA[i][ii-1][4])/1000; 
       }
       if(!Global_DATA[i][ii][0])continue;
       if(!Global_DATA[i][ii-1][0])continue;
       if(!Global_DATA[i][ii+1][0])continue;
       if(parseInt(Global_DATA[i][ii][3])>0){
        let yy = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
        let xx = parseFloat(Global_DATA[i][ii][0].split(',')[1]);
        let yyy = parseFloat(Global_DATA[i][ii+1][0].split(',')[0]);
        let xxx = parseFloat(Global_DATA[i][ii+1][0].split(',')[1]);
        km+=(wialon.util.Geometry.getDistance(yy,xx,yyy,xxx))/1000;
       }

       if(parseInt(Global_DATA[i][ii][3])>=4){
        if(!Global_DATA[i][ii][0])continue;
        if(!Global_DATA[i][ii-1][0])continue;
        if(!Global_DATA[i][ii+1][0])continue;
        if (start==0)start=Global_DATA[i][ii][1];
        end=Global_DATA[i][ii][1];
       
       
        if(stoyanka>sttime){ 
            let y = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
            let x = parseFloat(Global_DATA[i][ii][0].split(',')[1]);
            adres='невідомо';
            for (let j = 0; j<stor.length; j++){
              if(wialon.util.Geometry.getDistance(y,x,stor[j][0],stor[j][1])<stor[j][2]){
                adres=stor[j][3];
                if (adres0 != adres || adres=='невідомо') {
                  kkk++;
                  let mar = L.marker([y,x], {icon: L.divIcon({ className: 'div-icon',iconSize: "auto", html: "<center style = 'background:rgb(170, 248, 170);'>"+kkk+": "+adres+"</center>" }),draggable: true,opacity:0.9,zIndexOffset:1000}).addTo(map);
                  zup_mark_data.push(mar);
                  html+="<span style = 'background:rgb(170, 248, 170);'> "+adres+"</span> -";
                  adres0 =adres;
                }
                adres0 =adres;
                break;
              }
              if(j ==stor.length-1){
                $.get('https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=UA&lat='+y+'&lon='+x+'', function(data){
                  let type='невідомо';
                   if (data.category =="shop")type="магазин"
                   if (data.type =="hospital")type="лікарня"
                   if (data.type =="pharmacy")type="аптека"
                   if (data.type =="car_wash")type="автомийка"
                   if (data.type =="kindergarten")type="садок"
                   if (data.type =="supermarket")type="супермаркет"
                   if (data.type =="parking")type="парковка"
                   if (data.type =="hotel")type="готель"
                   if (data.type =="fitness_centre")type="спортзал"
                   if (data.type =="dentist")type="дантист"
                   if (data.type =="university")type="університет"
                   if (data.type =="unclassified")type="невідомо"
                   if (data.type =="residential")type="жила зона"
                   if (data.type =="apartments")type="жила зона"
                   if (data.type =="primary")type="дорога"
                   if (data.type =="secondary")type="дорога"
                   if (data.type =="trunk")type="дорога"
                   if (data.type =="post_office")type="пошта"
        
                   adres=type;
                   if (adres0 != adres || adres=='невідомо') {
                    kkk++;
                    let mar = L.marker([y,x], {icon: L.divIcon({ className: 'div-icon',iconSize: "auto", html: '<center>'+kkk+': '+type+' - '+data.name+'</center>' }),draggable: true,opacity:0.9,zIndexOffset:1000}).addTo(map);
                     zup_mark_data.push(mar);
                   }
                   adres0 =adres;
                  });
         
                await sleep(1500); 
                html+=" "+adres+" -";

              }
            }
             
              
      
          }else{
            if(ii<31)continue;
            if(ii>Global_DATA[i].length-11)continue;
            if(stoyanka==0)continue;
        
            let y0 = 0;
            let x0 = 0;
            let y1 = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
            let x1 = parseFloat(Global_DATA[i][ii][0].split(',')[1]);
            let y2 = 0;
            let x2 = 0;
            
        
                let b0=100;
                let b1=50;
            outer:for (let v = 5; v<1000; v+=5){
             
              if(Global_DATA[i].length-1<ii+v)break;
              if(!Global_DATA[i][ii+v][0])continue;
              if(parseInt(Global_DATA[i][ii+v][3])<=4)continue;
              let yt = parseFloat(Global_DATA[i][ii+v][0].split(',')[0]);
              let xt = parseFloat(Global_DATA[i][ii+v][0].split(',')[1]);
              if(wialon.util.Geometry.getDistance(yt,xt,y1,x1)>30){
                for (let vv = 5; vv<1000; vv++){
                  if(ii-vv<5)break outer;
                  if(!Global_DATA[i][ii-vv][0])continue;
                  if(parseInt(Global_DATA[i][ii-vv][3])<=4)continue;
                  let ytt = parseFloat(Global_DATA[i][ii-vv][0].split(',')[0]);
                  let xtt = parseFloat(Global_DATA[i][ii-vv][0].split(',')[1]);       
                  if(wialon.util.Geometry.getDistance(ytt,xtt,y1,x1)>30){
                   
                    let p0 = turf.point([xt, yt]);
                    let p1 = turf.point([x1, y1]);
                    let p2 = turf.point([xtt, ytt]);
                    x0=xt;
                    y0=yt;
                    x2=xtt;
                    y2=ytt;
                    //L.polyline([[y0, x0],[y1, x1]], {color: '#55ff33'}).addTo(map);
                    //L.polyline([[y1, x1],[y2, x2]], {color: '#55ff33'}).addTo(map);
                     b0 = turf.bearing(p1, p0);
                     b1 = turf.bearing(p1, p2);
                     break outer;
                  }
                }
              }
            }

            
           

            if(Math.abs(b0-b1)<30 || Math.abs(b0-b1)>330){ 
              //L.polyline([[y0, x0],[y1, x1]], {color: '#55ff33'}).addTo(map);
              //L.polyline([[y1, x1],[y2, x2]], {color: '#55ff33'}).addTo(map);
              
            

              adres='невідомо';
            for (let j = 0; j<stor.length; j++){
              if(wialon.util.Geometry.getDistance(y1,x1,stor[j][0],stor[j][1])<stor[j][2]){
                adres=stor[j][3];
                if (adres0 != adres || adres=='невідомо') {
                  kkk++;
                  let mar = L.marker([y1,x1], {icon: L.divIcon({ className: 'div-icon',iconSize: "auto", html: "<center style = 'background:rgb(170, 248, 170);'>"+kkk+": "+adres+"</center>" }),draggable: true,opacity:0.9,zIndexOffset:1000}).addTo(map);
                  zup_mark_data.push(mar);
                  html+="<span style = 'background:rgb(170, 248, 170);'> "+adres+"</span> -";
                  adres0 =adres;
                }
                adres0 =adres;
                break;
              }
              if(j ==stor.length-1){
                $.get('https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=UA&lat='+y1+'&lon='+x1+'', function(data){
                  let type='невідомо';
                   if (data.category =="shop")type="магазин"
                   if (data.type =="hospital")type="лікарня"
                   if (data.type =="pharmacy")type="аптека"
                   if (data.type =="car_wash")type="автомийка"
                   if (data.type =="kindergarten")type="садок"
                   if (data.type =="supermarket")type="супермаркет"
                   if (data.type =="parking")type="парковка"
                   if (data.type =="hotel")type="готель"
                   if (data.type =="fitness_centre")type="спортзал"
                   if (data.type =="dentist")type="дантист"
                   if (data.type =="university")type="університет"
                   if (data.type =="unclassified")type="невідомо"
                   if (data.type =="residential")type="жила зона"
                   if (data.type =="apartments")type="жила зона"
                   if (data.type =="primary")type="дорога"
                   if (data.type =="secondary")type="дорога"
                   if (data.type =="trunk")type="дорога"
                   if (data.type =="post_office")type="пошта"
        

                   adres=type;
                   if (adres0 != adres || adres=='невідомо') {
                    kkk++;
                    let mar = L.marker([y1,x1], {icon: L.divIcon({ className: 'div-icon',iconSize: "auto", html: '<center>'+kkk+': '+type+' - '+data.name+'</center>' }),draggable: true,opacity:0.9,zIndexOffset:1000}).addTo(map);
                     zup_mark_data.push(mar);
                   }
                   adres0 =adres;
                  });
         
                await sleep(1500); 
                html+=" "+adres+" -";

              }
            }
               
              
                      
               
            
            }
          }
          stoyanka=0;
          points=0;
          adres='';
       }
       if(ii==Global_DATA[i].length-2){
        if(stoyanka>sttime){ 
          let y = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
          let x = parseFloat(Global_DATA[i][ii][0].split(',')[1]);




 
          adres='невідомо';
            for (let j = 0; j<stor.length; j++){
              if(wialon.util.Geometry.getDistance(y,x,stor[j][0],stor[j][1])<stor[j][2]){
                adres=stor[j][3];
                if (adres0 != adres || adres=='невідомо') {
                  kkk++;
                  let mar = L.marker([y,x], {icon: L.divIcon({ className: 'div-icon',iconSize: "auto", html: "<center style = 'background:rgb(170, 248, 170);'>"+kkk+": "+adres+"</center>" }),draggable: true,opacity:0.9,zIndexOffset:1000}).addTo(map);
                  zup_mark_data.push(mar);
                  html+="<span style = 'background:rgb(170, 248, 170);'> "+adres+"</span> -";
                  adres0 =adres;
                }
                adres0 =adres;
                break;
              }
              if(j ==stor.length-1){
                $.get('https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=UA&lat='+y+'&lon='+x+'', function(data){
                  let type='невідомо';
                   if (data.category =="shop")type="магазин"
                   if (data.type =="hospital")type="лікарня"
                   if (data.type =="pharmacy")type="аптека"
                   if (data.type =="car_wash")type="автомийка"
                   if (data.type =="kindergarten")type="садок"
                   if (data.type =="supermarket")type="супермаркет"
                   if (data.type =="parking")type="парковка"
                   if (data.type =="hotel")type="готель"
                   if (data.type =="fitness_centre")type="спортзал"
                   if (data.type =="dentist")type="дантист"
                   if (data.type =="university")type="університет"
                   if (data.type =="unclassified")type="невідомо"
                   if (data.type =="residential")type="жила зона"
                   if (data.type =="apartments")type="жила зона"
                   if (data.type =="primary")type="дорога"
                   if (data.type =="secondary")type="дорога"
                   if (data.type =="trunk")type="дорога"
                   if (data.type =="post_office")type="пошта"
        

                   adres=type;
                   if (adres0 != adres || adres=='невідомо') {
                    kkk++;
                    let mar = L.marker([y,x], {icon: L.divIcon({ className: 'div-icon',iconSize: "auto", html: '<center>'+kkk+': '+type+' - '+data.name+'</center>' }),draggable: true,opacity:0.9,zIndexOffset:1000}).addTo(map);
                     zup_mark_data.push(mar);
                   }
                   adres0 =adres;
                  });
         
                await sleep(1500); 
                html+=" "+adres+" -";

              }
            }
             
             
                  
            
         
        }

       }
 
     }
     if(km.toFixed()>0)$("#unit_table").append("<tr class='fail_trak' id='"+id+"," + lat+","+lon+ "'><td align='left'>"+nametr+"</td><td>"+start.slice(11, 16) +"</td><td>"+end.slice(11, 16) +"</td><td>"+html.slice(0, -1) +"</td><td>"+ km.toFixed()+"</td></tr>");
    }
    }
    msg('Завантажено зівт маршрутів авто');
    }

    async function magazin(data) { 
      msg('ЗАЧЕКАЙТЕ зівт зупинок біля магазинів');
      let stop=0;
      let st=0;
      for(let i=2;i<data[0].length;i++){
        if(!data[0][i-1][2])continue;
        if(!data[0][i][2])continue;
        if(!data[0][i][0])continue;
        
        if( parseInt(data[0][i][2])==0){
          let t = Date.parse(data[0][i][1])-Date.parse(data[0][i-1][1]);
          stop+=t;
          if (st==0)st=i;
        }else{
          if (stop>300000) {
            let y = parseFloat(data[0][st][0].split(',')[0]);
            let x = parseFloat(data[0][st][0].split(',')[1]);
            $.get('https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=UA&lat='+y+'&lon='+x+'', function(data){
              let type=0;
               if (data.category =="shop")type="магазин"
               if (data.type =="hospital")type="лікарня"
               if (data.type =="pharmacy")type="аптека"
               if (data.type =="car_wash")type="автомийка"
               if (data.type =="kindergarten")type="садок"
               if (data.type =="supermarket")type="супермаркет"
               if (data.type =="parking")type="парковка"
               if (data.type =="hotel")type="готель"
               if (data.type =="fitness_centre")type="спортзал"
               if (data.type =="dentist")type="дантист"
               if (data.type =="university")type="університет"
               if (type !=0){
                let mar = L.tooltip([y,x], {content: ""+type+" - "+data.name+"",permanent: true, opacity:0.9, direction: 'top'}).addTo(map);
                 zup_mark_data.push(mar);
                }
              });
               await sleep(2000);  
           
          }
          stop=0;
          st=0;
        }
       
      }
      msg('ЗАВЕРШЕНО зівт зупинок біля магазинів');
    }
    $("#magaz").on("click", function (){
      let n=$('#magaz_unit').val();
     if(!n)return;
      SendDataReportInCallback(0,0,n,zvit2,[],0,magazin);
      return;
    });
    function sleep(ms) {return new Promise(resolve => setTimeout(resolve, ms)); }  
    function Serch_GEO(adres) { 
        wialon.util.Gis.searchByString(adres,0,1, function(code, data) {
        if (code) { msg(wialon.core.Errors.getErrorText(code)); return; } // exit if error code
        if (data) {if (data[0]){map.setView([data[0].items[0].y, data[0].items[0].x], 13); }}});
    }
 
   let probl="";
    function Monitoring2(){
      let rows = document.querySelectorAll('#monitoring_table tr');
      let sttime=$('#min_zup_mon').val()*60;
      let coll = "#98FB98";
      let str =$('#unit_monitoring').val().split(',');
      for(let i = 0; i<Global_DATA.length; i++){ 
       let nametr = Global_DATA[i][0][1];
       let id = Global_DATA[i][0][0];
        for(let v = 0; v<str.length; v++){ 
          if(nametr.indexOf(str[v])<0)continue;
          let sy=0;
          let sx=0;
          let ssy=0;
          let ssx=0;
          let kmx=0;
          let kmy=0;
          let stoyanka=0;
          let stroka=[];
       
         for (let ii = 1; ii<Global_DATA[i].length-1; ii+=1){      
              if(ii<2)continue;
              if(ii>Global_DATA[i].length-2)continue;
              if(!Global_DATA[i][ii-1][0])continue;
              if(!Global_DATA[i][ii][0])continue;
              if(!Global_DATA[i][ii+1][0])continue;

              if(Global_DATA[i][ii][3][0]=='0'){ 
                stoyanka+=(Global_DATA[i][ii][4]-Global_DATA[i][ii-1][4])/1000;
                if(stroka.length>0 && stoyanka>sttime){
                  if(stroka[stroka.length-1]!='сто'){
                  stroka.push('сто');
                  }
                  stoyanka=0;
                  continue;
                  }
              }else{stoyanka=0;}
              
              let y0 = parseFloat(Global_DATA[i][ii-1][0].split(',')[0]);
              let x0 = parseFloat(Global_DATA[i][ii-1][0].split(',')[1]);
              let y1 = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
              let x1 = parseFloat(Global_DATA[i][ii][0].split(',')[1]);
              let y2 = parseFloat(Global_DATA[i][ii+1][0].split(',')[0]);
              let x2 = parseFloat(Global_DATA[i][ii+1][0].split(',')[1]);
  
              let point0 = turf.point([x0, y0]);
              let point1 = turf.point([x1, y1]);
              let point2 = turf.point([x2, y2]);
              let bearing0 = 0;
              let bearing1 = 0;
              if(wialon.util.Geometry.getDistance(y0,x0,y1,x1)>wialon.util.Geometry.getDistance(y1,x1,y2,x2)){
               bearing0 = turf.bearing(point0, point1);
               bearing1 = turf.bearing(point0, point2);
              }else{
               bearing0 = turf.bearing(point2, point1);
               bearing1 = turf.bearing(point2, point0);
              }
              
              
              if(Math.abs(bearing0-bearing1)<10 || Math.abs(bearing0-bearing1)>350){ 
                //L.polyline([[y0, x0],[y2, x2]], {color: 'red'}).addTo(map);
                if(sy==0){sy=y0;i0=ii-1}
                if(sx==0)sx=x0; 

              }else{
                //L.polyline([[y0, x0],[y2, x2]], {color: 'red'}).addTo(map);
                if(sy!=0 && wialon.util.Geometry.getDistance(sy,sx,y1,x1)>50){
                  if(ssy!=0 && wialon.util.Geometry.getDistance(ssy,ssx,y1,x1)<50){

                    let y100 = ((sy+y1)/2).toFixed(6);
                    let x100 = ((sx+x1)/2).toFixed(6);
                    
                    
                    
                    if(stroka.length>0){
                     let nnn = stroka[stroka.length-1];
                     let nn = 'роб <br>' + PointInField(y100,x100).split(' ')[0];
                     if( nn == 'роб <br>невідомо'){nn = 'роб <br>' + PointInField(y1,x1).split(' ')[0];}
                     if( nn == 'роб <br>невідомо'){nn = 'роб <br>' + PointInField(sy,sx).split(' ')[0];}
                     if(nnn!=nn){
                     stroka.push(nn);
                     if ($("#robviz_gif").is(":checked") && nn == 'роб <br>невідомо') {
                      if(probl.indexOf(y100)<0){
                        let markerrr = L.marker([y100,x100]).addTo(map);
                        let ln = L.polyline([[sy, sx],[y1, x1]], {color: '#55ff33'}).addTo(map);
                        markerrr.bindPopup(""+nametr+"");
                        zup_mark_data.push(markerrr);
                        zup_mark_data.push(ln);
                        probl+=y100;
                      }
                    
                     }
                     }
                     }else{
                      let nn = 'роб <br>' + PointInField(y100,x100).split(' ')[0];
                      if( nn == 'роб <br>невідомо'){nn = 'роб <br>' + PointInField(y1,x1).split(' ')[0];}
                      if( nn == 'роб <br>невідомо'){nn = 'роб <br>' + PointInField(sy,sx).split(' ')[0];}
                      stroka.push(nn);
                      if ($("#robviz_gif").is(":checked") && nn == 'роб <br>невідомо') {
                        if(probl.indexOf(y100)<0){
                          let markerrr = L.marker([y100,x100]).addTo(map);
                          let ln = L.polyline([[sy, sx],[y1, x1]], {color: '#55ff33'}).addTo(map);
                          markerrr.bindPopup(""+nametr+"");
                          zup_mark_data.push(markerrr);
                          zup_mark_data.push(ln);
                          probl+=y100;
                        }
                       }
                     }
                     kmx=0;
                     kmy=0;
                    //L.polyline([[sy, sx],[y1, x1]], {color: 'red'}).addTo(map);
                  }else{
                    if(kmx==0){kmx=sx;kmy=sy;}
                    if(wialon.util.Geometry.getDistance(kmy,kmx,y1,x1)>4000){
                    if(stroka.length>0){
                      if(stroka[stroka.length-1]!='пер'){
                        stroka.push('пер');
                      }
                      }else{
                         stroka.push('пер');
                        }
                      }
                    //L.polyline([[sy, sx],[y1, x1]], {color: '#55ff33'}).addTo(map);
                  }
                 
                  ssy=sy;
                  ssx=sx;
                  
                }
                sy=0;
                sx=0;
              }
    }

    if(stroka.length>0){
    
    
      let strr="";
     if(rows.length>0){
      for(let v = 0; v<rows.length; v++){
      if(rows[v].cells[0].textContent==nametr.split(' ')[0]+' '+nametr.split(' ')[1]+''+Global_DATA[i][Global_DATA[i].length-1][5].split(' ')[0]){
       let ind=stroka.length-(rows[v].cells.length-1);
    
       if(ind<=0){
       if(rows[v].cells[1].innerHTML!=stroka[stroka.length-1]){
       rows[v].cells[1].innerHTML=stroka[stroka.length-1];
       coll = "#98FB98";
        if(stroka[stroka.length-1]=="пер"){coll = "#FFFF00";}
        if(stroka[stroka.length-1]=="роб <br>невідомо"){coll = "#f8b1c0";}
        rows[v].cells[1].style.backgroundColor = coll;
       }
       }
       if(rows[v].cells[1].innerHTML!=stroka[rows[v].cells.length-2]){
        rows[v].cells[1].innerHTML=stroka[rows[v].cells.length-2];
        coll = "#98FB98";
         if(stroka[rows[v].cells.length-2]=="пер"){coll = "#FFFF00";}
         if(stroka[rows[v].cells.length-2]=="роб <br>невідомо"){coll = "#f8b1c0";}
         rows[v].cells[1].style.backgroundColor = coll;
        }
    
       for(let vv = ind-1; vv>=0; vv--){
        if(rows[v].cells[1].innerHTML!=stroka[stroka.length-1-vv]){
        rows[v].insertCell(1);
        rows[v].cells[1].innerHTML=stroka[stroka.length-1-vv];
        coll = "#98FB98";
        if(stroka[stroka.length-1-vv]=="пер"){coll = "#FFFF00";}
        if(stroka[stroka.length-1-vv]=="роб <br>невідомо"){coll = "#f8b1c0";}
        rows[v].cells[1].style.backgroundColor = coll;
        }  
       }
       break;
      }else{
        if(v==rows.length-1){ 
       for(let v = stroka.length-1; v>=0; v--){
         coll = "#98FB98";
         if(stroka[v]=="пер"){coll = "#FFFF00";}
         if(stroka[v]=="роб <br>невідомо"){coll = "#f8b1c0";}
         strr+= "<td bgcolor = '"+coll+"'>"+stroka[v]+"</td>";
         }
        $("#monitoring_table").append("<tr id="+id+"><td>"+nametr.split(' ')[0]+' '+nametr.split(' ')[1]+'<br>'+Global_DATA[i][Global_DATA[i].length-1][5].split(' ')[0]+"</td>"+strr+"</tr>");
           }
       }
      }
      }else{
      
      for(let v = stroka.length-1; v>=0; v--){
         coll = "#98FB98";
         if(stroka[v]=="пер"){coll = "#FFFF00";}
         if(stroka[v]=="роб <br>невідомо"){coll = "#f8b1c0";}
         strr+= "<td bgcolor = '"+coll+"'>"+stroka[v]+"</td>";
         }
        $("#monitoring_table").append("<tr id="+id+"><td>"+nametr.split(' ')[0]+' '+nametr.split(' ')[1]+'<br>'+Global_DATA[i][Global_DATA[i].length-1][5].split(' ')[0]+"</td>"+strr+"</tr>");
      }
     }
  }
}
$('#men7').css({'background':'#fffd7e'});
}





function write_jurnal(id,file_name,content,calbek){
  let remotee= wialon.core.Remote.getInstance(); 
  remotee.remoteCall('file/write',{'itemId':id,'storageType':1,'path':'//'+file_name,"content":content,"writeType":1,'contentType':0},function (error) {
    if (error) {msg(wialon.core.Errors.getErrorText(error));
    return;
    }else{
      msg("записано до журналу")
    calbek();
    return;
   }
}); 

}
function load_jurnal(id,file_name,calbek){
  let remotee= wialon.core.Remote.getInstance(); 
  let jurnal_data=[];
  remotee.remoteCall('file/read',{'itemId':id,'storageType':1,'path':'//'+file_name,'contentType':0},function (error,data) {
     if (error) {msg(wialon.core.Errors.getErrorText(error));
      return;
     }else{
      jurnal_data=data.content.split('||');
      calbek(jurnal_data);
      return;
    }
}); 
}
function update_jurnal(id,file_name,calbek){
  let remotee= wialon.core.Remote.getInstance(); 
  remotee.remoteCall('file/list',{'itemId':id,'storageType':1,'path':'/','mask':file_name,'recursive':false,'fullPath':false},function (error,data) { 
    if (error) {
      msg(wialon.core.Errors.getErrorText(error));
      return;
    }else{
      calbek(data[0].s);
     return;
    } 
});
}




let autorization ='';
let jurnal_size=0;
let jurnal_data=[];

function jurnal(obj,unit){
  if(obj==0){
    clearGEO();
    $('#jurnal').show();
    $('#jurnal_upd').show();
    $('#inftb').hide();
    $("#jurnal_name").text(""+unit.getName()+"");
    //let remotee= wialon.core.Remote.getInstance(); 
    //remotee.remoteCall('file/list',{'itemId':20233,'storageType':1,'path':'/','mask':'jurnal (3).txt','recursive':false,'fullPath':true},function (error,data) { if (error) {msg(wialon.core.Errors.getErrorText(error));}else{console.log(data);}});  
    //remotee.remoteCall('file/write',{'itemId':20233,'storageType':1,'path':'//jurnal.txt',"content":'helo||',"writeType":1,'contentType':0},function (error,data) {if (error) {msg(wialon.core.Errors.getErrorText(error));}else{console.log("write_done");}}); 
    //remotee.remoteCall('file/read',{'itemId':20233,'storageType':1,'path':'//jurnal.txt','contentType':0},function (error,data) { if (error) {msg(wialon.core.Errors.getErrorText(error));}else{console.log(data.content);}}); 
  }
  if(obj==1){
    $('#jurnal').show();
    $('#jurnal_upd').show();
    $('#inftb').show();
    $("#jurnal_name").text(""+unit.n+"");
  }
  jurnal_update();
}
function jurnal_update(){
  let tt = new Date(Date.parse($('#f').text())).toJSON().slice(0,10);
  $('#jurnal_time').val(tt);

  update_jurnal(20233,'jurnal.txt',function (data) { 
    let nam_js = $("#jurnal_name").text();
    if (data==jurnal_size){
      $("#jurnal_name_table").empty();
      load_jurnal(20233,'jurnal_delete.txt',function (data) {
        let unit_jr_data=[]; 
          dataLoop:for(let i = 1; i<jurnal_data.length; i++){
            for (v = 1; v < data.length; v++) {if (parseInt(data[v]) == i) continue dataLoop; } 
            let m=jurnal_data[i].split('|');
              if(m[1]==nam_js) unit_jr_data.push(m); 
          }
          unit_jr_data.sort(function(a,b){return a[0] - a[0]})
          let index=unit_jr_data.length-10;
          if(index<0)index=0;
          for(let i = index; i<unit_jr_data.length; i++){
            let d=new Date(parseInt(unit_jr_data[i][0])).toLocaleString("uk-UA", {year:'numeric',month:'numeric',day:'numeric'});
            let t=new Date(parseInt(unit_jr_data[i][4])).toLocaleString("uk-UA", {year:'numeric',month:'numeric',day:'numeric',hour:'numeric', minute: 'numeric', second: 'numeric'});
            $("#jurnal_name_table").append("<tr><td>"+d+"</td><td>"+unit_jr_data[i][2]+"</td><td>"+unit_jr_data[i][3]+"</td><td>"+t+"</td></tr>");
          }
      });
    }else{
      let size=data;
      load_jurnal(20233,'jurnal.txt',function (data) { 
        jurnal_data=data;
        jurnal_size=size;
        $("#jurnal_name_table").empty();
        load_jurnal(20233,'jurnal_delete.txt',function (data) { 
          let unit_jr_data=[]; 
          dataLoop:for(let i = 1; i<jurnal_data.length; i++){
            for (v = 1; v < data.length; v++) {if (parseInt(data[v]) == i) continue dataLoop; } 
            let m=jurnal_data[i].split('|');
              if(m[1]==nam_js) unit_jr_data.push(m); 
          }
          unit_jr_data.sort(function(a,b){return a[0] - a[0]})
          let index=unit_jr_data.length-10;
          if(index<0)index=0;
          for(let i = index; i<unit_jr_data.length; i++){
            let d=new Date(parseInt(unit_jr_data[i][0])).toLocaleString("uk-UA", {year:'numeric',month:'numeric',day:'numeric'});
            let t=new Date(parseInt(unit_jr_data[i][4])).toLocaleString("uk-UA", {year:'numeric',month:'numeric',day:'numeric',hour:'numeric', minute: 'numeric', second: 'numeric'});
            $("#jurnal_name_table").append("<tr><td>"+d+"</td><td>"+unit_jr_data[i][2]+"</td><td>"+unit_jr_data[i][3]+"</td><td>"+t+"</td></tr>");
          }
        });
        jurnal_online();
      });
    }
  });
}

$('#jurnal_write_buton').hide();
$('#polya_jurnal').hide();
$('.jurnal_autorization_buton').click(function() { 
  let ps = prompt('');
  if(ps==0000){
    autorization="Баришевський В.";
    msg(autorization);   
    $('#jurnal_autorization_buton').hide();
    $('#jurnal_write_buton').show();
  }
  if(ps==1111){
    autorization="Пальгуй С.";
    msg(autorization);
    $('.jurnal_autorization_buton').hide();
    $('#jurnal_write_buton').show();
    $('#polya_jurnal').show();

  }
});

$('#jurnal_write_buton').click(function() { 
let date=document.getElementById("jurnal_time").valueAsNumber;
let time=Date.now();
let name=$('#jurnal_name').text();;
let text=$('#jurnal_text').val();
let autor=autorization;
if(date && name && text && autor && autorization!=''){
  write_jurnal(20233,'jurnal.txt','||'+date+'|'+name+'|'+text+'|'+autor+'|'+time,function () { 
    jurnal_update();
  });
}
});


function jurnal_online(){
  let table_jur=document.getElementById('jurnal_online_tb');
  let index =0;
  if (table_jur.rows.length>1)index =  parseInt(table_jur.rows[table_jur.rows.length-1].cells[0].innerText)+1;
  update_jurnal(20233,'jurnal.txt',function (data) { 
    if (data==jurnal_size){ 
      if(index==0)index=jurnal_data.length-20;
      if(index<1)index=1;
        load_jurnal(20233,'jurnal_delete.txt',function (data) {

        for(let i = index; i<jurnal_data.length; i++){
        let m=jurnal_data[i].split('|');
        let d=new Date(parseInt(m[0])).toLocaleString("uk-UA", {year:'numeric',month:'numeric',day:'numeric'});
        let t=new Date(parseInt(m[4])).toLocaleString("uk-UA", {year:'numeric',month:'numeric',day:'numeric',hour:'numeric', minute: 'numeric', second: 'numeric'});
        if(m[3]==autorization){
          $("#jurnal_online_tb").append("<tr id="+m[1]+" bgcolor='#CEFFCE'><td>"+i+"</td><td>"+d+"</td><td>"+m[1]+"</td><td>"+m[2]+"</td><td>"+m[3]+"</td><td>"+t+"</td><td>&#10060</td></tr>");
        }else{
          $("#jurnal_online_tb").append("<tr id="+m[1]+" bgcolor='#CEFFCE'><td>"+i+"</td><td>"+d+"</td><td>"+m[1]+"</td><td>"+m[2]+"</td><td>"+m[3]+"</td><td>"+t+"</td></tr>");
        }
        $('#jurnal_online').scrollTop($('#jurnal_online').height());
      }
      let table_jr=document.getElementById('jurnal_online_tb');
            for(let i = 1; i<table_jr.rows.length; i++){
              for (v = 1; v < data.length; v++) {
                if (data[v] == table_jr.rows[i].cells[0].textContent){
                  table_jr.rows[i].cells[0].closest('tr').remove();
                  i--;
                  break;
                }
              } 
            }

    });
    }else{
      let size=data;
      load_jurnal(20233,'jurnal.txt',function (data) { 
        jurnal_data=data;
        jurnal_size=size;
        if(index==0)index=jurnal_data.length-20;
        if(index<1)index=1;
        load_jurnal(20233,'jurnal_delete.txt',function (data) { 
          for(let i = index; i<jurnal_data.length; i++){
          let m=jurnal_data[i].split('|');
          let d=new Date(parseInt(m[0])).toLocaleString("uk-UA", {year:'numeric',month:'numeric',day:'numeric'});
          let t=new Date(parseInt(m[4])).toLocaleString("uk-UA", {year:'numeric',month:'numeric',day:'numeric',hour:'numeric', minute: 'numeric', second: 'numeric'});
        if(m[3]==autorization){
          $("#jurnal_online_tb").append("<tr id="+m[1]+" bgcolor='#CEFFCE'><td>"+i+"</td><td>"+d+"</td><td>"+m[1]+"</td><td>"+m[2]+"</td><td>"+m[3]+"</td><td>"+t+"</td><td>&#10060</td></tr>");
        }else{
          $("#jurnal_online_tb").append("<tr id="+m[1]+" bgcolor='#CEFFCE'><td>"+i+"</td><td>"+d+"</td><td>"+m[1]+"</td><td>"+m[2]+"</td><td>"+m[3]+"</td><td>"+t+"</td></tr>");
        }
          $('#jurnal_online').scrollTop($('#jurnal_online').height());
        }
        let table_jr=document.getElementById('jurnal_online_tb');
        for(let i = 1; i<table_jr.rows.length; i++){
          
          for (v = 1; v < data.length; v++) {
            if (data[v] == table_jr.rows[i].cells[0].textContent){
              table_jr.rows[i].cells[0].closest('tr').remove();
              i--;
              break;
            }
          } 
        }
      });
        $('#men3').css({'background':'pink',  'box-shadow':'0px 0px 5px 5px rgba(255, 1, 1, 0.479)'});
        audio.play();
      });
    }
  });
}

$("#jurnal_online_tb").on("click", function (evt){
  let row = evt.target.parentNode;
  if(row.rowIndex>0){
if(evt.target.cellIndex==6){
    write_jurnal(20233,'jurnal_delete.txt','||'+row.cells[0].textContent,function () { 
      msg("запис видалено");
      jurnal_update();
      jurnal_online();
      return;
    });
}
  
    row.style.backgroundColor = 'transparent';
    let name = row.cells[2].textContent;
    for (let i = 0; i<geozones.length; i++){
      if(geozones[i].zone.n == name){
       let y=geozones[i]._bounds._northEast.lat;
       let x=geozones[i]._bounds._northEast.lng;
       map.setView([y,x+0.02],14);
       clearGEO();
       let point = geozones[i]._latlngs[0];
       let ramka=[];
       for (let i = 0; i < point.length; i++) {
       let lat =point[i].lat;
       let lng =point[i].lng;
       ramka.push([lat, lng]);
       if(i == point.length-1 && ramka[0]!=ramka[i])ramka.push(ramka[0]); 
       }
       let polilane = L.polyline(ramka, {color: 'blue'}).addTo(map);
       geo_layer.push(polilane);
         break;
      }
      }
     for (let i = 0; i<unitslist.length; i++){
      let nm=unitslist[i].getName();
      let id=unitslist[i].getId();
     if(nm == name){
      let y=unitslist[i].getPosition().y;
      let x=unitslist[i].getPosition().x;
      map.setView([y,x+0.04],14,{animate: false});
      $("#lis0").chosen().val(id);
      $("#lis0").trigger("chosen:updated");
      markerByUnit[id].openPopup();
        break;
     }
     }
     $("#jurnal_name").text(name);
     $('#inftb').hide();
     if($('#jurnal').is(':visible')){jurnal_update();}
  }
});



$("#jurnal_zvit_buton").on("click", function (){
  $("#unit_table").empty();
  let str =$('#jurnal_units').val().split(',');
  let fr =Date.parse($('#jurnal_time1').val());
  let to =Date.parse($('#jurnal_time2').val());
  update_jurnal(20233,'jurnal.txt',function (data) { 
    if (data==jurnal_size){ 
      load_jurnal(20233,'jurnal_delete.txt',function (data) { 
        dataLoop1: for(let i = 1; i<jurnal_data.length; i++){
          for (v = 1; v < data.length; v++) {if (parseInt(data[v]) == i) continue dataLoop1; } 
        let m=jurnal_data[i].split('|');
        let d=new Date(parseInt(m[0])).toLocaleString("uk-UA", {year:'numeric',month:'numeric',day:'numeric',hour:'numeric', minute: 'numeric', second: 'numeric'});
        let nametr = m[1];
        if(m[0]>fr && m[0]<to){
        if(str.lenght>0){

          for(let v = 0; v<str.length; v++){ 
            if(nametr.indexOf(str[v])<0)continue;
            $("#unit_table").append("<tr id="+m[1]+"><td>"+i+"</td><td>"+d+"</td><td>"+nametr+"</td><td>"+m[2]+"</td><td>"+m[3]+"</td></tr>");
            break;
               } 
             }else{
             $("#unit_table").append("<tr id="+m[1]+"><td>"+i+"</td><td>"+d+"</td><td>"+nametr+"</td><td>"+m[2]+"</td><td>"+m[3]+"</td></tr>");
            } 
          }
      }
    });
    }else{
      let size=data;
      load_jurnal(20233,'jurnal.txt',function (data) { 
        jurnal_data=data;
        jurnal_size=size;
        load_jurnal(20233,'jurnal_delete.txt',function (data) { 
          dataLoop1: for(let i = 1; i<jurnal_data.length; i++){
            for (v = 1; v < data.length; v++) {if (parseInt(data[v]) == i) continue dataLoop1; } 
          let m=jurnal_data[i].split('|');
          let d=new Date(parseInt(m[0])).toLocaleString("uk-UA", {year:'numeric',month:'numeric',day:'numeric'});
          let t=new Date(parseInt(m[4])).toLocaleString("uk-UA", {year:'numeric',month:'numeric',day:'numeric',hour:'numeric', minute: 'numeric', second: 'numeric'});
          let nametr = m[1];
          if(m[0]>fr && m[0]<to){
        if(str.lenght>0){
          for(let v = 0; v<str.length; v++){ 
            if(nametr.indexOf(str[v])<0)continue;
            $("#unit_table").append("<tr id="+m[1]+"><td>"+i+"</td><td>"+d+"</td><td>"+nametr+"</td><td>"+m[2]+"</td><td>"+m[3]+"</td><td>"+t+"</td></tr>");
            break;
          } 
        }else{
          $("#unit_table").append("<tr id="+m[1]+"><td>"+i+"</td><td>"+d+"</td><td>"+nametr+"</td><td>"+m[2]+"</td><td>"+m[3]+"</td><td>"+t+"</td></tr>");
        }
      }
        }
      });
      });
    }
  });
});






$('.zvit').hide();
$( "#vib_zvit" ).on( "change", function() {
  $('.leaflet-container').css('cursor','');
  let id='#'+'z'+this.value;
  $('.zvit').hide();
  $("#unit_table").empty();
  $(id).show();
  if(this.value=='z1'||this.value=='z2'|| this.value=='z3')$('.leaflet-container').css('cursor','crosshair');
  clearGEO(); 
  clearGarbage(garbage);
  clearGarbage(garbagepoly);
  clearGarbage(marshrutMarkers);
  let tt = new Date(Date.parse($('#f').text())).toJSON().slice(0,10);
  $('#polya_jurnal_time').val(tt);
} );


$("#fast_obr_poliv").on("click", function (){
  $('#map').css('width', '65%');
  $('#marrr').hide();
  $('#option').hide();
  $('#unit_info').show();
  $('#zupinki').hide();
  $('#logistika').hide();
  $('#monitoring').hide();
  clearGEO(); 
  $('#men3').css({'background':'#e9e9e9'});
  $('#men1').css({'background':'#e9e9e9'});
  $('#men4').css({'background':'#b2f5b4'});
  $('#men5').css({'background':'#e9e9e9'});
  $('#men6').css({'background':'#e9e9e9'});
  $('#men7').css({'background':'#e9e9e9'});
  clearGarbage(garbage);
  clearGarbage(garbagepoly);
  clearGarbage(marshrutMarkers);
  $("#unit_table").empty();
  $("#vib_zvit [value='z10']").attr("selected", "selected");
  $('.zvit').hide();
  $('#zz10').show();
  let tt = new Date(Date.parse($('#f').text())).toJSON().slice(0,10);
  $('#polya_jurnal_time').val(tt);
});


//========================LOGISTIKA===============================================================================
//========================LOGISTIKA===============================================================================
//========================LOGISTIKA==============================================================================

let stor=[];
let adresa=[];

let avto=[
['ВМ0229АF Свергунов Ю. Газель TT_B033','Шалигине',51.5711,34.1134],
['ВМ3454ЕЕ Полятикін П.П. ГАЗ 33021 Грузовой TT_B034','Шалигине',51.5748,34.1035],

['ВМ2559ВК Лукяненко О.М. Нива TT_B014','Слоут стан',51.7454,33.7983],
['ВМ4110АА Зіналієв А.С. Газель TT_B008','Слоут стан',51.7454,33.7983],

['ВМ4524АА Зборщик В.Б. Газель TT_B006','Слоут',51.7556,33.7608],
['ВМ5647ЕІ Зіналієв Е.А. ФОРД','Слоут',51.7539,33.7780],
['ВМ7912ЕІ Радченко О. Рено Duster','Слоут',51.7594,33.7922],
['ВМ7913ЕІ Абрамчук М. Рено Duster','Слоут',51.7599,33.7906],

['ВМ7914ЕІ Лук’яненко О.М. Рено Duster','Береза',51.7330,33.8609],

['ВМ5203ВВ Шкурат Є.А. Газель','ККЗ',51.5512,33.3495],
['ВМ5645ЕІ Черненко О.В. ФОРД','ККЗ',51.5512,33.3495],
['ВМ8607ЕН Яковенко Ю.О. ФОРД','ККЗ',51.5512,33.3495],
['ВМ8684ЕН Самусь О.А. Форд','ККЗ',51.5512,33.3495],
['ВМ8693ЕН Максименко С.М. Форд','ККЗ',51.5512,33.3495],

['ВМ1280СТ Інешин Ю.В. Газель','Кролевець',51.5606,33.4022],
['ВМ5629ЕІ Дубровін Р.В. ФОРД','Кролевець',51.5466,33.3913],
['ВМ5887EI Лубенець Автобус TT_B063','Кролевець',51.5578,33.3841],
['ВМ7925ЕІ Жабко В. Рено Duster','Кролевець',51.5405,33.3800],
['ВМ8610ЕН Рахматулін О.В ФОРД','Кролевець',51.5599,33.3501],
['ВМ8692ЕН Шепелюк В.Д. Форд','Кролевець',51.5625,33.3345],

['ВМ7922ЕІ Самойленко А. Рено Duster','Ярове',51.5254,33.5764],

['ВМ7921ЕІ Велес С.О. Рено Duster','Воргол',51.4386,33.6955],

['ВМ7915ЕІ Боженко О.М. Рено Duster','Локня',51.4843,33.5629],

['ВМ4632АА Газель Райгородок TT_B003','Райгородок ферма',51.6228,33.0935],

['ВМ1953ВС Чмир В.М. Газель','Райгородок',51.6264,33.0990],
['ВМ1988ВС Попок С.А. Газель','Райгородок',51.6264,33.0990],

['ВМ5607ЕІ Супрун В.М. ФОРД','Вишенки',51.6436,33.0671],

['ВМ7916ЕІ Кудін В.О. Рено Duster','Іваньків',51.7170,32.9839],



['ВМ2047ЕС механізатор Тищенко Путивль Нива B044','Резерв',51.3541,33.8998],
['ВМ1640АТ Нива TT_B011','Резерв',51.7454,33.7983],
['ВМ1641ВЕ Нива TT_B027','Резерв',51.7454,33.7983],
['ВМ9987СІ Нива TT_B046','Резерв',51.7454,33.7983],
['ВМ4466АО Нива','Резерв',51.7454,33.7983],
['ВМ2487СЕ Нива Шевроле','Резерв',51.5512,33.3495],
['ВМ5326ВМ Нива Шевроле TT_B069','Резерв',51.5512,33.3495],
['ВМ7393ВВ Абрамчук М.Нива TT_B039','Резерв',51.5512,33.3495],
['ВМ9595АІ Нива','Резерв',51.5512,33.3495],
['ВМ9708ВЕ Нива Шевроле','Резерв',51.5512,33.3495],
['ВМ3181ВН Самойленко А. Нива TT_B037','Резерв',51.5254,33.5764]
];

let  marshrut_data=[];
let  marshrut_probeg=0;
let  marshrut_vremya=0;
let  marshrut_point=[];
let  marshrut_garbage=[];
//=============Stvorenya marshruty====================================================
$('#log_unit_tb').hide();
$('#log_marh_tb').hide();
$('#marshrut_d').hide();
$('#log_control_tb').hide();
$('#log_cont').hide();
$('#log_time').hide();
$('#log_help').hide();
$('#adresy').hide();
$('#marshrut_text').hide();

$("#log_b3").on("click", function (){
  $('#log_b1').css({'background':'#e9e9e9'});
  $('#log_b2').css({'background':'#e9e9e9'});
  $('#log_b3').css({'background':'#b2f5b4'});
  $('#log_unit_tb').hide();
  $('#log_marh_tb').hide();
  $('#marshrut_d').hide();
  $('#log_control_tb').hide();
  $('#log_cont').hide();
  $('#log_time').hide();
  $('#log_help').hide();
  $('#adresy').show();
  $('#marshrut_text').hide();


});
$("#adresy_add").on("click", function (){
  let n=$('#adresy_name').val();
  let c =$('#adresy_coord').val();
  let r =$('#adresy_radius').val();
  if(n && c && r){
  write_jurnal(20233,'zony.txt','||'+c+'|'+r+'|'+n,function () { 
    audio.play();

    let y = parseFloat(c.split(',')[0]);
    let x = parseFloat(c.split(',')[1]);
    let rr = parseFloat(r);
    let poly = L.circle([y,x], {stroke: false, fillColor: '#0000FF', fillOpacity: 0.2,radius: rr}).bindTooltip(""+n+"",{permanent: true, opacity:0.7, direction: 'top'});



    lgeozoneee.addLayer(poly);
  });
}
});


$("#log_b1").on("click", function (){
  $('#log_b1').css({'background':'#b2f5b4'});
  $('#log_b2').css({'background':'#e9e9e9'});
  $('#log_b3').css({'background':'#e9e9e9'});
  $("#log_unit_tb").empty();
  $('#log_unit_tb').show();
  $('#log_marh_tb').show();
  $('#marshrut_d').show();
  $('#log_control_tb').hide();
  $('#log_cont').hide();
  $('#log_time').hide();
  $('#adresy').hide();
  $('#log_help').show();
  $('#marshrut_text').show();

  update_logistik_data(vibir_avto);
});
$("#log_b2").on("click", function (){
  $('#log_b2').css({'background':'#b2f5b4'});
  $('#log_b1').css({'background':'#e9e9e9'});
  $('#log_b3').css({'background':'#e9e9e9'});
  $('#log_unit_tb').hide();
  $('#log_marh_tb').hide();
  $('#marshrut_d').hide();
  $('#log_control_tb').show();
  $('#log_cont').hide();
  $('#adresy').hide();
  $('#log_time').show();
  $('#log_help').hide();
  $('#marshrut_text').hide();
  update_logistik_data(control_avto);
  marshrut_leyer_0.clearLayers();
  vsi_marshruty();
});

function marshrut(){
  marshrut_data=[];
  marshrut_point=[];
  marshrut_probeg=0;
  marshrut_vremya=0;
  clearGarbage(marshrut_garbage);
  update_rout(0,0,0);
}



//=============Dodavannya tocok knopki====================================================
$("#log_marh_tb").on("click", function (evt){
  let row = evt.target.parentNode;
  let ind = evt.target.cellIndex;
  //row.rowIndex
if(evt.target.innerText=='+'){
  
  var td = row.insertCell(ind+1);
      td.style.border = '1px solid black';
  var el = document.createElement('div');
      el.setAttribute('class', 'autocomplete');
  var el2 = document.createElement('div');
      el2.setAttribute('class', 'inp');
      el2.setAttribute('id', 'myInput'+ind+'');
      el2.setAttribute('type', 'text');
      el2.setAttribute('contenteditable', 'true');
      autocomplete(el2, adresa);
      el.appendChild(el2);
      td.appendChild(el);
          td = row.insertCell(ind+2);
          td.innerText=" - "
          td.style = 'font-size:14px; min-width: 15px; background: rgb(247, 161, 161); cursor:pointer; border: 1px solid black;';
          td = row.insertCell(ind+3);
          td.innerText=" + "
          td.style = 'font-size:14px; min-width: 15px; background: rgb(170, 248, 170);cursor:pointer';
          document.getElementById("log_marh_tb").rows[0].insertCell(ind+1);
        document.getElementById("log_marh_tb").rows[0].insertCell(ind+2);
        document.getElementById("log_marh_tb").rows[0].insertCell(ind+3);

  
}
if(evt.target.innerText=='-'){
  if (row.cells.length>3) {
    row.deleteCell(ind-1);
    row.deleteCell(ind-1);
    row.deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[0].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[0].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[0].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[0].cells[0].innerText=0;
   
    marshrut();
  }else{
    row.cells[ind-1].children[0].children[0].textContent="";
  }

}

    //row.style.backgroundColor = 'transparent';
  });


//=============vibir tochok====================================================
function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/

  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function(e) {
      var a, b, i, val = this.innerText;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.appendChild(a);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*check if the item starts with the same letters as the text field value:*/
        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
          /*execute a function when someone clicks on the item value (DIV element):*/
          b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              inp.innerText = this.getElementsByTagName("input")[0].value;
              /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
              closeAllLists();
              let id=inp.id.slice(7);
              id = parseInt(id)+3;
              if(document.getElementById("myInput"+id+"")){
              document.getElementById("myInput"+id+"").focus();
              }else{
                let row = document.getElementById("log_marh_tb").rows[1];
                let ind = row.cells.length-1;
                var td = row.insertCell(ind+1);
                    td.style.border = '1px solid black';
                var el = document.createElement('div');
                    el.setAttribute('class', 'autocomplete');
                var el2 = document.createElement('div');
                    el2.setAttribute('class', 'inp');
                    el2.setAttribute('id', 'myInput'+ind+'');
                    el2.setAttribute('type', 'text');
                    el2.setAttribute('contenteditable', 'true');
                    autocomplete(el2, adresa);
                    el.appendChild(el2);
                    td.appendChild(el);
                    el2.focus();
                    td = row.insertCell(ind+2);
                    td.innerText=" - "
                    td.style = 'font-size:14px; min-width: 15px; background: rgb(247, 161, 161); cursor:pointer; border: 1px solid black;';
                    td = row.insertCell(ind+3);
                    td.innerText=" + "
                    td.style = 'font-size:14px; min-width: 15px; background: rgb(170, 248, 170);cursor:pointer';
        document.getElementById("log_marh_tb").rows[0].insertCell(ind+1);
        document.getElementById("log_marh_tb").rows[0].insertCell(ind+2);
        document.getElementById("log_marh_tb").rows[0].insertCell(ind+3);
              }
              marshrut();
          });
          a.appendChild(b);
        }
      }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x){} x[currentFocus].click();
        }else{ 
          let id=inp.id.slice(7);
          id = parseInt(id)+3;
          if(document.getElementById("myInput"+id+"")){
          document.getElementById("myInput"+id+"").focus();
          }else{
            let row = document.getElementById("log_marh_tb").rows[1];
            let ind = row.cells.length-1;
            var td = row.insertCell(ind+1);
                td.style.border = '1px solid black';
            var el = document.createElement('div');
                el.setAttribute('class', 'autocomplete');
            var el2 = document.createElement('div');
                el2.setAttribute('class', 'inp');
                el2.setAttribute('id', 'myInput'+ind+'');
                el2.setAttribute('type', 'text');
                el2.setAttribute('contenteditable', 'true');
                autocomplete(el2, adresa);
                el.appendChild(el2);
                td.appendChild(el);
                el2.focus();
                td = row.insertCell(ind+2);
                td.innerText=" - "
                td.style = 'font-size:14px; min-width: 15px; background: rgb(247, 161, 161); cursor:pointer; border: 1px solid black;';
                td = row.insertCell(ind+3);
                td.innerText=" + "
                td.style = 'font-size:14px; min-width: 15px; background: rgb(170, 248, 170);cursor:pointer';
    document.getElementById("log_marh_tb").rows[0].insertCell(ind+1);
    document.getElementById("log_marh_tb").rows[0].insertCell(ind+2);
    document.getElementById("log_marh_tb").rows[0].insertCell(ind+3);
          }
          marshrut();}
       
              
      }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
      closeAllLists(e.target);
      });
}



/*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
autocomplete(document.getElementById("myInput-1"), adresa);


//=============Dodavannya tocok karat====================================================
function add_point(e){
let table=document.getElementById("log_marh_tb");
let roww = table.rows[1];
let y=(e.latlng.lat).toFixed(3);
let x=(e.latlng.lng).toFixed(3);
for (var i = 0; i < roww.cells.length; i+=3) {
  if (roww.cells[i].children[0].children[0].textContent) continue;
  roww.cells[i].children[0].children[0].textContent=','+y+','+x;
  marshrut();
  return;
}
let row = document.getElementById("log_marh_tb").rows[1];
let ind = row.cells.length-1;
var td = row.insertCell(ind+1);
    td.style.border = '1px solid black';
var el = document.createElement('div');
    el.setAttribute('class', 'autocomplete');
var el2 = document.createElement('div');
    el2.setAttribute('class', 'inp');
    el2.setAttribute('id', 'myInput'+ind+'');
    el2.setAttribute('type', 'text');
    el2.setAttribute('contenteditable', 'true');
    el2.textContent = ','+y+','+x;
    autocomplete(el2, adresa);
    el.appendChild(el2);
    td.appendChild(el);
    el2.focus();
    td = row.insertCell(ind+2);
    td.innerText=" - "
    td.style = 'font-size:14px; min-width: 15px; background: rgb(247, 161, 161); cursor:pointer; border: 1px solid black;';
    td = row.insertCell(ind+3);
    td.innerText=" + "
    td.style = 'font-size:14px; min-width: 15px; background: rgb(170, 248, 170);cursor:pointer';
        document.getElementById("log_marh_tb").rows[0].insertCell(ind+1);
        document.getElementById("log_marh_tb").rows[0].insertCell(ind+2);
        document.getElementById("log_marh_tb").rows[0].insertCell(ind+3);
        marshrut();

}
//=============Rozrahunok marshrutu====================================================
let frrr=0;
function update_rout(i,y,x){
  let table=document.getElementById("log_marh_tb");
  let row = table.rows[1];
  if(i>row.cells.length-1 && marshrut_point.length>1){
    if($('#log_unit_tb').is(':hidden')==false)  vibir_avto();
    return;
  }      
  let ay=y;
  let ax=x;
  let by=0;
  let bx=0;
  for(let ii=i;ii<row.cells.length;ii+=3){
    let text = row.cells[ii].children[0].children[0].textContent;
    if(text){
      if(text[0]==','){
       if(ay==0){
        ay=parseFloat(text.split(',')[1]);
        ax=parseFloat(text.split(',')[2]);
        frrr=600;
      }else{
        by=parseFloat(text.split(',')[1]);
        bx=parseFloat(text.split(',')[2]);
        routing (ay,ax,by,bx,600,ii+3,update_rout);
        return;
      }
      }else{
        for (let j = 0; j<stor.length; j++){
          if(text==stor[j][3]){
            if(ay==0){
              ay=stor[j][0];
              ax=stor[j][1];
              frrr= stor[j][2];
              update_rout(ii+3,ay,ax);
              return;
            }else{
              by=stor[j][0];
              bx=stor[j][1];
              routing (ay,ax,by,bx,stor[j][2],ii+3,update_rout);
              return;
            }
            break;
          }
          if(j ==stor.length-1){
            wialon.util.Gis.searchByString(text,0,1, function(code, data) {
              if (code) { msg(wialon.core.Errors.getErrorText(code)); return; } // exit if error code
              if (data) {
                if (data[0]){
                  if(ay==0){
                    ay=data[0].items[0].y;
                    ax=data[0].items[0].x;
                    frrr= 3000;
                    update_rout(ii+3,ay,ax);
                    return;
                  }else{
                    by=data[0].items[0].y;
                    bx=data[0].items[0].x;
                    routing (ay,ax,by,bx,3000,ii+3,update_rout);
                    return;
                  }
                 }
                 update_rout(ii+3,-1,-1);
              }});
              return;

          }
        }

      } 
    }else{update_rout(ii+3,-1,-1);}
    
  }

}


function routing (ay,ax,by,bx,r,i,calbek){
  clearGarbage(marshrut_garbage);
  let aay=ay;
  let aax=ax;
  if (marshrut_point.length>0){
    aay=marshrut_point[marshrut_point.length-1][0];
    aax=marshrut_point[marshrut_point.length-1][1];;
  }
  wialon.util.Gis.getRoute(aay,aax,by,bx,0, function(error, data) {
    if (error) { // error was happened
      msg(wialon.core.Errors.getErrorText(error));
      return;
    }
    if (data.status=="OK"){
      let line=[];
      //console.log(data)
      for (v = 0; v < data.points.length; v+=3) {
       line.push ([data.points[v].lat,data.points[v].lon]);
       } 
       marshrut_data.push(line);
       marshrut_probeg+=data.distance.value;
       marshrut_vremya+=data.duration.value;

       if (marshrut_point.length==0){
        marshrut_point.push([ay,ax,frrr]);
       }
       marshrut_point.push([by,bx,r]);
       if (i-3>0)document.getElementById("log_marh_tb").rows[0].cells[i-3].innerText=marshrut_point.length-1;
    }
    dataLoop: for (v = marshrut_point.length-1; v >=0; v--) {
      //let ll = L.circle([marshrut_point[v][0],marshrut_point[v][1]], { color: 'red', fillColor: 'red', fillOpacity: 0, radius: marshrut_point[v][2]}).addTo(map);
      //marshrut_garbage.push(ll);
      let y=marshrut_point[v][0];
      let x=marshrut_point[v][1];
      let n='';
      for (vv = v+1; vv <marshrut_point.length ; vv++) {
        let yy=marshrut_point[vv][0];
        let xx=marshrut_point[vv][1];
       if ( wialon.util.Geometry.getDistance(y, x, yy, xx)<100) {
        continue dataLoop;
       }
      }
      for (vvv = 0; vvv <v ; vvv++) {
        let yyy=marshrut_point[vvv][0];
        let xxx=marshrut_point[vvv][1];
       if ( wialon.util.Geometry.getDistance(y, x, yyy, xxx)<100) {
        n+=vvv+'-';
       }
      }
      n+=v+'';
      let tooltipp = L.tooltip([y,x], {content: ""+n+"",permanent: true, opacity:0.8, direction: 'bottom'}).addTo(map);
      marshrut_garbage.push(tooltipp);
      } 
    
    let l = L.polyline([marshrut_data], {color: 'blue',weight:10,opacity:0.3}).addTo(map);
    marshrut_garbage.push(l);
    

    let d = (marshrut_probeg/1000).toFixed(1);
    let t = (marshrut_vremya/60).toFixed();
    $('#marshrut_d').text(' пробіг маршрут - '+d + ' км  _________  час на маршруту - '+ t + ' хвилин');
    calbek(i,by,bx);
  });
  }
//=============dodavannya marshrutu do avto====================================================
let logistik_size=0;
let logistik_data=[];
function update_logistik_data(calbek){
  update_jurnal(20233,'MR-avto.txt',function (data) { 
    if (data==logistik_size){ 
      calbek();
      return;
    }else{
      let size=data;
      load_jurnal(20233,'MR-avto.txt',function (data) { 
        logistik_data=data;
        logistik_size=size;
        //console.log(logistik_data);
        calbek();
        return;
      });
    }
   
    
  });
}

let probeg_nedelya=true;
function vibir_avto(){
  if (marshrut_point.length<2)return;
  let d = (marshrut_probeg/1000).toFixed(1);
  let t = (marshrut_vremya/60).toFixed();
  var d1 = new Date();
  d1.setHours(0, 0, 0, 0);
  d1 =Date.parse(d1);
  var d0=new Date();
  d0.setHours(0, 0, 0, 0);
  d0.setDate(d0.getDate() - 1);
  d0 =Date.parse(d0);
  var d2=new Date();
  d2.setHours(0, 0, 0, 0);
  d2.setDate(d2.getDate() + 1);
  d2 =Date.parse(d2);
  var d3=new Date();
  d3.setHours(0, 0, 0, 0);
  d3.setDate(d3.getDate() + 2);
  d3 =Date.parse(d3);

 let nedelya = new Date();
 nedelya.setHours(0, 0, 0, 0);
 nedelya.setDate(nedelya.getDate() - 7);
 nedelya =Date.parse(nedelya);

 let spisok = '';

  $('#marshrut_d').text(' пробіг маршрут - '+d + ' км  _________  час на маршруту - '+ t + ' хвилин');
  $('#log_unit_tb').empty();
  $('#log_unit_tb').append("<tr><th>ТЗ</th><th>стоянка</th><th>пробіг <br> за тиждень</th><th>маршрути <br> сьогодні</th><th>відстань <br> до маршруту</th><th>маршрути <br>завтра</th><th>відстань <br> до маршруту</th><th></th></tr>");

  for (let j = 0; j<avto.length; j++){
    if(avto[j][1]=='Резерв'){
      $('#log_unit_tb').append("<tr><td>"+avto[j][0]+"</td><td>"+avto[j][1]+"</td><td>----</td><td>----</td><td>----</td><td>----</td><td>----</td></tr>");
      continue;
    }
    let status0=0;
    let status1=0;
    let status2=0;
    spisok+=avto[j][0]+',';
    for (let v = 1; v<logistik_data.length; v++){
      let m=logistik_data[v].split('|');
      if(m[1]==avto[j][0]){
        if(m[2]=='ремонт'){
          //if(m[0]<d1)status0=2;
          if(m[0]<d2)status1=2;
          if(m[0]<d3)status2=2;

        }else{
          if(m[2]=='готовий'){
           // if(m[0]<d1)status0=0;
            if(m[0]<d2)status1=0;
            if(m[0]<d3)status2=0;
          }else{
            if(m[2]=='видалено'){
              //if(m[0]>=d0 && m[0]<d1){status0=0;}
              if(m[0]>=d1 && m[0]<d2){status1=0;}
              if(m[0]>=d2 && m[0]<d3){status2=0;}
            }else{
              //if(m[0]>=d0 && m[0]<d1){status0=3;}
              if(m[0]>=d1 && m[0]<d2){status1=3;}
              if(m[0]>=d2 && m[0]<d3){status2=3;}
            }
          }
        }
      }
    }
//let bb0 ="";
let bb1 ="<button style = 'width: 100%;'>додати</button>";
let bb2 ="<button style = 'width: 100%;'>додати</button>";
//if(status0==3){bb0 ="<button style = 'background: rgb(170, 248, 170);width: 100%;' >маршрут</button>";}
if(status1==3){bb1 ="<button style = 'background: rgb(170, 248, 170);width: 100%;' >маршрут</button>";}
if(status2==3){bb2 ="<button style = 'background: rgb(170, 248, 170);width: 100%;' >маршрут</button>";}
//if(status0==2){bb0 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт</button>";}
if(status1==2){bb1 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт</button>";}
if(status2==2){bb2 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт</button>";}

    $('#log_unit_tb').append("<tr><td>"+avto[j][0]+"</td><td>"+avto[j][1]+"</td><td>----</td><td>"+bb1+"</td><td>----</td><td>"+bb2+" </td><td>----</td></tr>");
    let mark = unit_position(avto[j][0]);
    let id =unitsID[avto[j][0]];
    point_to_point_rote(marshrut_point[0][0],marshrut_point[0][1],avto[j][2],avto[j][3],j,6);
    if (mark) point_to_point(marshrut_point[0][0],marshrut_point[0][1],mark.y,mark.x,j,4);
    
  }
if (probeg_nedelya) {
  spisok =spisok.slice(0, -1);
  SendDataReportInCallback(nedelya/1000,d2/1000,spisok,zvit4,[],0,svod);
  probeg_nedelya=false;
}else{
  svod(marshrut_probeg_nedelya);
}

}

let marshrut_probeg_nedelya=[];
function svod(data){ 
  marshrut_probeg_nedelya=data;
  let tb = document.getElementById("log_unit_tb");
  for (let i = 1; i<tb.rows.length; i++){
    for (let j = 0; j<marshrut_probeg_nedelya.length; j++){
    if (tb.rows[i].cells[0].innerText==marshrut_probeg_nedelya[j][0][1]) {
      tb.rows[i].cells[2].innerText=marshrut_probeg_nedelya[j][1][1];
      break;
    }
  }
  }
 
}  


function unit_position(n){
  for(let i = 0; i<unitslist.length; i++){
    let namet = unitslist[i].getName();
    if (namet==n) {
      let pos=unitslist[i].getPosition();
      if(pos){
        return pos;
      }
    }
  }        
}
function point_to_point(ax,ay,bx,by,r,c){
  let d=(wialon.util.Geometry.getDistance(ax,ay,bx,by)/1000).toFixed(1);
  let tb = document.getElementById("log_unit_tb");
  tb.rows[r+1].cells[c].innerText=(parseFloat(d)).toFixed(1)+ ' км';
}
function point_to_point_rote(ax,ay,bx,by,r,c){
  let tb = document.getElementById("log_unit_tb");
    for  (let i = 0; i<r+1; i++){
      if (tb.rows[i].cells[1].innerText==tb.rows[r+1].cells[1].innerText && tb.rows[i].cells[c].innerText!='----') {
        tb.rows[r+1].cells[c].innerText=tb.rows[i].cells[c].innerText;
        break;
      }
      if (i==r) {
        wialon.util.Gis.getRoute(ax,ay,bx,by,0, function(error, data) {
          if (error) { // error was happened
            msg(wialon.core.Errors.getErrorText(error));
            return;
          }
          if (data.status=="OK"){
            let d= (data.distance.value/1000).toFixed(1);
            let t= (data.duration.value/60).toFixed();
            tb.rows[r+1].cells[c].innerText=(parseFloat(d)).toFixed(1)+ ' км';
          }
        });
      }
    }

}

$("#log_unit_tb").on("click", function (evt){
  let row = evt.target.parentNode.parentNode;
  if(row.rowIndex>0 && evt.target.innerText =='додати'){
if(evt.target.parentNode.cellIndex==5){
  let t=Date.now()+86400000;
  let n=row.cells[0].innerText;
  let m=','+avto[row.rowIndex-1][2]+','+avto[row.rowIndex-1][3];
  let coment = 'маршрут';
  if($('#marshrut_text').val())coment =$('#marshrut_text').val();
  let table=document.getElementById("log_marh_tb").rows[1];
  for(let i=0;i<table.cells.length;i+=3){
    let text = table.cells[i].children[0].children[0].textContent;
    if (text)  m+='//'+text;
  }
  m+='//'+','+avto[row.rowIndex-1][2]+','+avto[row.rowIndex-1][3];
    write_jurnal(20233,'MR-avto.txt','||'+t+'|'+n+'|'+m+'|'+coment,function () { 
      msg("маршрут додано");
      evt.target.style.background = "rgb(170, 248, 170)";
      evt.target.innerHTML = 'маршрут'
      update_logistik_data(control_avto);
      return;
    });

}
if(evt.target.parentNode.cellIndex==3){
  let t=Date.now();
  let n=row.cells[0].innerText;
  let m=','+avto[row.rowIndex-1][2]+','+avto[row.rowIndex-1][3];
  let coment = 'маршрут';
  if($('#marshrut_text').val())coment =$('#marshrut_text').val();
  let table=document.getElementById("log_marh_tb").rows[1];
  for(let i=0;i<table.cells.length;i+=3){
    let text = table.cells[i].children[0].children[0].textContent;
    if (text)  m+='//'+text;
  }
  m+='//'+','+avto[row.rowIndex-1][2]+','+avto[row.rowIndex-1][3];
    write_jurnal(20233,'MR-avto.txt','||'+t+'|'+n+'|'+m+'|'+coment,function () { 
      msg("маршрут додано");
      evt.target.style.background = "rgb(170, 248, 170)";
      evt.target.innerHTML = 'маршрут'
      update_logistik_data(control_avto);
      return;
    });

}

}
let name = evt.target.parentNode.cells[0].innerText;

     for (let i = 0; i<unitslist.length; i++){
      let nm=unitslist[i].getName();
      let id=unitslist[i].getId();
     if(nm == name){
      let y=unitslist[i].getPosition().y;
      let x=unitslist[i].getPosition().x;
      map.setView([y,x+0.5],10,{animate: false});
      $("#lis0").chosen().val(id);
      $("#lis0").trigger("chosen:updated");
      markerByUnit[id].openPopup();
      layers[0]=0;
      show_track();
        break;
     }
     }

});
//=============controluvannya marshrutu ====================================================
function control_avto(){
   let control_date = document.getElementById("log_time_inp").valueAsNumber;
   let now_date = new Date();
   now_date.setHours(0, 0, 0, 0);
   now_date =Date.parse(now_date);

  let d_2 = control_date+86400000*2;
  let d_1 = control_date+86400000;
  let d0 =  control_date;
  let d1 =  control_date-86400000;
  let d2 =  control_date-86400000*2;
 

  let d_11 =new Date(d_1).toJSON().slice(0,10);
  let d00 =new Date(d0).toJSON().slice(0,10);
  let d11 =new Date(d1).toJSON().slice(0,10);
  let d22 =new Date(d2).toJSON().slice(0,10);

  $('#log_control_tb').empty();
  $('#log_control_tb').append("<tr><th>ТЗ</th><th>"+d22+"</th><th>"+d11+"</th><th>"+d00+"</th><th>"+d_11+"</th>></tr>");

  for (let j = 0; j<avto.length; j++){
    if(avto[j][1]=='Резерв'){
      $('#log_control_tb').append("<tr><td>"+avto[j][0]+"</td><td>----</td><td>----</td><td>----</td><td>----</td></tr>");
      continue;
    }
    let status0=0;
    let status1=0;
    let status2=0;
    let status3=0;
    let name_buton0='маршрут';
    let name_buton1='маршрут';
    let name_buton2='маршрут';
    let name_buton3='маршрут';
    for (let v = 1; v<logistik_data.length; v++){
      let m=logistik_data[v].split('|');
      if(m[1]==avto[j][0]){
        name_buton=m[3];
        if(m[2]=='ремонт'){
          if(m[0]<d1)status0=2;
          if(m[0]<d0)status1=2;
          if(m[0]<d_1)status2=2;
          if(m[0]<d_2)status3=2;
        }else{
          if(m[2]=='готовий'){
            if(m[0]<d1)status0=0;
            if(m[0]<d0)status1=0;
            if(m[0]<d_1)status2=0;
            if(m[0]<d_2)status3=0;
          }else{
            if(m[2]=='видалено'){
              if(m[0]>=d2 && m[0]<d1){status0=0;}
              if(m[0]>=d1 && m[0]<d0){status1=0;}
              if(m[0]>=d0 && m[0]<d_1){status2=0;}
              if(m[0]>=d_1 && m[0]<d_2){status3=0;}
            }else{
              if(m[0]>=d2 && m[0]<d1){status0=3; name_buton0=m[3];}
              if(m[0]>=d1 && m[0]<d0){status1=3; name_buton1=m[3];}
              if(m[0]>=d0 && m[0]<d_1){status2=3; name_buton2=m[3];}
              if(m[0]>=d_1 && m[0]<d_2){status3=3; name_buton3=m[3];}
            }
          }
        }
      }
    }
   if (name_buton0==undefined)name_buton0='маршрут';
   if (name_buton1==undefined)name_buton1='маршрут';
   if (name_buton2==undefined)name_buton2='маршрут';
   if (name_buton3==undefined)name_buton3='маршрут';
let bb0 ="<button style = 'width: 100%;' >на ремонт</button>";
if(now_date>d2)bb0 ="";
let bb1 ="<button style = 'width: 100%;' >на ремонт</button>";
if(now_date>d1)bb1 ="";
let bb2 ="<button style = 'width: 100%;' >на ремонт</button>";
if(now_date>d0)bb2 ="";
let bb3 ="<button style = 'width: 100%;' >на ремонт</button>";
if(now_date>d_1)bb3 ="";
if(status0==3){bb0 ="<button style = 'background: rgb(170, 248, 170);width: 100%;' >"+name_buton0+"</button>";}
if(status1==3){bb1 ="<button style = 'background: rgb(170, 248, 170);width: 100%;' >"+name_buton1+"</button>";}
if(status2==3){bb2 ="<button style = 'background: rgb(170, 248, 170);width: 100%;' >"+name_buton2+"</button>";}
if(status3==3){bb3 ="<button style = 'background: rgb(170, 248, 170);width: 100%;' >"+name_buton3+"</button>";}
if(status0==2){
  bb0 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт-зняти</button>";
  if(now_date>d2) bb0 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт</button>";
}
if(status1==2){
  bb1 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт-зняти</button>";
  if(now_date>d1) bb1 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт</button>";
}
if(status2==2){
  bb2 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт-зняти</button>";
  if(now_date>d0) bb2 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт</button>";
}
if(status3==2){
  bb3 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт-зняти</button>";
  if(now_date>d_1) bb3 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт</button>";
}

    $('#log_control_tb').append("<tr><td>"+avto[j][0]+"</td><td>"+bb0+"</td><td>"+bb1+"</td><td>"+bb2+"</td><td>"+bb3+"</td></tr>");
  } 
}

$("#log_control_tb").on("click", function (evt){
  let tb = evt.target.parentNode.parentNode.parentNode;
  let row = evt.target.parentNode.parentNode;
  if(row.rowIndex>0 && evt.target.innerText =='на ремонт'){
  let t=Date.parse(tb.rows[0].cells[evt.target.parentNode.cellIndex].innerText);
  let n=row.cells[0].innerText;
  let m='ремонт';
    write_jurnal(20233,'MR-avto.txt','||'+t+'|'+n+'|'+m,function () { 
      msg("ремонт додано");
      evt.target.style = 'background: rgb(247, 161, 161);width: 100%;';
      evt.target.innerText = "ремонт-зняти";
      update_logistik_data(control_avto);
      return;
    });

}

if(row.rowIndex>0 && evt.target.innerText =='ремонт-зняти'){
  let t=Date.parse(tb.rows[0].cells[evt.target.parentNode.cellIndex].innerText);
  let n=row.cells[0].innerText;
  let m='готовий';
    write_jurnal(20233,'MR-avto.txt','||'+t+'|'+n+'|'+m,function () { 
      msg("знято з ремонту додано");
      evt.target.style = 'background: ;width: 100%;';
      evt.target.innerText = "на ремонт";
      update_logistik_data(control_avto);
      return;
    });

}
if(row.rowIndex>0 && evt.target.innerText !='ремонт-зняти' &&  evt.target.innerText !='на ремонт' &&  evt.target.innerText !='ремонт'){
  $('#log_marh_tb').show();
  $('#log_cont').show();
  $('#marshrut_d').show();
  $('#marshrut_text').show();
  let t=Date.parse(tb.rows[0].cells[evt.target.parentNode.cellIndex].innerText);
  let n=row.cells[0].innerText;
  $('#cont_unit').text(n);
  $('#cont_time').text(tb.rows[0].cells[evt.target.parentNode.cellIndex].innerText);
  $('#marshrut_text').val('');

  for (let v = 1; v<logistik_data.length; v++){
    let m=logistik_data[v].split('|');
    if(m[1]==n && m[0]>=t && m[0]<t+86400000){
      if(m[2]=='ремонт')continue;
      if(m[2]=='готовий')continue;
     $('#marshrut_text').val(m[3]);
   let dat =m[2].split('//');
   $('#log_marh_tb').empty();
   $('#log_marh_tb').append("<tr></tr><tr></tr>")
   let row = document.getElementById("log_marh_tb").rows[1];
          for (let i = 0; i<dat.length; i++){
   
            let ind = row.cells.length-1;
            var td = row.insertCell(ind+1);
                td.style.border = '1px solid black';
            var el = document.createElement('div');
                el.setAttribute('class', 'autocomplete');
            var el2 = document.createElement('div');
                el2.setAttribute('class', 'inp');
                el2.setAttribute('id', 'myInput'+ind+'');
                el2.setAttribute('type', 'text');
                el2.setAttribute('contenteditable', 'true');
                el2.textContent = dat[i];
                autocomplete(el2, adresa);
                el.appendChild(el2);
                td.appendChild(el);
                td = row.insertCell(ind+2);
                td.innerText=" - "
                td.style = 'font-size:14px; min-width: 15px; background: rgb(247, 161, 161); cursor:pointer; border: 1px solid black;';
                td = row.insertCell(ind+3);
                td.innerText=" + "
                td.style = 'font-size:14px; min-width: 15px; background: rgb(170, 248, 170);cursor:pointer';
                    document.getElementById("log_marh_tb").rows[0].insertCell(ind+1);
                    document.getElementById("log_marh_tb").rows[0].insertCell(ind+2);
                    document.getElementById("log_marh_tb").rows[0].insertCell(ind+3);  
                       
          }
    }
  }
  marshrut();  
}

let name = evt.target.parentNode;
if(name.cells){
  name = evt.target.parentNode.cells[0].innerText;
}else{
  name = evt.target.parentNode.parentNode.cells[0].innerText;
}


     for (let i = 0; i<unitslist.length; i++){
      let nm=unitslist[i].getName();
      let id=unitslist[i].getId();
     if(nm == name){
      let y=unitslist[i].getPosition().y;
      let x=unitslist[i].getPosition().x;
      map.setView([y,x+0.5],10,{animate: false});
      $("#lis0").chosen().val(id);
      $("#lis0").trigger("chosen:updated");
      markerByUnit[id].openPopup();
      layers[0]=0;
      show_track();
        break;
     }
     }
});

$("#cont_b1").on("click", function (){
  let t=Date.parse($('#cont_time').text());
  let n=$('#cont_unit').text();
  let coment = 'маршрут';
  if($('#marshrut_text').val())coment =$('#marshrut_text').val();
  let mm='';
  let table=document.getElementById("log_marh_tb").rows[1];
  for(let i=0;i<table.cells.length;i+=3){
    let text = table.cells[i].children[0].children[0].textContent;
    if (mm=='') {
      if (text)  mm+=text;
    }else{
      if (text)  mm+='//'+text;
    }
    
  }
    write_jurnal(20233,'MR-avto.txt','||'+t+'|'+n+'|'+mm+'|'+coment,function () { 
      msg("маршрут додано");
      update_logistik_data(control_avto);
      return;
    });
  
  return;
});
$("#cont_b2").on("click", function (){
  let t=Date.parse($('#cont_time').text());
  let n=$('#cont_unit').text();
  let mm='видалено';
    write_jurnal(20233,'MR-avto.txt','||'+t+'|'+n+'|'+mm,function () { 
      msg("маршрут додано");
      update_logistik_data(control_avto);
      return;
    });
  
  return;
});

$("#cont_b3").on("click", function (){
  let t=$('#cont_time').text();
  let t2=Date.parse($('#cont_time').text())+86400000;
  t2 = new Date(t2);
  let n=$('#cont_unit').text();
  let id=unitsID[n];
  $("#lis0").chosen().val(id);     
  $("#lis0").trigger("chosen:updated");
  layers[0]=0;
  show_track(t,t2);
  SendDataReportInCallback(Date.parse(t)/1000,Date.parse(t2)/1000,n,zvit2,[],0,logistik_zvit);
  return;
});

function logistik_zvit(data){
let v_marsh=0;
var probeg=0;

for(let v=0;v<marshrut_data.length;v++){
  dataLoop:for(let j=5;j<marshrut_data[v].length;j+=5){
    let y = marshrut_data[v][j-5][0];
    let x = marshrut_data[v][j-5][1];
    let yy = marshrut_data[v][j][0];
    let xx = marshrut_data[v][j][1];
    let dis = wialon.util.Geometry.getDistance(y, x, yy, xx);
    for(let i=1;i<data[0].length;i++){
      if(!data[0][i][0])continue;
      let yyy = parseFloat(data[0][i][0].split(',')[0]);
      let xxx = parseFloat(data[0][i][0].split(',')[1]);
      if (wialon.util.Geometry.getDistance(yy, xx, yyy, xxx)<500) {
        v_marsh+=dis;
        //L.polyline([[y,x],[yy,xx]], {color: 'blue',weight:5,opacity:1}).addTo(map);
        continue dataLoop;
      }
    }
  } 
 }

for(let i=2;i<data[0].length;i++){
    if(!data[0][i][0])continue;
    if(!data[0][i-1][0])continue;
     let y = parseFloat(data[0][i-1][0].split(',')[0]);
     let x = parseFloat(data[0][i-1][0].split(',')[1]);

     let yy = parseFloat(data[0][i][0].split(',')[0]);
     let xx = parseFloat(data[0][i][0].split(',')[1]);

     let dis = wialon.util.Geometry.getDistance(y, x, yy, xx);
     probeg+=dis;

  }
 
  $('#marshrut_d').text("пробіг маршрут - "+(marshrut_probeg/1000).toFixed()+" км  _________   пробіг по маршруту - "+(v_marsh/1000).toFixed()+" км   _________  загальний пробіг - "+(probeg/1000).toFixed()+"км");

}


function vsi_marshruty(){
  let t = new Date();
  t.setHours(0, 0, 0, 0);
  t =Date.parse(t);
  let n=[];
  let povtor=false;
  for (let v = 1; v<logistik_data.length; v++){
    let hue = Math.floor(Math.random() * 360);
    let saturation = 100;
    let lightness = 45;
    let color=  `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    let m=logistik_data[v].split('|');
    if(m[0]>=t+86400000 && m[0]<t+172800000){
      povtor=false;
      n.forEach((element) => {if(m[1].indexOf(element)>=0){povtor=true;}});
      n.push(m[1]);
      if(povtor==true)continue;
      if(m[2]=='ремонт')continue;
      if(m[2]=='готовий')continue;
      if(m[2]=='видалено')continue;
      
      let marshrut =m[2].split('//');
   
      for (let i = 0; i<marshrut.length-1; i++){
        let a=marshrut[i];
        let b=marshrut[i+1];
        vsi_marshruty_name_to_point (a,b,0,0,m[1],color);
      }
    }
  }
}


function vsi_marshruty_visual (ay,ax,by,bx,name,color){
  wialon.util.Gis.getRoute(ay,ax,by,bx,0, function(error, data) {
    if (error) { // error was happened
      msg(wialon.core.Errors.getErrorText(error));
      return;
    }
    if (data.status=="OK"){
      let line=[];
      for (v = 0; v < data.points.length; v+=5) {
       line.push ([data.points[v].lat,data.points[v].lon]);
       } 
    let l = L.polyline([line], {color: color,weight:5,opacity:0.3}).bindTooltip(name,{opacity:0.8,sticky:true});
    marshrut_leyer_0.addLayer(l);
      }
  });
  }

  function vsi_marshruty_name_to_point (a,b,y,x,name,color){
    let text='';
    if (y==0) {text=a;}else{text=b;}
    let yy=0;
    let xx=0;
    if(text){
      if(text[0]==','){
        yy=parseFloat(text.split(',')[1]);
        xx=parseFloat(text.split(',')[2]);
        if (y==0) {
          vsi_marshruty_name_to_point (a,b,yy,xx,name,color)
        }else{
          vsi_marshruty_visual (y,x,yy,xx,name,color);
        }
        return;
      }else{
        for (let j = 0; j<stor.length; j++){
          if(text==stor[j][3]){
              yy=stor[j][0];
              xx=stor[j][1];
              if (y==0) {
                vsi_marshruty_name_to_point (a,b,yy,xx,name,color)
              }else{
                vsi_marshruty_visual (y,x,yy,xx,name,color);
              }
              return;
              break;
          }
          if(j ==stor.length-1){
            wialon.util.Gis.searchByString(text,0,1, function(code, data) {
              if (code) { msg(wialon.core.Errors.getErrorText(code)); return; } // exit if error code
              if (data) {
                if (data[0]){
                    yy=data[0].items[0].y;
                    xx=data[0].items[0].x;
                    if (y==0) {
                      vsi_marshruty_name_to_point (a,b,yy,xx,name,color)
                    }else{
                      vsi_marshruty_visual (y,x,yy,xx,name,color);
                    }
                    return;
                 }
              }});
              return;

          }
        }

      } 
    }
    }



  
  
