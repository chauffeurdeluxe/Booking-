
function initAutocomplete() {
  const pickup = new google.maps.places.Autocomplete(document.getElementById('pickup'));
  const dropoff = new google.maps.places.Autocomplete(document.getElementById('dropoff'));
}

window.onload = initAutocomplete;

document.getElementById('payNow').addEventListener('click', () => {
  alert('In production version, this will calculate distance and redirect to Stripe.');
});
