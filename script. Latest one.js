
document.getElementById("booking-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const pickup = document.getElementById("pickup").value;
  const dropoff = document.getElementById("dropoff").value;
  const vehicleType = document.getElementById("vehicle").value;
  const datetime = document.getElementById("datetime").value;
  const clientName = document.getElementById("name").value;
  const clientEmail = document.getElementById("email").value;
  const clientPhone = document.getElementById("phone").value;

  const pickupHour = new Date(datetime).getHours();
  const isEarlyLate = (pickupHour < 6 || pickupHour >= 22);
  const earlyLateFee = isEarlyLate ? 30 : 0;

  const isAirport = pickup.toLowerCase().includes("airport") || dropoff.toLowerCase().includes("airport");
  const parkingFee = isAirport ? 14 : 0;

  const distanceService = new google.maps.DistanceMatrixService();
  distanceService.getDistanceMatrix({
    origins: [pickup],
    destinations: [dropoff],
    travelMode: 'DRIVING',
    unitSystem: google.maps.UnitSystem.METRIC,
  }, async function (response, status) {
    if (status !== 'OK') {
      alert('Error calculating distance: ' + status);
    } else {
      const distanceText = response.rows[0].elements[0].distance.text;
      const distanceValue = parseFloat(distanceText.replace(' km', '').replace(',', ''));

      let baseFare = 0;
      if (vehicleType === "business") {
        if (distanceValue <= 6) baseFare = 124;
        else if (distanceValue <= 20) baseFare = 188;
        else if (distanceValue <= 40) baseFare = 250;
        else if (distanceValue <= 60) baseFare = 310;
        else if (distanceValue <= 80) baseFare = 370;
        else if (distanceValue <= 100) baseFare = 450;
        else baseFare = 0; // custom quote
      } else if (vehicleType === "van") {
        if (distanceValue <= 6) baseFare = 184;
        else if (distanceValue <= 20) baseFare = 250;
        else if (distanceValue <= 40) baseFare = 320;
        else if (distanceValue <= 60) baseFare = 390;
        else if (distanceValue <= 80) baseFare = 460;
        else if (distanceValue <= 100) baseFare = 540;
        else baseFare = 0;
      } else if (vehicleType === "first") {
        if (distanceValue <= 6) baseFare = 220;
        else if (distanceValue <= 20) baseFare = 300;
        else if (distanceValue <= 40) baseFare = 380;
        else if (distanceValue <= 60) baseFare = 450;
        else if (distanceValue <= 80) baseFare = 520;
        else if (distanceValue <= 100) baseFare = 600;
        else baseFare = 0;
      }

      if (baseFare === 0) {
        alert("Distance exceeds 100 km. Please contact us for a custom quote.");
        return;
      }

      const totalFare = baseFare + earlyLateFee + parkingFee;

      // Update price on screen (optional if using UI display)
      document.getElementById("calculatedFare").innerText = `$${totalFare.toFixed(2)}`;

      // Redirect to Stripe link (temporary static link for now)
      window.location.href = "https://buy.stripe.com/test_XXXXXXXXXXXXXX";
    }
  });
});
