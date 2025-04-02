"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageIcon, MicIcon, MusicIcon, TypeIcon, VideoIcon } from "lucide-react";
import type { MediaType } from "@/data/store";

type MediaTypePickerProps = {
  mediaType: string;
  onMediaTypeChange: (type: string) => void;
};

export function MediaTypePicker({ mediaType, onMediaTypeChange }: MediaTypePickerProps) {
  return (
    <div className="flex w-full gap-2">
      <Button
        variant="ghost"
        onClick={() => onMediaTypeChange("image")}
        className={cn(
          mediaType === "image" && "bg-white/10",
          "h-14 flex flex-col justify-center w-1/6 rounded-md gap-2 items-center",
        )}
      >
        <ImageIcon className="w-4 h-4 opacity-50" />
        <span className="text-[10px]">Image</span>
      </Button>
      <Button
        variant="ghost"
        onClick={() => onMediaTypeChange("img2img")}
        className={cn(
          mediaType === "img2img" && "bg-white/10",
          "h-14 flex flex-col justify-center w-1/6 rounded-md gap-2 items-center",
        )}
      >
        <ImageIcon className="w-4 h-4 opacity-50" />
        <span className="text-[10px]">Img2Img</span>
      </Button>
      <Button
        variant="ghost"
        onClick={() => onMediaTypeChange("video")}
        className={cn(
          mediaType === "video" && "bg-white/10",
          "h-14 flex flex-col justify-center w-1/6 rounded-md gap-2 items-center",
        )}
      >
        <VideoIcon className="w-4 h-4 opacity-50" />
        <span className="text-[10px]">Video</span>
      </Button>
      <Button
        variant="ghost"
        onClick={() => onMediaTypeChange("text")}
        className={cn(
          mediaType === "text" && "bg-white/10",
          "h-14 flex flex-col justify-center w-1/6 rounded-md gap-2 items-center",
        )}
      >
        <TypeIcon className="w-4 h-4 opacity-50" />
        <span className="text-[10px]">Text</span>
      </Button>
      <Button
        variant="ghost"
        onClick={() => onMediaTypeChange("voiceover")}
        className={cn(
          mediaType === "voiceover" && "bg-white/10",
          "h-14 flex flex-col justify-center w-1/6 rounded-md gap-2 items-center",
        )}
      >
        <MicIcon className="w-4 h-4 opacity-50" />
        <span className="text-[10px]">Voiceover</span>
      </Button>
      <Button
        variant="ghost"
        onClick={() => onMediaTypeChange("music")}
        className={cn(
          mediaType === "music" && "bg-white/10",
          "h-14 flex flex-col justify-center w-1/6 rounded-md gap-2 items-center",
        )}
      >
        <MusicIcon className="w-4 h-4 opacity-50" />
        <span className="text-[10px]">Music</span>
      </Button>
    </div>
  );
}
