
 let latestFare = 0;
let pickupAutocomplete, dropoffAutocomplete;

function initMap() {
  const options = {
    componentRestrictions: { country: 'au' },
    fields: ['formatted_address', 'geometry'],
  };

  const pickupInput = document.getElementById("pickup");
  const dropoffInput = document.getElementById("dropoff");

  pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
  dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput, options);

  pickupAutocomplete.addListener('place_changed', calculateDistanceAndFare);
  dropoffAutocomplete.addListener('place_changed', calculateDistanceAndFare);
}

function calculateDistanceAndFare() {
  const pickup = document.getElementById("pickup").value;
  const dropoff = document.getElementById("dropoff").value;
  const vehicleType = document.getElementById("vehicleType").value;
  const datetimeValue = document.getElementById("datetime").value;

  if (!pickup || !dropoff || !vehicleType) {
    document.getElementById("fareDisplay").textContent = "Estimated Fare: $0";
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
    if (status === 'OK') {
      const element = response.rows[0].elements[0];

      if (element.status === 'OK') {
        const distanceValue = element.distance.value / 1000; // meters to KM

        // Tiered pricing logic
        let fare = 0;
        if (vehicleType === "business") {
          if (distanceValue <= 6) fare = 124;
          else if (distanceValue <= 20) fare = 188;
          else if (distanceValue <= 40) fare = 250;
          else if (distanceValue <= 60) fare = 310;
          else if (distanceValue <= 80) fare = 370;
          else if (distanceValue <= 100) fare = 450;
          else fare = 0;
        } else if (vehicleType === "suv") {
          if (distanceValue <= 6) fare = 184;
          else if (distanceValue <= 20) fare = 250;
          else if (distanceValue <= 40) fare = 320;
          else if (distanceValue <= 60) fare = 390;
          else if (distanceValue <= 80) fare = 460;
          else if (distanceValue <= 100) fare = 540;
          else fare = 0;
        } else if (vehicleType === "first") {
          if (distanceValue <= 6) fare = 220;
          else if (distanceValue <= 20) fare = 300;
          else if (distanceValue <= 40) fare = 380;
          else if (distanceValue <= 60) fare = 450;
          else if (distanceValue <= 80) fare = 520;
          else if (distanceValue <= 100) fare = 600;
          else fare = 0;
        }

        // Airport parking fee if pickup or dropoff contains "airport"
        const airportRegex = /airport/i;
        const parkingFee = airportRegex.test(pickup) || airportRegex.test(dropoff) ? 14 : 0;

        // Early/late surcharge before 6AM or after 10PM
        let earlyLateFee = 0;
        if (datetimeValue) {
          const selectedHour = new Date(datetimeValue).getHours();
          if (selectedHour < 6 || selectedHour >= 22) {
            earlyLateFee = 30;
          }
        }

        const totalFare = fare + parkingFee + earlyLateFee;
        latestFare = totalFare;

        document.getElementById("fareDisplay").textContent =
          totalFare > 0 ? `Estimated Fare: $${totalFare}` : "Contact us for a custom quote.";
      } else {
        console.error('Distance Matrix element status:', element.status);
        document.getElementById("fareDisplay").textContent = "Error calculating fare";
      }
    } else {
      console.error('Distance Matrix status:', status);
      document.getElementById("fareDisplay").textContent = "Error calculating fare";
    }
  });
}

// Event listeners for recalculating fare
document.getElementById("vehicleType").addEventListener("change", calculateDistanceAndFare);
document.getElementById("datetime").addEventListener("change", calculateDistanceAndFare);

// Stripe Payment Redirection using Stripe Checkout with dynamic amount
document.getElementById("payNowBtn").addEventListener("click", async function(event) {
  event.preventDefault();

  if (!latestFare || latestFare <= 0) {
    alert("Please fill all required fields and calculate fare before paying.");
    return;
  }

  // Convert fare to cents (Stripe expects amount in the smallest currency unit)
  const amountInCents = Math.round(latestFare * 100);

  try {
    // Call your backend to create a Stripe Checkout session
    // Replace with your actual backend URL that creates Stripe session with dynamic amount
    const response = await fetch('https://server-qdh1.onrender.com/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountInCents })
    });

    const session = await response.json();

    if (session.id) {
      // Use Stripe.js to redirect to the checkout page
      const stripe = Stripe('pk_test_51RekxBAc65pROHTAjbmaqX0wL5TLUVaAOQe59PEgdTPBf2DIe1PNpGlm8LJl8mGThvXBrsI4OptShqGhcwyrVV3700XS1XJGck); // Replace with your Stripe publishable key
      const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
      if (error) {
        console.error(error);
        alert("Payment redirect failed. Please try again.");
      }
    } else {
      alert("Failed to initiate payment. Please try again.");
    }
  } catch (error) {
    console.error("Error during payment process:", error);
    alert("Payment failed. Please try again.");
  }
});
                                              
