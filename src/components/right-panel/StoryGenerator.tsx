"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fal, AVAILABLE_ENDPOINTS } from "@/lib/fal";
import { Icons } from "@/components/ui/icons";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectId, useVideoProjectStore } from "@/data/store";
import { db } from "@/data/db";
import type { MediaItem } from "@/data/schema";
import { Slider } from "@/components/ui/slider";
import { queryKeys } from "@/data/queries";

export function StoryGenerator({
  onClose,
}: { onClose: () => void }): JSX.Element {
  const [baseIdea, setBaseIdea] = useState("");
  const [cleanedIdea, setCleanedIdea] = useState("");
  const [storyGenerated, setStoryGenerated] = useState(false);
  const [storyApproved, setStoryApproved] = useState(false);
  const [firstImageGenerated, setFirstImageGenerated] = useState(false);
  const [imageApproved, setImageApproved] = useState(false);
  const [allImagesGenerated, setAllImagesGenerated] = useState(false);
  const [videoGenerated, setVideoGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storySteps, setStorySteps] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [firstImage, setFirstImage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedModel, setSelectedModel] = useState(
    "fal-ai/veo2/image-to-video",
  );
  const [selectedImageModel, setSelectedImageModel] = useState(
    "fal-ai/stable-diffusion-v35-large",
  );
  const [videoPrompt, setVideoPrompt] = useState("");
  const [styleDescription, setStyleDescription] = useState("photorealistic, high detail, cohesive style, consistent lighting");

  // State for video generation
  const [imagesToUse, setImagesToUse] = useState<boolean[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Add duration state for Veo2
  const [videoDuration, setVideoDuration] = useState("5s");

  // Get all available image models
  const imageModels = useMemo(
    () =>
      AVAILABLE_ENDPOINTS.filter(
        (endpoint) => endpoint.category === "image",
      ).map((endpoint) => ({
        id: endpoint.endpointId,
        name: endpoint.label,
      })),
    [],
  );

  const projectId = useProjectId();
  const queryClient = useQueryClient();
  const setSelectedMediaId = useVideoProjectStore((s) => s.setSelectedMediaId);

  // Set default to SD 3.5 Large if it exists
  useEffect(() => {
    const defaultModel = imageModels.find(
      (model) => model.id === "fal-ai/stable-diffusion-v35-large",
    );
    if (defaultModel) {
      setSelectedImageModel(defaultModel.id);
    } else if (imageModels.length > 0) {
      // Fallback to first available model
      setSelectedImageModel(imageModels[0].id);
    }
  }, [imageModels]);

  // Function to add media directly to the database
  const addMedia = async (mediaData: {
    url: string;
    type: string;
    name: string;
  }) => {
    const mediaItem: Omit<MediaItem, "id"> = {
      projectId,
      kind: "generated",
      createdAt: Date.now(),
      mediaType: mediaData.type as
        | "video"
        | "image"
        | "music"
        | "voiceover"
        | "text",
      status: "completed",
      url: mediaData.url,
      metadata: {
        title: mediaData.name,
      },
    };

    const mediaId = await db.media.create(mediaItem);
    const media = await db.media.find(mediaId as string);
    return media;
  };

  const generateCleanIdea = async () => {
    if (!baseIdea.trim()) return;
    setLoading(true);

    try {
      console.log("Generating cleaned idea with prompt:", baseIdea);
      console.log("Using endpoint: fal-ai/any-llm");

      setApiError(null); // Clear any existing error

      // Use fal client
      const response = await fal.subscribe("fal-ai/any-llm", {
        input: {
          model: "google/gemini-flash-1.5",
          prompt: `Take this rough idea for a short video and refine it into a clear, concise concept description that could be used for video creation. Make it around 2-3 sentences maximum, focusing on the key visuals and emotional elements: "${baseIdea}"`,
        },
      });

      console.log("Response from fal-ai/any-llm:", response);

      // Extract the output from response
      // @ts-ignore - the fal API types don't match the actual response structure
      const data = response.data || response;
      // @ts-ignore
      const output = data.output || data;
      // @ts-ignore - ignore type error for the output.text property
      let finalOutput =
        typeof output === "string"
          ? output
          : output.output || output.text || JSON.stringify(output);

      // Basic cleanup - remove any markdown formatting
      finalOutput = finalOutput
        .replace(/\*\*/g, "")
        .replace(/Option \d+.*?:/g, "")
        .trim();

      // If the output includes blockquotes, extract only the quoted text from the first one
      if (finalOutput.includes(">")) {
        const lines = finalOutput.split("\n");
        for (const line of lines) {
          if (line.includes(">")) {
            const quote = line.split(">")[1];
            if (quote) {
              finalOutput = quote.trim();
              break;
            }
          }
        }
      }

      if (!finalOutput) {
        throw new Error("No valid output received from API");
      }

      console.log("Cleaned idea result:", finalOutput);
      setCleanedIdea(finalOutput);
      setStoryGenerated(true);
      setLoading(false);
    } catch (error) {
      console.error("Error generating cleaned idea:", error);

      // Set user-friendly error message
      setApiError(
        `Failed to generate story: ${error instanceof Error ? error.message : "Unknown error"}`,
      );

      toast({
        title: "Story Generation Failed",
        description:
          "There was a problem generating the story. Please try again.",
        duration: 5000,
      });
      setLoading(false);
    }
  };

  const generateStory = async () => {
    setLoading(true);

    try {
      console.log("Generating story with concept:", cleanedIdea);
      console.log("Using endpoint: fal-ai/any-llm");

      // Use fal client
      const response = await fal.subscribe("fal-ai/any-llm", {
        input: {
          model: "google/gemini-flash-1.5",
          prompt: `Create a storyboard for a short video based on this concept: "${cleanedIdea}". 
                  Provide 5-10 key scenes that would work well for a 30-second to 5-minute video. 
                  For each scene, provide a detailed description that could be used for image generation.
                  IMPORTANT: Format each scene description EXACTLY as:
                  Scene 1: [description]
                  Scene 2: [description]
                  etc.`,
        },
      });

      console.log("Story response from fal-ai/any-llm:", response);

      // Extract the output from response
      // @ts-ignore - the fal API types don't match the actual response structure
      const data = response.data || response;
      // @ts-ignore
      const output = data.output || data;
      // @ts-ignore - ignore type error for the output.text property
      let storyText =
        typeof output === "string"
          ? output
          : output.output || output.text || JSON.stringify(output);

      if (!storyText) {
        throw new Error("No valid output received from API");
      }

      console.log("Parsed story text:", storyText);

      // Improved regex pattern to extract scene descriptions
      // This pattern looks for "Scene X:" or "Scene X." or "X." or "X:" followed by text
      const scenesRegex = /(?:Scene\s*(\d+)[:.]\s*|\b(\d+)[:.]\s*)([^\n]+(?:\n(?!Scene\s*\d|^\d)[^\n]+)*)/g;
      let match;
      const scenes: string[] = [];
      const sceneMatches: {number: number, text: string}[] = [];
      
      // Extract all scenes with their numbers
      while ((match = scenesRegex.exec(storyText)) !== null) {
        const sceneNumber = parseInt(match[1] || match[2], 10);
        const sceneText = match[3].trim();
        sceneMatches.push({number: sceneNumber, text: sceneText});
      }
      
      // Sort by scene number and extract just the descriptions
      sceneMatches.sort((a, b) => a.number - b.number);
      const orderedScenes = sceneMatches.map(scene => scene.text);
      
      // If we didn't find any scenes with the regex, fall back to the old method
      if (orderedScenes.length === 0) {
        console.log("Falling back to basic scene splitting");
        const basicScenes = storyText
          .split(/Scene \d+:|Step \d+:/)
          .filter(Boolean)
          .map((scene: string) => scene.trim());
        
        console.log("Extracted scenes (basic method):", basicScenes);
        setStorySteps(basicScenes);
      } else {
        console.log("Extracted scenes (structured method):", orderedScenes);
        setStorySteps(orderedScenes);
      }

      setStoryApproved(true);
      setLoading(false);
    } catch (error) {
      console.error("Error generating story:", error);
      toast({
        title: "Story Generation Failed",
        description:
          "There was a problem generating the storyboard. Please try again.",
        duration: 5000,
      });
      setLoading(false);
    }
  };

  const generateFirstImage = async () => {
    if (storySteps.length === 0) return;
    setLoading(true);

    try {
      // Use the first scene/step for the first image, not the storyboard title
      const firstSceneIndex = 0;
      const firstScene = storySteps[firstSceneIndex];
      
      console.log("Generating first image with prompt:", firstScene);
      console.log("Using image model:", selectedImageModel);
      console.log("Style description:", styleDescription);

      // Use selected image model
      const response = await fal.subscribe(selectedImageModel, {
        input: {
          prompt: `${firstScene}, ${styleDescription}`,
          negative_prompt: "poor quality, blurry, distorted, unrealistic, inconsistent style, inconsistent lighting",
          // @ts-ignore - the fal API types are incorrect
          width: 768,
          // @ts-ignore - the fal API types are incorrect
          height: 768,
        },
      });

      console.log("First image response:", response);

      // Handle multiple possible response formats
      // @ts-ignore
      let imageUrl = null;

      try {
        // Check data.images path first (common format)
        // @ts-ignore
        if (
          response.data &&
          response.data.images &&
          response.data.images[0] &&
          response.data.images[0].url
        ) {
          // @ts-ignore
          imageUrl = response.data.images[0].url;
        }
        // Check response.images path
        // @ts-ignore
        else if (
          response.images &&
          response.images[0] &&
          response.images[0].url
        ) {
          // @ts-ignore
          imageUrl = response.images[0].url;
        }
        // Check for output.images path
        // @ts-ignore
        else if (
          response.output &&
          response.output.images &&
          response.output.images[0] &&
          response.output.images[0].url
        ) {
          // @ts-ignore
          imageUrl = response.output.images[0].url;
        }

        console.log("Extracted image URL:", imageUrl);
      } catch (err) {
        console.error("Error parsing response:", err);
        console.log("Full response:", JSON.stringify(response));
      }

      if (!imageUrl) {
        throw new Error("No image URL returned from API");
      }

      setFirstImage(imageUrl);
      setFirstImageGenerated(true);
      setLoading(false);
    } catch (error) {
      console.error("Error generating first image:", error);
      setLoading(false);
    }
  };

  const regenerateFirstImage = () => {
    setFirstImageGenerated(false);
    setFirstImage("");
    generateFirstImage();
  };

  const approveImage = () => {
    setImageApproved(true);
    // Enhance story steps with style
    enhanceStoryStepsWithStyle();
  };

  const enhanceStoryStepsWithStyle = async () => {
    if (storySteps.length === 0 || !styleDescription) return;
    
    try {
      // Extract style elements from the first successful image
      const stylePrompt = `Based on the visual style described as "${styleDescription}", 
                          enhance each of the following scene descriptions to maintain this consistent style.
                          Keep the original scene content but add style-specific details.
                          Original scenes:
                          ${storySteps.join("\n")}`;
      
      const response = await fal.subscribe("fal-ai/any-llm", {
        input: {
          model: "google/gemini-flash-1.5",
          prompt: stylePrompt,
        },
      });

      // @ts-ignore - the fal API types don't match the actual response structure
      const data = response.data || response;
      // @ts-ignore
      const output = data.output || data;
      // @ts-ignore - ignore type error for the output.text property
      let enhancedScenes =
        typeof output === "string"
          ? output
          : output.output || output.text || JSON.stringify(output);
      
      if (enhancedScenes) {
        // Parse the scene descriptions - looking for patterns like "Scene 1:", "1.", etc.
        const scenes = enhancedScenes
          .split(/Scene \d+:|Step \d+:|^\d+\.|^\d+:/)
          .filter(Boolean)
          .map((scene: string) => scene.trim());
        
        if (scenes.length >= storySteps.length) {
          // Only update if we got enough scenes back
          setStorySteps(scenes.slice(0, storySteps.length));
          
          toast({
            title: "Style Applied",
            description: "Scene descriptions have been enhanced for style consistency",
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Error enhancing story steps with style:", error);
      // Continue without enhanced descriptions if this fails
    }
  };

  const generateAllImages = async () => {
    setLoading(true);
    const images: string[] = [];
    setGeneratedImages([]);

    try {
      // Generate an image for each story step
      for (let i = 0; i < storySteps.length; i++) {
        const step = storySteps[i];
        console.log(`Generating image for scene ${i + 1}:`, step);
        console.log("Using image model:", selectedImageModel);
        console.log("Style description:", styleDescription);

        try {
          const response = await fal.subscribe(selectedImageModel, {
            input: {
              prompt: `${step}, ${styleDescription}`,
              negative_prompt: "poor quality, blurry, distorted, unrealistic, inconsistent style, inconsistent lighting",
              // @ts-ignore - the fal API types are incorrect
              width: 768,
              // @ts-ignore - the fal API types are incorrect
              height: 768,
            },
          });

          console.log("Step image response:", response);

          // Handle multiple possible response formats
          // @ts-ignore
          let imageUrl = null;

          try {
            // Check data.images path first (common format)
            // @ts-ignore
            if (
              response.data &&
              response.data.images &&
              response.data.images[0] &&
              response.data.images[0].url
            ) {
              // @ts-ignore
              imageUrl = response.data.images[0].url;
            }
            // Check response.images path
            // @ts-ignore
            else if (
              response.images &&
              response.images[0] &&
              response.images[0].url
            ) {
              // @ts-ignore
              imageUrl = response.images[0].url;
            }
            // Check for output.images path
            // @ts-ignore
            else if (
              response.output &&
              response.output.images &&
              response.output.images[0] &&
              response.output.images[0].url
            ) {
              // @ts-ignore
              imageUrl = response.output.images[0].url;
            }

            console.log("Extracted image URL:", imageUrl);
          } catch (err) {
            console.error("Error parsing response:", err);
            console.log("Full response:", JSON.stringify(response));
          }

          if (imageUrl) {
            // Add the image to our local array
            images.push(imageUrl);

            // Update the state incrementally with each new image
            setGeneratedImages([...images]);

            // Show a toast notification for each completed image
            toast({
              title: `Scene ${i + 1} generated`,
              description: "Image created successfully",
              duration: 2000,
            });
          }
        } catch (error) {
          console.error(`Error generating image for scene ${i + 1}:`, error);
          // Continue with other scenes even if one fails
          toast({
            title: `Failed to generate scene ${i + 1}`,
            description: "Continuing with remaining scenes",
            variant: "destructive",
            duration: 3000,
          });
        }
      }

      // If we have at least one image, consider the process successful
      if (images.length > 0) {
        setAllImagesGenerated(true);

        // Prepare video prompt based on the story
        const videoPromptText = `Create a video that tells this story: ${cleanedIdea}`;
        setVideoPrompt(videoPromptText);
      } else {
        throw new Error("Failed to generate any images");
      }
    } catch (error) {
      console.error("Error generating all images:", error);
      toast({
        title: "Image Generation Failed",
        description:
          "There was a problem generating the images. Please try again.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateVideos = async () => {
    if (generatedImages.length === 0) return;
    setLoading(true);
    setIsGeneratingVideos(true);

    // Add more detailed logging for debugging
    console.log("Starting video generation with model:", selectedModel);
    
    // Ensure we're using the correct Veo2 endpoint
    if (selectedModel === "fal-ai/veo2") {
      console.log("Correcting model from fal-ai/veo2 to fal-ai/veo2/image-to-video");
      setSelectedModel("fal-ai/veo2/image-to-video");
    }

    // Filter only selected images
    const selectedImages = generatedImages.filter(
      (_, index) => imagesToUse[index],
    );
    const selectedSteps = storySteps.filter((_, index) => imagesToUse[index]);

    if (selectedImages.length === 0) {
      setLoading(false);
      setIsGeneratingVideos(false);
      return;
    }

    const videos: string[] = [];
    setGeneratedVideos([]);
    setCurrentVideoIndex(0);

    try {
      // Generate videos one by one
      for (let i = 0; i < selectedImages.length; i++) {
        setCurrentVideoIndex(i);
        const imageUrl = selectedImages[i];
        const sceneDescription = selectedSteps[i] || "";

        // Combine videoPrompt with scene description if both exist
        let finalPrompt = sceneDescription;
        if (videoPrompt && sceneDescription) {
          finalPrompt = `${videoPrompt}. Scene description: ${sceneDescription}`;
        } else if (videoPrompt) {
          finalPrompt = videoPrompt;
        }

        console.log(`Generating video ${i + 1}/${selectedImages.length}`);
        console.log("Using model:", selectedModel);
        console.log("Using image:", imageUrl);
        console.log("Video prompt:", finalPrompt);

        // Create the request payload based on the model
        let requestPayload: any = {
          prompt: finalPrompt,
          image_url: imageUrl,
        };

        // Add model-specific parameters
        if (selectedModel === "fal-ai/luma-dream-machine") {
          // Luma uses a slightly different format
          requestPayload = {
            prompt: finalPrompt,
            image_url: imageUrl,
            steps: 25, // Optional, to ensure quality
          };

          // Show a notification that Luma takes longer to process
          toast({
            title: `Luma Dream Machine Notice`,
            description:
              "This model may take up to 2 minutes to generate a video. Please be patient as we poll for results.",
            duration: 8000,
          });
        } else if (selectedModel === "fal-ai/kling-video/v1.5/pro") {
          // Kling sometimes needs explicit parameters
          requestPayload = {
            prompt: finalPrompt,
            image_url: imageUrl,
            negative_prompt: "poor quality, distortion, blurry, ugly",
          };
        } else if (selectedModel === "fal-ai/veo2/image-to-video") {
          // Veo2 image-to-video format
          requestPayload = {
            prompt: finalPrompt,
            image_url: imageUrl,
            aspect_ratio: "auto",
            duration: videoDuration
          };
        } else if (selectedModel === "fal-ai/ltx-video-v095/multiconditioning") {
          // LTX Video requires specific parameters
          requestPayload = {
            prompt: finalPrompt,
            image_url: imageUrl,
            num_frames: 16, // Default value
            num_inference_steps: 30,
            guidance_scale: 7.5,
            fps: 8,
          };
        } else if (selectedModel === "fal-ai/minimax/video-01-live") {
          // Minimax Video parameters
          requestPayload = {
            prompt: finalPrompt,
            image_url: imageUrl,
            negative_prompt: "low quality, blurry, distorted, unrealistic motion",
          };
        }

        // Make sure all models have image_url parameter
        if (!requestPayload.image_url) {
          requestPayload.image_url = imageUrl;
        }

        try {
          console.log("Sending request with payload:", requestPayload);

          const response = await fal.subscribe(selectedModel, {
            input: requestPayload,
          });

          console.log("Raw video generation response:", response);

          // Parse the response to extract the video URL
          // @ts-ignore - the fal API types don't match the actual response structure
          let videoUrl = null;

          try {
            // For debugging purposes, log the full response structure
            // @ts-ignore
            console.log("Response structure:", {
              // @ts-ignore
              hasData: !!response.data,
              // @ts-ignore
              dataKeys: response.data ? Object.keys(response.data) : [],
              // @ts-ignore
              hasOutput: !!response.output,
              // @ts-ignore
              outputKeys: response.output ? Object.keys(response.output) : [],
              // Directly check for expected URL fields
              // @ts-ignore
              directVideoUrl: response.video_url,
              // @ts-ignore
              directUrl: response.url,
              // @ts-ignore
              dataVideoUrl: response.data?.video_url,
              // @ts-ignore
              dataUrl: response.data?.url,
              // @ts-ignore
              outputVideoUrl: response.output?.video_url,
              // @ts-ignore
              outputUrl: response.output?.url,
              // Log the whole response data for debugging
              // @ts-ignore
              responseData: response.data,
            });

            // Special handling for Veo2 image-to-video which has a different response format
            if (selectedModel === "fal-ai/veo2/image-to-video" && response.data) {
              try {
                // @ts-ignore
                if (response.data.video && response.data.video.url) {
                  // @ts-ignore
                  videoUrl = response.data.video.url;
                  console.log("Found Veo2 video URL from data.video.url:", videoUrl);
                }
              } catch (err) {
                console.error("Error extracting Veo2 video URL:", err);
              }
            }
            // Special handling for LTX Video which has a different response format
            else if (selectedModel === "fal-ai/ltx-video-v095/multiconditioning" && response.data) {
              try {
                // @ts-ignore
                if (response.data.video_out && response.data.video_out.url) {
                  // @ts-ignore
                  videoUrl = response.data.video_out.url;
                  console.log("Found LTX video URL from data.video_out.url:", videoUrl);
                } else if (response.data.video_url) {
                  // @ts-ignore
                  videoUrl = response.data.video_url;
                  console.log("Found LTX video URL from data.video_url:", videoUrl);
                }
              } catch (err) {
                console.error("Error extracting LTX video URL:", err);
              }
            }
            // Special handling for Minimax Video which sometimes has a different response format
            else if (selectedModel === "fal-ai/minimax/video-01-live" && response.data) {
              try {
                // @ts-ignore
                if (response.data.video_url) {
                  // @ts-ignore
                  videoUrl = response.data.video_url;
                  console.log("Found Minimax video URL from data.video_url:", videoUrl);
                }
              } catch (err) {
                console.error("Error extracting Minimax video URL:", err);
              }
            }
            // Special handling for Luma Dream Machine which has a different response format
            else if (
              selectedModel === "fal-ai/luma-dream-machine" &&
              response.data
            ) {
              try {
                // For Luma, check if there's a requestId we can use
                // @ts-ignore
                const requestId = response.requestId || response.data.requestId;
                console.log("Luma request ID:", requestId);

                if (!requestId) {
                  console.error("No requestId found in Luma response");
                  throw new Error("No requestId found in Luma response");
                }

                // Luma model needs to poll the result with the requestId
                const pollingUrl = `/api/fal?id=${requestId}`;
                console.log("Polling for video using URL:", pollingUrl);

                // Poll for up to 2 minutes (24 attempts, 5 second interval)
                for (let attempt = 0; attempt < 24; attempt++) {
                  console.log(`Polling attempt ${attempt + 1}/24`);

                  // Update the UI to show polling progress
                  if (attempt % 3 === 0) {
                    // Update every 3 attempts (15 seconds)
                    toast({
                      title: `Processing video ${i + 1}`,
                      description: `Still working... (${Math.round(((attempt + 1) / 24) * 100)}% complete)`,
                      duration: 4000,
                    });
                  }

                  // Wait 5 seconds between attempts
                  await new Promise((resolve) => setTimeout(resolve, 5000));

                  try {
                    // Poll for the result
                    const pollResponse = await fetch(pollingUrl);
                    const pollResult = await pollResponse.json();

                    console.log("Poll result:", pollResult);

                    // Check if we have a valid result
                    if (
                      pollResult.video_url ||
                      (pollResult.data && pollResult.data.video_url) ||
                      (pollResult.output && pollResult.output.video_url) ||
                      (pollResult.video && pollResult.video.url)
                    ) {
                      videoUrl =
                        pollResult.video_url ||
                        pollResult.data?.video_url ||
                        pollResult.output?.video_url ||
                        pollResult.video?.url;

                      console.log("Found video URL after polling:", videoUrl);
                      break;
                    }

                    // Also check directly inside the response data for Luma's format
                    if (
                      pollResult.data &&
                      pollResult.data.video &&
                      pollResult.data.video.url
                    ) {
                      videoUrl = pollResult.data.video.url;
                      console.log(
                        "Found Luma video URL in data.video.url:",
                        videoUrl,
                      );
                      break;
                    }
                  } catch (err) {
                    console.error("Error during polling:", err);
                  }
                }
              } catch (err) {
                console.error("Error handling Luma-specific polling:", err);
              }
            } else {
              // Check for different possible response formats for other models
              // @ts-ignore
              if (response.data) {
                // @ts-ignore
                videoUrl = response.data.video_url || response.data.url;
              }

              // Check direct response
              // @ts-ignore
              if (!videoUrl) {
                // @ts-ignore
                videoUrl = response.video_url || response.url;
              }

              // Check output path
              // @ts-ignore
              if (!videoUrl && response.output) {
                // @ts-ignore
                videoUrl = response.output.video_url || response.output.url;
              }
            }

            console.log("Extracted video URL:", videoUrl);
          } catch (err) {
            console.error("Error parsing video URL from response:", err);
            console.log("Full response object:", JSON.stringify(response));
          }

          if (videoUrl) {
            videos.push(videoUrl);

            // Update the UI immediately with each new video
            setGeneratedVideos([...videos]);

            // Save each video to the gallery as we generate it
            await addMedia({
              url: videoUrl,
              type: "video",
              name: `Scene ${i + 1}: ${sceneDescription.substring(0, 30)}...`,
            });

            // Show a success notification for each video
            toast({
              title: `Video ${i + 1} generated`,
              description: "Video has been added to your gallery",
              duration: 3000,
            });
          } else {
            console.error("Failed to extract video URL from response");
            toast({
              title: `Failed to generate video for scene ${i + 1}`,
              description:
                "Could not extract a valid video URL from the response. Try a different model.",
              duration: 5000,
            });
          }
        } catch (error) {
          console.error(`Error generating video for scene ${i + 1}:`, error);
          toast({
            title: `Failed to generate video for scene ${i + 1}`,
            description:
              "An error occurred during video generation. Try a different model.",
            variant: "destructive",
            duration: 5000,
          });
          // Continue with next video despite error
        }
      }

      // Set video generation as complete if we have at least one video
      if (videos.length > 0) {
        setVideoGenerated(true);
      }
    } catch (error) {
      console.error("Error generating videos:", error);
      toast({
        title: "Error Generating Videos",
        description:
          "There was a problem generating the videos. Please try again with a different model.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
      setIsGeneratingVideos(false);

      if (videos.length > 0) {
        toast({
          title: "Videos Generated",
          description: `Successfully generated ${videos.length} videos from your story. They've been added to your gallery.`,
        });
      }
    }
  };

  // When showing the list of generated images, initialize the imagesToUse array
  useEffect(() => {
    if (allImagesGenerated && generatedImages.length > 0) {
      setImagesToUse(generatedImages.map(() => true));
    }
  }, [allImagesGenerated, generatedImages]);

  // Add a useEffect to update the videoPrompt when scenes are generated
  useEffect(() => {
    if (allImagesGenerated && generatedImages.length > 0) {
      // Create a default video prompt that includes the story concept
      setVideoPrompt(`Create a video based on this story: ${cleanedIdea}`);
    }
  }, [allImagesGenerated, generatedImages, cleanedIdea]);

  const renderStep = () => {
    if (apiError) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
            <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">
              API Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
              {apiError}
            </p>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                setApiError(null);
                setLoading(false);
              }}
            >
              Dismiss Error
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Enter your base idea for a video</Label>
            <Textarea
              placeholder="Enter your base idea here..."
              value={baseIdea}
              onChange={(e) => setBaseIdea(e.target.value)}
              className="min-h-32"
            />
          </div>
          <Button
            className="w-full"
            onClick={generateCleanIdea}
            disabled={!baseIdea.trim() || loading}
          >
            {loading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Generate Story
          </Button>
        </div>
      );
    }

    if (!storyGenerated) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Enter your base idea for a video</Label>
            <Textarea
              placeholder="Enter your base idea here..."
              value={baseIdea}
              onChange={(e) => setBaseIdea(e.target.value)}
              className="min-h-32"
            />
          </div>
          <Button
            className="w-full"
            onClick={generateCleanIdea}
            disabled={!baseIdea.trim() || loading}
          >
            {loading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Generate Story
          </Button>
        </div>
      );
    }

    if (storyGenerated && !storyApproved) {
      return (
        <div className="space-y-4">
          <div>
            <Label>Refined Concept</Label>
            <div className="p-4 rounded-md bg-muted mt-2">
              <p>{cleanedIdea}</p>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStoryGenerated(false)}>
              Go Back
            </Button>
            <Button onClick={generateStory} disabled={loading}>
              {loading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Approve & Generate Storyboard
            </Button>
          </div>
        </div>
      );
    }

    if (storyApproved && !firstImageGenerated) {
      return (
        <div className="space-y-4">
          <div>
            <Label>Storyboard</Label>
            <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto pr-2">
              {storySteps.map((step, index) => (
                <div key={index} className="p-3 rounded-md bg-muted">
                  <p className="font-semibold text-sm">Scene {index + 1}</p>
                  <p className="text-sm">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Image Model</Label>
            <Select
              value={selectedImageModel}
              onValueChange={setSelectedImageModel}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {imageModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Style Description</Label>
            <Textarea
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              placeholder="Enter style parameters to keep consistent..."
              className="min-h-20"
            />
            <p className="text-xs text-muted-foreground">
              This style will be applied to all generated images for consistency (e.g., "cinematic, photorealistic, vibrant colors")
            </p>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStoryApproved(false)}>
              Go Back
            </Button>
            <Button onClick={generateFirstImage} disabled={loading}>
              {loading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Generate First Image
            </Button>
          </div>
        </div>
      );
    }

    if (firstImageGenerated && !imageApproved) {
      return (
        <div className="space-y-4">
          <div>
            <Label>Art Direction</Label>
            {firstImage && (
              <div className="relative w-full h-64 mt-2">
                <img
                  src={firstImage}
                  alt="First image for story"
                  className="object-contain rounded-md w-full h-full"
                />
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={regenerateFirstImage}>
              Regenerate
            </Button>
            <Button onClick={approveImage} disabled={loading}>
              Approve Art Direction
            </Button>
          </div>
        </div>
      );
    }

    if (imageApproved && !allImagesGenerated) {
      return (
        <div className="space-y-4">
          <div>
            <Label>First Image</Label>
            {firstImage && (
              <div className="relative w-full h-64 mt-2">
                <img
                  src={firstImage}
                  alt="First image for story"
                  className="object-contain rounded-md w-full h-full"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Image Model</Label>
            <div className="p-2 rounded-md bg-muted">
              <p className="text-sm">
                {imageModels.find((model) => model.id === selectedImageModel)
                  ?.name || selectedImageModel}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Style Description</Label>
            <Textarea
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              placeholder="Enter style parameters to keep consistent..."
              className="min-h-20"
            />
            <p className="text-xs text-muted-foreground">
              This style will be applied to all generated images for consistency
            </p>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setImageApproved(false)}>
              Go Back
            </Button>
            <Button onClick={generateAllImages} disabled={loading}>
              {loading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  {generatedImages.length > 0
                    ? `Generating (${generatedImages.length}/${storySteps.length})`
                    : "Generating..."}
                </>
              ) : (
                "Generate All Images"
              )}
            </Button>
          </div>

          {/* Show images as they are generated */}
          {generatedImages.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <Label>
                Images Generated So Far ({generatedImages.length}/
                {storySteps.length})
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-[200px] overflow-y-auto">
                {generatedImages.map((image, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={image}
                      alt={`Scene ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <p className="text-xs text-center mt-1">Scene {idx + 1}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (allImagesGenerated && !videoGenerated) {
      return (
        <div className="space-y-4">
          <div>
            <Label>Generated Images</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-2">
              Select which scenes you want to generate videos for:
            </p>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {generatedImages.map((image, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 border border-border rounded-md"
                >
                  <input
                    type="checkbox"
                    id={`use-image-${index}`}
                    checked={imagesToUse[index] ?? true}
                    onChange={(e) => {
                      const newImagesToUse = [...imagesToUse];
                      newImagesToUse[index] = e.target.checked;
                      setImagesToUse(newImagesToUse);
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`use-image-${index}`}
                      className="font-semibold text-sm"
                    >
                      Scene {index + 1}
                    </Label>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {storySteps[index]}
                    </p>
                  </div>
                  <div className="relative h-16 w-16">
                    <img
                      src={image}
                      alt={`Scene ${index + 1}`}
                      className="object-cover rounded-md w-full h-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Image Generator Used</Label>
            <div className="p-2 rounded-md bg-muted">
              <p className="text-sm">
                {imageModels.find((model) => model.id === selectedImageModel)
                  ?.name || selectedImageModel}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Video Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fal-ai/luma-dream-machine">
                  Luma Dream Machine (Image-to-Video)
                </SelectItem>
                <SelectItem value="fal-ai/minimax/video-01-live">
                  Minimax Video (Image-to-Video)
                </SelectItem>
                <SelectItem value="fal-ai/kling-video/v1.5/pro">
                  Kling 1.5 Pro (Image-to-Video)
                </SelectItem>
                <SelectItem value="fal-ai/veo2/image-to-video">
                  Veo 2 Image-to-Video
                </SelectItem>
                <SelectItem value="fal-ai/ltx-video-v095/multiconditioning">
                  LTX Video (Image-to-Video)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All models will use your generated images as reference for creating videos
            </p>
          </div>

          {/* Show duration options when Veo2 is selected */}
          {selectedModel === "fal-ai/veo2/image-to-video" && (
            <div className="space-y-2">
              <Label>Video Duration</Label>
              <Select value={videoDuration} onValueChange={setVideoDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3s">3 seconds</SelectItem>
                  <SelectItem value="5s">5 seconds</SelectItem>
                  <SelectItem value="8s">8 seconds</SelectItem>
                  <SelectItem value="10s">10 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Common Video Prompt (optional)</Label>
            <Textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Enter a common prompt to use for all video generations..."
              className="min-h-20"
            />
            <p className="text-xs text-muted-foreground">
              This prompt will be combined with each scene description. Leave
              empty to use only scene descriptions.
            </p>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setAllImagesGenerated(false)}
            >
              Go Back
            </Button>
            <Button
              onClick={generateVideos}
              disabled={loading || imagesToUse.every((use) => !use)}
            >
              {loading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  {isGeneratingVideos
                    ? `Generating Video ${currentVideoIndex + 1}/${
                        imagesToUse.filter(Boolean).length
                      }`
                    : "Loading..."}
                </>
              ) : (
                "Generate Videos"
              )}
            </Button>
          </div>

          {/* Show videos as they are generated */}
          {generatedVideos.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <Label>Generated Videos ({generatedVideos.length})</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-[300px] overflow-y-auto">
                {generatedVideos.map((videoUrl, idx) => (
                  <div key={idx} className="relative">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full rounded-md h-24 object-cover"
                    />
                    <p className="text-xs text-center mt-1">Scene {idx + 1}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (videoGenerated) {
      return (
        <div className="space-y-4">
          <div>
            <Label>Generated Videos</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-2">
              {generatedVideos.length} videos were added to your gallery
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2">
              {generatedVideos.map((videoUrl, index) => (
                <div key={index} className="relative">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full rounded-md"
                    style={{ maxHeight: "150px" }}
                  />
                  <p className="text-xs text-center mt-1">Scene {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={onClose}>
            Complete
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-4 w-full overflow-y-auto pr-2">
      {renderStep()}
    </div>
  );
}
