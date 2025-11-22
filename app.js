const form = document.getElementById("form");
const status = document.getElementById("status");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.innerHTML = "Processing...";

    const data = new FormData(form);
    try {
        const res = await fetch("/api/process", {
            method: "POST",
            body: data
        });

        if (!res.ok) {
            const t = await res.json();
            return status.innerHTML = "❌ " + t.error;
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "result.zip";
        a.click();

        status.innerHTML = "✔ Done! ZIP downloaded.";
    }
    catch (err) {
        status.innerHTML = "❌ Server error!";
    }
});