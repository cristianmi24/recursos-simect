import { Mp3Encoder } from '@breezystack/lamejs';

// Convierte una grabación del navegador (WebM/Ogg/MP4) a MP3 mono de 64 kbps, suficiente para voz.
// Si el navegador no puede decodificarla, devuelve null y se conserva el formato original.
export async function toMp3(blob: Blob): Promise<Blob | null> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const context = new Ctx();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const channels = decoded.numberOfChannels;
    const length = decoded.length;
    const mono = new Float32Array(length);
    for (let channel = 0; channel < channels; channel += 1) {
      const data = decoded.getChannelData(channel);
      for (let i = 0; i < length; i += 1) mono[i] += data[i] / channels;
    }
    const pcm = new Int16Array(length);
    for (let i = 0; i < length; i += 1) {
      const sample = Math.max(-1, Math.min(1, mono[i]));
      pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    const encoder = new Mp3Encoder(1, decoded.sampleRate, 64);
    const parts: Uint8Array[] = [];
    const block = 1152 * 20;
    for (let offset = 0; offset < length; offset += block) {
      const chunk = encoder.encodeBuffer(pcm.subarray(offset, offset + block));
      if (chunk.length > 0) parts.push(chunk);
      // Cede el hilo para no congelar la pantalla en audios largos.
      if ((offset / block) % 50 === 49) await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
    const tail = encoder.flush();
    if (tail.length > 0) parts.push(tail);
    const result = new Blob(parts as BlobPart[], { type: 'audio/mpeg' });
    return result.size > 0 ? result : null;
  } catch {
    return null;
  } finally {
    void context.close().catch(() => undefined);
  }
}
