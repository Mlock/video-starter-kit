"use client";

import { useJobCreator } from "@/data/mutations";
import { queryKeys, useProject, useProjectMediaItems } from "@/data/queries";
import type { MediaItem } from "@/data/schema";
import {
  type GenerateData,
  type MediaType,
  useProjectId,
  useVideoProjectStore,
} from "@/data/store";
import { AVAILABLE_ENDPOINTS, type InputAsset } from "@/lib/fal";
import {
  ImageIcon,
  MicIcon,
  MusicIcon,
  LoaderCircleIcon,
  VideoIcon,
  ArrowLeft,
  TrashIcon,
  WandSparklesIcon,
  CrossIcon,
  XIcon,
  TypeIcon,
} from "lucide-react";
import { MediaItemRow } from "./media-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import type { ClientUploadedFileData } from "uploadthing/types";
import { db } from "@/data/db";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  assetKeyMap,
  cn,
  getAssetKey,
  getAssetType,
  mapInputKey,
  resolveMediaUrl,
} from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enhancePrompt } from "@/lib/prompt";
import { WithTooltip } from "./ui/tooltip";
import { Label } from "@/components/ui/label";
import { VoiceSelector } from "./playht/voice-selector";
import { LoadingIcon } from "./ui/icons";
import { getMediaMetadata } from "@/lib/ffmpeg";
import CameraMovement from "./camera-control";
import VideoFrameSelector from "./video-frame-selector";
import { Slider } from "@/components/ui/slider";
import { useDropzone } from "react-dropzone";
import { Loader2, Upload } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { v4 as uuidv4 } from "uuid";

type ModelEndpointPickerProps = {
  mediaType: string;
  onValueChange: (value: MediaType) => void;
} & Parameters<typeof Select>[0];

