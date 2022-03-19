document.querySelectorAll("#current_info > input").forEach((elem) => {
	elem.addEventListener("keydown", (e) => {
		e.preventDefault();
		console.log(e, e.keyCode);
		if (
			match(e, "ArrowRight", 39) ||
			match(e, "ArrowDown", 40) ||
			(match(e, "Tab", 9) && !e.shiftKey)
		) {
			elem.nextElementSibling?.focus();
		} else if (
			match(e, "ArrowLeft", 37) ||
			match(e, "ArrowUp", 38) ||
			(match(e, "Tab", 9) && e.shiftKey)
		) {
			elem.previousElementSibling?.focus();
		} else if (match(e, "Backspace", 8)) {
			elem.previousElementSibling?.focus();
			if (elem.value != "") elem.value = "";
			FindGuess();
		} else if (e.key.toLowerCase().match(/^[a-z0-9\-]$/)) {
			if (elem.value == "") elem.value = e.key.toLowerCase();
			else if (elem.nextElementSibling) elem.nextElementSibling.value = e.key.toLowerCase();
			elem.nextElementSibling?.focus();
			FindGuess();
		}
	});
});

function match(event, code, keycode) {
	return (
		event.code == code || event.key == code || event.keyCode == keycode || event.which == keycode
	);
}

let wordlist = [];
fetch("words/dictonary.txt")
	.then((res) => res.text())
	.then((text) => text.replaceAll("\r", "").split("\n"))
	.then((words) => (wordlist = wordlist.concat(words)));

const FindGuess = () => {
	let value = RegExp(
		`^${[...document.querySelectorAll("#current_info > input")]
			.map((inp) => (inp.value ? inp.value : "."))
			.join("")}$`
	);
	document.getElementById("matched_words").innerHTML = "";
	matchedWords = wordlist
		.filter((word) => value.test(word))
		.map((word) => {
			// Convert String to Span
			let span = document.createElement("span");
			span.textContent = word;
			return span;
		})
		.slice(0, 100)
		.forEach((word) => document.getElementById("matched_words").appendChild(word));
	console.log(matchedWords);
};
