(function () {

    var map = L.map('map', {
        zoomSnap: .1,
        center: [42.536146, -72.548563],
        zoom: 6.5
        //minZoom: 4
    });

    var accessToken = 'pk.eyJ1Ijoia2dhdGhlcnMiLCJhIjoiY2pnd3VkODdzMWJtdjJxbXhqYWQ0MnNldSJ9.5nJcFQH7U3GAQh_vvq3Tcw'

    L.tileLayer('https://api.mapbox.com/styles/v1/kgathers/cjhko8f7104bw2so2jcbsaafp/tiles/256/{z}/{x}/{y}?access_token=' + accessToken, {
        attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox</a> <a href="https://www.openstreetmap.org/about/" target="_blank">© OpenStreetMap</a>',
        maxZoom: 18,
        id: 'mapbox.light',
        accessToken: accessToken
    }).addTo(map);


    omnivore.csv('data/ports.csv')
        .on('ready', function (e) {
            drawMap(e.target.toGeoJSON());
            //drawLegend(e.target.toGeoJSON());
        })
        .on('error', function (e) {
            console.log(e.error[0].message);
        });


    function drawMap(data) {

        var ports = L.geoJson(data).addTo(map);

        /*
        var options = {
            pointToLayer: function (feature, ll) {
                return L.circleMarker(ll, {
                    opacity: 1,
                    weight: 2,
                    fillOpacity: 0,
                })
            }
        }
        // create 2 separate layers from GeoJSON data
        var femaleLayer = L.geoJson(data, options).addTo(map),
            maleLayer = L.geoJson(data, options).addTo(map);

        femaleLayer.setStyle({
            color: '#F9BA32',
        });

        maleLayer.setStyle({
            color: '#3F681C',
        });

        resizeCircles(femaleLayer, maleLayer, 2009);

        sequenceUI(femaleLayer, maleLayer);
        */
    } // end drawMap()

    /*
    function calcRadius(val) {

        var radius = Math.sqrt(val / Math.PI);
        return radius * .25; // adjust .25 as a scale factor

    }


    function resizeCircles(portLayer, currentYear) {

        portLayer.eachLayer(function (layer) {
            var radius = calcRadius(Number(layer.feature.properties['F' + currentYear]));
            layer.setRadius(radius);

            femaleLayer.setStyle({
                opacity: 1,
            });
        });
        maleLayer.eachLayer(function (layer) {
            var radius = calcRadius(Number(layer.feature.properties['M' + currentYear]));
            layer.setRadius(radius);

            maleLayer.setStyle({
                opacity: 1,
            });
        });



        // add year legend above slider
        yearLegend(currentYear);


        // update the hover window with current year
        retrieveInfo(maleLayer, currentYear);

    }


    function sequenceUI(femaleLayer, maleLayer) {

        // create Leaflet control for the slider
        var sliderControl = L.control({
            position: 'bottomleft'
        });

        sliderControl.onAdd = function (map) {

            var controls = L.DomUtil.get("slider");

            L.DomEvent.disableScrollPropagation(controls);
            L.DomEvent.disableClickPropagation(controls);

            return controls;

        }

        sliderControl.addTo(map);

        //select the slider's input and listen for change
        $('#slider input[type=range]')
            .on('input', function () {

                // current value of slider is current year
                var currentYear = this.value;

                // resize the circles with updated year
                resizeCircles(femaleLayer, maleLayer, currentYear);

            });

    }


    function drawLegend(data) {
        // create Leaflet control for the legend
        var legendControl = L.control({
            position: 'bottomright'
        });

        // when the control is added to the map
        legendControl.onAdd = function (map) {

            // select the legend using id attribute of legend
            var legend = L.DomUtil.get("legend");

            // disable scroll and click functionality
            L.DomEvent.disableScrollPropagation(legend);
            L.DomEvent.disableClickPropagation(legend);

            // return the selection
            return legend;

        }

        legendControl.addTo(map);

        // loop through all university features
        var dataValues = data.features.map(function (univ) {
            // for each year
            for (var year in univ.properties) {
                // shorthand to each value
                var value = univ.properties[year];
                // if the value can be converted to a number
                if (+value) {
                    // return the value to the array
                    return +value;
                }

            }
        });

        // sort the array
        var sortedValues = dataValues.sort(function (a, b) {
            return b - a;
        });

        // round the highest number and use as our large circle diameter
        var maxValue = Math.round(sortedValues[0] / 1000) * 1000;

        // calc the diameters
        var largeDiameter = calcRadius(maxValue) * 2,
            smallDiameter = largeDiameter / 2;

        // select our circles container and set the height
        $(".legend-circles").css('height', largeDiameter.toFixed());

        // set width and height for large circle
        $('.legend-large').css({
            'width': largeDiameter.toFixed(),
            'height': largeDiameter.toFixed()
        });
        // set width and height for small circle and position
        $('.legend-small').css({
            'width': smallDiameter.toFixed(),
            'height': smallDiameter.toFixed(),
            'top': largeDiameter - smallDiameter,
            'left': smallDiameter / 2
        })

        // label the max and median value
        $(".legend-large-label").html(maxValue.toLocaleString());
        $(".legend-small-label").html((maxValue / 2).toLocaleString());

        // adjust the position of the large based on size of circle
        $(".legend-large-label").css({
            'top': -11,
            'left': largeDiameter + 30,
        });

        // adjust the position of the large based on size of circle
        $(".legend-small-label").css({
            'top': smallDiameter - 11,
            'left': largeDiameter + 30
        });

        // insert a couple hr elements and use to connect value label to top of each circle
        $("<hr class='large'>").insertBefore(".legend-large-label")
        $("<hr class='small'>").insertBefore(".legend-small-label").css('top', largeDiameter - smallDiameter - 8);

    }

    // build supplemental legend showing active year on slider
    function yearLegend(currentYear) {
        // create Leaflet control for the legend
        var yearLegend = L.control({
            position: 'bottomleft'
        });

        // when the control is added to the map
        yearLegend.onAdd = function (map) {

            // select the legend using id attribute of legend
            var yearLegend = L.DomUtil.get("year-legend");

            // return the selection
            return yearLegend;

        }

        // populate HTML elements with relevant info
        $('.year span').html(currentYear);

        yearLegend.addTo(map);


        // add control to replace legend on small screens
        var legendCollapse = L.control({
            position: 'bottomright'
        });

        // when the control is added to the map
        legendCollapse.onAdd = function (map) {

            // select the legend using id attribute of legend
            var legendCollapse = L.DomUtil.get("legend-collapse");

            // return the selection
            return legendCollapse;

        }

        // populate HTML elements with relevant info

        legendCollapse.addTo(map);

    }


    function retrieveInfo(maleLayer, currentYear) {
        // select the element and reference with variable
        // and hide it from view initially
        var info = $('#info').hide();

        // since maleLayer is on top, use to detect mouseover events
        maleLayer.on('mouseover', function (e) {

            // access properties of target layer
            var props = e.layer.feature.properties;

            // remove the none class to display and show
            info.show();

            // populate HTML elements with relevant info
            $('#info span').html(props.UNI_NAME);
            $(".female span:first-child").html('(' + currentYear + ')');
            $(".male span:first-child").html('(' + currentYear + ')');
            $(".female span:last-child").html(Number(props['F' + currentYear]).toLocaleString());
            $(".male span:last-child").html(Number(props['M' + currentYear]).toLocaleString());

            // raise opacity level as visual affordance
            e.layer.setStyle({
                fillOpacity: .6
            });


            // empty arrays for males and females values
            var femaleValues = [],
                maleValues = [];

            // loop through the years and push values into those arrays
            for (var i = 2009; i <= 2015; i++) {
                femaleValues.push(props['F' + i]);
                maleValues.push(props['M' + i]);
            }

            $('.femalespark').sparkline(femaleValues, {
                width: '200px',
                height: '30px',
                lineColor: '#F9BA32',
                fillColor: '#F9BA32',
                spotRadius: 0,
                lineWidth: 2
            });

            $('.malespark').sparkline(maleValues, {
                width: '200px',
                height: '30px',
                lineColor: '#3F681C',
                fillColor: '#3F681C',
                spotRadius: 0,
                lineWidth: 2
            });
        });

        // hide the info panel when mousing off layergroup and remove affordance opacity
        maleLayer.on('mouseout', function (e) {

            // hide the info panel
            info.hide();

            // reset the layer style
            e.layer.setStyle({
                fillOpacity: 0
            });
        });

        // when the mouse moves on the document
        $(document).mousemove(function (e) {
            // first offset from the mouse position of the info window
            info.css({
                "left": e.pageX + 6,
                "top": e.pageY - info.height() - 25
            });

            // if it crashes into the top, flip it lower right
            if (info.offset().top < 4) {
                info.css({
                    "top": e.pageY + 15
                });
            }
            // if it crashes into the right, flip it to the left
            if (info.offset().left + info.width() >= $(document).width() - 40) {
                info.css({
                    "left": e.pageX - info.width() - 80
                });
            }
        });

    }
    */

})();
