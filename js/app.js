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
        minZoom: 4,
        id: 'mapbox.light',
        accessToken: accessToken
    }).addTo(map);



    // additional zoom controls

    // northeast zoom button
    var northeastZoom = document.getElementById('northeast');

    northeastZoom.onclick = function () {
        map.setView([42.536146, -72.548563], 6.5);
    }

    // san francisco zoom button
    var sfZoom = document.getElementById('san-fran');

    sfZoom.onclick = function () {
        map.setView([37.807510, -122.417880], 8);
    }

    // USA zoom button
    var usaZoom = document.getElementById('usa');

    usaZoom.onclick = function () {
        map.setView([41.562244, -97.894478], 4.3);
    }

    // san francisco inline text zoom
    var sfZoomInline = document.getElementById('san-fran-inline');

    sfZoomInline.onclick = function () {
        map.setView([37.807510, -122.417880], 8);
    }

    // adjust hard-coded values here
    var scaleRadius = d3.scaleSqrt()
        .domain([0, 84389592])
        .range([5, 76]);


    // hide info panel on page load
    var info = $('#info').hide();

    omnivore.csv('data/ports.csv')
        .on('ready', function (e) {
            drawMap(e.target.toGeoJSON());
            drawLegend(e.target.toGeoJSON());
        })
        .on('error', function (e) {
            console.log(e.error[0].message);
        });

    function drawMap(data) {

        var options = {
            pointToLayer: function (feature, ll) {
                return L.circleMarker(ll, {
                    opacity: 1,
                    weight: 2,
                    fillOpacity: 0,
                })
            }
        }

        // create separate layers from GeoJSON data
        var portLayer = L.geoJson(data, {
                pointToLayer: function (feature, latlng) {
                    var portIcon = new L.icon({
                        iconUrl: "./images/harbor-11.svg",
                        iconSize: [12, 12],
                        popupAnchor: [-22, -22],
                        className: "icon"
                    });
                    return L.marker(latlng, {
                        icon: portIcon
                    });
                }
            }).addTo(map),
            spermLayer = L.geoJson(data, options).addTo(map),
            whaleLayer = L.geoJson(data, options).addTo(map),
            boneLayer = L.geoJson(data, options).addTo(map);

        var dataLayers = {
            "<span class='layer-title'>Sperm Oil</span>": spermLayer,
            "<span class='layer-title'>Whale Oil</span>": whaleLayer,
            "<span class='layer-title'>Whalebone</span>": boneLayer
        };

        var layerControl = L.control.layers(null, dataLayers, {
            collapsed: false
        }).addTo(map);

        portLayer.eachLayer(function (layer) {

            var props = layer.feature.properties;

            var tooltip = "<h2 class='tooltip-title'>" + props.name + "</h2>" +
                "<p class='tooltip-info-text'> Click for more information</p>"

            layer.bindTooltip(tooltip);
        });

        spermLayer.setStyle({
            color: '#FBD62D',
        });

        whaleLayer.setStyle({
            color: '#1a1aff',
        });

        boneLayer.setStyle({
            color: '#F5F4E0',
        });

        resizeCircles(spermLayer, whaleLayer, boneLayer, portLayer, 1804);

        sequenceUI(spermLayer, whaleLayer, boneLayer);

        // add info panel on port layer click
        retrieveInfo(portLayer);

    } // end drawMap()

    function resizeCircles(spermLayer, whaleLayer, boneLayer, portLayer, currentYear) {

        spermLayer.eachLayer(function (layer) {

            var props = layer.feature.properties;

            var radius = scaleRadius(Number(props['SV' + currentYear]));

            layer.setRadius(radius);

            spermLayer.setStyle({
                opacity: 1,
            });

            var tooltip = "<h2 class='tooltip-title'>" + props.name + "&emsp;" + currentYear + "</h2>" +
                "<svg class='icon sperm-tt-icon'><use xlink:href='#icon-circle'/></svg>&nbsp;<span class='tooltip-product'>Sperm Oil</span><br>" +
                "<p class='tooltip-body'><b>" + Number(props['SB' + currentYear]).toLocaleString() + " barrels</b> landed or sent home,<br>" +
                "valued at <b>$" + numbro(props['SV' + currentYear]).format({
                    average: true,
                    mantissa: 2
                }) + "</b> (2018 dollars)</p>"

            layer.bindTooltip(tooltip);
        });
        whaleLayer.eachLayer(function (layer) {

            var props = layer.feature.properties;

            var radius = scaleRadius(Number(layer.feature.properties['WV' + currentYear]));
            layer.setRadius(radius);

            whaleLayer.setStyle({
                opacity: 1,
            });

            var tooltip = "<h2 class='tooltip-title'>" + props.name + "&emsp;" + currentYear + "</h2>" +
                "<svg class='icon whale-tt-icon'><use xlink:href='#icon-circle'/></svg>&nbsp;<span class='tooltip-product'>Whale Oil</span><br>" +
                "<p class='tooltip-body'><b>" + Number(props['WB' + currentYear]).toLocaleString() + " barrels</b> landed or sent home,<br>" +
                "valued at <b>$" + numbro(props['WV' + currentYear]).format({
                    average: true,
                    mantissa: 2
                }) + "</b> (2018 dollars)</p>"

            layer.bindTooltip(tooltip);
        });
        boneLayer.eachLayer(function (layer) {

            var props = layer.feature.properties;

            var radius = scaleRadius(Number(layer.feature.properties['BV' + currentYear]));

            layer.setRadius(radius);

            boneLayer.setStyle({
                opacity: 1,
            });

            var tooltip = "<h2 class='tooltip-title'>" + props.name + "&emsp;" + currentYear + "</h2>" +
                "<svg class='icon bone-tt-icon'><use xlink:href='#icon-circle'/></svg>&nbsp;<span class='tooltip-product'>Whale Bone</span><br>" +
                "<p class='tooltip-body'><b>" + Number(props['BP' + currentYear]).toLocaleString() + " pounds</b> landed or sent home,<br>" +
                "valued at <b>$" + numbro(props['BV' + currentYear]).format({
                    average: true,
                    mantissa: 2
                }) + "</b> (2018 dollars)</p>"

            layer.bindTooltip(tooltip);
        });

        // add year legend with slider
        yearLegend(currentYear);

    }


    function sequenceUI(spermLayer, whaleLayer, boneLayer, portLayer) {

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

                // illuminate timeline modal buttons on corresponding currentYear
                if (currentYear == 1812) {
                    $('.war-1812').css('color', '#FBD62D');
                } else {
                    $('.war-1812').css('color', '#f7f4ea');
                }

                if (currentYear == 1820) {
                    $('.essex').css('color', '#FBD62D');
                } else {
                    $('.essex').css('color', '#f7f4ea');
                }

                if (currentYear == 1827) {
                    $('.new-bedford').css('color', '#FBD62D');
                } else {
                    $('.new-bedford').css('color', '#f7f4ea');
                }

                if (currentYear == 1846) {
                    $('.great-fire').css('color', '#FBD62D');
                } else {
                    $('.great-fire').css('color', '#f7f4ea');
                }

                if (currentYear == 1853) {
                    $('.golden-age').css('color', '#FBD62D');
                } else {
                    $('.golden-age').css('color', '#f7f4ea');
                }

                if (currentYear == 1859) {
                    $('.new-oil').css('color', '#FBD62D');
                } else {
                    $('.new-oil').css('color', '#f7f4ea');
                }

                if (currentYear == 1865) {
                    $('.civil-war').css('color', '#FBD62D');
                } else {
                    $('.civil-war').css('color', '#f7f4ea');
                }

                if (currentYear == 1871) {
                    $('.disaster-decline').css('color', '#FBD62D');
                } else {
                    $('.disaster-decline').css('color', '#f7f4ea');
                }

                // resize the circles with updated year
                resizeCircles(spermLayer, whaleLayer, boneLayer, portLayer, currentYear);

            });

    }


    function drawLegend(data) {
        // create Leaflet control for the legend
        var legendControl = L.control({
            position: 'topright'
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
        var dataValues = data.features.map(function (port) {
            // for each year
            for (var year in port.properties) {
                // shorthand to each value
                var value = port.properties.SV1845;
                // if the value can be converted to a number
                if (+value) {
                    // return the value to the array
                    return +value;
                }

            }
        });

        //console.log(dataValues);

        // sort the array
        var sortedValues = dataValues.sort(function (a, b) {
            return b - a;
        });

        // round the highest number and use as our large circle diameter
        var maxValue = Math.round(sortedValues[0] / 1000) * 1000;

        // calc the diameters
        var largeDiameter = scaleRadius(maxValue) * 2,
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

        // adjust the position of the large based on size of circle
        $(".legend-large-label").css({
            'top': +3,
            'right': largeDiameter,
        });

        // adjust the position of the large based on size of circle
        $(".legend-small-label").css({
            'top': smallDiameter + 6,
            'right': largeDiameter,
        });

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

        //console.log(currentYear);

        yearLegend.addTo(map);

    }


    function retrieveInfo(portLayer) {

        portLayer.on('click', function (e) {

            var props = e.layer.feature.properties;

            // make info window visible
            $('#info').show();

            // populate HTML elements with relevant info
            $(".port-name span:first-child").html(props.name);

            // empty arrays for males and females values
            var spermValues = [],
                whaleValues = [],
                boneValues = [];

            // loop through the years and push values into those arrays
            for (var i = 1804; i <= 1876; i++) {
                spermValues.push(props['SV' + i]);
                whaleValues.push(props['WV' + i]);
                boneValues.push(props['BV' + i]);
            }

            $('.spermspark').sparkline(spermValues, {
                width: '200px',
                height: '35px',
                lineColor: '#FBD62D',
                fillColor: 'rgb(251, 214, 45, 0.6)',
                highlightLineColor: '#fff',
                spotColor: false,
                minSpotColor: false,
                maxSpotColor: '#008000',
                highlightSpotColor: false,
                spotRadius: 3,
                lineWidth: 2,
                tooltipPrefix: '$',
                tooltipFormat: '{{offset:year}}: ${{y.0}}',
                tooltipValueLookups: {
                    year: {
                        0: '1804',
                        1: '1805',
                        2: '1806',
                        3: '1807',
                        4: '1808',
                        5: '1809',
                        6: '1810',
                        7: '1811',
                        8: '1812',
                        9: '1813',
                        10: '1814',
                        11: '1815',
                        12: '1816',
                        13: '1817',
                        14: '1818',
                        15: '1819',
                        16: '1820',
                        17: '1821',
                        18: '1822',
                        19: '1823',
                        20: '1824',
                        21: '1825',
                        22: '1826',
                        23: '1827',
                        24: '1828',
                        25: '1829',
                        26: '1830',
                        27: '1831',
                        28: '1832',
                        29: '1833',
                        30: '1834',
                        31: '1835',
                        32: '1836',
                        33: '1837',
                        34: '1838',
                        35: '1839',
                        36: '1840',
                        37: '1841',
                        38: '1842',
                        39: '1843',
                        40: '1844',
                        41: '1845',
                        42: '1846',
                        43: '1847',
                        44: '1848',
                        45: '1849',
                        46: '1850',
                        47: '1851',
                        48: '1852',
                        49: '1853',
                        50: '1854',
                        51: '1855',
                        52: '1856',
                        53: '1857',
                        54: '1858',
                        55: '1859',
                        56: '1860',
                        57: '1861',
                        58: '1862',
                        59: '1863',
                        60: '1864',
                        61: '1865',
                        62: '1866',
                        63: '1867',
                        64: '1868',
                        65: '1869',
                        66: '1870',
                        67: '1871',
                        68: '1872',
                        69: '1873',
                        70: '1874',
                        71: '1875',
                        72: '1876'
                    }
                }
                //numberFormatter: '{{}}'
            });

            $('.whalespark').sparkline(whaleValues, {
                width: '200px',
                height: '35px',
                lineColor: '#1a1aff',
                fillColor: 'rgb(26, 26, 255, 0.6)',
                highlightLineColor: '#fff',
                spotColor: false,
                minSpotColor: false,
                maxSpotColor: '#008000',
                highlightSpotColor: false,
                spotRadius: 3,
                lineWidth: 2,
                tooltipPrefix: '$',
                tooltipFormat: '{{offset:year}}: ${{y.0}}',
                tooltipValueLookups: {
                    year: {
                        0: '1804',
                        1: '1805',
                        2: '1806',
                        3: '1807',
                        4: '1808',
                        5: '1809',
                        6: '1810',
                        7: '1811',
                        8: '1812',
                        9: '1813',
                        10: '1814',
                        11: '1815',
                        12: '1816',
                        13: '1817',
                        14: '1818',
                        15: '1819',
                        16: '1820',
                        17: '1821',
                        18: '1822',
                        19: '1823',
                        20: '1824',
                        21: '1825',
                        22: '1826',
                        23: '1827',
                        24: '1828',
                        25: '1829',
                        26: '1830',
                        27: '1831',
                        28: '1832',
                        29: '1833',
                        30: '1834',
                        31: '1835',
                        32: '1836',
                        33: '1837',
                        34: '1838',
                        35: '1839',
                        36: '1840',
                        37: '1841',
                        38: '1842',
                        39: '1843',
                        40: '1844',
                        41: '1845',
                        42: '1846',
                        43: '1847',
                        44: '1848',
                        45: '1849',
                        46: '1850',
                        47: '1851',
                        48: '1852',
                        49: '1853',
                        50: '1854',
                        51: '1855',
                        52: '1856',
                        53: '1857',
                        54: '1858',
                        55: '1859',
                        56: '1860',
                        57: '1861',
                        58: '1862',
                        59: '1863',
                        60: '1864',
                        61: '1865',
                        62: '1866',
                        63: '1867',
                        64: '1868',
                        65: '1869',
                        66: '1870',
                        67: '1871',
                        68: '1872',
                        69: '1873',
                        70: '1874',
                        71: '1875',
                        72: '1876'
                    }
                }
                //numberFormatter: '{{}}'
            });

            $('.bonespark').sparkline(boneValues, {
                width: '200px',
                height: '35px',
                lineColor: '#FCFCF7',
                fillColor: 'rgb(252, 252, 247, 0.6)',
                highlightLineColor: '#fff',
                spotColor: false,
                minSpotColor: false,
                maxSpotColor: '#008000',
                highlightSpotColor: false,
                spotRadius: 3,
                lineWidth: 2,
                tooltipPrefix: '$',
                tooltipFormat: '{{offset:year}}: ${{y.0}}',
                tooltipValueLookups: {
                    year: {
                        0: '1804',
                        1: '1805',
                        2: '1806',
                        3: '1807',
                        4: '1808',
                        5: '1809',
                        6: '1810',
                        7: '1811',
                        8: '1812',
                        9: '1813',
                        10: '1814',
                        11: '1815',
                        12: '1816',
                        13: '1817',
                        14: '1818',
                        15: '1819',
                        16: '1820',
                        17: '1821',
                        18: '1822',
                        19: '1823',
                        20: '1824',
                        21: '1825',
                        22: '1826',
                        23: '1827',
                        24: '1828',
                        25: '1829',
                        26: '1830',
                        27: '1831',
                        28: '1832',
                        29: '1833',
                        30: '1834',
                        31: '1835',
                        32: '1836',
                        33: '1837',
                        34: '1838',
                        35: '1839',
                        36: '1840',
                        37: '1841',
                        38: '1842',
                        39: '1843',
                        40: '1844',
                        41: '1845',
                        42: '1846',
                        43: '1847',
                        44: '1848',
                        45: '1849',
                        46: '1850',
                        47: '1851',
                        48: '1852',
                        49: '1853',
                        50: '1854',
                        51: '1855',
                        52: '1856',
                        53: '1857',
                        54: '1858',
                        55: '1859',
                        56: '1860',
                        57: '1861',
                        58: '1862',
                        59: '1863',
                        60: '1864',
                        61: '1865',
                        62: '1866',
                        63: '1867',
                        64: '1868',
                        65: '1869',
                        66: '1870',
                        67: '1871',
                        68: '1872',
                        69: '1873',
                        70: '1874',
                        71: '1875',
                        72: '1876'
                    }
                }
            });
        });

        /* INFO CLOSE BUTTON */


        $('#info-close').click(function () {
            $('#info').hide();
        });


    }

    // ABOUT MODAL

    var modalAbout = document.getElementById('about-modal');

    // Get the button that opens the modal
    var btnAbout = document.getElementById("about-button");

    // When the user clicks the button, open the modal 
    btnAbout.onclick = function () {
        modalAbout.style.display = "block";

        // if another modal is open, hide it
        $('#tp1-modal').hide();
        $('#tp2-modal').hide();
        $('#tp3-modal').hide();
        $('#tp4-modal').hide();
        $('#tp5-modal').hide();
        $('#tp6-modal').hide();
        $('#tp7-modal').hide();
        $('#tp8-modal').hide();
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();
        $('#info').hide();


        $('#about-close').click(function () {
            $('#about-modal').hide();
        });


        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function (event) {
            if (event.target == modalAbout) {
                modalAbout.style.display = "none";
            }
        }
    }

    // TIMELINE MODALS

    // Modal 1
    var modal1 = document.getElementById('tp1-modal');

    // Get the button that opens the modal
    var btn1 = document.getElementById("tp1-button");

    // When the user clicks the button, open the modal 
    btn1.onclick = function () {
        modal1.style.display = "block";

        // if another modal is open, hide it
        $('#tp2-modal').hide();
        $('#tp3-modal').hide();
        $('#tp4-modal').hide();
        $('#tp5-modal').hide();
        $('#tp6-modal').hide();
        $('#tp7-modal').hide();
        $('#tp8-modal').hide();
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();
        $('#about-modal').hide();
        $('#info').hide();

        $('#tp1-close').click(function () {
            $('#tp1-modal').hide();
        });


        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function (event) {
            if (event.target == modal1) {
                modal1.style.display = "none";
            }
        }
    }

    // Modal 2
    var modal2 = document.getElementById('tp2-modal');

    var btn2 = document.getElementById("tp2-button");

    btn2.onclick = function () {
        modal2.style.display = "block";

        $('#tp1-modal').hide();
        $('#tp3-modal').hide();
        $('#tp4-modal').hide();
        $('#tp5-modal').hide();
        $('#tp6-modal').hide();
        $('#tp7-modal').hide();
        $('#tp8-modal').hide();
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();
        $('#about-modal').hide();
        $('#info').hide();

        $('#tp2-close').click(function () {
            $('#tp2-modal').hide();
        });


        window.onclick = function (event) {
            if (event.target == modal2) {
                modal2.style.display = "none";
            }
        }
    }

    // Modal 3
    var modal3 = document.getElementById('tp3-modal');

    var btn3 = document.getElementById("tp3-button");

    btn3.onclick = function () {
        modal3.style.display = "block";

        $('#tp1-modal').hide();
        $('#tp2-modal').hide();
        $('#tp4-modal').hide();
        $('#tp5-modal').hide();
        $('#tp6-modal').hide();
        $('#tp7-modal').hide();
        $('#tp8-modal').hide();
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();
        $('#about-modal').hide();
        $('#info').hide();

        $('#tp3-close').click(function () {
            $('#tp3-modal').hide();
        });

        window.onclick = function (event) {
            if (event.target == modal3) {
                modal3.style.display = "none";
            }
        }
    }

    // Modal 4
    var modal4 = document.getElementById('tp4-modal');

    var btn4 = document.getElementById("tp4-button");

    btn4.onclick = function () {
        modal4.style.display = "block";

        $('#tp1-modal').hide();
        $('#tp2-modal').hide();
        $('#tp3-modal').hide();
        $('#tp5-modal').hide();
        $('#tp6-modal').hide();
        $('#tp7-modal').hide();
        $('#tp8-modal').hide();
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();
        $('#about-modal').hide();
        $('#info').hide();

        $('#tp4-close').click(function () {
            $('#tp4-modal').hide();
        });

        window.onclick = function (event) {
            if (event.target == modal4) {
                modal4.style.display = "none";
            }
        }
    }

    // Modal 5
    var modal5 = document.getElementById('tp5-modal');

    var btn5 = document.getElementById("tp5-button");

    btn5.onclick = function () {
        modal5.style.display = "block";

        $('#tp1-modal').hide();
        $('#tp2-modal').hide();
        $('#tp3-modal').hide();
        $('#tp4-modal').hide();
        $('#tp6-modal').hide();
        $('#tp7-modal').hide();
        $('#tp8-modal').hide();
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();
        $('#about-modal').hide();
        $('#info').hide();

        $('#tp5-close').click(function () {
            $('#tp5-modal').hide();
        });

        window.onclick = function (event) {
            if (event.target == modal5) {
                modal5.style.display = "none";
            }
        }
    }

    // Modal 6
    var modal6 = document.getElementById('tp6-modal');

    var btn6 = document.getElementById("tp6-button");

    btn6.onclick = function () {
        modal6.style.display = "block";

        $('#tp1-modal').hide();
        $('#tp2-modal').hide();
        $('#tp3-modal').hide();
        $('#tp4-modal').hide();
        $('#tp5-modal').hide();
        $('#tp7-modal').hide();
        $('#tp8-modal').hide();
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();
        $('#about-modal').hide();
        $('#info').hide();

        $('#tp6-close').click(function () {
            $('#tp6-modal').hide();
        });

        window.onclick = function (event) {
            if (event.target == modal6) {
                modal6.style.display = "none";
            }
        }
    }

    // Modal 5
    var modal7 = document.getElementById('tp7-modal');

    var btn7 = document.getElementById("tp7-button");

    btn7.onclick = function () {
        modal7.style.display = "block";

        $('#tp1-modal').hide();
        $('#tp2-modal').hide();
        $('#tp3-modal').hide();
        $('#tp4-modal').hide();
        $('#tp5-modal').hide();
        $('#tp6-modal').hide();
        $('#tp8-modal').hide();
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();
        $('#about-modal').hide();
        $('#info').hide();

        $('#tp7-close').click(function () {
            $('#tp7-modal').hide();
        });

        window.onclick = function (event) {
            if (event.target == modal7) {
                modal7.style.display = "none";
            }
        }
    }

    // Modal 5
    var modal8 = document.getElementById('tp8-modal');

    var btn8 = document.getElementById("tp8-button");

    btn8.onclick = function () {
        modal8.style.display = "block";

        $('#tp1-modal').hide();
        $('#tp2-modal').hide();
        $('#tp3-modal').hide();
        $('#tp4-modal').hide();
        $('#tp5-modal').hide();
        $('#tp6-modal').hide();
        $('#tp7-modal').hide();
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();
        $('#about-modal').hide();
        $('#info').hide();

        $('#tp8-close').click(function () {
            $('#tp8-modal').hide();
        });

        window.onclick = function (event) {
            if (event.target == modal8) {
                modal8.style.display = "none";
            }
        }
    }


    // LAYER INFO MODALS

    var spermModal = document.getElementById('sperm-modal');

    var spermButton = document.getElementById('sperm-button');

    spermButton.onclick = function () {
        spermModal.style.display = "block";

        $('#tp1-modal').hide();
        $('#tp2-modal').hide();
        $('#tp3-modal').hide();
        $('#tp4-modal').hide();
        $('#tp5-modal').hide();
        $('#tp6-modal').hide();
        $('#tp7-modal').hide();
        $('#tp8-modal').hide();
        $('#bone-modal').hide();
        $('#whale-modal').hide();
        $('#about-modal').hide();
        $('#info').hide();

        $('#sperm-close').click(function () {
            $('#sperm-modal').hide();
        });

        window.onclick = function (event) {
            if (event.target == spermModal) {
                spermModal.style.display = "none";
            }
        }
    }

    var whaleModal = document.getElementById('whale-modal');

    var whaleButton = document.getElementById('whale-button');

    whaleButton.onclick = function () {
        whaleModal.style.display = "block";

        $('#tp1-modal').hide();
        $('#tp2-modal').hide();
        $('#tp3-modal').hide();
        $('#tp4-modal').hide();
        $('#tp5-modal').hide();
        $('#tp6-modal').hide();
        $('#tp7-modal').hide();
        $('#tp8-modal').hide();
        $('#sperm-modal').hide();
        $('#bone-modal').hide();
        $('#about-modal').hide();
        $('#info').hide();

        $('#whale-close').click(function () {
            $('#whale-modal').hide();
        });

        window.onclick = function (event) {
            if (event.target == whaleModal) {
                whaleModal.style.display = "none";
            }
        }
    }

    var boneModal = document.getElementById('bone-modal');

    var boneButton = document.getElementById('bone-button');

    boneButton.onclick = function () {
        boneModal.style.display = "block";

        $('#tp1-modal').hide();
        $('#tp2-modal').hide();
        $('#tp3-modal').hide();
        $('#tp4-modal').hide();
        $('#tp5-modal').hide();
        $('#tp6-modal').hide();
        $('#tp7-modal').hide();
        $('#tp8-modal').hide();
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#about-modal').hide();
        $('#info').hide();

        $('#bone-close').click(function () {
            $('#bone-modal').hide();
        });

        window.onclick = function (event) {
            if (event.target == boneModal) {
                boneModal.style.display = "none";
            }
        }
    }

})();
