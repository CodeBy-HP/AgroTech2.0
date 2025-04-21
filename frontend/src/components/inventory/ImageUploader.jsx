'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { FiUpload, FiX, FiCamera } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export default function ImageUploader({ 
  onImagesChange, 
  previewImages = [],
  maxImages = 5
}) {
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState(previewImages || []);
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (previews.length + files.length > maxImages) {
      toast.error(`You can upload a maximum of ${maxImages} images`);
      return;
    }
    
    // Filter and validate files
    const validFiles = files.filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`File "${file.name}" is not a supported image format`);
        return false;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" exceeds the 5MB size limit`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Generate previews and store files
    const newPreviews = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      type: 'new'
    }));
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    
    if (onImagesChange) {
      onImagesChange([...selectedFiles, ...validFiles], [...previews, ...newPreviews]);
    }
    
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };
  
  const removeImage = (index) => {
    // Create a new array without the removed file
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    
    // If it's a 'new' type preview, we need to revoke the object URL
    if (newPreviews[index].type === 'new') {
      URL.revokeObjectURL(newPreviews[index].url);
      newFiles.splice(index, 1);
    }
    
    newPreviews.splice(index, 1);
    
    // Update state
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    
    if (onImagesChange) {
      onImagesChange(newFiles, newPreviews);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* File previews */}
        {previews.map((preview, index) => (
          <div 
            key={index} 
            className="relative w-32 h-32 border rounded-md overflow-hidden group"
          >
            <Image
              src={preview.url}
              alt={`Preview ${index + 1}`}
              fill
              sizes="128px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <FiX size={14} />
            </button>
          </div>
        ))}
        
        {/* Upload button */}
        {previews.length < maxImages && (
          <button
            type="button"
            onClick={triggerFileInput}
            className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:text-gray-500 hover:border-gray-400 transition-colors"
          >
            <FiCamera size={24} className="mb-2" />
            <span className="text-xs text-center px-2">Add inventory image</span>
          </button>
        )}
      </div>
      
      <div className="text-xs text-gray-500">
        <p>Supported formats: JPG, PNG, WEBP (max 5MB)</p>
        <p>Upload clear photos of your inventory/warehouse facility</p>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
} 