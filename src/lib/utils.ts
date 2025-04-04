import type { MediaItem, VideoTrack } from "@/data/schema";
import { GenerateData, LAST_PROJECT_ID_KEY } from "@/data/store";
import { type ClassValue, clsx } from "clsx";
import {
  ImageIcon,
  MicIcon,
  MusicIcon,
  VideoIcon,
  TypeIcon,
} from "lucide-react";
import type { FunctionComponent } from "react";
import { twMerge } from "tailwind-merge";
import type { InputAsset } from "./fal";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractJson<T>(raw: string): T {
  const json = raw.replace("```json", "").replace("```", "");
  return JSON.parse(json);
}

export function rememberLastProjectId(projectId: string) {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    document.cookie = `${LAST_PROJECT_ID_KEY}=${projectId}; max-age=31536000; path=/`;
  }
}

export function mapInputKey(
  input: Record<string, unknown>,
  inputMap: Record<string, string>,
): Record<string, unknown> {
  if (typeof input !== "object" || input === null) return input;
  const newInput: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const newKey = inputMap[key] || key;
    if (!(newKey in newInput)) {
      newInput[newKey] = value;
    }
  }

  return newInput;
}

export const trackIcons: Record<
  VideoTrack["type"] | "image",
  FunctionComponent
> = {
  video: VideoIcon,
  music: MusicIcon,
  voiceover: MicIcon,
  image: ImageIcon,
  text: TypeIcon,
};

export function resolveDuration(item: MediaItem): number | null {
  if (!item) return null;

  const metadata = item.metadata;
  if (
    metadata &&
    "duration" in metadata &&
    typeof metadata.duration === "number"
  ) {
    return metadata.duration * 1000;
  }

  const data = item.output;
  if (!data) return null;
  if ("seconds_total" in data) {
    return data.seconds_total * 1000;
  }
  if ("audio" in data && "duration" in data.audio) {
    return data.audio.duration * 1000;
  }
  return null;
}

/**
 * Depending on the output type of the job, the URL of the audio/image/video
 * might be represented by different properties. This utility function resolves
 * the URL of the media based on the output data.
 */
export function resolveMediaUrl(item: MediaItem | undefined): string | null {
  if (!item) return null;

  // Direct URL case - for StoryGenerator and uploaded files
  if (item.url) {
    console.log("Using direct URL from item:", item.url);
    return item.url;
  }

  if (item.kind === "uploaded") {
    return item.url;
  }
  
  // Check metadata for FAL special cases
  if (item.metadata && 'originalUrl' in item.metadata) {
    console.log("Using originalUrl from metadata:", item.metadata.originalUrl);
    return item.metadata.originalUrl as string;
  }
  
  // Check metadata for video special cases
  if (item.mediaType === 'video' && item.metadata && 'video' in item.metadata && 
      typeof item.metadata.video === 'object' && item.metadata.video && 'url' in item.metadata.video) {
    console.log("Using video.url from metadata:", (item.metadata.video as any).url);
    return (item.metadata.video as any).url;
  }
  
  const data = item.output;
  if (!data) return null;
  
  // Handle direct video_url property
  if ('video_url' in data && typeof data.video_url === 'string') {
    console.log("Using video_url from output data:", data.video_url);
    return data.video_url;
  }
  
  // Handle direct video property with url
  if ('video' in data && typeof data.video === 'object' && data.video && 'url' in data.video) {
    console.log("Using video.url from output data:", (data.video as any).url);
    return (data.video as any).url; 
  }
  
  if (
    "images" in data &&
    Array.isArray(data.images) &&
    data.images.length > 0
  ) {
    return data.images[0].url;
  }
  
  const fileProperties = {
    image: 1,
    video: 1,
    audio: 1,
    audio_file: 1,
    audio_url: 1,
  };
  const property = Object.keys(data).find(
    (key) => key in fileProperties && "url" in data[key],
  );
  if (property) {
    return data[property].url;
  }
  if (item.mediaType === "text") {
    return null; // Text media type doesn't have a URL
  }
  return null;
}

export function getAssetType(
  asset: InputAsset,
): "image" | "video" | "audio" | "text" {
  return typeof asset === "string" ? asset : asset.type;
}

export const assetKeyMap: Record<"image" | "video" | "audio" | "text", string> =
  {
    image: "image",
    video: "video_url",
    audio: "audio_url",
    text: "text",
  };

export function getAssetKey(asset: InputAsset): string {
  return typeof asset === "string"
    ? assetKeyMap[asset]
    : asset.key || assetKeyMap[asset.type];
}
