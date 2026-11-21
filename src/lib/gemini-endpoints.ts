import 'server-only';

// Complete, fixed REST URLs. Never accept a base URL or model path from input/env.
export const geminiEndpoints = Object.freeze({
  copy: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  image: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
  legacyImage: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent',
  imagen: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict',
});
