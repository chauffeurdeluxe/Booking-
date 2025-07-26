
let distanceInKm = 0;
let pickupAutocomplete, dropoffAutocomplete;
let latestFare = 0;

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

async function calculateDistanceAndFare() {
  const pickup = document.getElementById("pickup").value;
  const dropoff = document.getElementById("dropoff").value;
  const vehicleType = document.getElementById("vehicleType").value;

  if (!pickup || !dropoff || !vehicleType) return;

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
        distanceInKm = distanceValue;

        const fare = calculateTieredFare(distanceValue, vehicleType);
        latestFare = fare;
        document.getElementById("fareDisplay").textContent = `Estimated Fare: $${fare}`;
      } else {
        console.error('Distance Matrix element status:', element.status);
      }
    } else {
      console.error('Distance Matrix status:', status);
    }
  });
}

function calculateTieredFare(km, type) {
  const pricing = {
    business: [124, 188, 250, 310, 370, 450],
    suv: [184, 250, 320, 390, 460, 540],
    first: [220, 300, 380, 450, 520, 600]
  };

  const tiers = [6, 20, 40, 60, 80, 100];
  const rates = pricing[type] || [];

  for (let i = 0; i < tiers.length; i++) {
    if (km <= tiers[i]) return rates[i];
  }

  return "Custom Quote";
}

// Attach change listener
document.getElementById("vehicleType").addEventListener("change", calculateDistanceAndFare);

// Stripe payment flow
document.addEventListener("DOMContentLoaded", function () {
  const payBtn = document.getElementById("payNowBtn");

  if (payBtn) {
    payBtn.addEventListener("click", function (e) {
      e.preventDefault();

      if (typeof latestFare === "string") {
        alert("Please contact us for a custom quote.");
        return;
      }

      const form = document.querySelector("form");
      const formData = new FormData(form);

      // Pre-fill user input into Stripe metadata
      const bookingDetails = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        vehicle: formData.get("vehicleType"),
        pickup: formData.get("pickup"),
        dropoff: formData.get("dropoff"),
        datetime: formData.get("datetime"),
        notes: formData.get("notes")
      };

      fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: "Bearer YOUR_STRIPE_SECRET_KEY", // Replace in production
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          success_url: "https://bookingform-pi.vercel.app/success.html",
          cancel_url: "https://bookingform-pi.vercel.app",
          payment_method_types: ["card"],
          mode: "payment",
          line_items[0][price_data][currency]: "aud",
          line_items[0][price_data][product_data][name]: "Chauffeur Booking",
          line_items[0][price_data][product_data][description]: `Pickup: ${bookingDetails.pickup}, Dropoff: ${bookingDetails.dropoff}`,
          line_items[0][price_data][unit_amount]: Math.round(latestFare * 100), // in cents
          line_items[0][quantity]: 1,
          customer_email: bookingDetails.email,
          metadata[name]: bookingDetails.name,
          metadata[phone]: bookingDetails.phone,
          metadata[vehicle]: bookingDetails.vehicle,
          metadata[datetime]: bookingDetails.datetime,
          metadata[notes]: bookingDetails.notes
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.url) {
            window.location.href = data.url;
          } else {
            alert("Payment failed to initiate. Try again.");
            console.error(data);
          }
        })
        .catch(err => {
          alert("Payment error.");
          console.error(err);
        });
    });
  }
});
