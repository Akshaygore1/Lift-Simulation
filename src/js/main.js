const setupForm = document.getElementById("setup-form");
const simulationDiv = document.getElementById("simulation");
const simulationForm = document.getElementById("simulation-form");
const buildingDiv = document.querySelector(".building");
const floorsDiv = document.querySelector(".floors");
const liftShaftsDiv = document.querySelector(".lift-shafts");

const state = {
  floors: 0,
  lifts: [],
  liftCalls: [],
};

// setup from form
simulationForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.floors = parseInt(document.getElementById("floors").value);
  const liftCount = parseInt(document.getElementById("lifts").value);

  setupForm.style.display = "none";
  simulationDiv.style.display = "flex";
  createSimulation(state.floors, liftCount);
});

/**
 * Create the simulation
 * @param {number} floorCount
 * @param {number} liftCount
 */
function createSimulation(floorCount, liftCount) {
  floorsDiv.innerHTML = "";
  for (let i = 0; i <= floorCount; i++) {
    const floorDiv = document.createElement("div");
    floorDiv.className = "floor";
    floorDiv.innerHTML = `
      <span class="floor-number">${i === 0 ? "G" : i}</span>
      <div class="floor-buttons">

        ${
          i !== floorCount
            ? `<button class="floor-btn up" data-floor="${i}" data-direction="up">▲</button>`
            : ""
        }
        ${
          i !== 0
            ? `<button class="floor-btn down" data-floor="${i}" data-direction="down">▼</button>`
            : ""
        }
      </div>
    `;
    floorsDiv.appendChild(floorDiv);
  }

  liftShaftsDiv.innerHTML = "";
  for (let i = 0; i < liftCount; i++) {
    const liftShaftDiv = document.createElement("div");
    liftShaftDiv.className = "lift-shaft";

    const liftDiv = document.createElement("div");
    liftDiv.className = "lift";
    liftDiv.style.bottom = "0px";
    liftDiv.innerHTML = `
            <div class="lift-doors">
                <div class="lift-door left"></div>
                <div class="lift-door right"></div>
            </div>
        `;
    liftShaftDiv.appendChild(liftDiv);
    liftShaftsDiv.appendChild(liftShaftDiv);

    state.lifts.push({
      element: liftDiv,
      currentFloor: 0,
      targetFloors: [],
      isMoving: false,
    });
  }

  buildingDiv.style.height = `${(floorCount + 1) * 100}px`;

  document.querySelectorAll(".floor-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const floor = parseInt(button.getAttribute("data-floor"));
      const direction = button.getAttribute("data-direction");
      callLift(floor, direction);
      button.classList.add("active");
    });
  });
}

/**
 * Call a lift to a specific floor
 * @param {number} targetFloor
 * @param {string} direction
 */
function callLift(targetFloor, direction) {
  const call = { floor: targetFloor, direction: direction };
  if (
    !state.liftCalls.some(
      (c) => c.floor === call.floor && c.direction === call.direction
    )
  ) {
    state.liftCalls.push(call);
    console.log("-- Lift call added", JSON.stringify(state.liftCalls));
    processLiftCalls();
  }
}

/**
 * Process the lift calls
 */
function processLiftCalls() {
  if (state.liftCalls.length === 0) return;

  const availableLift = findNearestAvailableLift(state.liftCalls[0].floor);

  if (availableLift !== -1) {
    const call = state.liftCalls.shift();
    moveLift(availableLift, call.floor);
  }
}

/**
 * Find the nearest available lift
 * @param {number} targetFloor
 * @returns {number} lift index
 */
function findNearestAvailableLift(targetFloor) {
  let nearestLift = -1;
  let minDistance = Infinity;

  for (let i = 0; i < state.lifts.length; i++) {
    const lift = state.lifts[i];
    if (!lift.isMoving) {
      const distance = Math.abs(lift.currentFloor - targetFloor);
      if (distance < minDistance) {
        minDistance = distance;
        nearestLift = i;
      }
    }
  }

  return nearestLift;
}

/**
 * Move a lift to a specific floor
 * @param {number} liftIndex
 * @param {number} targetFloor
 */
function moveLift(liftIndex, targetFloor) {
  const lift = state.lifts[liftIndex];
  lift.isMoving = true;
  lift.targetFloors.push(targetFloor);

  function moveToNextFloor() {
    if (lift.targetFloors.length === 0) {
      lift.isMoving = false;
      processLiftCalls();
      return;
    }

    const nextFloor = lift.targetFloors[0];
    const distance = Math.abs(lift.currentFloor - nextFloor);
    const duration = distance * 500;

    animateLiftMovement(lift, nextFloor, duration, () => {
      openDoors(lift, () => {
        setTimeout(() => {
          closeDoors(lift, () => {
            lift.targetFloors.shift();
            const floorBtns = document.querySelectorAll(
              `.floor-btn[data-floor="${nextFloor}"]`
            );
            floorBtns.forEach((btn) => btn.classList.remove("active"));
            moveToNextFloor();
          });
        }, 2500);
      });
    });
  }

  moveToNextFloor();
}

/**
 * Animate the lift movement
 * @param {object} lift
 * @param {number} targetFloor
 * @param {number} duration
 * @param {function} callback
 */
function animateLiftMovement(lift, targetFloor, duration, callback) {
  const startPosition = lift.currentFloor * 100;
  const endPosition = targetFloor * 100;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentPosition =
      startPosition + (endPosition - startPosition) * progress;

    lift.element.style.bottom = `${currentPosition}px`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      lift.currentFloor = targetFloor;
      callback();
    }
  }

  requestAnimationFrame(animate);
}

/**
 * Open the lift doors
 * @param {object} lift
 * @param {function} callback
 */
function openDoors(lift, callback) {
  const leftDoor = lift.element.querySelector(".lift-door.left");
  const rightDoor = lift.element.querySelector(".lift-door.right");

  leftDoor.classList.add("open");
  rightDoor.classList.add("open");

  setTimeout(callback, 1500);
}

/**
 * Close the lift doors
 * @param {object} lift
 * @param {function} callback
 */
function closeDoors(lift, callback) {
  const leftDoor = lift.element.querySelector(".lift-door.left");
  const rightDoor = lift.element.querySelector(".lift-door.right");

  leftDoor.classList.remove("open");
  rightDoor.classList.remove("open");

  setTimeout(callback, 1500);
}
