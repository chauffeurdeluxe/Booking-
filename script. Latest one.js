function initAutocomplete() {
  const pickupInput = document.getElementById('pickup');
  const dropoffInput = document.getElementById('dropoff');

  const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, {
    types: ['geocode'],
    componentRestrictions: { country: 'au' },
  });

  const dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput, {
    types: ['geocode'],
    componentRestrictions: { country: 'au' },
  });
}

google.maps.event.addDomListener(window, 'load', initAutocomplete);

document.getElementById('payNow').addEventListener('click', async function () {
  const name = document.querySelector('input[name="name"]').value;
  const email = document.querySelector('input[name="email"]').value;
  const phone = document.querySelector('input[name="phone"]').value;
  const vehicleType = document.getElementById('vehicleType').value;
  const pickup = document.getElementById('pickup').value;
  const dropoff = document.getElementById('dropoff').value;
  const pickupTime = document.getElementById('pickupTime').value;
  const notes = document.querySelector('textarea[name="notes"]').value;

  if (!name || !email || !phone || !vehicleType || !pickup || !dropoff || !pickupTime) {
    alert('Please fill in all required fields.');
    return;
  }

  try {
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [pickup],
        destinations: [dropoff],
        travelMode: 'DRIVING',
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      async function (response, status) {
        if (status !== 'OK') {
          alert('Error calculating distance: ' + status);
          return;
        }

        const distanceText = response.rows[0].elements[0].distance.text;
        const distanceInKm = parseFloat(distanceText.replace(' km', '').replace(',', ''));

        let fare = 0;

        // Tiered pricing logic
        if (vehicleType === 'business') {
          if (distanceInKm <= 6) fare = 124;
          else if (distanceInKm <= 20) fare = 188;
          else if (distanceInKm <= 40) fare = 250;
          else if (distanceInKm <= 60) fare = 310;
          else if (distanceInKm <= 80) fare = 370;
          else if (distanceInKm <= 100) fare = 450;
          else {
            alert('Distance exceeds 100 km. Please request a custom quote.');
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
            alert('Distance exceeds 100 km. Please request a custom quote.');
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
            alert('Distance exceeds 100 km. Please request a custom quote.');
            return;
          }
        }

        // Early/Late pickup fee
        const pickupHour = new Date(pickupTime).getHours();
        if (pickupHour < 5 || pickupHour >= 22) {
          fare += 30;
        }

        // Airport pickup fee (checks if pickup location includes "airport")
        if (pickup.toLowerCase().includes("airport")) {
          fare += 14;
        }

        // Update fare display
        document.getElementById('fareDisplay').innerText = `Estimated Fare: $${fare}`;

        // Redirect to server to create Stripe Checkout
        const response = await fetch('/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone,
            vehicleType,
            pickup,
            dropoff,
            pickupTime,
            notes,
            amount: fare,
          }),
        });

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Stripe session failed to create.');
        }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    alert('Something went wrong. Please try again.');
  }
});
          
        
      
  


      
    
  


