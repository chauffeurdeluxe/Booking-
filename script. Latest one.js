
// Global latest fare
let latestFare = 0;
let pickupAutocomplete, dropoffAutocomplete;

// Initialize Google Places Autocomplete
function initAutocomplete() {
  const options = {
    componentRestrictions: { country: 'au' },
    fields: ['formatted_address', 'geometry'],
  };

  pickupAutocomplete = new google.maps.places.Autocomplete(document.getElementById("pickup"), options);
  dropoffAutocomplete = new google.maps.places.Autocomplete(document.getElementById("dropoff"), options);

  pickupAutocomplete.addListener('place_changed', calculateFare);
  dropoffAutocomplete.addListener('place_changed', calculateFare);
}

// Calculate fare function
function calculateFare() {
  const pickup = document.getElementById("pickup").value.trim();
  const dropoff = document.getElementById("dropoff").value.trim();
  const vehicleClass = document.getElementById("vehicleClass").value;
  const pickupTime = document.getElementById("pickupTime").value;

  if (!pickup || !dropoff || !vehicleClass) {
    latestFare = 0;
    document.getElementById("fareDisplay").textContent = "Estimated Fare: $0.00";
    alert("Please fill Pickup Location, Dropoff Location, and Vehicle Class before calculating fare.");
    return;
  }

  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix({
    origins: [pickup],
    destinations: [dropoff],
    travelMode: 'DRIVING',
    drivingOptions: {
      departureTime: new Date(),
      trafficModel: 'bestguess'
    },
    unitSystem: google.maps.UnitSystem.METRIC,
  }, (response, status) => {
    if (status !== "OK") {
      console.error("Distance Matrix service error:", status);
      document.getElementById("fareDisplay").textContent = "Error calculating fare.";
      latestFare = 0;
      return;
    }

    const element = response.rows[0].elements[0];
    if (element.status !== "OK") {
      console.error("Distance Matrix element error:", element.status);
      document.getElementById("fareDisplay").textContent = "Error calculating fare.";
      latestFare = 0;
      return;
    }

    const distanceKm = element.distance.value / 1000;

    // Pricing tiers as per your rates
    const pricingTable = {
      business: [124, 188, 250, 310, 370, 450],
      van:      [184, 250, 320, 390, 460, 540],
      first:    [220, 300, 380, 450, 520, 600]
    };
    const distanceTiers = [6, 20, 40, 60, 80, 100];

    let fare = 0;
    const prices = pricingTable[vehicleClass];
    for (let i = 0; i < distanceTiers.length; i++) {
      if (distanceKm <= distanceTiers[i]) {
        fare = prices[i];
        break;
      }
    }

    if (distanceKm > 100) {
      document.getElementById("fareDisplay").textContent = "Contact us for a custom quote.";
      latestFare = 0;
      return;
    }

    // Airport parking fee
    const airportRegex = /airport/i;
    const pickupLocation = document.getElementById("pickup").value;
    const dropoffLocation = document.getElementById("dropoff").value;
    const parkingFee = airportRegex.test(pickupLocation) || airportRegex.test(dropoffLocation) ? 14 : 0;

    // Early/late fee
    let earlyLateFee = 0;
    if (pickupTime) {
      const hour = parseInt(pickupTime.split(":")[0], 10);
      if (hour < 6 || hour >= 22) earlyLateFee = 30;
    }

    const totalFare = fare + parkingFee + earlyLateFee;
    latestFare = totalFare;

    document.getElementById("fareDisplay").textContent = `Estimated Fare: $${totalFare.toFixed(2)}`;
  });
}

// Stripe payment button handler
document.getElementById("payNowBtn").addEventListener("click", async () => {
  if (!latestFare || latestFare <= 0) {
    alert("Please calculate the fare before proceeding to payment.");
    return;
  }

  // Validate essential fields are filled before payment
  const requiredFields = ["name", "email", "phone", "pickup", "dropoff", "pickupDate", "pickupTime", "vehicleClass"];
  for (const id of requiredFields) {
    const val = document.getElementById(id).value.trim();
    if (!val) {
      alert(`Please fill the "${id}" field before proceeding.`);
      return;
    }
  }

  const amountInCents = Math.round(latestFare * 100);

  try {
    const response = await fetch('https://server-qdh1.onrender.com/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountInCents }),
    });

    if (!response.ok) throw new Error("Payment server connection failed.");

    const session = await response.json();

    if (session.id) {
      const stripe = Stripe('pk_test_51RekxBAc65pROHTAjbmaqX0wL5TLUVaAOQe59PEgdTPBf2DIe1PNpGlm8LJl8mGThvXBrsI4OptShqGhcwyrVV3700XS1XJGck');
      const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
      if (error) {
        console.error("Stripe checkout error:", error);
        alert("Payment redirect failed. Please try again.");
      }
    } else {
      alert("Failed to create payment session.");
    }
  } catch (error) {
    console.error("Payment error:", error);
    alert("Payment failed. Please try again.");
  }
});

// Calculate fare button handler
document.getElementById("calculateFareBtn").addEventListener("click", calculateFare);

// Init Google Autocomplete after page load
window.onload = initAutocomplete;
  
                                              
