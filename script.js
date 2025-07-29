
function initAutocomplete() {
  const pickupInput = document.getElementById('pickup');
  const dropoffInput = document.getElementById('dropoff');

  new google.maps.places.Autocomplete(pickupInput, { componentRestrictions: { country: 'au' } });
  new google.maps.places.Autocomplete(dropoffInput, { componentRestrictions: { country: 'au' } });
}

document.getElementById('payNow').addEventListener('click', async function () {
  const name = document.querySelector('input[name="name"]').value;
  const email = document.querySelector('input[name="email"]').value;
  const phone = document.querySelector('input[name="phone"]').value;
  const vehicleType = document.getElementById('vehicleType').value;
  const pickup = document.getElementById('pickup').value;
  const dropoff = document.getElementById('dropoff').value;
  const pickupTime = document.getElementById('pickupTime').value;
  const notes = document.querySelector('textarea[name="notes"]').value;

  if (!name || !email || !phone || !vehicleType || !pickup || !dropoff || !pickupTime) {
    alert('Please fill in all required fields.');
    return;
  }

  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix({
    origins: [pickup],
    destinations: [dropoff],
    travelMode: 'DRIVING',
    unitSystem: google.maps.UnitSystem.METRIC,
  }, async function (response, status) {
    if (status !== 'OK') return alert('Distance error: ' + status);
    const distanceText = response.rows[0].elements[0].distance.text;
    const distanceInKm = parseFloat(distanceText.replace(' km', '').replace(',', ''));
    let fare = 0;

    if (vehicleType === 'business') {
      if (distanceInKm <= 6) fare = 124;
      else if (distanceInKm <= 20) fare = 188;
      else if (distanceInKm <= 40) fare = 250;
      else if (distanceInKm <= 60) fare = 310;
      else if (distanceInKm <= 80) fare = 370;
      else if (distanceInKm <= 100) fare = 450;
      else return alert('Distance exceeds 100 km. Contact for a custom quote.');
    } else if (vehicleType === 'suv') {
      if (distanceInKm <= 6) fare = 184;
      else if (distanceInKm <= 20) fare = 250;
      else if (distanceInKm <= 40) fare = 320;
      else if (distanceInKm <= 60) fare = 390;
      else if (distanceInKm <= 80) fare = 460;
      else if (distanceInKm <= 100) fare = 540;
      else return alert('Distance exceeds 100 km. Contact for a custom quote.');
    } else if (vehicleType === 'first') {
      if (distanceInKm <= 6) fare = 220;
      else if (distanceInKm <= 20) fare = 300;
      else if (distanceInKm <= 40) fare = 380;
      else if (distanceInKm <= 60) fare = 450;
      else if (distanceInKm <= 80) fare = 520;
      else if (distanceInKm <= 100) fare = 600;
      else return alert('Distance exceeds 100 km. Contact for a custom quote.');
    }

    const hour = new Date(pickupTime).getHours();
    if (hour < 5 || hour >= 22) fare += 30;
    if (pickup.toLowerCase().includes("airport")) fare += 14;

    document.getElementById('fareDisplay').innerText = `Estimated Fare: $${fare}`;

    const res = await fetch('/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, vehicleType, pickup, dropoff, pickupTime, notes, amount: fare })
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert('Stripe session error.');
  });
});
