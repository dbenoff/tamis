define(['plugins/http', 'durandal/app', 'knockout', 'jquery-ui', 'datatables', '../config/appstate', 'plugins/router', '../definitions/tabledefs', '../config/config', './querydescription', '../services/dataservice'],
    function (http, app, ko, jqueryui, datatables, appstate, router, tabledefs, config, querydescription, dataservice) {

        return {

            querydescription: querydescription,
            displayName: 'Query Results',
            configuredTables: ko.observableArray([]),

            activate: function () {
                var that = this;
                return $.get("assets/json/appstate_q5.json",
                    function (queryData) {
                        var fields = Object.keys(queryData);
                        $.each(fields, function (index, field) {
                            appstate[field] = queryData[field]
                        });

                        that.realactivate();
                    }
                );
            },

            realactivate: function () {
                var data = appstate.queryResults;
                var queryName = appstate.queryName;
                var configuredTables = [];
                if (data && queryName) {
                    var tabledef = tabledefs[queryName];
                    $(tabledef.tabs).each(function (index, tabname) {
                        var dataKey = tabledef.dataKeys[index];
                        if (data[dataKey] && data[dataKey].length > 0) {
                            var table = {};
                            table.title = tabname;
                            table.data = data[dataKey];
                            table.columnDefs = tabledef.columnDefs[dataKey];
                            table.id = index;
                            $(table.data).each(function (index, row) {
                                row.id = (((1+Math.random())*0x10000)|0).toString(16).substring(1);
                            });
                            configuredTables.push(table);
                        }
                    });
                }
                if (configuredTables.length < 1) {
                    app.showMessage(config.noResultsMessage.message, config.noResultsMessage.title).then(function (dialogResult) {
                        router.navigate('queryconfig');
                    });
                    return;
                }
                this.configuredTables(configuredTables);

            },

            bindingComplete: function () {
                $('#mapiframe').load(function() {
                    var parentEvent = jQuery.Event( "loaddata" );
                    parentEvent.labels = {};
                    $.each(appstate.queryResults, function (dataKey, dataSet) {
                        var rowMap = {};
                        $.each(dataSet, function (index, row) {
                            rowMap[row.ObjectId] = row;
                        });

                        var columnDefs = tabledefs[appstate.queryName].columnDefs[dataKey]
                        parentEvent.labels[dataKey] = columnDefs;

                        var layer = appstate.layerMap[dataKey];
                        if(layer){
                            $.each(layer.features, function (index, feature) {
                                if(rowMap[feature.attributes.OBJECTID]){
                                    var row = rowMap[feature.attributes.OBJECTID];
                                    $.each(columnDefs, function (index, columnDef) {
                                        feature[columnDef.title] = row[columnDef.data];
                                    });
                                    feature.id = row.id;
                                    feature.dataKey = dataKey;
                                }
                            });
                        }else{
                            delete appstate.layerMap[dataKey];
                        }
                    });
                    parentEvent.layers = appstate.layerMap;
                    parentEvent.queryName = appstate.queryName
                    parentEvent.tableDefs = tabledefs;
                    $( "body" ).trigger( parentEvent );
                });

                $(this.configuredTables()).each(function (index, table) {

                    var dataTable = $('#' + table.id + '_table').dataTable({
                        "aoColumnDefs": [
                            { "sWidth": "10%", "aTargets": [ -1 ] }
                        ],
                        "data": table.data,
                        "columns": table.columnDefs
                    });

                    $(dataTable).on('click', 'tr', function () {
                        if ($(this).hasClass('selected')) {
                            $(this).removeClass('selected');
                        }
                        else {
                            dataTable.$('tr.selected').removeClass('selected');
                            $(this).addClass('selected');
                            var rowData = dataTable.fnGetData( this );
                            if(rowData){
                                var parentEvent = jQuery.Event( "rowselect" );
                                parentEvent.rowData = rowData;
                                $( "body" ).trigger( parentEvent );
                            }
                        }
                    });
                });

                $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                    var table = $.fn.dataTable.fnTables(true);
                    if (table.length > 0) {
                        $(table).dataTable().fnAdjustColumnSizing();
                    }
                });
            },

            compositionComplete: function () {
                $('a[data-toggle="tab"]:first').trigger("shown.bs.tab");

                var footerTop = $('#mapheight').height() + $('header').height();
                $("#stickyfooter").css('top', footerTop + 'px');

            },

            canDeactivate: function () {
                $("#stickyfooter").css('top', '');
                return true;
            },
        };
    });