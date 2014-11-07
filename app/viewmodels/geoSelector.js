define(['plugins/http', 'durandal/app', 'knockout', 'jstree', 'bootstrap', 'jquery-ui', '../config/config', '../config/appstate', 'plugins/router', '../definitions/tabledefs'],
    function (http, app, ko, jstree, bootstrap, jqueryui, config, appstate, router, tabledefs) {

        return {
            geoTreeNodes: null,
            selectedGeographicType: ko.observable(),
            selectedGeographicTypeDisplay: ko.observable(),
            useGeographicFilter: ko.observable(),
            geoFilters: ko.observableArray([]),
            geographicTypes: [
                {name: "Regions", value: "Region"},
                {name: 'Assembly Districts', value: "HouseDistrict"}
            ],

            resetObservables: function () {
                this.selectedGeographicType(null);
                this.useGeographicFilter(null);
                this.geoFilters([]);
            },


            activate: function () {

                this.areaTree = {};
                this.assetTree = {};

                var that = this;

                //returning a promise, rendering pauses until promise completes
                return $.when(
                    $.ajax({
                        url: config.districtQueryUrl,
                        jsonpCallback: 'callback1',
                        dataType: "jsonp",
                        success: function (response) {
                            that.areaTree['Assembly Districts'] = response.AreaList;
                        }
                    }),

                    $.ajax({
                        url: config.regionQueryUrl,
                        jsonpCallback: 'callback2',
                        dataType: "jsonp",
                        success: function (response) {
                            that.areaTree['Regions'] = response.AreaList;
                        }
                    })
                ).then(function () {
                        var geoTreeNodes = [];

                        var sorter = function compare(a, b) {
                            if (a.text < b.text)
                                return -1;
                            if (a.text > b.text)
                                return 1;
                            return 0;
                        }

                        $(Object.getOwnPropertyNames(that.areaTree)).each(function () {
                            var geoTypeName = this;
                            var geoTreeNode = {};
                            geoTreeNode.children = [];
                            geoTreeNode.text = 'All ' + geoTypeName;
                            geoTreeNode.a_attr = {'selectionId': geoTypeName},
                                geoTreeNode.state = {'opened': true, 'selected': false};
                            geoTreeNode.selectionId = geoTypeName;
                            that.geoTreeNode = geoTreeNode;
                            $(that.areaTree[this]).each(function (index, childElement) {
                                var child = {};
                                child.text = childElement.Name;
                                geoTreeNode.selectionId = childElement.Value,
                                    child.a_attr = {'selectionId': childElement.Value},
                                    child.state = {'opened': false, 'selected': false};
                                child.parentId = that.geoTreeNode.text;
                                child.selectionId = childElement.Value;
                                that.geoTreeNode.children.push(child);
                            });
                            geoTreeNode.children = geoTreeNode.children.sort(sorter);
                            geoTreeNodes.push(geoTreeNode);
                        });
                        that.geoTreeNodes = geoTreeNodes;
                    });
            },

            bindingComplete: function () {

                var that = this;
                this.selectedGeographicType.subscribe(function (newValue) {
                    that.populateGeoTree(newValue);
                });

                this.useGeographicFilter.subscribe(function (newValue) {
                    if (newValue) {
                        $("#geoTree").jstree("uncheck_all", true);
                    }
                });
            },

            populateGeoTree: function (newValue) {
                $('#geoTree').jstree("destroy");

                if (newValue == undefined) {
                    this.selectedGeographicTypeDisplay(null);
                } else {
                    var geoTypeName;
                    $(this.geographicTypes).each(function (index, type) {
                        if (type.value == newValue) {
                            geoTypeName = type.name;
                        }
                    });

                    this.selectedGeographicTypeDisplay(geoTypeName);

                    var geoTreeData = [];
                    $(this.geoTreeNodes).each(function (index, node) {
                        if (node.text.indexOf(geoTypeName) > -1) {
                            geoTreeData.push(node);
                        }
                    });

                    var that = this;
                    $('#geoTree').jstree({
                        'plugins': ["checkbox"], 'core': {
                            'data': geoTreeData
                        }
                    }).on('changed.jstree', function (e, data) {
                        that.updateGeoSelection(e, data)
                    });
                }
            },

            updateGeoSelection: function (e, data) {
                this.values = $("#geoTree").jstree("get_checked", {full: true}, true);
                if (this.values.length > 0) {
                    var that = this;
                    $(this.values).each(function (index, node) {
                        if (!node.original.parentId) {
                            that.values.length = 0;
                            that.values.push(node);
                            return true;
                        }
                    });
                    this.geoFilters(this.values);
                } else {
                    this.geoFilters([]);
                }
            }
        };
    });