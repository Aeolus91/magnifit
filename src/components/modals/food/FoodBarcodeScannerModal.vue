<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { QrCode } from '@lucide/vue'
import Modal from '../../../components/atoms/Modal.vue'
import { useI18n } from '../../../lib/i18n'

interface Props {
  show: boolean
  scannerError?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'detected', barcode: string): void
}>()

const { t } = useI18n()
const videoRef = ref<HTMLVideoElement | null>(null)
let stream: MediaStream | null = null
let scanInterval: any = null

const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })

    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
    }

    let detector: { detect: (video: HTMLVideoElement) => Promise<any[]> } | null = null;
    const requestedFormats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128', 'code_39'];

    if ('BarcodeDetector' in window) {
      try {
        const supportedFormats = await (window as any).BarcodeDetector.getSupportedFormats();
        if (supportedFormats.length > 0) {
          detector = new (window as any).BarcodeDetector({ formats: requestedFormats });
          console.log("Scanner: Native Initialized");
        } else {
          console.warn("Scanner: Native is a 'ghost' API. Falling back.");
        }
      } catch (e) {
        console.warn("Scanner: Error verifying Native API. Falling back.", e);
      }
    }

    if (!detector && typeof WebAssembly === 'object') {
      try {
        const DetectorClass = (await import('barcode-detector')).BarcodeDetector;
        detector = new DetectorClass({ formats: requestedFormats as any });
        console.log("Scanner: WASM Polyfill Initialized");
      } catch (wasmErr) {
        console.warn("Scanner: WASM polyfill failed (strict privacy/JIT blocked). Falling back.", wasmErr);
      }
    }

    if (!detector) {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const zxingReader = new BrowserMultiFormatReader();
        console.log("Scanner: Pure JS (ZXing) Initialized");

        detector = {
          detect: async (video: HTMLVideoElement) => {
            try {
              const result = zxingReader.decode(video);
              return result ? [{ rawValue: result.getText() }] : [];
            } catch (e) {
              return []; // Return empty array to mimic BarcodeDetector behavior
            }
          }
        };
      } catch (zxingErr) {
        console.error("Scanner Setup Failed: No barcode capabilities available.", zxingErr);
        return; // Complete failure, exit setup
      }
    }

    scanInterval = setInterval(async () => {
      if (!videoRef.value || videoRef.value.readyState < 2 || videoRef.value.paused) return

      try {
        const barcodes = await detector!.detect(videoRef.value)

        if (barcodes.length > 0) {
          emit('detected', barcodes[0].rawValue)
        }
      } catch (err) {
        // Ignore frame read errors
      }
    }, 500)

  } catch (err: any) {
    // Camera denied or unavailable
    console.error("Camera or stream setup failed:", err);
  }
}

const stopCamera = () => {
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
}

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    startCamera()
  } else {
    stopCamera()
  }
}, { immediate: true })

onUnmounted(() => {
  stopCamera()
})
</script>

<template>
  <Modal v-if="show" :title="t('meals.scanner.title')" :icon="QrCode" icon-color="text-amber-400"
    max-width-class="max-w-md" @close="emit('close')">
    <div class="space-y-4 text-center">
      <div
        class="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        <video ref="videoRef" autoplay playsinline muted class="w-full h-full object-cover"></video>

        <!-- Scanner Target Reticle -->
        <div
          class="absolute inset-x-12 inset-y-8 border-2 border-dashed border-amber-400/80 rounded-xl pointer-events-none animate-pulse">
        </div>
      </div>

      <div v-if="scannerError" class="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
        {{ scannerError }}
      </div>
      <p v-else class="text-xs text-slate-400">
        {{ t('meals.scanner.desc') }}
      </p>
    </div>
  </Modal>
</template>
