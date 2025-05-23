"use client";

import { createFalClient } from "@fal-ai/client";

export const fal = createFalClient({
  proxyUrl: "/api/fal",
});

export type InputAsset =
  | "video"
  | "image"
  | "audio"
  | "text"
  | {
      type: "video" | "image" | "audio" | "text";
      key: string;
    };

export type AnyLlmOutput = {
  output?: string;
  text?: string;
  images?: Array<{ url: string }>;
  [key: string]: any;
};

export type Result<T = any> = {
  data?: T;
  images?: Array<{ url: string }>;
  output?:
    | {
        images?: Array<{ url: string }>;
        [key: string]: any;
      }
    | string;
  video_url?: string;
  url?: string;
  [key: string]: any;
};

export type ApiInfo = {
  endpointId: string;
  label: string;
  description: string;
  cost: string;
  inferenceTime?: string;
  inputMap?: Record<string, string>;
  inputAsset?: InputAsset[];
  initialInput?: Record<string, unknown>;
  cameraControl?: boolean;
  imageForFrame?: boolean;
  category: "image" | "video" | "music" | "voiceover" | "text" | "img2img";
  prompt?: boolean;
};

export const AVAILABLE_ENDPOINTS: ApiInfo[] = [
  {
    endpointId: "text",
    label: "Text",
    description: "Add text to your video",
    cost: "",
    category: "text",
    inputAsset: [],
  },
  {
    endpointId: "fal-ai/stable-diffusion-xl-img2img",
    label: "Image to Image",
    description: "Transform existing images with AI",
    cost: "",
    category: "image",
    inputAsset: ["image"],
    initialInput: {
      prompt: "",
      negative_prompt: "",
      guidance_scale: 7.5,
      num_inference_steps: 30,
      strength: 0.7,
    },
  },
  {
    endpointId: "fal-ai/flux/dev",
    label: "Flux Dev",
    description: "Generate a video from a text prompt",
    cost: "",
    category: "image",
  },
  {
    endpointId: "fal-ai/flux/schnell",
    label: "Flux Schnell",
    description: "Generate a video from a text prompt",
    cost: "",
    category: "image",
  },
  {
    endpointId: "fal-ai/flux-pro/v1.1-ultra",
    label: "Flux Pro 1.1 Ultra",
    description: "Generate a video from a text prompt",
    cost: "",
    category: "image",
  },
  {
    endpointId: "fal-ai/stable-diffusion-v35-large",
    label: "Stable Diffusion 3.5 Large",
    description: "Image quality, typography, complex prompt understanding",
    cost: "",
    category: "image",
  },
  {
    endpointId: "fal-ai/minimax/video-01-live",
    label: "Minimax Video 01 Live",
    description: "High quality video, realistic motion and physics",
    cost: "",
    category: "video",
    inputAsset: ["image"],
  },
  {
    endpointId: "fal-ai/hunyuan-video",
    label: "Hunyuan",
    description: "High visual quality, motion diversity and text alignment",
    cost: "",
    category: "video",
  },
  {
    endpointId: "fal-ai/kling-video/v1.5/pro",
    label: "Kling 1.5 Pro",
    description: "High quality video",
    cost: "",
    category: "video",
    inputAsset: ["image"],
  },
  {
    endpointId: "fal-ai/kling-video/v1/standard/text-to-video",
    label: "Kling 1.0 Standard",
    description: "High quality video",
    cost: "",
    category: "video",
    inputAsset: [],
    cameraControl: true,
  },
  {
    endpointId: "fal-ai/luma-dream-machine",
    label: "Luma Dream Machine 1.5",
    description: "High quality video",
    cost: "",
    category: "video",
    inputAsset: ["image"],
  },
  {
    endpointId: "fal-ai/luma-dream-machine/ray-2-flash/image-to-video",
    label: "Luma Ray 2 Flash image to video",
    description:
      "Ray2 Flash is a fast video generative model capable of creating realistic visuals with natural, coherent motion.",
    cost: "",
    category: "video",
    inputAsset: ["image"],
  },
  {
    endpointId: "fal-ai/minimax-music",
    label: "Minimax Music",
    description:
      "Advanced AI techniques to create high-quality, diverse musical compositions",
    cost: "",
    category: "music",
    inputAsset: [
      {
        type: "audio",
        key: "reference_audio_url",
      },
    ],
  },
  {
    endpointId: "fal-ai/mmaudio-v2",
    label: "MMAudio V2",
    description:
      "MMAudio generates synchronized audio given video and/or text inputs. It can be combined with video models to get videos with audio.",
    cost: "",
    inputAsset: ["video"],
    category: "video",
  },
  {
    endpointId: "fal-ai/sync-lipsync",
    label: "sync.so -- lipsync 1.8.0",
    description:
      "Generate realistic lipsync animations from audio using advanced algorithms for high-quality synchronization.",
    cost: "",
    inputAsset: ["video", "audio"],
    category: "video",
  },
  {
    endpointId: "fal-ai/stable-audio",
    label: "Stable Audio",
    description: "Stable Diffusion music creation with high-quality tracks",
    cost: "",
    category: "music",
  },
  {
    endpointId: "fal-ai/playht/tts/v3",
    label: "PlayHT TTS v3",
    description: "Fluent and faithful speech with flow matching",
    cost: "",
    category: "voiceover",
    initialInput: {
      voice: "Dexter (English (US)/American)",
    },
  },
  {
    endpointId: "fal-ai/playai/tts/dialog",
    label: "PlayAI Text-to-Speech Dialog",
    description:
      "Generate natural-sounding multi-speaker dialogues. Perfect for expressive outputs, storytelling, games, animations, and interactive media.",
    cost: "",
    category: "voiceover",
    inputMap: {
      prompt: "input",
    },
    initialInput: {
      voices: [
        {
          voice: "Jennifer (English (US)/American)",
          turn_prefix: "Speaker 1: ",
        },
        {
          voice: "Furio (English (IT)/Italian)",
          turn_prefix: "Speaker 2: ",
        },
      ],
    },
  },
  {
    endpointId: "fal-ai/f5-tts",
    label: "F5 TTS",
    description: "Fluent and faithful speech with flow matching",
    cost: "",
    category: "voiceover",
    initialInput: {
      ref_audio_url:
        "https://github.com/SWivid/F5-TTS/raw/21900ba97d5020a5a70bcc9a0575dc7dec5021cb/tests/ref_audio/test_en_1_ref_short.wav",
      ref_text: "Some call me nature, others call me mother nature.",
      model_type: "F5-TTS",
      remove_silence: true,
    },
  },
  {
    endpointId: "fal-ai/veo2",
    label: "Veo 2",
    description:
      "Veo creates videos with realistic motion and high quality output, up to 4K.",
    cost: "",
    category: "video",
  },
  {
    endpointId: "fal-ai/veo2/image-to-video",
    label: "Veo 2 Image-to-Video",
    description:
      "Veo creates high quality videos from images with realistic motion, supporting up to 4K.",
    cost: "",
    category: "video",
    inputAsset: ["image"],
  },
  {
    endpointId: "fal-ai/ltx-video-v095/multiconditioning",
    label: "LTX Video v0.95 Multiconditioning",
    description: "Generate videos from prompts,images using LTX Video-0.9.5",
    cost: "",
    imageForFrame: true,
    category: "video",
    inputAsset: ["image"],
  },
  {
    endpointId: "fal-ai/topaz/upscale/video",
    label: "Topaz Video Upscale",
    description:
      "Professional-grade video upscaling using Topaz technology. Enhance your videos with high-quality upscaling.",
    cost: "",
    category: "video",
    prompt: false,
    inputAsset: ["video"],
  },
  {
    endpointId: "fal-ai/flux/dev/image-to-image",
    label: "Flux Dev Image to Image",
    description: "Transform existing images with AI",
    cost: "",
    category: "img2img",
    inputAsset: ["image"],
    initialInput: {
      prompt: "",
    },
  },
  {
    endpointId: "rundiffusion-fal/juggernaut-flux/pro/image-to-image",
    label: "juggernaut flux pro Image to Image",
    description:
      "Juggernaut Pro Flux by RunDiffusion is the flagship Juggernaut model rivaling some of the most advanced image models available",
    cost: "",
    inputAsset: ["image"],
    category: "img2img",
    prompt: true,
  },
  {
    endpointId: "fal-ai/any-llm",
    label: "Any LLM",
    description: "Use any large language model from the selected catalog",
    cost: "",
    category: "text",
    inputAsset: [],
    initialInput: {
      model: "google/gemini-flash-1.5",
    },
  },
  {
    endpointId: "fal-ai/stable-diffusion-xl",
    label: "Stable Diffusion XL",
    description: "High-quality image generation",
    cost: "",
    category: "image",
  },
  {
    endpointId: "stability-ai/sdxl",
    label: "SDXL by Stability",
    description: "Stability AI's SDXL",
    cost: "",
    category: "image",
  },
  {
    endpointId: "fal-ai/fast-sdxl",
    label: "Fast SDXL",
    description: "Optimized SDXL for faster inference",
    cost: "",
    category: "image",
  },
];
