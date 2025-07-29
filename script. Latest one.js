let pickupInput = document.getElementById('pickup');
let dropoffInput = document.getElementById('dropoff');
let fareDisplay = document.getElementById('fareDisplay');
let payNowButton = document.getElementById('payNow');

let pickupPlace = '';
let dropoffPlace = '';
let calculatedFare = 0;

// Init Google Places Autocomplete
function initAutocomplete() {
  new google.maps.places.Autocomplete(pickupInput);
  new google.maps.places.Autocomplete(dropoffInput);
}

window.onload = initAutocomplete;

payNowButton.addEventListener('click', async () => {
  const name = document.querySelector('input[name="name"]').value.trim();
  const email = document.querySelector('input[name="email"]').value.trim();
  const phone = document.querySelector('input[name="phone"]').value.trim();
  const vehicleType = document.getElementById('vehicleType').value;
  const pickup = pickupInput.value.trim();
  const dropoff = dropoffInput.value.trim();
  const datetime = document.getElementById('pickupTime').value;

  if (!name || !email || !phone || !pickup || !dropoff || !datetime || !vehicleType) {
    alert('Please complete all required fields.');
    return;
  }

  try {
    const distanceResult = await calculateDistance(pickup, dropoff);
    if (!distanceResult) {
      alert('Could not calculate distance.');
      return;
    }

    const distanceKm = distanceResult.distance;
    const isAirportPickup = /airport/i.test(pickup);
    const isEarlyLate = checkEarlyLate(datetime);
    const pricing = calculatePricing(vehicleType, distanceKm, isAirportPickup, isEarlyLate);

    calculatedFare = pricing.total;
    fareDisplay.textContent = `Estimated Fare: $${calculatedFare.toFixed(2)}`;

    // Send to server for Stripe payment
    const response = await fetch('/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        pickup,
        dropoff,
        datetime,
        vehicleType,
        totalFare: calculatedFare
      })
    });

    const session = await response.json();
    if (session.id) {
      window.location.href = session.url;
    } else {
      alert('Payment session could not be created.');
    }

  } catch (error) {
    console.error('Error:', error);
    alert('Something went wrong.');
  }
});

function checkEarlyLate(datetime) {
  const time = new Date(datetime).getHours();
  return (time < 5 || time >= 22);
}

function calculatePricing(vehicleType, distance, isAirport, isEarlyLate) {
  let baseFare = 0;

  const tiers = {
    business: [
      { max: 6, fare: 124 },
      { max: 20, fare: 188 },
      { max: 40, fare: 250 },
      { max: 60, fare: 310 },
      { max: 80, fare: 370 },
      { max: 100, fare: 450 }
    ],
    suv: [
      { max: 6, fare: 184 },
      { max: 20, fare: 250 },
      { max: 40, fare: 320 },
      { max: 60, fare: 390 },
      { max: 80, fare: 460 },
      { max: 100, fare: 540 }
    ],
    first: [
      { max: 6, fare: 220 },
      { max: 20, fare: 300 },
      { max: 40, fare: 380 },
      { max: 60, fare: 450 },
      { max: 80, fare: 520 },
      { max: 100, fare: 600 }
    ]
  };

  const selectedTier = tiers[vehicleType];
  for (let tier of selectedTier) {
    if (distance <= tier.max) {
      baseFare = tier.fare;
      break;
    }
  }

  if (distance > 100) baseFare = 0; // Requires manual quote

  const airportFee = isAirport ? 14 : 0;
  const earlyLateFee = isEarlyLate ? 30 : 0;
  const total = baseFare + airportFee + earlyLateFee;

  return { baseFare, airportFee, earlyLateFee, total };
}

async function calculateDistance(origin, destination) {
  const service = new google.maps.DistanceMatrixService();

  return new Promise((resolve, reject) => {
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC
      },
      (response, status) => {
        if (status !== "OK") {
          console.error("Distance Matrix failed:", status);
          reject(null);
        } else {
          const element = response.rows[0].elements[0];
          if (element.status === "OK") {
            const distanceText = element.distance.text;
            const distanceKm = parseFloat(distanceText.replace(" km", ""));
            resolve({ distance: distanceKm });
          } else {
            console.error("No result for route.");
            reject(null);
          }
        }
      }
    );
  });
}
      
    
  


