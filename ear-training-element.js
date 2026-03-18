class EarTrainingElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.stream = null;
    this.animationFrame = null;

    this.shadowRoot.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        }
        .wrap {
          background: #0b1526;
          color: white;
          padding: 24px;
          border-radius: 16px;
          text-align: center;
        }
        button {
          background: #19d3da;
          color: #0b1526;
          border: none;
          padding: 14px 24px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }
        .status {
          margin-top: 18px;
          font-size: 18px;
        }
        .meter {
          margin-top: 20px;
          width: 100%;
          height: 16px;
          background: #1c2740;
          border-radius: 999px;
          overflow: hidden;
        }
        .fill {
          width: 0%;
          height: 100%;
          background: #19d3da;
          transition: width 0.08s linear;
        }
      </style>

      <div class="wrap">
        <button id="startBtn">Avvia microfono</button>
        <div class="status" id="status">Microfono non attivo</div>
        <div class="meter">
          <div class="fill" id="fill"></div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.shadowRoot
      .getElementById("startBtn")
      .addEventListener("click", () => this.startMic());
  }

  async startMic() {
    const status = this.shadowRoot.getElementById("status");
    const fill = this.shadowRoot.getElementById("fill");

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      status.textContent = "Microfono attivo";

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const updateMeter = () => {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const percent = Math.min(100, avg * 1.5);
        fill.style.width = percent + "%";
        this.animationFrame = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.error(err);
      status.textContent = "Errore: microfono non disponibile o permesso negato";
    }
  }
}

customElements.define("ear-training-element", EarTrainingElement);
