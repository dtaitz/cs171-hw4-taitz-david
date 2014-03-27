/**
 * Created by hen on 3/8/14.
 */

var margin = {
    top: 275,
    right: 50,
    bottom: 100,
    left: 50
};

var width = 960 - margin.left - margin.right;
var height = 700 - margin.bottom - margin.top;
var codeConverter= [];
var newThreeCodes= [];




var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 250
};

var dataSet = {};
var converter = {};
var newCountryCodes= [];

var moveMargin = margin.top + 80;

var countryIDS = [];
var values = []

var svg = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
}).append("g").attr({
        transform: "translate(" + margin.left + "," + moveMargin + ")"
    });

// --- this is just for fun.. play arround with it iof you like :)
var projectionMethods = [
    {
        name:"mercator",
        method: d3.geo.mercator().translate([width / 2, height / 2])//.precision(.1);
    },{
        name:"equiRect",
        method: d3.geo.equirectangular().translate([width / 2, height / 2])//.precision(.1);
    },{
        name:"stereo",
        method: d3.geo.stereographic().translate([width / 2, height / 2])//.precision(.1);
    }
];
// --- this is just for fun.. play arround with it iof you like :)


var actualProjectionMethod = 0;
var colorMin = colorbrewer.Greens[3][0];
var colorMax = colorbrewer.Greens[3][2];

 /*  
//Define quantize scale to sort data values into buckets of color
var color = d3.scale.quantize()
                    .range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]);
                    //Colors taken from colorbrewer.js, included in the D3 download */



var path = d3.geo.path().projection(projectionMethods[0].method);

var nameValue = "allsa.bi_q1"; 
var yearValue = 1999;





function runAQueryOn(indicatorString,year) {

 $.ajax({
    url: "http://api.worldbank.org/countries/all/indicators/" + indicatorString + "?format=jsonP&prefix=Getdata&per_page=500&date=" + year, //do something here
    jsonpCallback:'getdata',
    dataType:'jsonp',
    success: function (data, status){
        //console.log(data);
        $.each(data[1], function(index, value) {
            //console.log(value);
            //console.log(value.value);
            //console.log(value.country.id);
            newThreeCodes = convertCode(value.country.id);
            dataSet[newThreeCodes]=value.value;

        })
        //console.log(dataSet);
        changeVis(dataSet);

        },
    error: function() {
        return console.log("error");
    } 
 });

}


var initVis = function(error, indicators, world){

    //console.log(indicators);

    var worldMap = world.features;

    var associations = [];
    var indicatorCodes = [];
    var indicatorNames = [];
    var years = [];
    for (var i=1980;i<=2013;i++)
    { 
        years.push(i);
    }

    indicators.forEach(function(d){
        indicatorCodes.push(d.IndicatorCode);
        indicatorNames.push(d.IndicatorName);
        associations.push([d.IndicatorCode, d.IndicatorName]);
    });

    //console.log(worldMap);
    
    var country = svg.insert("g", ".graticule")
      .attr("class", "country")
      .selectAll("path")
      .data(worldMap)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", function(d){ return d.id;})
      .style("fill", "white");


    var nameDropDown = d3.select("#selectorName").append("select")
                    .attr("name", "selectorID");


    var nameOptions = nameDropDown.selectAll("option")
               .data(associations)
               .enter()
               .append("option");

    nameOptions.text(function (d) { return d[1]; })
       .attr("value", function (d) { return d[0]; });

    nameDropDown.on("change", function() { nameValue = this.value; });

    var yearDropDown = d3.select("#selectorYear").append("select")
                    .attr("name", "year");


    var yearOptions = yearDropDown.selectAll("option")
               .data(years)
               .enter()
               .append("option");

    yearOptions.text(function (d) { return d; })
       .attr("value", function (d) { return d; });

    yearDropDown.on("change", function() { yearValue = this.value; });
}


// very cool queue function to make multiple calls.. 
// see 
queue()
    .defer(d3.csv,"../data/worldBank_indicators.csv")
    .defer(d3.json,"../data/world_data.json")
    // .defer(d3.json,"../data/WorldBankCountries.json")
    .await(initVis);






/* just for fun 
var textLabel = svg.append("text").text(projectionMethods[actualProjectionMethod].name).attr({
    "transform":"translate(-40,-30)"
})*/

var changePro = function(){
    actualProjectionMethod = (actualProjectionMethod+1) % (projectionMethods.length);

    //textLabel.text(projectionMethods[actualProjectionMethod].name);
    path= d3.geo.path().projection(projectionMethods[actualProjectionMethod].method);
    //svg.selectAll(".country").transition().duration(750).attr("d",path);


    runAQueryOn(nameValue,parseInt(yearValue));

};

d3.select("body").append("button").text("show").on({
    "click":changePro
})


var changeVis = function(colorset){

    svg.selectAll(".legendEntry").remove();


    var tip = d3.tip()
      .attr('class', 'd3-tip')
      //.offset([0, 20])
      //.attr("dy", "0.8em")
      .html(function(d) {
            return "<p>" + d.properties.name + "<br><strong>Value:</strong> <span style='color:red'>" + colorset[d.id] + "</span></p>";
      })

    svg.call(tip);

    //console.log(colorset);

     Object.keys(colorset).forEach(function(key){
        countryIDS.push(key);
        values.push(+parseInt(colorset[key]));
     })

    console.log(values);

    //Define default colorbrewer scheme
    var colorSchemeSelect = "Greens";
    var colorScheme = colorbrewer[colorSchemeSelect]; 

    //define default number of quantiles
    var quantiles = 5;

    //Define quantile scale to sort data values into buckets of color
    var color = d3.scale.quantize()
        .range(colorScheme[quantiles]);

    color.domain([
        d3.min(values, function(d) { return d; }), 
        d3.max(values, function(d) { return d; })
    ]);


    svg.selectAll("path")
        .style("fill", function(d) {

            var value = +colorset[d.id];
            //console.log(d.id, colorset[d.id]);

            if (value) {
                //If value exists…
                return color(value);
            } else {
                //If value is undefined…
                return "#ccc";
            }
      })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);


    var newHeight = .75 * height;
    var legend = svg.selectAll('g.legendEntry')
    .data(color.range().reverse())
    .enter()
    .append('g').attr('class', 'legendEntry')
    .attr("transform", "translate(-100," + newHeight + ")")

    legend
        .append('rect')
        .attr("x", width - 780)
        .attr("y", function(d, i) {
           return i * 10;
        })
       .attr("width", 10)
       .attr("height", 10)
       .style("stroke", "black")
       .style("stroke-width", 1)
       .style("fill", function(d){return d;}); 
           //the data objects are the fill colors

    legend
        .append('text')
        .attr("x", width - 765) //leave 5 pixel space after the <rect>
        .attr("y", function(d, i) {
           return i * 10;
        })
        .attr("dy", "0.8em") //place text one line *below* the x,y point
        .text(function(d) {
            var extent = color.invertExtent(d);
            //extent will be a two-element array, format it however you want:
            var format = d3.format("0.2f");
            return format(+extent[0]) + " - " + format(+extent[1]);
        });

}

var convertCode = function(countrycodes){

    var threeCode = converter[countrycodes];
    return threeCode;

}


d3.json("wikipedia-iso-country-codes.json", function(error,data){

        data.forEach(function(d){
            //console.log(d["Alpha-3 code"]);
            converter[d["Alpha-2 code"]]=d["Alpha-3 code"];
        })


})


