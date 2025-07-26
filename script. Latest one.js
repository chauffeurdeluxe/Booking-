
    let latestFare = 0;

function initMap() {
  const options = {
    componentRestrictions: { country: "au" },
    fields: ["formatted_address", "geometry"],
  };

  const pickupInput = document.getElementById("pickup");
  const dropoffInput = document.getElementById("dropoff");

  const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
  const dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput, options);

  pickupAutocomplete.addListener("place_changed", calculateDistanceAndFare);
  dropoffAutocomplete.addListener("place_changed", calculateDistanceAndFare);
}

function calculateDistanceAndFare() {
  const pickup = document.getElementById("pickup").value;
  const dropoff = document.getElementById("dropoff").value;
  const vehicleType = document.getElementById("vehicleType").value;
  const datetimeValue = document.getElementById("datetime").value;

  console.log("Calculating fare for:", { pickup, dropoff, vehicleType, datetimeValue });

  if (!pickup || !dropoff || !vehicleType) {
    console.log("Missing required input; skipping calculation.");
    return;
  }

  const service = new google.maps.DistanceMatrixService();

  service.getDistanceMatrix(
    {
      origins: [pickup],
      destinations: [dropoff],
      travelMode: "DRIVING",
      unitSystem: google.maps.UnitSystem.METRIC,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: "bestguess",
      },
    },
    (response, status) => {
      if (status !== "OK") {
        console.error("Distance Matrix error:", status);
        alert("Error getting distance info. Please check addresses.");
        return;
      }

      const element = response.rows[0].elements[0];

      if (element.status !== "OK") {
        console.error("Element status error:", element.status);
        alert("Error with route details. Please check addresses.");
        return;
      }

      const distanceInKm = element.distance.value / 1000;
      console.log("Distance in km:", distanceInKm);

      let fare = 0;

      if (vehicleType === "business") {
        if (distanceInKm <= 6) fare = 124;
        else if (distanceInKm <= 20) fare = 188;
        else if (distanceInKm <= 40) fare = 250;
        else if (distanceInKm <= 60) fare = 310;
        else if (distanceInKm <= 80) fare = 370;
        else if (distanceInKm <= 100) fare = 450;
        else fare = 0;
      } else if (vehicleType === "suv") {
        if (distanceInKm <= 6) fare = 184;
        else if (distanceInKm <= 20) fare = 250;
        else if (distanceInKm <= 40) fare = 320;
        else if (distanceInKm <= 60) fare = 390;
        else if (distanceInKm <= 80) fare = 460;
        else if (distanceInKm <= 100) fare = 540;
        else fare = 0;
      } else if (vehicleType === "first") {
        if (distanceInKm <= 6) fare = 220;
        else if (distanceInKm <= 20) fare = 300;
        else if (distanceInKm <= 40) fare = 380;
        else if (distanceInKm <= 60) fare = 450;
        else if (distanceInKm <= 80) fare = 520;
        else if (distanceInKm <= 100) fare = 600;
        else fare = 0;
      }

      const airportRegex = /airport/i;
      const parkingFee = airportRegex.test(pickup) || airportRegex.test(dropoff) ? 14 : 0;

      let earlyLateFee = 0;
      if (datetimeValue) {
        const hour = new Date(datetimeValue).getHours();
        if (hour < 6 || hour >= 22) {
          earlyLateFee = 30;
        }
      }

      const totalFare = fare + parkingFee + earlyLateFee;
      latestFare = totalFare;

      console.log(`Fare breakdown: base=${fare}, parking=${parkingFee}, earlyLate=${earlyLateFee}, total=${totalFare}`);

      document.getElementById("fareDisplay").textContent =
        totalFare > 0 ? `Estimated Fare: $${totalFare}` : "Contact us for a custom quote.";
    }
  );
}

document.getElementById("vehicleType").addEventListener("change", calculateDistanceAndFare);
document.getElementById("datetime").addEventListener("change", calculateDistanceAndFare);

window.initMap = initMap;
    


  

