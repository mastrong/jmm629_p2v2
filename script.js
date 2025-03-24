import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

let worldGeoJSON = null;
let interval = 1500
let dataset = []; // Store the full dataset globally


async function loadDataset() {
  dataset = await d3.csv('GBIF_lionfish_filtered.csv', d => ({
    gbifID: d.gbifID,
    decimalLongitude: +d.decimalLongitude,  // Convert to number
    decimalLatitude: +d.decimalLatitude,    // Convert to number
    year: +d.year,                // Convert to number
  }));

   worldGeoJSON = await d3.json('world.json');

  populateYearSelector();
  drawMap();
}

function populateYearSelector() {
  const yearSelector = d3.select("#yearSelector");

  // Get unique decades from dataset
  const decades = [...new Set(dataset.map(d => Math.floor(d.year / 10) * 10))].sort((a, b) => a - b);

  // Add decade options to dropdown
  yearSelector.selectAll("option")
    .data(decades)
    .join("option")
    .attr("value", d => d)
    .text(d => `${d}s`);

  // Set default selected decade
  yearSelector.property("value", '1820');

  // Attach event listener
  yearSelector.on("input", drawMap);
}

async function drawMap() {
  const width = window.innerWidth;
  const height = window.innerHeight * 0.7;
  const svg = d3.select('#WorldSVG')
    .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet");

  try {
    // Load GeoJSON for world map
    const geojson = worldGeoJSON;

    // Get the selected year
    const selectedDecade = +d3.select("#yearSelector").property("value");

    // Filter data for current and previous decades
    const currentDecadeData = dataset.filter(d => Math.floor(d.year / 10) * 10 === selectedDecade);
    // Update observation count display
    d3.select("#observationCount").text(`${selectedDecade}s Observations: ${currentDecadeData.length}`)
        .attr("class", "open-sans text-dark text-center");

    // Define projection (Natural Earth projection)
    const projection = d3.geoNaturalEarth1()
      .fitExtent([[0, 0], [width, height]], geojson);

    // Define geoPath generator
    const geoGenerator = d3.geoPath().projection(projection);

    // Clear existing map content
    svg.selectAll("*").remove();

    // Draw graticule (latitude/longitude grid)
    const graticule = d3.geoGraticule();

  // Draw translucent globe background (just the sphere area)
  svg.append("path")
    .datum({ type: "Sphere" })
    .attr("d", geoGenerator)
    .attr("fill", "rgba(255, 255, 255, 0.6)")  // light, slightly transparent
    .attr("stroke", "none");

  // Draw graticules on top
  svg
    .append("path")
    .datum(graticule())
    .attr("d", geoGenerator)
    .attr("stroke", "#666")
    .attr("stroke-width", "0.2")
    .attr("fill", "none");

    // Draw landmasses
    svg
      .append("g")
      .attr("fill", "rgba(0, 198, 134, 0.6)")
      .selectAll('path')
      .data(geojson.features)
      .join('path')
      .attr('d', d => geoGenerator(d));

    // Draw all lionfish observations up to the selected decade
    svg.append("g")
      .selectAll("circle")
      .data(dataset.filter(d => Math.floor(d.year / 10) * 10 <= selectedDecade))
      .join("circle")
      .attr("cx", d => projection([d.decimalLongitude, d.decimalLatitude])[0])
      .attr("cy", d => projection([d.decimalLongitude, d.decimalLatitude])[1])
      .attr("r", d => Math.floor(d.year / 10) * 10 === selectedDecade ? 0 : 3)  // New ones start at 0
      .attr("fill", "red")
      .attr("opacity", 0.9)
      .transition()
      .duration(300)
      .attr("r", d => Math.floor(d.year / 10) * 10 === selectedDecade ? 6 : 3)  // Pulse to 6
      .transition()
      .duration(300)
      .attr("r", 3)  // Shrink back to 3
      .ease(d3.easeCubicOut);

  } catch (error) {
    document.querySelector("#errorMessage").textContent = error;
  }
}

// Load dataset and initialize everything
loadDataset();

let intervalId = null;
let isPlaying = true;

function playStep() {
  let currentValue = parseInt(d3.select("#yearSelector").property("value"));

  if (currentValue >= 2020) {
    clearInterval(intervalId);
    isPlaying = false;
    d3.select("#play-pause-button").text("Replay");
    return;
  }

  currentValue += 10;
  d3.select("#yearSelector").property("value", currentValue);
  drawMap();
}

// Start initial playback
intervalId = setInterval(playStep, interval);

// Button handler
d3.select("#play-pause-button").on("click", () => {
  let currentValue = parseInt(d3.select("#yearSelector").property("value"));

  if (isPlaying) {
    clearInterval(intervalId);
    isPlaying = false;
    d3.select("#play-pause-button").text("Play");
  } else {
    // If it's at the end, reset to 1920 and restart
    if (currentValue >= 2020) {
      d3.select("#yearSelector").property("value", 1920);
      drawMap();
    }

    intervalId = setInterval(playStep, interval);
    isPlaying = true;
    d3.select("#play-pause-button").text("Pause");
  }
});

window.addEventListener("resize", () => {
  drawMap();        // re-render map projection
});
