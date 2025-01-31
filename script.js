const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const captureButton = document.getElementById('capture');
const statusText = document.getElementById('status');

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => {
        console.log("Camera error: ", error);
    });

async function loadModel() {
    console.log("Loading MobileNet model...");
    return await mobilenet.load();
}

let model;
loadModel().then(loadedModel => {
    model = loadedModel;
    console.log("Model loaded!");
});

video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
};

captureButton.addEventListener('click', async () => {
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (!model) {
        statusText.innerText = "Model not loaded yet...";
        return;
    }

    const imageTensor = tf.browser.fromPixels(canvas);
    const predictions = await model.classify(imageTensor);

    let greenObjectDetected = predictions.some(prediction =>
        prediction.className.toLowerCase().includes("leaf") ||
        prediction.className.toLowerCase().includes("plant") ||
        prediction.className.toLowerCase().includes("grass") ||
        prediction.className.toLowerCase().includes("vegetable") ||
        prediction.className.toLowerCase().includes("tree") ||
        prediction.className.toLowerCase().includes("basil") ||
        prediction.className.toLowerCase().includes("herb") ||
        prediction.className.toLowerCase().includes("foliage") ||
        prediction.className.toLowerCase().includes("nature")
    );

    if (!greenObjectDetected) {
        statusText.innerText = "Not Healthy 🍂";
        statusText.style.color = "red";
        return;
    }

    checkGreenObjectHealth(context);
});

function checkGreenObjectHealth(context) {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let greenCount = 0;
    let totalPixels = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];     
        const g = pixels[i + 1]; 
        const b = pixels[i + 2]; 

        if (g > r * 0.5 && g > b * 0.5 && g > 30) {  
            greenCount++;
        }
        else if (g > 100 && g > r * 0.8 && g > b * 0.8) {  
            greenCount++;
        }
        else if (g > r * 0.6 && g > b * 0.6 && g > 50) { 
            greenCount++;
        }
        else if (g > 50 && r < 50 && b < 50) {
            greenCount++;
        }
    }

    let greenRatio = greenCount / totalPixels;

    if (greenRatio > 0.005) {  
        statusText.innerText = "Healthy 🌿";
        statusText.style.color = "green";
    } else {
        statusText.innerText = "Not Healthy 🍂";
        statusText.style.color = "red";
    }
}
