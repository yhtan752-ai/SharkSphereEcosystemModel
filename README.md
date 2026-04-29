# SharkSphereEcosystemModel

# SharksSphere: Maldives Ecosystem Simulation

**SharksSphere** is an interactive, web-based ecosystem model designed to teach students about marine biology, trophic cascades, and the impact of human decision-making on the ecosystem.

## Project Overview
This project simulates a real-world food chain in the Maldives, focusing on the survival of **Juvenile Blacktip Reef Sharks**. Users (students) interact with the simulation through live polls that trigger environmental changes, while an AI-powered Anomaly Detector monitors the stability of the ecosystem.

### Target Audience
* **Primary:** Students (Secondary/Polytechnic level)
* **Secondary:** Educators and Museum Visitors

---

## The Food Chain Model
The simulation logic is built upon the following biological relationships:

1. **Seagrass/Algae (Producer):** The energy base and nursery habitat.
2. **Zooplankton (Primary Consumer):** The link between producers and fish.
3. **Parrotfish (Herbivore):** Keystone species that prevents coral smothering.
4. **Grouper (Meso-predator):** Regulates smaller fish populations.
5. **Juvenile Blacktip Shark (Focus):** Secondary predator dependent on shallow nurseries.
6. **Tiger Shark (Apex Threat):** Natural predator of blacktips.
7. **Humans (External Factor):** Influences the system via fishing and pollution.

---

## 🛠️ Technical Stack
* **Frontend:** HTML5, CSS3 (Tailwind CSS), JavaScript (ES6+)
* **Rendering:** HTML5 Canvas API
* **Data Visualization:** Chart.js (Real-time population tracking)
* **Math Logic:** Modified Lotka-Volterra Predator-Prey Equations
* **Version Control:** GitHub
* **Deployment:** GitHub Pages

---

## 🚀 Key Features
- **Real-time Simulation:** A dynamic state machine handling species interaction.
- **Interactive Polling:** A "Mentimeter-style" interface that pauses the sea to inject user-voted variables.
- **AI Anomaly Detector:** A logic engine that broadcasts alerts when population shifts exceed $3\sigma$ (3 standard deviations).
- **Shark Detection Pipeline:** Visual identification of juvenile sharks using simulated BRUV (Baited Remote Underwater Video) feeds.

---

## 📂 Project Structure
```text
/
├── index.html          # Main Entry Point
├── /css                # Stylesheets
├── /js
│   ├── engine.js       # Simulation logic & math
│   ├── interaction.js  # Polling & Modal systems
│   ├── vision.js       # AI Bounding box simulation
│   └── data.js         # JSON-based species configuration
└── /assets             # Species icons and environmental textures
