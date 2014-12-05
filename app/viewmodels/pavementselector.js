define(['plugins/http', 'durandal/app', 'knockout', 'jstree', 'bootstrap', 'jquery-ui', '../config/config', '../services/dataservice'],
    function (http, app, ko, jstree, bootstrap, jqueryui, config, dataservice) {

        return {
            conditions: ko.observableArray([]),
            selectedCondition: ko.observable(),

            resetObservables: function () {
                //this.conditions([]);
                this.selectedCondition();
            },

            activate: function () {

                var that = this;
                //returning a promise, rendering pauses until promise completes
                return $.when(
                    dataservice.getRoutes(function (response) {
                        function hasName(element) {
                            return element.Name.replace(/ /g,'').length > 0;
                        }
                        response.RouteList = response.RouteList.filter(hasName);

                        var routeMap = {};
                        for(var i = 0; i < response.RouteList.length; i++){
                            var routeName = response.RouteList[i].Name.replace(/ /g,'').toLowerCase();
                            if(routeMap[routeName]){
                                routeMap[routeName].Id = routeMap[routeName].Id + ',' + response.RouteList[i].Id;
                            }else{
                                routeMap[routeName] = response.RouteList[i];
                            }
                        }

                        var routeList = [];

                        $(Object.keys(routeMap)).each(function (index, key) {
                            routeList.push(routeMap[key]);
                        });


                        var sorter = function compare(a,b) {
                            var aName = a.Name.toLowerCase();
                            var bName = b.Name.toLowerCase();
                            if (aName < bName)
                                return -1;
                            if (aName > bName)
                                return 1;
                            return 0;
                        }
                        routeList.sort(sorter);
                        that.routes(routeList);
                    })
                ).then(
                    function () {

                    }
                );
            }
        };
    });