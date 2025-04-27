"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import { Upload, Check } from "lucide-react";

interface ProfilePictureModalProps {
  staffId: string;
  currentImage: string;
  onClose: () => void;
}

export function ProfilePictureModal({
  staffId,
  currentImage,
  onClose,
}: ProfilePictureModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name, file.type, file.size);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      console.log("File dropped:", file.name, file.type, file.size);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please drop an image file");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted");

    const formData = new FormData(e.currentTarget);
    const file = formData.get("image") as File;
    const staffIdValue = formData.get("staffId");

    console.log("Form data:", {
      file: file ? { name: file.name, type: file.type, size: file.size } : null,
      staffId: staffIdValue,
    });

    if (!file) {
      toast.error("Please select an image");
      return;
    }

    setIsUploading(true);
    try {
      console.log("Sending request to API...");
      const response = await fetch("/api/staff/upload-profile-picture", {
        method: "POST",
        body: formData,
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error:", errorData);
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      console.log("API success response:", data);

      toast.success("Profile picture updated successfully");
      onClose();
      // Refresh the page to show the new image
      window.location.reload();
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
        <div className="relative">
          <div className="bg-blue-600 p-6 text-white">
            <DialogTitle className="text-xl font-bold">
              Update Profile Picture
            </DialogTitle>
            <DialogDescription className="text-white/80 mt-1">
              Choose a new profile picture to represent you
            </DialogDescription>
          </div>

          <div className="p-6 bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-white"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <div className="relative w-32 h-32 mx-auto">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Image selected</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Drag and drop your image here
                      </p>
                      <p className="text-xs text-gray-500 mt-1">or</p>
                      <Label
                        htmlFor="image"
                        className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      >
                        Browse Files
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG or GIF (max. 5MB)
                    </p>
                  </div>
                )}
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  className="hidden"
                />
                <input type="hidden" name="staffId" value={staffId} />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || !previewUrl}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
