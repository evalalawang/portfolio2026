const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const paper = document.getElementById('paper');
const centerSquare = document.getElementById('center-square'); // Center square element

let model;
let isHoldingPaper = false; // Tracks if the paper is attached to the hands
let alertTriggered = false; // Prevents repeated alerts
let paperPosition = { x: 0, y: 0, width: 150, height: 150 }; // Current paper position and size
let targetPosition = { x: 0, y: 0, width: 150, height: 150 }; // Target position for smoothing
const smoothFactor = 0.1; // Factor for smoothing (lower = smoother)

// Set up canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load the Handtrack.js model
const modelParams = {
  flipHorizontal: true, // Flip video horizontally
  maxNumBoxes: 2, // Track up to 2 hands
  iouThreshold: 0.5,
  scoreThreshold: 0.7, // Confidence threshold
};

handTrack.load(modelParams).then((loadedModel) => {
  model = loadedModel;
  handTrack.startVideo(video).then((status) => {
    if (status) {
      detectHands();
    } else {
      alert("Please enable video access");
    }
  });
});

// Detect hands and track interaction
function detectHands() {
  model.detect(video).then((predictions) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    model.renderPredictions(predictions, canvas, ctx, video);

    if (predictions.length === 2) {
      const hand1 = predictions[0].bbox;
      const hand2 = predictions[1].bbox;

      const center1 = { x: hand1[0] + hand1[2] / 2, y: hand1[1] + hand1[3] / 2, width: hand1[2], height: hand1[3] };
      const center2 = { x: hand2[0] + hand2[2] / 2, y: hand2[1] + hand2[3] / 2, width: hand2[2], height: hand2[3] };

      if (isHandsAligned(center1, center2)) {
        if (!isHoldingPaper) {
          attachPaperToHands(center1, center2);
        }
      }

      if (isHoldingPaper) {
        updatePaperTargetPosition(center1, center2);
      }
    }

    requestAnimationFrame(detectHands);
  });
}

// Check if hands are aligned
function isHandsAligned(center1, center2) {
  const distance = Math.hypot(center1.x - center2.x, center1.y - center2.y);
  return distance > 100 && distance < 300; // Adjust thresholds as needed
}

// Attach the paper to hands
function attachPaperToHands(center1, center2) {
  isHoldingPaper = true;

  targetPosition.x = (center1.x + center2.x) / 2;
  targetPosition.y = (center1.y + center2.y) / 2;

  updatePaperElement();
}

// Update the target position and scale of the paper
function updatePaperTargetPosition(center1, center2) {
  const videoHeight = video.videoHeight;

  // Calculate the average height of both hands
  const avgHandHeight = (center1.height + center2.height) / 2;

  // Calculate the scale (interpolating between 20% and 90% of webcam height)
  const minHeightPercent = 0.2; // 20%
  const maxHeightPercent = 0.9; // 90%
  const minPaperSize = 150; // Paper size at 20% hand height
  const maxPaperSize = 700; // Paper size at 90% hand height

  // Map hand height percentage to paper size
  const handHeightPercent = avgHandHeight / videoHeight;
  let paperSize;
  if (handHeightPercent <= minHeightPercent) {
    paperSize = minPaperSize;
  } else if (handHeightPercent >= maxHeightPercent) {
    paperSize = maxPaperSize;
  } else {
    // Interpolate between 150px and 500px
    const scale = (handHeightPercent - minHeightPercent) / (maxHeightPercent - minHeightPercent);
    paperSize = minPaperSize + scale * (maxPaperSize - minPaperSize);
  }

  // Update target position and size
  const videoWidth = video.videoWidth;
  const scaleX = window.innerWidth / videoWidth;
  const scaleY = window.innerHeight / videoHeight;

  targetPosition.x = (center1.x + center2.x) / 2 * scaleX - paperSize / 2;
  targetPosition.y = (center1.y + center2.y) / 2 * scaleY - paperSize / 2;
  targetPosition.width = paperSize;
  targetPosition.height = paperSize;

  smoothPaperPosition();

  // Check if the paper fully covers the center square
  const squareBounds = centerSquare.getBoundingClientRect();
  const paperBounds = paper.getBoundingClientRect();

  if (
    paperBounds.left <= squareBounds.left &&
    paperBounds.right >= squareBounds.right &&
    paperBounds.top <= squareBounds.top &&
    paperBounds.bottom >= squareBounds.bottom
  ) {
    if (!alertTriggered) {
      alert("蛇年大吉 & Happy Year of the Snake!");
      alertTriggered = true; // Trigger alert only once

      // Add the shadow and border effects
      paper.style.boxShadow = "0px 0px 80px rgba(255, 255, 255, 0.70)";
      paper.style.border = "4px solid #fff";

      // Animate shadow appearance and disappearance
      paper.style.animation = "shadowPulse 2s infinite alternate";
    }
  } else {
    alertTriggered = false; // Reset if paper no longer fully covers the square

    // Remove the shadow and border effects
    paper.style.boxShadow = "none";
    paper.style.border = "none";
    paper.style.animation = "none";
  }
}

// Smooth the paper's movement and scaling
function smoothPaperPosition() {
  paperPosition.x += smoothFactor * (targetPosition.x - paperPosition.x);
  paperPosition.y += smoothFactor * (targetPosition.y - paperPosition.y);
  paperPosition.width += smoothFactor * (targetPosition.width - paperPosition.width);
  paperPosition.height += smoothFactor * (targetPosition.height - paperPosition.height);

  updatePaperElement();
}

// Update the paper element's style
function updatePaperElement() {
  paper.style.left = `${Math.max(0, Math.min(window.innerWidth - paperPosition.width, paperPosition.x))}px`;
  paper.style.top = `${Math.max(0, Math.min(window.innerHeight - paperPosition.height, paperPosition.y))}px`;
  paper.style.width = `${paperPosition.width}px`;
  paper.style.height = `${paperPosition.height}px`;
}

// Release the paper
function releasePaper() {
  isHoldingPaper = false;
  alertTriggered = false; // Reset alert flag when paper is released
}
