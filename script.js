document.querySelectorAll("#current_info > input").forEach((elem) => {
	elem.addEventListener("keyup", (e) => {
		e.preventDefault();
		console.log(e, e.keyCode);
		if (match(e, "ArrowRight", 39) || match(e, "ArrowDown", 40)) {
			elem.nextElementSibling?.focus();
		} else if (match(e, "ArrowLeft", 37) || match(e, "ArrowUp", 38)) {
			elem.previousElementSibling?.focus();
		} else if (match(e, "Backspace", 8)) {
			elem.previousElementSibling?.focus();
			if (elem.value != "") elem.value = "";
		} else {
			elem.value = e.key;
			elem.nextElementSibling?.focus();
		}
	});
});

function match(event, code, keycode) {
	return (
		event.code == code || event.key == code || event.keyCode == keycode || event.which == keycode
	);
}
