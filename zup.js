
var TOKEN = '0999946a10477f4854a9e6f27fcbe8424E7222985DA6B8C3366AABB4B94147D6C5BAE69F';

// global variables
var map, marker,unitslist = [],unitslistID = [],allunits = [],rest_units = [],marshruts = [],zup = [], unitMarkers = [], markerByUnit = {},tile_layer, layers = {},marshrutMarkers = [],unitsID = {},Vibranaya_zona,temp_layer=[],trailers={},drivers={};
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

let kof = 1.0038; // TURF corection



// for refreshing
var currentPos = null, currentUnit = null;

var isUIActive = true;


var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds

var from111 = new Date().toJSON().slice(0,11) + '00:00';
var from222 = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -8);


$('#vchora').click(function() { 
   from111 = (new Date(Date.now() - tzoffset-86400000)).toISOString().slice(0, -13)+ '00:00';
   from222 = (new Date(Date.now() - tzoffset-86400000)).toISOString().slice(0, -13)+ '23:59';
   $('#fromtime1').val(from111);
   $('#fromtime2').val(from222);
   from111=0;

});


$('#fromtime1').val(from111);
$('#fromtime2').val(from222);
$('#log_time_inp').val(new Date().toJSON().slice(0,10));
$('#track_time1').val(from111);
$('#track_time2').val(from222);




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
  unitslistID[unit.getId()] = unit;
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
  var res_flags = wialon.item.Item.dataFlag.base | wialon.item.Resource.dataFlag.reports | wialon.item.Resource.dataFlag.zones | wialon.item.Resource.dataFlag.zoneGroups | wialon.item.Resource.dataFlag.trailers | wialon.item.Resource.dataFlag.drivers;
 
	var remote= wialon.core.Remote.getInstance();
  remote.remoteCall('render/set_locale',{"tzOffset":7200,"language":'ru',"formatDate":'%Y-%m-%E %H:%M:%S'});
  wialon.util.Gis.geocodingParams.flags =1490747392;//{flags: "1255211008", city_radius: "10", dist_from_unit: "5", txt_dist: "km from"};
	session.loadLibrary("resourceZones"); // load Geofences Library 
  session.loadLibrary("resourceReports"); // load Reports Library
  session.loadLibrary("resourceZoneGroups"); // load Reports Library
  session.loadLibrary("resourceDrivers");
  session.loadLibrary("resourceTrailers"); 
  
 

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
         if(templ[i].n=="яx001") {zvit1=templ[i].id; msg('звіт зливи      1/4 завантажено');}
         if(templ[i].n=="яx002") {zvit2=templ[i].id; msg('звіт трасування 2/4 завантажено');}
         if(templ[i].n=="яx003") {zvit3=templ[i].id; msg('звіт зупинки    3/4 завантажено');}
         if(templ[i].n=="яx004") {zvit4=templ[i].id; msg('звіт підсумок   4/4 завантажено');}
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
let unitsgrup = {};
let IDzonacord=[];
let lgeozoneee;
let activ_zone=0;
let marshrut_leyer_0;
let polya_lablse = [];
function initUIData() {
  var session = wialon.core.Session.getInstance();
  var resource = wialon.core.Session.getInstance().getItem(20030); //26227 - Gluhiv 20030 "11_ККЗ"
  drivers= resource.getDrivers();
  trailers = resource.getTrailers();
    let gzgroop = resource.getZonesGroups();
  resource.getZonesData(null,0x19, function(code, geofences) {
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
           var geozona =  L.polygon([cord], {color: '#FF00FF', stroke: true,weight: 1, opacity: 0.2, fillOpacity: 0.5, fillColor: color});
          // geozona.bindPopup(zone.n);
           geozona.bindTooltip(zone.n +'<br />'+(zone.ar/10000).toFixed(1)+'га <br />'+zonegr,{opacity:0.8,sticky:true});
           geozona.zone = zone;
           geozona.gr = zonegr;
           geozones.push(geozona);
           $('#geomodul_field_lis').append($('<option>').text(zone.n).val(zone.n));
           $('#lis0').append($('<option>').text(zone.n).val("поле_"+zone.n));
           
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
              resource.getZonesData(null,0x19, function(code, geofences) {
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
           

             
              
               if ($('#geomodul').is(':hidden')==false){
                if($('#name_pole').text()!=Vibranaya_zona.n){
                  $('#obrobka').empty();
                  $('#obrobkatehnika').empty();
                }
                  $('#getary_pole').text(Area_Field_Name(Vibranaya_zona.n));
                  $('#grup_pole').text(e.target.gr);
                  $('#name_pole').text(Vibranaya_zona.n);
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
             
                  Naryady_start();
               //console.log(turf.area( turf.polygon([geozonepointTurf]))*1.0038);
               // console.log(turf.area( turf.polygon([geozonepointTurf])));
               // console.log(e.target.zone.ar);
               }else{
                let m =L.marker(e.latlng,{
                  clickable: true,
                  draggable: true,
                  icon: L.divIcon({
                    iconSize: "auto",
                    iconAnchor: [25, 8],
                    className: 'my-labels',
                    html: "<div><nobr>"+e.target.zone.n+"</div>",
                  })
                }).addTo(map);
                zup_mark_data.push(m);
               }


        
          });

      }
      $("#lis0").trigger("chosen:updated"); 
      let lgeozone = L.layerGroup(geozones);
      layerControl.addOverlay(lgeozone, "Геозони");

   
      let poly_color = Math.floor(Math.random() * 360);

          
      for (var key in gzgroop) {
        let point=[];
        if(gzgroop[key].n[0]!='*' && gzgroop[key].n[0]!='#'){
        gzgroop[key].zns.forEach(function(item1) { if(IDzonacord[item1]){IDzonacord[item1].forEach(function(item2) {point.push(turf.point([item2[1],item2[0]]));});}});
        let points = turf.featureCollection(point);
        let hull = turf.convex(points);
        if(hull){
          poly_color += 60+Math.floor(Math.random() * 30);
          let scaledPoly = turf.transformScale(hull, 1.1);
          let poly = L.geoJSON(scaledPoly,{color: `hsl(${poly_color}, ${100}%, ${45}%)`, fillColor: `hsl(${poly_color}, ${100}%, ${45}%)`, fillOpacity: 0.3,weight:2}).bindTooltip(gzgroop[key].n);
          geozonesgrup.push(poly);
        }
        
        }
      }

    
       let lgeozonee = L.layerGroup(geozonesgrup);
      layerControl.addOverlay(lgeozonee, "Регіони");
    


      load_jurnal(20233,'zony.txt',function (data) { 
        let log_zone=[];
        let log_zone_del=[];

        dataLoop: for(let i = data.length-1; i>0; i--){
          let m=data[i].split('|');
          let y = parseFloat(m[0].split(',')[0]);
          let x = parseFloat(m[0].split(',')[1]);
          let r = parseFloat(m[1]);
          let s =m[3];
          if (m[3]=='false') {
            log_zone_del.push([y,x,m[1],m[2]]);
          }else{
           
            for(let ii = 0; ii<log_zone_del.length; ii++){
              if (log_zone_del[ii][0]==y && log_zone_del[ii][1]==x && log_zone_del[ii][2]==m[1]&& log_zone_del[ii][3]==m[2]){continue dataLoop;}
            }
            //console.log('||'+m[0]+'|'+m[1]+'|'+m[2]+'|'+m[3]+'\n');
              let poly = L.circle([y,x], {stroke: false, fillColor: '#0000FF', fillOpacity: 0.2,radius: r}).bindTooltip(""+m[2]+"",{permanent: true, opacity:0.7, direction: 'top'});
              poly.on('click', function(e) {
                $('#adresy_name').val(e.target._tooltip._content);
                $('#adresy_coord').val(e.target._latlng.lat+','+e.target._latlng.lng);
                $('#adresy_radius').val(e.target.options.radius);
                activ_zone=e.target;
                clearGEO();
                let y = parseFloat(e.target._latlng.lat);
                let x = parseFloat(e.target._latlng.lng);
                let rr = parseFloat(e.target.options.radius);
                let cr = L.circle([y,x], {stroke: true,radius: rr, color: 'blue'}).addTo(map);
                   geo_layer.push(cr);
            
                });
              log_zone.push(poly);
              stor.push([y,x,r,m[2]]);
              adresa.push(m[2]);
              
          }
          
          }
          lgeozoneee = L.layerGroup(log_zone);
          layerControl.addOverlay(lgeozoneee, "Логістика");
    });

    $("#geomodul_field_lis").trigger("chosen:updated");
  });
  avto=[];
  load_jurnal(20233,'MR-avto-reestr.txt',function (data) { 
    $('#transport_logistik_tb').empty();
    $('#transport_logistik_tb').append("<tr><td><b>НОМЕР</b></td><td><b>ВОДІЙ</b></td><td><b>ДОВІЛЬНІ ДАНІ</b></td><td><b>СТОЯНКА</b></td><td><b>КООРДИНАТИ</b></td></tr>");
    for(let i = 1; i<data.length; i++){
      let m=data[i].split('|');
      $('#transport_logistik_tb').append("<tr><td contenteditable='true'>"+m[0]+"</td contenteditable='true'><td contenteditable='true'><b>"+m[1]+"</b></td><td contenteditable='true'>"+m[2]+"</td><td contenteditable='true'>"+m[3]+"</td><td contenteditable='true'>"+m[4]+"</td></tr>");
      if(m[0]!="----"){
        avto.push([m[0]+' <b>'+m[1]+'</b>_'+m[2],m[3],parseFloat(m[4].split(',')[0]),parseFloat(m[4].split(',')[1])]);
      }     
    }
});



load_jurnal(20233,'Pasajiry.txt',function (data) { 
  for(let i = 1; i<data.length; i++){
    let m=data[i].split('|');
    mehanizator_adresa.push([m[0],m[1],m[2],parseFloat(m[3].split(',')[0]),parseFloat(m[3].split(',')[1])]);
    mehan.push(m[0]);
    //L.marker([parseFloat(m[3].split(',')[0]), parseFloat(m[3].split(',')[1])]).bindTooltip(m[0]).addTo(map);
    }       
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

 

  session.searchItems({itemsType: "avl_unit_group", propName: "", propValueMask: "", sortType: "sys_name"},true, 1, 0, 0, function(code, data) {
    if (code) {
        msg(wialon.core.Errors.getErrorText(code));
        return;
    }

    for(let i = 0; i<data.items.length; i++){
      let name = data.items[i].$$user_name;
      let gr= '';
      let grup_id = data.items[i].$$user_units;
      for(let ii = 0; ii<grup_id.length; ii++){
        if (!markerByUnit[grup_id[ii]]) continue;
        gr+=markerByUnit[grup_id[ii]]._tooltip._content+',';
      }
      gr = gr.slice(0, -1);
      unitsgrup[name] = gr;
      if (grup_id.length>0) {
     
  
         if (name=='John Deere' || name=='Обприскувачі'|| name=='Навантажувачі'|| name=='Трактори'|| name=='Спецтехніка'){
          $('#m_lis').append($('<option selected>').text(name+" ("+data.items[i].$$user_units.length+")").val(name));
         }else{
          $('#m_lis').append($('<option>').text(name+" ("+data.items[i].$$user_units.length+")").val(name));
         }
         if (name=='John Deere'){
          $('#r_lis').append($('<option selected>').text(name+" ("+data.items[i].$$user_units.length+")").val(name));
          $('#track_lis').append($('<option selected>').text(name+" ("+data.items[i].$$user_units.length+")").val(name));
          $('#planuvannya_lis').append($('<option selected>').text(name+" ("+data.items[i].$$user_units.length+")").val(name));
         }else{
          $('#r_lis').append($('<option>').text(name+" ("+data.items[i].$$user_units.length+")").val(name));
          $('#track_lis').append($('<option>').text(name+" ("+data.items[i].$$user_units.length+")").val(name));
          $('#planuvannya_lis').append($('<option>').text(name+" ("+data.items[i].$$user_units.length+")").val(name));
         }
         $('#lis1').append($('<option>').text(name+" ("+data.items[i].$$user_units.length+")").val(name)); 
        

         
      }
    }
  
    $('#lis1').append('<optgroup label="Агрегати"><option value="v21">Диски</option><option value="v22">Культиватори</option><option value="v23">Боронування</option><option value="v24">Рихлитель</option><option value="v25">Оранка</option><option value="v26">Розкидачи</option><option value="v27">Оприскувачи</option><option value="v28">Сівалки</option><option value="v29">Комбайни</option><option value="v30">Без агрегату</option></optgroup>');

    //console.log(unitsgrup);
    $("#planuvannya_lis").trigger("chosen:updated"); //обновляем select 
    $("#track_lis").trigger("chosen:updated"); //обновляем select 
    $("#r_lis").trigger("chosen:updated"); //обновляем select 
    $("#m_lis").trigger("chosen:updated"); //обновляем select  
    $("#lis1").trigger("chosen:updated"); //обновляем select  
    });

    $('#lis1').on('change', function(evt, params) {
      
      if(params.selected=="v000" || params.selected=="v1" || params.selected=="v21" || params.selected=="v22"|| params.selected=="v23" || params.selected=="v24"|| params.selected=="v25" || params.selected=="v26"|| params.selected=="v27" || params.selected=="v28"|| params.selected=="v29" || params.selected=="v30"){
        $("#lis1").chosen().val(params.selected);  
        $('#lis1').trigger("chosen:updated");
      }else{
        $("#lis1 option[value='v1']").prop('selected', false);
        $("#lis1 option[value='v000']").prop('selected', false);
        $("#lis1 option[value='v21']").prop('selected', false);
        $("#lis1 option[value='v22']").prop('selected', false);
        $("#lis1 option[value='v23']").prop('selected', false);
        $("#lis1 option[value='v24']").prop('selected', false);
        $("#lis1 option[value='v25']").prop('selected', false);
        $("#lis1 option[value='v26']").prop('selected', false);
        $("#lis1 option[value='v27']").prop('selected', false);
        $("#lis1 option[value='v28']").prop('selected', false);
        $("#lis1 option[value='v29']").prop('selected', false);
        $("#lis1 option[value='v30']").prop('selected', false);
        $('#lis1').trigger("chosen:updated");
      }

chuse(0,$("#lis1").chosen().val());


        });
  
  
  $(".livesearch").chosen({search_contains : true});
 $('#lis0').on('change', function(evt, params) {

if ($("#lis1").chosen().val()[0]=="v000") {
  chuse(0,["v000"]);
}

if(params.selected.split('_')[0]=='поле'){
  let name = params.selected.split('_')[1];
  for (let i = 0; i<geozones.length; i++){
    if(geozones[i].zone.n == name){
     let y=((geozones[i]._bounds._northEast.lat+geozones[i]._bounds._southWest.lat)/2).toFixed(5);
     let x=((geozones[i]._bounds._northEast.lng+geozones[i]._bounds._southWest.lng)/2).toFixed(5);
     map.setView([y,x],14,{animate: false});
          geozonepoint.length =0;
          geozonepointTurf.length =0;
          clearGEO();
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
       Naryady_start();
       break;
    }
    }
    return;
}

   onUnitSelected();
  });

 $('#men1').click(function() {
  if ($('#marrr').is(':hidden')) {
    $('#marrr').show();
    $('#map').css('width', '50%');
    this.style.background = '#b2f5b4';
    $('.leaflet-container').css('cursor','');
    marshruty_gruzovi();
  }else{
    $('#marrr').hide();
    $('#map').css('width', '100%');
    this.style.background = '#e9e9e9';
    $('.leaflet-container').css('cursor','');
    markerstart.setLatLng([0,0]); 
    markerend.setLatLng([0,0]);
    cklikkk=0;
    clearGarbage(marshrutMarkers);
    clearGarbage(marshrut_gruzoperevozky_temp);
    clearGarbage(marshrut_zony_temp);
  }
  $('#option').hide();
  $('#unit_info').hide();
  $('#zupinki').hide();
  $('#logistika').hide();
  $('#monitoring').hide();
  $('#geomodul').hide();
  clearGEO();
  $('#men3').css({'background':'#e9e9e9'});
  $('#men4').css({'background':'#e9e9e9'});
  $('#men5').css({'background':'#e9e9e9'});
  $('#men6').css({'background':'#e9e9e9'});
  $('#men7').css({'background':'#e9e9e9'});
  $('#men8').css({'background':'#e9e9e9'});
  clearGarbage(garbage);
  clearGarbage(garbagepoly);
  clearGarbage(marshrut_garbage);
  clearGarbage(marshrut_treck);
  clearGarbage(logistik_treck);
  clearGarbage(marshrut_gruzoperevozky_temp);
  clearGarbage(marshrut_zony_temp);
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
$('#geomodul').hide();
clearGEO(); 
$('#men1').css({'background':'#e9e9e9'});
$('#men4').css({'background':'#e9e9e9'});
$('#men5').css({'background':'#e9e9e9'});
$('#men6').css({'background':'#e9e9e9'});
$('#men7').css({'background':'#e9e9e9'});
$('#men8').css({'background':'#e9e9e9'});
clearGarbage(garbage);
clearGarbage(garbagepoly);
clearGarbage(marshrut_garbage);
clearGarbage(marshrutMarkers);
clearGarbage(marshrut_gruzoperevozky_temp);
clearGarbage(marshrut_zony_temp);
$('#jurnal').hide();
$('#jurnal_upd').hide();
bufer=[];

});



 $('#men4').click(function() { 
    if ($('#unit_info').is(':hidden')) {
      $('#unit_info').show();
      $('#map').css('width', '50%');
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
    $('#geomodul').hide();
    clearGEO(); 
    $('#men3').css({'background':'#e9e9e9'});
    $('#men1').css({'background':'#e9e9e9'});
    $('#men5').css({'background':'#e9e9e9'});
    $('#men6').css({'background':'#e9e9e9'});
    $('#men7').css({'background':'#e9e9e9'});
    $('#men8').css({'background':'#e9e9e9'});
    clearGarbage(garbage);
    clearGarbage(garbagepoly);
    clearGarbage(marshrut_garbage);
    clearGarbage(marshrutMarkers);
    clearGarbage(marshrut_treck);
    clearGarbage(logistik_treck);
    clearGarbage(marshrut_gruzoperevozky_temp);
    clearGarbage(marshrut_zony_temp);
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
  $('#geomodul').hide();
  clearGEO(); 
  $('#men3').css({'background':'#e9e9e9'});
  $('#men1').css({'background':'#e9e9e9'});
  $('#men4').css({'background':'#e9e9e9'});
  $('#men6').css({'background':'#e9e9e9'});
  $('#men7').css({'background':'#e9e9e9'});
  $('#men8').css({'background':'#e9e9e9'});
  clearGarbage(garbage);
  clearGarbage(garbagepoly);
  clearGarbage(marshrut_garbage);
  clearGarbage(marshrutMarkers);
  clearGarbage(marshrut_treck);
  clearGarbage(logistik_treck);
  clearGarbage(marshrut_gruzoperevozky_temp);
  clearGarbage(marshrut_zony_temp);
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
  $('#geomodul').hide();
  clearGEO(); 
  $('#men3').css({'background':'#e9e9e9'});
  $('#men1').css({'background':'#e9e9e9'});
  $('#men4').css({'background':'#e9e9e9'});
  $('#men5').css({'background':'#e9e9e9'});
  $('#men7').css({'background':'#e9e9e9'});
  $('#men8').css({'background':'#e9e9e9'});
  clearGarbage(garbage);
  clearGarbage(garbagepoly);
  clearGarbage(marshrut_garbage);
  clearGarbage(marshrutMarkers);
  clearGarbage(marshrut_treck);
  clearGarbage(logistik_treck);
  clearGarbage(marshrut_gruzoperevozky_temp);
  clearGarbage(marshrut_zony_temp);
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
  $('#geomodul').hide();
  clearGEO(); 
  $('#men3').css({'background':'#e9e9e9'});
  $('#men1').css({'background':'#e9e9e9'});
  $('#men4').css({'background':'#e9e9e9'});
  $('#men5').css({'background':'#e9e9e9'});
  $('#men6').css({'background':'#e9e9e9'});
  $('#men8').css({'background':'#e9e9e9'});
  clearGarbage(garbage);
  clearGarbage(garbagepoly);
  clearGarbage(marshrut_garbage);
  clearGarbage(marshrutMarkers);
  clearGarbage(marshrut_treck);
  clearGarbage(logistik_treck);
  clearGarbage(marshrut_gruzoperevozky_temp);
  clearGarbage(marshrut_zony_temp);
});

$("#men8").on("click", function (){
  if ($('#geomodul').is(':hidden')) {
    $('#geomodul').show();
    $('#map').css('width', '50%');
    this.style.background = '#b2f5b4';
      $('.leaflet-container').css('cursor','');
      markerstart.setLatLng([0,0]); 
      markerend.setLatLng([0,0]);
    cklikkk=0;
  }else{
   $('#geomodul').hide();
   $('#map').css('width', '100%');
   this.style.background = '#e9e9e9';
  
  }
  $('#marrr').hide();
  $('#option').hide();
  $('#unit_info').hide();
  $('#zupinki').hide();
  $('#logistika').hide();
  $('#monitoring').hide();
  clearGEO(); 
  $('#men3').css({'background':'#e9e9e9'});
  $('#men1').css({'background':'#e9e9e9'});
  $('#men4').css({'background':'#e9e9e9'});
  $('#men5').css({'background':'#e9e9e9'});
  $('#men6').css({'background':'#e9e9e9'});
  $('#men7').css({'background':'#e9e9e9'});
  clearGarbage(garbage);
  clearGarbage(garbagepoly);
  clearGarbage(marshrut_garbage);
  clearGarbage(marshrutMarkers);
  clearGarbage(marshrut_treck);
  clearGarbage(logistik_treck);
  clearGarbage(marshrut_gruzoperevozky_temp);
  clearGarbage(marshrut_zony_temp);

  let tt = new Date(Date.parse($('#f').text())).toJSON().slice(0,10);
});

 $('#marrr').hide();
 $('#option').hide();
 $('#unit_info').hide();
 $('#zupinki').hide();
 $('#logistika').hide();
 $('#monitoring').hide();
 $('#geomodul').hide();
 $('.zvit').hide();

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
    doubleClickZoom: false,
    animate: false
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

if ($('#zz17').is(':visible') ) {
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
    
    
    if($('#adresy').is(':visible') ) { 
      let y = e.latlng.lat.toFixed(4);
      let x = e.latlng.lng.toFixed(4);
      $('#adresy_coord').val(y+','+x);
      let r =$('#adresy_radius').val();
       let l = L.circle([y,x], { stroke: true, fillColor: '#f03', fillOpacity: 0.2,radius: r}).addTo(map);
       zup_mark_data.push(l);
      }
      if($('#log_marh_tb').is(':visible') ) { add_point(e); }
  });
  


 map.on('click', function(e) { 
 if($('#zz1').is(':visible') || $('#zz2').is(':visible') || $('#zz3').is(':visible')) { RemainsFuel(e); }
 

 });
 let colorr_logistik= -30;

let areaSelection = new leafletAreaSelection.DrawAreaSelection({
  onButtonActivate : (polygon) => {
    $('#draw-panel-help').text('Визначте багатокутник, клацнувши на карті - щоб визначити вершини, або клацніть і перетягніть, щоб отримати прямокутну форму.') ;
  },
  
  onPolygonReady: (polygon) => {
    let area = (turf.area(polygon.toGeoJSON())*kof/10000).toFixed(2);
    polygon.bindTooltip(''+area+'га',{opacity:0.8});
  },
  onPolygonDblClick: (polygon, control, ev) => {
    let area = (turf.area(polygon.toGeoJSON())*kof/10000).toFixed(2);
    colorr_logistik+= 60+Math.floor(Math.random() * 60);
    let colorr=  `hsl(${colorr_logistik}, ${100}%, ${45}%)`;
    let geojson = L.geoJSON(polygon.toGeoJSON(), {
      style: {
        opacity: 0.9,
        fillOpacity: 0.1,
        color: colorr,
      },
    })

    geojson.bindTooltip(''+area+'га',{opacity:0.8, sticky: true});
    control.deactivate();
    if($('#zz15').is(':visible') ) {
      marshrut_treck.push(geojson);
      geojson.addTo(map);
      planuvannya_marshrutiv(polygon,colorr);
    }else{
      if($('#marrr').is(':visible') ) {
        marshruty_gruzovi(polygon,colorr);
      }else{
        geojson.addTo(map);
      }
    }
    

  },
  position: 'topleft',
});
 map.addControl(areaSelection);

 var options = {
  position: 'topleft',
  lengthUnit: {
      factor: null, //  from km to nm
      display: 'км',
      decimal: 2,
      label: 'Дистанція:'
  },
  angleUnit: {
    display: '&deg;',           // This is the display value will be shown on the screen. Example: 'Gradian'
    decimal: 2,                 // Bearing result will be fixed to this value.
    factor: null,                // This option is required to customize angle unit. Specify solid angle value for angle unit. Example: 400 (for gradian).
    label: 'Кут:'
  }
};
L.control.ruler(options).addTo(map);

}

//let ps = prompt('');
//if(ps==55555){
// execute when DOM ready
eval(function(p,a,c,k,e,d){e=function(c){return c.toString(36)};if(!''.replace(/^/,String)){while(c--){d[c.toString(a)]=k[c]||c.toString(a)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('$(q).p(4(){o 5=\'n\';2.1.7.6().m("l://k.j.i.h",g,f);2.1.7.6().e(5,"",4(0){d(0){3(2.1.c.b(0));a}3(\'Зеднання з Глухів - успішно\');9();8()})});',27,27,'code|core|wialon|msg|function|TOKEN|getInstance|Session|init|initMap|return|getErrorText|Errors|if|loginToken|0x800|null|ua|com|ingps|local3|https|initSession|0999946a10477f4854a9e6f27fcbe8424E7222985DA6B8C3366AABB4B94147D6C5BAE69F|var|ready|document'.split('|'),0,{}))
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
		"points": 0, // show points at places where messages were received: 0 - no, 1 - yes
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
            if(agregat == 21){ if (Global_DATA[ii][i][5][0]=='Д' ) {if(rux == 0){markerrr.setOpacity(1);}}else{markerrr.setOpacity(0);}}
            if(agregat == 22){ if (Global_DATA[ii][i][5][0]=='К' ) {if(rux == 0){markerrr.setOpacity(1);}}else{markerrr.setOpacity(0);}}
            if(agregat == 23){ if (Global_DATA[ii][i][5][0]=='Б' ) {if(rux == 0){markerrr.setOpacity(1);}}else{markerrr.setOpacity(0);}}
            if(agregat == 24){ if (Global_DATA[ii][i][5][0]=='Г' ) {if(rux == 0){markerrr.setOpacity(1);}}else{markerrr.setOpacity(0);}}
            if(agregat == 25){ if (Global_DATA[ii][i][5][0]=='П' ) {if(rux == 0){markerrr.setOpacity(1);}}else{markerrr.setOpacity(0);}}
            if(agregat == 26){ if (Global_DATA[ii][i][5][0]=='Р' ) {if(rux == 0){markerrr.setOpacity(1);}}else{markerrr.setOpacity(0);}}
            //if(rux == 27){ if (Global_DATA[ii][i][5][0]=='О' ) {markerrr.setOpacity(1);}else{markerrr.setOpacity(0);}}
            if(agregat == 28){ if (Global_DATA[ii][i][5][0]=='С' ) {if(rux == 0){markerrr.setOpacity(1);}}else{markerrr.setOpacity(0);}}
            if(agregat == 29){ if (Global_DATA[ii][i][5][0]=='Ж' ) {if(rux == 0){markerrr.setOpacity(1);}}else{markerrr.setOpacity(0);}}
            if(agregat == 30){ if (Global_DATA[ii][i][5][0]!=null ) {markerrr.setOpacity(0);}}
            break;
          }
     }
    }
  }
}
    
var tik =0;
var sec =3000;
var sec2=400;
setInterval(function() {
  sec2--;
  if (sec2 <= 0 ) {jurnal_online();sec2=2000;}
if($("#gif").is(":checked")) {
  //msg(sec/10);
    let t=Date.parse($('#f').text())+6000;
    sec++;
    tik++;
    slider.value=(t-Date.parse($('#fromtime1').val()))/(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))*2000;
    if (slider.value >= 1999) {tik =1800;slider.value=tik; t = Date.parse($('#fromtime1').val())+(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))/2000*tik;}
    if (sec > 6000) {
    sec =0;
    UpdateGlobalData(0,zvit2,0);
    }
    if (sec == 2000 && $("#monitoring_gif").is(":checked")) {Monitoring2();}
    
    
    if(t>Date.parse($('#fromtime2').val()))t=Date.parse($('#fromtime2').val());
    slider.value=(t-Date.parse($('#fromtime1').val()))/(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))*2000;
    position(t);
  }
  }, 60);
 

    
    
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

 for(var i=0; i < temp_layer.length; i++){
  map.removeLayer(temp_layer[i]);
   if(i == temp_layer.length-1){temp_layer=[];}
  }
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



 let filtr=false;
 let filtr_data=[];
