import type { MediaItem } from "@/data/schema";
import { fal } from "./fal";
import { resolveMediaUrl } from "./utils";

export async function getMediaMetadata(media: MediaItem) {
  // Return existing metadata for text media type
  if (media.mediaType === "text") {
    return {
      media: {
        duration: media.metadata?.duration || 5000,
        text: media.url || "",
        style: media.metadata?.style || {
          fontSize: 48,
          color: "white",
          fontFamily: "sans-serif",
          position: "center",
        },
      },
    };
  }

  try {
    const { data: mediaMetadata } = await fal.subscribe(
      "fal-ai/ffmpeg-api/metadata",
      {
        input: {
          media_url: resolveMediaUrl(media),
          extract_frames: true,
        },
        mode: "streaming",
      },
    );

    return mediaMetadata;
  } catch (error) {
    console.error(error);
    return {};
  }
}
