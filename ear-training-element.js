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
        * { box-sizing: border-box; font-family: Arial, sans-serif; }
        .wrap {
          background: transparent;
          color: white;
          padding: 24px;
          border-radius: 16px;
          text-align: center;
        }
        button {
          background: #37c7ff;
          color: #001b44;
          border: none;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }
        .status {
          margin-top: 18px;
          font-size: 18px;
          min-height: 28px;
        }
        .meter {
          margin-top: 20px;
          width: 100%;
          height: 16px;
          background: rgba(255,255,255,0.12);
          border-radius: 999px;
          overflow: hidden;
        }
        .fill {
          width: 0%;
          height: 100%;
          background: #37c7ff;
          transition: width 0.08s linear;
        }
      </style>

      <div class="wrap">
        <button id="startBtn">Avvia microfono</button>
        <div class="status" id="status">Microfono non attivo</div>
        <div class="meter"><div class="fill" id="fill"></div></div>
      </div>
    `;
  }

  connectedCallback() {
    this.shadowRoot.getElementById("startBtn")
      .addEventListener("click", () => this.startMic());
  }

  async startMic() {
    const status = this.shadowRoot.getElementById("status");
    const fill = this.shadowRoot.getElementById("fill");

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        status.textContent = "Browser non compatibile con il microfono";
        return;
      }

      status.textContent = "Richiesta accesso microfono...";

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      status.textContent = "Microfono attivo";

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const updateMeter = () => {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const percent = Math.min(100, avg * 1.8);
        fill.style.width = percent + "%";
        this.animationFrame = requestAnimationFrame(updateMeter);
      };

      updateMeter();

    } catch (err) {
      console.error("Errore microfono:", err);
      status.textContent = "Microfono non disponibile o permesso negato";
    }
  }
}

customElements.define("ear-training-element", EarTrainingElement);
