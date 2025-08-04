
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
      const baseRate = 50;
      const perKmRate = 3.00;
      const gstRate = 0.10;
      const taxRate = 0.10;
      const profitRate = 0.20;

      const blocksOf10km = Math.ceil(distanceInKm / 10); // every 10km block

      let rawFare = baseRate + (distanceInKm * perKmRate);

      // Add extra cost per 10km based on vehicle type
      if (vehicleType === 'suv') {
        rawFare += blocksOf10km * 20;
      } else if (vehicleType === 'first') {
        rawFare += blocksOf10km * 45;
      }

      // Apply GST, TAX, and Profit margin
      const gst = rawFare * gstRate;
      const tax = rawFare * taxRate;
      const profit = rawFare * profitRate;

      let fare = rawFare + gst + tax + profit;

      // Add early/late pickup surcharge
      const pickupHour = new Date(pickupTime).getHours();
      if (pickupHour < 5 || pickupHour >= 22) fare += 30;

      // Add airport parking if pickup includes "airport"
      if (pickup.toLowerCase().includes("airport")) fare += 14;

      fare = fare.toFixed(2);

      document.getElementById('fareResult').innerText = `Estimated Fare: $${fare}`;
    }
  );
});

document.getElementById('payNow').addEventListener('click', async function () {
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;
  const pickup = document.getElementById('pickup').value;
  const dropoff = document.getElementById('dropoff').value;
  const pickupTime = document.getElementById('pickupTime').value;
  const vehicleType = document.getElementById('vehicleType').value;
  const fareText = document.getElementById('fareResult').innerText;
  const notes = document.getElementById('notes').value;
  
  if (!name || !phone || !email || !pickup || !dropoff || !pickupTime || !vehicleType || !fareText.includes('$')) {
    alert('Please fill out all details and calculate fare before proceeding.');
    return;
  }

  const totalFare = parseFloat(fareText.replace(/[^\d.]/g, ''));
  const bookingData = {
    name,
    phone,
    email,
    pickup,
    dropoff,
    datetime: pickupTime,
    vehicleType,
    totalFare
  };

  try {
    const response = await fetch('https://server-qdh1.onrender.com/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Payment session failed. Please try again.');
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Something went wrong. Please try again.');
  }
});
  


