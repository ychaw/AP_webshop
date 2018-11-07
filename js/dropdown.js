function toggleDropdown() {
  document.getElementById("navDropdown").classList.toggle("show");
}

window.onclick = function(event) {
  if (!event.target.matches('.nav-menu-button')) {
    var dropdowns = document.getElementsByClassName("navigation");
    var i;
    for ( i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}
