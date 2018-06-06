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
                        iconSize: [8.5, 8.5],
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

        var info = $('#info').hide();

        var dataLayers = {
            "<span class='layer-title'>Sperm Oil</span>": spermLayer,
            "<span class='layer-title'>Whale Oil</span>": whaleLayer,
            "<span class='layer-title'>Whale Bone</span>": boneLayer
        };

        var layerControl = L.control.layers(null, dataLayers, {
            collapsed: false
        }).addTo(map);

        resizeCircles(spermLayer, whaleLayer, boneLayer, portLayer, 1804);

        sequenceUI(spermLayer, whaleLayer, boneLayer);

        // add info panel on port layer click
        retrieveInfo(portLayer);

    } // end drawMap()

    function calcRadius(val) {

        var radius = Math.sqrt(val / Math.PI);
        return radius * .015; // adjust .25 as a scale factor

    }


    function resizeCircles(spermLayer, whaleLayer, boneLayer, portLayer, currentYear) {

        spermLayer.eachLayer(function (layer) {

            var props = layer.feature.properties;

            var radius = calcRadius(Number(props['SV' + currentYear]));
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

            var radius = calcRadius(Number(layer.feature.properties['WV' + currentYear]));
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

            var radius = calcRadius(Number(layer.feature.properties['BV' + currentYear]));
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

        // adjust the position of the large based on size of circle
        $(".legend-large-label").css({
            'top': +3,
            'right': largeDiameter - 18,
        });

        // adjust the position of the large based on size of circle
        $(".legend-small-label").css({
            'top': smallDiameter + 6,
            'right': largeDiameter - 18,
        });

        // insert a couple hr elements and use to connect value label to top of each circle
        //$("<hr class='large'>").insertBefore(".legend-large-label")
        //$("<hr class='small'>").insertBefore(".legend-small-label").css('top', largeDiameter - smallDiameter - 8);

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
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();


        $(document).ready(function () {
            $('#tp1-close').click(function () {
                $('#tp1-modal').hide();
            });
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
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();


        $(document).ready(function () {
            $('#tp2-close').click(function () {
                $('#tp2-modal').hide();
            });
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
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();


        $(document).ready(function () {
            $('#tp3-close').click(function () {
                $('#tp3-modal').hide();
            });
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
        $('#sperm-modal').hide();
        $('#whale-modal').hide();
        $('#bone-modal').hide();

        $(document).ready(function () {
            $('#tp4-close').click(function () {
                $('#tp4-modal').hide();
            });
        });

        window.onclick = function (event) {
            if (event.target == modal4) {
                modal4.style.display = "none";
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
        $('#bone-modal').hide();
        $('#whale-modal').hide();


        $(document).ready(function () {
            $('#sperm-close').click(function () {
                $('#sperm-modal').hide();
            });
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
        $('#sperm-modal').hide();
        $('#bone-modal').hide();

        $(document).ready(function () {
            $('#whale-close').click(function () {
                $('#whale-modal').hide();
            });
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
        $('#sperm-modal').hide();
        $('#whale-modal').hide();

        $(document).ready(function () {
            $('#bone-close').click(function () {
                $('#bone-modal').hide();
            });
        });

        window.onclick = function (event) {
            if (event.target == boneModal) {
                boneModal.style.display = "none";
            }
        }
    }

})();
