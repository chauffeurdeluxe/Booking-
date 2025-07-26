
let latestFare = 0;

function initAutocomplete() {
  const pickupInput = document.getElementById("pickup");
  const dropoffInput = document.getElementById("dropoff");

  const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput);
  const dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput);

  pickupAutocomplete.setFields(["place_id", "geometry", "name"]);
  dropoffAutocomplete.setFields(["place_id", "geometry", "name"]);

  pickupAutocomplete.addListener("place_changed", calculateDistanceAndFare);
  dropoffAutocomplete.addListener("place_changed", calculateDistanceAndFare);
}

document.getElementById("vehicleClass").addEventListener("change", calculateDistanceAndFare);
document.getElementById("datetime").addEventListener("change", calculateDistanceAndFare);

async function calculateDistanceAndFare() {
  const pickup = document.getElementById("pickup").value;
  const dropoff = document.getElementById("dropoff").value;
  const vehicleClass = document.getElementById("vehicleClass").value;
  const datetimeValue = document.getElementById("datetime").value;

  if (!pickup || !dropoff || !vehicleClass) return;

  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [pickup],
      destinations: [dropoff],
      travelMode: "DRIVING",
    },
    (response, status) => {
      if (status !== "OK") {
        alert("Error with Google Maps Distance Matrix: " + status);
        return;
      }

      const distanceText = response.rows[0].elements[0].distance.text;
      const distanceValue = response.rows[0].elements[0].distance.value / 1000; // meters to km

      let fare = 0;

      // Tiered pricing logic
      if (vehicleClass === "business") {
        if (distanceValue <= 6) fare = 124;
        else if (distanceValue <= 20) fare = 188;
        else if (distanceValue <= 40) fare = 250;
        else if (distanceValue <= 60) fare = 310;
        else if (distanceValue <= 80) fare = 370;
        else if (distanceValue <= 100) fare = 450;
        else fare = 0;
      } else if (vehicleClass === "business-suv") {
        if (distanceValue <= 6) fare = 184;
        else if (distanceValue <= 20) fare = 250;
        else if (distanceValue <= 40) fare = 320;
        else if (distanceValue <= 60) fare = 390;
        else if (distanceValue <= 80) fare = 460;
        else if (distanceValue <= 100) fare = 540;
        else fare = 0;
      } else if (vehicleClass === "first") {
        if (distanceValue <= 6) fare = 220;
        else if (distanceValue <= 20) fare = 300;
        else if (distanceValue <= 40) fare = 380;
        else if (distanceValue <= 60) fare = 450;
        else if (distanceValue <= 80) fare = 520;
        else if (distanceValue <= 100) fare = 600;
        else fare = 0;
      }

      // Airport parking detection
      const airportRegex = /airport/i;
      const parkingFee = (airportRegex.test(pickup) || airportRegex.test(dropoff)) ? 14 : 0;

      // Early/late surcharge detection
      let earlyLateFee = 0;
      if (datetimeValue) {
        const selectedHour = new Date(datetimeValue).getHours();
        if (selectedHour < 6 || selectedHour >= 22) {
          earlyLateFee = 30;
        }
      }

      const totalFare = fare + parkingFee + earlyLateFee;
      latestFare = totalFare;

      document.getElementById("fareDisplay").textContent =
        totalFare > 0 ? `Estimated Fare: $${totalFare}` : "Contact us for a custom quote.";
    }
  );
}
