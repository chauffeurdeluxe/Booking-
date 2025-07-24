
document.querySelector("form").addEventListener("submit", function(e) {
  e.preventDefault();
  const form = e.target;
  fetch(form.action, {
    method: form.method,
    body: new FormData(form),
    headers: {
      'Accept': 'application/json'
    }
  }).then(response => {
    if (response.ok) {
      form.style.display = "none";
      document.querySelector(".thank-you").style.display = "block";
    } else {
      alert("There was a problem submitting your form.");
    }
  }).catch(error => {
    alert("Error: " + error);
  });
});
