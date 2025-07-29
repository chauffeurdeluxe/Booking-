let autocompletePickup, autocompleteDropoff;

function initAutocomplete() {
  const options = { componentRestrictions: { country: 'au' }, fields: ['formatted_address', 'geometry'] };
  autocompletePickup = new google.maps.places.Autocomplete(document.getElementById('pickup'), options);
  autocompleteDropoff = new google.maps.places.Autocomplete(document.getElementById('dropoff'), options);
}

document.getElementById("pay-now").addEventListener("click", async () => {
  const pickup = document.getElementById("pickup").value;
  const dropoff = document.getElementById("dropoff").value;
  const vehicle = document.getElementById("vehicle-type").value;

  if (!pickup || !dropoff) return alert("Please fill out pickup and dropoff locations.");

  const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(pickup)}&destinations=${encodeURIComponent(dropoff)}&key=AIzaSyD7RaWa6dXSoDxXq3DWfeuwHuD-TmI2I9U`);
  
  const fare = 200; // Placeholder until distance response is added
  document.getElementById("fare-display").innerText = "Estimated Fare: $" + fare;

  const stripeResponse = await fetch("/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickup, dropoff, vehicle, fare })
  });
  const session = await stripeResponse.json();
  window.location.href = session.url;
});