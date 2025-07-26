
let svg, xScale, yScale, colorScale, stack, areaGenerator;
let data;
let currentSceneIndex = 0;

const scenesData = [
    {
        title: "Overview: US Electricity Trends in Past Decade (2014-2023)",
        description: "A look at the overall shift in electricity generation sources over the last decade, highlighting the initial dominance of fossil fuels and the recent rise of renewables.",
        dataFilter: (d) => true, 
        highlight: null, 
        chartType: "stackedArea",
        annotations: [
            { x: 150, y: 350, text: "Fossil Fuels Dominate (Coal & Natural Gas)" },
            { x: 450, y: 50, text: "Emergence of Renewables (Wind & Solar)" }
        ]
    },
    {
        title: "The Great Shift: From Coal to Natural Gas Dominance",
        description: "Witness the dramatic decline of coal as the primary electricity source, largely replaced by the rapid growth of natural gas, reshaping the fossil fuel landscape.",
        dataFilter: (d) => true,
        highlight: ["Coal", "Natural Gas"], 
        chartType: "stackedArea",
        annotations: [
            { x: 250, y: 380, text: "Coal's Steep Decline" },
            { x: 600, y: 280, text: "Natural Gas Surges Ahead" },
        ]
    },
    {
        title: "The Enduring Role of Hydroelectric Power",
        description: "Focus on the historical contribution of hydroelectric power as an early and consistent renewable energy source in the US.",
        dataFilter: (d) => true,
        highlight: "Hydroelectric",
        chartType: "stackedArea",
        annotations: [
            { x: 300, y: 250, text: "Hydro: A Long-Standing Renewable Source" }
        ]
    },
    {
        title: "Wind and Solar Take Off: A Modern Energy Revolution",
        description: "Witness the rapid and exponential growth of wind and solar energy in recent decades, driven by technological advancements and increasing environmental awareness.",
        dataFilter: (d) => true,
        highlight: ["Solar", "Wind"], 
        chartType: "stackedArea",
        annotations: [
            { x: 650, y: 150, text: "Exponential Growth in Wind and Solar!" },
            { x: 450, y: 400, text: "Coal's Declining Share" }
        ]
    }
];

const margin = { top: 50, right: 50, bottom: 50, left: 70 };
const chartWidth = 900 - margin.left - margin.right; 
const chartHeight = 550 - margin.top - margin.bottom; 

svg = d3.select("#main-chart")
    .attr("width", chartWidth + margin.left + margin.right)
    .attr("height", chartHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("opacity", 0); 

function loadData() {
    d3.csv("data.csv").then(loadedData => {
        const keys = ["Coal", "Natural Gas", "Nuclear", "Hydroelectric", "Solar", "Wind", "Other"];

        data = loadedData.map(d => {
            const obj = { year: d3.timeParse("%Y")(d.Year) }; 
            keys.forEach(key => {
                obj[key] = +d[key]; 
            });
            return obj;
        });

        data.sort((a, b) => a.year - b.year);

        xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.year))
            .range([0, chartWidth]);

        const maxGeneration = d3.max(data, d => {
            let sum = 0;
            for (const key of keys) {
                sum += d[key] || 0; 
            }
            return sum;
        });

        yScale = d3.scaleLinear()
            .domain([0, maxGeneration * 1.05]) 
            .range([chartHeight, 0]); 

        colorScale = d3.scaleOrdinal(d3.schemeCategory10) 
            .domain(keys); 

        stack = d3.stack().keys(keys);

        areaGenerator = d3.area()
            .x(d => xScale(d.data.year))
            .y0(d => yScale(d[0])) 
            .y1(d => yScale(d[1])); 

        renderScene();

    }).catch(error => {
        console.error("Error loading or parsing data:", error);
        d3.select("#visualization-container").html("<p style='color: red; text-align: center;'>Error loading data. Please check 'data.csv' and console for details.</p>");
    });
}

function renderScene() {
    const scene = scenesData[currentSceneIndex];

    svg.selectAll(".area-group, .axis").remove(); 
    d3.select("#annotations").selectAll(".annotation").remove();
    d3.select("#scene-description").html(`<h2>${scene.title}</h2><p>${scene.description}</p>`);

    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(yScale).ticks(10).tickFormat(d3.format(".2s"))); 

    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 15) 
        .attr("x", 0 - (chartHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "1.1em")
        .text("Electricity Generation (MWh)");

    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + margin.bottom - 10})`)
        .style("text-anchor", "middle")
        .style("font-size", "1.1em")
        .text("Year");

    const filteredData = data.filter(scene.dataFilter);
    const stackedSeries = stack(filteredData);

    const areas = svg.selectAll(".area-group")
        .data(stackedSeries)
        .enter().append("g")
        .attr("class", "area-group");

    areas.append("path")
        .attr("class", "area")
        .attr("fill", d => colorScale(d.key))
        .attr("d", areaGenerator)
        .style("opacity", 1) 
        .style("stroke", "none") 
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<strong>${d.key}</strong><br/>`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");

            d3.select(this).style("filter", "brightness(1.1)");
        })
        .on("mousemove", function(event, d) {
            const bisect = d3.bisector(d_data => d_data.year).left;
            const x0 = xScale.invert(d3.pointer(event)[0]); 
            const i = bisect(d.data, x0, 1);
            const d0 = d.data[i - 1];
            const d1 = d.data[i];
            const d_hovered = x0 - d0.year > d1.year - x0 ? d1 : d0; 
            tooltip.html(`<strong>${d.key}</strong><br/>${d_hovered.year.getFullYear()}: ${d3.format(".3s")(d_hovered[d.key])} MWh`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            d3.select(this).style("filter", "none");
        });

    if (scene.highlight) {
        const highlights = Array.isArray(scene.highlight) ? scene.highlight : [scene.highlight];

        svg.selectAll(".area")
            .style("opacity", 0.3) 
            .filter(d => highlights.includes(d.key)) 
            .style("opacity", 1) 
            .style("stroke", "black") 
            .style("stroke-width", 1.5); 
    }

    scene.annotations.forEach(anno => {
        d3.select("#annotations").append("div")
            .attr("class", "annotation")
            .style("left", `${anno.x}px`)
            .style("top", `${anno.y}px`)
            .html(anno.text);
    });
    d3.select("#prev-scene").property("disabled", currentSceneIndex === 0);
    d3.select("#next-scene").property("disabled", currentSceneIndex === scenesData.length - 1);
}

d3.select("#prev-scene").on("click", () => {
    if (currentSceneIndex > 0) {
        currentSceneIndex--;
        renderScene();
    }
});

d3.select("#next-scene").on("click", () => {
    if (currentSceneIndex < scenesData.length - 1) {
        currentSceneIndex++;
        renderScene();
    }
});

loadData();
