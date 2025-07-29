
function initAutocomplete() {
  const pickupInput = document.getElementById('pickup');
  const dropoffInput = document.getElementById('dropoff');

  new google.maps.places.Autocomplete(pickupInput, { componentRestrictions: { country: 'au' } });
  new google.maps.places.Autocomplete(dropoffInput, { componentRestrictions: { country: 'au' } });
}

document.getElementById('calculateFare').addEventListener('click', function () {
  const vehicleType = document.getElementById('vehicleType').value;
  const pickup = document.getElementById('pickup').value;
  const dropoff = document.getElementById('dropoff').value;
  const pickupTime = document.getElementById('pickupTime').value;

  if (!pickup || !dropoff || !vehicleType || !pickupTime) {
    alert('Please fill in pickup, dropoff, vehicle type, and pickup time.');
    return;
  }

  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [pickup],
      destinations: [dropoff],
      travelMode: 'DRIVING',
      unitSystem: google.maps.UnitSystem.METRIC,
    },
    function (response, status) {
      if (status !== 'OK') {
        alert('Error calculating distance: ' + status);
        return;
      }

      const distanceText = response.rows[0].elements[0].distance.text;
      const distanceInKm = parseFloat(distanceText.replace(' km', '').replace(',', ''));
      let fare = 0;

      if (vehicleType === 'business') {
        if (distanceInKm <= 6) fare = 124;
        else if (distanceInKm <= 20) fare = 188;
        else if (distanceInKm <= 40) fare = 250;
        else if (distanceInKm <= 60) fare = 310;
        else if (distanceInKm <= 80) fare = 370;
        else if (distanceInKm <= 100) fare = 450;
        else {
          document.getElementById('fareResult').innerText = 'Distance exceeds 100 km. Custom quote required.';
          return;
        }
      } else if (vehicleType === 'suv') {
        if (distanceInKm <= 6) fare = 184;
        else if (distanceInKm <= 20) fare = 250;
        else if (distanceInKm <= 40) fare = 320;
        else if (distanceInKm <= 60) fare = 390;
        else if (distanceInKm <= 80) fare = 460;
        else if (distanceInKm <= 100) fare = 540;
        else {
          document.getElementById('fareResult').innerText = 'Distance exceeds 100 km. Custom quote required.';
          return;
        }
      } else if (vehicleType === 'first') {
        if (distanceInKm <= 6) fare = 220;
        else if (distanceInKm <= 20) fare = 300;
        else if (distanceInKm <= 40) fare = 380;
        else if (distanceInKm <= 60) fare = 450;
        else if (distanceInKm <= 80) fare = 520;
        else if (distanceInKm <= 100) fare = 600;
        else {
          document.getElementById('fareResult').innerText = 'Distance exceeds 100 km. Custom quote required.';
          return;
        }
      }

      const pickupHour = new Date(pickupTime).getHours();
      if (pickupHour < 5 || pickupHour >= 22) fare += 30;

      if (pickup.toLowerCase().includes("airport")) fare += 14;

      document.getElementById('fareResult').innerText = `Estimated Fare: $${fare}`;
    }
  );
});
  

