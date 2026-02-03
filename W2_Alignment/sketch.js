let inputBox, button;
let speechText = "";
let generatedImg = null;
let generating = false;

function setup() {
  // Make canvas full width, with height scaled
  createCanvas(windowWidth, windowHeight - 100);
  background(0);

  // Style input box
  inputBox = createInput();
  inputBox.position(windowWidth / 2 - 150, windowHeight - 80);
  inputBox.size(300);

  // Style button
  button = createButton('Generate');
  button.position(windowWidth / 2 + 160, windowHeight - 80);
  button.mousePressed(generateFromInput);

  // Optional: style with CSS
  inputBox.style('font-size', '18px');
  inputBox.style('padding', '5px');
  button.style('font-size', '18px');
  button.style('padding', '6px 12px');
}

function draw() {
  background(0);

  // Display AI-generated image if available
  if (generatedImg) {
    // Scale image to fit width while leaving room for text
    let imgHeight = height - 100;
    let imgWidth = (generatedImg.width / generatedImg.height) * imgHeight;
    image(generatedImg, (width - imgWidth)/2, 0, imgWidth, imgHeight);
  }

  // Display typed text at bottom
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text(speechText, width / 2, height - 40);

  // Display loading indicator
  if (generating) {
    fill(200, 200, 0);
    textSize(20);
    text("Generating image...", width / 2, 30);
  }
}

// Called when user clicks "Generate"
function generateFromInput() {
  speechText = inputBox.value();

  if (speechText.length > 0 && !generating) {
    generating = true;
    generatedImg = null; // clear previous image
    generateImage(speechText);
  }
}

// Fetch AI image from professor's proxy
async function generateImage(prompt) {
  try {
    const response = await fetch('https://itp-ima-replicate-proxy.web.app/api/create_n_get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "black-forest-labs/flux-2-klein-4b",
        input: { prompt: prompt }
      })
    });

    const data = await response.json();
    console.log("Proxy Response:", data);

    if (data.output) {
      loadImage(data.output, img => {
        generatedImg = img;
        generating = false;
      });
    } else if (data.status && data.status === "processing") {
      console.log("Image still generating, retrying...");
      setTimeout(() => generateImage(prompt), 2000);
    } else {
      console.error("Unexpected response from proxy:", data);
      generating = false;
    }

  } catch (err) {
    console.error("Error fetching image:", err);
    generating = false;
  }
}

// Make canvas responsive on window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight - 100);
  // Reposition input and button
  inputBox.position(windowWidth / 2 - 150, windowHeight - 80);
  button.position(windowWidth / 2 + 160, windowHeight - 80);
}