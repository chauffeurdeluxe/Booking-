
document.getElementById('booking-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const fareDetails = document.getElementById('fare-details');
  fareDetails.innerHTML = '<p>Fare: $250 (example fare)</p><p>Redirecting to payment...</p>';
  setTimeout(() => {
    window.location.href = 'https://wa.me/61402256915';
  }, 3000);
});
