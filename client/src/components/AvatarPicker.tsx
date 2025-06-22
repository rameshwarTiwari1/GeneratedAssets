import React, { useState, useEffect } from 'react';
import { createAvatar } from '@dicebear/core';
import { lorelei, funEmoji, bottts, avataaars, bigEars, bigSmile, croodles, micah, miniavs, notionists, rings, shapes, thumbs } from '@dicebear/collection';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Check, Sparkles } from 'lucide-react';

interface AvatarPickerProps {
  selectedAvatar?: string;
  onSelect: (avatarUrl: string) => void;
  className?: string;
}

const avatarStyles = [
  { name: 'Lorelei', style: lorelei, description: 'Elegant & Professional' },
  { name: 'Fun Emoji', style: funEmoji, description: 'Playful & Colorful' },
  { name: 'Bottts', style: bottts, description: 'Robot & Tech' },
  { name: 'Avataaars', style: avataaars, description: 'Cartoon & Friendly' },
  { name: 'Big Ears', style: bigEars, description: 'Cute & Adorable' },
  { name: 'Big Smile', style: bigSmile, description: 'Happy & Cheerful' },
  { name: 'Croodles', style: croodles, description: 'Simple & Clean' },
  { name: 'Micah', style: micah, description: 'Minimal & Modern' },
  { name: 'Mini Avatars', style: miniavs, description: 'Tiny & Compact' },
  { name: 'Notionists', style: notionists, description: 'Creative & Artistic' },
  { name: 'Rings', style: rings, description: 'Geometric & Abstract' },
  { name: 'Shapes', style: shapes, description: 'Geometric & Bold' },
  { name: 'Thumbs', style: thumbs, description: 'Thumbs Up Style' },
];

const AvatarPicker: React.FC<AvatarPickerProps> = ({ selectedAvatar, onSelect, className = '' }) => {
  const [selectedStyle, setSelectedStyle] = useState(0);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateAvatars();
  }, [selectedStyle]);

  const generateAvatars = async () => {
    setIsLoading(true);
    const style = avatarStyles[selectedStyle].style;
    const newAvatars: string[] = [];

    try {
      // Generate 12 unique avatars for the current style
      for (let i = 0; i < 12; i++) {
        const avatar = createAvatar(style as any, {
          seed: `avatar-${selectedStyle}-${i}`,
          size: 80,
          backgroundColor: ['b6e3f4', 'c0aede', 'ffdfbf', 'ffd5dc', 'a8e6cf', 'dcedc1', 'ffd3b6', 'ffaaa5'],
          radius: 50,
        });

        newAvatars.push(await avatar.toDataUri());
      }

      setAvatars(newAvatars);
    } catch (error) {
      console.error('Error generating avatars:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStyleChange = (index: number) => {
    setSelectedStyle(index);
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    onSelect(avatarUrl);
  };

  const generatePreviewAvatar = async (style: any, seed: string) => {
    try {
      const avatar = createAvatar(style as any, {
        seed,
        size: 48,
        backgroundColor: ['b6e3f4'],
        radius: 50,
      });
      return await avatar.toDataUri();
    } catch (error) {
      console.error('Error generating preview avatar:', error);
      return '';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Style Selector */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Choose Avatar Style
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {avatarStyles.map((style, index) => (
            <button
              key={style.name}
              onClick={() => handleStyleChange(index)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                selectedStyle === index
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto">
                  <PreviewAvatar style={style.style} index={index} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{style.name}</p>
                  <p className="text-xs text-gray-500">{style.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Avatar Grid */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Select Your Avatar
        </h3>
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {avatars.map((avatarUrl, index) => (
                  <button
                    key={index}
                    onClick={() => handleAvatarSelect(avatarUrl)}
                    className={`group relative p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
                      selectedAvatar === avatarUrl
                        ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={avatarUrl}
                        alt={`Avatar ${index + 1}`}
                        className="w-16 h-16 rounded-full mx-auto shadow-sm"
                      />
                      {selectedAvatar === avatarUrl && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Avatar Preview */}
      {selectedAvatar && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Your Selected Avatar</h3>
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={selectedAvatar}
                    alt="Selected Avatar"
                    className="w-20 h-20 rounded-full shadow-lg ring-4 ring-white"
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {avatarStyles[selectedStyle].name} Style
                  </p>
                  <p className="text-sm text-gray-600">
                    {avatarStyles[selectedStyle].description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Separate component for preview avatars to handle async loading
const PreviewAvatar: React.FC<{ style: any; index: number }> = ({ style, index }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const avatar = createAvatar(style as any, {
          seed: `preview-${index}`,
          size: 48,
          backgroundColor: ['b6e3f4'],
          radius: 50,
        });
        const url = await avatar.toDataUri();
        setPreviewUrl(url);
      } catch (error) {
        console.error('Error loading preview:', error);
      }
    };
    loadPreview();
  }, [style, index]);

  if (!previewUrl) {
    return <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse" />;
  }

  return (
    <img
      src={previewUrl}
      alt="Preview"
      className="w-full h-full rounded-lg"
    />
  );
};

export default AvatarPicker; 