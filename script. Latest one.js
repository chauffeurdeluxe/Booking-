
// Global fare variable
let latestFare = 0;

// Google Maps Autocomplete instances
let pickupAutocomplete, dropoffAutocomplete;

// Initialize Google Places Autocomplete for pickup and dropoff inputs
function initAutocomplete() {
  const options = {
    componentRestrictions: { country: 'au' }, // Restrict to Australia
    fields: ['formatted_address', 'geometry'],
  };

  const pickupInput = document.getElementById("pickup");
  const dropoffInput = document.getElementById("dropoff");

  pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
  dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput, options);

  // Recalculate fare whenever a place is selected in either input
  pickupAutocomplete.addListener('place_changed', calculateFare);
  dropoffAutocomplete.addListener('place_changed', calculateFare);
}

// Core function: calculate distance via Google Distance Matrix and determine fare
function calculateFare() {
  const pickup = document.getElementById("pickup").value.trim();
  const dropoff = document.getElementById("dropoff").value.trim();
  const vehicleClass = document.getElementById("vehicleClass").value;
  const pickupTime = document.getElementById("pickupTime").value;

  // Validate required fields before calculating
  if (!pickup || !dropoff || !vehicleClass) {
    document.getElementById("fareDisplay").textContent = "Estimated Fare: $0";
    latestFare = 0;
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
    unitSystem: google.maps.UnitSystem.METRIC
  }, (response, status) => {
    if (status !== 'OK') {
      console.error('DistanceMatrixService error:', status);
      document.getElementById("fareDisplay").textContent = "Error calculating fare";
      latestFare = 0;
      return;
    }

    const element = response.rows[0].elements[0];

    if (element.status !== 'OK') {
      console.error('Distance Matrix element error:', element.status);
      document.getElementById("fareDisplay").textContent = "Error calculating fare";
      latestFare = 0;
      return;
    }

    // Distance in KM (meters to KM)
    const distanceKm = element.distance.value / 1000;

    // Tiered pricing tables by vehicle class
    const pricingTable = {
      business:   [124, 188, 250, 310, 370, 450],
      van:        [184, 250, 320, 390, 460, 540],
      first:      [220, 300, 380, 450, 520, 600]
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
      // Trips over 100 km require custom quote
      document.getElementById("fareDisplay").textContent = "Contact us for a custom quote.";
      latestFare = 0;
      return;
    }

    // Add $14 airport parking fee if pickup or dropoff includes "airport"
    const airportRegex = /airport/i;
    const parkingFee = (airportRegex.test(pickup) || airportRegex.test(dropoff)) ? 14 : 0;

    // Add $30 early/late fee if pickup time is before 6 AM or after 10 PM
    let earlyLateFee = 0;
    if (pickupTime) {
      // Create Date object just to get the hour from the time string
      const timeParts = pickupTime.split(":");
      const hour = parseInt(timeParts[0], 10);
      if (hour < 6 || hour >= 22) {
        earlyLateFee = 30;
      }
    }

    const totalFare = fare + parkingFee + earlyLateFee;
    latestFare = totalFare;

    document.getElementById("fareDisplay").textContent = `Estimated Fare: $${totalFare.toFixed(2)}`;
  });
}

// Attach event listeners to recalculate fare when vehicle class or pickup time changes
document.getElementById("vehicleClass").addEventListener("change", calculateFare);
document.getElementById("pickupTime").addEventListener("change", calculateFare);

// Stripe payment button handler
document.getElementById("payNowBtn").addEventListener("click", async (event) => {
  event.preventDefault();

  if (!latestFare || latestFare <= 0) {
    alert("Please calculate fare before proceeding to payment.");
    return;
  }

  const amountInCents = Math.round(latestFare * 100);

  try {
    // Call backend to create Stripe checkout session with dynamic amount
    const response = await fetch('https://server-qdh1.onrender.com/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountInCents }),
    });

    if (!response.ok) throw new Error("Failed to connect to payment server.");

    const session = await response.json();

    if (session.id) {
      const stripe = Stripe('pk_test_51RekxBAc65pROHTAjbmaqX0wL5TLUVaAOQe59PEgdTPBf2DIe1PNpGlm8LJl8mGThvXBrsI4OptShqGhcwyrVV3700XS1XJGck');
      const { error } = await stripe.redirectToCheckout({ sessionId: session.id });

      if (error) {
        console.error('Stripe redirect error:', error);
        alert("Payment redirect failed. Please try again.");
      }
    } else {
      alert("Payment session could not be created.");
    }
  } catch (error) {
    console.error("Payment error:", error);
    alert("Payment failed. Please try again.");
  }
});

// Initialize Google Places Autocomplete on window load
window.onload = initAutocomplete;
  
                                              
