# Quinn Aho Portfolio Website

<img src="/screenshot.jpg?raw=true" width="880">

## 📂 General Structure

### Root Assets
- **`index.html`** – Single-page portfolio site; defines main sections (`hero`, `intro`, `projects`, `experience`, `contact`) and wires up scripts/styles.
- **`styles.css`** – Global styles: layout constants, media queries, scroll snapping, cube frame visuals, and animations.
- **`media/`** – Static assets: resume PDF, fonts, images, and demonstration videos.
- **`scripts/`** – Modular JavaScript powering interactivity:
  - **`fluid-sim.js`** – WebGL fluid simulator (GPU-based fragment/vertex shaders).
  - **`dynamic-guide.js`** – Cycles header messages when the header enters the viewport.
  - **`intro-cube.js`** – Interactive 3D cube built with Three.js; supports dragging, snapping, hover scaling.
  - **`intro-pages.js`** – Synchronizes horizontal page scrolling with cube orientation.
  - **`sheets.js`** – Manages detail overlays (“sheets”) such as contact, education, etc.
- **`.vscode/`** – Optional IDE configuration (C/C++ tooling).

---

## 🔑 Important Concepts

### WebGL Fluid Simulation (`fluid-sim.js`)
- Uses **fragment/vertex shaders** with GPU framebuffer techniques.
- Derived from GPU fluid dynamics tutorials.
- Can be customized by editing shader logic for new visual effects or performance tweaks.

### Three.js Integration (`intro-cube.js`)
- Creates an **interactive 3D cube** in the intro section.
- Cube orientation is synchronized with page scrolling via:
  - `window.setIntroCubeFace`
  - `window.onIntroCubeSnap`

### Scroll & Page Coordination (`intro-pages.js`)
- Handles **horizontal scrolling** of intro pages.
- Keeps cube orientation and page index **in sync**.
- Inline script in `index.html` enforces vertical scroll snapping between “hero” and “intro”.

### Dynamic UI Features
- **`dynamic-guide.js`** – Displays rotating motivational messages in the header, triggered by `IntersectionObserver`.
- **`sheets.js`** – Handles modal-like detail overlays via delegated click and keyboard events.

---

## 🚀 Suggested Next Steps / Learning
- **WebGL & GPU Shaders** – Explore fragment/vertex shader programming to modify fluid visuals.
- **Three.js & 3D Interaction** – Learn materials, lighting, and advanced controls for expanding cube functionality.
- **Modern Front-End APIs** – Review `IntersectionObserver`, scroll snapping, and smooth scrolling for responsive UI behaviors.
- **CSS Animations & Layout** – Understand custom variables, grid/flexbox layouts, and transitions used heavily in the design.

---

## 📚 References
- [NVIDIA GPU Gems – Fast Fluid Dynamics Simulation on the GPU](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu)  
- [mharrys/fluids-2d](https://github.com/mharrys/fluids-2d)  
- [haxiomic/GPU-Fluid-Experiments](https://github.com/haxiomic/GPU-Fluid-Experiments)  

---

## 📜 License
The code is available under the [MIT license](LICENSE).
