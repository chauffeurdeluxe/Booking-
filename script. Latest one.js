const stripe = Stripe("pk_test_51RekxBAc65pROHTATqGZiySLEf35Hw2ybABap9g9NUR6aEn5FqPSjvRMQLRHilqU1do9sVTsyKHKvCQ8Pl0nHKbUF00ONgA02Y0");

let directionsService;
let tollsAmount = 0;

window.onload = () => {
  const pickupInput = document.getElementById("pickup");
  const dropoffInput = document.getElementById("dropoff");
  new google.maps.places.Autocomplete(pickupInput);
  new google.maps.places.Autocomplete(dropoffInput);

  directionsService = new google.maps.DirectionsService();

  document.getElementById("booking-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    await calculateAndPay();
  });
};

async function calculateAndPay() {
  const pickup = document.getElementById("pickup").value;
  const dropoff = document.getElementById("dropoff").value;
  const vehicleClass = document.getElementById("vehicleClass").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;

  if (!pickup || !dropoff || !vehicleClass || !date || !time) {
    alert("Please complete all fields.");
    return;
  }

  const pickupDateTime = new Date(`${date}T${time}`);
  const hour = pickupDateTime.getHours();
  const earlyLateFee = (hour < 6 || hour > 22) ? 30 : 0;

  const isAirportPickup = /airport/i.test(pickup);
  const airportParkingFee = isAirportPickup ? 14 : 0;

  try {
    const distanceData = await getDistance(pickup, dropoff);
    const distanceInKm = distanceData.distance.value / 1000;
    tollsAmount = distanceData.tolls || 0;

    let baseFare = 0;
    if (vehicleClass === "business") {
      baseFare = getTieredFare(distanceInKm, [124, 188, 250, 310, 370, 450]);
    } else if (vehicleClass === "van") {
      baseFare = getTieredFare(distanceInKm, [184, 250, 320, 390, 460, 540]);
    } else if (vehicleClass === "first") {
      baseFare = getTieredFare(distanceInKm, [220, 300, 380, 450, 520, 600]);
    }

    const totalFare = baseFare + earlyLateFee + airportParkingFee + tollsAmount;
    document.getElementById("fare").innerText = totalFare.toFixed(2);

    // Stripe Checkout
    const response = await fetch("https://server-qdh1.onrender.com/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(totalFare * 100) })
    });

    const session = await response.json();
    if (session.id) {
      stripe.redirectToCheckout({ sessionId: session.id });
    } else {
      alert("Stripe session creation failed.");
    }

  } catch (err) {
    console.error(err);
    alert("Failed to calculate fare or connect to payment.");
  }
}

function getTieredFare(km, tiers) {
  if (km <= 6) return tiers[0];
  if (km <= 20) return tiers[1];
  if (km <= 40) return tiers[2];
  if (km <= 60) return tiers[3];
  if (km <= 80) return tiers[4];
  if (km <= 100) return tiers[5];
  return 0; // 100+ km requires custom quote
}

async function getDistance(origin, destination) {
  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false
      },
      (result, status) => {
        if (status === "OK") {
          const leg = result.routes[0].legs[0];
          const distance = leg.distance;
          // NOTE: No official Google tolls API, placeholder
          resolve({ distance, tolls: 0 }); // Replace 0 with actual toll logic if available
        } else {
          reject("Directions request failed due to " + status);
        }
      }
    );
  });
}
