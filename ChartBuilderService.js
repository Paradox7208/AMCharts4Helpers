/* PUBLIC FUNCTIONS */

function scaleChartLabels(maxSizeChangedEvent) {
    var chart = maxSizeChangedEvent.target,
        multiplier = getScaleMultiplier(maxSizeChangedEvent),
        scaleOptions = {
            labelSelectors: ['children'],
            multiplier: multiplier
        };

    scaleLabels(chart, scaleOptions);

    if (chart.radarContainer) {
        scaleLabels(chart.radarContainer, scaleOptions);
    }

    if (chart.xAxes && chart.xAxes.each) {
        chart.xAxes.each(function (xAxis) {
            scaleOptions.labelSelectors = ['renderer.labels'];
            scaleLabels(xAxis, scaleOptions);

            if (xAxis.axisRanges && xAxis.axisRanges.each) {
                scaleOptions.labelSelectors = ['label'];
                xAxis.axisRanges.each(function (axisRange) {
                    scaleLabels(axisRange, scaleOptions);
                });
            }
        });
    }

    if (chart.series && chart.series.each) {
        scaleOptions.labelSelectors = ['labels']
        chart.series.each(function (series) {
            scaleLabels(series, scaleOptions);
        });
    }
}

function scaleLabels(source, options) {
    options = Object.assign({
        labelSelectors: [],
        multiplier: 1,
        supportedLabelPropertySelectors: ['fontSize', 'marginBottom', 'marginLeft', 'marginRight', 'marginTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingTop']
    }, options);

    var multiplier = Number(options.multiplier);
    if (isNaN(multiplier) || multiplier <= 0 || multiplier === 1) {
        return;
    }

    if ((options.labelSelectors || []).length === 0) {
        return;
    }

    var scaleLabel = function (label, template) {
        for (var i = 0; i < options.supportedLabelPropertySelectors.length; i++) {
            var labelSelector = options.supportedLabelPropertySelectors[i],
                labelProperty = findProperty(label, labelSelector) || findProperty(template, labelSelector);

            if (labelProperty) {
                var labelPropertyNumber = Number(labelProperty);
                if (!isNaN(labelPropertyNumber)) {
                    labelProperty = (options.multiplier * labelPropertyNumber);
                } else {
                    var number = labelProperty.match(/^\d+\.{1}\d*[^a-zA-Z\.]|^\d*[^a-zA-Z\.]/g),
                        format = labelProperty.match(/[a-zA-Z\%]+/g);

                    if (number && number.length > 0 && format && format.length > 0) {
                        number = number[0];
                        format = format[0];

                        labelProperty = (options.multiplier * number).toString() + format;
                    }
                }

                setProperty(label, options.supportedLabelPropertySelectors[i], labelProperty);
            }
        }

        return label;
    }

    for (var i = 0; i < options.labelSelectors.length; i++) {
        var labels = findProperty(source, options.labelSelectors[i]);
        if (labels) {
            if (labels.each) {
                labels.each(function (label, index) {
                    labels.setIndex(index, scaleLabel(label, labels.template));
                });
            } else if (angular.isObject(labels)) {
                labels = scaleLabel(labels, labels.template)
            }
        }
    }
}

/* PRIVATE METHODS */

function findProperty(source, selector) {
    if (!source || !selector) {
        return source;
    }

    var property = source,
        paths = selector.split('.');

    while (property && paths.length > 0) {
        property = property[paths.shift()];
    }

    return property;
}

function getScaleMultiplier(maxSizeChangedEvent) {
    var target = maxSizeChangedEvent ? maxSizeChangedEvent.target : undefined;
    if (!target) {
        return 1;
    }

    var targetWidth = target.pixelWidth || 0;
    return targetWidth / (maxSizeChangedEvent.previousWidth || targetWidth);
}

function setProperty(source, selector, value) {
    if (!source || !selector) {
        return;
    }

    var valueObj = {},
        paths = selector.split('.');

    for (var i = paths.length; i > 0; i--) {
        var obj = {};
        if (i === paths.length) {
            obj[paths[i - 1]] = value;
        } else {
            var existingProperty = findProperty(source, paths.slice(0, i).join('.'));
            existingProperty[paths[i]] = valueObj[paths[i]];
        }

        valueObj = obj;
    }

    Object.assign(source, valueObj);
}