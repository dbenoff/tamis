define(
    function () {
        return {
            'Assets': {
                Roads: {
                    type: 'bar',
                    headers: ['Jurisdiction', 'NHS Class', 'Centerline Miles', 'Lane Miles'],
                    fields: ['Jurisdiction', 'NHSClass', 'Length', 'LaneMiles'],
                    levels: ['Jurisdiction', 'NHSClass'],
                    sums: ['Length', 'LaneMiles'],
                    averages: [],
                    dataKey: 'RouteFeatureResults',
                    graphMetrics: [
                        {name: "Centerline Miles", value: "Length"},
                        {name: 'Lane Miles', value: "LaneMiles"},
                    ],
                    levelOrders: [
                        {name: "By Jurisdiction, then by NHS Class", value: ['Jurisdiction', 'NHSClass']},
                        {name: "By NHS Class, then by Jurisdiction", value: ['NHSClass', 'Jurisdiction']}
                    ]
                },
                Bridges: {
                    type: 'bar',
                    headers: ['Jurisdiction', 'NHS Class', 'Centerline Miles', 'Lane Miles', 'Count'],
                    fields: ['Jurisdiction', 'NHSClass', 'Length', 'LaneMiles', 'count'],
                    levels: ['Jurisdiction', 'NHSClass'],
                    sums: ['Length', 'LaneMiles', 'count'],
                    averages: [],
                    dataKey: 'BridgeFeatureResults',
                    graphMetrics: [
                        {name: "Centerline Miles", value: "Length"},
                        {name: 'Lane Miles', value: "LaneMiles"},
                        {name: 'Bridge Count', value: "count"},
                    ],
                    levelOrders: [
                        {name: "By Jurisdiction, then by NHS Class", value: ['Jurisdiction', 'NHSClass']},
                        {name: "By NHS Class, then by Jurisdiction", value: ['NHSClass', 'Jurisdiction']}
                    ]
                }
            },
            'Asset Conditions': {
                Roads: {
                    type: 'bar',
                    bins: [{name: "Pavement Condition", value:'PavementCond'}],
                    headers: ['Jurisdiction', 'NHS Class', 'Miles', 'Lane Miles', 'Pavement Condition', 'Count'],
                    fields: ['Jurisdiction', 'NHSClass', 'Length', 'LaneMiles', 'PavementCond', 'count'],
                    levels: ['Jurisdiction', 'NHSClass', 'condition'],
                    sums: ['Length', 'LaneMiles'],
                    averages: [],
                    dataKey: 'RouteFeatureResults',
                    graphMetrics: [
                        {name: "Centerline Miles", value: "Length"},
                        {name: 'Lane Miles', value: "LaneMiles"},
                    ],
                    levelOrders: [
                        {name: "By Jurisdiction, then by NHS Class", value: ['Jurisdiction', 'NHSClass', 'condition']},
                        {name: "By NHS Class, then by Jurisdiction", value: ['NHSClass', 'Jurisdiction', 'condition']}
                    ]
                },
                Bridges: {
                    type: 'bar',
                    bins: [{name: "Deck Condition", value:'DeckCond'}],
                    headers: ['Jurisdiction', 'NHS Class', 'Miles', 'Lane Miles', 'Deck Condition', 'Count'],
                    fields: ['Jurisdiction', 'NHSClass', 'Length', 'LaneMiles', 'DeckCond', 'count'],
                    levels: ['Jurisdiction', 'NHSClass', 'condition'],
                    sums: ['count'],
                    averages: [],
                    dataKey: 'BridgeFeatureResults',
                    graphMetrics: [
                        {name: "Count", value: "count"},
                    ],
                    levelOrders: [
                        {name: "By Jurisdiction, then by NHS Class", value: ['Jurisdiction', 'NHSClass', 'DeckCond']},
                        {name: "By NHS Class, then by Jurisdiction", value: ['NHSClass', 'Jurisdiction', 'DeckCond']}
                    ]
                }
            },
            'Conditions of Specified Road / CDS': {
                Roads: {
                    type: 'bar',
                    bins: [{name: "Pavement Condition", value: "condition"}],
                    headers: ['Miles', 'Lane Miles'],
                    fields: ['Length', 'LaneMiles'],
                    levels: ['RouteName'],
                    sums: ['Length', 'LaneMiles'],
                    averages: [],
                    dataKey: 'RouteFeatureResults',
                    graphMetrics: [
                        {name: "Centerline Miles", value: "Length"},
                        {name: 'Lane Miles', value: "LaneMiles"},
                    ]
                },
                Bridges: {
                    type: 'bar',
                    bins: [{name: "Deck Condition", value: "condition"}],
                    headers: ['Miles', 'Lane Miles', 'Count'],
                    fields: ['Length', 'LaneMiles', 'count'],
                    levels: ['RouteName'],
                    sums: ['count'],
                    averages: [],
                    dataKey: 'BridgeFeatureResults',
                    graphMetrics: [
                        {name: "Count", value: "count"},
                    ]
                }
            },
            'Unstable Slopes': {
                'Unstable Slopes': {
                    type: 'bar',
                    headers: ['Jurisdiction', 'Risk Score', 'Count'],
                    fields: ['Jurisdiction', 'riskbucket', 'count'],
                    levels: ['Jurisdiction', 'riskbucket'],
                    sums: ['count'],
                    averages: [],
                    tabs: ['Unstable Slopes'],
                    dataKey: 'UnstableSlopeFeatureResults',
                    graphMetrics: [
                        {name: "Count", value: "count"}
                    ],
                    levelOrders: [
                        {name: "By Jurisdiction", value: ['Jurisdiction', 'riskbucket']}
                    ]
                }
            },

        };
    });