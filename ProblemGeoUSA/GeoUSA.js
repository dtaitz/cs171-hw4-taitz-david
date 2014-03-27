/**
 * Created by hen on 3/8/14.
 */

var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 1060 - margin.left - margin.right;
var height = 800 - margin.bottom - margin.top;
var centered;

var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300
};


var detailCanvas = d3.select("#detailVis").append("svg").attr({
  width: 350,
  height: 400

})

var detailVis = detailCanvas.append("g").attr({
    width:350,
    height:200
})


var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
    })

var svg = canvas.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });


var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);//.precision(.1);
var path = d3.geo.path().projection(projection);


var dataSet = {};




function loadStations() {
    d3.csv("../data/NSRDB_StationsMeta.csv",function(error,data){

        //console.log(data);

        var tip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(function(d) {
            return "<p>" + d["STATION"]+ "<br><strong>Sum:</strong> <span style='color:red'>" + completeDataSet[d["USAF"]]["sum"] + "</span></p>";
          })

        svg.call(tip);
          
        svg.selectAll("circle")
           .data(data)
           .enter()
           .append("circle")
           .attr('class','circle')
           .attr("cx", function(d) {
                if (projection([d["NSRDB_LON(dd)"], d["NSRDB_LAT (dd)"]]) != null){
                    //console.log(projection([d["NSRDB_LON(dd)"], d["NSRDB_LAT (dd)"]])[0]);
                    return projection([d["NSRDB_LON(dd)"], d["NSRDB_LAT (dd)"]])[0];
                }
           })
           .attr("cy", function(d) {
                if (projection([d["NSRDB_LON(dd)"], d["NSRDB_LAT (dd)"]]) != null){
                    //console.log(projection([d["NSRDB_LON(dd)"], d["NSRDB_LAT (dd)"]])[0]);
                    return projection([d["NSRDB_LON(dd)"], d["NSRDB_LAT (dd)"]])[1];
                }               
           })
           //.attr("r","2")
           .attr("r", function(d) {
                //console.log(d);

                    sumArray= [];

                    var rScale = d3.scale.linear()
                    .range([0, 8]);

                    Object.keys(completeDataSet).forEach(function(usafid){
                        //console.log(completeDataSet[usafid].sum);
                        //if (completeDataSet[usafid].sum >= 0){
                            sumArray.push(completeDataSet[usafid].sum);
                        //}

                    })
                    

                    rScale.domain([
                        d3.min(sumArray, function(d) { return d}),
                        d3.max(sumArray, function(d) { return d})
                    ]);

                var obj = completeDataSet[d["USAF"]];
                //console.log(obj);

                if (typeof(obj) === "undefined"){
                    return 3;
                }
                else {
                    return rScale(completeDataSet[d["USAF"]]["sum"]);
                }
                
                //console.log(completeDataSet[d["USAF"]]);
                //return rScale(completeDataSet[d["USAF"]].sum);
           })
           .style("fill", function(d) {

            var obj = completeDataSet[d["USAF"]];

            if (typeof(obj) === "undefined"){
                return "grey";
            }
            else {
                return "yellow";
            }

           })
           .style("opacity", 0.75)
           .on('mouseover', tip.show)
           .on('mouseout', tip.hide)
           .on('click', function(d) {return createDetailVis(completeDataSet, data, d["USAF"], d["STATION"]);})

    });
}



function loadStats() {

    d3.json("../data/reducedMonthStationHour2003_2004.json", function(error,data){
        completeDataSet= data;

		//console.log(completeDataSet);    
		
        loadStations();
    })

}




d3.json("../data/us-named.json", function(error, data) {

    //console.log(topojson.feature(data,data.objects.states));
    var usMap = topojson.feature(data,data.objects.states).features
    console.log(usMap);
    //console.log(usMap);

    svg.selectAll("country")
        //.attr("id", "states")
        .data(usMap)
        .enter()
        .append("path")
        .attr("d", path)
        .on("click", clicked)
        .style("fill", "steelblue");


    // see also: http://bl.ocks.org/mbostock/4122298
                        

    loadStats();
    //loadStations();
});



// ALL THESE FUNCTIONS are just a RECOMMENDATION !!!!
var updateDetailVis = function(){

  detailVis.selectAll(".bar").remove();

}


var createDetailVis = function(hourlydata, stationdata, location, name){

    //console.log(hourlydata);
    //console.log(stationdata);
    //console.log(location);
    //console.log(detailVis);

    detailVis.selectAll(".bar").remove();
    detailVis.selectAll(".axis").remove();
    detailVis.selectAll(".axis").remove();
    detailVis.selectAll(".tick").remove();
    detailVis.selectAll(".title").remove();

    var hours = [];
    var sunlight = [];
    var coordinates = [];
    var newHeight = 200;
    var xnewPadding = 80;
    var newWidth = 240;


    Object.keys(hourlydata[location]["hourly"]).forEach(function(key){
            hours.push(parseInt(key));
            sunlight.push(hourlydata[location]["hourly"][key]);
            coordinates.push([parseInt(key),hourlydata[location]["hourly"][key]])

    })

    //console.log(hours);
    //console.log(sunlight);
    //console.log(coordinates[0]);
    //console.log(hourlydata[location]["hourly"]);

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, newWidth], .1);

    var y = d3.scale.linear()
        .range([newHeight, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

      x.domain(hours);
      y.domain(d3.extent(sunlight, function(d){return d;}));

  detailVis.attr("transform", "translate("+ 0 +"," + 100 + ")")

  detailVis.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate("+ xnewPadding +"," + newHeight + ")")
      .call(xAxis);

  detailVis.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .attr("transform", "translate("+ xnewPadding +",0)")
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Sun");

  detailVis.selectAll(".bar")
      .data(coordinates)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d[0])+ xnewPadding;})
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d){return newHeight - y(d[1]);});

  detailVis.append("text")
      .attr("class", "title")
      //.style("color","red")
      //.style("font-size","7px")
      .text(name)
      .attr("transform", "translate("+xnewPadding/2+",-40)")

}


function clicked(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  svg.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  svg.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
}

// ZOOMING
function zoomToBB() {


}

function resetZoom() {
    
}


