function initAutocomplete() { }

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
  service.getDistanceMatrix({
    origins: [pickup],
    destinations: [dropoff],
    travelMode: 'DRIVING',
    unitSystem: google.maps.UnitSystem.METRIC,
  }, function (response, status) {
    if (status !== 'OK') {
      alert('Error calculating distance: ' + status);
      return;
    }

    const el = response.rows[0].elements[0];
    const distanceKm = parseFloat(el.distance.text.replace(/[^0-9.]/g, ''));
    const durationMin = el.duration.value / 60; // minutes

    // Sydney market-aligned base rates
    const perKmRate = 3.50;
    const perMinRate = 0.90;

    // Blacklane-style multipliers
    const multipliers = {
      business: 1.0, // Sedan
      suv: 1.4,      // Business SUV
      first: 1.8     // First Class
    };

    // Sydney minimum fares (AUD)
    const minFare = {
      business: 110,
      suv: 145,
      first: 220
    };

    // Raw fare calculation
    let fareCore = (distanceKm * perKmRate + durationMin * perMinRate) * multipliers[vehicleType];

    // Enforce minimum fare
    fareCore = Math.max(fareCore, minFare[vehicleType]);

    // GST, tax, profit margin (all-inclusive model)
    const gstRate = 0.10;
    const taxRate = 0.10;
    const profitRate = 0.25;
    let fare = fareCore * (1 + gstRate + taxRate + profitRate);

    // Late/early pickup surcharge
    const pickupHour = new Date(pickupTime).getHours();
    if (pickupHour < 5 || pickupHour >= 22) fare += 30;

    // Airport pickup already includes wait & tolls in fareCore
    // so no extra fee unless you want to add parking:
    if (pickup.toLowerCase().includes("airport")) fare += 0;

    fare = fare.toFixed(2);

    document.getElementById('fareResult').innerText = `Estimated Fare: $${fare}`;
  });
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
    totalFare,
    notes
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