function ModelEndpointPicker({
  mediaType,
  ...props
}: ModelEndpointPickerProps) {
  const endpoints = useMemo(
    () =>
      AVAILABLE_ENDPOINTS.filter((endpoint) => endpoint.category === mediaType),
    [mediaType],
  );
  return (
    <Select {...props}>
      <SelectTrigger className="text-base w-full minw-56 font-semibold">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {endpoints.map((endpoint) => (
          <SelectItem key={endpoint.endpointId} value={endpoint.endpointId}>
            <div className="flex flex-row gap-2 items-center">
              <span>{endpoint.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Add Google Fonts API URL
const GOOGLE_FONTS_API = "https://www.googleapis.com/webfonts/v1/webfonts?key=YOUR_API_KEY";

// Popular Google Fonts for video text
const POPULAR_FONTS = [
  { family: "Roboto", category: "sans-serif" },
  { family: "Open Sans", category: "sans-serif" },
  { family: "Playfair Display", category: "serif" },
  { family: "Montserrat", category: "sans-serif" },
  { family: "Lato", category: "sans-serif" },
  { family: "Poppins", category: "sans-serif" },
  { family: "Oswald", category: "sans-serif" },
  { family: "Raleway", category: "sans-serif" },
];

export default function RightPanel({
  onOpenChange,
}: {
  onOpenChange?: (open: boolean) => void;
}) {
  const videoProjectStore = useVideoProjectStore((s) => s);
  const {
    generateData,
    setGenerateData,
    resetGenerateData,
    endpointId,
    setEndpointId,
  } = videoProjectStore;

  const [tab, setTab] = useState<string>("generation");
  const [assetMediaType, setAssetMediaType] = useState("all");
  const projectId = useProjectId();
  const openGenerateDialog = useVideoProjectStore((s) => s.openGenerateDialog);
  const generateDialogOpen = useVideoProjectStore((s) => s.generateDialogOpen);
  const closeGenerateDialog = useVideoProjectStore(
    (s) => s.closeGenerateDialog,
  );
  const queryClient = useQueryClient();

  const handleOnOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      closeGenerateDialog();
      resetGenerateData();
      return;
    }
    onOpenChange?.(isOpen);
    openGenerateDialog();
  };

  const { data: project } = useProject(projectId);

  const { toast } = useToast();
  const enhance = useMutation({
    mutationFn: async () => {
      if (!generateData.prompt || mediaType === "text") return "";
      return enhancePrompt(generateData.prompt, {
        type: mediaType,
        project,
      });
    },
    onSuccess: (enhancedPrompt) => {
      if (enhancedPrompt) {
        setGenerateData({ prompt: enhancedPrompt });
      }
    },
    onError: (error) => {
      console.warn("Failed to create suggestion", error);
      toast({
        title: "Failed to enhance prompt",
        description: "There was an unexpected error. Try again.",
      });
    },
  });

  const { data: mediaItems = [] } = useProjectMediaItems(projectId);
  const mediaType = useVideoProjectStore((s) => s.generateMediaType);
  const setMediaType = useVideoProjectStore((s) => s.setGenerateMediaType);

  const endpoint = useMemo(
    () => {
      const foundEndpoint = AVAILABLE_ENDPOINTS.find(
        (endpoint) => endpoint.endpointId === endpointId,
      );
      
      // Ensure every endpoint has inputAsset as at least an empty array
      if (foundEndpoint && !foundEndpoint.inputAsset) {
        return {
          ...foundEndpoint,
          inputAsset: [],
        };
      }
      
      return foundEndpoint;
    },
    [endpointId],
  );
  const handleMediaTypeChange = (mediaType: string) => {
    setMediaType(mediaType as MediaType);
    const endpoint = AVAILABLE_ENDPOINTS.find(
      (endpoint) => endpoint.category === mediaType || 
      (mediaType === "img2img" && endpoint.endpointId === "image-to-image")
    );

    const initialInput = endpoint?.initialInput || {};

    if (mediaType === "text") {
      setGenerateData({
        text: "",
        style: {
          fontSize: 48,
          color: "white",
          fontFamily: "sans-serif",
          position: "center",
        },
        duration: 5,
      });
      // Use the text endpoint directly
      setEndpointId("text");
    } else if (mediaType === "img2img") {
      setGenerateData({ image: null, ...initialInput });
      setEndpointId("image-to-image");
    } else if (
      (mediaType === "video" &&
        endpoint?.endpointId === "fal-ai/hunyuan-video") ||
      mediaType !== "video"
    ) {
      setGenerateData({ image: null, ...initialInput });
      setEndpointId(endpoint?.endpointId ?? AVAILABLE_ENDPOINTS[0].endpointId);
    } else {
      setGenerateData({ ...initialInput });
      setEndpointId(endpoint?.endpointId ?? AVAILABLE_ENDPOINTS[0].endpointId);
    }
  };
  // TODO improve model-specific parameters
  type InputType = {
    prompt: string;
    image_url?: File | string | null;
    video_url?: File | string | null;
    audio_url?: File | string | null;
    image_size?: { width: number; height: number } | string;
    aspect_ratio?: string;
    seconds_total?: number;
    voice?: string;
    input?: string;
    reference_audio_url?: File | string | null;
    images?: {
      start_frame_num: number;
      image_url: string | File;
    }[];
    advanced_camera_control?: {
      movement_value: number;
      movement_type: string;
    };
  };

  const aspectRatioMap = {
    "16:9": { image: "landscape_16_9", video: "16:9" },
    "9:16": { image: "portrait_16_9", video: "9:16" },
    "1:1": { image: "square_1_1", video: "1:1" },
  };

  let imageAspectRatio: string | { width: number; height: number } | undefined;
  let videoAspectRatio: string | undefined;

  if (project?.aspectRatio) {
    imageAspectRatio = aspectRatioMap[project.aspectRatio].image;
    videoAspectRatio = aspectRatioMap[project.aspectRatio].video;
  }

  const input: InputType = {
    prompt: generateData.prompt || "",
    image_url: undefined,
    image_size: imageAspectRatio,
    aspect_ratio: videoAspectRatio,
    seconds_total: generateData.duration ?? undefined,
    voice:
      endpointId === "fal-ai/playht/tts/v3" ? generateData.voice : undefined,
    input:
      endpointId === "fal-ai/playht/tts/v3" ? generateData.prompt : undefined,
  };

  if (generateData.image) {
    input.image_url = generateData.image;
  }
  if (generateData.video_url) {
    input.video_url = generateData.video_url;
  }
  if (generateData.audio_url) {
    input.audio_url = generateData.audio_url;
  }
  if (generateData.reference_audio_url) {
    input.reference_audio_url = generateData.reference_audio_url;
  }

  if (generateData.advanced_camera_control) {
    input.advanced_camera_control = generateData.advanced_camera_control;
  }

  if (generateData.images) {
    input.images = generateData.images;
  }

  const extraInput =
    endpointId === "fal-ai/f5-tts"
      ? {
          gen_text: generateData.prompt,
          ref_audio_url:
            "https://github.com/SWivid/F5-TTS/raw/21900ba97d5020a5a70bcc9a0575dc7dec5021cb/tests/ref_audio/test_en_1_ref_short.wav",
          ref_text: "Some call me nature, others call me mother nature.",
          model_type: "F5-TTS",
          remove_silence: true,
        }
      : {};
  const createJob = useJobCreator({
    projectId,
    endpointId:
      generateData.image && mediaType === "video"
        ? `${endpointId}/image-to-video`
        : endpointId,
    mediaType: mediaType === "img2img" ? "image" : mediaType as any,
    input: {
      ...(endpoint?.initialInput || {}),
      ...mapInputKey(input, endpoint?.inputMap || {}),
      ...extraInput,
    },
  });

  const handleOnGenerate = async () => {
    if (!projectId) return;

    if (mediaType === "text") {
      // Create a media item for the text in the gallery with proper metadata
      const mediaId = await db.media.create({
        projectId,
        kind: "generated",
        createdAt: Date.now(),
        mediaType: "text",
        status: "completed",
        url: generateData.text || "",
        metadata: {
          text: generateData.text || "",
          style: {
            fontSize: generateData.style?.fontSize || 48,
            color: generateData.style?.color || "white",
            fontFamily: generateData.style?.fontFamily || "sans-serif",
            position: generateData.style?.position || "center",
          },
          duration: (generateData.duration || 5) * 1000,
        },
      });

      const trackId = await db.tracks.create({
        projectId,
        type: "text",
        label: "Text",
        locked: false,
      });

      if (typeof trackId === "string") {
        await db.keyFrames.create({
          trackId,
          timestamp: 0,
          duration: (generateData.duration || 5) * 1000,
          data: {
            type: "text",
            text: generateData.text || "",
            style: {
              fontSize: generateData.style?.fontSize || 48,
              color: generateData.style?.color || "white",
              fontFamily: generateData.style?.fontFamily || "sans-serif",
              position: generateData.style?.position || "center",
            },
          },
        });
      }

      // Refresh the gallery to show the new text item
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectMediaItems(projectId),
      });

      handleOnOpenChange(false);
      return;
    }

    if (mediaType === "img2img" && generateData.image) {
      // For image-to-image, we use the same endpoint but with the image input
      await createJob.mutateAsync({} as any, {
        onSuccess: async () => {
          if (!createJob.isError) {
            handleOnOpenChange(false);
          }
        },
        onError: (error) => {
          console.warn("Failed to create img2img job", error);
          toast({
            title: "Failed to transform image",
            description: "Please ensure you've set your FAL KEY in the settings.",
          });
        },
      });
      return;
    }

    await createJob.mutateAsync({} as any, {
      onSuccess: async () => {
        if (!createJob.isError) {
          handleOnOpenChange(false);
        }
      },
      onError: (error) => {
        console.warn("Failed to create job", error);
        toast({
          title: "Failed to generate media",
          description: "Please ensure you've set your FAL KEY in the settings.",
        });
      },
    });
  };

  useEffect(() => {
    videoProjectStore.onGenerate = handleOnGenerate;
  }, [handleOnGenerate]);

  const handleSelectMedia = (media: MediaItem) => {
    const asset = endpoint?.inputAsset?.find((item) => {
      const assetType = getAssetType(item);

      if (
        assetType === "audio" &&
        (media.mediaType === "voiceover" || media.mediaType === "music")
      ) {
        return true;
      }
      return assetType === media.mediaType;
    });

    if (!asset) {
      setTab("generation");
      return;
    }

    setGenerateData({ [getAssetKey(asset)]: resolveMediaUrl(media) });
    setTab("generation");
  };

  const { startUpload, isUploading } = useUploadThing("fileUploader");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const uploadedFiles = await startUpload(Array.from(files));
      if (uploadedFiles) {
        await handleUploadComplete(uploadedFiles);
      }
    } catch (err) {
      console.warn(`ERROR! ${err}`);
      toast({
        title: "Failed to upload file",
        description: "Please try again",
      });
    }
  };

  const handleUploadComplete = async (
    files: ClientUploadedFileData<{
      uploadedBy: string;
    }>[],
  ) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaType = file.type.split("/")[0];
      const outputType = mediaType === "audio" ? "music" : mediaType;

      const data: Omit<MediaItem, "id"> = {
        projectId,
        kind: "uploaded",
        createdAt: Date.now(),
        mediaType: outputType as "video" | "image" | "music" | "voiceover" | "text",
        status: "completed",
        url: file.url,
      };

      setGenerateData({
        ...generateData,
        [assetKeyMap[outputType as keyof typeof assetKeyMap]]: file.url,
      });

      const mediaId = await db.media.create(data);
      const media = await db.media.find(mediaId as string);

      if (media && media.mediaType !== "image" && media.mediaType !== "text") {
        const mediaMetadata = await getMediaMetadata(media as MediaItem);

        await db.media
          .update(media.id, {
            ...media,
            metadata: mediaMetadata?.media || {},
          })
          .finally(() => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.projectMediaItems(projectId),
            });
          });
      }
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col border-l border-border w-[450px] z-50 transition-all duration-300 absolute top-0 h-full bg-background",
        generateDialogOpen ? "right-0" : "-right-[450px]",
      )}
    >
      <div className="flex-1 p-4 flex flex-col gap-4 border-b border-border h-full overflow-hidden relative">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-sm text-muted-foreground font-semibold flex-1">
            Generate Media
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOnOpenChange(false)}
            className="flex items-center gap-2"
          >
            <XIcon className="w-6 h-6" />
          </Button>
        </div>
        <div className="w-full flex flex-col">
          <div className="flex w-full gap-2">
            <Button
              variant="ghost"
              onClick={() => handleMediaTypeChange("image")}
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
              onClick={() => handleMediaTypeChange("img2img")}
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
              onClick={() => handleMediaTypeChange("video")}
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
              onClick={() => handleMediaTypeChange("text")}
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
              onClick={() => handleMediaTypeChange("voiceover")}
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
              onClick={() => handleMediaTypeChange("music")}
              className={cn(
                mediaType === "music" && "bg-white/10",
                "h-14 flex flex-col justify-center w-1/6 rounded-md gap-2 items-center",
              )}
            >
              <MusicIcon className="w-4 h-4 opacity-50" />
              <span className="text-[10px]">Music</span>
            </Button>
          </div>
          <div className="flex flex-col gap-2 mt-2 justify-start font-medium text-base">
            <div className="text-muted-foreground">Using</div>
            <ModelEndpointPicker
              mediaType={mediaType}
              value={endpointId}
              onValueChange={(endpointId) => {
                resetGenerateData();
                setEndpointId(endpointId);

                const endpoint = AVAILABLE_ENDPOINTS.find(
                  (endpoint) => endpoint.endpointId === endpointId,
                );

                const initialInput = endpoint?.initialInput || {};
                setGenerateData({ ...initialInput });
              }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 relative">
          {endpoint?.inputAsset?.map((asset, index) => (
            <div key={getAssetType(asset)} className="flex w-full">
              <div className="flex flex-col w-full" key={getAssetType(asset)}>
                <div className="flex justify-between">
                  <h4 className="capitalize text-muted-foreground mb-2">
                    {getAssetType(asset)} Reference
                  </h4>
                  {tab === `asset-${getAssetType(asset)}` && (
                    <Button
                      variant="ghost"
                      onClick={() => setTab("generation")}
                      size="sm"
                    >
                      <ArrowLeft /> Back
                    </Button>
                  )}
                </div>
                {(tab === "generation" ||
                  tab !== `asset-${getAssetType(asset)}`) && (
                  <>
                    {!generateData[getAssetKey(asset)] && (
                      <div className="flex flex-col gap-2 justify-between">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setTab(`asset-${getAssetType(asset)}`);
                            setAssetMediaType(getAssetType(asset) ?? "all");
                          }}
                          className="cursor-pointer min-h-[30px] flex flex-col items-center justify-center border border-dashed border-border rounded-md px-4"
                        >
                          <span className="text-muted-foreground text-xs text-center text-nowrap">
                            Select
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isUploading}
                          className="cursor-pointer min-h-[30px] flex flex-col items-center justify-center border border-dashed border-border rounded-md px-4"
                          asChild
                        >
                          <label htmlFor="assetUploadButton">
                            <Input
                              id="assetUploadButton"
                              type="file"
                              className="hidden"
                              onChange={handleFileUpload}
                              multiple={false}
                              disabled={isUploading}
                              accept="image/*,audio/*,video/*"
                            />
                            {isUploading ? (
                              <LoaderCircleIcon className="w-4 h-4 opacity-50 animate-spin" />
                            ) : (
                              <span className="text-muted-foreground text-xs text-center text-nowrap">
                                Upload
                              </span>
                            )}
                          </label>
                        </Button>
                      </div>
                    )}
                    {generateData[getAssetKey(asset)] && (
                      <div className="cursor-pointer overflow-hidden relative w-full flex flex-col items-center justify-center border border-dashed border-border rounded-md">
                        <WithTooltip tooltip="Remove media">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-black/50 absolute top-1 z-50 bg-black/80 right-1 group-hover:text-white"
                            onClick={() =>
                              setGenerateData({
                                [getAssetKey(asset)]: undefined,
                              })
                            }
                          >
                            <TrashIcon className="w-3 h-3 stroke-2" />
                          </button>
                        </WithTooltip>
                        {generateData[getAssetKey(asset)] && (
                          <SelectedAssetPreview
                            asset={asset}
                            data={generateData}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
                {tab === `asset-${getAssetType(asset)}` && (
                  <div className="flex items-center gap-2 flex-wrap overflow-y-auto max-h-80 divide-y divide-border">
                    {mediaItems
                      .filter((media) => {
                        if (assetMediaType === "all") return true;
                        if (
                          assetMediaType === "audio" &&
                          (media.mediaType === "voiceover" ||
                            media.mediaType === "music")
                        )
                          return true;
                        return media.mediaType === assetMediaType;
                      })
                      .map((job) => (
                        <MediaItemRow
                          draggable={false}
                          key={job.id}
                          data={job}
                          onOpen={handleSelectMedia}
                          className="cursor-pointer"
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {endpoint?.prompt !== false && mediaType !== "text" && (
            <div className="relative bg-border rounded-lg pb-10 placeholder:text-base w-full  resize-none">
              <Textarea
                className="text-base shadow-none focus:!ring-0 placeholder:text-base w-full h-32 resize-none"
                placeholder={mediaType === "img2img" ? "Describe how you want to transform the image..." : "Imagine..."}
                value={generateData.prompt}
                rows={3}
                onChange={(e) => setGenerateData({ prompt: e.target.value })}
              />
              <WithTooltip tooltip="Enhance your prompt with AI-powered suggestions.">
                <div className="absolute bottom-2 right-2">
                  <Button
                    variant="secondary"
                    disabled={enhance.isPending}
                    className="bg-purple-400/10 text-purple-400 text-xs rounded-full h-6 px-3"
                    onClick={() => enhance.mutate()}
                  >
                    {enhance.isPending ? (
                      <LoadingIcon />
                    ) : (
                      <WandSparklesIcon className="opacity-50" />
                    )}
                    Enhance Prompt
                  </Button>
                </div>
              </WithTooltip>
            </div>
          )}
        </div>
        {tab === "generation" && (
          <div className="flex flex-col gap-2 mb-2">
            {endpoint?.imageForFrame && (
              <VideoFrameSelector
                mediaItems={mediaItems}
                onChange={(
                  images: {
                    start_frame_num: number;
                    image_url: string | File;
                  }[],
                ) => setGenerateData({ images })}
              />
            )}
            {endpoint?.cameraControl && (
              <CameraMovement
                value={generateData.advanced_camera_control}
                onChange={(val) =>
                  setGenerateData({
                    advanced_camera_control: val
                      ? {
                          movement_value: val.value,
                          movement_type: val.movement,
                        }
                      : undefined,
                  })
                }
              />
            )}
            {mediaType === "music" && endpointId === "fal-ai/playht/tts/v3" && (
              <div className="flex-1 flex flex-row gap-2">
                {mediaType === "music" && (
                  <div className="flex flex-row items-center gap-1">
                    <Label>Duration</Label>
                    <Input
                      className="w-12 text-center tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min={5}
                      max={30}
                      step={1}
                      type="number"
                      value={generateData.duration}
                      onChange={(e) =>
                        setGenerateData({
                          duration: Number.parseInt(e.target.value),
                        })
                      }
                    />
                    <span>s</span>
                  </div>
                )}
                {endpointId === "fal-ai/playht/tts/v3" && (
                  <VoiceSelector
                    value={generateData.voice}
                    onValueChange={(voice) => {
                      setGenerateData({ voice });
                    }}
                  />
                )}
              </div>
            )}
            {mediaType === "text" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Text Content</Label>
                  <Textarea
                    placeholder="Enter your text..."
                    value={generateData.text || ""}
                    onChange={(e) => setGenerateData({ ...generateData, text: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select
                    value={generateData.style?.fontFamily || "Roboto"}
                    onValueChange={(value) =>
                      setGenerateData({
                        ...generateData,
                        style: { ...generateData.style, fontFamily: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_FONTS.map((font) => (
                        <SelectItem key={font.family} value={font.family}>
                          <span style={{ fontFamily: font.family }}>{font.family}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[generateData.style?.fontSize || 48]}
                      onValueChange={([value]) =>
                        setGenerateData({
                          ...generateData,
                          style: { ...generateData.style, fontSize: value },
                        })
                      }
                      min={12}
                      max={200}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {generateData.style?.fontSize || 48}px
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={generateData.style?.color || "#ffffff"}
                      onChange={(e) =>
                        setGenerateData({
                          ...generateData,
                          style: { ...generateData.style, color: e.target.value },
                        })
                      }
                      className="w-20 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={generateData.style?.color || "#ffffff"}
                      onChange={(e) =>
                        setGenerateData({
                          ...generateData,
                          style: { ...generateData.style, color: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={generateData.style?.position || "center"}
                    onValueChange={(value: "top" | "center" | "bottom") =>
                      setGenerateData({
                        ...generateData,
                        style: { ...generateData.style, position: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration (seconds)</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[generateData.duration || 5]}
                      onValueChange={([value]) =>
                        setGenerateData({ ...generateData, duration: value })
                      }
                      min={1}
                      max={30}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {generateData.duration || 5}s
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-row gap-2">
              <Button
                className="w-full"
                disabled={enhance.isPending || createJob.isPending}
                onClick={handleOnGenerate}
              >
                {mediaType === "text" ? "Add Text" : mediaType === "img2img" ? "Transform Image" : "Generate"}
              </Button>
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent via-background via-60% h-8 pointer-events-none" />
      </div>
    </div>
  );
}

const SelectedAssetPreview = ({
  data,
  asset,
}: {
  data: GenerateData;
  asset: InputAsset;
}) => {
  const assetType = getAssetType(asset);
  const assetKey = getAssetKey(asset);

  if (!data[assetKey]) return null;

  return (
    <>
      {assetType === "audio" && (
        <audio
          src={
            data[assetKey] && typeof data[assetKey] !== "string"
              ? URL.createObjectURL(data[assetKey])
              : data[assetKey] || ""
          }
          controls={true}
        />
      )}
      {assetType === "video" && (
        <video
          src={
            data[assetKey] && typeof data[assetKey] !== "string"
              ? URL.createObjectURL(data[assetKey])
              : data[assetKey] || ""
          }
          controls={false}
          style={{ pointerEvents: "none" }}
        />
      )}
      {assetType === "image" && (
        <img
          id="image-preview"
          src={
            data[assetKey] && typeof data[assetKey] !== "string"
              ? URL.createObjectURL(data[assetKey])
              : data[assetKey] || ""
          }
          alt="Media Preview"
        />
      )}
      {assetType === "text" && (
        <div className="p-4 text-center">
          <p className="text-lg font-medium">{data[assetKey]}</p>
        </div>
      )}
    </>
  );
};
