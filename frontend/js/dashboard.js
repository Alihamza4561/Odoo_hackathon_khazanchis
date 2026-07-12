document.querySelectorAll(".card, .action-card").forEach(item => {
    item.addEventListener("click", () => {
        item.style.transform = "scale(0.98)";
        setTimeout(() => {
            item.style.transform = "";
        }, 120);
    });
});