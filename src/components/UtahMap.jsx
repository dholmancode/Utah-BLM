import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const blankStyle = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#ffffff",
      },
    },
  ],
};

export default function UtahMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const tooltip = useRef(null);

  useEffect(() => {
    if (map.current) return;

    // Create tooltip div and append it to map container
    tooltip.current = document.createElement("div");
    Object.assign(tooltip.current.style, {
      position: "absolute",
      padding: "6px 10px",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      color: "#fff",
      borderRadius: "4px",
      pointerEvents: "none",
      fontSize: "12px",
      display: "none",
      zIndex: 1000,
      whiteSpace: "nowrap",
    });
    mapContainer.current.appendChild(tooltip.current);

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: blankStyle,
      center: [-111.8, 39.3],
      zoom: 6,
      maxBounds: [
        [-120.0, 33.0],
        [-104.0, 46.0],
      ],
    });

    map.current.on("load", async () => {
      // 🌄 Add terrain-style raster layer from OpenTopoMap
      map.current.addSource("stamen-terrain", {
        type: "raster",
        tiles: [
          "https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg",
        ],
        tileSize: 256,
        attribution:
          'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
          '<a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
      });

      map.current.addLayer({
        id: "stamen-terrain-layer",
        type: "raster",
        source: "stamen-terrain",
        minzoom: 0,
        maxzoom: 18,
      });

      map.current.addSource("carto-light", {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
          'contributors &copy; <a href="https://carto.com/">CARTO</a>',
      });

      map.current.addLayer({
        id: "carto-light-layer",
        type: "raster",
        source: "carto-light",
      });

      // 🗺️ Load Utah boundary
      const utahResponse = await fetch("/utah-boundary.geojson");
      const utahData = await utahResponse.json();

      map.current.addSource("utah-boundary", {
        type: "geojson",
        data: utahData,
      });

      map.current.addLayer({
        id: "utah-fill",
        type: "fill",
        source: "utah-boundary",
        paint: {
          "fill-color": "#143738",
          "fill-opacity": 0.1,
        },
      });

      map.current.addLayer({
        id: "utah-outline",
        type: "line",
        source: "utah-boundary",
        paint: {
          "line-color": "#FFFFFF",
          "line-width": 3,
        },
      });

      // 🟧 Load BLM overlay
      const blmResponse = await fetch("/BLM-Utah.geojson");
      const blmData = await blmResponse.json();

      map.current.addSource("blm-utah", {
        type: "geojson",
        data: blmData,
      });

      map.current.addLayer({
        id: "blm-utah-fill",
        type: "fill",
        source: "blm-utah",
        paint: {
          "fill-color": "#FFA500",
          "fill-opacity": 0.2,
        },
      });

      map.current.addLayer({
        id: "blm-utah-outline",
        type: "line",
        source: "blm-utah",
        paint: {
          "line-color": "#FF8C00",
          "line-width": 1,
        },
      });

      // -- Tooltip interactivity --
      map.current.on("mousemove", "blm-utah-fill", (e) => {
        if (e.features.length > 0) {
          const feature = e.features[0];
          const wildType = feature.properties?.wildType || "Unknown Type";
          const nlcsName = feature.properties?.NLCS_NAME || "Unnamed Area";

          const rect = mapContainer.current.getBoundingClientRect();

          tooltip.current.style.left = `${e.originalEvent.clientX - rect.left + 10}px`;
          tooltip.current.style.top = `${e.originalEvent.clientY - rect.top + 10}px`;
          tooltip.current.style.display = "block";
          tooltip.current.textContent = `${nlcsName} - ${wildType}`;

          map.current.getCanvas().style.cursor = "pointer";
        }
      });

      map.current.on("mouseleave", "blm-utah-fill", () => {
        tooltip.current.style.display = "none";
        tooltip.current.textContent = "";
        map.current.getCanvas().style.cursor = "";
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (tooltip.current) {
        tooltip.current.remove();
        tooltip.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      className="w-full h-screen"
      style={{ position: "relative" }}
    />
  );
}
