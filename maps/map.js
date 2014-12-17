
var tamis = tamis || {};

tamis.Map = (function () {

    /* Constants */

    var GEOMETRY_TYPE_POINT = 'esriGeometryPoint';
    var GEOMETRY_TYPE_POLYLINE = 'esriGeometryPolyline';
    var GEOMETRY_TYPE_POLYGON = 'esriGeometryPolygon';

    var bridgeResultsLayerName = "BridgeFeatureResults";
    var routeResultsLayerName = "RouteFeatureResults";
    var unstableSlopeResultsLayerName = "UnstableSlopeFeatureResults";

    var geometryKey = "Geometry";

    /* Variables */

    var map;
    var mapId = 'map';

    // Symbols
    var markerSymbol;
    var redPolylineSymbol;
    var pinkPolylineSymbol;
    var orchidPolylineSymbol;
    var purple1PolylineSymbol;
    var seagreen1PolylineSymbol;
    var cobaltgreenPolylineSymbol;
    var yellow1PolylineSymbol;
    var polylineSymbol;
    var polygonSymbol;

    var roadFunctionalClassRenderer;
    var bridgeFunctionalClassRenderer;
    var pavementConditionRenderer;
    var deckConditionRenderer;
    var bridgeStatusRenderer;
    var unstableSlopesRenderer;
    var routeLaneCountRenderer;

    var geographyLayer;
    var routeResultsLayer;
    var bridgeResultsLayer;
    var unstableSlopeResultsLayer;

    var pointGraphic;
    var legendDijit;
    var labels;

    var queryName;

    var bridgeRendererNames = [];
    var routeRendererNames = [];

    var selectedBridgeRenderer = '';
    var selectedRouteRenderer = '';

    var layers;

    /* Initialization */
    dojo.require("esri.toolbars.draw");
    dojo.require("esri.geometry");
    dojo.require("esri.geometry.jsonUtils");
    dojo.require("esri.layers.FeatureLayer");
    dojo.require("esri.layers.graphics");
    dojo.require("esri.map");
    dojo.require("esri.dijit.Legend");
    dojo.require("esri.dijit.Scalebar");
    dojo.require("esri.toolbars.draw");
    dojo.require("esri.tasks.query");

    function initializeMap() {
        map = new esri.Map(mapId, {
            basemap: "streets",
            showInfoWindowOnClick: true
        });
        $(document).ready(jQueryReady);
    }

    function jQueryReady() {
        parent.$("body").off("loaddata");
        parent.$("body").on("loaddata", function (e) {
            tamis.Map.labels = e.labels;
            tamis.Map.queryName = e.queryName;
            tamis.Map.layers = e.layers;
            setScalebar();
            initializeSymbols();
            initializeRenderers();
            initializeLegend();
            initializeLayers();
            loadData();
        });

        parent.$("body").on("rowselect", function (e) {
            rowSelect(e.rowData);
        });
    }

    function initializeSymbols() {
        markerSymbol = new esri.symbol.SimpleMarkerSymbol();

        polylineSymbol = new esri.symbol.SimpleLineSymbol(
            esri.symbol.SimpleLineSymbol.STYLE_SOLID,
            new dojo.Color([0, 0, 255]),
            5
        );

        redPolylineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 5);
        pinkPolylineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 192, 203]), 5);
        orchidPolylineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([218, 112, 214]), 5);
        purple1PolylineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([155, 48, 255]), 5);
        seagreen1PolylineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([84, 255, 159]), 5);
        cobaltgreenPolylineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([61, 145, 640]), 5);
        yellow1PolylineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 255, 0]), 5);
        lightBluePolylineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 255, 0]), 5);

        polygonSymbol = new esri.symbol.SimpleFillSymbol(
            esri.symbol.SimpleFillSymbol.STYLE_SOLID,
            new esri.symbol.SimpleLineSymbol(
                esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                new dojo.Color([160, 32, 240]),
                5
            ),
            new dojo.Color([100, 100, 100, 0.25])
        );
    }

    function initializeRenderers() {


        var greenSquareSymbol = new esri.symbol.SimpleMarkerSymbol();
        greenSquareSymbol.style = esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE;
        greenSquareSymbol.setSize(8);
        greenSquareSymbol.setColor(new dojo.Color([84, 255, 159]));

        var yellowSquareSymbol = new esri.symbol.SimpleMarkerSymbol();
        yellowSquareSymbol.style = esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE;
        yellowSquareSymbol.setSize(8);
        yellowSquareSymbol.setColor(new dojo.Color([255,255,0,0.5]));

        var redSquareSymbol = new esri.symbol.SimpleMarkerSymbol();
        redSquareSymbol.style = esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE;
        redSquareSymbol.setSize(8);
        redSquareSymbol.setColor(new dojo.Color([255, 0, 0]));

        roadFunctionalClassRenderer = new esri.renderer.UniqueValueRenderer(null, "NHS Class");
        roadFunctionalClassRenderer.addValue("NHS", redPolylineSymbol);
        roadFunctionalClassRenderer.addValue("NOT NHS", pinkPolylineSymbol);

        pavementConditionRenderer = new esri.renderer.UniqueValueRenderer(null, "Pavement Condition");
        pavementConditionRenderer.addValue("Good", seagreen1PolylineSymbol);
        pavementConditionRenderer.addValue("Fair", yellow1PolylineSymbol);
        pavementConditionRenderer.addValue("Poor", redPolylineSymbol);
        pavementConditionRenderer.addValue("NA", purple1PolylineSymbol);

        unstableSlopesRenderer = new esri.renderer.UniqueValueRenderer(null, "totalscorebucket");
        unstableSlopesRenderer.addValue("0-250", greenSquareSymbol);
        unstableSlopesRenderer.addValue("251-500", yellowSquareSymbol);
        unstableSlopesRenderer.addValue("500+", redSquareSymbol);

        bridgeStatusRenderer = new esri.renderer.UniqueValueRenderer(null, "Status");
        bridgeStatusRenderer.addValue("Not Deficient", greenSquareSymbol);
        bridgeStatusRenderer.addValue("Structurally Deficient", yellowSquareSymbol);
        bridgeStatusRenderer.addValue("Functionally Obsolete", redSquareSymbol);

        bridgeFunctionalClassRenderer = new esri.renderer.UniqueValueRenderer(null, "NHS Class");
        bridgeFunctionalClassRenderer.addValue("NHS", greenSquareSymbol);
        bridgeFunctionalClassRenderer.addValue("NOT NHS", redSquareSymbol);

        routeLaneCountRenderer = new esri.renderer.UniqueValueRenderer(null, "Lanes");
        routeLaneCountRenderer.addValue("1", seagreen1PolylineSymbol);
        routeLaneCountRenderer.addValue("2", yellow1PolylineSymbol);
        routeLaneCountRenderer.addValue("3", redPolylineSymbol);
        routeLaneCountRenderer.addValue("4", purple1PolylineSymbol);
        routeLaneCountRenderer.addValue("5", pinkPolylineSymbol);
        routeLaneCountRenderer.addValue("6", orchidPolylineSymbol);
    }

    function initializeLayers(rendererName, rendererType) {
        var queryName = tamis.Map.queryName;

        if (queryName == 'Assets') {
            bridgeRendererNames = [];
            routeRendererNames = [];
        } else if (queryName == 'Asset Conditions') {
            bridgeRendererNames = [
                {name: 'Bridge Status', value: 'bridgeStatusRenderer'},
                {name: 'NHS Class', value: 'bridgeFunctionalClassRenderer'}
            ];
            routeRendererNames = [
                {name: 'Pavement Conditon', value: 'pavementConditionRenderer'},
                {name: 'Lane Count', value: 'routeLaneCountRenderer'}
            ];
        } else if (queryName == 'Conditions of Specified Road / CDS"') {
            bridgeRendererNames = [];
            routeRendererNames = [];
        } else if (queryName == 'Unstable Slopes') {
            bridgeRendererNames = [];
            routeRendererNames = [];
        }

        var bridgeRenderer;
        var routeRenderer;
        if(queryName == 'Assets' || queryName == 'Unstable Slopes'){
            bridgeRenderer = bridgeFunctionalClassRenderer;
            routeRenderer = roadFunctionalClassRenderer;
        } else {
            bridgeRenderer =  bridgeStatusRenderer;
            routeRenderer = pavementConditionRenderer;
        }

        if(rendererType){
            if(rendererType == 'Bridges'){
                if(rendererName){
                    selectedBridgeRenderer = rendererName;
                    bridgeRenderer = eval(rendererName);
                }
            }else{
                if(rendererName){
                    selectedRouteRenderer = rendererName;
                    routeRenderer = eval(rendererName);
                }
            }
        }

        var rend = new esri.renderer.SimpleRenderer(polygonSymbol);

        geographyLayer = initializeFeatureCollectionLayer('geography', rend.toJson(), GEOMETRY_TYPE_POLYGON);

        routeResultsLayer = initializeFeatureCollectionLayer(routeResultsLayerName, routeRenderer.toJson(), GEOMETRY_TYPE_POLYLINE);

        bridgeResultsLayer = initializeFeatureCollectionLayer(bridgeResultsLayerName, bridgeRenderer.toJson(), GEOMETRY_TYPE_POINT);

        unstableSlopeResultsLayer = initializeFeatureCollectionLayer(unstableSlopeResultsLayerName, unstableSlopesRenderer.toJson(),
            GEOMETRY_TYPE_POINT);

        if(queryName == 'Unstable Slopes'){
            legendDijit.refresh([
                {layer: unstableSlopeResultsLayer, title: "Unstable Slopes by Total Score"},
                {layer: routeResultsLayer, title: "Roads by NHS Class"}
            ]);
            buildLayerList([ unstableSlopeResultsLayer, routeResultsLayer, geographyLayer ]);
        }else if(queryName == 'Conditions of Specified Road / CDS'){
            legendDijit.refresh([
                {layer: bridgeResultsLayer, title: "Bridges"},
                {layer: routeResultsLayer, title: "Roads"}
            ]);
            buildLayerList([ bridgeResultsLayer, routeResultsLayer ]);
        }else {
            legendDijit.refresh([
                {layer: bridgeResultsLayer, title: "Bridges"},
                {layer: routeResultsLayer, title: "Roads"}
            ]);
            buildLayerList([ bridgeResultsLayer, routeResultsLayer, geographyLayer ]);
        }

    }

    function initializeFeatureCollectionLayer(layerName, layerRenderer, geometryType) {

        // We'll add the features later.
        var features = [];

        var layerDefinition = {
            "geometryType": geometryType,
            "objectIdField": "ObjectID",
            "drawingInfo": {
                "renderer": layerRenderer
            },
            "fields": [
                {
                    "name": "ObjectID",
                    "alias": "ObjectID",
                    "type": "esriFieldTypeOID"
                }
            ]
        };
        //create a feature collection
        var featureCollection = {
            "layerDefinition": layerDefinition,
            "featureSet": {
                "features": features,
                "geometryType": geometryType
            }
        };

        //create a feature layer based on the feature collection
        //var infoTemplate = new esri.InfoTemplate("Attributes", "${*}");

        var infoTemplate = new esri.InfoTemplate();
        infoTemplate.setTitle("Feature Attributes");
        infoTemplate.setContent(getTextContent);

        var featureLayer = new esri.layers.FeatureLayer(featureCollection, {
            id: layerName,
            infoTemplate: infoTemplate
        });
        featureLayer.htmlPopupType = esri.layers.FeatureLayer.POPUP_HTML_TEXT;

        map.addLayer(featureLayer);
        return featureLayer;
    }

    function getTextContent(graphic){
        var fieldLabels = tamis.Map.labels[graphic.attributes.dataKey];
        if(!fieldLabels && graphic.getLayer().id == 'geography'){
            return graphic.attributes.attributes[Object.keys(graphic.attributes.attributes)[0]];
        }
        var infoElements = [];
        for(var i = 0; i < fieldLabels.length; i++){
            var fieldLabel = fieldLabels[i];
            if(graphic.attributes[fieldLabel.title]){
                infoElements.push(fieldLabel.title + ": " + graphic.attributes[fieldLabel.title]);
            }
        }
        return infoElements.join('<br/>');
    }

    function buildLayerList(layers) {
        var visible = [];
        var items = [];
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            var label = null;
            if(layer.id == bridgeResultsLayerName){
                label = 'Bridges';
            } else if (layer.id == routeResultsLayerName){
                label = 'Roads';
            } else if (layer.id == unstableSlopeResultsLayerName){
                label = 'Unstable Slopes';
            } else if (layer.id == 'geography'){
                label = 'Geographic Areas';
            }

            if(label){
                visible.push(layer.id);

                var item = "<input type='checkbox' class='list_item' onclick='tamis.Map.updateLayerVisibility(this)'" +
                    (layer.visible ? "checked=checked" : "") + "' id='" + layer.id + "'' /><label for='" + layer.id + "'>" + label + "</label>";

                if(layer.id == 'BridgeFeatureResults' && bridgeRendererNames.length > 1){
                    var optionString = $.map(bridgeRendererNames, function (renderer) {
                        return "<option value='"+ renderer.value + "' " + (renderer.value == selectedBridgeRenderer ? "selected" : "") +" >" + renderer.name + "</option>";
                    }).join('');
                    var selectString = "&nbsp;<select type='Bridges' onchange='tamis.Map.updateRenderer(this);'>" + optionString + "</select>​";
                    item = item + selectString;
                }else if(layer.id == 'RouteFeatureResults' && routeRendererNames.length > 1){
                    var optionString = $.map(routeRendererNames, function (renderer) {
                        return "<option value='"+ renderer.value + "' " + (renderer.value == selectedRouteRenderer ? "selected" : "") +" >" + renderer.name + "</option>";
                    }).join('');
                    var selectString = "&nbsp;<select type='Roads' onchange='tamis.Map.updateRenderer(this);'>" + optionString + "</select>​";
                    item = item + selectString;
                }

                item = item + '<br />';
                items.push(item);
            }

        }
        var layerList = document.getElementById("layer_list");
        layerList.innerHTML = items.join(' ');
    }

    function updateRenderer(selector) {
        var selectedRenderer = $(selector).find('option:selected').val();
        var selectedRendererTitle = $(selector).find('option:selected').text();
        var type = $(selector).attr('type');

        map.destroy();
        map = new esri.Map(mapId, {
            basemap: "streets",
            showInfoWindowOnClick: true
        });

        this.initializeLayers(selectedRenderer, type);

        alert('Now symbolizing ' + type +' by ' + selectedRendererTitle);
    }

    function updateLayerVisibility(checkbox) {
        map.getLayer(checkbox.id).setVisibility(checkbox.checked);
    }

    // The legend will automatically update when a layer of a supported type is added.
    function initializeLegend() {
        legendDijit = new esri.dijit.Legend({
            map: map
        }, "legendDiv");
    }

    function loadData() {
        var layers = tamis.Map.layers;
        var features = [];
        $.each(layers, function (layerName, layerData) {
            features = features.concat(loadGeometry(layerData, layerName));
        });
        map.setExtent(esri.graphicsExtent(features))
    }

    function loadGeometry(featureResults, layerName) {
        var layer = map.getLayer(layerName);
        // Using the layer's renderer.
        var isRendererDefined = true;

        layer.clear();
        layer.suspend();

        var features = [];
        //var geometryType = GEOMETRY_TYPE_POLYLINE;
        var geometryType = layer.geometryType;
        for (var i = 0; i < featureResults.features.length; i++) {
            var featureResult = featureResults.features[i];
            var geom = featureResult.geometry;
            var newGraphic = createGraphic(geom, geometryType, featureResult, isRendererDefined, i);
            if(newGraphic.geometry.type == 'polyline' && geometryType.toLowerCase().indexOf('point') > -1){
                var point = newGraphic.geometry.getExtent().getCenter();
                newGraphic.geometry = point;
            }
            newGraphic.visible = true;
            features.push(newGraphic);
        }

        layer.applyEdits(features);
        layer.resume();
        layer.redraw();
        return features;
    }

    /**
     * Create a map graphic from the provided geometry and attributes.
     * @param geom The geometry object in Esri Json format.
     * @param geometryType The geometry type (point, polyline, polygon).
     * @param featureResult The original feature result object containing attributes.
     * @param isRendererDefined Whether renderer is already defined for the layer.
     * @param id The unique id for the feature.
     */
    function createGraphic(geom, geometryType, featureResult, isRendererDefined, id) {
        var esriGeom = esri.geometry.fromJson(geom);
        esriGeom.setSpatialReference(map.spatialReference);

        var simpleSymbol = null;
        if (!isRendererDefined) { //if no renderer, then use default simple ones
            switch (geometryType) {
                case GEOMETRY_TYPE_POINT:
                    simpleSymbol = markerSymbol;
                    break;
                case GEOMETRY_TYPE_POLYLINE:
                    simpleSymbol = polylineSymbol;
                    break;
                case GEOMETRY_TYPE_POLYGON:
                    simpleSymbol = polygonSymbol;
                    break;
                default:
                    break;
            }
        }

        var graphic = null;
        // Define the graphic's attributes here. Unique id seems to be necessary for the feature.
        var attributes = JSON.parse(JSON.stringify(featureResult, attributeReplacer));
        attributes["ObjectID"] = id;
        if (simpleSymbol) {
            graphic = new esri.Graphic(esriGeom, simpleSymbol, attributes);
        } else {
            graphic = new esri.Graphic(esriGeom);
            graphic.setAttributes(attributes);
        }

        return graphic;
    }

    /**
     * Skip the geometry when defining attributes.
     */
    function attributeReplacer(key, value) {
        if (key == geometryKey) {
            return undefined;
        }
        return value;
    }

    function setScalebar() {
        var scalebar = new esri.dijit.Scalebar({
            map: map,
            scalebarUnit: 'english'
        });
    }

    function rowSelect(rowData) {
        $(map.graphicsLayerIds).each(function (index, layerId) {
            var featureLayer = map.getLayer(layerId);
            $(featureLayer.graphics).each(function (index, feature) {
                if(feature.attributes.id == rowData.id){

                    if(feature.geometry.type == 'polyline'){
                        var point = feature.geometry.getExtent().getCenter();
                        map.centerAt(point);
                        map.infoWindow.setFeatures([feature]);
                        map.infoWindow.show(feature.geometry.getExtent().getCenter());
                    }else{
                        var point = feature.geometry;
                        map.centerAt(point);
                        map.infoWindow.setFeatures([feature]);
                        map.infoWindow.show(point);
                    }
                    return false;
                }
            });
        });
    }

    return {
        initializeMap: initializeMap,
        updateLayerVisibility: updateLayerVisibility,
        updateRenderer: updateRenderer,
        initializeLayers: initializeLayers,
        loadData: loadData
    }

}());
