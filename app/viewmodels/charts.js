define(['durandal/system', 'plugins/http', 'durandal/app', 'knockout', 'bootstrap', 'jquery-ui', './reportsbase', 'highcharts', '../config/appstate', '../definitions/reportdefs', 'plugins/router', '../config/config', './querydescription'],
    function (system, http, app, ko, bootstrap, jqueryui, reportsbase, highcharts, appstate, reportdefs, router, config, querydescription) {

        return{
            querydescription: querydescription,
            chartsRawData: null,
            reportdef: null,
            charts: ko.observableArray([]),
            graphMetrics: ko.observableArray([]),
            selectedMetric: ko.observable(),
            levelOrders: ko.observableArray([]),
            selectedOrder: ko.observable(),

            activate: function () {
                var data = appstate.queryResults;
                var queryName = appstate.queryName;
                if (data && queryName) {
                    this.chartsRawData = data;
                    this.reportdef = $.extend({}, reportdefs[queryName]); //make a local copy of the report def since we'll be modifying it
                    this.graphMetrics(this.reportdef.graphMetrics);
                    this.selectedMetric(this.reportdef.graphMetrics[0].value); //set default
                    this.selectedOrder(this.reportdef.levelOrders[0].name); //set default
                    this.levelOrders(this.reportdef.levelOrders);
                    var that = this;
                    this.selectedMetric.subscribe(function (newValue) {
                        that.refreshCharts();
                    });
                    this.selectedOrder.subscribe(function (newValue) {
                        that.refreshCharts();
                    });
                    this.charts(this.prepareCharts(data, this.reportdef));
                } else {
                    app.showMessage(config.noResultsMessage.message, config.noResultsMessage.title).then(function (dialogResult) {
                        router.navigate('queryconfig');
                    });
                    return;
                }
            },

            //DOM is ready, populate the chart divs
            attached: function () {
                this.renderCharts();
            },

            //selection changed by user, refresh the charts
            refreshCharts: function(){
                var that = this;
                $.each(this.levelOrders(), function (index, levelOrder) {
                    if(levelOrder.name == that.selectedOrder()){
                        that.reportdef.levels = levelOrder.value;
                    }
                });

                var charts = this.prepareCharts(this.chartsRawData, this.reportdef);
                this.charts(charts);
                this.renderCharts();
            },

            renderCharts: function () {
                var charts = this.charts();
                var metric = this.selectedMetric();
                var axisTitle = this.getSelectedMetricTitle();
                if(!$.isArray(metric)) metric = [metric];

                var rootScope = this;
                $.each(charts, function (index, chartTabPanel) {
                    var that = this;
                    that.chartTabPanel = chartTabPanel;
                    var chartElements = chartTabPanel.charts;
                    var topleveltitle = that.reportdef.headers[that.reportdef.fields.indexOf(that.reportdef.levels[1])]
                    $.each(chartElements, function (index, chartElement) {

                        that.chartElement = chartElement;
                        that.categories = [];

                        $.each(chartElement.datapoints, function (index, datapoint) {

                            $.each(metric, function (index, field) {
                                if(!$.isNumeric(datapoint[field] )){
                                    datapoint[field] = 0;
                                }else{
                                    datapoint[field] = Math.round(datapoint[field]);
                                }
                            });

                            that.categories.push(datapoint.name);
                        });

                        var seriesArray = [];
                        $.each(metric, function (index, field) {
                            var series = {};
                            series.name = rootScope.getLabelForMetric(field);
                            series.data = $.map(chartElement.datapoints, function (datapoint) {
                                return Number(datapoint[field]);
                            });
                            seriesArray.push(series);
                        });




                        that.axisTitle = axisTitle;
                        that.chartTitle = axisTitle + ' of ' + that.chartTabPanel.title
                            + ' By ' + topleveltitle
                            + ' For ' + chartElement.text;

                        var chartConfig = {
                            chart: {
                                type: 'column'
                            },
                            legend: {
                                enabled: false,
                            },
                            title: {
                                text: that.chartTitle
                            },
                            /* subtitle: {
                             text: 'Source: WorldClimate.com'
                             },*/
                            xAxis: {
                                categories: that.categories
                            },
                            yAxis: {
                                min: 0,
                                title: {
                                    text: that.axisTitle
                                }
                            },
                            tooltip: {
                                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                                pointFormat: '<tr><td style="padding:0">{series.name} <b>{point.y:.1f} ' + that.axisTitle + '</b></td></tr>',
                                footerFormat: '</table>',
                                shared: true,
                                useHTML: true
                            },
                            plotOptions: {
                                column: {
                                    pointPadding: 0.2,
                                    borderWidth: 0
                                }
                            },
                            series: seriesArray,
                        };
                        if(seriesArray.length > 1){
                            chartConfig.legend = {
                                layout: 'vertical',
                                    align: 'right',
                                    verticalAlign: 'middle',
                                    borderWidth: 0
                            };
                        }
                        $("#chart_" + chartElement.id).highcharts(chartConfig);
                    });
                });
            },


            prepareCharts: function (data, reportdef) {

                this.validateRequests(data, reportdef);
                var chartTabSet = [];
                //each chartRequest in the array represents a tabbed panel containing a chart for each node in the tree of aggregated data
                $.each(reportdef.tabs, function (index, tab) {
                    var featureData = data[reportdef.dataKeys[index]];
                    if(!featureData) return true;
                    var tree = reportsbase.buildTree(featureData, reportdef);  //create the tree based on the levels defined in request
                    var chartTabPanel = {};
                    chartTabPanel.reportdef = reportdef;
                    chartTabPanel.id = index;
                    chartTabPanel.title = tab
                    chartTabPanel.charts = [];
                    var outerIndex = index;
                    $.each(tree, function (index, root) {
                        var chart = {};
                        chart.datapoints = [];
                        chart.level = root.level;
                        chart.text = root.text;
                        $.each(root.children, function (index, child) {
                            child.name = child.text;
                            chart.datapoints.push(child);
                        });
                        chart.id = outerIndex + "_" + index;
                        chartTabPanel.charts.push(chart);
                    });


                    //now add a summary section below that aggregates by the second dimension
                    var topLevel = chartTabPanel.reportdef.levels.shift();
                    tree = reportsbase.buildTree(featureData, chartTabPanel.reportdef);
                    var summaryChart = {};
                    summaryChart.level = topLevel;
                    var topleveltitle = chartTabPanel.reportdef.headers[chartTabPanel.reportdef.fields.indexOf(topLevel)];
                    topleveltitle = /s$/.test(topleveltitle) ? topleveltitle + "es" : topleveltitle + 's';
                    summaryChart.text = "All " + topleveltitle;
                    summaryChart.id = outerIndex + "_" + chartTabPanel.length;
                    summaryChart.datapoints = []

                    $.each(tree, function (index, child) {
                        child.name = child.text;
                        summaryChart.datapoints.push(child);
                    });

                    chartTabPanel.charts.push(summaryChart);
                    chartTabPanel.reportdef.levels.unshift(topLevel);  //put the level back in so the column offsets are correct
                    chartTabSet.push(chartTabPanel);
                });
                return chartTabSet;
            },


            validateRequests: function (data, reportdef) {
                if (reportdef.levels.length > 2) {
                    throw new Error('Invalid chart configuration');
                }

                $.each(reportdef.dataKeys, function (index, dataKey) {

                    var featureData = data[dataKey];
                    if(featureData){
                        $.each(featureData, function (index, feature) {
                            if (feature['Length'] && feature['NumberOfLanes']) {
                                feature.LaneMiles = feature['Length'] * feature['NumberOfLanes']
                            } else {
                                feature.LaneMiles = 0;
                            }
                        });
                    }
                });
            },

            print: function () {
                var printOutput = $('<div></div>');

                $('.nav-tabs li > a').each(function (index, tab) {
                    var tabTitle = $(tab).find('span').text();
                    printOutput.append('<div class="chart-printout">Charts For Tab: ' + tabTitle + '</div>');
                    var chartDivId = tab.href.split('#')[1];
                    $('#' + chartDivId).find('.chart-container').each(function (index, chartContainer) {
                        printOutput.append($(chartContainer).clone());
                    });
                });

                var popupWin = window.open('', '_blank', 'width=800,height=600');
                popupWin.document.open()
                popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" href="style.css" /></head><body onload="window.print()">' + printOutput.html() + '</html>');
                popupWin.document.close();
            },

            getSelectedMetricTitle: function(){
                var metricValue = this.selectedMetric();
                var metricName;
                $.each(this.graphMetrics(), function (index, metric) {
                    if(metric.value = metricValue){
                        metricName = metric.name;
                        return false;
                    }
                });
                return metricName;
            },

            getLabelForMetric: function(metric){
                var label;
                var that = this;
                $.each(this.reportdef.fields, function (index, field) {
                    if(field == metric){
                        label = that.reportdef.headers[index];
                        return false;
                    }
                });
                return label;
            }

        };


    });