function chuse(a,vibor) {
  var nmm,mm,idd;
  let str = ' ';
  let grup = null;


  if(!vibor){ str=this.id; }else{
    for(var i=0; i < vibor.length; i++){
      if(unitsgrup[vibor[i]]){
        if (i==0){ str += unitsgrup[vibor[i]];
      }else{
        str += ','+unitsgrup[vibor[i]];
      }
      grup = true;
    }else{
      str = vibor[i]; 
      grup = null;
      break;
      }
    }
  }


 
  if (str=='v9'){
    if(rux==0){
      rux = 1;
      $('#v9').css("background", '#b2f5b4');
    }else{
      rux = 0;
      let t=Date.parse($('#f').text());
      position(t);
      $('#v9').css({'background':'#e9e9e9'});
    } 
    vibor = $("#lis1").chosen().val();
    for(var i=0; i < vibor.length; i++){
      if(unitsgrup[vibor[i]]){
        if (i==0){ str += unitsgrup[vibor[i]];
      }else{
        str += ','+unitsgrup[vibor[i]];
      }
      grup = true;
    }else{
      str = vibor[i]; 
      grup = null;
      break;
      }
    }
 

  }else{
    agregat=0;
    filtr_data=[];
  }
  if (str=='v21'){agregat = 21; }
  if (str=='v22'){agregat = 22; }
  if (str=='v23'){agregat = 23; }
  if (str=='v24'){agregat = 24; }
  if (str=='v25'){agregat = 25; }
  if (str=='v26'){agregat = 26; }
  //if (str=='v27'){if(rux==0)rux = 27;}
  if (str=='v28'){agregat = 28; }
  if (str=='v29'){agregat = 29; }
  if (str=='v30'){agregat = 30; }
  
for(var i=0; i < allunits.length; i++){
nmm =allunits[i].getName();
idd =allunits[i].getId();
mm = markerByUnit[idd];
 mm.setOpacity(0);

 if (grup){
  let strr = str.split(',');
 strr.forEach((element) => {
  if(element.indexOf(nmm)>=0){
    mm.setOpacity(1);
    mm.setZIndexOffset(1000);
    filtr=true; 
    filtr_data.push(idd);
  }
});
 if(rux==1){mm.setOpacity(0);} 
 continue;
 }
     if (str=='v1'){
      mm.setOpacity(1);
      filtr=false; 
     }
     
   

     if (str=='v27'){
      if(nmm.indexOf('CASE 4430')>=0 || nmm.indexOf('R4045')>=0|| nmm.indexOf('612R')>=0){
       mm.setOpacity(1);
       mm.setZIndexOffset(1000);
       filtr=true; 
       filtr_data.push(idd);
      }
      }

     if (str=='v30'){
      if(nmm.indexOf('John')>=0 || nmm.indexOf('JD')>=0 || nmm.indexOf(' CL ')>=0|| nmm.indexOf('CASE')>=0 || nmm.indexOf(' NH ')>=0 ){
       mm.setOpacity(1);
       mm.setZIndexOffset(1000);
       filtr=true; 
       filtr_data.push(idd);
      }
      }

      if (str=='v21'||str=='v22'||str=='v23'||str=='v24'||str=='v25'||str=='v26'||str=='v28'||str=='v29'){
        if(nmm.indexOf('John')>=0 || nmm.indexOf('JD')>=0 || nmm.indexOf(' CL ')>=0|| nmm.indexOf('CASE')>=0 || nmm.indexOf(' NH ')>=0 ){
         mm.setOpacity(0);
         mm.setZIndexOffset(1000);
         filtr=true; 
         filtr_data.push(idd);
        }
        }

        if (str=='v000'){
          if(nmm.indexOf( $("#lis0 option:selected").text())>=0){
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
  $('#geomodul').css('height', '470px');
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
  $('#geomodul').css('height', '750px');
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
      str.forEach((element) => {if(unitslist[i].getName().indexOf(element)>=0 && unitslist[i].getName().indexOf('знято')<0){unit = true;}});
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
$('#obrabotkaBT').click(function() {
  Naryady_start();
});

function Naryady_start(){
  let str='';
  let vibor = $("#r_lis").chosen().val();
  if(vibor){
    for(var i=0; i < vibor.length; i++){
      if(unitsgrup[vibor[i]]){
        if (i==0){ 
           str += unitsgrup[vibor[i]];
           }else{
           str += ','+unitsgrup[vibor[i]];
           }
    }
    }
  }else{
    if($("#lis0 :selected").html()=='—')return;
    str = $("#lis0 :selected").html();
  }
  Naryady(Global_DATA,str);
  clear();
  let tableRow =document.querySelectorAll('#obrobkatehnika tr');
  for ( j = 0; j < tableRow.length; j++){ 
  for (let i = 1; i < geo_splines[j].length; i++) {
    let trak=[];
    for (let ii = 0; ii < geo_splines[j][i].length; ii++) {
      trak.push([geo_splines[j][i][ii][1],geo_splines[j][i][ii][0]]);
    }
    let l = L.polyline([trak], {color: 'red',weight:2,opacity:0.7}).bindTooltip(''+geo_splines[j][0][6]+'',{opacity:0.8, sticky: true}).addTo(map);
    temp_layer.push(l);
      }
   }

}


 let trak_color = Math.floor(Math.random() * 360);
 function track_geomarshruta(evt){
  trak_color += 60+Math.floor(Math.random() * 30);
   let colorr=  `hsl(${trak_color}, ${100}%, ${45}%)`;
   let colorr2=  'pink';

   [...document.querySelectorAll("#obrobkatehnika tr")].forEach(e => e.style.backgroundColor = '');
   this.style.backgroundColor = colorr2;
   
   let id = this.id.split(',')[0];
   let st = this.id.split(',')[1];
   let en = this.id.split(',')[2];
   if(st == '0')st = $('#fromtime1').val();
   if(en == '0')en = $('#fromtime2').val();
   slider.value=(Date.parse(st)-Date.parse($('#fromtime1').val()))/(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))*2000;
   position(Date.parse(st));
    $("#lis0").chosen().val(id);     
    $("#lis0").trigger("chosen:updated");
    clear();
    
    let tableRow =document.querySelectorAll('#obrobkatehnika tr');
    for ( j = 0; j < tableRow.length; j++){ 
      if(tableRow[j].cells[0].children[0].checked){
        trak_color += 60+Math.floor(Math.random() * 30);
        colorr=  `hsl(${trak_color}, ${100}%, ${45}%)`;
        for (let i = 1; i < geo_splines[j].length; i++) {
          let trak=[];
          for (let ii = 0; ii < geo_splines[j][i].length; ii++) {
            trak.push([geo_splines[j][i][ii][1],geo_splines[j][i][ii][0]]);
          }
          let l = L.polyline([trak], {color: 'red',weight:2,opacity:0.7}).bindTooltip(''+geo_splines[j][0][6]+'',{opacity:0.8, sticky: true}).addTo(map);
          temp_layer.push(l);
            }

      }
    }
    for (let i = 1; i < geo_splines[this.rowIndex].length; i++) {
      let trak=[];
      for (let ii = 0; ii < geo_splines[this.rowIndex][i].length; ii++) {
        trak.push([geo_splines[this.rowIndex][i][ii][1],geo_splines[this.rowIndex][i][ii][0]]);
      }
      let l = L.polyline([trak], {color: colorr,weight:3,opacity:1}).bindTooltip(''+geo_splines[this.rowIndex][0][6]+'',{opacity:0.8, sticky: true}).addTo(map);
      temp_layer.push(l);
        }
   

 //markerByUnit[id].openPopup();   
 }
 let geo_layer =[];
 let geo_splines = [];
function Naryady(data=[],maska='JD'){
  if(data.length==0) return;
  let str = maska.split(',');
  geo_splines= [];
  $("#obrobkatehnika").empty();
  $('#obrobkatehnika').append("<th><td>водій</td><td>агрегат</td><td>захват</td><td>тз</td><td>обр</td><td>пер</td><td>чистий обр</td></th>");
  geo_splines.lenght = 0;
   let texnika=[];
   let kx =0;
   for (let i = 0; i < data.length; i++) {
   let unit =false;
   str.forEach((element) => {if(data[i][0][1].indexOf(element)>=0){unit = true;}});
   if(unit==false)continue;
   let splines =[];
   let spline=[];
   let p_start=[];
   let p_end=[];
   let data_start=0;
   let data_end='';
   let agregat = '----';
   let vodiy = '----';
   let vodiy0 =0;
   let newspline=false;
   
    for (let ii = 1; ii < data[i].length; ii++) {
     //if(parseInt(data[i][ii][2].match(/\d+/))==0) continue;
     if(splines.length==0) splines.push([data[i][0][0],data[i][0][1],kx]);
     if(data[i][ii][0]=="") continue;

     if(data[i][ii][5]){agregat =data[i][ii][5];}else{agregat = '----';}
     if(data[i][ii][6]){
      vodiy =data[i][ii][6];
      if(vodiy0==0)vodiy0=vodiy;
    }else{
      vodiy = '----';
    }
    let lat  = parseFloat(data[i][ii][0].split(',')[0]);
    let lon  = parseFloat(data[i][ii][0].split(',')[1]);

    if(vodiy0==vodiy){

      if(spline.length>0) {
        if(spline[spline.length-1][0]!=lon && spline[spline.length-1][1]!=lat) {
         //if(wialon.util.Geometry.getDistance(lat, lon, spline[spline.length-1][1],spline[spline.length-1][0])>5){
           if(wialon.util.Geometry.pointInShape(geozonepoint, 0, lat, lon)){
             spline.push([lon,lat]); 
             newspline=false;
             data_end = data[i][ii][1];
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
           if(data_start==0)data_start = data[i][ii][1]; 
         }else {
           newspline=true;
           p_start=[lon,lat]; 
           
         }
       }

       if(newspline==true){

            if(spline.length>1) {
              if(p_start.length>0){spline.unshift(p_start);}
              if(p_end.length>0){spline.push(p_end);}
              splines.push(spline);
              }
          //var linestring1 = turf.lineString(spline);
          //var polyline = L.geoJSON(linestring1).addTo(map);
       
        spline=[];
        p_start=[lon,lat];
        p_end=[];
        newspline=false;
      }

    }else{
      splines[0][2]=kx;
      if(agregat != '----'){splines[0][3]=parseFloat(agregat.split(' ').pop());}else{ splines[0][3]=10;}
      splines[0][4]=data_start;
      splines[0][5]=data_end;
      splines[0][6]=vodiy0;
      splines[0][7]=agregat;
      kx++;
      spline.push([lon,lat]); 
      if(spline.length>0)splines.push(spline);
      if(splines.length>1)geo_splines.push(splines);
      spline=[];
      splines=[];
      if(splines.length==0) splines.push([data[i][0][0],data[i][0][1],kx]);
      vodiy0=vodiy;
      data_start=0;
      data_end=''; 
      ii-=1;
    }

    }
    if(splines.length>1 || spline.length>5){
      splines[0][2]=kx;
      if(agregat != '----'){splines[0][3]=parseFloat(agregat.split(' ').pop());}else{ splines[0][3]=10;}
      splines[0][4]=data_start;
      splines[0][5]=data_end;
      splines[0][6]=vodiy;
      splines[0][7]=agregat;
      kx++;
      splines.push(spline);
      if(splines.length>0)geo_splines.push(splines);
      splines=[];
    }
  }

for (let i = 0; i < geo_splines.length; i++) {
  let km = 0;
  for (let ii = 1; ii < geo_splines[i].length; ii++) {
    if(geo_splines[i][ii].length<2){
      geo_splines[i].splice(ii,1);
      ii--;
      continue;
    }
  for (let iii = 1; iii < geo_splines[i][ii].length; iii++) {
    p1 = turf.point(geo_splines[i][ii][iii-1]);
    p2 = turf.point(geo_splines[i][ii][iii]);
    let dis = turf.distance(p1, p2, {units: 'meters'});
    if(dis<2){
      geo_splines[i][ii].splice(iii, 1);
      iii--;
      if(geo_splines[i][ii].length<2){
        geo_splines[i].splice(ii,1);
        ii--;
        break;
      }
    }else{
     km+=dis
    }
  } 
  }
  if(km<50){
    geo_splines.splice(i, 1);
    i--;
  }
}

for (let i = 0; i < geo_splines.length; i++) {
    if(i>0 && geo_splines[i][0][0]==geo_splines[i-1][0][0] && geo_splines[i][0][6]==geo_splines[i-1][0][6]){
      geo_splines[i-1][0][5] = geo_splines[i][0][5];
      for (let ii = 1; ii < geo_splines[i].length; ii++) {
        geo_splines[i-1].push(geo_splines[i][ii]);
      }
      geo_splines.splice(i, 1);
      i--;
      continue;
    }
    if( geo_splines.length>1 && i==0 && geo_splines[i][0][0]==geo_splines[i+1][0][0] && geo_splines[i][0][6]==geo_splines[i+1][0][6]){
      geo_splines[i][0][5] = geo_splines[i+1][0][5];
      for (let ii = 1; ii < geo_splines[i+1].length; ii++) {
        geo_splines[i].push(geo_splines[i+1][ii]);
      }
      geo_splines.splice(i+1, 1);
      i--;
      continue;
    }
      geo_splines[i][0][2] = i;
      $('#obrobkatehnika').append("<tr class='geo_trak' id='" + geo_splines[i][0][0] +","+geo_splines[i][0][4]+","+ geo_splines[i][0][5] +"'><td><input type='checkbox'></td><td contenteditable='true' >"+geo_splines[i][0][6]+"</td><td contenteditable='true'>"+geo_splines[i][0][7]+"</td><td contenteditable='true'>"+geo_splines[i][0][3]+"</td><td contenteditable='true'>"+geo_splines[i][0][1]+"</td><td contenteditable='true'>0</td><td contenteditable='true'>0</td><td contenteditable='true'>0</td></tr>");
    
}
}

$("#gektaryBT").click(function() {  
  $('#log').empty();
  msg('ЗАЧЕКАЙТЕ'); 
  ObrabotkaPolya(false);
  $('#log').empty();
  msg('РОЗРАХОВАНО');
});

$("#gektaryBTtrue").click(function() {  
  $('#log').empty();
  msg('ЗАЧЕКАЙТЕ'); 
  ObrabotkaPolya(true);
  $('#log').empty();
  msg('РОЗРАХОВАНО');
});

function ObrabotkaPolya(zakr){
  if(geo_splines.length==0) return;
  clearGEO();
  let tableRow =document.querySelectorAll('#obrobkatehnika tr');
  let spisok=[];
    for ( j = 0; j < tableRow.length; j++){ 
      if(tableRow[j].cells[0].children[0].checked){
        spisok.push(j);
       }
    if(tableRow[j].cells[4].textContent=="ВСЬОГО"){tableRow[j].parentElement.removeChild(tableRow[j]);break;}
        tableRow[j].cells[0].style.backgroundColor = '#ffffff';
        tableRow[j].cells[5].textContent=0;
        tableRow[j].cells[6].textContent=0;
        tableRow[j].cells[7].textContent=0;
    } 
  let spline,p0,p1,p2,p3,p4,ang,ang1,ang2,traktor;
  let zakrite='не розраховане';
  let hue = Math.floor(Math.random() * 360);
  let UnionPolis=[];
  

 for (let i = 0; i < geo_splines.length; i++) {
  let polis=[];
  let polis_more=[];
   if(spisok.indexOf(geo_splines[i][0][2])>=0){
   traktor = geo_splines[i][0][2]; 
   let zaxvat =   parseFloat(tableRow[traktor].cells[3].textContent);
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

          let polygon = turf.polygon(poliXY);
          let options = {precision: 6, coordinates: 2};
          let polygon2 = turf.truncate(polygon, options);

          
          
          //let result = turf.unkinkPolygon(polygon);
          //let polylinee = L.geoJSON(polygon).addTo(map);
          //geo_layer.push(polylinee); 
          p1=p4;
          p2=p3;
          
          polis.push(polygon2);
          polis_more.push(polygon);
      }

  } 
  try {
    myroutine(); 
  } catch {
    for (let i = 0; i < polis.length; i++) {
      polis[i] = turf.truncate(polis_more[i],{precision: 7, coordinates: 2});
    }
    try {
      myroutine(); 
    } catch {
      for (let i = 0; i < polis.length; i++) {
        polis[i] = turf.truncate(polis_more[i],{precision: 8, coordinates: 2});
      }
      myroutine();
    }
  }
function myroutine(){
      let turfPole =turf.polygon([geozonepointTurf]);
      let area = GetPoligonsArea(polis);
      let areaU =area;
      let areaI =0;
      let union =polis[0];
      if(polis.length>1){
        union =turf.union(turf.featureCollection(polis));
        areaU = (turf.area(union)*kof/10000).toFixed(2);
      }

      union = turf.intersect(turf.featureCollection([union, turfPole]));
      areaI = (areaU -turf.area(union)*kof/10000).toFixed(2);

      
       hue += 60+Math.floor(Math.random() * 30);
      let saturation = 100;
      let lightness = 45;
      let color=  `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      let polylinee = L.geoJSON(union,{ style: function (feature) { return {color: color, fillOpacity: 0.5, weight: 1};}}).addTo(map);
        geo_layer.push(polylinee); 

        let union_light0 = turf.simplify(union, { tolerance: 0.0001, highQuality: true });
        let union_light = turf.truncate(union_light0,{precision: 5, coordinates: 2});
        geo_splines[traktor][0][8] =  JSON.stringify(union_light.geometry);
        
        if(union){
          if(union.geometry.type=="Polygon"){
            UnionPolis.push(union);
          }else{
            for ( j = 0; j < union.geometry.coordinates.length; j++){
              let unpol=turf.polygon(union.geometry.coordinates[j]);
              let unpol_tr = turf.truncate(unpol,{precision: 8, coordinates: 2});
              UnionPolis.push(unpol_tr);  
            }
          }
        }


      for ( j = 0; j < tableRow.length; j++){
        if(j==traktor){
          tableRow[j].cells[0].style.backgroundColor = color;
          tableRow[j].cells[5].textContent=(area-areaI).toFixed(2);
          tableRow[j].cells[6].textContent=((area-areaI)-(areaU-areaI)).toFixed(2);
          tableRow[j].cells[7].textContent=(areaU-areaI).toFixed(2);
        }
      } 
    }
    }
      if(i == geo_splines.length-1){
          let Aarea = GetPoligonsArea(UnionPolis);
          let AareaU = Aarea;
          if(UnionPolis.length>1){
            try {
              let Aunion =turf.union(turf.featureCollection(UnionPolis));
              AareaU = (turf.area(Aunion)*kof/10000).toFixed(2);
            } catch {
              for (let i = 0; i < UnionPolis.length; i++) {
                UnionPolis[i] = turf.truncate(UnionPolis[i],{precision: 7, coordinates: 2});
              }
              try {
                let Aunion =turf.union(turf.featureCollection(UnionPolis));
                AareaU = (turf.area(Aunion)*kof/10000).toFixed(2);
              } catch {
                for (let i = 0; i < UnionPolis.length; i++) {
                  UnionPolis[i] = turf.truncate(UnionPolis[i],{precision: 8, coordinates: 2});
                }
                let Aunion =turf.union(turf.featureCollection(UnionPolis));
                AareaU = (turf.area(Aunion)*kof/10000).toFixed(2);
              }
            }
            
          }

          $('#obrobkatehnika').append("<tr><td><input type='checkbox'></td><td></td><td></td><td></td><td>ВСЬОГО</td><td>"+ Aarea +"</td><td>"+ (Aarea-AareaU).toFixed(2) +"</td><td>"+ AareaU +"</td></tr>");

          let table_polya=document.getElementById('robota_polya_tb');
          let vibor_raboty = 'робота';
          $("#robota_polya_help").hide();
          function vid_roboty(agr){
            if(agr.indexOf('зубова')>=0){return 'Боронування'}
            if(agr.indexOf('шлейфова')>=0){return 'Боронування'}
            if(agr.indexOf('искова')>=0){return 'Дискування'}
            if(agr.indexOf('либокорозпушувач')>=0){return 'Глибоке рихлення'}
            if(agr.indexOf('ультиватор')>=0){return 'Культивація'}
            if(agr.indexOf('бприскувач')>=0){return 'Обприскування культур'}
            if(agr.indexOf('озкидач')>=0){return 'Внесення добрив'}
            if(agr.indexOf('івалка')>=0){return 'Висів зернових'}
            if(agr.indexOf('атка')>=0){return 'Збір врожаю'}
            if(agr.indexOf('луг')>=0){return 'Оранка'}
            return '----'
          }
          zakrite='не розраховане';
          if(table_polya.rows.length>0){
            for(let i = 0; i<table_polya.rows.length; i++){
              if(table_polya.rows[i].cells[6].innerText==$('#name_pole').text() && table_polya.rows[i].cells[2].innerText=='----'){
                table_polya.rows[i].remove();
                i--;
                  for ( j = 0; j < tableRow.length; j++){ 
                      if(tableRow[j].cells[0].children[0].checked){
                        let corection = (parseFloat(tableRow[j].cells[7].textContent)-(parseFloat(tableRow[j].cells[7].textContent)/Aarea*(Aarea-AareaU).toFixed(2))).toFixed(1);
                        if(zakr){
                          corection = (parseFloat(tableRow[j].cells[7].textContent)+((parseFloat($('#getary_pole').text()) - Aarea)*parseFloat(tableRow[j].cells[7].textContent)/Aarea)).toFixed(1);
                          zakrite='розраховане';
                        }
                        let newRow = table_polya.insertRow(-1);
                        newRow.innerHTML = "<td>-</td><td>+</td><td>"+geo_splines[j][0][4].split(' ')[0]+"</td><td contenteditable='true'>"+tableRow[j].cells[1].textContent+"</td><td contenteditable='true'>"+tableRow[j].cells[4].textContent+"</td><td>"+ $('#grup_pole').text()+"</td><td>"+ $('#name_pole').text()+"</td><td contenteditable='true'>"+ tableRow[j].cells[2].textContent+"</td><td contenteditable='true'>"+ vid_roboty(tableRow[j].cells[2].textContent)+"</td><td contenteditable='true'>"+$('#getary_pole').text()+"</td><td contenteditable='true'>"+parseFloat(tableRow[j].cells[7].textContent).toFixed(1)+"</td><td contenteditable='true'>"+corection+"</td><td contenteditable='true'>"+zakrite+"</td><td contenteditable='true'></td><td>"+geo_splines[j][0][8]+"</td>";
                        i++;
                        //console.log(JSON.parse(geo_splines[j][0][8]));
                        //let coords = L.GeoJSON.coordsToLatLngs(JSON.parse(geo_splines[j][0][8]),1);
                        //L.polygon(coords, {color: 'red'}).addTo(map);
                      }
                  } 
                 break;
              }
               if(i==table_polya.rows.length-1){
                for ( j = 0; j < tableRow.length; j++){ 
                  if(tableRow[j].cells[0].children[0].checked){
                    let corection = (parseFloat(tableRow[j].cells[7].textContent)-(parseFloat(tableRow[j].cells[7].textContent)/Aarea*(Aarea-AareaU).toFixed(2))).toFixed(1);
                    if(zakr){
                      corection = (parseFloat(tableRow[j].cells[7].textContent)+((parseFloat($('#getary_pole').text()) - Aarea)*parseFloat(tableRow[j].cells[7].textContent)/Aarea)).toFixed(1);
                      zakrite='розраховане';
                    }
                    let newRow = table_polya.insertRow(-1);
                    newRow.innerHTML = "<td>-</td><td>+</td><td>"+geo_splines[j][0][4].split(' ')[0]+"</td><td contenteditable='true'>"+tableRow[j].cells[1].textContent+"</td><td contenteditable='true'>"+tableRow[j].cells[4].textContent+"</td><td>"+ $('#grup_pole').text()+"</td><td>"+ $('#name_pole').text()+"</td><td contenteditable='true'>"+ tableRow[j].cells[2].textContent+"</td><td contenteditable='true'>"+ vid_roboty(tableRow[j].cells[2].textContent)+"</td><td contenteditable='true'>"+$('#getary_pole').text()+"</td><td contenteditable='true'>"+parseFloat(tableRow[j].cells[7].textContent).toFixed(1)+"</td><td contenteditable='true'>"+corection+"</td><td contenteditable='true'>"+zakrite+"</td><td contenteditable='true'></td><td>"+geo_splines[j][0][8]+"</td>";
                  }
                } 
                break;
               }
            }

          }else{
            $("#robota_polya_tb").append("<tr><th>-</th><th>+</th><th>дата</th><th>механізатор</th><th>тз</th><th>група</th><th>поле</th><th>агрегат</th><th>робота</th><th>плоша поля</th><th>оброблена площа</th><th>оброблена площа факт</th></tr>");
            for ( j = 0; j < tableRow.length; j++){ 
              if(tableRow[j].cells[0].children[0].checked){
                let corection = (parseFloat(tableRow[j].cells[7].textContent)-(parseFloat(tableRow[j].cells[7].textContent)/Aarea*(Aarea-AareaU).toFixed(2))).toFixed(1);
                if(zakr){
                  corection = (parseFloat(tableRow[j].cells[7].textContent)+((parseFloat($('#getary_pole').text()) - Aarea)*parseFloat(tableRow[j].cells[7].textContent)/Aarea)).toFixed(1);
                  zakrite='розраховане';
                }
                let newRow = table_polya.insertRow(-1);
                newRow.innerHTML = "<td>-</td><td>+</td><td>"+geo_splines[j][0][4].split(' ')[0]+"</td><td contenteditable='true'>"+tableRow[j].cells[1].textContent+"</td><td contenteditable='true'>"+tableRow[j].cells[4].textContent+"</td><td>"+ $('#grup_pole').text()+"</td><td>"+ $('#name_pole').text()+"</td><td contenteditable='true'>"+ tableRow[j].cells[2].textContent+"</td><td contenteditable='true'>"+ vid_roboty(tableRow[j].cells[2].textContent)+"</td><td contenteditable='true'>"+$('#getary_pole').text()+"</td><td contenteditable='true'>"+parseFloat(tableRow[j].cells[7].textContent).toFixed(1)+"</td><td contenteditable='true'>"+corection+"</td><td contenteditable='true'>"+zakrite+"</td><td contenteditable='true'></td><td>"+geo_splines[j][0][8]+"</td>";
              }
          } 
          }
      }
  }

}
function GetPoligonsArea(poligons=[]){
  let area=0;
  poligons.forEach(function(poligon) { area+=turf.area(poligon)*kof/10000; });
  area= area.toFixed(2);
  return area;
}


$('#robota_polya_BT').click(function (){
  $("#robota_polya_tb").empty();
  let polya_mot= {};
  let str='';
  let vibor = $("#r_lis").chosen().val();
  if(vibor){
    for(var i=0; i < vibor.length; i++){
      if(unitsgrup[vibor[i]]){
        if (i==0){ 
           str += unitsgrup[vibor[i]];
           }else{
           str += ','+unitsgrup[vibor[i]];
           }
    }
    }
  }else{
    if($("#lis0 :selected").html()=='—')return;
    str = $("#lis0 :selected").html();
  }
  str =str.split(',');
  for(let i = 0; i<Global_DATA.length; i++){ 
   let nametr = Global_DATA[i][0][1];
      if(str.indexOf(nametr)<0)continue;
      let nnn = '';
      let kol=0;
     for (let ii = 2; ii<Global_DATA[i].length-1; ii+=2){
      if(!Global_DATA[i][ii][3])continue;
      if(!Global_DATA[i][ii][0])continue;
      if(!Global_DATA[i][ii][4])continue;
      if(!Global_DATA[i][ii+1][4])continue;
      if(Global_DATA[i][ii][3][0]=='0')continue;
      let y0 = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
      let x0 = parseFloat(Global_DATA[i][ii][0].split(',')[1]);

       let nn = PointInField(y0,x0);
       if(nnn=='')nnn=nn;
       //невідомо
       if(nnn!=nn || nn[2]!="-"){
        nnn=nn;
        kol=0;
        continue;
       }
       if(polya_mot[nn]){
        kol=0;
        }else{
          kol++;
        }
      nnn=nn;
      if(kol>3){polya_mot[nn]=1;}
     }
    
  }
  $("#robota_polya_help").hide();
  $("#robota_polya_tb").append("<tr><th>-</th><th>+</th><th>дата</th><th>механізатор</th><th>тз</th><th>група</th><th>поле</th><th>агрегат</th><th>робота</th><th>плоша поля</th><th>оброблена площа</th><th>оброблена площа факт</th><th></th><th>примітка</th></tr>");
  let srt_arr = [];
  for (let key in polya_mot) {
      let area = Area_Field_Name(key);
    srt_arr.push([key,area]);
  }
  srt_arr.sort();
  for (let i = 0; i < srt_arr.length; i++) {
    $("#robota_polya_tb").append("<tr><td>-</td><td>+</td><td contenteditable='true'>----</td contenteditable='true'><td contenteditable='true'>----</td contenteditable='true'><td contenteditable='true'>----</td><td contenteditable='true'>----</td><td contenteditable='true'>"+srt_arr[i][0]+"</td><td contenteditable='true'>----</td><td contenteditable='true'>----</td><td contenteditable='true'>"+srt_arr[i][1]+"</td><td contenteditable='true'>----</td><td contenteditable='true'>----</td><td contenteditable='true'>----</td><td contenteditable='true'>----</td></tr>");  
 }
});

function Area_Field_Name(a){
  for (let i = 0; i < geozones.length; i++) {
    let zonee = geozones[i].zone;
    let name = zonee.n;
    if(name ==a){
      let area = (zonee.ar/10000).toFixed(1);
      return area;
    }
 }
 return 0;

}



$("#robota_polya_tb").on("click", function (evt){
  let row = evt.target.parentNode;
  [...document.querySelectorAll("#robota_polya_tb tr")].forEach(e => e.style.backgroundColor = '');
  if(row.rowIndex>0){

     if (evt.target.cellIndex==0){
      row.cells[0].closest('tr').remove();
      return;
     }

     if (evt.target.cellIndex==1){
      let ind =  row.rowIndex;
      let newRow = row.parentNode.insertRow(ind+1);
      newRow.innerHTML = "<tr><td>-</td><td>+</td><td contenteditable='true'>----</td contenteditable='true'><td contenteditable='true'>----</td contenteditable='true'><td contenteditable='true'>----</td><td contenteditable='true'>----</td><td  contenteditable='true'>"+row.cells[6].textContent+"</td><td contenteditable='true'>----</td><td contenteditable='true'>----</td><td  contenteditable='true'>"+row.cells[9].textContent+"</td><td contenteditable='true'>----</td><td contenteditable='true'>----</td><td contenteditable='true'>----</td><td contenteditable='true'>----</td></tr>";
      return;
     }

    row.style.backgroundColor = 'pink';
    let name = row.cells[6].textContent;
     for (let i = 0; i<geozones.length; i++){
     if(geozones[i].zone.n == name){
      let y=geozones[i]._bounds._northEast.lat;
      let x=geozones[i]._bounds._northEast.lng;
      map.setView([y,x+0.025],14,{animate: false});
           geozonepoint.length =0;
           geozonepointTurf.length =0;
           clearGEO();
           if($('#name_pole').text()!=name){
            $('#obrobka').empty();
            $('#obrobkatehnika').empty();
          }
        $('#name_pole').text(name);
        $('#grup_pole').text(geozones[i].gr);
        $('#getary_pole').text(row.cells[9].textContent);
        grup_pole
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
        Naryady_start();
        break;
     }
     }
  }
});


let jurnal_polya_temp='';
$("#reestr_save_BT").on("click", function (evt){
  let cpdata='';
  let save_data='';
  let save_data_jurnal='';
  let seve
  let table_polya=document.getElementById('robota_polya_tb');
  if(table_polya.rows.length>1){
    for(let i = 1; i<table_polya.rows.length; i++){
      if(table_polya.rows[i].cells[2].innerText!='----'){
         cpdata += table_polya.rows[i].cells[2].innerText + '\t' +table_polya.rows[i].cells[3].innerText + '\t' +table_polya.rows[i].cells[4].innerText + ' \t' + table_polya.rows[i].cells[5].innerText + '\t' + table_polya.rows[i].cells[6].innerText.split(' ')[0] + '\t' + table_polya.rows[i].cells[7].innerText +'\t'+ table_polya.rows[i].cells[8].innerText +'\t' + table_polya.rows[i].cells[9].innerText.replace(/\./g, ",") + '\t' + table_polya.rows[i].cells[10].innerText.replace(/\./g, ",") + '\t' + table_polya.rows[i].cells[11].innerText.replace(/\./g, ",") +'\t'+''+'\t'+table_polya.rows[i].cells[12].innerText +'\t'+''+'\t'+''+'\t'+''+'\t'+''+'\t'+''+'\t'+table_polya.rows[i].cells[13].innerText+ '\n';

         let a2 ='-----', a3 = '-----',a4 = '-----',a5 = '-----',a6 = '-----',a7 = '-----',a8 = '-----',a9 = '-----',a10 = '-----',a11 = '-----',a12 = '-----',a13 = '-----',a14 = '-----';
         a2= table_polya.rows[i].cells[2].innerText;
         a3= table_polya.rows[i].cells[3].innerText;
         a4= table_polya.rows[i].cells[4].innerText;
         a5= table_polya.rows[i].cells[5].innerText;
         a6= table_polya.rows[i].cells[6].innerText;
         a7= table_polya.rows[i].cells[7].innerText;
         a8= table_polya.rows[i].cells[8].innerText;
         a9= table_polya.rows[i].cells[9].innerText;
         a10= table_polya.rows[i].cells[10].innerText;
         a11= table_polya.rows[i].cells[11].innerText;
         a12= table_polya.rows[i].cells[12].innerText;
         a13= table_polya.rows[i].cells[13].innerText;
         a14= table_polya.rows[i].cells[14].innerText;

        save_data += '||'+a2 + '|' +a3 + '|' +a4 + '|' + a5 + '|' + a6 + '|' + a7 +'|'+ a8 +'|' + a9 + '|' + a10 + '|' + a11 +'|'+a12 +'|'+a13+'\n'+'||'+a14 +'\n';


         let tx=table_polya.rows[i].cells[6].innerText+table_polya.rows[i].cells[8].innerText+table_polya.rows[i].cells[2].innerText;
         if(jurnal_polya_temp.indexOf(tx)>=0)continue;
          let date=Date.parse(table_polya.rows[i].cells[2].innerText);
          let time=Date.now();
          let name=table_polya.rows[i].cells[6].innerText;
          let text=table_polya.rows[i].cells[8].innerText;
          let autor='Диспетчер';
          jurnal_polya_temp+=tx;
          save_data_jurnal+='||'+date+'|'+name+'|'+text+'|'+autor+'|'+time+'\n';
      }
    }
  }
  write_jurnal(20233,'geomodul.txt',save_data,function () {
  write_jurnal(20233,'jurnal.txt',save_data_jurnal,function () { });
    audio.play();
  });

  if(cpdata!='')navigator.clipboard.writeText(cpdata);


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
   if (parseFloat(this.id.split(',')[1])>0) {
   map.setView([parseFloat(this.id.split(',')[1]), parseFloat(this.id.split(',')[2])+0.05],13,{animate: false}); 
   }
   if ($('#grafik').is(':hidden')) {}else{ show_gr();}
   
  
}

var nav_mark_data=[];
function TestNavigation(data){
  if ($('#unit_info').is(':hidden')) {
      $('#unit_info').show();
      $('#map').css('width', '50%'); 
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
    let iddd = data[i][0][0];
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
       if (!data[i][ii-1][5] || data[i][ii-1][5]=='-----')pos+=10;
       if (pos<0)pos=0;
       if (data[i][ii][0])nav++;
        row++;
      }
      if(pos>600) if(namee.indexOf('CASE')>=0 ||namee.indexOf('NH')>=0 ||namee.indexOf('John')>=0 ||namee.indexOf('JD')>=0 || namee.indexOf('CL')>=0|| namee.indexOf('МТЗ')>=0||namee.indexOf('JCB')>=0|| namee.indexOf('Manitou')>=0 || namee.indexOf('Scorpion')>=0|| namee.indexOf('Камаз')>=0|| namee.indexOf('МАЗ')>=0 || namee.indexOf('SCANIA')>=0)$("#unit_table").append("<tr class='fail_trak' id='"+iddd+"," + 0+","+0+ "'><td align='left'>"+namee+"</td><td></td><td>перевірте ДРП</td></tr>");
      if(row-nav>row*0.5)$("#unit_table").append("<tr class='fail_trak' id='"+iddd+"," + 0+","+0+ "'><td align='left'>"+namee+"</td><td></td><td>перевірте GPS</td></tr>");

      if(namee.indexOf('Ультразвук')>=0 ||namee.indexOf('РЕЗЕРВУАР')>=0||namee.indexOf('ДРП')>=0){
        if(pos>600){$("#unit_table").append("<tr class='fail_trak' id='"+iddd+"," + 0+","+0+ "'><td align='left'>"+namee+"</td><td></td><td>перевірте ДРП</td></tr>");}
       
      }
   
    }
}

$('#prAZS').click(function() { 
  let n=unitsgrup.Заправки;
  if(!n)return;
   SendDataReportInCallback(0,0,n,zvit2,[],0,TestAZS);
});
function TestAZS(data){
  if ($('#unit_info').is(':hidden')) {
      $('#unit_info').show();
      $('#map').css('width', '50%'); 
      $('#men4').css({'background':'#b2f5b4'});
    }
    $("#unit_table").empty();
    $('#marrr').hide();
    $('#option').hide();
    $('#zupinki').hide();
    $('#logistika').hide();
    $('#men3').css({'background':'#e9e9e9'});
    $('#men1').css({'background':'#e9e9e9'});
    
    let dt = unitsgrup.Заправки;

  for(var ii=0; ii < unitslist.length; ii++){
    let nemeee = unitslist[ii].getName();
    if(dt.indexOf(nemeee)>=0){
      if (Date.parse($('#fromtime2').val())/1000-3600> unitslist[ii].getPosition().t){
        $("#unit_table").append("<tr class='fail_trak' id='"+unitslist[ii].getId()+"," + unitslist[ii].getPosition().y+","+unitslist[ii].getPosition().x+ "'><td align='left'>"+unitslist[ii].getName()+"</td><td>"+wialon.util.DateTime.formatTime(unitslist[ii].getPosition().t)+"</td><td>дані не передає</td></tr>");  
          }
    }
    }
   
  
  for (let i = 0; i < data.length; i++) {
    let pos=0;
    let nav=0;
    let row=0;
    let namee = data[i][0][1];
    let iddd = data[i][0][0];
    for (let ii = 1; ii < data[i].length; ii++) {
       if (!data[i][ii-1][5] || data[i][ii-1][5]=='-----')pos++;
       if (data[i][ii][0])nav++;
        row++;
      }
      if(pos>row*0.5) $("#unit_table").append("<tr class='fail_trak' id='"+iddd+"," + 0+","+0+ "'><td align='left'>"+namee+"</td><td></td><td>перевірте ДРП</td></tr>");
      if(row-nav>row*0.5)$("#unit_table").append("<tr class='fail_trak' id='"+iddd+"," + 0+","+0+ "'><td align='left'>"+namee+"</td><td></td><td>перевірте GPS</td></tr>");
   
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
      if(stroka[stroka.length-1]!='зуп'){
      stroka.push('зуп');
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
    $("#unit_table").append("<tr><td>&nbsp&nbsp&nbsp&nbsp&nbsp</td><td>-----------</td><td>--------</td><td>--------</td><td>--------</td><td>---------</td></tr>");
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
            let vodiy = markerr._popup._content.split('<br />')[5];
            let agregat = markerr._popup._content.split('<br />')[4];
            if(agregat)agregat=agregat.split(' ')[0];
            if(!agregat){
              agregat="-----";
              if(namet.indexOf('JCB')>0|| namet.indexOf('Manitou')>0 || namet.indexOf('Scorpion')>0)agregat="навантажник";
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
            
            $("#unit_table").append("<tr class='fail_trak' id='"+unitslist[i].getId()+"," + lat+","+lon+ "'><td bgcolor ="+color+">&nbsp&nbsp&nbsp&nbsp&nbsp</td><td align='left'>"+namet+"</td><td>"+agregat+"</td><td>"+vodiy+"</td><td>"+drp+"</td><td>"+mesto+"</td></tr>");

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
     if(i == garbage.length-1){garbage=[];}
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
  let zliv_data=[];

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
    let p1=0;
    let p2=0;
 
    
    for (let ii = 0; ii<Global_DATA[i].length-1; ii++){
      if(!Global_DATA[i][ii][3])continue;
      if(!Global_DATA[i][ii+1][3])continue;
      if(!Global_DATA[i][ii][2])continue;
      if(!Global_DATA[i][ii+1][2])continue;
      if(!Global_DATA[i][ii][4])continue;
      if(!Global_DATA[i][ii+1][4])continue;
      if(Global_DATA[i][ii][3][0]==0 || Global_DATA[i][ii+1][3][0]==0){
        if(Global_DATA[i][ii][3][0]!=0)continue;
        if(Global_DATA[i][ii][2] !='-----')p1=Global_DATA[i][ii][2];
        if(Global_DATA[i][ii+1][2] !='-----')p2=Global_DATA[i][ii+1][2];

 
        let rashod=(p1-p2)/((Global_DATA[i][ii+1][4]-Global_DATA[i][ii][4])/3600000);
        if(rashod<100 && rashod>-25 && litry==0){
          zup1+=(Global_DATA[i][ii+1][4]-Global_DATA[i][ii][4])/1000; 
          if(litry0==0)litry0=p1;
        }
        if(rashod>150){
          if(zup1>=t_pod){
            if(litry_start==0)litry_start=p1;
            litry=litry_start-p2;
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
        if(rashod<100 && rashod>-25 && litry>0){
          zup2+=(Global_DATA[i][ii+1][4]-Global_DATA[i][ii][4])/1000; 
          if(zup2>=t_pod){
            litry1=litry0-p1;
            if(litry>min_sliv/2 && litry1>min_sliv){
              zliv_data.push([id,Global_DATA[i][ii][0].split(',')[0],Global_DATA[i][ii][0].split(',')[1],nametr,start,finish,litry.toFixed(1),(interval1-interval0)/1000]);
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
  
  zliv_data = zliv_data.sort((a, b) => new Date(a[4]) - new Date(b[4]));
  for (let i = 0; i<zliv_data.length; i++){
    let col = 'pink';
    for (let ii = 0; ii<sliv_history.length; ii++){
      if(sliv_history[ii]==zliv_data[i][3]+zliv_data[i][4])col='';
      }
    $("#unit_table").append("<tr style = 'background:"+col+";' class='sliv_trak' id='"+zliv_data[i][0]+"," + zliv_data[i][1]+","+zliv_data[i][2]+ "'><td align='left'>"+zliv_data[i][3]+"</td><td>"+zliv_data[i][4]+"</td><td>"+zliv_data[i][5]+"</td><td>"+zliv_data[i][6]+"л </td><td>"+zliv_data[i][7]+" сек </td></tr>");
  }
  
 }





 let sliv_history=[];
let svdata22 = JSON.parse(localStorage.getItem('arhivsliv'));
if(svdata22)sliv_history=svdata22;

   function track_Sliv(evt){
    [...document.querySelectorAll("#unit_table tr")].forEach(e => e.style.border= '1px solid rgb(0, 0, 0)');
    this.style.border = '2px solid rgb(78, 78, 78)';
    this.style.backgroundColor = '';
    let row = evt.target.parentNode; // get row with data by target parentNode
    let data=row.cells[1].textContent;
    let data2=row.cells[2].textContent;

    sliv_history.push(row.cells[0].textContent+row.cells[1].textContent);
    if(sliv_history.length>1000){sliv_history.shift();}
    localStorage.setItem('arhivsliv', JSON.stringify(sliv_history)); 
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
   
       if(parseInt(Global_DATA[i][ii][3])<5){ 
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

       if(ii==Global_DATA[i].length-2){
        if(stoyanka>sttime){ 
          let y = parseFloat(Global_DATA[i][ii-1][0].split(',')[0]);
          let x = parseFloat(Global_DATA[i][ii-1][0].split(',')[1]);
          if(!x) x = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
          if(!y) y = parseFloat(Global_DATA[i][ii][0].split(',')[1]);
          for (let j = 0; j<stor.length; j++){
            if(wialon.util.Geometry.getDistance(y,x,stor[j][0],stor[j][1])<stor[j][2]){
              adres=stor[j][3];
              if(adres0!=adres){
                html+="<span style = 'background:rgb(170, 248, 170);'> "+adres+"</span> -";
                adres0=adres;
              }
              break;
            }
            if(j ==stor.length-1){
              for (let jj = 0; jj<temp_stor.length; jj++){
                if(wialon.util.Geometry.getDistance(y,x,temp_stor[jj][0],temp_stor[jj][1])<temp_stor[jj][2]){
                  adres=temp_stor[jj][3];
                  if(adres0!=adres){
                    html+=" "+adres+" -";
                    adres0=adres;
                  }
                  break;
                }
                if(jj ==temp_stor.length-1){
                  adres='НЕВІДОМО';
                  wialon.util.Gis.getLocations([{lat: y, lon: x}], function(code, data) {
                    if (code) { msg(wialon.core.Errors.getErrorText(code));adres='НЕВІДОМО'; return; } // exit if error code
                    if (data) {let adr =data[0].split(', '); adres =adr[adr.length-1].replace(/[0-9]| km from |\.|\s/g, '');}});
                  await sleep(500); 
                  if(adres0!=adres){
                    html+=" "+adres+" -";
                    adres0=adres;
                  }
                  temp_stor.push([y, x,600,adres]);
                  //L.marker([y,x]).addTo(map);
                }
              }     
            }
          }
        }

       }

       if(parseInt(Global_DATA[i][ii][3])>=5){
        if(!Global_DATA[i][ii][0])continue;
        if(!Global_DATA[i][ii-1][0])continue;
        if(!Global_DATA[i][ii+1][0])continue;
        if (start==0)start=Global_DATA[i][ii][1];
        end=Global_DATA[i][ii][1];
       
       
        if(stoyanka>sttime){ 
            let y = parseFloat(Global_DATA[i][ii-1][0].split(',')[0]);
            let x = parseFloat(Global_DATA[i][ii-1][0].split(',')[1]);
            if(!x) x = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
            if(!y) y = parseFloat(Global_DATA[i][ii][0].split(',')[1]);
            for (let j = 0; j<stor.length; j++){
              if(wialon.util.Geometry.getDistance(y,x,stor[j][0],stor[j][1])<stor[j][2]){
                adres=stor[j][3];
                if(adres0!=adres){
                  html+="<span style = 'background:rgb(170, 248, 170);'> "+adres+"</span> -";
                  adres0=adres;
                }
                break;
              }
              if(j ==stor.length-1){
                for (let jj = 0; jj<temp_stor.length; jj++){
                  if(wialon.util.Geometry.getDistance(y,x,temp_stor[jj][0],temp_stor[jj][1])<temp_stor[jj][2]){
                    adres=temp_stor[jj][3];
                    if(adres0!=adres){
                      html+=" "+adres+" -";
                      adres0=adres;
                    }
                    break;
                  }
                  if(jj ==temp_stor.length-1){
                    adres='НЕВІДОМО';
                    wialon.util.Gis.getLocations([{lat: y, lon: x}], function(code, data) {
                      if (code) { msg(wialon.core.Errors.getErrorText(code));adres='НЕВІДОМО'; return; } // exit if error code
                      if (data) {let adr =data[0].split(', '); adres =adr[adr.length-1].replace(/[0-9]| km from |\.|\s/g, '');}});
                    await sleep(500); 
                    if(adres0!=adres){
                      html+=" "+adres+" -";
                      adres0=adres;
                    }
                    temp_stor.push([y, x,600,adres]);
                    //L.marker([y,x]).addTo(map);
                  }
                }     
              }
            }
          }else{
            if(ii<31)continue;
            if(ii>Global_DATA[i].length-11)continue;
            if(stoyanka==0)continue;
        
            let y0 = 0;
            let x0 = 0;
            let y1 = parseFloat(Global_DATA[i][ii-1][0].split(',')[0]);
            let x1 = parseFloat(Global_DATA[i][ii-1][0].split(',')[1]);
            if(!x1) x1 = parseFloat(Global_DATA[i][ii][0].split(',')[0]);
            if(!y1) y1 = parseFloat(Global_DATA[i][ii][0].split(',')[1]);
            let y2 = 0;
            let x2 = 0;
            
        
                let b0=100;
                let b1=50;
                let b00=100;
                let b11=50;
                outer:for (let v = 1; v<1000; v++){
               
                  if(Global_DATA[i].length-1<ii+v)break;
                  if(!Global_DATA[i][ii+v][0])continue;
                  if(parseInt(Global_DATA[i][ii+v][3])<=5)continue;
                  let yt = parseFloat(Global_DATA[i][ii+v][0].split(',')[0]);
                  let xt = parseFloat(Global_DATA[i][ii+v][0].split(',')[1]);
                  if(wialon.util.Geometry.getDistance(yt,xt,y1,x1)>30){
                    for (let vv = 1; vv<1000; vv++){
                      if(ii-vv<5)break outer;
                      if(!Global_DATA[i][ii-vv][0])continue;
                      if(parseInt(Global_DATA[i][ii-vv][3])<=5)continue;
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
                        //L.polyline([[y0, x0],[y1, x1]], {color: 'blue'}).addTo(map);
                        //L.polyline([[y1, x1],[y2, x2]], {color: 'red'}).addTo(map);
                         b0 = turf.bearing(p1, p0);
                         b1 = turf.bearing(p1, p2);
                         break outer;
                      }
                    }
                  }
                }

                outer:for (let v = 1; v<1000; v++){
               
                  if(Global_DATA[i].length-1<ii+v)break;
                  if(!Global_DATA[i][ii+v][0])continue;
                  if(parseInt(Global_DATA[i][ii+v][3])<=5)continue;
                  let yt = parseFloat(Global_DATA[i][ii+v][0].split(',')[0]);
                  let xt = parseFloat(Global_DATA[i][ii+v][0].split(',')[1]);
                  if(wialon.util.Geometry.getDistance(yt,xt,y1,x1)>60){
                    for (let vv = 1; vv<1000; vv++){
                      if(ii-vv<5)break outer;
                      if(!Global_DATA[i][ii-vv][0])continue;
                      if(parseInt(Global_DATA[i][ii-vv][3])<=5)continue;
                      let ytt = parseFloat(Global_DATA[i][ii-vv][0].split(',')[0]);
                      let xtt = parseFloat(Global_DATA[i][ii-vv][0].split(',')[1]);    
                      if(wialon.util.Geometry.getDistance(ytt,xtt,y1,x1)>60){
                       
                        let p0 = turf.point([xt, yt]);
                        let p1 = turf.point([x1, y1]);
                        let p2 = turf.point([xtt, ytt]);
                        x0=xt;
                        y0=yt;
                        x2=xtt;
                        y2=ytt;
                        //L.polyline([[y0, x0],[y1, x1]], {color: 'blue'}).addTo(map);
                        //L.polyline([[y1, x1],[y2, x2]], {color: 'red'}).addTo(map);
                         b00 = turf.bearing(p1, p0);
                         b11 = turf.bearing(p1, p2);
                         break outer;
                      }
                    }
                  }
                }
  
                if(Math.abs(b0-b1)<30 || Math.abs(b0-b1)>330 || Math.abs(b00-b11)<30 || Math.abs(b00-b11)>330){ 
              //L.polyline([[y0, x0],[y1, x1]], {color: '#55ff33'}).addTo(map);
              //L.polyline([[y1, x1],[y2, x2]], {color: '#55ff33'}).addTo(map);
              
              for (let j = 0; j<stor.length; j++){
                if(wialon.util.Geometry.getDistance(y1,x1,stor[j][0],stor[j][1])<stor[j][2]){
                  adres=stor[j][3];
                  if(adres0!=adres){
                    html+="<span style = 'background:rgb(170, 248, 170);'> "+adres+"</span> -";
                    adres0=adres;
                  }
                  break;
                }
                if(j ==stor.length-1){
                  for (let jj = 0; jj<temp_stor.length; jj++){
                    if(wialon.util.Geometry.getDistance(y1,x1,temp_stor[jj][0],temp_stor[jj][1])<temp_stor[jj][2]){
                      adres=temp_stor[jj][3];
                      if(adres0!=adres){
                        html+=" "+adres+" -";
                        adres0=adres;
                      }
                      break;
                    }
                    if(jj ==temp_stor.length-1){
                      adres='НЕВІДОМО';
                      wialon.util.Gis.getLocations([{lat: y1, lon: x1}], function(code, data) {
                        if (code) { msg(wialon.core.Errors.getErrorText(code));adres='НЕВІДОМО'; return; } // exit if error code
                        if (data) {let adr =data[0].split(', '); adres =adr[adr.length-1].replace(/[0-9]| km from |\.|\s/g, '');}});
                      await sleep(500); 
                      if(adres0!=adres){
                        html+=" "+adres+" -";
                        adres0=adres;
                      }
                      temp_stor.push([y1, x1,600,adres]);
                      //L.marker([y1,x1]).addTo(map);
                    }
                  }     
                }
              }
            }
          }
          stoyanka=0;
          points=0;
          adres='';
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
                 if (data.type =="unclassified")type="невідомо"
                 if (data.type =="residential")type="жила зона"
                 if (data.type =="apartments")type="жила зона"
                 if (data.type =="primary")type="дорога"
                 if (data.type =="secondary")type="дорога"
                 if (data.type =="trunk")type="дорога"
                 if (data.type =="post_office")type="пошта"
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
      let str0='';
      let str;
      let vibor = $("#m_lis").chosen().val();
      for(var i=0; i < vibor.length; i++){
        if(unitsgrup[vibor[i]]){
          if (i==0){ 
             str0 += unitsgrup[vibor[i]];
             }else{
             str0 += ','+unitsgrup[vibor[i]];
             }
      }
      }
      str = str0.split(',');
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
                  if(stroka[stroka.length-1]!='зуп'){
                  stroka.push('зуп');
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
let tb = document.getElementById("monitoring_table");
let tb_data=[];
let kx=0;
  for (let j = 0; j<tb.rows.length; j++){
    if(tb.rows[j].id=='3333')continue;
    tb_data.push([tb.rows[j].cells[0].textContent.split(' ')[0],tb.rows[j]]);
    }
    $("#monitoring_table").empty();
    for(var i=0; i < vibor.length; i++){
      if(unitsgrup[vibor[i]]){
        let dt = unitsgrup[vibor[i]];
        $("#monitoring_table").append("<tr id='3333' style = 'background:rgb(142,255,246);'><td>"+vibor[i]+"</td></tr>");
     kx=0;
          for(var iii=0; iii < tb_data.length; iii++){
            if(dt.indexOf(tb_data[iii][0])>=0){
              $("#monitoring_table").append(tb_data[iii][1]);
              kx++;
            }
          }
          if(kx==0){ 
            tb.rows[tb.rows.length - 1].remove();
          }else{
            tb.rows[tb.rows.length - 1-kx].cells[0].innerText = vibor[i]+' ('+kx+')';
          }
        
    }
    }
  
$('#men7').css({'background':'#fffd7e'});
}
$('#bbd').click(function() {
  let n=unitsgrup.легкові_нові;
  if(!n)return;
  let fr =Date.parse($('#obd_time1').val())/1000;
  let to =Date.parse($('#obd_time2').val())/1000;
  if(!fr){fr=0; to=0;}
   SendDataReportInCallback(fr,to,n,zvit2,[],0,avto_OBD);
  });
function avto_OBD(data){
  $("#unit_table").empty();
  $("#unit_table").append("<tr><td>ТЗ</td><td>пробіг по треку км.</td><td>пробіг по одометру км.</td><td>мотогодини</td><td>холостий хід</td><td>холостий хід більше 5хв</td><td>максимальна швидкість</td><td>швидкість > 110 понад 1хв</td><td>витрата пального л.</td><td>витрата пального л/100км</td><td>заправлено л.</td></tr>");
  for (let i = 0; i<data.length; i++){
    let name = data[i][0][1];
    let hl0 = 0;
    let hl1 = 0;
    let st = 0;
    let km = 0;
    let km_odo_start = 0;
    let km_odo = 0;
    let moto_hr = 0;
    let sped_hr_interval = 0;
    let sped_hr = 0;
    let sped_max=0;
    let dut0=-10;
    let dut1=-10;
    let zapr0=-10;
    let zapr1=-10;
    let zapr=0;
    for (let ii = 1; ii<data[i].length-1; ii++){
      if(!data[i][ii][1])continue;
      if(!data[i][ii+1][1])continue;
      if(!data[i][ii][0])continue;
      if(!data[i][ii+1][0])continue;

      if(data[i][ii][6]){
        if(data[i][ii][6]!='-----'){
          if(dut0==-10)dut0 = parseFloat(data[i][ii][6]);
          dut1 = parseFloat(data[i][ii][6]);
        }
      }
      if(parseInt(data[i][ii][2])>0){
        if(data[i][ii][6] && data[i][ii][6]!='-----'){
          zapr1= parseFloat(data[i][ii][6]);
          if(zapr0==-10){zapr0 = parseFloat(data[i][ii][6]);}
          }
      }else{
        if(zapr0>=0 && zapr1>=0){
          if(zapr1-zapr0>5)zapr+=zapr1-zapr0;
          zapr0=zapr1;
        }
      }
      if(ii==data[i].length-2 && zapr0>=0 && parseInt(data[i][ii][2])==0){
        zapr1= parseFloat(data[i][ii][6]);
        if(zapr1-zapr0>5)zapr+=zapr1-zapr0;
      }

      if(!data[i][ii][19])continue;
      if(!data[i][ii+1][19])continue;
      if(parseInt(data[i][ii][21])){
        if(km_odo_start==0) km_odo_start = parseInt(data[i][ii][21]);
        km_odo = parseInt(data[i][ii][21])-km_odo_start;
      }
      
      let time1 = Date.parse(data[i][ii][1])/1000;
      let time2 = Date.parse(data[i][ii+1][1])/1000;
      let rpm1 = parseInt(data[i][ii][19]);
      let rpm2 = parseInt(data[i][ii+1][19]);
      let y = parseFloat(data[i][ii][0].split(',')[0]);
      let x = parseFloat(data[i][ii][0].split(',')[1]);
      let yy = parseFloat(data[i][ii+1][0].split(',')[0]);
      let xx = parseFloat(data[i][ii+1][0].split(',')[1]);
      
      let d = wialon.util.Geometry.getDistance(y,x,yy,xx);
      if(d<60000)km+=wialon.util.Geometry.getDistance(y,x,yy,xx);
      
      let sped = parseInt(data[i][ii][2]);
      if(sped>sped_max)sped_max=sped;
      if(sped>110){
        sped_hr_interval+=time2-time1;
        if(sped_hr_interval>61){
          sped_hr+=time2-time1;
          if($("#bbd_chek").is(":checked")){
            let l = L.polyline([[y,x],[yy,xx]], {color: 'red',weight:8,opacity:0.7}).bindTooltip(''+name+'<br />'+sped+'км/год',{opacity:0.7}).addTo(map);

            zup_mark_data.push(l);
          }
        
        }
      }else{
        sped_hr_interval=0;
      }

      if(!rpm1)continue;
      if(!rpm2)continue;
        if(rpm1>300 && rpm2>300){moto_hr+= time2-time1;}     
      if(y==yy && x==xx ){
        if(rpm1>300 && rpm2>300){
          st+=time2-time1;
          hl0+=time2-time1;     
        if(st>300)hl1+=time2-time1;
        }
      }else{
        if(st>300 && d>1000){
        hl1-=st-300;
        hl0-=st;
        }else{
          if($("#bbd_chek").is(":checked") && st>300){
            let mark = L.marker([y, x], {
              zIndexOffset:-1000,
              draggable: true,
              icon: L.icon({
              iconUrl: '111.png',
              iconSize:   [24, 24],
              iconAnchor: [12, 24] // set icon center
              })
              }).bindTooltip(''+name+'<br />'+sec_to_time(st-300),{opacity:0.7}).addTo(map);
    zup_mark_data.push(mark);
          }
        }

        st=0;
      }
     

  }   

  if(dut0>=0 && dut1>=0){dut0=dut0-dut1+zapr;}else{dut0=0;}
  let sr = dut0/km_odo*100;
  if(!sr || sr=='Infinity'){sr ="----";}else{sr = sr.toFixed(2).toString().replace(/\./g, ",");}
  if(hl1>0){hl1 =sec_to_time(hl1);}else{hl1 = "----";}
  if(sped_hr>0){sped_hr =sec_to_time(sped_hr);}else{sped_hr = "----";}


  $("#unit_table").append("<tr><td align='left'>"+name+"</td><td>"+ (km/1000).toFixed()+"</td><td>"+km_odo+"</td><td>"+sec_to_time(moto_hr)+"</td><td>"+sec_to_time(hl0)+"</td><td>"+hl1+"</td><td>"+sped_max+"</td><td>"+sped_hr+"</td><td>"+dut0.toFixed(2).toString().replace(/\./g, ",")+"</td><td>"+sr+"</td><td>"+zapr.toFixed(2).toString().replace(/\./g, ",")+"</td></tr>");
  }
}
function sec_to_time(sek){
  let m = Math.trunc(sek / 60) + '';
  let h = Math.trunc(m / 60) + '';
  m=(m % 60) + '';
  let s =(sek % 60) + '';
  let time = h.padStart(2, 0) + ':' + m.padStart(2, 0) +':'+s.padStart(2, 0);
  return time
}

$('#polya_kkz').click(function() {
  $("#unit_table").empty();
  $("#unit_table").append("<tr><td>№</td><td>НАЗВА</td><td>ПЛОЩА</td><td>ГРУПА</td></tr>");
  for (let i = 0; i<geozones.length; i++){
    $("#unit_table").append("<tr><td>"+(i+1)+"</td><td>"+geozones[i].zone.n+"</td><td>"+(geozones[i].zone.ar/10000).toFixed(1).toString().replace(/\./g, ",")+"</td><td>"+geozones[i].gr+"</td></tr>");
  }
  });
$('#trailers_kkz').click(function() {
  $("#unit_table").empty();
  $("#unit_table").append("<tr><td>№</td><td>назва</td><td>код</td><td>поточна техніка</td><td>остання техніка</td></tr>");
  for (key in trailers) {
    let trl = trailers[key];
    let now="----";
    let then="----";
    if(unitslistID[parseInt(trl.bu)]) now = unitslistID[parseInt(trl.bu)].getName();
    if(unitslistID[parseInt(trl.pu)]) then = unitslistID[parseInt(trl.pu)].getName();
    $("#unit_table").append("<tr><td>"+key+"</td><td>"+trl.n+"</td><td>"+trl.c+"</td><td>"+now+"</td><td>"+then+"</td></tr>");
  }
  });
$('#vodiyi_kkz').click(function() {
  $("#unit_table").empty();
  $("#unit_table").append("<tr><td>№</td><td>назва</td><td>код</td><td>телефон</td><td>поточна техніка</td><td>остання техніка</td></tr>");
  for (key in drivers) {
    let drv = drivers[key];
    let now="----";
    let then="----";
    if(unitslistID[parseInt(drv.bu)]) now = unitslistID[parseInt(drv.bu)].getName();
    if(unitslistID[parseInt(drv.pu)]) then = unitslistID[parseInt(drv.pu)].getName();
    $("#unit_table").append("<tr><td>"+key+"</td><td>"+drv.n+"</td><td>"+drv.c+"</td><td>"+drv.p+"</td><td>"+now+"</td><td>"+then+"</td></tr>");
  }
  });
  $('#transport_kkz').click(function() {
    $("#unit_table").empty();
    $("#unit_table").append("<tr><td>№</td><td>назва</td><td>латинські букви в номері</td><td>букви</td></tr>");
    for (let i = 0; i < unitslist.length; i++) {
      let name = unitslist[i].getName();
      let nomer = name.split(' ')[0];
      let name_test = /[a-z]/i.test(name.split(' ')[0]);
      let aa='';
      let corektno = 'відсутні';
      if(name_test){
        corektno = 'присутні';
        let nomerchar = nomer.split('');
        for (let ii = 0; ii < nomerchar.length; ii++) {
          if(nomerchar[ii].charCodeAt(0)>=64 && nomerchar[ii].charCodeAt(0)<=90)aa+=nomerchar[ii];
        }
      }
      $("#unit_table").append("<tr><td>"+(i+1)+"</td><td>"+name+"</td><td>"+corektno+"</td><td>"+aa+"</td></tr>");
    }
    });
  $('#track_lis_bt2').click(function() {
    let to = Date.parse($('#track_time2').val())/1000; // end of day in seconds
    let fr = Date.parse($('#track_time1').val())/1000; // get begin time - beginning of day
    if(!fr){fr=0; to=0;}
    let str='';
    let vibor = $("#track_lis").chosen().val();
    if(vibor){
      for(var i=0; i < vibor.length; i++){
        if(unitsgrup[vibor[i]]){
          if (i==0){ 
         str += unitsgrup[vibor[i]];
         }else{
         str += ','+unitsgrup[vibor[i]];
         }
  }
  }
}else{
  if($("#lis0 :selected").html()=='—')return;
  str = $("#lis0 :selected").html();
}
    SendDataReportInCallback(fr,to,str,zvit2,[],0,show_all_tracks_data);
    });

    function show_all_tracks_data(data){
      $("#unit_table").empty();
      clear();
      let trak_color = Math.floor(Math.random() * 360);
      for (let i = 0; i<data.length; i++){
        let name = data[i][0][1];
        let line =[];
        let km = 0;
        let kk=0;

        for (let ii = 1; ii<data[i].length-1; ii++){
          if(!data[i][ii][0])continue;
          if(!data[i][ii+1][0])continue;
          if(!data[i][ii][2])continue;

          if(parseInt(data[i][ii][2])==0)continue;
          kk++;
          let vod = data[i][ii][3];
          let dat = data[i][ii][1];

          let y = parseFloat(data[i][ii][0].split(',')[0]);
          let x = parseFloat(data[i][ii][0].split(',')[1]);

          let yy = parseFloat(data[i][ii+1][0].split(',')[0]);
          let xx = parseFloat(data[i][ii+1][0].split(',')[1]);

          km += wialon.util.Geometry.getDistance(y,x,yy,xx);
            line.push ([y,x]);

            if(kk>20){
              let l = L.polyline([line], {color: `hsl(${245}, ${100}%, ${45}%)`,weight:1,opacity:1}).bindTooltip(''+dat+'<br>'+name+'<br>'+vod+'',{opacity:0.8, sticky: true}).addTo(map);
              l.name = name;
              temp_layer.push(l);
              kk=0;
              line=[];
              line.push ([y,x]);
            }

        }
        if(line.length>0){
          trak_color += 60+Math.floor(Math.random() * 30);
          let l = L.polyline([line], {color: `hsl(${245}, ${100}%, ${45}%)`,weight:1,opacity:1}).bindTooltip(''+name+'',{opacity:0.8, sticky: true}).addTo(map);
          l.name = name;
          temp_layer.push(l);
        }

        $("#unit_table").append("<tr><td>"+name+"</td><td>"+(km/1000).toFixed(1)+" км</td></tr>");

      }
    }


$('#track_lis_bt').click(function() {
  $("#unit_table").empty();
  clear();
  let sess = wialon.core.Session.getInstance(); // get instance of current Session	
  let renderer = sess.getRenderer();
  renderer.removeAllLayers(function(code) { 
    if (code) 
      msg(wialon.core.Errors.getErrorText(code)); // exit if error code
    else 
      msg("Track removed."); // else send message, then ok
  });
  let to = Date.parse($('#track_time2').val())/1000; // end of day in seconds
  let fr = Date.parse($('#track_time1').val())/1000; // get begin time - beginning of day
  let trak_color = Math.floor(Math.random() * 360);
  
  if(!fr){fr=0; to=0;}
  let str='';
  let vibor = $("#track_lis").chosen().val();
  if(vibor){
    for(var i=0; i < vibor.length; i++){
      if(unitsgrup[vibor[i]]){
        if (i==0){ 
           str += unitsgrup[vibor[i]];
           }else{
           str += ','+unitsgrup[vibor[i]];
           }
    }
    }
  }else{
    if($("#lis0 :selected").html()=='—')return;
    str = $("#lis0 :selected").html();
  }
   str = str.split(',');
  for (let i = 0; i < unitslist.length; i++) {
    let unit =false;
    str.forEach((element) => {if(unitslist[i].getName().indexOf(element)>=0){unit = true;}});
    if(unit==false)continue;
    trak_color += 60+Math.floor(Math.random() * 30);
    let colorr = HSLToHex(trak_color,100,40);
    show_all_tracks(unitslist[i].getId(),fr,to,colorr);
    
  }
  });

  function HSLToHex(h,s,l) {  
    const hDecimal = l / 100;
    const a = (s * Math.min(hDecimal, 1 - hDecimal)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = hDecimal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  
      // Convert to Hex and prefix with "0" if required
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `${f(0)}${f(8)}${f(4)}`;
  }

   function show_all_tracks (unit_id,from,to,colorr) {

      let sess = wialon.core.Session.getInstance(); // get instance of current Session	
      let renderer = sess.getRenderer();
      let callback =  qx.lang.Function.bind(function(code, layer) {
        
        if (code) { msg(wialon.core.Errors.getErrorText(code)); return; } // exit if error code
        if (layer) {  
          if (map) {  
            if (!tile_layer)
              tile_layer = L.tileLayer(sess.getBaseUrl() + "/adfurl" + renderer.getVersion() + "/avl_render/{x}_{y}_{z}/"+ sess.getId() +".png", {zoomReverse: true, zoomOffset: -1,zIndex: 3}).addTo(map);
            else 
              tile_layer.setUrl(sess.getBaseUrl() + "/adfurl" + renderer.getVersion() + "/avl_render/{x}_{y}_{z}/"+ sess.getId() +".png");  
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
      "trackColor": colorr, //track color in ARGB format (A - alpha channel or transparency level)
      "trackWidth": 2, // track line width in pixels
      "arrows": 1, //show course of movement arrows: 0 - no, 1 - yes
      "points": 0, // show points at places where messages were received: 0 - no, 1 - yes
      "pointColor": colorr, // points color
      "annotations": 0 //show annotations for points: 0 - no, 1 - yes

    };
    renderer.createMessagesLayer(params, callback);
  }


  //==========================================PLANUVANNYA========================================================================================
  //==========================================================================================================================================================================
  //==========================================================================================================================================================================
  //==========================================================================================================================================================================
  //==========================================================================================================================================================================
let krolevec =[ [51.5509,33.3895],[51.5489,33.3847],[51.5526,33.3840],[51.5544,33.3895],[51.5528,33.3947],[51.5491,33.3941],[51.5467,33.3893],[51.5453,33.3832],[51.5504,33.3785],[51.5566,33.3842],[51.5567,33.3943],[51.5506,33.4002],[51.5453,33.3948],[51.5427,33.3887],[51.5470,33.3780],[51.5542,33.3789],[51.5581,33.3893],[51.5545,33.4001],[51.5469,33.4003],[51.5412,33.3941],[51.5415,33.3826],[51.5490,33.3728],[51.5582,33.3787],[51.5600,33.3941],[51.5524,33.4058],[51.5433,33.3996],[51.5393,33.3881],[51.5435,33.3776],[51.5454,33.3724],[51.5528,33.3736],[51.5597,33.3838],[51.5581,33.4000],[51.5489,33.4050],[51.5451,33.4051],[51.5615,33.3888],[51.5564,33.3730],[51.5561,33.4054],[51.5617,33.3991],[51.5638,33.3938],[51.5595,33.4052],[51.5545,33.4102],[51.5502,33.4102],[51.5650,33.3990],[51.5379,33.3935],[51.5416,33.4039],[51.5469,33.4097],[51.5647,33.3886],[51.5615,33.3795],[51.5580,33.4102],[51.5430,33.4093],[51.5392,33.3990],[51.5627,33.4046],[51.5562,33.4154],[51.5525,33.4151],[51.5485,33.4152],[51.5674,33.3941],[51.5616,33.4105],[51.5598,33.4155]];
let kkz = [[51.5541,33.3295],[51.5540,33.3263],[51.5558,33.3280],[51.5558,33.3313],[51.5539,33.3328],[51.5522,33.3310],[51.5524,33.3278],[51.5557,33.3247],[51.5558,33.3346],[51.5505,33.3293],[51.5508,33.3256],[51.5571,33.3329],[51.5542,33.3224],[51.5522,33.3343],[51.5574,33.3264],[51.5504,33.3324],[51.5524,33.3238],[51.5579,33.3297],[51.5540,33.3359],[51.5573,33.3230],[51.5507,33.3224],[51.5590,33.3249],[51.5556,33.3376],[51.5523,33.3205],[51.5558,33.3209],[51.5540,33.3185],[51.5595,33.3281],[51.5590,33.3323],[51.5589,33.3218],[51.5574,33.3191],[51.5556,33.3171],[51.5583,33.3354],[51.5609,33.3257],[51.5489,33.3242],[51.5490,33.3275],[51.5490,33.3206],[51.5522,33.3171],[51.5505,33.3187],[51.5540,33.3149],[51.5607,33.3222],[51.5573,33.3161],[51.5608,33.3308],[51.5592,33.3189],[51.5560,33.3137],[51.5523,33.3136],[51.5540,33.3114],[51.5622,33.3283],[51.5592,33.3156],[51.5582,33.3126],];
let gluhiv =[[51.6805,33.9381],[51.6849,33.9379],[51.6753,33.9381],[51.6826,33.9309],[51.6779,33.9450],[51.6826,33.9444],[51.6780,33.9320],[51.6875,33.9449],[51.6865,33.9314],[51.6742,33.9312],[51.6802,33.9252],[51.6801,33.9510],[51.6741,33.9441],[51.6895,33.9375],[51.6717,33.9378],[51.6847,33.9509],[51.6846,33.9250],[51.6756,33.9248],[51.6915,33.9435],[51.6904,33.9303],[51.6893,33.9523],[51.6931,33.9503],[51.6934,33.9360],[51.6958,33.9437],[51.6867,33.9575],[51.6825,33.9579],[51.6753,33.9510],[51.6775,33.9583],[51.6941,33.9296],[51.6977,33.9374],[51.6974,33.9508],[51.7004,33.9444],[51.6923,33.9566],[51.6962,33.9581],[51.6899,33.9620],[51.6939,33.9644],[51.7001,33.9567],[51.7019,33.9502],[51.6852,33.9634],[51.6801,33.9640],[51.6718,33.9487],[51.6727,33.9568],[51.6745,33.9624],[51.6880,33.9678],[51.6916,33.9695],[51.6975,33.9640],[51.6957,33.9709],[51.6768,33.9686],[51.6827,33.9696],[51.6978,33.9308],[51.7019,33.9375],[51.7047,33.9448],[51.7037,33.9557],[51.7064,33.9509],[51.7016,33.9635]]
let gluhiv_atb =[[51.6795,33.9050],[51.6830,33.9048],[51.6811,33.8993],[51.6850,33.8993],[51.6769,33.8993],[51.6830,33.8929],[51.6789,33.8929],[51.6871,33.8930],[51.6882,33.8989],[51.6870,33.9049],[51.6853,33.8878],[51.6811,33.8880],[51.6755,33.8939],[51.6772,33.8881],[51.6832,33.8825],[51.6792,33.8824],[51.6757,33.8827],[51.6737,33.8880],[51.6869,33.8822],[51.6891,33.8879],[51.6907,33.8942],[51.6850,33.8772],[51.6813,33.8771],[51.6776,33.8769],[51.6885,33.8769],[51.6907,33.8826],[51.6928,33.8890],[51.6796,33.8723],[51.6831,33.8717],[51.6941,33.8836],[51.6866,33.8718],[51.6920,33.8774],[51.6903,33.8712],[51.6938,33.8724],[51.6954,33.8781],[51.6927,33.8671],[51.6879,33.8661],[51.6847,33.8667],[51.6813,33.8672],[51.6780,33.8672]];
let post_gluhiv = [[51.7205,33.8833],[51.7229,33.8813],[51.7190,33.8784],[51.7177,33.8854],[51.7223,33.8879],[51.7238,33.8848],[51.7214,33.8781],[51.7173,33.8814],[51.7199,33.8877],[51.7236,33.8776],[51.7200,33.8745],[51.7167,33.8778],[51.7243,33.8880],[51.7249,33.8821],[51.7157,33.8838],[51.7179,33.8894]];
let vilne = [[51.5949,33.0300],[51.5981,33.0300],[51.5950,33.0244],[51.5950,33.0354],[51.5920,33.0301],[51.5973,33.0344],[51.5923,33.0255],[51.5978,33.0254],[51.5926,33.0343]];
  function planuvannya_start(){
    clearGarbage(logistik_treck);
    $("#unit_table").append("<tr><td></td><td></td><td><b>№</b></td><td>&nbsp&nbsp&nbsp&nbsp</td><td><b>ТЗ</b></td><td><b>агрегат</b></td><td><b>локація</b></td><td><b>відвезти</b></td><td><b>адреса</b></td><td><b>забрати</b></td><td><b>адреса</b></td></tr>");
    //for(let i = 0; i<10; i++){
      //$("#unit_table").append("<tr><td>"+(i+1)+"</td><td style ='background-color:rgb(255, 0, 0)'>&nbsp&nbsp&nbsp&nbsp</td><td  contenteditable='true'>ККЗ</td><td contenteditable='true'>-----</td></tr>");
    //}
  }

let logistik_treck =[];
let mehanizator_adresa=[];
let point_planuvannya_list = [];
  function planuvannya_marshrutiv(data,col){
    clearGarbage(logistik_treck);
    let table_plan=document.getElementById('unit_table');

let tochki_krolevec = 0;
let tochki_gluhiv = 0;
let tochki_kkz =0;
let tochki_gluhiv_atb =0;
let tochki_post_gluhiv =0;
let tochki_vilne =0;

let poly = [];
let kk=0;
let kkk=0;
if(data){
for(let i = 0; i<data._latlngs[0].length; i++){
poly.push({x:data._latlngs[0][i].lat, y:data._latlngs[0][i].lng})
}
let center = data.getBounds().getCenter();
let str='';
let vibor = $("#planuvannya_lis").chosen().val();
if(vibor){
  for(var i=0; i < vibor.length; i++){
    if(unitsgrup[vibor[i]]){
      if (i==0){ 
         str += unitsgrup[vibor[i]];
         }else{
         str += ','+unitsgrup[vibor[i]];
         }
  }
  }
}else{
  if($("#lis0 :selected").html()=='—')return;
  str = $("#lis0 :selected").html();
}

 str = str.split(',');
for(let i = 0; i<unitslist.length; i++){
  let namet = unitslist[i].getName();
  let id = unitslist[i].getId();
  let unit =false;
  str.forEach((element) => {if(namet.indexOf(element)>=0){unit = true;}});
  if(unit==false)continue;
  let markerr= markerByUnit[unitslist[i].getId()];
    if(markerr){
     let lat = markerr.getLatLng().lat;
     let lon = markerr.getLatLng().lng;
     let namet_a = point_in_region(lat,lon);
     let vodiy = "не вставив картку в зчитувач";
     let vodiy_a =  '-----';
     let agregat = '-----';
     if(wialon.util.Geometry.pointInShape(poly, 0, lat, lon)){
       for(let ii = 0; ii<Global_DATA.length; ii++){
         let idd = Global_DATA[ii][0][0];
         if(idd!=id)continue;
         for(let iii = Global_DATA[ii].length-1; iii>0; iii--){


            if(Global_DATA[ii][iii][5]  && agregat=='-----'){
              agregat=Global_DATA[ii][iii][5].split(" ")[0];
            }
            if(Global_DATA[ii][iii][6] && vodiy =='не вставив картку в зчитувач' ){
              vodiy=Global_DATA[ii][iii][6];
              for(let ii = mehanizator_adresa.length-1; ii>=0; ii--){
                if(mehanizator_adresa[ii][0].indexOf(vodiy)>=0){
                  vodiy_a=mehanizator_adresa[ii][1];
                }
              }
            }
            if(agregat!='-----' && vodiy !='не вставив картку в зчитувач') break;

         }
       } 
       let poisk=false;
       let vodiy1=namet.split("/")[0];
       let vodiy2=namet.split("/")[1];
       if(!vodiy2)vodiy2=vodiy1;
       let zmina='';
       let zavtra = '-----';
       let zavtra_a =  '-----';
       if(vodiy== "не вставив картку в зчитувач"){
        zavtra = vodiy;
       }else{
        if(vodiy1.indexOf(vodiy)>=0)zmina=vodiy2;
        if(vodiy2.indexOf(vodiy)>=0)zmina=vodiy1;
        for (key in drivers) {
         let drv = drivers[key].n;
         if(zmina.indexOf(drv)>=0){
           zavtra= drv;
           break;
         }
         zavtra="-----";
       }         
    }
      kk++;
      kkk = table_plan.rows.length

     
      let el = document.createElement('div');
      el.setAttribute('class', 'autocomplete');
      let el2 = document.createElement('div');
      el2.setAttribute('class', 'inp');
      el2.setAttribute('id', 'myInput'+kkk+'');
      el2.setAttribute('type', 'text');
      el2.setAttribute('contenteditable', 'true');
      el2.textContent = zavtra;
      autocomplete_all(el2, mehan);
      el.appendChild(el2);
      el2.addEventListener('click', function (evt) {
        if(evt.target.textContent=='')return;
        for(let i = point_planuvannya_list.length-1; i>=0; i--){
          let namet = point_planuvannya_list[i].name;
          let unit =false;
          if(namet.indexOf(evt.target.textContent)>=0){unit = true;}
          if(unit==false)continue;
          let lat = point_planuvannya_list[i]._latlng.lat;
          let lon = point_planuvannya_list[i]._latlng.lng;
          map.setView([lat, lon], 10);
          point_planuvannya_list[i].openPopup();
        }
    });


        $("#unit_table").append("<tr id='"+id+"," + lat+","+lon+","+center.lat+","+center.lng+"'><td>-</td><td>+</td><td>"+kk+"</td><td style = 'background-color: "+col+";'></td><td  contenteditable='true'>"+namet+"</td><td contenteditable='true'>"+agregat+"</td><td  contenteditable='true'>"+namet_a+"</td><td></td><td contenteditable='true'>"+zavtra_a+"</td><td contenteditable='true'>"+vodiy+"</td><td contenteditable='true'>"+vodiy_a+"</td></tr>");
        let td = table_plan.rows[kkk].cells[7];
        td.appendChild(el);

     }
    }
  
}  
if(kk==0){
  kk++;
  kkk = table_plan.rows.length
      
      let el = document.createElement('div');
      el.setAttribute('class', 'autocomplete');
      let el2 = document.createElement('div');
      el2.setAttribute('class', 'inp');
      el2.setAttribute('id', 'myInput'+kkk+'');
      el2.setAttribute('type', 'text');
      el2.setAttribute('contenteditable', 'true');
      el2.textContent = "";
      autocomplete_all(el2, mehan);
      el.appendChild(el2);
      el2.addEventListener('click', function (evt) {
        if(evt.target.textContent=='')return;
        for(let i = point_planuvannya_list.length-1; i>=0; i--){
          let namet = point_planuvannya_list[i].name;
          let unit =false;
          if(namet.indexOf(evt.target.textContent)>=0){unit = true;}
          if(unit==false)continue;
          let lat = point_planuvannya_list[i]._latlng.lat;
          let lon = point_planuvannya_list[i]._latlng.lng;
          map.setView([lat, lon], 10);
          point_planuvannya_list[i].openPopup();
        }
    });
   
      

  $("#unit_table").append("<tr  id='"+11+"," + 11+","+11+","+center.lat+","+center.lng+"'><td>-</td><td>+</td><td>"+kk+"</td><td style = 'background-color: "+col+";'></td><td contenteditable='true'>-----</td><td contenteditable='true'>-----</td><td  contenteditable='true'>"+point_in_region(center.lat,center.lng)+"</td><td></td><td contenteditable='true'>-----</td><td contenteditable='true'>-----</td><td contenteditable='true'>-----</td></tr>");
  let td = table_plan.rows[kkk].cells[7];
  td.appendChild(el);

}
}


let kol_sort = '';
let num_kk = 0;
  for(let i = 1; i<table_plan.rows.length; i++){
    if(kol_sort==table_plan.rows[i].cells[3].style.backgroundColor){
      num_kk++;
      table_plan.rows[i].cells[2].textContent=num_kk;
    }else{
      kol_sort=table_plan.rows[i].cells[3].style.backgroundColor;
      num_kk=1;
      table_plan.rows[i].cells[2].textContent=num_kk;
    }

    let zavtra =  table_plan.rows[i].cells[7].innerText;
    if(zavtra!="" && zavtra!="-----" && zavtra.innerText!="не вставив картку в зчитувач" && zavtra!="відсутня картка водія"){
      let color = table_plan.rows[i].cells[3].style.backgroundColor;
      let color2 = table_plan.rows[i].cells[3].style.backgroundColor;
      let opti = 1;
      if(table_plan.rows[i].cells[4].style.backgroundColor){
        color="rgba(138, 136, 136, 0.4)";
        opti = 0.4;
      }
      for(let ii = mehanizator_adresa.length-1; ii>=0; ii--){
        if(mehanizator_adresa[ii][0].indexOf(zavtra)>=0){
          if(table_plan.rows[i].cells[3].textContent==''){table_plan.rows[i].cells[8].textContent =mehanizator_adresa[ii][2];}
          let yyy = mehanizator_adresa[ii][3];
          let xxx = mehanizator_adresa[ii][4];
          let rbor = '1px solid rgb(0, 0, 0)';

          if(mehanizator_adresa[ii][2]=='Кролевець' && table_plan.rows[i].cells[3].textContent==''){
            yyy = krolevec[tochki_krolevec][0];
            xxx = krolevec[tochki_krolevec][1];
            tochki_krolevec++;
          }
          if(mehanizator_adresa[ii][2]=='Глухів' && table_plan.rows[i].cells[3].textContent==''){
            yyy = gluhiv[tochki_gluhiv][0];
            xxx = gluhiv[tochki_gluhiv][1];
            tochki_gluhiv++;
          }
          if( table_plan.rows[i].cells[3].textContent=='1'){
            yyy = kkz[tochki_kkz][0];
            xxx = kkz[tochki_kkz][1];
            tochki_kkz++;
            rbor = '3px solid rgb(19, 35, 255)';
          }
          if( table_plan.rows[i].cells[3].textContent=='2'){
            yyy = gluhiv_atb[tochki_gluhiv_atb][0];
            xxx = gluhiv_atb[tochki_gluhiv_atb][1];
            tochki_gluhiv_atb++;
            rbor = '3px solid rgb(183, 0, 255)';
          }
          if( table_plan.rows[i].cells[3].textContent=='3'){
            yyy = post_gluhiv[tochki_post_gluhiv][0];
            xxx = post_gluhiv[tochki_post_gluhiv][1];
            tochki_post_gluhiv++;
            rbor = '3px solid rgb(255, 0, 0)';
          }
          if( table_plan.rows[i].cells[3].textContent=='4'){
            yyy = vilne[tochki_vilne][0];
            xxx = vilne[tochki_vilne][1];
            tochki_vilne++;
            rbor = '3px solid rgb(0, 255, 242)';
          }


          let pop = "<center>"+mehanizator_adresa[ii][0]+'</br>'+mehanizator_adresa[ii][2]+'</br>'+table_plan.rows[i].cells[6].textContent+'</br>'+table_plan.rows[i].cells[5].textContent+"<br><button  class='planuvannya_buton' id='btn"+i+"'>кінцева</button><br><button  class='planuvannya_buton' id='btn"+i+"'>пересадка ККЗ</button><br><button  class='planuvannya_buton' id='btn"+i+"'>пересадка Глухів АТБ</button><br><button  class='planuvannya_buton' id='btn"+i+"'>пересадка Глухів пост</button><br><button  class='planuvannya_buton' id='btn"+i+"'>пересадка Вільне</button><br><button  class='planuvannya_buton' id='btn"+i+"'>початкова точка</button></center>";
          let m =L.marker([yyy, xxx],{
            icon: L.divIcon({
              iconSize: "auto",
              className: 'div-icon',
              html: "<div style=' width: 13px;  height: 13px;border: "+rbor+"; border-top-left-radius: 0px;  border-top-right-radius: 5px;  border-bottom-right-radius: 5px;  border-bottom-left-radius: 5px;background:"+color+"; '></div> ",
            })
          }).bindPopup(pop).bindTooltip(''+mehanizator_adresa[ii][0]+'</br>'+mehanizator_adresa[ii][2]+'</br>'+table_plan.rows[i].cells[6].textContent+'</br>'+table_plan.rows[i].cells[5].textContent+'',{ sticky: true}).addTo(map);
          m.color=color;
          m.colorr=table_plan.rows[i].cells[3].style.backgroundColor;
          m.tb_id = logistik_treck.length;
          m.index = i;
          m.name = mehanizator_adresa[ii][0];
          point_planuvannya_list.push(m);
          //m.adres = point_in_region(table_plan.rows[i].id.split(',')[3],table_plan.rows[i].id.split(',')[4]);
       
          logistik_treck.push(m);
       
          //let mark = L.marker([table_plan.rows[i].id.split(',')[3],table_plan.rows[i].id.split(',')[4]]).addTo(map).bindPopup(point_in_region(table_plan.rows[i].id.split(',')[3],table_plan.rows[i].id.split(',')[4]));
          //logistik_treck.push(mark);
          //let line = [[lat,lon],[table_plan.rows[i].id.split(',')[3],table_plan.rows[i].id.split(',')[4]],[mehanizator_adresa[ii][3], mehanizator_adresa[ii][4]]];
          let line = [[table_plan.rows[i].id.split(',')[3],table_plan.rows[i].id.split(',')[4]],[yyy, xxx]];
          let l = L.polyline(line, {color: color2,weight:2,opacity:opti}).addTo(map);
          logistik_treck.push(l);
          poisk=true;
          break;
        }
      }
    }
     
  }

}


$("div").on("click", '.planuvannya_buton', function () {
  let table_plan=document.getElementById('unit_table');
  let id = parseInt(this.id.match(/\d+/));
  let kol = '';
  let per = '';
  if(this.innerHTML=='кінцева'){
    kol = "rgba(138, 136, 136, 0.4)"; 
    navigator.clipboard.writeText(table_plan.rows[id].cells[7].textContent+'\t'+table_plan.rows[id].cells[8].textContent+'\t'+table_plan.rows[id].cells[6].textContent+'\t'+table_plan.rows[id].cells[5].textContent);
  }  
  if(this.innerHTML=='пересадка ККЗ') {
    table_plan.rows[id].cells[3].textContent =1;
    navigator.clipboard.writeText(table_plan.rows[id].cells[7].textContent+'\t'+table_plan.rows[id].cells[8].textContent+'\tпересадка ККЗ\t'+table_plan.rows[id].cells[5].textContent);
    table_plan.rows[id].cells[8].textContent = 'пересадка ККЗ';
  } 
  if(this.innerHTML=='пересадка Глухів АТБ') {
    table_plan.rows[id].cells[3].textContent =2;
    navigator.clipboard.writeText(table_plan.rows[id].cells[7].textContent+'\t'+table_plan.rows[id].cells[8].textContent+'\tпересадка Глухів АТБ\t'+table_plan.rows[id].cells[5].textContent);
    table_plan.rows[id].cells[8].textContent = 'пересадка Глухів АТБ';
  } 
  if(this.innerHTML=='пересадка Глухів пост') {
    table_plan.rows[id].cells[3].textContent =3;
    navigator.clipboard.writeText(table_plan.rows[id].cells[7].textContent+'\t'+table_plan.rows[id].cells[8].textContent+'\tпересадка Глухів пост\t'+table_plan.rows[id].cells[5].textContent);
    table_plan.rows[id].cells[8].textContent = 'пересадка Глухів пост';
  } 
  if(this.innerHTML=='пересадка Вільне') {
    table_plan.rows[id].cells[3].textContent =4;
    navigator.clipboard.writeText(table_plan.rows[id].cells[7].textContent+'\t'+table_plan.rows[id].cells[8].textContent+'\tпересадка Вільне\t'+table_plan.rows[id].cells[5].textContent);
    table_plan.rows[id].cells[8].textContent = 'пересадка Вільне';
  } 
  if(this.innerHTML=='початкова точка')  {
    table_plan.rows[id].cells[3].textContent ='';
  } 

  table_plan.rows[id].cells[2].style.backgroundColor = kol;
  table_plan.rows[id].cells[4].style.backgroundColor = kol;
  table_plan.rows[id].cells[5].style.backgroundColor = kol;
  table_plan.rows[id].cells[6].style.backgroundColor = kol;
  table_plan.rows[id].cells[7].style.backgroundColor = kol;
  table_plan.rows[id].cells[8].style.backgroundColor = kol;
  table_plan.rows[id].cells[9].style.backgroundColor = kol;
  table_plan.rows[id].cells[10].style.backgroundColor = kol;

    map.closePopup();
    clearGarbage(logistik_treck);
    planuvannya_marshrutiv(); 
});




function point_in_region(y,x){
  let mesto = "-----";
for(let i = 0; i<geozonesgrup.length; i++){ 
  let cord= geozonesgrup[i].toGeoJSON().features[0];
  let buferpoly2 =[];
  if(cord){
    
    cord.geometry.coordinates[0].forEach(function(item, arr) {
      buferpoly2.push({x:item[1], y:item[0]}); 
    });
    if(wialon.util.Geometry.pointInShape(buferpoly2, 0, y, x)){
      mesto=geozonesgrup[i]._tooltip._content;
      return mesto;
      break;
    }
  }
}
return mesto; 
}
$('#planuvannya_bt1').click(function() {
  $("#unit_table").empty();
  $("#unit_table").append("<tr><td></td><td></td><td><b>№</b></td><td>&nbsp&nbsp&nbsp&nbsp</td><td><b>ТЗ</b></td><td><b>агрегат</b></td><td><b>локація</b></td><td><b>відвезти</b></td><td><b>адреса</b></td><td><b>забрати</b></td><td><b>адреса</b></td></tr>");
  //for(let i = 0; i<10; i++){
  //  $("#unit_table").append("<tr><td>"+(i+1)+"</td><td style ='background-color:rgb(255, 0, 0)'>&nbsp&nbsp&nbsp&nbsp</td><td  contenteditable='true'>ККЗ</td><td contenteditable='true'>-----</td></tr>");
  //}
  clearGarbage(logistik_treck);
  clearGarbage(marshrut_treck);
});

$('#planuvannya_bt2').click(function() {
  clearGarbage(logistik_treck);
  planuvannya_marshrutiv();
});

$('#planuvannya_bt3').click(function() {
  let cpdata='';
  let table_polya=document.getElementById('unit_table');
  if(table_polya.rows.length>1){
    for(let i = 1; i<table_polya.rows.length; i++){
         cpdata += table_polya.rows[i].cells[7].innerText + '\t' +table_polya.rows[i].cells[8].innerText + '\t' +table_polya.rows[i].cells[5].innerText + ' \t' + table_polya.rows[i].cells[6].innerText + '\n';
    }
  }

  if(cpdata!='')navigator.clipboard.writeText(cpdata);
});

$('#planuvannya_bt4').click(function() {
  let cpdata='';
  let table_polya=document.getElementById('unit_table');
  if(table_polya.rows.length>1){
    for(let i = 1; i<table_polya.rows.length; i++){
         cpdata += table_polya.rows[i].cells[4].innerText + '\t' +table_polya.rows[i].cells[9].innerText + '\t' +table_polya.rows[i].cells[10].innerText + '\t' +table_polya.rows[i].cells[5].innerText + ' \t' + table_polya.rows[i].cells[6].innerText + '\n';
    }
  }

  if(cpdata!='')navigator.clipboard.writeText(cpdata);
});

$("#unit_table").on("click", function (evt){
  let row = evt.target.parentNode;
  let tbl = row.parentNode;
  let e = document.getElementById("vib_zvit");
  let ename = e.options[e.selectedIndex].text;
 
  if(ename=='візуалізація треків за період'){
    [...document.querySelectorAll("#unit_table tr")].forEach(e => e.style.backgroundColor = '');
    row.style.backgroundColor = 'pink';
    let name = row.cells[0].textContent;
    for (let v = 0; v<temp_layer.length; v++){
      if(!temp_layer[v].name)continue;
      if(temp_layer[v].name==name){
        temp_layer[v].bringToFront();
        temp_layer[v].setStyle({color: 'red'});
        //map.fitBounds(temp_layer[v].getBounds());
      }else{
        temp_layer[v].setStyle({color: `hsl(${245}, ${100}%, ${45}%)`});
      }
    }
  }

  if(ename=='історія обробки полів'){
    if (evt.target.cellIndex>0 ){
      [...document.querySelectorAll("#unit_table tr")].forEach(e => e.style.backgroundColor = '');
      row.style.backgroundColor = 'pink';
    let ind = row.cells[1].textContent+row.cells[2].textContent+row.cells[5].textContent+row.cells[7].textContent;
    for (let v = 0; v<garbagepoly.length; v++){
      if(!garbagepoly[v].nam)continue;
      if(garbagepoly[v].nam==ind){
        garbagepoly[v].bringToFront();
        garbagepoly[v].setStyle({color: 'red'});
      }else{
        garbagepoly[v].setStyle({color: 'blue'});
      }
    }
    
    let name = row.cells[5].textContent.split(' ')[0];
    for (let i = 0; i<geozones.length; i++){
    if(name==geozones[i].zone.n){
     let y=((geozones[i]._bounds._northEast.lat+geozones[i]._bounds._southWest.lat)/2).toFixed(5);
     let x=((geozones[i]._bounds._northEast.lng+geozones[i]._bounds._southWest.lng)/2+0.04).toFixed(5);
     map.setView([y,x],14,{animate: false});
          clearGEO();
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
    let nomer = row.cells[3].textContent.split(' ')[0];
    for (let i = 0; i<unitslist.length; i++){
      let nm=unitslist[i].getName();
      if(nm.indexOf(nomer)>=0){
        let id=unitslist[i].getId();
        let from = row.cells[1].textContent+' 00:00:00';
        let to = row.cells[1].textContent+' 23:59:00';
        $("#lis0").chosen().val(id);
        $("#lis0").trigger("chosen:updated");
        layers[0]=0;
        show_track(from,to);
        break;
     }
     }
    
    


  }
  if (evt.target.type=='checkbox'){
    let ind = evt.target.parentNode.parentNode.cells[1].textContent+evt.target.parentNode.parentNode.cells[2].textContent+evt.target.parentNode.parentNode.cells[5].textContent+evt.target.parentNode.parentNode.cells[7].textContent;
    if(evt.target.checked){
      for (let v = 0; v<garbagepoly.length; v++){
        if(!garbagepoly[v].nam)continue;
        if(garbagepoly[v].nam==ind){
          garbagepoly[v].addTo(map);
        }
      }
    }else{
      for (let v = 0; v<garbagepoly.length; v++){
        if(!garbagepoly[v].nam)continue;
        if(garbagepoly[v].nam==ind){
          garbagepoly[v].remove();
        }
      }
    }
  }
  }

  if(row.rowIndex>0 && ename=='планування маршрутів'){
     if (evt.target.textContent=='-'){
      row.cells[0].closest('tr').remove();
      return;
     }
     if (evt.target.textContent=='+'){
      let ind =  row.rowIndex;
      let adr = row.cells[6].textContent;
      let kk = parseInt(row.cells[2].textContent)+1;
      let col = row.cells[3].style.backgroundColor;
      let idd=row.id;
      let newRow = row.parentNode.insertRow(ind+1);
      newRow.id = idd;
      

      let el = document.createElement('div');
      el.setAttribute('class', 'autocomplete');
      let el2 = document.createElement('div');
      el2.setAttribute('class', 'inp');
      el2.setAttribute('id', 'myInput'+tbl.rows.length+'');
      el2.setAttribute('type', 'text');
      el2.setAttribute('contenteditable', 'true');
      el2.textContent = "";
      autocomplete_all(el2, mehan);
      el.appendChild(el2);
      el2.addEventListener('click', function (evt) {
        if(evt.target.textContent=='')return;
        for(let i = point_planuvannya_list.length-1; i>=0; i--){
          let namet = point_planuvannya_list[i].name;
          let unit =false;
          if(namet.indexOf(evt.target.textContent)>=0){unit = true;}
          if(unit==false)continue;
          let lat = point_planuvannya_list[i]._latlng.lat;
          let lon = point_planuvannya_list[i]._latlng.lng;
          map.setView([lat, lon], 10);
          point_planuvannya_list[i].openPopup();
        }
    });
      
      newRow.innerHTML = "<td>-</td><td>+</td><td>"+kk+"</td><td style = 'background-color: "+col+";'></td><td contenteditable='true'>-----</td><td  contenteditable='true'>-----</td><td contenteditable='true'>"+adr+"</td><td></td><td contenteditable='true'>-----</td><td contenteditable='true'>-----</td></tr><td contenteditable='true'>-----</td>";
      let td = tbl.rows[ind+1].cells[7];
      td.appendChild(el);
      return;
     }
     if (evt.target.cellIndex==4){
      for(let i = 0; i<unitslist.length; i++){
        let namet = unitslist[i].getName();
        let id = unitslist[i].getId();
        let unit =false;
        if(namet.indexOf(evt.target.textContent)>=0){unit = true;}
        if(unit==false)continue;
        let markerr= markerByUnit[id];
          if(markerr){
           let lat = markerr.getLatLng().lat;
           let lon = markerr.getLatLng().lng;
           map.setView([lat, lon], 10);
           markerr.openPopup();
          }
          }
     }
  }
});






let mehan=[];
function autocomplete_all(inp, arr) {
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
      let cor = this.parentNode.getBoundingClientRect();
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      a.style = ' top: '+cor.bottom+'px;    left: '+cor.left+'px;   right: 0;';
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.parentNode.appendChild(a);
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
          let nm = arr[i].replace(/'/, '&#39');
          b.innerHTML += "<input type='hidden' value='"+nm+"'>";
          /*execute a function when someone clicks on the item value (DIV element):*/
          b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              inp.innerText = this.getElementsByTagName("input")[0].value;
              /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
              closeAllLists();
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
          closeAllLists();
        }       
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




//==========================================================================================================================================================================
//==========================================================================================================================================================================
//==========================================================================================================================================================================
//==========================================================================================================================================================================
//==========================================================================================================================================================================


$('#geomodul_bt').click(function() {
   let fr =  Date.parse($('#geomodul_time1').val());
   let to =  Date.parse($('#geomodul_time2').val());
   let vibor = $("#geomodul_lis").chosen().val();
   let vibor2 = $("#geomodul_field_lis").chosen().val();
   let poly_color = Math.floor(Math.random() * 360);

   $("#unit_table").empty();

  load_jurnal(20233,'geomodul.txt',function (data) { 
    
    for(let i = 1; i<data.length; i+=2){
      let m=data[i].split('|');
      let t=Date.parse(m[0]);
      let p = m[4];
      let r = m[6];
      let n = m[0]+'<br>'+m[1]+'<br>'+m[2]+'<br>'+m[3]+'<br>'+m[4]+'<br>'+m[5]+'<br>'+m[6]+'<br>'+m[9];
      if(vibor2.join().indexOf('Всі')<0){
        if(p)p=p.split(' ')[0];
        if(vibor2.join().indexOf(p)<0)continue;
      }
      for(let ii = 0; ii<vibor.length; ii++){
        if(!r)continue;
        if(r.indexOf(vibor[ii])>=0 || vibor[ii]=="Всі"){
        if(t>=fr && t<=to){
          let poly = JSON.parse(data[i+1]);
          if(poly.type == 'Polygon'){
            let coords = L.GeoJSON.coordsToLatLngs(poly.coordinates,1);
            let G=L.polygon(coords, {color: 'blue', stroke: false,  fillOpacity: 0.5}).bindTooltip(n ,{opacity:0.8,sticky:true}).addTo(map);
            G.nam =m[0]+m[1]+m[4]+m[9];
            garbagepoly.push(G);
          }else{
                for(let iii = 0; iii<poly.coordinates.length; iii++){
                  let coords = L.GeoJSON.coordsToLatLngs(poly.coordinates[iii],1);
                  let G=L.polygon(coords, {color: 'blue', stroke: false,  fillOpacity: 0.5}).bindTooltip(n ,{opacity:0.8,sticky:true}).addTo(map);
                  G.nam =m[0]+m[1]+m[4]+m[9];
                  garbagepoly.push(G);
                }
          }

          $("#unit_table").append("<tr><td><input type='checkbox' checked></td><td>"+m[0]+"</td><td>"+m[1]+"</td><td>"+m[2]+"</td><td>"+m[3]+"</td><td>"+m[4]+"</td><td>"+m[6]+"</td><td>"+m[9]+"</td></tr>");

          continue;
        }
      }
      }
    }
  });
});



//===========================ЖУРНАЛ=======================================================================================
//===========================ЖУРНАЛ=======================================================================================
//===========================ЖУРНАЛ=======================================================================================
//===========================ЖУРНАЛ=======================================================================================
//===========================ЖУРНАЛ=======================================================================================

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
function rewrite_jurnal(id,file_name,content,calbek){
  let remotee= wialon.core.Remote.getInstance(); 
  remotee.remoteCall('file/write',{'itemId':id,'storageType':1,'path':'//'+file_name,"content":content,"writeType":0,'contentType':0},function (error) {
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
              if(m[1].split(' ')[0]==nam_js.split(' ')[0]) unit_jr_data.push(m); 
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
  if(ps==2222){
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
      if(index==0)index=jurnal_data.length-50;
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
        if(index==0)index=jurnal_data.length-50;
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







$( "#vib_zvit" ).on( "change", function() {
  $('.leaflet-container').css('cursor','');
  let id='#'+'z'+this.value;
  $('.zvit').hide();
  $("#unit_table").empty();
  $(id).show();
  if(this.value=='z1'||this.value=='z2'|| this.value=='z3'|| this.value=='z17')$('.leaflet-container').css('cursor','crosshair');
  clearGEO(); 
  clearGarbage(garbage);
  clearGarbage(garbagepoly);
  clearGarbage(marshrutMarkers);
  let tt = new Date(Date.parse($('#f').text())).toJSON().slice(0,10);
  if(this.value=='z15') planuvannya_start();
} );





//========================LOGISTIKA===============================================================================
//========================LOGISTIKA===============================================================================
//========================LOGISTIKA==============================================================================

let stor=[];
let adresa=[];

let avto=[
['ВМ0229АF Свергунов Ю. Газель TT_B033','Шалигине',51.5711,34.1134],
['ВМ9987СІ Нива TT_B046','Шалигине',51.5711,34.1134],
['ВМ3454ЕЕ Полятикін П.П. ГАЗ 33021 Грузовой TT_B034','Шалигине',51.5748,34.1035],

['ВМ2559ВК Лукяненко О.М. Нива TT_B014','Слоут',51.7334,33.8615],
['ВМ4524АА Зборщик В.Б. Газель TT_B006','Слоут',51.7556,33.7604],
['ВМ5647ЕІ Зіналієв Е.А. ФОРД','Слоут',51.7539,33.7780],
['ВМ7912ЕІ Радченко О. Рено Duster','Слоут',51.7595,33.7923],
['ВМ7913ЕІ Абрамчук М. Рено Duster','Слоут',51.76,33.7906],

['ВМ4110АА Зіналієв А.С. Газель TT_B008','Слоут стан',51.7454,33.7983],

['ВМ7914ЕІ Лук’яненко О.М. Рено Duster','Береза',51.7334,33.8615],


['ВМ5645ЕІ Черненко О.В. ФОРД','Глухів',51.6774,33.9235],

['ВМ5887EI Лубенець Автобус TT_B063','ККЗ',51.5515,33.3511],
['ВМ8607ЕН Яковенко Ю.О. ФОРД','Кролевець',51.56,33.3501],
['ВМ8693ЕН Максименко С.М. Форд','Кролевець',51.5459,33.3714],
['ВМ1280СТ Інєшин Ю.В. Газель','Кролевець',51.5607,33.4025],
['ВМ5629ЕІ Дубровін Р.В. ФОРД','Кролевець',51.5469,33.3917],
['ВМ7925ЕІ Жабко В. Рено Duster','Кролевець',51.5406,33.3801],
['ВМ2487СЕ Нива Шевроле','Кролевець Жабко тимчасово',51.5406,33.3801],
['ВМ8692ЕН Шепелюк В.Д. Форд','Кролевець',51.5624,33.3344],
['ВМ8684ЕН Самусь О.А. Форд','Кролевець',51.5462,33.3714],

['ВМ5203ВВ Шкурат Є.А. Газель','Буйвалове',51.4867,33.4234],
['ВМ8610ЕН Рахматулін О.В ФОРД','Буйвалове',51.4903,33.4116],

['ВМ7922ЕІ Самойленко А. Рено Duster','Ярове',51.5256,33.5764],

['ВМ7921ЕІ Велес С.О. Рено Duster','Воргол',51.4379,33.6969],

['ВМ7915ЕІ Боженко О.М. Рено Duster','Локня',51.4845,33.5627],

['ВМ1953ВС Чмир В.М. Газель','Райгородок',51.6264,33.0990],
['ВМ1988ВС Ступак А.М./Нікітенко В.М. Газель','Райгородок',51.6264,33.0990],

['ВМ4632АА Газель Райгородок TT_B003','Райгородок ферма',51.6228,33.0935],

['ВМ5607ЕІ Супрун В.М. ФОРД','Вишенки',51.6436,33.0671],

['ВМ7916ЕІ Кудін В.О. Рено Duster','Іваньків',51.7172,32.984],



['ВМ2047ЕС механізатор Тищенко Путивль Нива B044','Резерв',51.3541,33.8998],
['ВМ1640АТ Нива TT_B011','Резерв',51.7454,33.7983],
['ВМ1641ВЕ Нива TT_B027','Резерв',51.7454,33.7983],
['ВМ4466АО Нива','Резерв',51.7454,33.7983],
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
let  marshrut_treck=[];
//=============Stvorenya marshruty====================================================
$('#log_unit_tb').hide();
$('#log_marh_tb').hide();
$('#marh_zvit_tb').hide();
$('#log_control_tb').hide();
$('#transport_logistik').hide();
$('#log_cont').hide();
$('#log_time').hide();
$('#log_help').hide();
$('#adresy').hide();
$('#marshrut_text').hide();
$('#upd_marsh_bt').hide();

$("#log_b3").on("click", function (){
  $('#log_b1').css({'background':'#e9e9e9'});
  $('#log_b2').css({'background':'#e9e9e9'});
  $('#log_b3').css({'background':'#b2f5b4'});
  $('#log_b4').css({'background':'#e9e9e9'});
  $('#log_unit_tb').hide();
  $('#log_marh_tb').hide();
  $('#marh_zvit_tb').hide();
  $('#log_control_tb').hide();
  $('#log_cont').hide();
  $('#log_time').hide();
  $('#log_help').hide();
  $('#transport_logistik').hide();
  $('#adresy').show();
  $('#marshrut_text').hide();
  $('#upd_marsh_bt').hide();
  clearGEO();
  clearGarbage(marshrut_garbage);
  clearGarbage(marshrut_treck);
  activ_zone==0;

});

$("#adresy_add").on("click", function (){
  let n=$('#adresy_name').val();
  let c =$('#adresy_coord').val();
  let r =$('#adresy_radius').val();
  let s ='true';
  if(n && c && r && s){
  write_jurnal(20233,'zony.txt','||'+c+'|'+r+'|'+n+'|'+s,function () { 
    audio.play();

    let y = parseFloat(c.split(',')[0]);
    let x = parseFloat(c.split(',')[1]);
    let rr = parseFloat(r);
    let poly = L.circle([y,x], {stroke: false, fillColor: '#0000FF', fillOpacity: 0.2,radius: rr}).bindTooltip(""+n+"",{permanent: true, opacity:0.7, direction: 'top'});
    poly.on('click', function(e) {
      $('#adresy_name').val(e.target._tooltip._content);
      $('#adresy_coord').val(e.target._latlng.lat+','+e.target._latlng.lng);
      $('#adresy_radius').val(e.target.options.radius);

      clearGEO();
      let y = parseFloat(e.target._latlng.lat);
      let x = parseFloat(e.target._latlng.lng);
      let rr = parseFloat(e.target.options.radius);
      let cr = L.circle([y,x], {stroke: true,radius: rr, color: 'blue'}).addTo(map);
         geo_layer.push(cr);
  
      });


    lgeozoneee.addLayer(poly);
  });
}
});
$("#adresy_remove").on("click", function (){
  let n=$('#adresy_name').val();
  let c =$('#adresy_coord').val();
  let r =$('#adresy_radius').val();
  let s ='false';
 
  if(n && c && r && s && activ_zone!=0){
    write_jurnal(20233,'zony.txt','||'+c+'|'+r+'|'+n+'|'+s,function () { 
      audio.play();
      lgeozoneee.removeLayer(activ_zone);
      activ_zone=0;
      clearGEO();
    });
  }
 
 
});

$("#log_b4").on("click", function (){
  $('#log_b1').css({'background':'#e9e9e9'});
  $('#log_b2').css({'background':'#e9e9e9'});
  $('#log_b3').css({'background':'#e9e9e9'});
  $('#log_b4').css({'background':'#b2f5b4'});
  $('#log_unit_tb').hide();
  $('#log_marh_tb').hide();
  $('#marh_zvit_tb').hide();
  $('#log_control_tb').hide();
  $('#log_cont').hide();
  $('#log_time').hide();
  $('#log_help').hide();
  $('#adresy').hide();
  $('#transport_logistik').show();
  $('#marshrut_text').hide();
  $('#upd_marsh_bt').hide();
  clearGEO();
  clearGarbage(marshrut_garbage);
  clearGarbage(marshrut_treck);
  activ_zone==0;
});

$("#transport_logistik_bt").on("click", function (){
  let tableRow =document.querySelectorAll('#transport_logistik_tb tr');
  let save_data='2025 \n';
    for ( j = 1; j < tableRow.length; j++){ 
       save_data+='||'+tableRow[j].cells[0].textContent+'|'+tableRow[j].cells[1].textContent+'|'+tableRow[j].cells[2].textContent+'|'+tableRow[j].cells[3].textContent+'|'+tableRow[j].cells[4].textContent+'\n';
    } 
    rewrite_jurnal(20233,'MR-avto-reestr.txt',save_data,function () { 
      audio.play();
    });

 
 
});

$("#log_b1").on("click", function (){
  $('#log_b1').css({'background':'#b2f5b4'});
  $('#log_b2').css({'background':'#e9e9e9'});
  $('#log_b3').css({'background':'#e9e9e9'});
  $('#log_b4').css({'background':'#e9e9e9'});
  $("#log_unit_tb").empty();
  $('#log_unit_tb').show();
  $('#log_marh_tb').show();
  $('#marh_zvit_tb').hide();
  $('#log_control_tb').hide();
  $('#log_cont').hide();
  $('#log_time').hide();
  $('#adresy').hide();
  $('#transport_logistik').hide();
  $('#log_help').show();
  $('#marshrut_text').show();
  $('#upd_marsh_bt').show();
  //$('#log_marh_tb').empty();
  //$('#log_marh_tb').append("<tr>  <td>1</td>  <td></td>  <td></td> </tr> <tr><td style = ' border: 1px solid black; '><div class='autocomplete'  ><div class ='inp' id='myInput-1' type='text'   contenteditable='true' ></div></div></td>  <td style = 'font-size:14px;min-width: 15px; cursor: pointer;border: 1px solid black; background:rgb(247, 161, 161);'>-</td><td style = 'font-size:14px;min-width: 15px; cursor: pointer; background:rgb(170, 248, 170);'>+</td> </tr> <tr><td></td> <td></td> <td></td> </tr> <tr> <td></td> <td></td> <td></td> </tr> <tr> <td><input type='checkbox' checked></td>   <td></td> <td></td> </tr>");
  clearGEO();
  marshrut();
  update_logistik_data(vibir_avto);
});
$("#log_b2").on("click", function (){
  $('#log_b2').css({'background':'#b2f5b4'});
  $('#log_b1').css({'background':'#e9e9e9'});
  $('#log_b3').css({'background':'#e9e9e9'});
  $('#log_b4').css({'background':'#e9e9e9'});
  $('#log_unit_tb').hide();
  $('#log_marh_tb').hide();
  $('#marh_zvit_tb').hide();
  $('#log_control_tb').show();
  $('#transport_logistik').hide();
  $('#log_cont').hide();
  $('#adresy').hide();
  $('#log_time').show();
  $('#log_help').hide();
  $('#marshrut_text').hide();
  $('#upd_marsh_bt').hide();
 
  clearGEO();
  update_logistik_data(control_avto);
  clearGarbage(marshrut_garbage);
});


$("#upd_marsh_bt").on("click", function (){
  marshrut();
});
function marshrut(){
  marshrut_data=[];
  marshrut_point=[];
  marshrut_probeg=0;
  marshrut_vremya=0;
  clearGarbage(marshrut_garbage);
  clearGarbage(marshrut_treck);
  update_rout();
}



//=============Dodavannya tocok knopki====================================================
$("#log_marh_tb").on("click", function (evt){
  let row = evt.target.parentNode;
  let ind = evt.target.cellIndex;
  //row.rowIndex

  if(row.rowIndex==0){
    if(evt.target.innerText !='' && marshrut_point.length>0){
      let id = parseFloat(evt.target.innerText)-1; 
      let y =marshrut_point[id][2];
      let x =marshrut_point[id][3];
      if(y!=0)map.setView([y,x+0.04],14,{animate: false});
    }
    return;
  }
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
          document.getElementById("log_marh_tb").rows[0].cells[ind+1].style = 'cursor:pointer';
          document.getElementById("log_marh_tb").rows[0].insertCell(ind+2);
          document.getElementById("log_marh_tb").rows[0].insertCell(ind+3);
          document.getElementById("log_marh_tb").rows[2].insertCell(ind+1);
          document.getElementById("log_marh_tb").rows[2].insertCell(ind+2);
          document.getElementById("log_marh_tb").rows[2].insertCell(ind+3);
          document.getElementById("log_marh_tb").rows[3].insertCell(ind+1);
          document.getElementById("log_marh_tb").rows[3].insertCell(ind+2);
          document.getElementById("log_marh_tb").rows[3].insertCell(ind+3);
          document.getElementById("log_marh_tb").rows[4].insertCell(ind+1);
          document.getElementById("log_marh_tb").rows[4].cells[ind+1].innerHTML = "<input type='checkbox' checked>";
          document.getElementById("log_marh_tb").rows[4].insertCell(ind+2);
          document.getElementById("log_marh_tb").rows[4].insertCell(ind+3);

        marshrut();
}
if(evt.target.innerText=='-'){
  if (row.cells.length>3) {
    row.deleteCell(ind-1);
    row.deleteCell(ind-1);
    row.deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[0].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[0].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[0].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[2].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[2].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[2].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[3].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[3].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[3].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[4].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[4].deleteCell(ind-1);
    document.getElementById("log_marh_tb").rows[4].deleteCell(ind-1);
    
   
    
  }else{
    row.cells[ind-1].children[0].children[0].textContent="";
    document.getElementById("log_marh_tb").rows[0].cells[0].textContent="1";
    document.getElementById("log_marh_tb").rows[2].cells[0].textContent="";
    document.getElementById("log_marh_tb").rows[3].cells[0].textContent="";
  }
  marshrut();
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
      let cor = this.parentNode.getBoundingClientRect();
      let p = cor.left;
      if(window.innerWidth-200<cor.left)p=window.innerWidth-200;
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      a.style = ' top: '+cor.bottom+'px;    left: '+p+'px;   right: 0;';
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.parentNode.appendChild(a);
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
                document.getElementById("log_marh_tb").rows[0].cells[ind+1].style = 'cursor:pointer';
                document.getElementById("log_marh_tb").rows[0].insertCell(ind+2);
                document.getElementById("log_marh_tb").rows[0].insertCell(ind+3);
                document.getElementById("log_marh_tb").rows[2].insertCell(ind+1);
                document.getElementById("log_marh_tb").rows[2].insertCell(ind+2);
                document.getElementById("log_marh_tb").rows[2].insertCell(ind+3);
                document.getElementById("log_marh_tb").rows[3].insertCell(ind+1);
                document.getElementById("log_marh_tb").rows[3].insertCell(ind+2);
                document.getElementById("log_marh_tb").rows[3].insertCell(ind+3);
                document.getElementById("log_marh_tb").rows[4].insertCell(ind+1);
                document.getElementById("log_marh_tb").rows[4].cells[ind+1].innerHTML = "<input type='checkbox' checked>";
                document.getElementById("log_marh_tb").rows[4].insertCell(ind+2);
                document.getElementById("log_marh_tb").rows[4].insertCell(ind+3);
       
       
              }
              document.getElementById("log_marh_tb").rows[0].cells[id-2].textContent ='';
              document.getElementById("log_marh_tb").rows[2].cells[id-2].textContent ='';
              document.getElementById("log_marh_tb").rows[3].cells[id-2].textContent ='';
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
                document.getElementById("log_marh_tb").rows[0].cells[ind+1].style = 'cursor:pointer';
                document.getElementById("log_marh_tb").rows[0].insertCell(ind+2);
                document.getElementById("log_marh_tb").rows[0].insertCell(ind+3);
                document.getElementById("log_marh_tb").rows[2].insertCell(ind+1);
                document.getElementById("log_marh_tb").rows[2].insertCell(ind+2);
                document.getElementById("log_marh_tb").rows[2].insertCell(ind+3);
                document.getElementById("log_marh_tb").rows[3].insertCell(ind+1);
                document.getElementById("log_marh_tb").rows[3].insertCell(ind+2);
                document.getElementById("log_marh_tb").rows[3].insertCell(ind+3);
                document.getElementById("log_marh_tb").rows[4].insertCell(ind+1);
                document.getElementById("log_marh_tb").rows[4].cells[ind+1].innerHTML = "<input type='checkbox' checked>";
                document.getElementById("log_marh_tb").rows[4].insertCell(ind+2);
                document.getElementById("log_marh_tb").rows[4].insertCell(ind+3);

          }
          marshrut();
          closeAllLists();
        }
          
              
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
let row2= table.rows[2];
let row3= table.rows[3];
let roww = table.rows[1];
let y=(e.latlng.lat).toFixed(3);
let x=(e.latlng.lng).toFixed(3);
for (var i = 0; i < roww.cells.length; i+=3) {
  if (roww.cells[i].children[0].children[0].textContent) continue;
  roww.cells[i].children[0].children[0].textContent='нова точка';
  
  row3.cells[i].textContent=400;
  row3.cells[i].setAttribute('contenteditable', 'true');

  row2.cells[i].textContent=y+','+x;
  row2.cells[i].style = ' display: none; overflow: hidden;';
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
    el2.textContent = 'нова точка';
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
    document.getElementById("log_marh_tb").rows[0].cells[ind+1].style = 'cursor:pointer';
    document.getElementById("log_marh_tb").rows[0].insertCell(ind+2);
    document.getElementById("log_marh_tb").rows[0].insertCell(ind+3);
    document.getElementById("log_marh_tb").rows[2].insertCell(ind+1);
    document.getElementById("log_marh_tb").rows[2].insertCell(ind+2);
    document.getElementById("log_marh_tb").rows[2].insertCell(ind+3);
    document.getElementById("log_marh_tb").rows[3].insertCell(ind+1);
    document.getElementById("log_marh_tb").rows[3].insertCell(ind+2);
    document.getElementById("log_marh_tb").rows[3].insertCell(ind+3);
    document.getElementById("log_marh_tb").rows[4].insertCell(ind+1);
    document.getElementById("log_marh_tb").rows[4].cells[ind+1].innerHTML = "<input type='checkbox' checked>";
    document.getElementById("log_marh_tb").rows[4].insertCell(ind+2);
    document.getElementById("log_marh_tb").rows[4].insertCell(ind+3);
        
        row3.cells[ind+1].textContent=400;
        row3.cells[ind+1].setAttribute('contenteditable', 'true');
        row2.cells[ind+1].textContent=y+','+x;
        row2.cells[ind+1].style = ' display: none; overflow: hidden;';
        marshrut();

}
//=============Rozrahunok marshrutu====================================================

let id_rote=0;
function update_rout(){

  clearGarbage(marshrut_garbage);
  clearGarbage(marshrut_treck);
  marshrut_point=[];
  let table=document.getElementById("log_marh_tb");
  let row = table.rows[1];
  let row0 = table.rows[0];
  let row2 = table.rows[2];
  let row3 = table.rows[3];
  let row4 = table.rows[4];
  let kkkk=0;
     
if(!row) return;
id_rote++;
if(id_rote>100){id_rote=0;}
  for(let ii=0;ii<row.cells.length;ii+=3){
      let text = row.cells[ii].children[0].children[0].textContent;
      if (row3.cells[ii].textContent=='----'){
        kkkk++;
        for (let j = 0; j<stor.length; j++){
          if(stor[j][3].indexOf(text)>=0){
            let name = stor[j][3];
          row0.cells[ii].textContent=kkkk;
          let y = parseFloat(stor[j][0]);
          let x = parseFloat(stor[j][1]);
          let r = parseInt(stor[j][2]);
          let color = 'rgb(170, 248, 170)';
          let cl = 'leaflet-tooltip-green';
          let pop = "<center>"+kkkk+"<br>"+name +"<br><input class='point_checkbox' id='chek"+kkkk+"'type='checkbox' checked><br><button  class='point_delet_buton' id='btn"+kkkk+"'>видалити</button></center>";
          let checked_ = row4.cells[ii].getElementsByTagName('input')[0].checked;
          if (checked_ == false) {
            color= 'rgb(255, 230, 4)';
            cl ='leaflet-tooltip-yellow';
            pop = "<center>"+kkkk+"<br>"+name +"<br><input class='point_checkbox' id='chek"+kkkk+"'type='checkbox'><br><button  class='point_delet_buton' id='btn"+kkkk+"'>видалити</button></center>";
          }
          row0.cells[ii].style = 'background: '+color+';';
          row3.cells[ii].textContent='----';
          let mar = L.circle([y,x], { stroke: true,weight: 1, fillOpacity: 0.3, radius: r}).bindTooltip(""+kkkk+"",{className: cl, permanent: true, opacity:0.8, direction: 'top'}).bindPopup(pop).addTo(map);
          marshrut_garbage.push(mar);
        }
      }
      marshrut_point.push([kkkk,text,0,0,'----','true']);
      continue;
      }
      if(text){
        if(row2.cells[ii].textContent !=""){
          kkkk++;
          row0.cells[ii].textContent=kkkk;
          let y = parseFloat(row2.cells[ii].textContent.split(',')[0]);
          let x = parseFloat(row2.cells[ii].textContent.split(',')[1]);
          let r = parseInt(row3.cells[ii].textContent); 
          let rr = r;
          let stoyanka='';
          if (row2.cells[ii+1].textContent && $('#log_control_tb').is(':visible')) {
            stoyanka = parseInt(row2.cells[ii+1].textContent.split(',')[1]);
            let m = Math.trunc(stoyanka / 60) + '';
            let h = Math.trunc(m / 60) + '';
            m=(m % 60) + '';
            let s =(stoyanka % 60) + '';
            stoyanka=row2.cells[ii+2].textContent+'<br>'+h.padStart(2, 0) + ':' + m.padStart(2, 0) +':'+s.padStart(2, 0); 
            if(rr>50){rr=50;}
          } 
          let color = 'rgb(170, 248, 170)';
          let cl = 'leaflet-tooltip-green';
          let pop = "<center>"+kkkk+"<br>"+stoyanka +"<br>"+text +"<br><input class='point_checkbox' id='chek"+kkkk+"'type='checkbox' checked><br><button  class='point_delet_buton' id='btn"+kkkk+"'>видалити</button></center>";
          let checked_ = row4.cells[ii].getElementsByTagName('input')[0].checked;
          if (checked_ == false) {
            color= 'rgb(247, 161, 161)';
            cl ='leaflet-tooltip-red';
             pop = "<center>"+kkkk+"<br>"+stoyanka +"<br><div type='text'   contenteditable='true' >"+text +"</div><button  class='point_name_buton' id='btnnnn"+kkkk+"'>змінити назву</button><br><input class='point_checkbox' id='chek"+kkkk+"'type='checkbox'><br><button style = 'background: rgb(170, 248, 170);' class='point_polya_buton' id='btnnnn"+kkkk+"'>поля ККЗ</button><br><button style = 'background: rgb(170, 248, 170);' class='point_ferma_buton' id='btnnnnn"+kkkk+"'>працівник Райгородок</button><br><button style = 'background: rgb(247, 161, 161);' class='point_vlasny_buton' id='btnnn"+kkkk+"'>власні потреби</button><br><button style = 'background: rgb(170, 248, 170);' class='point_podorozi_buton' id='btnggn"+kkkk+"'>по дорозі</button><br><button style = 'background: rgb(170, 248, 170);' class='point_ignor_buton' id='btnn"+kkkk+"'>ігнорувати</button><br><button  class='point_delet_buton' id='btn"+kkkk+"'>видалити</button></center>";
            for (let j = 0; j<stor.length; j++){
              if(wialon.util.Geometry.getDistance(y,x,parseFloat(stor[j][0]),parseFloat(stor[j][1]))<parseFloat(stor[j][2])){
                color= 'rgb(255, 230, 4)';
                cl ='leaflet-tooltip-yellow';
              }
            }
          
          }
          row0.cells[ii].style = 'background: '+color+';';
          let mar = L.circle([y,x], { stroke: true,weight: 1,  fillOpacity: 0.3, radius: rr}).bindTooltip(""+kkkk+"",{className: cl, permanent: true, opacity:0.8, direction: 'top'}).bindPopup(pop).addTo(map);
          marshrut_garbage.push(mar);
          marshrut_point.push([kkkk,text,y,x,r,checked_]);
         
          let drag=false;
          mar.on('mousedown', (e) => {
            let y = parseFloat(mar._latlng.lat)-parseFloat(e.latlng.lat);
            let x = parseFloat(mar._latlng.lng)-parseFloat(e.latlng.lng);
              map.dragging.disable()
              map.on('mousemove',  function (e) { 
                let yy = y+parseFloat(e.latlng.lat);
                let xx = x+parseFloat(e.latlng.lng);
                mar.setLatLng([yy,xx]);
                drag=true;
              })
            
          })
          mar.on('mouseup', () => {
              map.dragging.enable();
              map.removeEventListener('mousemove');
             
              clearGarbage(marshrut_treck);
            let y = parseFloat(mar._latlng.lat);
            let x = parseFloat(mar._latlng.lng);
            let id = parseInt(mar._tooltip._content);
            let tb = document.getElementById("log_marh_tb");
            let idd = 0;
            let t0 = 0;
            let t1=0;
            let t2=0;
            for (let j = 0; j<tb.rows[0].cells.length; j+=3){
              if (parseInt(tb.rows[0].cells[j].textContent)==id-1) {
                t0 = tb.rows[2].cells[j+2].textContent;
              }
              if (parseInt(tb.rows[0].cells[j].textContent)==id) {
                tb.rows[2].cells[j].textContent=y+','+x;
                idd = parseInt(tb.rows[2].cells[j+1].textContent.split(',')[0]);
                t1 = tb.rows[2].cells[j+2].textContent;
              }
              if (parseInt(tb.rows[0].cells[j].textContent)==id+1) {
                t2 = tb.rows[2].cells[j+2].textContent;
                break;
              }
              }
              if (drag)marshrut();
              if ($('#log_control_tb').is(':hidden'))return;
              if (t0==0) {t0 = t1}
              if (t2==0) {t2 = t1}
              $("#lis0").chosen().val(idd);     
              $("#lis0").trigger("chosen:updated");
              layers[0]=0;
              show_track(t0,t2);
              slider.value=(Date.parse(t1)-Date.parse($('#fromtime1').val()))/(Date.parse($('#fromtime2').val())-Date.parse($('#fromtime1').val()))*2000;
              position(Date.parse(t1));
             
          })
        continue;
        }
        for (let j = 0; j<stor.length; j++){
          if(text==stor[j][3]){
            kkkk++;
            row0.cells[ii].textContent=kkkk;
            let y = parseFloat(stor[j][0]);
            let x = parseFloat(stor[j][1]);
            let r = parseInt(stor[j][2]);
             let color = 'rgb(170, 248, 170)';
             let cl = 'leaflet-tooltip-green';
             let pop = "<center>"+kkkk+"<br>"+text +"<br><input class='point_checkbox' id='chek"+kkkk+"'type='checkbox' checked><br><button  class='point_delet_buton' id='btn"+kkkk+"'>видалити</button></center>";
             let checked_ = row4.cells[ii].getElementsByTagName('input')[0].checked;
             if (checked_ == false) {
              pop = "<center>"+kkkk+"<br>"+text +"<br><input class='point_checkbox' id='chek"+kkkk+"'type='checkbox'><br><button  class='point_delet_buton' id='btn"+kkkk+"'>видалити</button></center>";
              color= 'rgb(255, 230, 4)';
              cl ='leaflet-tooltip-yellow';
            }
             row0.cells[ii].style = 'background: '+color+';';
            if(row3.cells[ii].textContent)r=row3.cells[ii].textContent;
            row2.cells[ii].textContent=y+','+x;
            row2.cells[ii].style = ' display: none; overflow: hidden;';
            row3.cells[ii].textContent=r;
            row3.cells[ii].setAttribute('contenteditable', 'true');
            let mar = L.circle([y,x], { stroke: true,weight: 1, fillOpacity: 0.3, radius: r}).bindTooltip(""+kkkk+"",{className: cl, permanent: true, opacity:0.8, direction: 'top'}).bindPopup(pop).addTo(map);
            marshrut_garbage.push(mar);
            marshrut_point.push([kkkk,text,y,x,r,checked_]);

            mar.on('mousedown', (e) => {
              let y = parseFloat(mar._latlng.lat)-parseFloat(e.latlng.lat);
              let x = parseFloat(mar._latlng.lng)-parseFloat(e.latlng.lng);
                map.dragging.disable()
                map.on('mousemove',  function (e) { 
                  let yy = y+parseFloat(e.latlng.lat);
                  let xx = x+parseFloat(e.latlng.lng);
                  mar.setLatLng([yy,xx]);
                })
              
            })
            mar.on('mouseup', () => {
              let y = parseFloat(mar._latlng.lat);
              let x = parseFloat(mar._latlng.lng);
              let id = parseInt(mar._tooltip._content);
              let tb = document.getElementById("log_marh_tb");
              for (let j = 0; j<tb.rows[0].cells.length; j+=3){
                if (tb.rows[0].cells[j].textContent==id) {
                  tb.rows[2].cells[j].textContent=y+','+x;
                  break;
                }
                }
                map.dragging.enable();
                map.removeEventListener('mousemove');
              
            })

            break;
          }
          if(j ==stor.length-1){
            if(text=='нова точка'){
              kkkk++;
              row0.cells[ii].textContent=kkkk;
              let y = parseFloat(row2.cells[ii].textContent.split(',')[0]);
              let x = parseFloat(row2.cells[ii].textContent.split(',')[1]);
              let r = parseInt(row3.cells[ii].textContent);
               let color = 'rgb(170, 248, 170)';
               let cl = 'leaflet-tooltip-green';
               let pop = "<center>"+kkkk+"<br>"+text +"<br><input class='point_checkbox' id='chek"+kkkk+"'type='checkbox' checked><br><button  class='point_delet_buton' id='btn"+kkkk+"'>видалити</button></center>";
               let checked_ = row4.cells[ii].getElementsByTagName('input')[0].checked;
               if (checked_ == false) {
                pop = "<center>"+kkkk+"<br>"+text +"<br><input class='point_checkbox' id='chek"+kkkk+"'type='checkbox'><br><button  class='point_delet_buton' id='btn"+kkkk+"'>видалити</button></center>";
                color= 'rgb(247, 161, 161)';
                cl ='leaflet-tooltip-red';
              }
               
               row0.cells[ii].style = 'background: '+color+';';
              //let mar = L.marker([y,x], {icon: L.divIcon({ className: 'div-icon',iconSize: "auto", html: ''+kkkk+'' }),draggable: true,opacity:0.9,zIndexOffset:1000}).addTo(map);
              let mar = L.circle([y,x], { stroke: true,weight: 1, fillOpacity: 0.3, radius: r}).bindTooltip(""+kkkk+"",{className: cl, permanent: true, opacity:0.8, direction: 'top'}).bindPopup(pop).addTo(map);
              marshrut_garbage.push(mar);
              marshrut_point.push([kkkk,text,y,x,r,checked_]);

              mar.on('mousedown', (e) => {
                let y = parseFloat(mar._latlng.lat)-parseFloat(e.latlng.lat);
                let x = parseFloat(mar._latlng.lng)-parseFloat(e.latlng.lng);
                  map.dragging.disable()
                  map.on('mousemove',  function (e) { 
                    let yy = y+parseFloat(e.latlng.lat);
                    let xx = x+parseFloat(e.latlng.lng);
                    mar.setLatLng([yy,xx]);
                  })
                
              })
              mar.on('mouseup', () => {
                let y = parseFloat(mar._latlng.lat);
                let x = parseFloat(mar._latlng.lng);
                let id = parseInt(mar._tooltip._content); 
                let tb = document.getElementById("log_marh_tb");
                        for (let j = 0; j<tb.rows[0].cells.length; j+=3){
                          if (tb.rows[0].cells[j].textContent==id) {
                            tb.rows[2].cells[j].textContent=y+','+x;
                            break;
                          }
                          }
                  map.dragging.enable();
                  map.removeEventListener('mousemove');
                
              })
        
        
            }else{
              let multi=0;
              kkkk++;
              for (let j = 0; j<stor.length; j++){
                  if(stor[j][3].indexOf(text)>=0){
                    let name = stor[j][3];
                  multi++;
                  row0.cells[ii].textContent=kkkk;
                  let y = parseFloat(stor[j][0]);
                  let x = parseFloat(stor[j][1]);
                  let r = parseInt(stor[j][2]);
                   let color = 'rgb(170, 248, 170)';
                   let cl = 'leaflet-tooltip-green';
                   let pop = "<center>"+kkkk+"<br>"+name +"<br><input class='point_checkbox' id='chek"+kkkk+"'type='checkbox' checked><br><button  class='point_delet_buton' id='btn"+kkkk+"'>видалити</button></center>";
                   let checked_ = row4.cells[ii].getElementsByTagName('input')[0].checked;
                   if (checked_ == false) {
                    pop = "<center>"+kkkk+"<br>"+name +"<br><input class='point_checkbox' id='chek"+kkkk+"'type='checkbox'><br><button  class='point_delet_buton' id='btn"+kkkk+"'>видалити</button></center>";
                    color= 'rgb(255, 230, 4)';
                   cl ='leaflet-tooltip-yellow';
                  };
                   row0.cells[ii].style = 'background: '+color+';';
                  row3.cells[ii].textContent='----';
                  let mar = L.circle([y,x], { stroke: true,weight: 1, fillOpacity: 0.3, radius: r}).bindTooltip(""+kkkk+"",{className: cl, permanent: true, opacity:0.8, direction: 'top'}).bindPopup(pop).addTo(map);
                  marshrut_garbage.push(mar);
                  

                }
              }



              if (multi>0){
                marshrut_point.push([kkkk,text,0,0,'----','true']);
                continue;
              }

              wialon.util.Gis.searchByString(text+' Чернігівська Сумська',0,1, function(code, data) {
                if (code) { msg(wialon.core.Errors.getErrorText(code)); return; } // exit if error code
                if (data) {
                  if (data[0]){
                    row0.cells[ii].textContent=kkkk;
                    let y=data[0].items[0].y;
                    let x=data[0].items[0].x;
                    let r = 5000;
                    let color = 'rgb(170, 248, 170)';
                    let cl = 'leaflet-tooltip-green';
                    let pop = "<center>"+kkkk+"<br>"+text +"<br><input class='point_checkbox' id='chek"+kkkk+"'type='checkbox' checked><br><button  class='point_delet_buton' id='btn"+kkkk+"'>видалити</button></center>";
                    let checked_ = row4.cells[ii].getElementsByTagName('input')[0].checked;
                    if (checked_ == false) {
                      pop = "<center>"+kkkk+"<br>"+text +"<br><input class='point_checkbox' id='chek"+kkkk+"'type='checkbox'><br><button  class='point_delet_buton' id='btn"+kkkk+"'>видалити</button></center>";
                      color= 'rgb(247, 161, 161)';
                      cl ='leaflet-tooltip-red';
                    }
                    row0.cells[ii].style = 'background: '+color+';';
                    if(row3.cells[ii].textContent)r=row3.cells[ii].textContent;
                    if (y) {
                      row2.cells[ii].textContent=y+','+x;
                      row2.cells[ii].style = ' display: none; overflow: hidden;';
                      row3.cells[ii].textContent=r;
                      row3.cells[ii].setAttribute('contenteditable', 'true');
                      let mar = L.circle([y,x], { stroke: true,weight: 1, fillOpacity: 0.3, radius: r}).bindTooltip(""+kkkk+"",{className: cl, permanent: true, opacity:0.8, direction: 'top'}).bindPopup(pop).addTo(map);
                      marshrut_garbage.push(mar);
                      marshrut_point.push([kkkk,text,y,x,r,checked_]);

                      mar.on('mousedown', (e) => {
                        let y = parseFloat(mar._latlng.lat)-parseFloat(e.latlng.lat);
                        let x = parseFloat(mar._latlng.lng)-parseFloat(e.latlng.lng);
                          map.dragging.disable()
                          map.on('mousemove',  function (e) { 
                            let yy = y+parseFloat(e.latlng.lat);
                            let xx = x+parseFloat(e.latlng.lng);
                            mar.setLatLng([yy,xx]);
                          })
                        
                      })
                      mar.on('mouseup', () => {
                        let y = parseFloat(mar._latlng.lat);
                        let x = parseFloat(mar._latlng.lng);
                        let id = parseInt(mar._tooltip._content);
                        let tb = document.getElementById("log_marh_tb");
                        for (let j = 0; j<tb.rows[0].cells.length; j+=3){
                          if (tb.rows[0].cells[j].textContent==id) {
                            tb.rows[2].cells[j].textContent=y+','+x;
                            break;
                          }
                          }
                          map.dragging.enable();
                          map.removeEventListener('mousemove');
                          
                   
                      })
                    }
                   }
                  
                }});
         
              
            }

          }
        }
      }
    
  }
  vibir_avto();
  if ($('#log_unit_tb').is(':visible')) marshrut_rote(marshrut_point,id_rote);
}

$("div").on("click", '.point_name_buton', function () {
  let tb = document.getElementById("log_marh_tb");
  let ind = parseInt(this.id.match(/\d+/));
  for (let j = 0; j<tb.rows[0].cells.length; j+=3){
  if (tb.rows[0].cells[j].textContent==ind) {
  tb.rows[1].cells[j].children[0].children[0].textContent=this.parentNode.getElementsByTagName('div')[0].textContent;
    break;
  }
  }
  marshrut();
});
$("div").on("click", '.point_polya_buton', function () {
  let tb = document.getElementById("log_marh_tb");
  let ind = parseInt(this.id.match(/\d+/));
  for (let j = 0; j<tb.rows[0].cells.length; j+=3){
  if (tb.rows[0].cells[j].textContent==ind) {
  tb.rows[4].cells[j].getElementsByTagName('input')[0].checked=true;
  tb.rows[1].cells[j].children[0].children[0].textContent="поля ККЗ";
    break;
  }
  }
  marshrut();
});
$("div").on("click", '.point_ferma_buton', function () {
  let tb = document.getElementById("log_marh_tb");
  let ind = parseInt(this.id.match(/\d+/));
  for (let j = 0; j<tb.rows[0].cells.length; j+=3){
  if (tb.rows[0].cells[j].textContent==ind) {
  tb.rows[4].cells[j].getElementsByTagName('input')[0].checked=true;
  tb.rows[1].cells[j].children[0].children[0].textContent="працівник Райгородок";
    break;
  }
  }
  marshrut();
});
$("div").on("click", '.point_vlasny_buton', function () {
  let tb = document.getElementById("log_marh_tb");
  let ind = parseInt(this.id.match(/\d+/));
  for (let j = 0; j<tb.rows[0].cells.length; j+=3){
  if (tb.rows[0].cells[j].textContent==ind) {
  tb.rows[4].cells[j].getElementsByTagName('input')[0].checked=false;
  tb.rows[1].cells[j].children[0].children[0].textContent="власні потреби";
    break;
  }
  }
  marshrut();
});
$("div").on("click", '.point_podorozi_buton', function () {
  let tb = document.getElementById("log_marh_tb");
  let ind = parseInt(this.id.match(/\d+/));
  for (let j = 0; j<tb.rows[0].cells.length; j+=3){
  if (tb.rows[0].cells[j].textContent==ind) {
  tb.rows[4].cells[j].getElementsByTagName('input')[0].checked=true;
  tb.rows[1].cells[j].children[0].children[0].textContent="по дорозі";
    break;
  }
  }
  marshrut();
});
$("div").on("click", '.point_ignor_buton', function () {
  let tb = document.getElementById("log_marh_tb");
  let ind = parseInt(this.id.match(/\d+/));
  for (let j = 0; j<tb.rows[0].cells.length; j+=3){
  if (tb.rows[0].cells[j].textContent==ind) {
  tb.rows[4].cells[j].getElementsByTagName('input')[0].checked=true;
  tb.rows[1].cells[j].children[0].children[0].textContent="ігнорувати";
    break;
  }
  }
  marshrut();
});
$("div").on("click", '.point_delet_buton', function () {
  let tb = document.getElementById("log_marh_tb");
  let ind = parseInt(this.id.match(/\d+/));
  for (let j = 0; j<tb.rows[0].cells.length; j+=3){
  if (tb.rows[0].cells[j].textContent==ind) {
    ind=j+2;
    break;
  }
  }
  if (tb.rows[0].cells.length>3) {
    tb.rows[1].deleteCell(ind);
    tb.rows[1].deleteCell(ind-1);
    tb.rows[1].deleteCell(ind-2);
    tb.rows[0].deleteCell(ind);
    tb.rows[0].deleteCell(ind-1);
    tb.rows[0].deleteCell(ind-2);
    tb.rows[2].deleteCell(ind);
    tb.rows[2].deleteCell(ind-1);
    tb.rows[2].deleteCell(ind-2);
    tb.rows[3].deleteCell(ind);
    tb.rows[3].deleteCell(ind-1);
    tb.rows[3].deleteCell(ind-2);
    tb.rows[4].deleteCell(ind);
    tb.rows[4].deleteCell(ind-1);
    tb.rows[4].deleteCell(ind-2);
    
   
   
  }else{
    tb.rows[1].cells[0].children[0].children[0].textContent="";
    tb.rows[0].cells[0].textContent="1";
    tb.rows[2].cells[0].textContent="";
    tb.rows[3].cells[0].textContent="";
  }
  marshrut();
});
$("div").on("click", '.point_checkbox', function () {
  let tb = document.getElementById("log_marh_tb");
  let ind = parseInt(this.id.match(/\d+/));
  for (let j = 0; j<tb.rows[0].cells.length; j+=3){
    if (tb.rows[0].cells[j].textContent==ind) {
      ind=j;
      break;
    }
  }
  let checked_ = tb.rows[4].cells[ind].getElementsByTagName('input')[0];
 if(this.checked){checked_.checked=true;}else{checked_.checked=false;}
 marshrut();
});

function marshrut_rote(marshrut,id){
  if(id!= id_rote && id>=0)return;
  clearGarbage(marshrut_treck);
  for (i = 0; i < marshrut.length-1; i++) {
    if(id!= id_rote && id>=0)return;
    if(marshrut[i][4]=='----')continue;
    if(marshrut[i+1][4]=='----')continue;
    let ax = marshrut[i][2];
    let ay = marshrut[i][3];
    let bx = marshrut[i+1][2];
    let by = marshrut[i+1][3];
  
        wialon.util.Gis.getRoute(ax,ay,bx,by,0, function(error, data) {
          if(id!= id_rote && id>=0)return;
          if (error) { // error was happened
            msg(wialon.core.Errors.getErrorText(error));
            return;
          }
          if (data.status=="OK"){
            if(id!= id_rote && id>=0)return;
            let line=[];
            for (v = 0; v < data.points.length; v+=2) {
            line.push ([data.points[v].lat,data.points[v].lon]);
            } 
            let l = L.polyline([line], {weight:5,opacity:1}).addTo(map);
            marshrut_treck.push(l);
          }
        });
      }  


}

//=============створити маршрут====================================================
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
  if (marshrut_point.length==0)return;
  if ($('#log_control_tb').is(':visible'))return;
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


  $('#log_unit_tb').empty();
  $('#log_unit_tb').append("<tr><th>ТЗ</th><th>стоянка</th><th>км <br> за тиждень</th><th>маршрути <br> сьогодні</th><th>відстань <br> до маршруту</th><th>маршрути <br>завтра</th><th>відстань <br> до маршруту</th><th></th></tr>");

  for (let j = 0; j<avto.length; j++){
    if(avto[j][1]=='Резерв'){
      $('#log_unit_tb').append("<tr><td>"+avto[j][0]+"</td><td>"+avto[j][1]+"</td><td>----</td><td>----</td><td>----</td><td>----</td><td>----</td></tr>");
      continue;
    }
    let status0=0;
    let status1=0;
    let status2=0;
    let name_buton1='маршрут';
    let name_buton2='маршрут';
    spisok+=avto[j][0].split(' ')[0]+',';
    for (let v = 1; v<logistik_data.length; v++){
      let m=logistik_data[v].split('|');
      if(!m[1])continue;

       if(m[1].indexOf(avto[j][0].split(' ')[0])>=0){
      
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
              if(m[0]>=d1 && m[0]<d2){status1=3;name_buton1=m[6];}
              if(m[0]>=d2 && m[0]<d3){status2=3;name_buton2=m[6];}
            }
          }
        }
      }
    }
  if (name_buton1==undefined)name_buton1='маршрут';
   if (name_buton2==undefined)name_buton2='маршрут';
//let bb0 ="";
let bb1 ="<button style = 'width: 100%;'>додати</button>";
let bb2 ="<button style = 'width: 100%;'>додати</button>";
//if(status0==3){bb0 ="<button style = 'background: rgb(170, 248, 170);width: 100%;' >маршрут</button>";}
if(status1==3){bb1 ="<button style = 'background: rgb(170, 248, 170);width: 100%;' >"+name_buton1+"</button>";}
if(status2==3){bb2 ="<button style = 'background: rgb(170, 248, 170);width: 100%;' >"+name_buton2+"</button>";}
//if(status0==2){bb0 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт</button>";}
if(status1==2){bb1 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт</button>";}
if(status2==2){bb2 ="<button style = 'background: rgb(247, 161, 161);width: 100%;' >ремонт</button>";}

    $('#log_unit_tb').append("<tr><td>"+avto[j][0]+"</td><td>"+avto[j][1]+"</td><td>----</td><td>"+bb1+"</td><td>----</td><td>"+bb2+" </td><td>----</td></tr>");
    let last_position = unit_position(avto[j][0].split(' ')[0]);
    let id =unitsID[avto[j][0].split(' ')[0]];
    //point_to_point_rote(marshrut_point[0][0],marshrut_point[0][1],avto[j][2],avto[j][3],j,6);
    if (marshrut_point[0][4]!='----'){
      if (last_position) point_to_point(marshrut_point[0][2],marshrut_point[0][3],last_position.y,last_position.x,j,4);
      point_to_point(marshrut_point[0][2],marshrut_point[0][3],avto[j][2],avto[j][3],j,6);
    }
    
    
  }
  
  sort_table(document.getElementById("log_unit_tb"),4);
  sort_table(document.getElementById("log_unit_tb"),6);

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
    if (tb.rows[i].cells[0].innerText.split(' ')[0]==marshrut_probeg_nedelya[j][0][1].split(' ')[0]) {
      tb.rows[i].cells[2].innerText=marshrut_probeg_nedelya[j][1][1];
      break;
    }
  }
  }
 
}  

// let marshrut_probeg_nedelya=[];
// function svod(data){ 
//   marshrut_probeg_nedelya=data;
//   let tb = document.getElementById("log_unit_tb");
//   for (let i = 0; i<data.length; i++){
//     let name = data[i][0][1];
//     let probeg=0;
//     let start_zminy = 0;
//     let godyny0=0;
//     let godyny=0;
//     let dey=0;
//     for (let ii = 2; ii<data[i].length-1; ii++){
//       if(!data[i][ii][1] || !data[i][ii-1][1])continue;
//       let time1 = Date.parse(data[i][ii-1][1])/1000;
//       let time2 = Date.parse(data[i][ii][1])/1000;
//       let dey_his = new Date(Date.parse(data[i][ii][1])).getDate();
//       if(dey_his!=dey){
//         godyny0=0;
//         start_zminy=0;
//         dey=dey_his;
//       }
//       if(parseInt(data[i][ii][2])>2){
//         if(start_zminy==0)start_zminy=1;
//         godyny+=godyny0;
//         godyny0=0;
//        }
//        if(start_zminy!=0)godyny0+=time2-time1;
//       if(!data[i][ii][0] || !data[i][ii-1][0] || parseInt(data[i][ii][2])<1)continue;
//        let y = parseFloat(data[i][ii-1][0].split(',')[0]);
//        let x = parseFloat(data[i][ii-1][0].split(',')[1]);
//        let yy = parseFloat(data[i][ii][0].split(',')[0]);
//        let xx = parseFloat(data[i][ii][0].split(',')[1]);
//        let dis = wialon.util.Geometry.getDistance(y, x, yy, xx);
//        if(dis>5)probeg+=dis;
//     }
//     for (let i = 1; i<tb.rows.length; i++){
//            if (tb.rows[i].cells[0].innerText.split(' ')[0]==name.split(' ')[0]) {
//              tb.rows[i].cells[2].innerText=(probeg/1000).toFixed()+'км    '+(godyny/3600).toFixed()+'год';
//              break;
//            }
//          }

//   }

// } 

function sort_table(table,colum){
let data=[];
  for (let i = 1; i<table.rows.length; i++){
    let a=parseFloat(table.rows[i].cells[colum].innerText);
    if (table.rows[i].cells[colum-1].getElementsByTagName('button')[0])if (table.rows[i].cells[colum-1].getElementsByTagName('button')[0].innerText !='ремонт') { data.push([i,a]);}
  }
  data.sort(function (a, b) { return a[1] - b[1]; });
  let color=  `hsl(${120}, ${50}%, ${50}%)`;
  for (let i = 0; i<5; i++){
    if (i>data.length-2) continue;
    table.rows[data[i][0]].cells[colum].style = 'background: '+`hsl(${120}, ${50}%, ${40+i*10}%)`+';';
    table.rows[data[i][0]].cells[0].style = 'background: rgb(170, 248, 170);';
  }
}

function unit_position(n){
  for(let i = 0; i<unitslist.length; i++){
    let namet = unitslist[i].getName().split(' ')[0];
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
  let point=avto[row.rowIndex-1][2]+','+avto[row.rowIndex-1][3];
  let text='СТОЯНКА';
  let radius ='200';
  let chek='true';
  let coment = 'маршрут';
  if($('#marshrut_text').val())coment =$('#marshrut_text').val();
  for(let i=0;i<marshrut_point.length;i++){
    text+='//'+marshrut_point[i][1];
    point+='//'+marshrut_point[i][2]+','+marshrut_point[i][3];
    chek+='//'+marshrut_point[i][5];
    radius+='//'+marshrut_point[i][4];
  }
   point+='//'+avto[row.rowIndex-1][2]+','+avto[row.rowIndex-1][3];
   text+='//СТОЯНКА';
   chek+='//true';
   radius+='//200';
    write_jurnal(20233,'MR-avto.txt','||'+t+'|'+n+'|'+text+'|'+point+'|'+radius+'|'+chek+'|'+coment+'|\n',function () { 
      msg("маршрут додано");
      evt.target.style.background = "rgb(170, 248, 170)";
      evt.target.innerHTML = coment;
      audio.play();
      update_logistik_data(control_avto);
      return;
    });

}
if(evt.target.parentNode.cellIndex==3){
  let t=Date.now();
  let n=row.cells[0].innerText;
  let point=avto[row.rowIndex-1][2]+','+avto[row.rowIndex-1][3];
  let text='СТОЯНКА';
  let radius ='200';
  let chek='true';
  let coment = 'маршрут';
  if($('#marshrut_text').val())coment =$('#marshrut_text').val();
  for(let i=0;i<marshrut_point.length;i++){
    text+='//'+marshrut_point[i][1];
    point+='//'+marshrut_point[i][2]+','+marshrut_point[i][3];
    chek+='//'+marshrut_point[i][5];
    radius+='//'+marshrut_point[i][4];
  }
   point+='//'+avto[row.rowIndex-1][2]+','+avto[row.rowIndex-1][3];
   text+='//СТОЯНКА';
   chek+='//true';
   radius+='//200';
    write_jurnal(20233,'MR-avto.txt','||'+t+'|'+n+'|'+text+'|'+point+'|'+radius+'|'+chek+'|'+coment+'|\n',function () { 
      msg("маршрут додано");
      audio.play();
      evt.target.style.background = "rgb(170, 248, 170)";
      evt.target.innerHTML = coment;
      update_logistik_data(control_avto);
      return;
    });
   

}

}
let name = evt.target.parentNode.cells[0].innerText.split(' ')[0];

     for (let i = 0; i<unitslist.length; i++){
      let nm=unitslist[i].getName();
      let id=unitslist[i].getId();
      if(nm.indexOf(name)>=0){
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
//=============контроль маршруту====================================================
async function control_avto(){
   let control_date = document.getElementById("log_time_inp").valueAsNumber;
   let now_date = new Date();
   now_date.setHours(0, 0, 0, 0);
   now_date =Date.parse(now_date);


   var d0=new Date(control_date);
   d0.setHours(0, 0, 0, 0);
   d0 =Date.parse(d0);

  var d1 = new Date(control_date);
  d1.setHours(0, 0, 0, 0);
  d1.setDate(d1.getDate()-1);
  d1 =Date.parse(d1);
  
  var d2=new Date(control_date);
  d2.setHours(0, 0, 0, 0);
  d2.setDate(d2.getDate() - 2);
  d2 =Date.parse(d2);
  var d_1=new Date(control_date);
  d_1.setHours(0, 0, 0, 0);
  d_1.setDate(d_1.getDate() + 1);
  d_1 =Date.parse(d_1);
  var d_2=new Date(control_date);
  d_2.setHours(0, 0, 0, 0);
  d_2.setDate(d_2.getDate() + 2);
  d_2 =Date.parse(d_2);


  let d_11 =new Date(d_2).toJSON().slice(0,10);
  let d00 =new Date(d_1).toJSON().slice(0,10);
  let d11 =new Date(d0).toJSON().slice(0,10);
  let d22 =new Date(d1).toJSON().slice(0,10);

  $('#log_control_tb').empty();
  $('#log_control_tb').append("<tr><th>ТЗ</th><th>"+d11+"</th><th>"+d00+"</th><th>"+d_11+"</th>></tr>");

  for (let j = 0; j<avto.length; j++){
    if(avto[j][1]=='Резерв'){
      $('#log_control_tb').append("<tr><td>"+avto[j][0]+"</td><td>----</td><td>----</td><td>----</td></tr>");
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
      if(!m[1])continue;
      if(m[1].indexOf(avto[j][0].split(' ')[0])>=0){
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
              if(m[0]>=d2 && m[0]<d1){status0=3; name_buton0=m[6];}
              if(m[0]>=d1 && m[0]<d0){status1=3; name_buton1=m[6];}
              if(m[0]>=d0 && m[0]<d_1){status2=3; name_buton2=m[6];}
              if(m[0]>=d_1 && m[0]<d_2){status3=3; name_buton3=m[6];}
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

    $('#log_control_tb').append("<tr><td>"+avto[j][0]+"</td><td>"+bb1+"</td><td>"+bb2+"</td><td>"+bb3+"</td></tr>");
  } 
  let tb=document.getElementById("log_control_tb");
let spisok=''
  for (let i = 1; i<tb.rows.length; i++){
    if(tb.rows[i].cells[1].innerText== "")spisok+=tb.rows[i].cells[0].innerText.split(' ')[0]+',';
  }
  if(control_date!=control_date0){
    control_date0=control_date;
    marshrut_probeg_deny=[];
  }
  if (marshrut_probeg_deny.length==0){
    spisok =spisok.slice(0, -1);
    SendDataReportInCallback(d1/1000,d0/1000,spisok,zvit4,[],0,km_in_cels);
  } else{
    km_in_cels(marshrut_probeg_deny);
  }


}

let marshrut_probeg_deny=[];
let control_date0 = 0;
function km_in_cels(data){ 
  marshrut_probeg_deny=data;

  let tb = document.getElementById("log_control_tb");
  for (let i = 1; i<tb.rows.length; i++){
    for (let j = 0; j<marshrut_probeg_deny.length; j++){
    if (tb.rows[i].cells[0].innerText.split(' ')[0]==marshrut_probeg_deny[j][0][1].split(' ')[0] && parseInt(marshrut_probeg_deny[j][1][1])>0 && tb.rows[i].cells[1].innerText== "") {
      tb.rows[i].cells[1].innerHTML="<button style = 'background: rgb(252, 244, 163);width: 100%;' >"+marshrut_probeg_deny[j][1][1]+"</button>";
      break;
    }
  }
  }
}  


$("#log_control_tb").on("click", function (evt){
  let tb = evt.target.parentNode.parentNode.parentNode;
  let row = evt.target.parentNode.parentNode;
  if(row.rowIndex>0 && evt.target.innerText =='на ремонт'){
  let t=Date.parse(tb.rows[0].cells[evt.target.parentNode.cellIndex].innerText);
  let n=row.cells[0].innerText;
  let m='ремонт';
    write_jurnal(20233,'MR-avto.txt','||'+t+'|'+n+'|'+m+'|\n',function () { 
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
    write_jurnal(20233,'MR-avto.txt','||'+t+'|'+n+'|'+m+'|\n',function () { 
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
  $('#marh_zvit_tb').hide();
  $('#marshrut_text').show();
  $('#upd_marsh_bt').show();
  let t=Date.parse(tb.rows[0].cells[evt.target.parentNode.cellIndex].innerText);
  let d0=new Date(t);
  d0.setHours(0, 0, 0, 0);
  t =Date.parse(d0);
  let n=row.cells[0].innerText;
  $('#cont_unit').text(n);
  $('#cont_time').text(tb.rows[0].cells[evt.target.parentNode.cellIndex].innerText);
  $('#marshrut_text').val('');

  $('#log_marh_tb').empty();
  $('#log_marh_tb').append("<tr>  <td>1</td>  <td></td>  <td></td> </tr> <tr><td style = ' border: 1px solid black; '><div class='autocomplete'  ><div class ='inp' id='myInput-1' type='text'   contenteditable='true' ></div></div></td>  <td style = 'font-size:14px;min-width: 15px; cursor: pointer;border: 1px solid black; background:rgb(247, 161, 161);'>-</td><td style = 'font-size:14px;min-width: 15px; cursor: pointer; background:rgb(170, 248, 170);'>+</td> </tr> <tr><td></td> <td></td> <td></td> </tr> <tr> <td></td> <td></td> <td></td> </tr> <tr> <td><input type='checkbox' checked></td>   <td></td> <td></td> </tr>");
  
   for (let v = 1; v<logistik_data.length; v++){
    let m=logistik_data[v].split('|');
    if(!m[1])continue;
    if(m[1].indexOf(n.split(' ')[0])>=0 && m[0]>=t && m[0]<t+86400000){
      if(m[2]=='ремонт')continue;
      if(m[2]=='готовий')continue;
      if(m[2]=='видалено')continue;
     $('#marshrut_text').val(m[6]);
   let text =m[2].split('//');
   let point =m[3].split('//');
   let radius =m[4].split('//');
   let chek =m[5].split('//');
   let kkkk=0;
   $('#cont_unit').text(m[1]);
   $('#log_marh_tb').empty();
   $('#log_marh_tb').append("<tr></tr><tr></tr><tr></tr><tr></tr><tr></tr>");
   let tb=document.getElementById("log_marh_tb");
   let row = document.getElementById("log_marh_tb").rows[1];
          for (let i = 0; i<text.length; i++){
            kkkk++;
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
                el2.textContent = text[i];
                autocomplete(el2, adresa);
                el.appendChild(el2);
                td.appendChild(el);
                td = row.insertCell(ind+2);
                td.innerText=" - "
                td.style = 'font-size:14px; min-width: 15px; background: rgb(247, 161, 161); cursor:pointer; border: 1px solid black;';
                td = row.insertCell(ind+3);
                td.innerText=" + "
                td.style = 'font-size:14px; min-width: 15px; background: rgb(170, 248, 170);cursor:pointer';
                tb.rows[0].insertCell(ind+1);
                tb.rows[0].insertCell(ind+2);
                tb.rows[0].insertCell(ind+3);
                tb.rows[2].insertCell(ind+1);
                tb.rows[2].insertCell(ind+2);
                tb.rows[2].insertCell(ind+3); 
                tb.rows[3].insertCell(ind+1);
                tb.rows[3].insertCell(ind+2);
                tb.rows[3].insertCell(ind+3);  
                tb.rows[4].insertCell(ind+1);
                tb.rows[4].insertCell(ind+2);
                tb.rows[4].insertCell(ind+3);


                    tb.rows[0].cells[ind+1].textContent=kkkk;
                    tb.rows[0].cells[ind+1].style='cursor:pointer';
                    tb.rows[3].cells[ind+1].textContent=radius[i];
                    tb.rows[3].cells[ind+1].setAttribute('contenteditable', 'true');
                    tb.rows[2].cells[ind+1].textContent=point[i];
                    tb.rows[2].cells[ind+1].style = ' display: none; overflow: hidden;';
                    if (chek[i]=='true') {
                      tb.rows[4].cells[ind+1].innerHTML = "<input type='checkbox' checked>";
                    }else{
                      tb.rows[4].cells[ind+1].innerHTML = "<input type='checkbox'>";
                    }
             

                       
          }
    }
  }
  marshrut();  
  marshrut_rote(marshrut_point,-100);
}

// let name = evt.target.parentNode;
// if(name.cells){
//   name = evt.target.parentNode.cells[0].innerText;
// }else{
//   name = evt.target.parentNode.parentNode.cells[0].innerText;
// }


//      for (let i = 0; i<unitslist.length; i++){
//       let nm=unitslist[i].getName();
//       let id=unitslist[i].getId();
//      if(nm == name){
//       let y=unitslist[i].getPosition().y;
//       let x=unitslist[i].getPosition().x;
//       map.setView([y,x+0.5],10,{animate: false});
//       $("#lis0").chosen().val(id);
//       $("#lis0").trigger("chosen:updated");
//       markerByUnit[id].openPopup();
//       layers[0]=0;
//       show_track();
//         break;
//      }
//      }
});

$("#cont_b1").on("click", function (){
  marshrut();
  let t=Date.parse($('#cont_time').text());
  let n=$('#cont_unit').text();
  let point='';
  let text='';
  let chek='';
  let radius ='';
  let coment = 'маршрут';
  if($('#marshrut_text').val())coment =$('#marshrut_text').val();
  for(let i=0;i<marshrut_point.length;i++){
   if(text==''){text=marshrut_point[i][1];}else{text+='//'+marshrut_point[i][1];}
   if(point==''){point=marshrut_point[i][2]+','+marshrut_point[i][3];}else{point+='//'+marshrut_point[i][2]+','+marshrut_point[i][3];}
   if(chek==''){chek=marshrut_point[i][5];}else{chek+='//'+marshrut_point[i][5];}
   if(radius==''){radius=marshrut_point[i][4];}else{radius+='//'+marshrut_point[i][4];}
  }


    write_jurnal(20233,'MR-avto.txt','||'+t+'|'+n+'|'+text+'|'+point+'|'+radius+'|'+chek+'|'+coment+'|\n',function () { 
      msg("маршрут змінено");
      audio.play();
      update_logistik_data(control_avto);
      return;
    });
  
  return;
});
$("#cont_b2").on("click", function (){
  let t=Date.parse($('#cont_time').text());
  let n=$('#cont_unit').text();
  let mm='видалено';
    write_jurnal(20233,'MR-avto.txt','||'+t+'|'+n+'|'+mm+'|\n',function () { 
      msg("маршрут видалено");
      audio.play();
      update_logistik_data(control_avto);
      return;
    });
  
  return;
});

$("#cont_b3").on("click", function (){
  let t=Date.parse($('#cont_time').text())-7200000;
  let t2=t+86400000;

  let n=$('#cont_unit').text();
  let id=unitsID[n];
  logistik_vodiy = n.split('_')[0].replace(/[^ ]+ /, '');
  n=n.split(' ')[0];
  $("#lis0").chosen().val(id);     
  $("#lis0").trigger("chosen:updated");
  //layers[0]=0;
  //show_track(t,t2);
  SendDataReportInCallback(t/1000,t2/1000,n,zvit2,[],0,logistik_zvit);
  return;
});

let logistik_vodiy = '';
let marshrut_point0 =[];
async function logistik_zvit(data){
  if(data.length==0){
    alert("Відсутні данні за період, або невірний номер авто");
    return;
  }
  $('button').prop("disabled", true);
  clearGarbage(marshrut_garbage);
  clearGarbage(marshrut_treck);
  marshrut_point0 = [];
  let tb = document.getElementById("log_marh_tb");
  if (tb.rows[0]) {
    for (let j = 0; j<tb.rows[0].cells.length; j+=3){
      if (tb.rows[0].cells[j].textContent!="") {
        let n = tb.rows[1].cells[j].children[0].children[0].textContent;
        let y = parseFloat(tb.rows[2].cells[j].textContent.split(',')[0]);
        let x = parseFloat(tb.rows[2].cells[j].textContent.split(',')[1]);
        let r = tb.rows[3].cells[j].textContent; 
        if (r!='----') r=parseInt(r); 
        let c = tb.rows[4].cells[j].getElementsByTagName('input')[0].checked;
        marshrut_point0.push([n,y,x,r,c]);
      }
      }
    
  }
  

  $('#log_marh_tb').empty();
  $('#log_marh_tb').append("<tr></tr><tr></tr><tr></tr><tr></tr><tr></tr>");


      let sttime = 150;

      let adres='';
      let adres0='';
      let stoyanka = 500;
      let stoyanka0 = 0;
      let km = 0;
      let start="";
      let end="";
      let yyyyy=0;
      let xxxxx=0;
      let start_y=0;
      let start_x=0;
      let y000=0;
      let x000=0;
      let kkk=0;
       let nametr = data[0][0][1];
       let id = data[0][0][0];

   
         for (let ii = 3; ii<data[0].length-1; ii+=1){

          let time0 = data[0][ii-1][1];
          let time1 = Date.parse(data[0][ii-1][1])/1000;
          let time2 = Date.parse(data[0][ii][1])/1000;
       
         if(parseInt(data[0][ii][2])<10){
          stoyanka+=time2-time1; 
          stoyanka0=stoyanka;
          if(!data[0][ii][0])continue;
          start_y=parseFloat(data[0][ii][0].split(',')[0]);
          start_x=parseFloat(data[0][ii][0].split(',')[1]);
         }
         if(!data[0][ii][0])continue;
         if(!data[0][ii-1][2])continue;
         if(!data[0][ii+1][2])continue;
         if(parseInt(data[0][ii][2])>0){
          let yy = parseFloat(data[0][ii][0].split(',')[0]);
          let xx = parseFloat(data[0][ii][0].split(',')[1]);
          let yyy = parseFloat(data[0][ii+1][0].split(',')[0]);
          let xxx = parseFloat(data[0][ii+1][0].split(',')[1]);
          km+=(wialon.util.Geometry.getDistance(yy,xx,yyy,xxx))/1000;
         }
         if(data[0][ii-1][0]){
          yyyyy=parseFloat(data[0][ii-1][0].split(',')[0]);
          xxxxx=parseFloat(data[0][ii-1][0].split(',')[1]);
        }
         if(ii==data[0].length-6){
          //if(stoyanka<sttime)continue;
       
              let y = yyyyy;
              let x = xxxxx;

          
              stoyanka=0;
              start_y=0;
              start_x=0;

              adres=point_in_marshrut(y,x);
              if(adres){
                let name = adres[0][0];
                let yp=y;
                let xp=x;
                let point = yp+","+xp;
                let r =  300;
                let c = adres[0][4];
                  if(wialon.util.Geometry.getDistance(y000,x000,yp,xp)<r && km<0.5)continue;
                kkk++;
                marshrut_point0.splice(adres[1], 1);
                add_point_to_table(kkk,name,point,r,c,id,time0,stoyanka0);
                adres0 =name;
                y000=y;
                x000=x;
              }else{
                adres=point_in_data(y,x);
                if(adres){
                  let name = adres[3];
                  let yp=y;
                  let xp=x;
                  let point = yp+","+xp;
                  let r =  parseInt(adres[2]);
                  let c = false;
                  if(wialon.util.Geometry.getDistance(y000,x000,yp,xp)<r && km<0.5)continue;
                    kkk++;
                  //let mar = L.marker([y1,x1], {icon: L.divIcon({ className: 'div-icon',iconSize: "auto", html: "<center style = 'background:rgb(170, 248, 170);'>"+kkk+": "+name+"</center>" }),draggable: true,opacity:0.9,zIndexOffset:1000}).addTo(map);
                  //zup_mark_data.push(mar);
                  add_point_to_table(kkk,name,point,r,c,id,time0,stoyanka0);
                  adres0 =name;
                  y000=y;
                  x000=x;
                }else{
                  adres=await point_in_global(y,x); 
                  if(wialon.util.Geometry.getDistance(y000,x000,y,x)<300  && km<500)continue;
                  kkk++;
                  //let mar = L.marker([y,x], {icon: L.divIcon({ className: 'div-icon',iconSize: "auto", html: "<center style = 'background:rgb(247, 161, 161);'>"+kkk+": "+adres+"</center>" }),draggable: true,opacity:0.9,zIndexOffset:1000}).addTo(map);
                  //zup_mark_data.push(mar);
                  let point=y+","+x;
                  add_point_to_table(kkk,adres,point,100,false,id,time0,stoyanka0);
                  adres0 =adres;
                  y000=y;
                  x000=x;
                }
              }
           
        
         }


         if(parseInt(data[0][ii][2])>=10){
          if(!data[0][ii][0])continue;
         if(!data[0][ii-1][2])continue;
         if(!data[0][ii+1][2])continue;
          if (start==0)start=data[0][ii][1];
          end=data[0][ii][1];

          if(stoyanka>sttime){ 
              
              let y = start_y;
              let x = start_x;
   
              if (y==0) {
                y=yyyyy;
                x=xxxxx;
                if (y!=0) {
                stoyanka=0;
                start_y=0;
                start_x=0;
                adres=point_in_marshrut(y,x);
                if(adres){
                  let name = adres[0][0];
                  let yp=y;
                  let xp=x;
                  let point = yp+","+xp;
                  let r =  300;
                  let c = adres[0][4];
                  if(wialon.util.Geometry.getDistance(y000,x000,yp,xp)>r  && yp!=0){
                  kkk++;
                  marshrut_point0.splice(adres[1], 1);
                  add_point_to_table(kkk,name,point,r,c,id,time0,stoyanka0);
                  adres0 =name;
                  km=0;
                  y000=y;
                  x000=x;
                  }
                }else{
                adres=point_in_data(y,x);
                if(adres){ 
                  let name = adres[3];
                  let yp=y;
                  let xp=x;
                  let point = yp+","+xp;
                  let r =  parseInt(adres[2]);
                  let c = false;
                  if(wialon.util.Geometry.getDistance(y000,x000,yp,xp)>r &&  yp!=0){
                    kkk++;
                  add_point_to_table(kkk,name,point,r,c,id,time0,stoyanka0);
                  adres0 =name;
                  km=0;
                  y000=y;
                  x000=x;
                  }
                }else{
                  adres=await point_in_global(y,x); 
                  if(wialon.util.Geometry.getDistance(y000,x000,y,x)>300 && y!=0){
                    kkk++;
                    let point=y+","+x;
                    add_point_to_table(kkk,adres,point,100,false,id,time0,stoyanka0);
                    adres0 =adres;
                    km=0;
                    y000=y;
                    x000=x;
                  }  
                }
              }
            }else{
                y=parseFloat(data[0][ii][0].split(',')[0]);
                x=parseFloat(data[0][ii][0].split(',')[1]);
                if (y!=0) {
                adres=point_in_marshrut(y,x);
                if(adres){
                  let name = adres[0][0];
                  let yp=y;
                  let xp=x;
                  let point = yp+","+xp;
                  let r =  300;
                  let c = adres[0][4];
                  if(wialon.util.Geometry.getDistance(y000,x000,yp,xp)>r &&  yp!=0){
                  kkk++;
                  marshrut_point0.splice(adres[1], 1);
                  add_point_to_table(kkk,name,point,r,c,id,time0,stoyanka0);
                  adres0 =name;
                  km=0;
                  y000=y;
                  x000=x;
                  }
                }else{
                adres=point_in_data(y,x);
                if(adres){
                  let name = adres[3];
                  let yp=y;
                  let xp=x;
                  let point = yp+","+xp;
                  let r =  parseInt(adres[2]);
                  let c = false;
                  if( wialon.util.Geometry.getDistance(y000,x000,yp,xp)>r &&  yp!=0){
                    kkk++;
                  add_point_to_table(kkk,name,point,r,c,id,time0,stoyanka0);
                  adres0 =name;
                  km=0;
                  y000=y;
                  x000=x;
                  }
                }else{
                  adres=await point_in_global(y,x); 
                  if(wialon.util.Geometry.getDistance(y000,x000,y,x)>300 && y!=0){
                    kkk++;
                    let point=y+","+x;
                    add_point_to_table(kkk,adres,point,100,false,id,time0,stoyanka0);
                    adres0 =adres;
                    km=0;
                    y000=y;
                    x000=x;
                  }  
                }
              }
            }
            }
              } else {
  
              stoyanka=0;
              start_y=0;
              start_x=0;

              adres=point_in_marshrut(y,x);
              if(adres){
                let name = adres[0][0];
                let yp=y;
                let xp=x;
                let point = yp+","+xp;
                let r =  300;
                let c = adres[0][4];
                  if(wialon.util.Geometry.getDistance(y000,x000,yp,xp)<r)continue;
                  if(yp==0)continue;
                kkk++;
                marshrut_point0.splice(adres[1], 1);
                add_point_to_table(kkk,name,point,r,c,id,time0,stoyanka0);
                adres0 =name;
                km=0;
                y000=y;
                x000=x;
              }else{
                adres=point_in_data(y,x);
                if(adres){
                  let name = adres[3];
                    let yp=y;
                    let xp=x;
                    let point = yp+","+xp;
                    let r =  parseInt(adres[2]);
                    let c = false;
                    if(wialon.util.Geometry.getDistance(y000,x000,yp,xp)<r)continue;
                    if(yp==0)continue;
                      kkk++;
                    add_point_to_table(kkk,name,point,r,c,id,time0,stoyanka0);
                   
                    adres0 =name;
                    km=0;
                    y000=y;
                    x000=x;
                }else{
                  adres=await point_in_global(y,x); 
                  if(wialon.util.Geometry.getDistance(y000,x000,y,x)<300)continue;
                  if(y==0)continue;
                  kkk++;
                  let point=y+","+x;
                  add_point_to_table(kkk,adres,point,100,false,id,time0,stoyanka0);
                  adres0 =adres;
                  km=0;
                  y000=y;
                  x000=x;
                }
              }
            }
        
            }else{
              if(ii<31)continue;
              if(ii>data[0].length-11)continue;
              if(stoyanka==0)continue;


     
              let y0 = 0;
              let x0 = 0;
              let y1 = start_y;
              let x1 = start_x;
              if(y1==0)y1=yyyyy;
              if(x1==0)x1=xxxxx;
              let y2 = 0;
              let x2 = 0;
             
              stoyanka=0;
              start_y=0;
              start_x=0;
             
                  let b0=100;
                  let b1=50;
                  let b00=100;
                  let b11=50;
              outer:for (let v = 1; v<1000; v++){ 
                if(data[0].length-1<ii+v)break;
                if(!data[0][ii+v][0])continue;
                if(parseInt(data[0][ii+v][2])<=5)continue;
                let yt = parseFloat(data[0][ii+v][0].split(',')[0]);
                let xt = parseFloat(data[0][ii+v][0].split(',')[1]);
                if(wialon.util.Geometry.getDistance(yt,xt,y1,x1)>30){
                  for (let vv = 1; vv<1000; vv++){
                    if(ii-vv<5)break outer;
                    if(!data[0][ii-vv][0])continue;
                    if(parseInt(data[0][ii-vv][2])<=5)continue;
                    let ytt = parseFloat(data[0][ii-vv][0].split(',')[0]);
                    let xtt = parseFloat(data[0][ii-vv][0].split(',')[1]);       
                    if(wialon.util.Geometry.getDistance(ytt,xtt,y1,x1)>30){
                     
                      let p0 = turf.point([xt, yt]);
                      let p1 = turf.point([x1, y1]);
                      let p2 = turf.point([xtt, ytt]);
                      x0=xt;
                      y0=yt;
                      x2=xtt;
                      y2=ytt;
                      //L.polyline([[y0, x0],[y1, x1]], {color: 'blue'}).addTo(map);
                      //L.polyline([[y1, x1],[y2, x2]], {color: 'red'}).addTo(map);
                       b0 = turf.bearing(p1, p0);
                       b1 = turf.bearing(p1, p2);
                       break outer;
                    }
                  }
                }
              }
              outer:for (let v = 1; v<1000; v++){ 
                if(data[0].length-1<ii+v)break;
                if(!data[0][ii+v][0])continue;
                if(parseInt(data[0][ii+v][2])<=5)continue;
                let yt = parseFloat(data[0][ii+v][0].split(',')[0]);
                let xt = parseFloat(data[0][ii+v][0].split(',')[1]);
                if(wialon.util.Geometry.getDistance(yt,xt,y1,x1)>60){
                  for (let vv = 1; vv<1000; vv++){
                    if(ii-vv<5)break outer;
                    if(!data[0][ii-vv][0])continue;
                    if(parseInt(data[0][ii-vv][2])<=5)continue;
                    let ytt = parseFloat(data[0][ii-vv][0].split(',')[0]);
                    let xtt = parseFloat(data[0][ii-vv][0].split(',')[1]);       
                    if(wialon.util.Geometry.getDistance(ytt,xtt,y1,x1)>60){
                     
                      let p0 = turf.point([xt, yt]);
                      let p1 = turf.point([x1, y1]);
                      let p2 = turf.point([xtt, ytt]);
                      x0=xt;
                      y0=yt;
                      x2=xtt;
                      y2=ytt;
                      //L.polyline([[y0, x0],[y1, x1]], {color: 'blue'}).addTo(map);
                      //L.polyline([[y1, x1],[y2, x2]], {color: 'red'}).addTo(map);
                       b00 = turf.bearing(p1, p0);
                       b11 = turf.bearing(p1, p2);
                       break outer;
                    }
                  }
                }
              }

              if(Math.abs(b0-b1)<30 || Math.abs(b0-b1)>330 || Math.abs(b00-b11)<30 || Math.abs(b00-b11)>330){ 
                //L.polyline([[y0, x0],[y1, x1]], {color: '#55ff33'}).addTo(map);
                //L.polyline([[y1, x1],[y2, x2]], {color: '#55ff33'}).addTo(map);

                adres=point_in_marshrut(y1,x1);
                if(adres){
                  let name = adres[0][0];
                  let yp=y1;
                  let xp=x1;
                  let point = yp+","+xp;
                  let r =  300;
                  let c = adres[0][4];
                  if(wialon.util.Geometry.getDistance(y000,x000,yp,xp)<r)continue;
                  if(y1==0)continue;
                kkk++;
                marshrut_point0.splice(adres[1], 1);
                add_point_to_table(kkk,name,point,r,c,id,time0,stoyanka0);
                adres0 =name;
                km=0;
                y000=y1;
                x000=x1;
                }else{
                  adres=point_in_data(y1,x1);
                  if(adres){
                    let name = adres[3];
                    let yp=y1;
                    let xp=x1;
                    let point = yp+","+xp;
                    let r =  parseInt(adres[2]);
                    let c = false;
                    if(wialon.util.Geometry.getDistance(y000,x000,yp,xp)<r)continue;
                    if(y1==0)continue;
                      kkk++;
                    //let mar = L.marker([y1,x1], {icon: L.divIcon({ className: 'div-icon',iconSize: "auto", html: "<center style = 'background:rgb(170, 248, 170);'>"+kkk+": "+name+"</center>" }),draggable: true,opacity:0.9,zIndexOffset:1000}).addTo(map);
                   // zup_mark_data.push(mar);
                    add_point_to_table(kkk,name,point,r,c,id,time0,stoyanka0);
                    adres0 =name;
                    km=0;
                    y000=y1;
                    x000=x1;
                  }else{
                    adres=await point_in_global(y1,x1); 
                    if(wialon.util.Geometry.getDistance(y000,x000,y1,x1)<300)continue;
                    if(y1==0)continue;
                    kkk++;
                    //let mar = L.marker([y1,x1], {icon: L.divIcon({ className: 'div-icon',iconSize: "auto", html: "<center style = 'background:rgb(247, 161, 161);'>"+kkk+": "+adres+"</center>" }),draggable: true,opacity:0.9,zIndexOffset:1000}).addTo(map);
                   // zup_mark_data.push(mar);
                    let point=y1+","+x1;
                    add_point_to_table(kkk,adres,point,100,false,id,time0,stoyanka0);
                    adres0 =adres;
                    km=0;
                    y000=y1;
                    x000=x1;
                  }
                }
              }             
            }
            stoyanka=0;
            start_y=0;
            start_x=0;
            adres='';
         }
     

       }
     marshrut();
     

     let c1=-1;
     let c2=-1;
     let from=0;
     let to=0;
     let probeg=0;
     let probeg1=0;
     let probeg2=0;
     let probeg3=0;
     let motogod=0;
     let motogod1=0;
     let motogod2=0;
     let motogod3=0;
     let odometr0=0;
     let odometr1=0;
     let vrusi=0;
     let vrusi1=0;
     let begin_marshrut=0;
     let end_marshrut=0;
     let begin_marshrut0=0;
     let end_marshrut0=0;
     let p1=0;
     let p2=0;
     let stops = 0;
     let mar_text ='';
     for (let j = 0; j<tb.rows[0].cells.length; j+=3){
      if(tb.rows[0].cells[j].textContent=='')continue;
      mar_text+=' - '+tb.rows[1].cells[j].children[0].children[0].textContent;
      if(c1==-1){
         c1=j;
         from =  Date.parse(tb.rows[2].cells[c1+2].textContent);
         continue;
      }else{
        c2=j;
        to = Date.parse(tb.rows[2].cells[c2+2].textContent);
        if (tb.rows[4].cells[c1].getElementsByTagName('input')[0].checked==false  || tb.rows[4].cells[c2].getElementsByTagName('input')[0].checked==false) {
          for(let i=2;i<data[0].length;i++){
            if(!data[0][i][1] || !data[0][i-1][1])continue;
            if(data[0][i][21] && data[0][i][21]!='-----'){
              if(odometr0==0)odometr0=parseInt(data[0][i][21]);
              odometr1=parseInt(data[0][i][21]);
            }
            let d1=Date.parse(data[0][i][1]);
            if(d1<from || d1>to)continue;
            let time1 = Date.parse(data[0][i-1][1])/1000;
            let time2 = Date.parse(data[0][i][1])/1000;
            if(parseInt(data[0][i][2])>2){
              if(begin_marshrut==0)begin_marshrut=time2;
              if(begin_marshrut0==0)begin_marshrut0=data[0][i][1];
              end_marshrut=time2;
              end_marshrut0=data[0][i][1];
              vrusi+=time2-time1;
             }
             motogod+=time2-time1;

            if(!data[0][i][0] || !data[0][i-1][0] || parseInt(data[0][i][2])<1)continue;
             let y = parseFloat(data[0][i-1][0].split(',')[0]);
             let x = parseFloat(data[0][i-1][0].split(',')[1]);
             let yy = parseFloat(data[0][i][0].split(',')[0]);
             let xx = parseFloat(data[0][i][0].split(',')[1]);
             let dis = wialon.util.Geometry.getDistance(y, x, yy, xx);
            
             probeg+=dis;
             probeg3+=dis;
       
             marshrut_data.push([y,x],[yy,xx]);
          }
          let l = L.polyline([marshrut_data], {color: 'rgb(228, 12, 12)',weight:2,opacity:1}).addTo(map);
          marshrut_treck.push(l);
          marshrut_data=[];

          
          if (tb.rows[4].cells[c1].getElementsByTagName('input')[0].checked==true) {p1=tb.rows[2].cells[c1].textContent;}else{stops+=parseInt(tb.rows[2].cells[c1+1].textContent.split(',')[1]);}
          if (tb.rows[4].cells[c2].getElementsByTagName('input')[0].checked==true) {
            p2=tb.rows[2].cells[c2].textContent;
            if(p1==0)p1=tb.rows[2].cells[c1].textContent;
            let rout_data = await point_to_point_rote_marshrut(p1,p2);
            probeg2 += parseFloat(rout_data[0]);
            motogod2+= parseFloat(rout_data[1]);
          }

        } else {
          for(let i=2;i<data[0].length;i++){
           
            if(!data[0][i][1] || !data[0][i-1][1])continue;
            if(data[0][i][21] && data[0][i][21]!='-----'){
              if(odometr0==0)odometr0=parseInt(data[0][i][21]);
              odometr1=parseInt(data[0][i][21]);
            }
            let d1=Date.parse(data[0][i][1]);
            if(d1<from || d1>to)continue;
            let time1 = Date.parse(data[0][i-1][1])/1000;
            let time2 = Date.parse(data[0][i][1])/1000;
            if(begin_marshrut!=0)motogod1+=time2-time1;
            if(parseInt(data[0][i][2])>2){
             if(begin_marshrut==0)begin_marshrut=time2;
             if(begin_marshrut0==0)begin_marshrut0=data[0][i][1];
             end_marshrut=time2;
             end_marshrut0=data[0][i][1];
             vrusi+=time2-time1;
             vrusi1+=time2-time1;
             motogod+=motogod1;
             motogod3+=motogod1;
             motogod1=0;
            }

            if(!data[0][i][0] || !data[0][i-1][0] || parseInt(data[0][i][2])<1)continue;
             let y = parseFloat(data[0][i-1][0].split(',')[0]);
             let x = parseFloat(data[0][i-1][0].split(',')[1]);
             let yy = parseFloat(data[0][i][0].split(',')[0]);
             let xx = parseFloat(data[0][i][0].split(',')[1]);
             let dis = wialon.util.Geometry.getDistance(y, x, yy, xx);
             
             probeg+=dis;
             probeg1+=dis;

             marshrut_data.push([y,x],[yy,xx]);
          }
          let l = L.polyline([marshrut_data], {color: 'rgb(70, 247, 0)',weight:4,opacity:1}).addTo(map);
          l.bringToBack();
          marshrut_treck.push(l);
          marshrut_data=[];
        }
        c1=c2;
        from =  to;
      }


     }
    


     let odo = odometr1 - odometr0;

     let m = Math.trunc(stops / 60) + '';
     let h = Math.trunc(m / 60) + '';
     m=(m % 60) + '';
     let s =(stops % 60) + '';

     let d0 = (probeg/1000).toFixed();
     let d1 = ((probeg1/1000)+probeg2).toFixed();
     let d2 = d0-d1;

     let t0 = end_marshrut - begin_marshrut;
     let t1 = motogod3+motogod2;
     if(t1>t0)t1=t0;
     let t2 = t0-t1;

     let r0 = vrusi;
     let r1 = vrusi1+motogod2;
     if(r1>t1)r1=t1;
     let r2 = r0-r1;

     let s0 = t0-r0;
     let s1 = t1-r1;
     let s2 = s0-s1;

     
     $('#marh_zvit_tb').empty();
     $('#marh_zvit_tb').show();
     $('#marh_zvit_tb').append("<thead><td>дата</td><td>водій</td><td>ТЗ</td><td>початок маршруту</td><td>кінкць маршруту</td><td>одометр</td><td>пробіг</td><td>розрахунок</td><td>відхилення</td><td>час</td><td>розрахунок</td><td>відхилення</td><td>в русі</td><td>розрахунок</td><td>відхилення</td></td><td>простій</td><td>розрахунок</td><td>відхилення</td><td>назва</td><td>маршрут</td></thead>");
     $('#marh_zvit_tb').append("<tr><td>"+$('#cont_time').text()+"</td><td>"+logistik_vodiy+"</td><td>"+$('#cont_unit').text()+"</td><td>"+begin_marshrut0+"</td><td>"+end_marshrut0+"</td><td>"+odo+"</td><td>"+d0+"</td><td>"+d1+"</td><td>"+d2+"</td><td>"+sec_to_time(t0)+"</td><td>"+sec_to_time(t1)+"</td><td>"+sec_to_time(t2)+"</td><td>"+sec_to_time(r0)+"</td><td>"+sec_to_time(r1)+"</td><td>"+sec_to_time(r2)+"</td><td>"+sec_to_time(s0)+"</td><td>"+sec_to_time(s1)+"</td><td>"+sec_to_time(s2)+"</td><td>"+ $('#marshrut_text').val()+"</td><td>"+mar_text+"</td></tr>");
 

  let cpdata= $('#cont_time').text() + '\t'+logistik_vodiy + '\t' +$('#cont_unit').text() + '\t' +begin_marshrut0+ '\t' +end_marshrut0+ '\t' +odo + '\t' +d0 + ' \t' + d1 + '\t' + d2 + '\t' + sec_to_time(t0) + '\t' + sec_to_time(t1)+ '\t' + sec_to_time(t2)+ '\t' + sec_to_time(r0)+ '\t' + sec_to_time(r1)+ '\t' + sec_to_time(r2)+ '\t' + sec_to_time(s0)+ '\t' + sec_to_time(s1)+ '\t' + sec_to_time(s2)+ '\t'+ $('#marshrut_text').val() + '\t' + mar_text +'\n';
  navigator.clipboard.writeText(cpdata);

  $('button').prop("disabled", false);
  $('#log').empty();
  msg('Завантажено');

  $("#cont_b4").on("click", function (){
    let cpdata= $('#cont_time').text() + '\t'+logistik_vodiy + '\t' +$('#cont_unit').text() + '\t' +begin_marshrut0+ '\t' +end_marshrut0+ '\t' +odo + '\t' +d0 + ' \t' + d1 + '\t' + d2 + '\t' + sec_to_time(t0) + '\t' + sec_to_time(t1)+ '\t' + sec_to_time(t2)+ '\t' + sec_to_time(r0)+ '\t' + sec_to_time(r1)+ '\t' + sec_to_time(r2)+ '\t' + sec_to_time(s0)+ '\t' + sec_to_time(s1)+ '\t' + sec_to_time(s2)+ '\t'+ $('#marshrut_text').val() + '\t' + mar_text +'\n';
    navigator.clipboard.writeText(cpdata);
  });

}

function point_in_marshrut(y,x) {
  for (let j = 0; j<marshrut_point0.length; j++){
    if (marshrut_point0[j][3]=="----") {
      for (let jj = 0; jj<stor.length; jj++){
        if(stor[jj][3].indexOf(marshrut_point0[j][0])>=0){
          let name = stor[jj][3];
        let yy = parseFloat(stor[jj][0]);
        let xx = parseFloat(stor[jj][1]);
        let r = parseInt(stor[jj][2]);
        if(wialon.util.Geometry.getDistance(y,x,yy,xx)<=r){
          let point = [[name,yy,xx,r,true],99999999999];
          return point;
        }
      }
    }
    }else{
      if(wialon.util.Geometry.getDistance(y,x,marshrut_point0[j][1],marshrut_point0[j][2])<=marshrut_point0[j][3]){
    let rt =  [marshrut_point0[j],j];
        return rt;
      }
    }
   
  }
  return null;
 }
function point_in_data(y,x) {
  for (let j = 0; j<stor.length; j++){
    if(wialon.util.Geometry.getDistance(y,x,stor[j][0],stor[j][1])<stor[j][2]){
      return stor[j];
    }
  }
  return null;
 }

 async function point_in_global(y,x) {
   let type='невідомо';
     // $.get('https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=UA&lat='+y+'&lon='+x+'', function(data){
     //    if (data.category =="shop")type="магазин"
     //    if (data.type =="hospital")type="лікарня"
     //    if (data.type =="pharmacy")type="аптека"
     //    if (data.type =="car_wash")type="автомийка"
     //    if (data.type =="kindergarten")type="садок"
     //    if (data.type =="supermarket")type="супермаркет"
     //    if (data.type =="parking")type="парковка"
     //    if (data.type =="hotel")type="готель"
     //    if (data.type =="fitness_centre")type="спортзал"
     //    if (data.type =="dentist")type="дантист"
     //    if (data.type =="university")type="університет"
     //    if (data.type =="unclassified")type="невідомо"
     //    if (data.type =="residential")type="жила зона"
     //    if (data.type =="apartments")type="жила зона"
     //    if (data.type =="primary")type="дорога"
     //    if (data.type =="secondary")type="дорога"
     //    if (data.type =="trunk")type="дорога"
     //    if (data.type =="post_office")type="пошта"
     //   });
     //   await sleep(1500); 
        return new Promise(function(resolve, reject) { resolve(type); });
 }
 async function point_to_point_rote_marshrut(p1,p2){

     let ax =parseFloat(p1.split(',')[0]);
     let ay =parseFloat(p1.split(',')[1]);
     let bx =parseFloat(p2.split(',')[0]);
     let by =parseFloat(p2.split(',')[1]);
     let d=0;
     let t=0;
        wialon.util.Gis.getRoute(ax,ay,bx,by,0, function(error, data) {
          if (error) { // error was happened
            msg(wialon.core.Errors.getErrorText(error));
            return;
          }
          if (data.status=="OK"){
             d= (data.distance.value/1000).toFixed(1);
             t= data.duration.value;
            let line=[];
            for (v = 0; v < data.points.length; v+=3) {
            line.push ([data.points[v].lat,data.points[v].lon]);
            } 
            let l = L.polyline([line], {color: 'rgb(255, 230, 4)',weight:2,opacity:1}).addTo(map);
            marshrut_treck.push(l);
          }
        });
        await sleep(1500); 
        let dt=[d,t];
        return new Promise(function(resolve, reject) { resolve(dt); });
    

}
 function add_point_to_table(id,text,point,radius,chek,unit_id,time,sto){
  let tb=document.getElementById("log_marh_tb");
  let row = tb.rows[1];
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
               el2.textContent = text;
               autocomplete(el2, adresa);
               el.appendChild(el2);
               td.appendChild(el);
               td = row.insertCell(ind+2);
               td.innerText=" - "
               td.style = 'font-size:14px; min-width: 15px; background: rgb(247, 161, 161); cursor:pointer; border: 1px solid black;';
               td = row.insertCell(ind+3);
               td.innerText=" + "
               td.style = 'font-size:14px; min-width: 15px; background: rgb(170, 248, 170);cursor:pointer';
               tb.rows[0].insertCell(ind+1);
               tb.rows[0].insertCell(ind+2);
               tb.rows[0].insertCell(ind+3);
               tb.rows[2].insertCell(ind+1);
               tb.rows[2].insertCell(ind+2);
               tb.rows[2].insertCell(ind+3); 
               tb.rows[3].insertCell(ind+1);
               tb.rows[3].insertCell(ind+2);
               tb.rows[3].insertCell(ind+3);  
               tb.rows[4].insertCell(ind+1);
               tb.rows[4].insertCell(ind+2);
               tb.rows[4].insertCell(ind+3);


                   tb.rows[0].cells[ind+1].textContent=id;
                   tb.rows[0].cells[ind+1].style='cursor:pointer';
                   tb.rows[3].cells[ind+1].textContent=radius;
                   tb.rows[3].cells[ind+1].setAttribute('contenteditable', 'true');
                   tb.rows[2].cells[ind+1].textContent=point;
                   tb.rows[2].cells[ind+1].style = ' display: none; overflow: hidden;';
                   tb.rows[2].cells[ind+2].textContent=unit_id+','+sto;
                   tb.rows[2].cells[ind+2].style = ' display: none; overflow: hidden;';
                   tb.rows[2].cells[ind+3].textContent=time;
                   tb.rows[2].cells[ind+3].style = ' display: none; overflow: hidden;';
                   //console.log(text);
                   //console.log(chek);
                   if (chek== true  || chek== 'true') {
                     tb.rows[4].cells[ind+1].innerHTML = "<input type='checkbox' checked>";
                   }else{
                     tb.rows[4].cells[ind+1].innerHTML = "<input type='checkbox'>";
                   }      
 }

//================================================MARSHRUTY-GRUZOVI=====================================================================================================
//======================================================================================================================================================================
//================================================MARSHRUTY-GRUZOVI=====================================================================================================
//======================================================================================================================================================================
//================================================MARSHRUTY-GRUZOVI=====================================================================================================
//======================================================================================================================================================================

function find_avto(e){
for(var i=0; i < allunits.length; i++){
  let name =allunits[i].getName();
  if(name.indexOf(e)>=0){
  let id =allunits[i].getId();
  let mar =  markerByUnit[id];
  let y=mar.getLatLng().lat;
  let x=mar.getLatLng().lng;
  map.setView([y,x+0.5], map.getZoom(),{animate: false});
  $("#lis0").chosen().val(id);
  $("#lis0").trigger("chosen:updated");
  mar.openPopup();
  layers[0]=0;
  show_track();
  return;
  }
}
}

function table_popup(e){
e.style ='background:""';
marshrut_problem_his.push([e.cells[1].innerText,e.cells[2].innerText,e.cells[3].innerText,e.cells[4].innerText]);
  }

  let marshrut_problem_his =[];
 function update_popUP(){
  let tb_m = document.getElementById('marsh_tb');
  let tb_a = document.getElementById('marsh_avto');
  let newdiv = newWindow.document.getElementById('mon_online_tb');
  newdiv.innerHTML = '';
  
  //onclick='window.opener.find_avto()'
  //if(!newWindow)return;
  //if(tb_m.length<2)return;
  //if(tb_a.length<2)return;


  //let tb = $(newWindow.document).find("#mon_online_tb");
  //tb.empty();
  let problem =[];
  for(var i=1; i < tb_m.rows.length; i++){
    if(tb_m.rows[i].cells[8].children[0].checked){
      let name_m = tb_m.rows[i].cells[1].innerText;
      let spisok = [];
      
        for(var ii=1; ii < tb_a.rows.length; ii++){
          if(tb_a.rows[ii].cells[5].innerText==name_m){
            spisok.push([tb_a.rows[ii].cells[1].innerText,tb_a.rows[ii].cells[2].innerText,tb_a.rows[ii].cells[3].innerText,tb_a.rows[ii].cells[4].innerText,tb_a.rows[ii].cells[5].innerText]);
          }
        }
        let res = calculate_mn(spisok,i-1);
          let zav=[];
          let rozv =[];
          let na_zav=[];
          let na_rozv = [];
        for(var ii=0; ii < res.length-1; ii++){
         if(res[ii][6]=='завантаження'){zav.push(res[ii]);}
         if(res[ii][6]=='розвантаження'){rozv.push(res[ii]);}
         if(res[ii][6]=='їде на розвантаження'){na_rozv.push(res[ii]);}
         if(res[ii][6]=='їде на завантаження'){na_zav.push(res[ii]);}
        }
      
        var div = document.createElement("div");
        div.style = 'margin-bottom: 10px;margin-right: 10px;min-width: 900px;';
        newdiv.appendChild(div);
        tbl = document.createElement('table');
        tbl.setAttribute("id", name_m);
        tbl.style = "min-width: 100%; font-size:14px;border: 3px solid black; border-collapse: collapse; font-family: 'Arial';";
        div.appendChild(tbl);
        let tb = $(newWindow.document).find("#"+name_m+"");

        tb.append("<tr><td></td><td></td><td><b>"+name_m+"</td><td></td><td></td><td><b>пробіг</td><td><b>ходки</td><td><b>місце</td><td><b>час</td></tr>");
         let st = "style = 'font-size:14px;border: 1px solid black; border-collapse: collapse;'";
         tb.append("<tr style ='background:rgb(219, 255, 198);'><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td><b>завантажується "+zav.length +"</td><td></td></tr>");
        zav.sort((a, b) => a[7] - b[7]);
        for(var ii=0; ii < zav.length; ii++){
          tb.append("<tr style ='background:rgb(219, 255, 198);'><td><button id = '"+zav[ii][1]+"'onclick='window.opener.find_avto(this.id)'>"+(ii+1)+"</button></td><td "+st+">"+zav[ii][0]+"</td><td "+st+">"+zav[ii][1]+"</td><td "+st+">"+zav[ii][2]+"</td><td "+st+">"+zav[ii][3]+"</td><td "+st+">"+zav[ii][4]+"</td><td "+st+">"+zav[ii][5]+"</td><td "+st+">"+zav[ii][6]+"</td><td "+st+">"+sec_to_time(zav[ii][7])+"</td></tr>");
        }
        tb.append("<tr style ='background:rgb(252, 250, 171);'><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td><b>їде завантаженим "+na_rozv.length +"</td><td></td></tr>");
        na_rozv.sort((a, b) => a[7] - b[7]);
        for(var ii=0; ii < na_rozv.length; ii++){
          tb.append("<tr style ='background:rgb(252, 250, 171);'><td><button id = '"+na_rozv[ii][1]+"'onclick='window.opener.find_avto(this.id)'>"+(ii+1)+"</button></td><td "+st+">"+na_rozv[ii][0]+"</td><td "+st+">"+na_rozv[ii][1]+"</td><td "+st+">"+na_rozv[ii][2]+"</td><td "+st+">"+na_rozv[ii][3]+"</td><td "+st+">"+na_rozv[ii][4]+"</td><td "+st+">"+na_rozv[ii][5]+"</td><td "+st+">"+na_rozv[ii][6]+"</td><td "+st+">"+sec_to_time(na_rozv[ii][7])+"</td></tr>");
        }
        tb.append("<tr style ='background:rgb(250, 190, 179);'><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td><b>їде пустий "+na_zav.length +"</td><td></td></tr>");
        na_zav.sort((a, b) => b[7] - a[7]);
        for(var ii=0; ii < na_zav.length; ii++){
          tb.append("<tr style ='background:rgb(250, 190, 179);'><td><button id = '"+na_zav[ii][1]+"'onclick='window.opener.find_avto(this.id)'>"+(ii+1)+"</button></td><td "+st+">"+na_zav[ii][0]+"</td><td "+st+">"+na_zav[ii][1]+"</td><td "+st+">"+na_zav[ii][2]+"</td><td "+st+">"+na_zav[ii][3]+"</td><td "+st+">"+na_zav[ii][4]+"</td><td "+st+">"+na_zav[ii][5]+"</td><td "+st+">"+na_zav[ii][6]+"</td><td "+st+">"+sec_to_time(na_zav[ii][7])+"</td></tr>");
        }
        tb.append("<tr style ='background:rgb(179, 204, 250);'><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td><b>розвантажується "+rozv.length +"</td><td></td></tr>");
        rozv.sort((a, b) => b[7] - a[7]);
        for(var ii=0; ii < rozv.length; ii++){
          tb.append("<tr style ='background:rgb(179, 204, 250);'><td><button id = '"+rozv[ii][1]+"'onclick='window.opener.find_avto(this.id)'>"+(ii+1)+"</button></td><td "+st+">"+rozv[ii][0]+"</td><td "+st+">"+rozv[ii][1]+"</td><td "+st+">"+rozv[ii][2]+"</td><td "+st+">"+rozv[ii][3]+"</td><td "+st+">"+rozv[ii][4]+"</td><td "+st+">"+rozv[ii][5]+"</td><td "+st+">"+rozv[ii][6]+"</td><td "+st+">"+sec_to_time(rozv[ii][7])+"</td></tr>");
        }

        
        for(var ii=0; ii < res[res.length-1].length; ii++){
          problem.push(res[res.length-1][ii]);
        }
    }
  }
  var div = document.createElement("div");
  div.style = 'margin-bottom: 10px;margin-right: 10px;min-width: 900px;';
  newdiv.appendChild(div);
  tbl = document.createElement('table');
  tbl.setAttribute("id", "problem_marsh");
  tbl.style = "min-width: 100%; font-size:14px;border: 3px solid black; border-collapse: collapse; font-family: 'Arial';";
  div.appendChild(tbl);
  let tb = $(newWindow.document).find("#problem_marsh");
  let st = "style = 'font-size:14px;border: 1px solid black; border-collapse: collapse;'";
  tb.append("<tr><td></td><td>авто</td><td>маршрут</td><td>порушення</td><td></td><td></td></tr>");
  for(var ii=0; ii < problem.length; ii++){
    let color = 'rgb(250, 190, 179)';
    for(var iii=0; iii < marshrut_problem_his.length; iii++){
       if(marshrut_problem_his[iii][0].split(' ')[0]==problem[ii][0].split(' ')[0] && marshrut_problem_his[iii][1]==problem[ii][1] && marshrut_problem_his[iii][2]==problem[ii][3] && marshrut_problem_his[iii][3]==problem[ii][2]){
        color = ''; 
        break;
       }
    }
    tb.append("<tr onclick='window.opener.table_popup(this)' style ='background:"+color+";'><td><button id = '"+problem[ii][0].split(' ')[0]+"'onclick='window.opener.find_avto(this.id)'>"+(ii+1)+"</button></td><td "+st+">"+problem[ii][0]+"</td><td "+st+">"+problem[ii][1]+"</td><td "+st+">"+problem[ii][3]+"</td><td "+st+">"+problem[ii][2]+"</td><td "+st+">"+sec_to_time(problem[ii][4])+"</td></tr>");
  }
  //tb.append("<tr onclick='window.opener.popUP(this);'><td><input type='checkbox' checked></td><td>"+nam+"</td><td>"+id+"</td></tr>");
 }

function calculate_mn(data,ind){
  let result=[];
  let buferpoly1 =[];
  marshrut_gruzoperevozky[ind][0]._latlngs[0].forEach(function(item){ buferpoly1.push({x:item.lat, y:item.lng}); });
  let buferpoly2 =[];
  marshrut_gruzoperevozky[ind][1]._latlngs[0].forEach(function(item){ buferpoly2.push({x:item.lat, y:item.lng}); });
  //wialon.util.Geometry.pointInShape(buferpoly1, 0, y, x)
  let porushennya_marshrut=[];
  for(var i=0; i < data.length; i++){
     let nomer = data[i][1].split(' ')[0];
     for(let ii = 0; ii<Global_DATA.length; ii++){ 
      let nametr = Global_DATA[ii][0][1];
      let vodiy = data[i][2];
      let prich = data[i][3];
      let avto = data[i][0];
      let marshrut = data[i][4];
      let stop=0;
      let stop_y =0;
      let stop_x =0;
      let stop_t =0;

      let zagr_t=0;
      let vigr_t=0;
      let dor_t=0;

      let km=0;

      let vodiy_tr = "";

      marsh=[];

         if(nametr.indexOf(nomer)>=0){
          for (let iii = 1; iii<Global_DATA[ii].length-1; iii++){
            if(!Global_DATA[ii][iii][0] && !Global_DATA[ii][iii+1][0])continue
            if(!Global_DATA[ii][iii][4])continue;
            if(!Global_DATA[ii][iii+1][4])continue;
            if(!Global_DATA[ii][iii][3])continue;

            if(Global_DATA[ii][iii][6]!=''){vodiy_tr=Global_DATA[ii][iii][6];}

            let t =(Global_DATA[ii][iii+1][4]-Global_DATA[ii][iii][4])/1000;

            if(Global_DATA[ii][iii][0] && Global_DATA[ii][iii+1][0]){
              let y = parseFloat(Global_DATA[ii][iii][0].split(',')[0]);
              let x = parseFloat(Global_DATA[ii][iii][0].split(',')[1]);
              let yy = parseFloat(Global_DATA[ii][iii+1][0].split(',')[0]);
              let xx = parseFloat(Global_DATA[ii][iii+1][0].split(',')[1]);

            if(parseInt(Global_DATA[ii][iii][3])>0){ 
              if(stop>30){
                if(wialon.util.Geometry.pointInShape(buferpoly1, 0,  stop_y, stop_x)){
                 if(marsh.length==0 || marsh[marsh.length-1]!='Z')  marsh.push('Z');
                  zagr_t+=stop;
                  vigr_t=0;
                  dor_t=0;
                 }else{
                  if(wialon.util.Geometry.pointInShape(buferpoly2, 0,  stop_y, stop_x)){
                    if(marsh.length==0 || marsh[marsh.length-1]!='V') marsh.push('V');
                    zagr_t=0;
                    vigr_t+=stop;
                    dor_t=0;
                  }else{
                    dor_t+=stop;
                    if(stop>300){
                      let porushennya ='зупинка в дорозі';
                      for(let j = 0; j<marshrut_gruzoperevozky.length; j++){
                       if(j==ind)continue;
                       let buferpoly11 =[];
                       marshrut_gruzoperevozky[j][0]._latlngs[0].forEach(function(item){ buferpoly11.push({x:item.lat, y:item.lng}); });
                       let buferpoly22 =[];
                       marshrut_gruzoperevozky[j][1]._latlngs[0].forEach(function(item){ buferpoly22.push({x:item.lat, y:item.lng}); });
                         if(wialon.util.Geometry.pointInShape(buferpoly11, 0,  stop_y, stop_x)){
                           porushennya='зупинка в іншій зоні завантаження';
                           break;
                         }else{
                           if(wialon.util.Geometry.pointInShape(buferpoly22, 0,  stop_y, stop_x)){
                             porushennya='зупинка в іншій зоні розвантаження';
                             break;
                           }
                         }
                       
                      }
                      if(marsh.length>0 || porushennya!='зупинка в дорозі'){
                        porushennya_marshrut.push([nametr,marshrut,stop_t,porushennya,stop,stop_y,stop_x]);
                      }
                    }
                  }
                 }

              }
             
            dor_t+=t;
            km+=(wialon.util.Geometry.getDistance(y,x,yy,xx))/1000;
            stop=0;
            stop_t=0;
            }else{
              stop+=t;
              stop_y  = parseFloat(Global_DATA[ii][iii][0].split(',')[0]);
              stop_x  = parseFloat(Global_DATA[ii][iii][0].split(',')[1]);
              if(stop_t==0)stop_t=Global_DATA[ii][iii][1];
            }


            }else{
              if(Global_DATA[ii][iii][0] && !Global_DATA[ii][iii+1][0]){
                let stop_yy = parseFloat(Global_DATA[ii][iii][0].split(',')[0]);
                let stop_xx = parseFloat(Global_DATA[ii][iii][0].split(',')[1]);
                stop=60;
                if(wialon.util.Geometry.pointInShape(buferpoly1, 0,  stop_yy, stop_xx)){
                  if(marsh.length==0 || marsh[marsh.length-1]!='Z')  marsh.push('Z');
                   zagr_t=stop;
                   vigr_t=0;
                   dor_t=0;
                   stop=0;
                  }else{
                    if(wialon.util.Geometry.pointInShape(buferpoly2, 0,  stop_yy, stop_xx)){
                      if(marsh.length==0 || marsh[marsh.length-1]!='V') marsh.push('V');
                      zagr_t=0;
                      vigr_t=stop;
                      dor_t=0;
                      stop=0;
                    }
                  }
              }
              if(!Global_DATA[ii][iii][0] && Global_DATA[ii][iii+1][0]){
                let stop_yy = parseFloat(Global_DATA[ii][iii+1][0].split(',')[0]);
                let stop_xx = parseFloat(Global_DATA[ii][iii+1][0].split(',')[1]);
                stop=60;
                if(wialon.util.Geometry.pointInShape(buferpoly1, 0,  stop_yy, stop_xx)){
                  if(marsh.length==0 || marsh[marsh.length-1]!='Z')  marsh.push('Z');
                   zagr_t=stop;
                   vigr_t=0;
                   dor_t=0;
                   stop=0;
                  }else{
                    if(wialon.util.Geometry.pointInShape(buferpoly2, 0,  stop_yy, stop_xx)){
                      if(marsh.length==0 || marsh[marsh.length-1]!='V') marsh.push('V');
                      zagr_t=0;
                      vigr_t=stop;
                      dor_t=0;
                      stop=0;
                    }
                  }
              }
            }

            


            
          }  
          if(stop>30){
            if(wialon.util.Geometry.pointInShape(buferpoly1, 0, stop_y, stop_x)){
             if(marsh.length==0 || marsh[marsh.length-1]!='Z') marsh.push('Z');
              zagr_t+=stop;
              vigr_t=0;
              dor_t=0;
             }else{
              if(wialon.util.Geometry.pointInShape(buferpoly2, 0, stop_y, stop_x)){
                if(marsh.length==0 || marsh[marsh.length-1]!='V')marsh.push('V');
                  zagr_t=0;
                  vigr_t+=stop;
                  dor_t=0;
              }else{
                dor_t+=stop;
                if(stop>300){
                let porushennya ='зупинка в дорозі';
                for(let j = 0; j<marshrut_gruzoperevozky.length-1; j++){
                 if(j==ind)continue;
                 let buferpoly11 =[];
                 marshrut_gruzoperevozky[j][0]._latlngs[0].forEach(function(item){ buferpoly11.push({x:item.lat, y:item.lng}); });
                 let buferpoly22 =[];
                 marshrut_gruzoperevozky[j][1]._latlngs[0].forEach(function(item){ buferpoly22.push({x:item.lat, y:item.lng}); });
                   if(wialon.util.Geometry.pointInShape(buferpoly11, 0,  stop_y, stop_x)){
                     porushennya='зупинка в іншій зоні завантаження';
                     break;
                   }else{
                     if(wialon.util.Geometry.pointInShape(buferpoly22, 0,  stop_y, stop_x)){
                       porushennya='зупинка в іншій зоні розвантаження';
                       break;
                     }
                   }
                 
                }
                if(marsh.length>0 || porushennya!='зупинка в дорозі'){
                  porushennya_marshrut.push([nametr,marshrut,stop_t,porushennya,stop,stop_y,stop_x]);
                }
                
              }
              }
             }
          }
          let direktion = 'S';
          let hodki = 0;
          if(marsh.length>0){
            hodki = (marsh.length/2).toFixed();
            if(marsh[marsh.length-1]=='Z'){
              direktion='Z';
              hodki-=1;
            }
            if(marsh[0]=='V') hodki-=1;
            if(marsh[marsh.length-1]=='V')direktion='V';
          }
          let position='невідомо';
          let time = 0;
          if(dor_t>500){
            if(direktion=='Z')position ="їде на розвантаження";
            if(direktion=='V')position ="їде на завантаження";
            time = dor_t;

          }else{
            if(zagr_t>0){
              position = "завантаження";
              time = zagr_t;
            }
            if(vigr_t>0){
              position = "розвантаження";
              time = vigr_t;
            }
          }
          if(position=='невідомо')porushennya_marshrut.push([nametr,marshrut,0,'не на маршруті',0,0,0]);
          if(vodiy_tr!='' && vodiy_tr!=vodiy)porushennya_marshrut.push([nametr,marshrut,0,'інша картка водія',0,0,0]);
          result.push([avto,nomer,vodiy,prich,km.toFixed(),hodki,position,time]); 
          km=0;
         }
      }
  }
  result.push(porushennya_marshrut); 
  return result;
}



 $('#marsh_bt0').click(function() {
  //if(newWindow)newWindow.close();
  if(!newWindow || newWindow.closed){
    newWindow = window.open("", '', " width=1000,height=1000, status=no,toolbar=no,menubar=no,location=no");
    newWindow.document.write("<div id='mon_online_tb' style = 'display: flex; flex-wrap: wrap;' ></div>");
  }
    
    update_popUP();
 });

 $('#marsh_bt2').click(function() {
  navigator.clipboard.readText()
  .then(text => {
    let rows = text.split('\r\n');
    $('#marsh_avto').empty();
    $('#marsh_avto').append("<tr><td></td><td>ГРУПА</td><td>ТЗ</td><td>ВОДІЙ</td><td>ПРИЧЕП</td><td>НАРЯД</td></tr>");
    for(var i=0; i < rows.length-1; i++){
      let td = rows[i].split('\t');
      let g=td[0];
      let n=td[2];
      let v=td[3];
      let p=td[4];
      let r=td[5];
  
      $('#marsh_avto').append("<tr><td><button id = '"+n.split(' ')[0]+"'onclick='find_avto(this.id)'>"+(i+1)+"</button></td><td>"+g+"</td><td contenteditable='true'>"+n+"</td><td contenteditable='true'>"+v+"</td><td contenteditable='true'>"+p+"</td><td contenteditable='true'>"+r+"</td></tr>");
     }
  })
  .catch(err => {
    console.log('Something went wrong', err);
  });
 });



 let marshrut_gruzoperevozky_temp = [];
 let marshrut_zony_temp = [];
 let marshrut_gruzoperevozky =[];
 let newWindow;
 function marshruty_gruzovi(polygon,color){
  if(polygon){
    polygon.addTo(map);
    marshrut_gruzoperevozky_temp.push(polygon);
    if(marshrut_gruzoperevozky_temp.length>1){
      marshrut_gruzoperevozky.push([marshrut_gruzoperevozky_temp[0],marshrut_gruzoperevozky_temp[1],color,'-----','інше','-----',false]);
      clearGarbage(marshrut_gruzoperevozky_temp);
      marshrut_gruzoperevozky_temp=[];
      update_marshrut(marshrut_gruzoperevozky);
    }
  }else{
    update_marshrut(marshrut_gruzoperevozky);
  }
 }

 function update_marshrut(data){
  $('#marsh_tb').empty();
     $('#marsh_tb').append("<tr><td>№</td><td>НАЗВА</td><td>КМ</td><td>ХВ</td><td>ВАНТАЖ</td><td>КОМБАЙНИ</td><td>РОЗРАХУНОК</td><td>ФАКТ</td><td>МОНІТОРИНГ</td><td>ВИДАЛИТИ</td></tr>");
     clearGarbage(marshrut_zony_temp);
     marshrut_zony_temp=[];
     [...document.querySelectorAll("#marsh_avto tr")].forEach(e => e.style.backgroundColor = '');
     for(let i=0; i < data.length; i++){
      if(data[i][3]=='-----')data[i][3] = 'маршрут'+(i+1);
      let row = "<tr>";   
      row += "<td style = 'background-color: "+data[i][2]+";'>"+(i+1)+"</td>";
      row += "<td contenteditable='true'>"+data[i][3]+"</td>";
      row += "<td>----</td>";
      row += "<td>----</td>";
      row += "<td><select><option value='інше'>інше</option><option value='кукурудза'>кукурудза</option><option value='пшениця'>пшениця</option><option value='соя'>соя</option><option value='ріпак'>ріпак</option><option value='соняшник'>соняшник</option><option value='ЗЗР'>ЗЗР</option><option value='вода'>вода</option><option value='добрива'>добрива</option></select></td>";
      row += "<td contenteditable='true'>"+data[i][5]+"</td>";
      row += "<td>----</td>";
      row += "<td>----</td>";
      row += "<td><input type='checkbox'></td>";
      row += "<td><button>Видалити</button></td></tr>";
      //add info in table
      $("#marsh_tb").append(row);
      let table = document.getElementById('marsh_tb');
      table.rows[table.rows.length-1].cells[4].children[0].value = data[i][4];
      table.rows[table.rows.length-1].cells[8].children[0].checked = data[i][6];
          let p1 = data[i][0].setStyle({color: data[i][2]}).setTooltipContent(""+data[i][3]+' завантаження'+"").addTo(map);
          let p2 = data[i][1].setStyle({color: data[i][2]}).setTooltipContent(""+data[i][3]+' розвантаження'+"").addTo(map);

          marshrut_zony_temp.push(p1,p2);

          let table2 = document.getElementById('marsh_avto');
          if(table2.rows.length>1){
            let kol =0;
            for(let v = 1; v<table2.rows.length; v++){
              if( table2.rows[v].cells[5].innerText==data[i][3]){
                kol++;
                table2.rows[v].cells[5].style = "background: "+data[i][2]+";";
                table2.rows[v].cells[0].style = "background: "+data[i][2]+";";
              }
            }
            if(kol>0)table.rows[i+1].cells[7].innerText=kol;
          }
          Rote_gruzoperevozki(data[i][0],data[i][1],data[i][2],i) 
     }
 }
 $("#marsh_bt5").on("click", function (evt){
  let table = document.getElementById('marsh_tb');
  for(let v = 1; v<table.rows.length; v++){
       marshrut_gruzoperevozky[v-1][3]=table.rows[v].cells[1].innerText;
       marshrut_gruzoperevozky[v-1][4]=table.rows[v].cells[4].children[0].value;
       marshrut_gruzoperevozky[v-1][5]=table.rows[v].cells[5].innerText;
       marshrut_gruzoperevozky[v-1][6]=table.rows[v].cells[8].children[0].checked;
       
  }
  update_marshrut(marshrut_gruzoperevozky);
 });

 $("#marsh_tb").on("click", function (evt){
  if (evt.target.parentNode.cellIndex==9){
    let ind = evt.target.parentNode.parentNode.rowIndex;
    marshrut_gruzoperevozky.splice(ind-1, 1);  
    update_marshrut(marshrut_gruzoperevozky);
    return;
   }


   let row = evt.target.parentNode;
   let ind = row.rowIndex;
  if(ind>0){
     if (evt.target.cellIndex==1){
      marshrut_gruzoperevozky[ind-1][0].setStyle({color: marshrut_gruzoperevozky[ind-1][2]}).addTo(map);
      marshrut_gruzoperevozky[ind-1][1].setStyle({color: marshrut_gruzoperevozky[ind-1][2]}).addTo(map);
      return;
     }

  }
});

function Rote_gruzoperevozki(p1,p2,color,ind){

  let center1 = p1.getBounds().getCenter();
  let center2 = p2.getBounds().getCenter();

    let ax = center1.lat;
    let ay = center1.lng;
    let bx = center2.lat;
    let by = center2.lng;
  
        wialon.util.Gis.getRoute(ax,ay,bx,by,0, function(error, data) {
          if (error) { // error was happened
            msg(wialon.core.Errors.getErrorText(error));
            return;
          }
          if (data.status=="OK"){
            let line=[];
            for (v = 0; v < data.points.length; v+=2) {
            line.push ([data.points[v].lat,data.points[v].lon]);
            } 
            let table = document.getElementById('marsh_tb');
            let wg = table.rows.length-ind+2;
            let l = L.polyline([line], {weight:wg,opacity:0.4,color: color}).addTo(map);
            marshrut_zony_temp.push(l);
            let d= (data.distance.value/1000).toFixed();
            let t= (data.duration.value*1.5/60).toFixed();
            table.rows[ind+1].cells[2].innerText = d;
            table.rows[ind+1].cells[3].innerText = t;
            if(parseInt(table.rows[ind+1].cells[5].innerText)>0){
              let mash = 0;
              let zmina = 12*60;
              let zagr = 15;
              let gektary = parseInt(table.rows[ind+1].cells[5].innerText)*30;
              let hodky = zmina/(t*2+zagr*2);
  
                 if(table.rows[ind+1].cells[4].children[0].value=='кукурудза')mash = (gektary*9/(hodky*24)).toFixed();
                 if(table.rows[ind+1].cells[4].children[0].value=='соняшник')mash = (gektary*3/(hodky*18)).toFixed();
                 if(table.rows[ind+1].cells[4].children[0].value=='соя')mash = (gektary*2.8/(hodky*30)).toFixed();
                 if(table.rows[ind+1].cells[4].children[0].value=='ріпак')mash = (gektary*2.7/(hodky*30)).toFixed();
                 if(table.rows[ind+1].cells[4].children[0].value=='пшениця')mash = (gektary*4.5/(hodky*36)).toFixed(); 
                 table.rows[ind+1].cells[6].innerText = mash+" маш "+(hodky).toFixed()+" ходки "+(t*2+zagr*2)+" хв/ходка";       
            }
          }
        });
}

