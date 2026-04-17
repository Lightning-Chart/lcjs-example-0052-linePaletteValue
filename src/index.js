/**
 * Example showcasing Line Series feature for coloring line dynamically based on separate Value data set
 */

const lcjs = require('@lightningchart/lcjs')
const {
    lightningChart,
    UIElementBuilders,
    UIOrigins,
    PalettedFill,
    LUT,
    ColorRGBA,
    regularColorSteps,
    emptyLine,
    AxisTickStrategies,
    emptyFill,
    Themes,
} = lcjs

const chart = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
    .ChartXY({
        theme: (() => {
    const t = Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined
    const smallView = Math.min(window.innerWidth, window.innerHeight) < 500
    if (!window.__lcjsDebugOverlay) {
        window.__lcjsDebugOverlay = document.createElement('div')
        window.__lcjsDebugOverlay.style.cssText = 'position:fixed;top:0;left:0;background:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;z-index:99999;font:12px monospace;pointer-events:none'
        if (document.body) document.body.appendChild(window.__lcjsDebugOverlay)
        setInterval(() => {
            if (!window.__lcjsDebugOverlay.parentNode && document.body) document.body.appendChild(window.__lcjsDebugOverlay)
            window.__lcjsDebugOverlay.textContent = window.innerWidth + 'x' + window.innerHeight + ' dpr=' + window.devicePixelRatio + ' small=' + (Math.min(window.innerWidth, window.innerHeight) < 500)
        }, 500)
    }
    return t && smallView ? lcjs.scaleTheme(t, 0.5) : t
})(),
    })
    .setTitle('Loading example data ...')
    .setCursor((cursor) =>
        cursor
            .setTickMarkerXVisible(false)
            .setTickMarkerYVisible(false)
            .setPointMarker((pm) => pm.setSize({ x: 15, y: 15 })),
    )

const theme = chart.getTheme()
const axisX = chart.getDefaultAxisX()
const axisY = chart.getDefaultAxisY()
chart.getDefaultAxes().forEach((axis) => axis.setTickStrategy(AxisTickStrategies.Empty).setStrokeStyle(emptyLine))

const lineSeries = chart.addLineSeries().setStrokeStyle((stroke) => stroke.setThickness(10))

const labelStart = chart.addUIElement(UIElementBuilders.TextBox, { x: axisX, y: axisY }).setVisible(false)

const dataSources = [
    {
        name: 'Speed',
        file: 'demo-data-speed.json',
        lut: new LUT({
            steps: regularColorSteps(0, 50, theme.examples.intensityColorPalette),
            interpolate: true,
            units: 'km/h',
        }),
        format: (value) => `${value.toFixed(1)} km/h`,
    },
    {
        name: 'Steering',
        file: 'demo-data-steering.json',
        lut: new LUT({
            steps: [
                { value: -100, color: ColorRGBA(255, 255, 0) },
                { value: 0, color: ColorRGBA(255, 255, 255) },
                { value: 100, color: ColorRGBA(0, 0, 255) },
            ],
            interpolate: true,
            units: '%',
        }),
        format: (value) => `${value.toFixed(1)} %`,
    },
    {
        name: 'Throttle',
        file: 'demo-data-throttle.json',
        lut: new LUT({
            steps: regularColorSteps(0, 100, theme.examples.intensityColorPalette),
            interpolate: true,
            units: '%',
        }),
        format: (value) => `${value.toFixed(1)} %`,
    },
]

const displayDataSource = async (sourceName) => {
    const dataSource = dataSources.find((item) => item.name === sourceName)
    let data = dataSource.data
    if (!data) {
        console.time(`Load data set ${sourceName}`)
        data = await fetch(
            new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + `examples/assets/0052/${dataSource.file}`,
        ).then((r) => r.json())
        dataSource.data = data
        console.timeEnd(`Load data set ${sourceName}`)
    }

    lineSeries
        .clear()
        .setName(sourceName)
        .appendJSON(data)
        .setStrokeStyle((stroke) => stroke.setFillStyle(new PalettedFill({ lut: dataSource.lut })))

    const start = data[0]
    labelStart.setVisible(true).setPosition(start).setOrigin(UIOrigins.CenterBottom).setMargin(10).setText('START')

    chart.setTitle(`Racecar ${sourceName} progression during 1 lap`)
}
displayDataSource('Speed')

// Embed HTML UI inside the chart for selecting between different data sources.
const uiDiv = document.createElement('div')
chart.engine.container.append(uiDiv)
uiDiv.style.position = 'absolute'
uiDiv.style.top = `${chart.getTitleMargin().top}px`
uiDiv.style.right = `${chart.getPadding().right}px`
const inputDataSource = document.createElement('select')
uiDiv.append(inputDataSource)
dataSources.forEach((dataSource) => {
    const option = document.createElement('option')
    inputDataSource.append(option)
    option.innerHTML = dataSource.name
})
inputDataSource.onchange = (e) => {
    displayDataSource(e.target.value)
}
