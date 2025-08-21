function initAutocomplete() {
  const pickupInput = document.getElementById("pickup");
  const dropoffInput = document.getElementById("dropoff");

  if (pickupInput) {
    new google.maps.places.Autocomplete(pickupInput, { componentRestrictions: { country: 'au' } });
  }

  if (dropoffInput) {
    new google.maps.places.Autocomplete(dropoffInput, { componentRestrictions: { country: 'au' } });
  }
}

// Hide spinner when user navigates back to page (prevents spinner freeze)
window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'none';
  }
});

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
    if (el.status !== 'OK') {
      alert('Could not calculate distance for the provided locations.');
      return;
    }

    const distanceKm = parseFloat(el.distance.text.replace(/[^0-9.]/g, ''));
    const durationMin = el.duration.value / 60; // convert seconds to minutes
    
    // Pricing logic
    const perKmRate = (distanceKm > 20) ? 2.75 : 3.50;
    const perMinRate = 0.90;

    const multipliers = {
      business: 1.0,
      suv: 1.4,
      first: 1.8
    };

    const minFare = {
      business: 110,
      suv: 145,
      first: 200
    };

    let fareCore = (distanceKm * perKmRate + durationMin * perMinRate) * multipliers[vehicleType];
    fareCore = Math.max(fareCore, minFare[vehicleType]);

    const gstRate = 0.10;
    const taxRate = 0.10;
    const profitRate = 0.25;
    let fare = fareCore * (1 + gstRate + taxRate + profitRate);

    const pickupHour = new Date(pickupTime).getHours();
    if (pickupHour < 5 || pickupHour >= 22) fare += 30;

    if (pickup.toLowerCase().includes("airport")) {
      if (pickup.toLowerCase().includes("domestic")) {
        fare += 9;
      } else if (pickup.toLowerCase().includes("international")) {
        fare += 14;
      } else {
        fare += 14;
      }
    }

    fare = fare.toFixed(2);

    document.getElementById('fareSummary').innerHTML = `
      <div>Estimated Fare: $${fare}</div>
      <div>Distance: ${distanceKm.toFixed(2)} km</div>
      <div>Estimated Time: ${durationMin.toFixed(0)} min</div>
    `;

    const fareSummary = document.getElementById('fareSummary');
    fareSummary.setAttribute('data-fare', fare);
    fareSummary.setAttribute('data-distance', distanceKm.toFixed(2));
    fareSummary.setAttribute('data-duration', durationMin.toFixed(0));
  });
});

document.getElementById('payNow').addEventListener('click', async function () {
  // ---------- Refresh Button ----------
const refreshBtn = document.getElementById('refreshBtn');
refreshBtn.addEventListener('click', () => {
  location.reload();
});
  const spinner = document.getElementById('loadingSpinner');
  spinner.style.display = 'block'; // show spinner

  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;
  const pickup = document.getElementById('pickup').value;
  const dropoff = document.getElementById('dropoff').value;
  const pickupTime = document.getElementById('pickupTime').value;
  const vehicleType = document.getElementById('vehicleType').value;
  const notes = document.getElementById('notes').value;

  const fareSummary = document.getElementById('fareSummary');
  const fare = fareSummary.getAttribute('data-fare');
  const distanceKm = fareSummary.getAttribute('data-distance');
  const durationMin = fareSummary.getAttribute('data-duration');

  if (!name || !phone || !email || !pickup || !dropoff || !pickupTime || !vehicleType || !fare) {
    spinner.style.display = 'none'; // hide spinner if validation fails
    alert('Please fill out all details and calculate fare before proceeding.');
    return;
  }

  const totalFare = parseFloat(fare);

  const bookingData = {
    name,
    phone,
    email,
    pickup,
    dropoff,
    datetime: pickupTime,
    vehicleType,
    totalFare,
    distanceKm,
    durationMin,
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
      spinner.style.display = 'none';
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Something went wrong. Please try again.');
    spinner.style.display = 'none';
  }
});
